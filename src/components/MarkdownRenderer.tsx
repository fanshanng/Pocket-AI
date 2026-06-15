import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import MarkdownIt from 'markdown-it';
import type MarkdownItToken from 'markdown-it/lib/token.mjs';
import katex from 'katex';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { KATEX_CSS } from '../lib/katexAssets';
import { CodeBlock } from './CodeBlock';

type Props = {
  text: string;
  deferCodeHighlight?: boolean;
  colorScheme?: 'light' | 'dark';
  onHorizontalGestureStart?: () => void;
  onHorizontalGestureEnd?: () => void;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

type CodeBlockData = {
  code: string;
  language: string;
};

type HorizontalScrollableProps = {
  children: ReactNode;
  style?: any;
  contentContainerStyle?: any;
  contentWidth?: number;
  onHorizontalGestureStart?: () => void;
  onHorizontalGestureEnd?: () => void;
};

const markdownIt = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
});

const markdownItWithMath = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
}).use(markdownItMath);

const KATEX_RENDER_CSS = KATEX_CSS.replace(/font-display:block/g, 'font-display:swap');

function mathInlineRule(state: any, silent: boolean): boolean {
  const source = state.src as string;
  const start = state.pos as number;

  if (source.startsWith('\\[', start)) {
    const end = findUnescaped(source, '\\]', start + 2);
    if (end === -1) return false;
    const content = source.slice(start + 2, end).trim();
    if (!content) return false;
    if (!silent) {
      const token = state.push('math_block', 'math', 0);
      token.block = true;
      token.content = content;
    }
    state.pos = end + 2;
    return true;
  }

  if (source.startsWith('\\(', start)) {
    const end = findUnescaped(source, '\\)', start + 2);
    if (end === -1) return false;
    const content = source.slice(start + 2, end).trim();
    if (!content) return false;
    if (!silent) {
      const token = state.push('math_inline', 'math', 0);
      token.content = content;
    }
    state.pos = end + 2;
    return true;
  }

  if (source.startsWith('$$', start)) {
    const end = findUnescaped(source, '$$', start + 2);
    if (end === -1) return false;
    const content = source.slice(start + 2, end).trim();
    if (!content) return false;
    if (!silent) {
      const token = state.push('math_block', 'math', 0);
      token.block = true;
      token.content = content;
    }
    state.pos = end + 2;
    return true;
  }

  if (source[start] !== '$' || source[start + 1] === '$') {
    return false;
  }

  const end = findInlineMathEnd(source, start + 1);
  if (end === -1) return false;

  const content = source.slice(start + 1, end).trim();
  if (!content) return false;

  if (!silent) {
    const token = state.push('math_inline', 'math', 0);
    token.content = content;
  }

  state.pos = end + 1;
  return true;
}

function mathBlockRule(state: any, startLine: number, endLine: number, silent: boolean): boolean {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const firstLine = state.src.slice(start, max);
  const leadingSpace = firstLine.length - firstLine.trimStart().length;
  const trimmed = firstLine.slice(leadingSpace);
  const opener = trimmed.startsWith('$$')
    ? { left: '$$', right: '$$' }
    : trimmed.startsWith('\\[')
      ? { left: '\\[', right: '\\]' }
      : null;

  if (!opener) return false;
  if (silent) return true;

  const firstContent = trimmed.slice(opener.left.length);
  const sameLineEnd = firstContent.indexOf(opener.right);
  let content = '';
  let nextLine = startLine + 1;

  if (sameLineEnd !== -1) {
    content = firstContent.slice(0, sameLineEnd);
  } else {
    content = firstContent;
    for (; nextLine < endLine; nextLine += 1) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      const line = state.src.slice(lineStart, lineMax);
      const closeIndex = line.indexOf(opener.right);

      if (closeIndex !== -1) {
        content += `\n${line.slice(0, closeIndex)}`;
        nextLine += 1;
        break;
      }

      content += `\n${line}`;
    }
  }

  const token = state.push('math_block', 'math', 0);
  token.block = true;
  token.content = content.trim();
  state.line = nextLine;
  return true;
}

function markdownItMath(md: MarkdownIt) {
  md.inline.ruler.before('escape', 'math_inline', mathInlineRule);
  md.block.ruler.before('paragraph', 'math_block', mathBlockRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
}

class MarkdownErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (previousProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function normalizeMarkdownForStreaming(text: string): string {
  let normalized = text
    .replace(/\r\n?/g, '\n')
    .replace(/\\`/g, '`');

  normalized = normalized
    .replace(/\\\\\(/g, '\\(')
    .replace(/\\\\\)/g, '\\)')
    .replace(/\\\\\[/g, '\\[')
    .replace(/\\\\\]/g, '\\]');

  const fenceMatches = normalized.match(/(^|\n)(`{3,}|~{3,})/g);
  if (fenceMatches && fenceMatches.length % 2 === 1) {
    normalized = `${normalized.trimEnd()}\n\`\`\``;
  }

  return normalized;
}

export function extractCodeBlocks(text: string): string[] {
  const normalized = normalizeMarkdownForStreaming(text);
  const blocks: string[] = [];
  const pattern = /(^|\n)(`{3,}|~{3,})[ \t]*([^\n]*)\n([\s\S]*?)\n?\2(?=\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized))) {
    blocks.push(match[4].replace(/\n$/, ''));
  }

  return blocks;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}

function getNodeContent(node: unknown): string {
  const record = node && typeof node === 'object' ? (node as Record<string, unknown>) : {};
  return typeof record.content === 'string' ? record.content : '';
}

function getNodeLanguage(node: unknown): string {
  const record = node && typeof node === 'object' ? (node as Record<string, unknown>) : {};
  const raw =
    typeof record.sourceInfo === 'string'
      ? record.sourceInfo
      : typeof record.info === 'string'
        ? record.info
        : '';
  return raw.trim().split(/\s+/)[0] || '';
}

function getTokenLanguage(token: MarkdownItToken): string {
  return token.info.trim().split(/\s+/)[0] || '';
}

function extractCodeBlocksFromTokens(tokens: MarkdownItToken[]): CodeBlockData[] {
  const blocks: CodeBlockData[] = [];

  function visit(tokenList: MarkdownItToken[]) {
    for (const token of tokenList) {
      if (token.type === 'fence' || token.type === 'code_block') {
        blocks.push({
          code: token.content.replace(/\n$/, ''),
          language: token.type === 'fence' ? getTokenLanguage(token) : '',
        });
      }

      if (token.children) {
        visit(token.children);
      }
    }
  }

  visit(tokens);
  return blocks;
}

function renderCodeBlockFallback(
  block: CodeBlockData,
  index: number,
  colorScheme: 'light' | 'dark'
) {
  return (
    <CodeBlock
      key={`${index}-${block.language}-${block.code.length}`}
      code={block.code}
      language={block.language}
      colorScheme={colorScheme}
    />
  );
}

function PlainTextFallback({
  text,
  colorScheme = 'light',
}: {
  text: string;
  colorScheme?: 'light' | 'dark';
}) {
  const codeBlocks = useMemo(
    () => extractCodeBlocksFromTokens(markdownIt.parse(normalizeMarkdownForStreaming(text), {})),
    [text]
  );
  const dynamicStyles = useMemo(() => createMarkdownStyles(colorScheme), [colorScheme]);

  if (codeBlocks.length > 0) {
    return (
      <View style={dynamicStyles.fallbackWrap}>
        {codeBlocks.map((block, index) => renderCodeBlockFallback(block, index, colorScheme))}
      </View>
    );
  }

  return (
    <Text selectable style={[dynamicStyles.body, dynamicStyles.text]}>
      {text}
    </Text>
  );
}

function isEscaped(value: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function findUnescaped(value: string, needle: string, start: number): number {
  let index = value.indexOf(needle, start);
  while (index !== -1) {
    if (!isEscaped(value, index)) {
      return index;
    }
    index = value.indexOf(needle, index + needle.length);
  }
  return -1;
}

function findInlineMathEnd(value: string, start: number): number {
  let cursor = start;
  while (cursor < value.length) {
    const index = value.indexOf('$', cursor);
    if (index === -1) return -1;
    if (!isEscaped(value, index) && value[index + 1] !== '$') {
      return index;
    }
    cursor = index + 1;
  }
  return -1;
}

function renderMathToHtml(math: string, display: boolean): string {
  try {
    return katex.renderToString(math, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'html',
    });
  } catch {
    return `<span class="katex-error">${escapeHtml(math)}</span>`;
  }
}

function fallbackMathToText(math: string): string {
  return math
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\,/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\quad/g, '  ')
    .replace(/\\qquad/g, '    ')
    .replace(/\\times/g, ' * ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\pm/g, ' +/- ')
    .replace(/\\mp/g, ' -/+ ')
    .replace(/\\leq/g, ' <= ')
    .replace(/\\geq/g, ' >= ')
    .replace(/\\neq/g, ' != ')
    .replace(/\\approx/g, ' ~= ')
    .replace(/\\equiv/g, ' == ')
    .replace(/\\sim/g, ' ~ ')
    .replace(/\\to/g, ' -> ')
    .replace(/\\rightarrow/g, ' -> ')
    .replace(/\\leftarrow/g, ' <- ')
    .replace(/\\infty/g, ' inf ')
    .replace(/\\sum/g, ' sum ')
    .replace(/\\prod/g, ' prod ')
    .replace(/\\int/g, ' int ')
    .replace(/\\partial/g, ' partial ')
    .replace(/\\nabla/g, ' nabla ')
    .replace(/\\alpha/g, ' alpha ')
    .replace(/\\beta/g, ' beta ')
    .replace(/\\gamma/g, ' gamma ')
    .replace(/\\delta/g, ' delta ')
    .replace(/\\epsilon/g, ' epsilon ')
    .replace(/\\theta/g, ' theta ')
    .replace(/\\lambda/g, ' lambda ')
    .replace(/\\mu/g, ' mu ')
    .replace(/\\pi/g, ' pi ')
    .replace(/\\sigma/g, ' sigma ')
    .replace(/\\phi/g, ' phi ')
    .replace(/\\omega/g, ' omega ')
    .replace(/\\Gamma/g, ' Gamma ')
    .replace(/\\Delta/g, ' Delta ')
    .replace(/\\Theta/g, ' Theta ')
    .replace(/\\Lambda/g, ' Lambda ')
    .replace(/\\Pi/g, ' Pi ')
    .replace(/\\Sigma/g, ' Sigma ')
    .replace(/\\Phi/g, ' Phi ')
    .replace(/\\Omega/g, ' Omega ')
    .replace(/\\mathrm\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\text\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\operatorname\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\^\{([^{}]+)\}/g, '^($1)')
    .replace(/_\{([^{}]+)\}/g, '_($1)')
    .replace(/\^([A-Za-z0-9+\-=()])/g, '^$1')
    .replace(/_([A-Za-z0-9+\-=()])/g, '_$1')
    .replace(/[{}]/g, '')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function InlineMathText({
  math,
  colorScheme = 'light',
}: {
  math: string;
  colorScheme?: 'light' | 'dark';
}) {
  const dynamicStyles = useMemo(() => createMarkdownStyles(colorScheme), [colorScheme]);
  const rendered = useMemo(() => fallbackMathToText(math), [math]);

  return (
    <Text selectable style={[dynamicStyles.text, dynamicStyles.inlineMath]}>
      {rendered || math}
    </Text>
  );
}

function buildMathOnlyHtml(math: string, colorScheme: 'light' | 'dark'): string {
  const safeKatexCss = escapeScript(KATEX_RENDER_CSS);
  const dark = colorScheme === 'dark';
  const textColor = dark ? '#E5E7EB' : '#111827';
  const errorBg = dark ? '#3F1D24' : '#FEF2F2';
  const errorColor = dark ? '#FCA5A5' : '#991B1B';
  const rendered = renderMathToHtml(math, true);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
${safeKatexCss}
html, body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: ${textColor};
  overflow: hidden;
  -webkit-text-size-adjust: 100%;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans SC", sans-serif;
}
.math-node {
  display: inline-block;
  min-width: max-content;
  padding: 2px 12px 4px 0;
}
.katex {
  color: ${textColor};
  font-size: 1.08em;
  line-height: 1.24;
}
.katex-display {
  margin: 0;
  text-align: left;
  overflow: hidden;
}
.katex-display > .katex {
  display: inline-block;
  text-align: left;
}
.katex-error {
  color: ${errorColor};
  background: ${errorBg};
  border-radius: 8px;
  padding: 1px 4px;
}
</style>
</head>
<body>
<div class="math-node">${rendered}</div>
<script>
(function () {
  function measure() {
    var body = document.body;
    var root = document.querySelector('.math-node');
    var width = Math.max(
      root ? Math.ceil(root.scrollWidth || root.getBoundingClientRect().width) : 0,
      body ? Math.ceil(body.scrollWidth) : 0
    );
    var height = Math.max(
      root ? Math.ceil(root.scrollHeight || root.getBoundingClientRect().height) : 0,
      body ? Math.ceil(body.scrollHeight) : 0
    );
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'size', width: width, height: height }));
    }
  }
  window.addEventListener('load', measure);
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(measure);
  }
  setTimeout(measure, 0);
  setTimeout(measure, 80);
  setTimeout(measure, 240);
})();
</script>
</body>
</html>`;
}

function HorizontalScrollable({
  children,
  style,
  contentContainerStyle,
  onHorizontalGestureStart,
  onHorizontalGestureEnd,
}: HorizontalScrollableProps) {
  const lockedRef = useRef(false);

  const beginLock = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    onHorizontalGestureStart?.();
  }, [onHorizontalGestureStart]);

  const endLock = useCallback(() => {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    onHorizontalGestureEnd?.();
  }, [onHorizontalGestureEnd]);

  useEffect(() => () => endLock(), [endLock]);

  return (
    <NativeViewGestureHandler>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        alwaysBounceVertical={false}
        showsHorizontalScrollIndicator
        style={[style, localStyles.scrollViewport]}
        contentContainerStyle={[contentContainerStyle, localStyles.scrollContent]}
        onTouchEnd={endLock}
        onTouchCancel={endLock}
        onScrollBeginDrag={beginLock}
        onMomentumScrollBegin={beginLock}
        onScrollEndDrag={endLock}
        onMomentumScrollEnd={endLock}
      >
        {children}
      </ScrollView>
    </NativeViewGestureHandler>
  );
}

function EagerHorizontalScrollable({
  children,
  style,
  contentContainerStyle,
  contentWidth,
  onHorizontalGestureStart,
  onHorizontalGestureEnd,
}: HorizontalScrollableProps) {
  const lockedRef = useRef(false);
  const forcedContentWidth =
    typeof contentWidth === 'number' && Number.isFinite(contentWidth)
      ? Math.max(1, Math.ceil(contentWidth))
      : undefined;

  const beginLock = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    onHorizontalGestureStart?.();
  }, [onHorizontalGestureStart]);

  const endLock = useCallback(() => {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    onHorizontalGestureEnd?.();
  }, [onHorizontalGestureEnd]);

  useEffect(() => () => endLock(), [endLock]);

  return (
    <NativeViewGestureHandler disallowInterruption shouldActivateOnStart>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        alwaysBounceVertical={false}
        showsHorizontalScrollIndicator
        style={[style, localStyles.scrollViewport]}
        contentContainerStyle={[
          contentContainerStyle,
          localStyles.eagerScrollContent,
          forcedContentWidth
            ? { width: forcedContentWidth, minWidth: forcedContentWidth }
            : undefined,
        ]}
        onTouchStart={beginLock}
        onTouchEnd={endLock}
        onTouchCancel={endLock}
        onScrollBeginDrag={beginLock}
        onMomentumScrollBegin={beginLock}
        onScrollEndDrag={endLock}
        onMomentumScrollEnd={endLock}
      >
        {children}
      </ScrollView>
    </NativeViewGestureHandler>
  );
}

function BlockMathView({
  math,
  colorScheme = 'light',
  onHorizontalGestureStart,
  onHorizontalGestureEnd,
}: {
  math: string;
  colorScheme?: 'light' | 'dark';
  onHorizontalGestureStart?: () => void;
  onHorizontalGestureEnd?: () => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const dynamicStyles = useMemo(() => createMarkdownStyles(colorScheme), [colorScheme]);
  const html = useMemo(() => buildMathOnlyHtml(math, colorScheme), [colorScheme, math]);
  const [contentSize, setContentSize] = useState({ width: 24, height: 30 });
  const minScrollableWidth = Math.max(24, Math.round(windowWidth * 1.35));
  const resolvedWidth = Math.max(contentSize.width, minScrollableWidth);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        width?: number;
        height?: number;
      };

      if (
        payload.type === 'size' &&
        typeof payload.width === 'number' &&
        Number.isFinite(payload.width) &&
        typeof payload.height === 'number' &&
        Number.isFinite(payload.height)
      ) {
        setContentSize({
          width: Math.max(24, Math.ceil(payload.width)),
          height: Math.max(24, Math.ceil(payload.height)),
        });
      }
    } catch {
      // Ignore malformed messages.
    }
  }

  return (
    <EagerHorizontalScrollable
      style={dynamicStyles.mathBlockWrap}
      contentContainerStyle={dynamicStyles.mathBlockScrollContent}
      contentWidth={resolvedWidth}
      onHorizontalGestureStart={onHorizontalGestureStart}
      onHorizontalGestureEnd={onHorizontalGestureEnd}
    >
      <View
        collapsable={false}
        style={[
          dynamicStyles.mathBlockInner,
          { width: resolvedWidth, minWidth: resolvedWidth, minHeight: contentSize.height },
        ]}
      >
        <WebView
          pointerEvents="none"
          originWhitelist={['*']}
          source={{ html }}
          style={{
            width: resolvedWidth,
            minWidth: resolvedWidth,
            height: contentSize.height,
            backgroundColor: 'transparent',
          }}
          scrollEnabled={false}
          nestedScrollEnabled
          javaScriptEnabled
          domStorageEnabled={false}
          cacheEnabled={false}
          setSupportMultipleWindows={false}
          automaticallyAdjustContentInsets={false}
          androidLayerType="none"
          onMessage={handleMessage}
        />
      </View>
    </EagerHorizontalScrollable>
  );
}

function MarkdownBody({
  text,
  deferCodeHighlight = false,
  colorScheme = 'light',
  onHorizontalGestureStart,
  onHorizontalGestureEnd,
}: Props) {
  const normalized = useMemo(() => normalizeMarkdownForStreaming(text), [text]);
  const dynamicStyles = useMemo(() => createMarkdownStyles(colorScheme), [colorScheme]);

  return (
    <Markdown
      mergeStyle
      rules={{
        code_block: (node) => (
          <CodeBlock
            key={node.key}
            code={getNodeContent(node)}
            language={getNodeLanguage(node)}
            deferHighlight={deferCodeHighlight}
            colorScheme={colorScheme}
            onHorizontalGestureStart={onHorizontalGestureStart}
            onHorizontalGestureEnd={onHorizontalGestureEnd}
          />
        ),
        fence: (node) => (
          <CodeBlock
            key={node.key}
            code={getNodeContent(node)}
            language={getNodeLanguage(node)}
            deferHighlight={deferCodeHighlight}
            colorScheme={colorScheme}
            onHorizontalGestureStart={onHorizontalGestureStart}
            onHorizontalGestureEnd={onHorizontalGestureEnd}
          />
        ),
        table: (node, children) => (
          <HorizontalScrollable
            key={node.key}
            style={dynamicStyles.tableWrap}
            contentContainerStyle={dynamicStyles.tableScrollContent}
            onHorizontalGestureStart={onHorizontalGestureStart}
            onHorizontalGestureEnd={onHorizontalGestureEnd}
          >
            <View style={dynamicStyles.table}>{children}</View>
          </HorizontalScrollable>
        ),
        math_inline: (node) => (
          <InlineMathText
            key={node.key}
            math={getNodeContent(node)}
            colorScheme={colorScheme}
          />
        ),
        math_block: (node) => (
          <BlockMathView
            key={node.key}
            math={getNodeContent(node)}
            colorScheme={colorScheme}
            onHorizontalGestureStart={onHorizontalGestureStart}
            onHorizontalGestureEnd={onHorizontalGestureEnd}
          />
        ),
      }}
      onLinkPress={(url) => {
        void Linking.openURL(url);
        return false;
      }}
      markdownit={markdownItWithMath}
      style={dynamicStyles}
    >
      {normalized}
    </Markdown>
  );
}

function MarkdownRendererComponent({
  text,
  deferCodeHighlight = false,
  colorScheme = 'light',
  onHorizontalGestureStart,
  onHorizontalGestureEnd,
}: Props) {
  return (
    <MarkdownErrorBoundary
      fallback={
        <PlainTextFallback
          text={text}
          colorScheme={colorScheme}
        />
      }
    >
      <MarkdownBody
        text={text}
        deferCodeHighlight={deferCodeHighlight}
        colorScheme={colorScheme}
        onHorizontalGestureStart={onHorizontalGestureStart}
        onHorizontalGestureEnd={onHorizontalGestureEnd}
      />
    </MarkdownErrorBoundary>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererComponent);

const localStyles = StyleSheet.create({
  scrollViewport: {
    overflow: 'hidden',
  },
  scrollContent: {
    alignSelf: 'flex-start',
    flexGrow: 0,
  },
  eagerScrollContent: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    flexGrow: 0,
  },
});

function createMarkdownStyles(colorScheme: 'light' | 'dark' = 'light') {
  const dark = colorScheme === 'dark';
  const text = dark ? '#E5E7EB' : '#111827';
  const heading = dark ? '#F8FAFC' : '#111827';
  const muted = dark ? '#CBD5E1' : '#334155';
  const faint = dark ? '#94A3B8' : '#94A3B8';
  const link = dark ? '#60A5FA' : '#2563EB';
  const quoteBg = dark ? '#172554' : '#EFF6FF';
  const inlineCodeBg = dark ? '#1F2937' : '#F1F5F9';
  const inlineCodeText = dark ? '#FDE68A' : '#7C2D12';
  const border = dark ? '#334155' : '#CBD5E1';
  const rowBorder = dark ? '#334155' : '#E2E8F0';
  const tableHead = dark ? '#1F2937' : '#F1F5F9';

  return StyleSheet.create({
    body: {
      color: text,
      fontSize: 15,
      lineHeight: 22,
    },
    fallbackWrap: {
      width: '100%',
      alignSelf: 'stretch',
    },
    paragraph: {
      color: text,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 0,
      marginBottom: 10,
    },
    heading1: {
      color: heading,
      fontSize: 24,
      fontWeight: '800',
      marginTop: 4,
      marginBottom: 10,
    },
    heading2: {
      color: heading,
      fontSize: 21,
      fontWeight: '800',
      marginTop: 4,
      marginBottom: 10,
    },
    heading3: {
      color: heading,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 3,
      marginBottom: 8,
    },
    heading4: {
      color: heading,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 3,
      marginBottom: 8,
    },
    heading5: {
      color: heading,
      fontSize: 15,
      fontWeight: '800',
      marginTop: 2,
      marginBottom: 6,
    },
    heading6: {
      color: muted,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
      marginBottom: 6,
    },
    strong: {
      color: heading,
      fontWeight: '800',
    },
    em: {
      color: muted,
      fontStyle: 'italic',
    },
    s: {
      color: faint,
      textDecorationLine: 'line-through',
    },
    bullet_list: {
      marginTop: 0,
      marginBottom: 10,
    },
    ordered_list: {
      marginTop: 0,
      marginBottom: 10,
    },
    list_item: {
      marginBottom: 6,
    },
    bullet_list_icon: {
      color: link,
    },
    bullet_list_content: {
      color: text,
      fontSize: 15,
      lineHeight: 22,
    },
    ordered_list_icon: {
      color: link,
    },
    ordered_list_content: {
      color: text,
      fontSize: 15,
      lineHeight: 22,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: '#60A5FA',
      backgroundColor: quoteBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      marginTop: 4,
      marginBottom: 10,
    },
    hr: {
      backgroundColor: border,
      height: 1,
      marginTop: 10,
      marginBottom: 14,
    },
    link: {
      color: link,
      textDecorationLine: 'underline',
    },
    code_inline: {
      color: inlineCodeText,
      backgroundColor: inlineCodeBg,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    tableWrap: {
      maxWidth: '100%',
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      overflow: 'hidden',
    },
    tableScrollContent: {
      minWidth: '100%',
      flexGrow: 1,
    },
    table: {
      minWidth: 320,
      alignSelf: 'flex-start',
    },
    thead: {
      backgroundColor: tableHead,
    },
    tbody: {},
    th: {
      minWidth: 88,
      flexShrink: 0,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: border,
      justifyContent: 'center',
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: rowBorder,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    td: {
      minWidth: 88,
      flexShrink: 0,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRightWidth: 1,
      borderColor: rowBorder,
      justifyContent: 'center',
    },
    text: {
      color: text,
      fontSize: 15,
      lineHeight: 22,
    },
    textgroup: {
      color: text,
      fontSize: 15,
      lineHeight: 22,
    },
    inlineMath: {
      color: text,
      fontSize: 15,
      lineHeight: 22,
    },
    code_block: {
      color: '#E5E7EB',
      backgroundColor: '#0B1220',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    fence: {
      color: '#E5E7EB',
      backgroundColor: '#0B1220',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    mathBlockWrap: {
      width: '100%',
      marginBottom: 12,
    },
    mathBlockScrollContent: {
      minWidth: '100%',
      flexGrow: 1,
    },
    mathBlockInner: {
      paddingVertical: 2,
      paddingRight: 12,
      alignSelf: 'flex-start',
    },
  });
}

export const markdownStyles = createMarkdownStyles('light');
