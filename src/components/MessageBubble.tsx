import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { applyContentPlugins } from '../plugins';
import type { AttachmentRecord, ChatMessage, UiLanguage } from '../types';

type Props = {
  message: ChatMessage;
  language: UiLanguage;
};

type RichTextSegment =
  | { kind: 'markdown'; text: string }
  | { kind: 'formula'; text: string };

function AttachmentPreview({ attachment, language }: { attachment: AttachmentRecord; language: UiLanguage }) {
  if (attachment.kind === 'image') {
    return (
      <Image
        source={{ uri: attachment.uri }}
        style={styles.image}
      />
    );
  }

  return (
    <Pressable
      style={styles.fileChip}
      onPress={() => {
        void Linking.openURL(attachment.uri);
      }}
    >
      <Text style={styles.fileChipLabel}>{language === 'zh' ? '文件' : 'FILE'}</Text>
      <Text style={styles.fileName} numberOfLines={1}>
        {attachment.name}
      </Text>
    </Pressable>
  );
}

function looksLikeSensitiveLine(line: string): boolean {
  return /\b(password|passwd|pwd|api[-_\s]?key|secret|token|bearer|authorization|access[-_\s]?key|private[-_\s]?key)\b\s*[:=]/i.test(
    line
  );
}

function looksLikeCredentialValue(line: string): boolean {
  const compact = line.trim();
  return (
    /^sk-[A-Za-z0-9_-]{16,}$/.test(compact) ||
    /^Bearer\s+[A-Za-z0-9._~+/=-]{20,}$/i.test(compact) ||
    /^[A-Za-z0-9._~+/=-]{32,}$/.test(compact)
  );
}

function shouldUseTechnicalTextBlock(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes('\n\n')) {
    return false;
  }

  const lines = trimmed.split('\n');
  if (lines.some((line) => looksLikeSensitiveLine(line) || looksLikeCredentialValue(line))) {
    return true;
  }

  if (lines.length <= 4 && lines.some((line) => /^(curl|adb|npm|npx|yarn|pnpm|git|cd|set |export |\$env:)/i.test(line.trim()))) {
    return true;
  }

  return lines.length <= 3 && /\b[A-Z0-9_]{3,}=|https?:\/\/|[A-Za-z]:\\|\/[\w.-]+\/[\w./-]+/.test(trimmed);
}

function TechnicalTextBlock({ text }: { text: string }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.technicalScrollContent}
      style={styles.technicalBlock}
    >
      <Text selectable style={styles.technicalText}>
        {text}
      </Text>
    </ScrollView>
  );
}

function trimCodeBlockContent(content: string): string {
  let normalized = content.replace(/\r\n?/g, '\n');
  if (normalized.endsWith('\n')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized.replace(/^(?:`{3,}|~{3,})\s*([A-Za-z0-9_+.#-]+)?\s*\n?/, '').replace(/\n?(?:`{3,}|~{3,})$/, '');
}

function normalizeMarkdownText(text: string): string {
  let normalized = text
    .replace(/\r\n?/g, '\n')
    .replace(/\\`/g, '`')
    .replace(/[｀´]/g, '`')
    .replace(/(^|\n)([ \t]*)(`{3,}|~{3,})([A-Za-z0-9_+.#-]+)/g, '$1$2$3 $4')
    .replace(/([^\n])(`{3,}|~{3,})([A-Za-z0-9_+.#-]*)/g, '$1\n$2$3')
    .replace(/(`{3,}|~{3,})([A-Za-z0-9_+.#-]+)([^\n`~A-Za-z0-9_+.#-])/g, '$1 $2$3')
    .replace(/(`{3,}|~{3,})([A-Za-z0-9_+.#-]*)([^\n`~\s])/g, '$1$2\n$3')
    .replace(/(^|\n)(`{3,}|~{3,})\s*(\n|$)/g, '$1$2$3');

  const fenceMatches = normalized.match(/(^|\n)(`{3,}|~{3,})/g);
  if (fenceMatches && fenceMatches.length % 2 === 1) {
    normalized = `${normalized.trimEnd()}\n\`\`\``;
  }

  return normalized;
}

function looksLikeFormulaLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) {
    return false;
  }

  if (/^(```|~~~|#{1,6}\s|[-*+]\s|\d+\.\s|>\s)/.test(trimmed)) {
    return false;
  }

  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    return false;
  }

  const mathTokenCount = (trimmed.match(/[=~∼≤≥≠≈∈∞√∫∑∏πσμθλφΦαβγ𝒩ℝℕℤℚℂ]|exp|sin|cos|tan|log|ln|lim|P\(|f\(|F\(|N\(/g) ?? []).length;
  const asciiMathOnly = /^[A-Za-z0-9\s.,;:(){}\[\]+\-*/=<>^_≤≥≠≈∈∞√∫∑∏πσμθλφΦαβγ𝒩ℝℕℤℚℂ₀-₉⁰-⁹⁺⁻⁼⁽⁾]+$/.test(trimmed);
  return asciiMathOnly && mathTokenCount >= 2;
}

function formatFormulaText(text: string): string {
  return text
    .trim()
    .replace(/\((1)\)\/\(/g, '$1 / (')
    .replace(/\)\s*exp/g, ') · exp')
    .replace(/([A-Za-z0-9)\]²³])=([A-Za-z0-9(])/g, '$1 = $2')
    .replace(/([A-Za-z0-9)\]²³])([≤≥≠≈∈])([A-Za-z0-9(])/g, '$1 $2 $3')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ');
}

function splitRichText(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  const codeFencePattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  function pushMarkdown(value: string) {
    const compact = value.replace(/\n{3,}/g, '\n\n').trim();
    if (compact) {
      segments.push({ kind: 'markdown', text: compact });
    }
  }

  function pushTextRun(value: string) {
    const lines = value.split('\n');
    const markdownLines: string[] = [];

    function flushMarkdownLines() {
      pushMarkdown(markdownLines.join('\n'));
      markdownLines.length = 0;
    }

    for (const line of lines) {
      if (looksLikeFormulaLine(line)) {
        flushMarkdownLines();
        segments.push({ kind: 'formula', text: formatFormulaText(line) });
      } else {
        markdownLines.push(line);
      }
    }

    flushMarkdownLines();
  }

  while ((match = codeFencePattern.exec(text))) {
    pushTextRun(text.slice(cursor, match.index));
    pushMarkdown(match[0]);
    cursor = match.index + match[0].length;
  }

  pushTextRun(text.slice(cursor));
  return segments;
}

function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: UiLanguage;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyCode() {
    if (!code.trim()) {
      return;
    }
    await Clipboard.setStringAsync(code);
    setCopied(true);
  }

  return (
    <View style={styles.codeBlockWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.codeBlockScrollContent}
      >
        <Text selectable style={styles.codeBlockText}>
          {code}
        </Text>
      </ScrollView>
      <Pressable
        style={[styles.codeCopyButton, copied && styles.codeCopyButtonDone]}
        onPress={copyCode}
        accessibilityRole="button"
        accessibilityLabel={language === 'zh' ? '复制代码段' : 'Copy code block'}
      >
        <CopyIcon done={copied} />
      </Pressable>
    </View>
  );
}

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <View style={styles.formulaBlock}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.formulaScrollContent}
      >
        <Text selectable style={styles.formulaText}>
          {formula}
        </Text>
      </ScrollView>
    </View>
  );
}

function MarkdownSegment({ text, language }: { text: string; language: UiLanguage }) {
  return (
    <Markdown
      mergeStyle
      rules={{
        code_block: (node) => (
          <CodeBlock key={node.key} code={trimCodeBlockContent(node.content)} language={language} />
        ),
        fence: (node) => (
          <CodeBlock key={node.key} code={trimCodeBlockContent(node.content)} language={language} />
        ),
      }}
      onLinkPress={(url) => {
        void Linking.openURL(url);
        return false;
      }}
      style={markdownStyles}
    >
      {text}
    </Markdown>
  );
}

function MessageText({ message, isUser, language }: { message: ChatMessage; isUser: boolean; language: UiLanguage }) {
  if (!message.text) {
    return null;
  }

  const normalizedText = normalizeMarkdownText(message.text);
  const displayText = applyContentPlugins(normalizedText, { message, language, isUser });

  if (shouldUseTechnicalTextBlock(displayText)) {
    return <TechnicalTextBlock text={displayText} />;
  }

  if (isUser) {
    return <Text selectable style={styles.bodyText}>{displayText}</Text>;
  }

  const segments = splitRichText(displayText);
  return (
    <View style={styles.richText}>
      {segments.map((segment, index) =>
        segment.kind === 'formula' ? (
          <FormulaBlock key={`formula-${index}`} formula={segment.text} />
        ) : (
          <MarkdownSegment key={`markdown-${index}`} text={segment.text} language={language} />
        )
      )}
    </View>
  );
}

function CopyIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <View style={styles.doneIconCircle}>
        <View style={styles.doneCheckStem} />
        <View style={styles.doneCheckArm} />
      </View>
    );
  }

  return (
    <View style={styles.copyIconBox}>
      <View style={styles.copyIconBack} />
      <View style={styles.copyIconFront} />
    </View>
  );
}

export function MessageBubble({ message, language }: Props) {
  const isUser = message.role === 'user';
  const copyableText = message.text || message.error || '';
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyMessage() {
    if (!copyableText.trim()) {
      return;
    }
    await Clipboard.setStringAsync(copyableText);
    setCopied(true);
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <Pressable
        style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
        onLongPress={() => {
          void copyMessage();
        }}
        delayLongPress={320}
      >
        {!isUser && <Text style={styles.metaLabel}>Pocket AI</Text>}
        <MessageText message={message} isUser={isUser} language={language} />
        {message.attachments.length > 0 && (
          <View style={styles.attachments}>
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} language={language} />
            ))}
          </View>
        )}
        {!!message.error && <Text style={styles.errorText}>{message.error}</Text>}
        {isUser && !!copyableText.trim() && (
          <View style={styles.actionRow}>
            <Pressable style={[styles.copyAction, copied && styles.copyActionCopied]} onPress={copyMessage}>
              <CopyIcon done={copied} />
            </Pressable>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    marginBottom: 16,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  assistantBubble: {
    maxWidth: '100%',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
  },
  bodyText: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  technicalBlock: {
    maxWidth: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
  },
  technicalScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  technicalText: {
    color: '#0F172A',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  richText: {
    width: '100%',
  },
  formulaBlock: {
    maxWidth: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginTop: 4,
    marginBottom: 12,
  },
  formulaScrollContent: {
    minWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaText: {
    color: '#0F172A',
    fontFamily: Platform.OS === 'android' ? 'serif' : undefined,
    fontSize: 19,
    lineHeight: 28,
  },
  codeBlockWrap: {
    position: 'relative',
    maxWidth: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F1F5F9',
    marginTop: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  codeBlockScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 48,
  },
  codeBlockText: {
    color: '#111827',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
  codeCopyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCopyButtonDone: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  attachments: {
    marginTop: 12,
    gap: 10,
  },
  image: {
    width: 180,
    height: 140,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  fileChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  fileChipLabel: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  fileName: {
    color: '#334155',
    fontSize: 13,
  },
  errorText: {
    marginTop: 10,
    color: '#DC2626',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  copyAction: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyActionCopied: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  copyIconBox: {
    width: 16,
    height: 16,
  },
  copyIconBack: {
    position: 'absolute',
    left: 1,
    top: 1,
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.8,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  copyIconFront: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.8,
    borderColor: '#475569',
    backgroundColor: '#FFFFFF',
  },
  doneIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  doneCheckStem: {
    position: 'absolute',
    left: 4,
    top: 8,
    width: 4.5,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  doneCheckArm: {
    position: 'absolute',
    left: 7,
    top: 5,
    width: 7,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
  },
});

const markdownStyles = StyleSheet.create({
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
    marginTop: 2,
    marginBottom: 10,
  },
  heading2: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 10,
  },
  heading3: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 8,
  },
  heading4: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
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
  code_block: {
    color: '#111827',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
  fence: {
    color: '#111827',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
});
