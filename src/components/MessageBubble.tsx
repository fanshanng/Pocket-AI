import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Copy, Edit3, RefreshCw, Send, Share2, TextSelect, X } from 'lucide-react-native';
import { LongPressGestureHandler, State, type LongPressGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

import { applyContentPlugins } from '../plugins';
import type { AttachmentRecord, ChatMessage, UiLanguage } from '../types';
import { openPrivateFile } from '../lib/files';
import { triggerLongPressHaptic } from '../lib/haptics';
import { withColorAlpha, type AppTheme } from '../theme';
import { useDrawerGesture } from './DrawerGestureContext';
import { MarkdownRenderer } from './MarkdownRenderer';

type Props = {
  message: ChatMessage;
  language: UiLanguage;
  theme: AppTheme;
  bubbleOpacity?: number;
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onEditUserMessage?: (messageId: string, nextText: string) => void;
  onSwitchVariant?: (messageId: string, direction: -1 | 1) => void;
  onOpenAttachment?: (attachment: AttachmentRecord) => void;
};

const MESSAGE_LONG_PRESS_DELAY_MS = 320;
const IMAGE_PREVIEW_DEFAULT_SIZE = { width: 172, height: 128 };
const IMAGE_PREVIEW_MAX_WIDTH = 248;
const IMAGE_PREVIEW_MAX_HEIGHT = 320;

function getBoundedImageSize(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  const safeWidth = Math.max(1, imageWidth);
  const safeHeight = Math.max(1, imageHeight);
  const containScale = Math.min(maxWidth / safeWidth, maxHeight / safeHeight, 1);

  return {
    width: Math.max(96, Math.round(safeWidth * containScale)),
    height: Math.max(96, Math.round(safeHeight * containScale)),
  };
}

function AttachmentPreview({
  attachment,
  language,
  theme,
  onOpenAttachmentFailed,
  onOpenAttachment,
}: {
  attachment: AttachmentRecord;
  language: UiLanguage;
  theme: AppTheme;
  onOpenAttachmentFailed: () => void;
  onOpenAttachment?: (attachment: AttachmentRecord) => void;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [resolvedImageSize, setResolvedImageSize] = useState(IMAGE_PREVIEW_DEFAULT_SIZE);

  useEffect(() => {
    if (attachment.kind !== 'image') {
      return;
    }

    let cancelled = false;
    Image.getSize(
      attachment.uri,
      (width, height) => {
        if (!cancelled && width > 0 && height > 0) {
          setResolvedImageSize({
            width,
            height,
          });
        }
      },
      () => {
        if (!cancelled) {
          setResolvedImageSize(IMAGE_PREVIEW_DEFAULT_SIZE);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [attachment]);

  const imageCardSize = useMemo(
    () =>
      getBoundedImageSize(
        resolvedImageSize.width,
        resolvedImageSize.height,
        Math.min(IMAGE_PREVIEW_MAX_WIDTH, Math.round(windowWidth * 0.62)),
        Math.min(IMAGE_PREVIEW_MAX_HEIGHT, Math.round(windowHeight * 0.42))
      ),
    [resolvedImageSize.height, resolvedImageSize.width, windowHeight, windowWidth]
  );

  function handleOpenAttachment() {
    if (onOpenAttachment) {
      onOpenAttachment(attachment);
      return;
    }

    void openPrivateFile(attachment.uri).then((opened) => {
      if (!opened) {
        onOpenAttachmentFailed();
      }
    });
  }

  if (attachment.kind === 'image') {
    return (
      <Pressable
        onPress={handleOpenAttachment}
        style={[
          styles.imageCard,
          {
            borderColor: theme.border,
            backgroundColor: theme.surfaceAlt,
            width: imageCardSize.width,
            height: imageCardSize.height,
          },
        ]}
      >
        <Image
          source={{ uri: attachment.uri }}
          style={styles.image}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.fileChip} onPress={handleOpenAttachment}>
      <Text style={[styles.fileChipLabel, { color: theme.primary }]}>{language === 'zh' ? '文件' : 'FILE'}</Text>
      <Text style={[styles.fileName, { color: theme.subtle }]} numberOfLines={1}>
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

function ThinkingIndicator({ language, theme }: { language: UiLanguage; theme: AppTheme }) {
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
    outputRange: [theme.primary, theme.selectedText, theme.primary],
  });
  const shineTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 150],
  });

  return (
    <View style={styles.thinkingWrap}>
      <LinearGradient
        colors={[theme.primarySoft, theme.surfaceAlt, theme.primarySoft]}
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
  theme,
  bubbleOpacity = 1,
  isStreaming = false,
  onRegenerate,
  onEditUserMessage,
  onSwitchVariant,
  onOpenAttachment,
}: Props) {
  const isUser = message.role === 'user';
  const palette = {
    text: theme.text,
    muted: theme.muted,
    subtle: theme.subtle,
    surface: theme.surface,
    surfaceAlt: theme.surfaceAlt,
    border: theme.border,
    primaryText: theme.composerButtonText,
    assistantBubble: theme.assistantBubble,
    assistantBorder: theme.assistantBorder,
    userBubble: theme.userBubble,
    userBorder: theme.userBorder,
    selection: theme.surface,
    selectionAlt: theme.surfaceAlt,
    selectedBorder: theme.selectedBorder,
  };
  const assistantBubbleColor = useMemo(
    () => withColorAlpha(palette.assistantBubble, bubbleOpacity),
    [bubbleOpacity, palette.assistantBubble]
  );
  const assistantBorderColor = useMemo(
    () => withColorAlpha(palette.assistantBorder, Math.min(1, bubbleOpacity + 0.12)),
    [bubbleOpacity, palette.assistantBorder]
  );
  const userBubbleColor = useMemo(
    () => withColorAlpha(palette.userBubble, bubbleOpacity),
    [bubbleOpacity, palette.userBubble]
  );
  const userBorderColor = useMemo(
    () => withColorAlpha(palette.userBorder, Math.min(1, bubbleOpacity + 0.12)),
    [bubbleOpacity, palette.userBorder]
  );
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
  const attachmentOpenFailedCopy =
    language === 'zh' ? '这个本地附件暂时无法直接交给外部应用打开。' : 'This local attachment could not be handed off to another app right now.';
  const variantCount = isUser ? message.variants?.length ?? 0 : 0;
  const activeVariantIndex = Math.min(Math.max(message.activeVariantIndex ?? 0, 0), Math.max(0, variantCount - 1));
  const showThinking = !isUser && isStreaming && !message.error && displayText.trim().length === 0;
  const imageAttachments = useMemo(
    () => message.attachments.filter((attachment) => attachment.kind === 'image'),
    [message.attachments]
  );
  const nonImageAttachments = useMemo(
    () => message.attachments.filter((attachment) => attachment.kind !== 'image'),
    [message.attachments]
  );
  const isImageOnlyMessage =
    !editing &&
    !message.error &&
    !showThinking &&
    displayText.trim().length === 0 &&
    imageAttachments.length > 0 &&
    nonImageAttachments.length === 0;
  const isSplitImageTextMessage =
    isUser &&
    !editing &&
    !message.error &&
    !showThinking &&
    displayText.trim().length > 0 &&
    imageAttachments.length > 0 &&
    nonImageAttachments.length === 0;
  const { lockDrawerGesture, unlockDrawerGesture } = useDrawerGesture();

  function renderAttachmentList(attachments: AttachmentRecord[], imageOnly = false) {
    return (
      <View style={[styles.attachments, imageOnly && styles.attachmentsImageOnly]}>
        {attachments.map((attachment) => (
          <AttachmentPreview
            key={attachment.id}
            attachment={attachment}
            language={language}
            theme={theme}
            onOpenAttachment={onOpenAttachment}
            onOpenAttachmentFailed={() => {
              Alert.alert(
                language === 'zh' ? '打开附件失败' : 'Unable to open attachment',
                attachmentOpenFailedCopy
              );
            }}
          />
        ))}
      </View>
    );
  }

  useEffect(
    () => () => {
      actionBackdropOpacity.stopAnimation();
      actionCardScale.stopAnimation();
      selectionBackdropOpacity.stopAnimation();
      selectionSheetTranslateY.stopAnimation();
      unlockDrawerGesture();
    },
    [actionBackdropOpacity, actionCardScale, selectionBackdropOpacity, selectionSheetTranslateY, unlockDrawerGesture]
  );

  function handleBubbleLongPress(event: LongPressGestureHandlerStateChangeEvent) {
    if (editing) {
      return;
    }
    if (event.nativeEvent.state === State.ACTIVE) {
      triggerLongPressHaptic();
      openActionMenu();
    }
  }

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
      <LongPressGestureHandler
        minDurationMs={MESSAGE_LONG_PRESS_DELAY_MS}
        maxDist={10}
        shouldCancelWhenOutside={false}
        onHandlerStateChange={handleBubbleLongPress}
      >
        {isSplitImageTextMessage ? (
          <View style={styles.bubbleGroup}>
            <View
              style={[
                styles.bubble,
                styles.imageOnlyBubble,
                styles.userImageOnlyBubble,
              ]}
            >
              {renderAttachmentList(imageAttachments, true)}
            </View>
            <View
              style={[
                styles.bubble,
                styles.userBubble,
                styles.splitTextBubble,
                { backgroundColor: userBubbleColor, borderColor: userBorderColor },
              ]}
            >
              <Text style={[styles.bodyText, { color: palette.text }]}>{displayText}</Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              isImageOnlyMessage
                ? [
                    styles.imageOnlyBubble,
                    isUser ? styles.userImageOnlyBubble : styles.assistantImageOnlyBubble,
                  ]
                : isUser
                  ? [styles.userBubble, { backgroundColor: userBubbleColor, borderColor: userBorderColor }]
                  : [styles.assistantBubble, { backgroundColor: assistantBubbleColor, borderColor: assistantBorderColor }],
            ]}
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
                  <Pressable style={[styles.editSendButton, { backgroundColor: theme.composerButton }]} onPress={submitEdit}>
                    <Send size={16} color={palette.primaryText} strokeWidth={2.4} />
                    <Text style={[styles.editSendText, { color: palette.primaryText }]}>{actionCopy.send}</Text>
                  </Pressable>
                </View>
              </View>
            ) : isUser ? (
              <Text style={[styles.bodyText, { color: palette.text }]}>{displayText}</Text>
            ) : showThinking ? (
              <ThinkingIndicator language={language} theme={theme} />
            ) : (
              <MarkdownRenderer
                text={displayText}
                deferCodeHighlight={isStreaming}
                colorScheme={theme.scheme}
                onHorizontalGestureStart={lockDrawerGesture}
                onHorizontalGestureEnd={unlockDrawerGesture}
              />
            )}
            {message.attachments.length > 0 && renderAttachmentList(message.attachments, isImageOnlyMessage)}
            {!!message.error && <Text style={styles.errorText}>{message.error}</Text>}
          </View>
        )}
      </LongPressGestureHandler>

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
              <Text selectable selectionColor={palette.selectedBorder} style={[styles.selectionText, { color: palette.text }]}>
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
    previous.theme === next.theme &&
    previous.isStreaming === next.isStreaming &&
    previous.onRegenerate === next.onRegenerate &&
    previous.onEditUserMessage === next.onEditUserMessage &&
    previous.onSwitchVariant === next.onSwitchVariant &&
    previous.onOpenAttachment === next.onOpenAttachment
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
  bubbleGroup: {
    gap: 8,
    alignItems: 'flex-end',
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
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  imageOnlyBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  userImageOnlyBubble: {
    maxWidth: '82%',
  },
  assistantImageOnlyBubble: {
    width: undefined,
    alignSelf: 'flex-start',
    maxWidth: '82%',
  },
  splitTextBubble: {
    maxWidth: '86%',
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
  attachmentsImageOnly: {
    marginTop: 0,
  },
  imageCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
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
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  fileName: {
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
  },
  editSendText: {
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
