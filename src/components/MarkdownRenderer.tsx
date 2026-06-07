import { Component, memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import MarkdownIt from 'markdown-it';
import type MarkdownItToken from 'markdown-it/lib/token.mjs';
import katex from 'katex';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

import { KATEX_CSS } from '../lib/katexAssets';
import { CodeBlock } from './CodeBlock';

type Props = {
  text: string;
  deferCodeHighlight?: boolean;
  colorScheme?: 'light' | 'dark';
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

type Segment =
  | { kind: 'markdown'; content: string }
  | { kind: 'math'; content: string; display: boolean; raw: string };

const markdownIt = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
});

const CHAT_BACKGROUND = 'transparent';
const KATEX_RENDER_CSS = KATEX_CSS.replace(/font-display:block/g, 'font-display:swap');

function mathInlineRule(state: any, silent: boolean): boolean {
  const source = state.src as string;
  const start = state.pos as number;

  if (source.startsWith('\\(', start)) {
    const end = findUnescaped(source, '\\)', start + 2);
    if (end === -1) return false;
    if (!silent) {
      const token = state.push('math_inline', 'math', 0);
      token.content = source.slice(start + 2, end).trim();
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
  const opener = firstLine.slice(leadingSpace).startsWith('$$')
    ? { left: '$$', right: '$$' }
    : firstLine.slice(leadingSpace).startsWith('\\[')
      ? { left: '\\[', right: '\\]' }
      : null;

  if (!opener) return false;
  if (silent) return true;

  const firstContent = firstLine.slice(leadingSpace + opener.left.length);
  const sameLineEnd = firstContent.indexOf(opener.right);
  let content = '';
  let nextLine = startLine + 1;

  if (sameLineEnd !== -1) {
    content = firstContent.slice(0, sameLineEnd);
  } else {
    content = firstContent;
    for (; nextLine < endLine; nextLine++) {
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
  md.renderer.rules.math_inline = (tokens, index) => renderMathToHtml(tokens[index].content, false);
  md.renderer.rules.math_block = (tokens, index) => {
    const rendered = renderMathToHtml(tokens[index].content, true);
    return `<div class="math-display">${rendered}</div>\n`;
  };
}

const htmlMarkdownIt = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
}).use(markdownItMath);

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
    .replace(/\\`/g, '`')
    .replace(/[｀´]/g, '`');

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

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function getNodeContent(node: unknown): string {
  const record = node && typeof node === 'object' ? node as Record<string, unknown> : {};
  return typeof record.content === 'string' ? record.content : '';
}

function getNodeLanguage(node: unknown): string {
  const record = node && typeof node === 'object' ? node as Record<string, unknown> : {};
  const raw = typeof record.sourceInfo === 'string'
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
  const codeBlocks = useMemo(() => extractCodeBlocksFromTokens(markdownIt.parse(normalizeMarkdownForStreaming(text), {})), [text]);
  const dynamicStyles = useMemo(() => createMarkdownStyles(colorScheme), [colorScheme]);

  if (codeBlocks.length > 0) {
    return (
      <View style={markdownStyles.fallbackWrap}>
        {codeBlocks.map((block, index) => renderCodeBlockFallback(block, index, colorScheme))}
      </View>
    );
  }

  return (
    <Text selectable style={[markdownStyles.body, dynamicStyles.body]}>
      {text}
    </Text>
  );
}

function isEscaped(value: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor--) {
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

function pushMarkdownSegment(segments: Segment[], content: string) {
  if (!content) return;

  const previous = segments[segments.length - 1];
  if (previous?.kind === 'markdown') {
    previous.content += content;
    return;
  }

  segments.push({ kind: 'markdown', content });
}

function extractMathSegmentsFromText(value: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const nextDollarDisplay = findUnescaped(value, '$$', cursor);
    const nextBracketDisplay = findUnescaped(value, '\\[', cursor);
    const nextParenInline = findUnescaped(value, '\\(', cursor);
    const nextDollarInline = findUnescaped(value, '$', cursor);

    const candidates = [
      { index: nextDollarDisplay, left: '$$', right: '$$', display: true },
      { index: nextBracketDisplay, left: '\\[', right: '\\]', display: true },
      { index: nextParenInline, left: '\\(', right: '\\)', display: false },
      {
        index: nextDollarInline !== nextDollarDisplay ? nextDollarInline : -1,
        left: '$',
        right: '$',
        display: false,
      },
    ].filter((candidate) => candidate.index >= 0)
      .sort((first, second) => first.index - second.index || second.left.length - first.left.length);

    const next = candidates[0];
    if (!next) {
      pushMarkdownSegment(segments, value.slice(cursor));
      break;
    }

    pushMarkdownSegment(segments, value.slice(cursor, next.index));

    const contentStart = next.index + next.left.length;
    const end = next.left === '$'
      ? findInlineMathEnd(value, contentStart)
      : findUnescaped(value, next.right, contentStart);

    if (end === -1) {
      pushMarkdownSegment(segments, value.slice(next.index, contentStart));
      cursor = contentStart;
      continue;
    }

    const content = value.slice(contentStart, end);
    const raw = value.slice(next.index, end + next.right.length);

    if (content.trim()) {
      segments.push({
        kind: 'math',
        content: content.trim(),
        display: next.display,
        raw,
      });
    } else {
      pushMarkdownSegment(segments, raw);
    }

    cursor = end + next.right.length;
  }

  return segments;
}

function splitMarkdownAroundCode(text: string): Segment[] {
  const normalized = normalizeMarkdownForStreaming(text);
  const segments: Segment[] = [];
  const fencePattern = /(^|\n)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n?\2(?=\n|$)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = fencePattern.exec(normalized))) {
    const fenceStart = match.index + match[1].length;
    const beforeFence = normalized.slice(cursor, fenceStart);
    for (const segment of extractMathSegmentsFromText(beforeFence)) {
      segments.push(segment);
    }

    pushMarkdownSegment(segments, normalized.slice(fenceStart, fencePattern.lastIndex));
    cursor = fencePattern.lastIndex;
  }

  for (const segment of extractMathSegmentsFromText(normalized.slice(cursor))) {
    segments.push(segment);
  }

  return segments.filter((segment) => segment.kind === 'math' || segment.content.trim().length > 0);
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

function buildMarkdownHtml(markdown: string, colorScheme: 'light' | 'dark'): string {
  const rendered = htmlMarkdownIt.render(normalizeMarkdownForStreaming(markdown));
  const safeKatexCss = escapeScript(KATEX_RENDER_CSS);
  const dark = colorScheme === 'dark';
  const textColor = dark ? '#E5E7EB' : '#111827';
  const headingColor = dark ? '#F8FAFC' : '#111827';
  const mutedColor = dark ? '#CBD5E1' : '#334155';
  const linkColor = dark ? '#60A5FA' : '#2563eb';
  const quoteBg = dark ? '#172554' : '#eff6ff';
  const inlineCodeBg = dark ? '#1F2937' : '#f1f5f9';
  const inlineCodeColor = dark ? '#FDE68A' : '#7c2d12';
  const borderColor = dark ? '#334155' : '#cbd5e1';
  const tableBorder = dark ? '#334155' : '#e2e8f0';
  const tableHead = dark ? '#1F2937' : '#f1f5f9';
  const errorBg = dark ? '#3F1D24' : '#fef2f2';
  const errorColor = dark ? '#FCA5A5' : '#991b1b';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
${safeKatexCss}
* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  padding: 0;
  background: ${CHAT_BACKGROUND};
  color: ${textColor};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans SC", sans-serif;
  font-size: 15px;
  line-height: 1.48;
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
}
body {
  width: 100%;
  min-width: 0;
}
.markdown-html-root {
  width: 100%;
  min-width: 0;
  color: ${textColor};
  overflow-wrap: anywhere;
  word-break: break-word;
  backface-visibility: hidden;
  transform: translateZ(0);
}
p {
  margin: 0 0 10px;
}
p:last-child,
ul:last-child,
ol:last-child,
pre:last-child,
blockquote:last-child,
table:last-child,
.math-display:last-child {
  margin-bottom: 0;
}
h1,
h2,
h3,
h4,
h5,
h6 {
  color: ${headingColor};
  font-weight: 800;
  line-height: 1.22;
  margin: 4px 0 10px;
}
h1 { font-size: 24px; }
h2 { font-size: 21px; }
h3 { font-size: 18px; }
h4 { font-size: 16px; }
h5 { font-size: 15px; }
h6 {
  color: ${mutedColor};
  font-size: 14px;
}
a {
  color: ${linkColor};
  text-decoration: underline;
}
strong {
  color: ${headingColor};
  font-weight: 800;
}
em {
  color: ${mutedColor};
}
s {
  color: ${mutedColor};
}
ul,
ol {
  margin: 0 0 10px;
  padding-left: 22px;
}
li {
  margin: 0 0 6px;
}
li::marker {
  color: ${linkColor};
}
blockquote {
  margin: 4px 0 10px;
  padding: 8px 12px;
  border-left: 3px solid #60a5fa;
  border-radius: 14px;
  background: ${quoteBg};
}
hr {
  height: 1px;
  border: 0;
  background: ${borderColor};
  margin: 10px 0 14px;
}
table {
  display: block;
  width: max-content;
  max-width: 100%;
  margin: 0 0 12px;
  overflow-x: auto;
  border-collapse: collapse;
  border: 1px solid ${borderColor};
  border-radius: 12px;
}
thead {
  background: ${tableHead};
}
th,
td {
  padding: 8px 10px;
  border-right: 1px solid ${tableBorder};
  border-bottom: 1px solid ${tableBorder};
  text-align: left;
  vertical-align: top;
}
th {
  border-color: ${borderColor};
}
code {
  font-family: "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
}
:not(pre) > code {
  color: ${inlineCodeColor};
  background: ${inlineCodeBg};
  border-radius: 8px;
  padding: 2px 6px;
}
pre {
  margin: 0 0 12px;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 14px;
  background: #0b1220;
  color: #e5e7eb;
  border: 1px solid #1e293b;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
}
pre > code {
  display: block;
  width: max-content;
  min-width: 100%;
  padding: 14px;
  color: inherit;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
  font-size: 13px;
  line-height: 1.5;
}
.math-display {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 10px 0 13px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 0 4px;
  text-align: center;
}
.katex {
  color: ${textColor};
  font-size: 1.08em;
  line-height: 1.24;
}
.katex-display {
  margin: 0;
}
.math-display > .katex-display > .katex {
  display: inline-block;
  max-width: 100%;
  text-align: initial;
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
<main class="markdown-html-root">${rendered}</main>
<script>
(function () {
  var readyPosted = false;
  var requestFrame = window.requestAnimationFrame || function (callback) {
    return setTimeout(callback, 16);
  };

  function measureHeight() {
    var root = document.querySelector('.markdown-html-root');
    var body = document.body;
    var documentElement = document.documentElement;
    return Math.max(
      root ? Math.ceil(root.getBoundingClientRect().height) : 0,
      body ? body.scrollHeight : 0,
      documentElement ? documentElement.scrollHeight : 0
    );
  }

  function post(type) {
    var height = measureHeight();
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, height: height }));
  }

  function postHeight() {
    post('height');
  }

  function nudgePaint() {
    var root = document.querySelector('.markdown-html-root');
    if (!root) {
      return;
    }
    root.style.webkitTransform = 'translateZ(0)';
    root.style.transform = 'translateZ(0)';
    root.style.opacity = '0.999';
    setTimeout(function () {
      root.style.opacity = '1';
    }, 32);
  }

  function postReady() {
    nudgePaint();
    if (!readyPosted) {
      readyPosted = true;
      post('ready');
      return;
    }
    postHeight();
  }

  function queueReady() {
    postHeight();
    requestFrame(function () {
      requestFrame(postReady);
    });
  }

  function openExternal(url) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'link', url: url }));
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }
    if (!target || !target.href) {
      return;
    }
    event.preventDefault();
    openExternal(target.href);
  });

  window.addEventListener('load', queueReady);
  window.addEventListener('resize', postHeight);
  if (window.ResizeObserver) {
    new ResizeObserver(postHeight).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queueReady).catch(queueReady);
  }
  setTimeout(postHeight, 0);
  setTimeout(queueReady, 80);
  setTimeout(queueReady, 240);
  setTimeout(queueReady, 700);
})();
</script>
</body>
</html>`;
}

function HtmlMarkdownView({ text, fallback, colorScheme = 'light' }: { text: string; fallback: ReactNode; colorScheme?: 'light' | 'dark' }) {
  const html = useMemo(() => buildMarkdownHtml(text, colorScheme), [colorScheme, text]);
  const htmlKey = useMemo(() => `markdown-html-${colorScheme}-${hashString(text)}`, [colorScheme, text]);
  const [height, setHeight] = useState(32);
  const [failed, setFailed] = useState(false);
  const [paintReady, setPaintReady] = useState(false);
  const ready = paintReady && height > 0;

  useEffect(() => {
    setFailed(false);
    setPaintReady(false);
    setHeight(32);
  }, [html]);

  useEffect(() => {
    if (ready || failed) return undefined;
    const timer = setTimeout(() => setFailed(true), 2200);
    return () => clearTimeout(timer);
  }, [failed, ready]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as { type?: string; height?: number; url?: string };
      if (
        (payload.type === 'height' || payload.type === 'ready') &&
        typeof payload.height === 'number' &&
        Number.isFinite(payload.height)
      ) {
        setHeight(Math.max(1, Math.ceil(payload.height)));
        if (payload.type === 'ready') {
          setPaintReady(true);
        }
      } else if (payload.type === 'link' && typeof payload.url === 'string') {
        void Linking.openURL(payload.url);
      }
    } catch {
      // Ignore malformed WebView messages.
    }
  }

  function shouldStartLoadWithRequest(request: WebViewNavigation) {
    if (!request.url || request.url === 'about:blank' || request.url.startsWith('data:')) {
      return true;
    }

    void Linking.openURL(request.url);
    return false;
  }

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <View style={[markdownStyles.htmlWrap, ready && { height }]}>
      {!ready && <View style={markdownStyles.htmlFallbackWrap}>{fallback}</View>}
      <WebView
        key={htmlKey}
        originWhitelist={['*']}
        source={{ html }}
        style={[markdownStyles.htmlWebView, !ready && markdownStyles.htmlWebViewPreload]}
        containerStyle={markdownStyles.htmlWebViewContainer}
        pointerEvents={ready ? 'auto' : 'none'}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled
        domStorageEnabled={false}
        cacheEnabled={false}
        setSupportMultipleWindows={false}
        automaticallyAdjustContentInsets={false}
        androidLayerType="none"
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
      />
    </View>
  );
}

function MarkdownBody({
  text,
  deferCodeHighlight = false,
  colorScheme = 'light',
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
          />
        ),
        fence: (node) => (
          <CodeBlock
            key={node.key}
            code={getNodeContent(node)}
            language={getNodeLanguage(node)}
            deferHighlight={deferCodeHighlight}
            colorScheme={colorScheme}
          />
        ),
        table: (node, children) => (
          <ScrollView key={node.key} horizontal showsHorizontalScrollIndicator={false} style={markdownStyles.tableWrap}>
            <View style={markdownStyles.table}>{children}</View>
          </ScrollView>
        ),
      }}
      onLinkPress={(url) => {
        void Linking.openURL(url);
        return false;
      }}
      style={dynamicStyles}
    >
      {normalized}
    </Markdown>
  );
}

function containsMath(text: string): boolean {
  return splitMarkdownAroundCode(text).some((segment) => segment.kind === 'math');
}

function SegmentedMarkdownBody({
  text,
  deferCodeHighlight,
  colorScheme = 'light',
}: Props) {
  const hasMath = useMemo(() => !deferCodeHighlight && containsMath(text), [deferCodeHighlight, text]);
  const fallback = useMemo(
    () => (
      <MarkdownBody
        text={text}
        deferCodeHighlight={deferCodeHighlight}
        colorScheme={colorScheme}
      />
    ),
    [colorScheme, deferCodeHighlight, text]
  );

  if (!hasMath) {
    return (
      <MarkdownBody
        text={text}
        deferCodeHighlight={deferCodeHighlight}
        colorScheme={colorScheme}
      />
    );
  }

  return <HtmlMarkdownView text={text} fallback={fallback} colorScheme={colorScheme} />;
}

function MarkdownRendererComponent({
  text,
  deferCodeHighlight = false,
  colorScheme = 'light',
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
      <SegmentedMarkdownBody
        text={text}
        deferCodeHighlight={deferCodeHighlight}
        colorScheme={colorScheme}
      />
    </MarkdownErrorBoundary>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererComponent);

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
    fontFamily: 'monospace',
  },
  tableWrap: {
    maxWidth: '100%',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: border,
  },
  table: {
    minWidth: 260,
  },
  thead: {
    backgroundColor: tableHead,
  },
  th: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: border,
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: rowBorder,
    flexDirection: 'row',
  },
  td: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderColor: rowBorder,
  },
  text: {
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
  htmlWrap: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 1,
    backgroundColor: CHAT_BACKGROUND,
    overflow: 'hidden',
  },
  htmlWebView: {
    flex: 1,
    width: '100%',
    backgroundColor: CHAT_BACKGROUND,
  },
  htmlWebViewPreload: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.02,
  },
  htmlFallbackWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  htmlWebViewContainer: {
    backgroundColor: CHAT_BACKGROUND,
  },
  });
}

export const markdownStyles = createMarkdownStyles('light');
