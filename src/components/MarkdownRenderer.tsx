import { Component, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { CodeBlock } from './CodeBlock';

type Props = {
  text: string;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

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

function PlainTextFallback({ text }: { text: string }) {
  return (
    <Text selectable style={markdownStyles.body}>
      {text}
    </Text>
  );
}

function MarkdownBody({ text }: Props) {
  const normalized = normalizeMarkdownForStreaming(text);

  return (
    <Markdown
      mergeStyle
      rules={{
        code_block: (node) => (
          <CodeBlock key={node.key} code={getNodeContent(node)} language={getNodeLanguage(node)} />
        ),
        fence: (node) => (
          <CodeBlock key={node.key} code={getNodeContent(node)} language={getNodeLanguage(node)} />
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
      style={markdownStyles}
    >
      {normalized}
    </Markdown>
  );
}

export function MarkdownRenderer({ text }: Props) {
  return (
    <MarkdownErrorBoundary fallback={<PlainTextFallback text={text} />}>
      <MarkdownBody text={text} />
    </MarkdownErrorBoundary>
  );
}

export const markdownStyles = StyleSheet.create({
  body: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 0,
    marginBottom: 10,
  },
  heading1: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 10,
  },
  heading2: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 10,
  },
  heading3: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
    marginBottom: 8,
  },
  heading4: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
    marginBottom: 8,
  },
  heading5: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 6,
  },
  heading6: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 6,
  },
  strong: {
    color: '#0F172A',
    fontWeight: '800',
  },
  em: {
    color: '#334155',
    fontStyle: 'italic',
  },
  s: {
    color: '#94A3B8',
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
    color: '#2563EB',
  },
  bullet_list_content: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  ordered_list_icon: {
    color: '#2563EB',
  },
  ordered_list_content: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  hr: {
    backgroundColor: '#CBD5E1',
    height: 1,
    marginTop: 10,
    marginBottom: 14,
  },
  link: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  code_inline: {
    color: '#7C2D12',
    backgroundColor: '#F1F5F9',
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
    borderColor: '#CBD5E1',
  },
  table: {
    minWidth: 260,
  },
  thead: {
    backgroundColor: '#F1F5F9',
  },
  th: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
  },
  td: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  text: {
    color: '#111827',
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
});
