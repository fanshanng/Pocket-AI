import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Animated, Easing, Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Copy, Edit3, RefreshCw, Send, Share2, TextSelect, X } from 'lucide-react-native';

import { applyContentPlugins } from '../plugins';
import type { AttachmentRecord, ChatMessage, UiLanguage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

type Props = {
  message: ChatMessage;
  language: UiLanguage;
  colorScheme?: 'light' | 'dark';
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onEditUserMessage?: (messageId: string, nextText: string) => void;
  onSwitchVariant?: (messageId: string, direction: -1 | 1) => void;
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

function getMessageActionCopy(language: UiLanguage) {
  return language === 'zh'
    ? {
        userTitle: '用户消息',
        selectArea: '区域选择',
        copy: '复制',
        share: '分享',
        regenerate: '重新生成',
        edit: '编辑',
        close: '关闭',
        cancel: '取消',
        send: '发送',
      }
    : {
        userTitle: 'User message',
        selectArea: 'Select text',
        copy: 'Copy',
        share: 'Share',
        regenerate: 'Regenerate',
        edit: 'Edit',
        close: 'Close',
        cancel: 'Cancel',
        send: 'Send',
      };
}

function prepareAssistantMarkdown(message: ChatMessage, language: UiLanguage): string {
  return applyContentPlugins(message.text || '', { message, language, isUser: false });
}

function ThinkingIndicator({ language }: { language: UiLanguage }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [progress]);

  const textColor = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#2563EB', '#7C3AED', '#0891B2'],
  });
  const shineTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 150],
  });

  return (
    <View style={styles.thinkingWrap}>
      <LinearGradient
        colors={['#EFF6FF', '#F5F3FF', '#ECFEFF']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.thinkingPill}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.thinkingShine, { transform: [{ translateX: shineTranslate }] }]}
        />
        <Animated.Text style={[styles.thinkingText, { color: textColor }]}>
          {language === 'zh' ? '思考中……' : 'Thinking...'}
        </Animated.Text>
      </LinearGradient>
    </View>
  );
}

function MessageBubbleComponent({
  message,
  language,
  colorScheme = 'light',
  isStreaming = false,
  onRegenerate,
  onEditUserMessage,
  onSwitchVariant,
}: Props) {
  const isUser = message.role === 'user';
  const dark = colorScheme === 'dark';
  const palette = dark
    ? {
        text: '#E5E7EB',
        muted: '#94A3B8',
        surface: '#111827',
        surfaceAlt: '#1F2937',
        border: '#334155',
        userBubble: '#1E3A8A',
        userBorder: '#2563EB',
        selection: '#111827',
        selectionAlt: '#1F2937',
      }
    : {
        text: '#111827',
        muted: '#334155',
        surface: '#FFFFFF',
        surfaceAlt: '#F8FAFC',
        border: '#D8E0EA',
        userBubble: '#DBEAFE',
        userBorder: '#93C5FD',
        selection: '#FFFFFF',
        selectionAlt: '#F8FAFC',
      };
  const displayText = useMemo(
    () => (isUser ? message.text : prepareAssistantMarkdown(message, language)),
    [isUser, language, message]
  );
  const copyableText = message.text || message.error || '';
  const [actionMenuMounted, setActionMenuMounted] = useState(false);
  const [textSelectionMounted, setTextSelectionMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(message.text);
  const actionBackdropOpacity = useRef(new Animated.Value(0)).current;
  const actionCardScale = useRef(new Animated.Value(0.96)).current;
  const actionAnimationIdRef = useRef(0);
  const selectionBackdropOpacity = useRef(new Animated.Value(0)).current;
  const selectionSheetTranslateY = useRef(new Animated.Value(460)).current;
  const selectionAnimationIdRef = useRef(0);
  const hasCopyableText = copyableText.trim().length > 0;
  const canRegenerate = !isUser && !!onRegenerate;
  const canEdit = isUser && !!onEditUserMessage && !isStreaming;
  const actionCopy = getMessageActionCopy(language);
  const variantCount = isUser ? message.variants?.length ?? 0 : 0;
  const activeVariantIndex = Math.min(Math.max(message.activeVariantIndex ?? 0, 0), Math.max(0, variantCount - 1));
  const showThinking = !isUser && isStreaming && !message.error && displayText.trim().length === 0;

  useEffect(
    () => () => {
      actionBackdropOpacity.stopAnimation();
      actionCardScale.stopAnimation();
      selectionBackdropOpacity.stopAnimation();
      selectionSheetTranslateY.stopAnimation();
    },
    [actionBackdropOpacity, actionCardScale, selectionBackdropOpacity, selectionSheetTranslateY]
  );

  async function copyMessage() {
    if (!hasCopyableText) return;
    await Clipboard.setStringAsync(copyableText);
  }

  async function shareMessage() {
    if (!hasCopyableText) return;
    await Share.share({ message: copyableText }).catch(() => undefined);
  }

  function openActionMenu() {
    const animationId = actionAnimationIdRef.current + 1;
    actionAnimationIdRef.current = animationId;
    actionBackdropOpacity.stopAnimation();
    actionCardScale.stopAnimation();
    actionBackdropOpacity.setValue(0);
    actionCardScale.setValue(0.96);
    setActionMenuMounted(true);
    requestAnimationFrame(() => {
      if (actionAnimationIdRef.current !== animationId) {
        return;
      }
      Animated.parallel([
        Animated.timing(actionBackdropOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(actionCardScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function closeActionMenu() {
    const animationId = actionAnimationIdRef.current + 1;
    actionAnimationIdRef.current = animationId;
    actionBackdropOpacity.stopAnimation();
    actionCardScale.stopAnimation();
    Animated.parallel([
      Animated.timing(actionBackdropOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(actionCardScale, {
        toValue: 0.96,
        duration: 120,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (actionAnimationIdRef.current === animationId) {
        setActionMenuMounted(false);
      }
    });
  }

  function openTextSelection() {
    const animationId = selectionAnimationIdRef.current + 1;
    selectionAnimationIdRef.current = animationId;
    selectionBackdropOpacity.stopAnimation();
    selectionSheetTranslateY.stopAnimation();
    selectionBackdropOpacity.setValue(0);
    selectionSheetTranslateY.setValue(460);
    setTextSelectionMounted(true);
    requestAnimationFrame(() => {
      if (selectionAnimationIdRef.current !== animationId) {
        return;
      }
      Animated.parallel([
        Animated.timing(selectionBackdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(selectionSheetTranslateY, {
          toValue: 0,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function closeTextSelection() {
    const animationId = selectionAnimationIdRef.current + 1;
    selectionAnimationIdRef.current = animationId;
    selectionBackdropOpacity.stopAnimation();
    selectionSheetTranslateY.stopAnimation();
    Animated.parallel([
      Animated.timing(selectionBackdropOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(selectionSheetTranslateY, {
        toValue: 460,
        duration: 190,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (selectionAnimationIdRef.current === animationId) {
        setTextSelectionMounted(false);
      }
    });
  }

  function copyMessageFromMenu() {
    closeActionMenu();
    void copyMessage();
  }

  function shareFromMenu() {
    closeActionMenu();
    void shareMessage();
  }

  function showTextSelectionFromMenu() {
    closeActionMenu();
    if (hasCopyableText) {
      requestAnimationFrame(openTextSelection);
    }
  }

  function startEditFromMenu() {
    closeActionMenu();
    setDraftText(message.text);
    setEditing(true);
  }

  function regenerateFromMenu() {
    closeActionMenu();
    onRegenerate?.(message.id);
  }

  function submitEdit() {
    const trimmed = draftText.trim();
    if (!trimmed || trimmed === message.text.trim()) {
      setEditing(false);
      setDraftText(message.text);
      return;
    }
    setEditing(false);
    onEditUserMessage?.(message.id, trimmed);
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <Pressable
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: palette.userBubble, borderColor: palette.userBorder }]
            : styles.assistantBubble,
        ]}
        onLongPress={() => {
          if (!editing) openActionMenu();
        }}
        delayLongPress={320}
      >
        {editing ? (
          <View style={styles.editWrap}>
            <TextInput
              value={draftText}
              onChangeText={setDraftText}
              multiline
              autoFocus
              scrollEnabled
              style={[styles.editInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              textAlignVertical="top"
            />
            <View style={styles.editActions}>
              <Pressable style={[styles.editGhostButton, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]} onPress={() => setEditing(false)}>
                <X size={16} color={palette.muted} strokeWidth={2.4} />
                <Text style={[styles.editGhostText, { color: palette.muted }]}>{actionCopy.cancel}</Text>
              </Pressable>
              <Pressable style={styles.editSendButton} onPress={submitEdit}>
                <Send size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.editSendText}>{actionCopy.send}</Text>
              </Pressable>
            </View>
          </View>
        ) : isUser ? (
          <Text style={[styles.bodyText, { color: palette.text }]}>{displayText}</Text>
        ) : showThinking ? (
          <ThinkingIndicator language={language} />
        ) : (
          <MarkdownRenderer
            text={displayText}
            deferCodeHighlight={isStreaming}
            colorScheme={colorScheme}
          />
        )}
        {message.attachments.length > 0 && (
          <View style={styles.attachments}>
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} language={language} />
            ))}
          </View>
        )}
        {!!message.error && <Text style={styles.errorText}>{message.error}</Text>}
      </Pressable>

      {variantCount > 1 && !editing && (
        <View style={[styles.variantPager, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Pressable style={styles.variantButton} onPress={() => onSwitchVariant?.(message.id, -1)}>
            <ChevronLeft size={16} color={palette.muted} strokeWidth={2.5} />
          </Pressable>
          <Text style={[styles.variantText, { color: palette.text }]}>{activeVariantIndex + 1}/{variantCount}</Text>
          <Pressable style={styles.variantButton} onPress={() => onSwitchVariant?.(message.id, 1)}>
            <ChevronRight size={16} color={palette.muted} strokeWidth={2.5} />
          </Pressable>
        </View>
      )}

      <Modal visible={actionMenuMounted} transparent animationType="none" onRequestClose={closeActionMenu}>
        <View style={styles.actionMenuRoot}>
          <Animated.View style={[styles.actionMenuBackdrop, { opacity: actionBackdropOpacity }]} />
          <Pressable style={styles.actionMenuDismissLayer} onPress={closeActionMenu} />
          <Animated.View
            style={[
              styles.actionMenuCard,
              { opacity: actionBackdropOpacity, transform: [{ scale: actionCardScale }] },
            ]}
          >
            {isUser && <Text style={styles.actionMenuTitle}>{actionCopy.userTitle}</Text>}
            <Pressable
              style={[styles.actionMenuItem, !hasCopyableText && styles.actionMenuItemDisabled]}
              disabled={!hasCopyableText}
              onPress={showTextSelectionFromMenu}
            >
              <TextSelect size={18} color="#F8FAFC" strokeWidth={2.2} />
              <Text style={styles.actionMenuText}>{actionCopy.selectArea}</Text>
            </Pressable>
            {canEdit && (
              <Pressable style={styles.actionMenuItem} onPress={startEditFromMenu}>
                <Edit3 size={18} color="#F8FAFC" strokeWidth={2.2} />
                <Text style={styles.actionMenuText}>{actionCopy.edit}</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.actionMenuItem, !hasCopyableText && styles.actionMenuItemDisabled]}
              disabled={!hasCopyableText}
              onPress={copyMessageFromMenu}
            >
              <Copy size={18} color="#F8FAFC" strokeWidth={2.2} />
              <Text style={styles.actionMenuText}>{actionCopy.copy}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionMenuItem, !hasCopyableText && styles.actionMenuItemDisabled]}
              disabled={!hasCopyableText}
              onPress={shareFromMenu}
            >
              <Share2 size={18} color="#F8FAFC" strokeWidth={2.2} />
              <Text style={styles.actionMenuText}>{actionCopy.share}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionMenuItem, !canRegenerate && styles.actionMenuItemDisabled]}
              disabled={!canRegenerate}
              onPress={regenerateFromMenu}
            >
              <RefreshCw size={18} color="#F8FAFC" strokeWidth={2.2} />
              <Text style={styles.actionMenuText}>{actionCopy.regenerate}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={textSelectionMounted} transparent animationType="none" onRequestClose={closeTextSelection}>
        <View style={styles.selectionRoot}>
          <Animated.View style={[styles.selectionBackdrop, { opacity: selectionBackdropOpacity }]} />
          <Pressable style={styles.actionMenuDismissLayer} onPress={closeTextSelection} />
          <Animated.View
            style={[
              styles.selectionSheet,
              { backgroundColor: palette.selection, borderColor: palette.border, transform: [{ translateY: selectionSheetTranslateY }] },
            ]}
          >
            <View style={styles.selectionHandle} />
            <View style={styles.selectionHeader}>
              <Text style={[styles.selectionTitle, { color: palette.text }]}>{actionCopy.selectArea}</Text>
              <Pressable style={[styles.selectionClose, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]} onPress={closeTextSelection}>
                <X size={18} color={palette.text} strokeWidth={2.4} />
              </Pressable>
            </View>
            <ScrollView
              style={[styles.selectionTextScroll, { backgroundColor: palette.selectionAlt, borderColor: palette.border }]}
              contentContainerStyle={styles.selectionTextContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text selectable selectionColor="#BFDBFE" style={[styles.selectionText, { color: palette.text }]}>
                {copyableText}
              </Text>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

export const MessageBubble = memo(
  MessageBubbleComponent,
  (previous, next) =>
    previous.message === next.message &&
    previous.language === next.language &&
    previous.colorScheme === next.colorScheme &&
    previous.isStreaming === next.isStreaming &&
    previous.onRegenerate === next.onRegenerate &&
    previous.onEditUserMessage === next.onEditUserMessage &&
    previous.onSwitchVariant === next.onSwitchVariant
);

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
    width: '100%',
    alignSelf: 'stretch',
    maxWidth: '100%',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 2,
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
  thinkingWrap: {
    alignSelf: 'flex-start',
    minHeight: 34,
    justifyContent: 'center',
  },
  thinkingPill: {
    minHeight: 32,
    minWidth: 116,
    borderRadius: 16,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  thinkingShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    transform: [{ rotate: '16deg' }],
  },
  thinkingText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  editWrap: {
    width: '100%',
    minWidth: 260,
  },
  editInput: {
    minHeight: 92,
    maxHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editGhostButton: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  editGhostText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  editSendButton: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#2563EB',
  },
  editSendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  variantPager: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginRight: 6,
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  variantButton: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'center',
  },
  actionMenuRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  actionMenuBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  selectionRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  selectionBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
  },
  selectionSheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectionHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  selectionHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  selectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
  },
  selectionClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionTextScroll: {
    minHeight: 180,
    maxHeight: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
  },
  selectionTextContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectionText: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
});
