import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Image, Linking, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { applyContentPlugins } from '../plugins';
import type { AttachmentRecord, ChatMessage, UiLanguage } from '../types';
import { extractCodeBlocks, MarkdownRenderer } from './MarkdownRenderer';

type Props = {
  message: ChatMessage;
  language: UiLanguage;
  onRegenerate?: (messageId: string) => void;
};

function AttachmentPreview({ attachment, language }: { attachment: AttachmentRecord; language: UiLanguage }) {
  if (attachment.kind === 'image') {
    return <Image source={{ uri: attachment.uri }} style={styles.image} />;
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

function normalizeDisplayMathBlocks(text: string): string {
  return text
    .replace(/(^|\n)[ \t]*\\\[[ \t]*\n?([\s\S]*?)\n?[ \t]*\\\][ \t]*(?=\n|$)/g, (_, prefix: string, body: string) => {
      return `${prefix}\n${body.trim()}\n`;
    })
    .replace(/(^|\n)[ \t]*\$\$[ \t]*\n?([\s\S]*?)\n?[ \t]*\$\$[ \t]*(?=\n|$)/g, (_, prefix: string, body: string) => {
      return `${prefix}\n${body.trim()}\n`;
    });
}

function prepareAssistantMarkdown(message: ChatMessage, language: UiLanguage): string {
  const normalizedText = normalizeDisplayMathBlocks(message.text || '');
  return applyContentPlugins(normalizedText, { message, language, isUser: false });
}

export function MessageBubble({ message, language, onRegenerate }: Props) {
  const isUser = message.role === 'user';
  const displayText = isUser ? message.text : prepareAssistantMarkdown(message, language);
  const copyableText = message.text || message.error || '';
  const [copied, setCopied] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const codeBlocks = extractCodeBlocks(message.text);
  const hasCopyableText = copyableText.trim().length > 0;
  const hasCode = codeBlocks.some((block) => block.trim().length > 0);
  const canRegenerate = !isUser && !!onRegenerate;

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyMessage() {
    if (!hasCopyableText) return;
    await Clipboard.setStringAsync(copyableText);
    setCopied(true);
  }

  async function copyFirstCodeBlock() {
    const code = codeBlocks.find((block) => block.trim());
    if (!code) return;
    await Clipboard.setStringAsync(code);
  }

  async function shareMessage() {
    if (!hasCopyableText) return;
    await Share.share({ message: copyableText }).catch(() => undefined);
  }

  function closeActionMenu() {
    setActionMenuVisible(false);
  }

  function copyMessageFromMenu() {
    closeActionMenu();
    void copyMessage();
  }

  function copyCodeFromMenu() {
    closeActionMenu();
    void copyFirstCodeBlock();
  }

  function shareFromMenu() {
    closeActionMenu();
    void shareMessage();
  }

  function regenerateFromMenu() {
    closeActionMenu();
    onRegenerate?.(message.id);
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <Pressable
        style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
        onLongPress={() => setActionMenuVisible(true)}
        delayLongPress={320}
      >
        {!isUser && <Text style={styles.metaLabel}>Pocket AI</Text>}
        {isUser ? (
          <Text selectable style={styles.bodyText}>
            {displayText}
          </Text>
        ) : (
          <MarkdownRenderer text={displayText} />
        )}
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
      <Modal visible={actionMenuVisible} transparent animationType="fade" onRequestClose={closeActionMenu}>
        <View style={styles.actionMenuBackdrop}>
          <Pressable style={styles.actionMenuDismissLayer} onPress={closeActionMenu} />
          <View style={styles.actionMenuCard}>
            <Text style={styles.actionMenuTitle}>{isUser ? 'User message' : 'Assistant message'}</Text>
            <Pressable
              style={[styles.actionMenuItem, !hasCopyableText && styles.actionMenuItemDisabled]}
              disabled={!hasCopyableText}
              onPress={copyMessageFromMenu}
            >
              <Text style={styles.actionMenuText}>Copy Message</Text>
            </Pressable>
            <Pressable
              style={[styles.actionMenuItem, !hasCode && styles.actionMenuItemDisabled]}
              disabled={!hasCode}
              onPress={copyCodeFromMenu}
            >
              <Text style={styles.actionMenuText}>Copy Code</Text>
            </Pressable>
            <Pressable
              style={[styles.actionMenuItem, !hasCopyableText && styles.actionMenuItemDisabled]}
              disabled={!hasCopyableText}
              onPress={shareFromMenu}
            >
              <Text style={styles.actionMenuText}>Share</Text>
            </Pressable>
            <Pressable
              style={[styles.actionMenuItem, !canRegenerate && styles.actionMenuItemDisabled]}
              disabled={!canRegenerate}
              onPress={regenerateFromMenu}
            >
              <Text style={styles.actionMenuText}>Regenerate</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  actionMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  actionMenuDismissLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  actionMenuCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    backgroundColor: '#111827',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionMenuTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionMenuItem: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionMenuItemDisabled: {
    opacity: 0.38,
  },
  actionMenuText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
});
