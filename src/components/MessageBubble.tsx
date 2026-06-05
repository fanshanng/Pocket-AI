import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { applyContentPlugins } from '../plugins';
import type { AttachmentRecord, ChatMessage, UiLanguage } from '../types';

type Props = {
  message: ChatMessage;
  language: UiLanguage;
};

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

function MessageText({ message, isUser, language }: { message: ChatMessage; isUser: boolean; language: UiLanguage }) {
  if (!message.text) {
    return null;
  }

  const displayText = applyContentPlugins(message.text, { message, language, isUser });

  if (shouldUseTechnicalTextBlock(displayText)) {
    return <TechnicalTextBlock text={displayText} />;
  }

  if (isUser) {
    return <Text selectable style={styles.bodyText}>{displayText}</Text>;
  }

  return (
    <Markdown
      mergeStyle
      onLinkPress={(url) => {
        void Linking.openURL(url);
        return false;
      }}
      style={markdownStyles}
    >
      {displayText}
    </Markdown>
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
        {!!copyableText.trim() && (
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
