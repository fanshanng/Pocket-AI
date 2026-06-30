import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Appearance,
  BackHandler,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  findNodeHandle,
} from 'react-native';
import type {
  AlertButton,
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScaledSize,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import LegacyDrawerLayout, {
  type DrawerLockMode as LegacyDrawerLockMode,
  type DrawerState as LegacyDrawerState,
} from 'react-native-gesture-handler/DrawerLayout';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowDown,
  Camera,
  FileText,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  X,
} from 'lucide-react-native';

import {
  CheckIcon,
  DirectionIcon,
  EditIcon,
  MenuIcon,
  MoreIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  StopIcon,
  TrashIcon,
} from './src/components/AppIcons';
import { DrawerGestureContext } from './src/components/DrawerGestureContext';
import { DrawerGestureLab } from './src/components/DrawerGestureLab';
import { ImageAttachmentViewer } from './src/components/ImageAttachmentViewer';
import { MessageBubble } from './src/components/MessageBubble';
import { ModelPickerContent } from './src/components/ModelPickerContent';
import { PendingAttachmentBar } from './src/components/PendingAttachmentBar';
import { SettingsAboutSection } from './src/components/SettingsAboutSection';
import { SettingsApiSection } from './src/components/SettingsApiSection';
import { SettingsAppearanceSection } from './src/components/SettingsAppearanceSection';
import { SettingsHeader } from './src/components/SettingsHeader';
import { SettingsInteractionSection } from './src/components/SettingsInteractionSection';
import { SettingsLanguageSection } from './src/components/SettingsLanguageSection';
import { SettingsRootSection } from './src/components/SettingsRootSection';
import { SettingsStorageSection } from './src/components/SettingsStorageSection';
import { SlideFadePresence } from './src/components/SlideFadePresence';
import { COPY } from './src/i18n/copy';
import {
  CONVERSATION_LENGTH_ASSISTANT_RESERVE_BYTES,
  type ConversationLengthGuard,
  conversationMatchesQuery,
  createConversation,
  estimateDraftTurnStorageBytes,
  formatConversationMarkdown,
  formatRelativeTime,
  getConversationLengthGuard,
  getAllConversationAttachments,
  getConversationAttachments,
  normalizeMessageVariants,
  normalizeSearchText,
  sortConversationsForList,
  trimTitle,
  upsertConversation,
} from './src/lib/conversations';
import { loadAttachmentCacheStats } from './src/lib/attachmentCache';
import {
  clearChatsAndRecoverProfileState,
  deleteUnreadableConversationRecord,
  exportUnreadableConversationBackup,
  openStorageLocationWithClipboard,
} from './src/lib/chatStorageActions';
import { exportConversationsToUserDirectory } from './src/lib/conversationExport';
import {
  getConfiguredDrawerOpenWidth,
  isLooseDirectionalDelta,
} from './src/lib/drawerGestures';
import {
  type AttachmentCacheStats,
  captureImageAttachment,
  clearAttachmentCacheFiles,
  deleteChatBackgroundImage,
  deleteAttachmentRecords,
  exportRawChatStorageBackupToUserDirectory,
  getAttachmentCacheLocationUri,
  getChatRecordsLocationUri,
  isAttachmentSizeError,
  openPrivateFile,
  pickDocumentAttachments,
  pickChatBackgroundImage,
  pickImageAttachments,
  persistSharedImageAttachments,
  sweepOrphanedAttachments,
} from './src/lib/files';
import type { SharedImageInput } from './src/lib/files';
import { makeId } from './src/lib/ids';
import {
  classifyModel,
  DEFAULT_PROFILE,
} from './src/lib/models';
import {
  createAssistantTurn,
  createConversationTitle,
  fetchAvailableModels,
  getApiErrorMessage,
  getApiErrorStatus,
  testApiConnection,
} from './src/lib/openai';
import { inferProviderCapabilities } from './src/lib/providerCapabilities';
import {
  consumePersistedStateLoadIssues,
  deleteProfileApiKey,
  EMPTY_STATE,
  loadPersistedProfileState,
  loadProfileApiKey,
  mergePersistedProfileState,
  migrateLegacyApiKey,
  loadPersistedState,
  savePersistedProfileState,
  saveProfileApiKey,
  savePersistedState,
} from './src/lib/storage';
import {
  APP_VERSION,
  fetchLatestRelease,
  isNewerRelease,
} from './src/lib/releases';
import { triggerLongPressHaptic } from './src/lib/haptics';
import { normalizeDrawerEdgeWidthPx } from './src/lib/interactionSettings';
import {
  applyApiPreset,
  getActiveProfile,
  getCachedModelsForProfile,
  getCachedReasoningEffortsForProfile,
  inferReasoningEffortOptions,
  profileHasAdvancedValues,
  sanitizeProfile,
  uniqueStrings,
  upsertProfile,
} from './src/lib/profiles';
import {
  hasDraftBaseUrl,
  hasDraftProfileLabel,
  sanitizeEditableProfileDraft,
} from './src/lib/profileDrafts';
import {
  hasKeyboardInsetsBridge,
  subscribeKeyboardInsets,
} from './src/native/keyboardInsets';
import {
  clearSharedImages,
  getInitialSharedImages,
  getSharedImageUri,
  hasSharedImageBridge,
  subscribeSharedImages,
} from './src/native/sharedImages';
import {
  type ChatBubbleOpacity,
  DEFAULT_CHAT_BUBBLE_OPACITY,
  type ChatBackgroundImageOpacity,
  DEFAULT_CHAT_BACKGROUND_IMAGE_OPACITY,
  multiplyColorAlpha,
  normalizeChatBubbleOpacity,
  normalizeSystemColorScheme,
  resolveTheme,
} from './src/theme';
import type {
  ApiProfile,
  AttachmentRecord,
  ChatMessage,
  ConversationRecord,
  DrawerOpenGestureMode,
  PendingAttachment,
  PersistedState,
  ReasoningEffort,
  ThemeMode,
  ThemePreset,
  UiLanguage,
} from './src/types';

const STREAMING_FLUSH_INTERVAL_MS = 220;
const STREAMING_SCROLL_INTERVAL_MS = 260;
const CHAT_BOTTOM_FOLLOW_THRESHOLD = 96;
const COMPOSER_VISIBLE_BOTTOM_GAP = 8;
const SHEET_SETTLE_EASING = Easing.bezier(0.2, 0, 0, 1);
const MOTION_EXIT_EASING = Easing.bezier(0.4, 0, 1, 1);
const SHEET_OPEN_DURATION_MS = 260;
const SHEET_CLOSE_DURATION_MS = 220;
const SETTINGS_INPUT_VISIBLE_GAP = 14;
const STARTUP_ATTACHMENT_SWEEP_DELAY_MS = 360;
const STARTUP_RECOVERY_ACTION_DELAY_MS = 9000;
const LARGE_CONVERSATION_RENDER_THRESHOLD = 160;
const INITIAL_VISIBLE_CONVERSATION_MESSAGES = 120;
const LOAD_MORE_CONVERSATION_MESSAGES_STEP = 120;
const CONVERSATION_LENGTH_WARNING_ALERT_COOLDOWN_MS = 60 * 1000;
const UNSUPPORTED_LIVE_SEARCH_ALERT_COOLDOWN_MS = 3 * 60 * 1000;

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function looksLikeLiveSearchPrompt(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    /今天|今日|刚刚|最近|最新|当前|现在|实时|热搜|新闻|头条|近况|日期|几号|星期几/.test(text) ||
    /\b(today|latest|recent|current|now|news|headline|breaking|live|date|what day is it)\b/i.test(normalized)
  );
}

type ComposerLiveSearchStatus = 'ready' | 'disabled' | 'unsupported';

type SettingsSection = 'root' | 'api' | 'language' | 'theme' | 'interaction' | 'storage' | 'about';
type SessionDrawerControls = {
  openDrawer: (options?: { velocity?: number; speed?: number }) => void;
  closeDrawer: (options?: { velocity?: number; speed?: number }) => void;
};

type ChatScrollMetrics = {
  offsetY: number;
  viewportHeight: number;
  contentHeight: number;
};

type WindowSize = {
  width: number;
  height: number;
};

const ANDROID_WINDOW_RESIZE_IGNORE_THRESHOLD = 72;

function normalizeWindowSize(size: ScaledSize): WindowSize {
  return {
    width: Math.round(size.width),
    height: Math.round(size.height),
  };
}

function readWindowSize(): WindowSize {
  return normalizeWindowSize(Dimensions.get('window'));
}

export default function App() {
  const [layoutWindowSize, setLayoutWindowSize] = useState<WindowSize>(() => readWindowSize());
  const windowSizeRef = useRef<WindowSize>(layoutWindowSize);
  const stableWindowSizeRef = useRef<WindowSize>(layoutWindowSize);
  const windowWidth = layoutWindowSize.width;
  const windowHeight = layoutWindowSize.height;
  const scrollRef = useRef<ScrollView>(null);
  const settingsScrollRef = useRef<ScrollView>(null);
  const sessionDrawerRef = useRef<SessionDrawerControls | null>(null);
  const composerDockRef = useRef<View>(null);
  const composerLiftFrameRef = useRef<number | null>(null);
  const composerKeyboardResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardBridgeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardSettleScrollFrameRef = useRef<number | null>(null);
  const keyboardInsetCommitFrameRef = useRef<number | null>(null);
  const settingsAutoScrollFrameRef = useRef<number | null>(null);
  const settingsAutoScrollRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsAutoScrollLateRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composerLiftTranslateY = useRef(new Animated.Value(0)).current;
  const chatKeyboardInsetAnimated = useRef(new Animated.Value(0)).current;
  const composerBottomInsetAnimated = useRef(new Animated.Value(0)).current;
  const jumpToLatestBottomBaseAnimated = useRef(new Animated.Value(0)).current;
  const composerLiftAnimationIdRef = useRef(0);
  const composerLiftMeasureIdRef = useRef(0);
  const composerAutoLiftTargetRef = useRef(0);
  const composerAutoLiftCurrentRef = useRef(0);
  const settingsScrollOffsetRef = useRef(0);
  const settingsFocusedInputRef = useRef<TextInput | null>(null);
  const keyboardVisibleRef = useRef(false);
  const keyboardInsetBottomRef = useRef(0);
  const chatKeyboardInsetRef = useRef(0);
  const previousChatBottomOccupiedHeightRef = useRef<number | null>(null);
  const pendingKeyboardFollowDeltaRef = useRef(0);
  const pendingKeyboardInsetBottomRef = useRef(0);
  const keyboardTopRef = useRef<number | null>(null);
  const chatScrollMetricsRef = useRef<ChatScrollMetrics | null>(null);
  const shouldScrollToBottomRef = useRef(true);
  const pendingScrollToBottomCountRef = useRef(0);
  const autoFollowScrollRef = useRef(true);
  // Keep live streaming stable by default; only resume follow mode after the user explicitly jumps to latest.
  const streamingAutoFollowEnabledRef = useRef(false);
  const skipNextPersistRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingTextRef = useRef('');
  const streamingFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamingConversationIdRef = useRef<string | null>(null);
  const regenerateAssistantMessageRef = useRef<(messageId: string) => void>(() => undefined);
  const openPendingAttachmentRef = useRef<(attachment: PendingAttachment) => void>(() => undefined);
  const removePendingAttachmentRef = useRef<(attachmentId: string) => void>(() => undefined);
  const openConversationAttachmentRef = useRef<(attachment: AttachmentRecord) => void>(() => undefined);
  const editUserMessageRef = useRef<(messageId: string, nextText: string) => void>(() => undefined);
  const switchUserMessageVariantRef = useRef<(messageId: string, direction: -1 | 1) => void>(() => undefined);
  const handledSharedImageUrisRef = useRef(new Set<string>());
  const startupAttachmentSweepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startupRecoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startupBootstrapCancelledRef = useRef(false);
  const sessionDrawerHiddenOffsetRef = useRef(360);
  const sessionsVisibleRef = useRef(false);
  const suppressNextSessionPressRef = useRef<string | null>(null);
  const suppressNextSessionPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsPanelTranslateX = useRef(new Animated.Value(0)).current;
  const settingsContentProgress = useRef(new Animated.Value(1)).current;
  const settingsContentAnimationIdRef = useRef(0);
  const settingsPanelHiddenOffsetRef = useRef(360);
  const settingsPanelAnimationIdRef = useRef(0);
  const settingsPanelCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsReturnTargetRef = useRef<'chat' | 'drawer'>('chat');
  const settingsTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const settingsTouchHasClosedRef = useRef(false);
  const profileLabelInputRef = useRef<TextInput>(null);
  const baseUrlInputRef = useRef<TextInput>(null);
  const apiKeyInputRef = useRef<TextInput>(null);
  const modelInputRef = useRef<TextInput>(null);
  const projectIdInputRef = useRef<TextInput>(null);
  const organizationInputRef = useRef<TextInput>(null);
  const systemPromptInputRef = useRef<TextInput>(null);
  const drawerEdgeWidthInputRef = useRef<TextInput>(null);
  const chatBackgroundOpacityInputRef = useRef<TextInput>(null);
  const chatBubbleOpacityInputRef = useRef<TextInput>(null);
  const bottomSheetTranslateY = useRef(new Animated.Value(420)).current;
  const bottomSheetBackdropOpacity = useRef(new Animated.Value(0)).current;
  const bottomSheetAnimationIdRef = useRef(0);
  const bottomSheetCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomSheetAfterCloseRef = useRef<(() => void) | null>(null);
  const draftProfileRef = useRef<ApiProfile>(DEFAULT_PROFILE);
  const apiKeyRef = useRef('');
  const draftProfileSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiProfileBlurSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiProfileFocusedInputCountRef = useRef(0);
  const lastDraftApiProfileEditAtRef = useRef(0);
  const skipDraftProfileAutosavePassesRef = useRef(0);
  const profileSaveRequestIdRef = useRef(0);
  const lastUnsupportedLiveSearchAlertAtRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [startupRecoveryVisible, setStartupRecoveryVisible] = useState(false);
  const [persisted, setPersisted] = useState<PersistedState>(EMPTY_STATE);
  const [apiKey, setApiKey] = useState('');
  const [draftProfile, setDraftProfile] = useState<ApiProfile>(DEFAULT_PROFILE);
  const [composerText, setComposerText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentRecord | null>(null);
  const [isChatNearBottom, setIsChatNearBottom] = useState(true);
  const [composerDockHeight, setComposerDockHeight] = useState(0);
  const [keyboardInsetBottom, setKeyboardInsetBottom] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [testingProfile, setTestingProfile] = useState(false);
  const [sending, setSending] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [chatMenuVisible, setChatMenuVisible] = useState(false);
  const [drawerLabVisible, setDrawerLabVisible] = useState(false);
  const [sessionsVisible, setSessionsVisible] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [bottomSheetMode, setBottomSheetMode] = useState<'models' | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [attachmentCacheStats, setAttachmentCacheStats] = useState<AttachmentCacheStats | null>(null);
  const [refreshingAttachmentCacheStats, setRefreshingAttachmentCacheStats] = useState(false);
  const [unreadableConversationIds, setUnreadableConversationIds] = useState<string[]>([]);
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark' | null>(() =>
    normalizeSystemColorScheme(Appearance.getColorScheme())
  );
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('root');
  const [settingsContentMotion, setSettingsContentMotion] = useState<'forward' | 'back' | 'rootEnter'>('forward');
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionSearchVisible, setSessionSearchVisible] = useState(false);
  const [sessionSearchRaised, setSessionSearchRaised] = useState(false);
  const [sessionSelectionMode, setSessionSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [sessionContextMenuId, setSessionContextMenuId] = useState<string | null>(null);
  const [selectedExportMenuVisible, setSelectedExportMenuVisible] = useState(false);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [draftSessionTitle, setDraftSessionTitle] = useState('');
  const [conversationWindowState, setConversationWindowState] = useState<{
    conversationId: string | null;
    visibleCount: number;
  }>({
    conversationId: null,
    visibleCount: INITIAL_VISIBLE_CONVERSATION_MESSAGES,
  });
  const shouldFreezeAndroidWindowResize =
    Platform.OS === 'android' &&
    !settingsVisible &&
    !modelPickerVisible &&
    !drawerLabVisible &&
    renamingConversationId === null;
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [advancedApiSettingsOpen, setAdvancedApiSettingsOpen] = useState(false);
  const [reasoningEffortOptions, setReasoningEffortOptions] = useState<ReasoningEffort[]>(['none']);
  const [reasoningEffortsFetched, setReasoningEffortsFetched] = useState(false);
  const drawerGestureLockCountRef = useRef(0);
  const [horizontalGestureLockVersion, setHorizontalGestureLockVersion] = useState(0);
  const conversationWarningAlertedAtRef = useRef<Record<string, number>>({});
  const handleRegenerateMessage = useCallback((messageId: string) => {
    regenerateAssistantMessageRef.current(messageId);
  }, []);
  // Keep memoized chat children on stable callbacks so Android keyboard inset
  // updates do not invalidate every bubble/attachment tile render.
  const handleOpenPendingAttachment = useCallback((attachment: PendingAttachment) => {
    openPendingAttachmentRef.current(attachment);
  }, []);
  const handleRemovePendingAttachment = useCallback((attachmentId: string) => {
    removePendingAttachmentRef.current(attachmentId);
  }, []);
  const handleOpenConversationAttachment = useCallback((attachment: AttachmentRecord) => {
    openConversationAttachmentRef.current(attachment);
  }, []);
  const handleEditUserMessage = useCallback((messageId: string, nextText: string) => {
    void editUserMessageRef.current(messageId, nextText);
  }, []);
  const handleSwitchUserMessageVariant = useCallback((messageId: string, direction: -1 | 1) => {
    switchUserMessageVariantRef.current(messageId, direction);
  }, []);
  const uiLanguage = persisted.uiLanguage;
  const copy = COPY[uiLanguage];
  const theme = resolveTheme(persisted.themeMode, persisted.themePreset, systemColorScheme);
  const isDark = theme.scheme === 'dark';
  const activeProfile = getActiveProfile(persisted);
  const activeConversation =
    persisted.conversations.find((item) => item.id === persisted.activeConversationId) ?? null;
  const activeConversationVisibleCount =
    conversationWindowState.conversationId === activeConversation?.id
      ? conversationWindowState.visibleCount
      : INITIAL_VISIBLE_CONVERSATION_MESSAGES;
  const conversationStatusBadgeCopy = useCallback(
    (guard: ConversationLengthGuard) =>
      guard.level === 'blocked'
        ? copy.conversationLengthStatusBlocked
        : guard.level === 'warning'
          ? copy.conversationLengthStatusWarning
          : copy.conversationLengthStatusSafe,
    [
      copy.conversationLengthStatusBlocked,
      copy.conversationLengthStatusSafe,
      copy.conversationLengthStatusWarning,
    ]
  );
  const visibleConversationMessages = useMemo(() => {
    if (!activeConversation) {
      return [];
    }

    if (activeConversation.messages.length <= LARGE_CONVERSATION_RENDER_THRESHOLD) {
      return activeConversation.messages;
    }

    return activeConversation.messages.slice(
      -Math.min(activeConversation.messages.length, activeConversationVisibleCount)
    );
  }, [activeConversation, activeConversationVisibleCount]);
  const hiddenConversationMessageCount = activeConversation
    ? Math.max(0, activeConversation.messages.length - visibleConversationMessages.length)
    : 0;
  const activeLastMessage = activeConversation?.messages[activeConversation.messages.length - 1] ?? null;
  const activeLastMessageTextLength = activeLastMessage?.text.length ?? 0;
  const composerDraftByteEstimate = useMemo(
    () =>
      estimateDraftTurnStorageBytes(
        composerText.trim(),
        pendingAttachments,
        CONVERSATION_LENGTH_ASSISTANT_RESERVE_BYTES
      ),
    [composerText, pendingAttachments]
  );
  const activeConversationGuard = useMemo(
    () => (activeConversation ? getConversationLengthGuard(activeConversation) : null),
    [activeConversation]
  );
  const predictedActiveConversationGuard = useMemo(() => {
    if (!activeConversation) {
      return null;
    }

    const trimmed = composerText.trim();
    if (!trimmed && pendingAttachments.length === 0) {
      return activeConversationGuard;
    }

    return getConversationLengthGuard(activeConversation, {
      extraMessages: 1,
      extraBytes: composerDraftByteEstimate,
    });
  }, [activeConversation, activeConversationGuard, composerDraftByteEstimate, composerText, pendingAttachments]);
  const activeConversationDisplayGuard = useMemo(() => {
    if (!activeConversation) {
      return null;
    }

    return composerText.trim() || pendingAttachments.length > 0
      ? predictedActiveConversationGuard
      : activeConversationGuard;
  }, [activeConversation, activeConversationGuard, composerText, pendingAttachments, predictedActiveConversationGuard]);
  const normalizedSessionSearch = normalizeSearchText(sessionSearchQuery);
  const sortedConversations = useMemo(
    () => sortConversationsForList(persisted.conversations),
    [persisted.conversations]
  );
  const visibleConversations = useMemo(
    () =>
      sortedConversations.filter((conversation) =>
        conversationMatchesQuery(conversation, normalizedSessionSearch)
      ),
    [normalizedSessionSearch, sortedConversations]
  );
  const renamingConversation =
    persisted.conversations.find((conversation) => conversation.id === renamingConversationId) ?? null;
  const sessionContextConversation =
    persisted.conversations.find((conversation) => conversation.id === sessionContextMenuId) ?? null;
  const sessionDrawerWidth = Math.max(280, Math.round(Math.min(windowWidth * 0.82, 380)));
  const drawerOpenGestureMode = persisted.interactionSettings.drawerOpenGestureMode;
  const drawerOpenEdgeWidth = getConfiguredDrawerOpenWidth(
    windowWidth,
    drawerOpenGestureMode,
    persisted.interactionSettings.drawerEdgeWidthPx
  );
  settingsPanelHiddenOffsetRef.current = Math.max(windowWidth, 320);
  void horizontalGestureLockVersion;
  const horizontalGestureLocked = drawerGestureLockCountRef.current > 0;
  const blockDrawerGesture =
    settingsVisible || modelPickerVisible || chatMenuVisible || horizontalGestureLocked;
  const sessionDrawerLockMode: LegacyDrawerLockMode = horizontalGestureLocked
    ? sessionsVisible
      ? 'locked-open'
      : 'locked-closed'
    : 'unlocked';
  const settingsContentTranslateX = settingsContentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [settingsContentMotion === 'rootEnter' ? -28 : 34, 0],
    extrapolate: 'clamp',
  });
  const androidStatusInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const compactWindow = windowHeight < 560;
  const topBarExtraInset = Platform.OS === 'android' ? (compactWindow ? 8 : 14) : 12;
  const modalTopInset = Platform.OS === 'android' ? Math.max(androidStatusInset + 12, compactWindow ? 24 : 36) : 12;
  const drawerTopInset = Platform.OS === 'android' ? (compactWindow ? 8 : 12) : 22;
  const composerLineCount = composerText.split('\n').length;
  const composerNeedsExpand = composerText.length >= 220 || composerLineCount >= 7;
  const composerSingleLine = composerLineCount <= 1 && composerText.length < 40;
  const activeProfileCapabilities = inferProviderCapabilities(activeProfile);
  const composerLooksLiveSearchSensitive = looksLikeLiveSearchPrompt(composerText);
  const composerLiveSearchStatus: ComposerLiveSearchStatus | null = !composerLooksLiveSearchSensitive
    ? null
    : activeProfileCapabilities.supportsWebSearch
      ? activeProfile.webSearchEnabled
        ? 'ready'
        : 'disabled'
      : 'unsupported';
  const composerBottomInset = Platform.OS === 'android' ? (compactWindow ? 8 : 14) : 14;
  const settingsKeyboardInset = Platform.OS === 'android' ? keyboardInsetBottom : 0;
  const chatContentBottomPadding = Math.max(14, composerDockHeight + 10);
  const chatBottomBaseHeight = composerBottomInset + composerDockHeight + 10;
  const chatComposerMarginBottomAnimated = useMemo(
    () => Animated.add(composerBottomInsetAnimated, chatKeyboardInsetAnimated),
    [chatKeyboardInsetAnimated, composerBottomInsetAnimated]
  );
  const jumpToLatestBottomAnimated = useMemo(
    () => Animated.add(jumpToLatestBottomBaseAnimated, chatKeyboardInsetAnimated),
    [chatKeyboardInsetAnimated, jumpToLatestBottomBaseAnimated]
  );
  const draftProfileCapabilities = useMemo(
    () => inferProviderCapabilities(draftProfile),
    [draftProfile]
  );
  const sessionSearchNeedsRaise = sessionSearchQuery.length > 28 || sessionSearchQuery.includes('\n');
  const sessionSearchIsRaised = sessionSearchRaised && sessionSearchNeedsRaise;
  const drawerBlankSwipeFooterHeight = visibleConversations.length < 6 ? Math.max(180, windowHeight * 0.28) : 56;
  const modelPickerSheetHeight = Math.max(
    320,
    Math.round(Math.min(windowHeight - modalTopInset, Math.max(420, windowHeight * 0.7)))
  );
  const lockDrawerGesture = useCallback(() => {
    drawerGestureLockCountRef.current += 1;
    setHorizontalGestureLockVersion((value) => value + 1);
  }, []);
  const unlockDrawerGesture = useCallback(() => {
    drawerGestureLockCountRef.current = Math.max(0, drawerGestureLockCountRef.current - 1);
    setHorizontalGestureLockVersion((value) => value + 1);
  }, []);
  const drawerGestureContextValue = useMemo(
    () => ({
      lockDrawerGesture,
      unlockDrawerGesture,
      horizontalGestureLocked,
    }),
    [horizontalGestureLocked, lockDrawerGesture, unlockDrawerGesture]
  );

  useEffect(() => {
    const commitLayoutWindowSize = (nextSize: WindowSize) => {
      windowSizeRef.current = nextSize;
      setLayoutWindowSize((current) =>
        Math.abs(current.width - nextSize.width) <= 1 && Math.abs(current.height - nextSize.height) <= 1
          ? current
          : nextSize
      );
    };

    const recordStableWindowSize = (nextSize: WindowSize) => {
      const stableSize = stableWindowSizeRef.current;
      const widthChanged = Math.abs(nextSize.width - stableSize.width) > 1;
      if (widthChanged || nextSize.height >= stableSize.height - 1) {
        stableWindowSizeRef.current = nextSize;
      }
    };

    const syncLiveWindowSize = () => {
      const nextSize = readWindowSize();
      recordStableWindowSize(nextSize);
      commitLayoutWindowSize(nextSize);
    };

    if (shouldFreezeAndroidWindowResize) {
      commitLayoutWindowSize(stableWindowSizeRef.current);
    } else {
      syncLiveWindowSize();
    }

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const nextSize = normalizeWindowSize(window);
      const previousSize = windowSizeRef.current;
      const widthChanged = Math.abs(nextSize.width - previousSize.width) > 1;
      const heightChanged = Math.abs(nextSize.height - previousSize.height) > 1;
      if (!widthChanged && !heightChanged) {
        return;
      }
      recordStableWindowSize(nextSize);
      const likelyKeyboardResize =
        Platform.OS === 'android' &&
        !widthChanged &&
        Math.abs(nextSize.height - previousSize.height) >= ANDROID_WINDOW_RESIZE_IGNORE_THRESHOLD;
      if (shouldFreezeAndroidWindowResize && likelyKeyboardResize) {
        return;
      }
      commitLayoutWindowSize(nextSize);
    });

    return () => {
      subscription.remove();
    };
  }, [shouldFreezeAndroidWindowResize]);

  const renderDrawerSession = useCallback(
    ({ item: conversation }: { item: ConversationRecord }) => {
      const active = conversation.id === activeConversation?.id;
      const selected = selectedSessionIds.includes(conversation.id);
      const messageCount = conversation.messages.length;
      const conversationGuard = getConversationLengthGuard(conversation);
      const sessionMetaParts = [
        conversation.model,
        uiLanguage === 'zh' ? `${messageCount} 条消息` : `${messageCount} messages`,
        formatRelativeTime(conversation.updatedAt, uiLanguage),
      ];
      return (
        <Pressable
          style={[
            styles.drawerSessionItem,
            active && styles.drawerSessionItemActive,
            selected && [styles.drawerSessionItemSelected, { backgroundColor: theme.primarySoft }],
            { borderBottomColor: active ? theme.primary : theme.divider },
          ]}
          onPress={() => {
            if (suppressNextSessionPressRef.current === conversation.id) {
              suppressNextSessionPressRef.current = null;
              if (suppressNextSessionPressTimerRef.current) {
                clearTimeout(suppressNextSessionPressTimerRef.current);
                suppressNextSessionPressTimerRef.current = null;
              }
              return;
            }
            openConversation(conversation.id);
          }}
          onPressOut={() => {
            if (suppressNextSessionPressRef.current !== conversation.id) {
              return;
            }
            if (suppressNextSessionPressTimerRef.current) {
              clearTimeout(suppressNextSessionPressTimerRef.current);
            }
            suppressNextSessionPressTimerRef.current = setTimeout(() => {
              if (suppressNextSessionPressRef.current === conversation.id) {
                suppressNextSessionPressRef.current = null;
              }
              suppressNextSessionPressTimerRef.current = null;
            }, 180);
          }}
          onLongPress={() => {
            if (!sessionSelectionMode) {
              triggerLongPressHaptic();
              suppressNextSessionPressRef.current = conversation.id;
              if (suppressNextSessionPressTimerRef.current) {
                clearTimeout(suppressNextSessionPressTimerRef.current);
              }
              suppressNextSessionPressTimerRef.current = setTimeout(() => {
                if (suppressNextSessionPressRef.current === conversation.id) {
                  suppressNextSessionPressRef.current = null;
                }
                suppressNextSessionPressTimerRef.current = null;
              }, 10000);
              setSessionContextMenuId(conversation.id);
            }
          }}
          delayLongPress={320}
        >
          <View style={styles.drawerSessionMain}>
            {sessionSelectionMode && (
              <View style={[styles.sessionSelectMark, { backgroundColor: theme.surface, borderColor: theme.border }, selected && styles.sessionSelectMarkActive]}>
                {selected && <CheckIcon />}
              </View>
            )}
            <View style={styles.sessionMeta}>
              <View style={styles.drawerSessionTitleRow}>
                {conversation.pinned && <PinIcon />}
                <Text style={[styles.drawerSessionTitle, { color: theme.text }]} numberOfLines={1}>
                  {conversation.title}
                </Text>
                {conversationGuard.level !== 'safe' && (
                  <View
                    style={[
                      styles.drawerSessionGuardBadge,
                      conversationGuard.level === 'blocked'
                        ? styles.drawerSessionGuardBadgeBlocked
                        : styles.drawerSessionGuardBadgeWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.drawerSessionGuardBadgeText,
                        conversationGuard.level === 'blocked'
                          ? styles.drawerSessionGuardBadgeTextBlocked
                          : styles.drawerSessionGuardBadgeTextWarning,
                      ]}
                    >
                      {conversationStatusBadgeCopy(conversationGuard)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.drawerSessionSubtitle, { color: theme.muted }]} numberOfLines={1}>
                {sessionMetaParts.join(' | ')}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [
      activeConversation?.id,
      conversationStatusBadgeCopy,
      selectedSessionIds,
      sessionSelectionMode,
      theme.border,
      theme.divider,
      theme.muted,
      theme.primary,
      theme.primarySoft,
      theme.surface,
      theme.text,
      uiLanguage,
    ]
  );

  useEffect(() => {
    let cancelled = false;
    startupBootstrapCancelledRef.current = false;

    (async () => {
      const [state, profileState] = await Promise.all([
        loadPersistedState(),
        loadPersistedProfileState(),
      ]);
      const loadIssues = consumePersistedStateLoadIssues();
      const mergedState = mergePersistedProfileState(state, profileState);
      if (cancelled || startupBootstrapCancelledRef.current) {
        return;
      }
      setPersisted(mergedState);
      setDraftProfile(getActiveProfile(mergedState));
      if (startupRecoveryTimerRef.current) {
        clearTimeout(startupRecoveryTimerRef.current);
        startupRecoveryTimerRef.current = null;
      }
      setStartupRecoveryVisible(false);
      setReady(true);
      setUnreadableConversationIds(loadIssues.unreadableConversationIds);

      if (loadIssues.unreadableConversationIds.length > 0) {
        Alert.alert(
          copy.unreadableSessionsRecoveredTitle,
          copy.unreadableSessionsRecoveredMessage(loadIssues.unreadableConversationIds.length)
        );
      }

      migrateLegacyApiKey(mergedState.activeProfileId)
        .then((key) => {
          if (!cancelled && !startupBootstrapCancelledRef.current) {
            setApiKey(key);
          }
        })
        .catch(() => undefined);

      startupAttachmentSweepTimerRef.current = setTimeout(() => {
        sweepOrphanedAttachments(getAllConversationAttachments(mergedState.conversations)).catch(() => undefined);
      }, STARTUP_ATTACHMENT_SWEEP_DELAY_MS);
    })();

    startupRecoveryTimerRef.current = setTimeout(() => {
      if (!cancelled) {
        setStartupRecoveryVisible(true);
      }
    }, STARTUP_RECOVERY_ACTION_DELAY_MS);

    return () => {
      cancelled = true;
      startupBootstrapCancelledRef.current = true;
      if (startupAttachmentSweepTimerRef.current) {
        clearTimeout(startupAttachmentSweepTimerRef.current);
        startupAttachmentSweepTimerRef.current = null;
      }
      if (startupRecoveryTimerRef.current) {
        clearTimeout(startupRecoveryTimerRef.current);
        startupRecoveryTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    savePersistedState(persisted).catch(() => undefined);
    savePersistedProfileState(persisted).catch(() => undefined);
  }, [persisted, ready]);

  useEffect(() => {
    draftProfileRef.current = draftProfile;
  }, [draftProfile]);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    queueDraftApiProfileSave();
  }, [apiKey, draftProfile, ready, settingsSection, settingsVisible]);

  useEffect(() => () => {
    if (draftProfileSaveTimerRef.current) {
      clearTimeout(draftProfileSaveTimerRef.current);
      draftProfileSaveTimerRef.current = null;
    }
    if (apiProfileBlurSaveTimerRef.current) {
      clearTimeout(apiProfileBlurSaveTimerRef.current);
      apiProfileBlurSaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (persisted.activeConversationId === null) {
      return;
    }
    if (persisted.conversations.some((conversation) => conversation.id === persisted.activeConversationId)) {
      return;
    }
    setPersisted((current) => ({
      ...current,
      activeConversationId: null,
    }));
  }, [persisted.activeConversationId, persisted.conversations, ready]);

  function resetSessionDrawerUi() {
    setSessionSelectionMode(false);
    setSelectedSessionIds([]);
    setSelectedExportMenuVisible(false);
    setSessionSearchVisible(false);
    setSessionSearchQuery('');
    setSessionSearchRaised(false);
  }

  function setSessionDrawerInstance(instance: unknown) {
    sessionDrawerRef.current = instance as SessionDrawerControls | null;
  }

  function handleSessionDrawerStateChange(state: LegacyDrawerState, drawerWillShow: boolean) {
    if (state === 'Idle') {
      setSessionsVisible(drawerWillShow);
      if (!drawerWillShow) {
        resetSessionDrawerUi();
      }
      return;
    }
    setSessionsVisible(drawerWillShow);
  }

  useEffect(() => {
    if (!settingsVisible) {
      return;
    }
    const hiddenOffset = settingsPanelHiddenOffsetRef.current;
    settingsPanelTranslateX.setValue(hiddenOffset);
    Animated.timing(settingsPanelTranslateX, {
      toValue: 0,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [settingsPanelTranslateX, settingsVisible, windowWidth]);

  useEffect(() => {
    if (!sessionSearchNeedsRaise && sessionSearchRaised) {
      setSessionSearchRaised(false);
    }
  }, [sessionSearchNeedsRaise, sessionSearchRaised]);

  useEffect(() => {
    const listenerId = composerLiftTranslateY.addListener(({ value }) => {
      composerAutoLiftCurrentRef.current = Math.max(0, -value);
    });
    return () => {
      composerLiftTranslateY.removeListener(listenerId);
      composerLiftTranslateY.stopAnimation();
      if (settingsAutoScrollFrameRef.current !== null) {
        cancelAnimationFrame(settingsAutoScrollFrameRef.current);
        settingsAutoScrollFrameRef.current = null;
      }
      if (settingsAutoScrollRetryTimerRef.current) {
        clearTimeout(settingsAutoScrollRetryTimerRef.current);
        settingsAutoScrollRetryTimerRef.current = null;
      }
    };
  }, [composerLiftTranslateY]);

  useEffect(() => {
    composerBottomInsetAnimated.setValue(composerBottomInset);
    jumpToLatestBottomBaseAnimated.setValue(composerBottomInset + composerDockHeight + 12);
  }, [
    composerBottomInset,
    composerBottomInsetAnimated,
    composerDockHeight,
    jumpToLatestBottomBaseAnimated,
  ]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      return;
    }
    updateComposerAutoLift();
  }, [
    attachmentMenuVisible,
    composerLineCount,
    composerText.length,
    pendingAttachments.length,
    windowHeight,
    windowWidth,
  ]);

  useEffect(() => {
    // Keep a JS-side fallback even when the native inset bridge exists, because
    // some Android keyboard transitions arrive late or miss their first inset event.
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(keyboardShowEvent, (event) => {
      keyboardVisibleRef.current = true;
      const endCoordinates = event?.endCoordinates;
      const nextBottom = Math.max(0, Math.round(endCoordinates?.height ?? 0));
      const nextScreenY = Math.max(0, Math.round(endCoordinates?.screenY ?? 0));
      let didUpdateComposer = false;
      const applyJsKeyboardFrame = () => {
        if (nextBottom > 0) {
          applyKeyboardInsetBottom(nextBottom, {
            immediate: true,
          });
        }
        if (nextScreenY > 0) {
          keyboardTopRef.current = nextScreenY;
        }
        didUpdateComposer = true;
        if (Platform.OS !== 'android') {
          updateComposerAutoLift();
        }
      };
      if (endCoordinates) {
        if (Platform.OS === 'android' && hasKeyboardInsetsBridge()) {
          if (nextScreenY > 0) {
            keyboardTopRef.current = nextScreenY;
          }
          cancelKeyboardBridgeFallback();
          if (keyboardInsetBottomRef.current > 0) {
            didUpdateComposer = true;
            if (Platform.OS !== 'android') {
              updateComposerAutoLift();
            }
          } else if (nextBottom > 0 || nextScreenY > 0) {
            // Let the native insets bridge lead on Android and use the JS event only
            // when the bridge misses the opening transition entirely.
            keyboardBridgeFallbackTimerRef.current = setTimeout(() => {
              keyboardBridgeFallbackTimerRef.current = null;
              if (!keyboardVisibleRef.current || keyboardInsetBottomRef.current > 0) {
                return;
              }
              applyJsKeyboardFrame();
            }, 120);
          }
        } else {
          applyJsKeyboardFrame();
        }
      }
      clearComposerKeyboardResetTimer();
      if (settingsVisible && settingsFocusedInputRef.current) {
        scheduleSettingsInputVisibility(settingsFocusedInputRef.current, false);
      }
      if (!didUpdateComposer && Platform.OS !== 'android') {
        updateComposerAutoLift();
      }
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      cancelKeyboardBridgeFallback();
      clearComposerKeyboardResetTimer();
      if (Platform.OS === 'android' && hasKeyboardInsetsBridge()) {
        composerKeyboardResetTimerRef.current = setTimeout(() => {
          composerKeyboardResetTimerRef.current = null;
          if (keyboardInsetBottomRef.current > 0 || keyboardVisibleRef.current) {
            resetComposerAutoLift();
          }
        }, 220);
        return;
      }
      resetComposerAutoLift();
      composerKeyboardResetTimerRef.current = setTimeout(() => {
        composerKeyboardResetTimerRef.current = null;
        resetComposerAutoLift();
      }, 180);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [
    attachmentMenuVisible,
    composerLineCount,
    composerText.length,
    pendingAttachments.length,
    settingsVisible,
    windowHeight,
    windowWidth,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    syncChatBottomOccupiedHeight(chatBottomBaseHeight + chatKeyboardInsetRef.current);
  }, [chatBottomBaseHeight]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    previousChatBottomOccupiedHeightRef.current = chatBottomBaseHeight + chatKeyboardInsetRef.current;
    pendingKeyboardFollowDeltaRef.current = 0;
    cancelKeyboardSettleScroll();
  }, [activeConversation?.id]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    previousChatBottomOccupiedHeightRef.current = chatBottomBaseHeight + chatKeyboardInsetRef.current;
    pendingKeyboardFollowDeltaRef.current = 0;
    cancelKeyboardSettleScroll();
  }, [chatBottomBaseHeight, composerExpanded]);

  useEffect(() => {
    if (pendingScrollToBottomCountRef.current <= 0) {
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollChatToLatest({ animated: false });
      });
    });
    pendingScrollToBottomCountRef.current = Math.max(0, pendingScrollToBottomCountRef.current - 1);
  }, [
    activeConversation?.id,
    activeConversation?.messages.length,
    visibleConversationMessages.length,
    chatContentBottomPadding,
  ]);

  useEffect(() => {
    if (!settingsVisible) {
      settingsFocusedInputRef.current = null;
      settingsScrollOffsetRef.current = 0;
      cancelPendingSettingsAutoScroll();
      return;
    }
    if (settingsFocusedInputRef.current && (keyboardVisibleRef.current || settingsKeyboardInset > 0)) {
      scheduleSettingsInputVisibility(settingsFocusedInputRef.current, false);
    }
  }, [settingsKeyboardInset, settingsSection, settingsVisible]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    cancelKeyboardInsetFinalize();
    commitKeyboardInsetBottom(settingsVisible ? keyboardInsetBottomRef.current : 0);
  }, [settingsVisible]);

  useEffect(() => {
    const unsubscribe = subscribeKeyboardInsets((event) => {
      const bottom = Math.max(0, Math.round(event.bottom ?? 0));
      const screenY = Math.max(0, Math.round(event.screenY ?? 0));
      applyKeyboardInsetBottom(bottom, {
        immediate: bottom <= 0,
      });
      keyboardTopRef.current = screenY > 0 ? screenY : null;
      keyboardVisibleRef.current = bottom > 0 || event.visible === true;
      if (bottom > 0) {
        cancelKeyboardBridgeFallback();
      }
      if (bottom > 0) {
        clearComposerKeyboardResetTimer();
      }
      if (bottom <= 0) {
        resetComposerAutoLift();
        return;
      }
    });

    if (!unsubscribe) {
      return undefined;
    }

    return unsubscribe;
  }, [windowHeight, windowWidth]);

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) {
      return;
    }
    scrollChatToLatest({ animated: !sending });
    shouldScrollToBottomRef.current = false;
    pendingScrollToBottomCountRef.current = 2;
  }, [
    activeConversation?.id,
    activeConversation?.messages.length,
    activeLastMessage?.id,
    activeLastMessageTextLength,
    pendingAttachments.length,
    settingsVisible,
    sessionsVisible,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sessionContextConversation) {
        setSessionContextMenuId(null);
        return true;
      }
      if (renamingConversation) {
        closeRenameModal();
        return true;
      }
      if (composerExpanded) {
        setComposerExpanded(false);
        return true;
      }
      if (modelPickerVisible) {
        closeBottomSheet();
        return true;
      }
      if (settingsVisible) {
        goBackFromSettings();
        return true;
      }
      if (sessionsVisible) {
        closeSessionsDrawer();
        return true;
      }
      if (chatMenuVisible) {
        setChatMenuVisible(false);
        return true;
      }
      if (attachmentMenuVisible) {
        setAttachmentMenuVisible(false);
        return true;
      }
      return false;
    });

    return () => {
      subscription.remove();
    };
  }, [
    attachmentMenuVisible,
    chatMenuVisible,
    composerExpanded,
    modelPickerVisible,
    renamingConversation,
    sessionContextConversation,
    sessionsVisible,
    settingsVisible,
  ]);

  useEffect(
    () => () => {
      if (streamingFlushTimerRef.current) {
        clearTimeout(streamingFlushTimerRef.current);
      }
      if (streamingScrollTimerRef.current) {
        clearTimeout(streamingScrollTimerRef.current);
      }
      if (suppressNextSessionPressTimerRef.current) {
        clearTimeout(suppressNextSessionPressTimerRef.current);
        suppressNextSessionPressTimerRef.current = null;
      }
      if (settingsPanelCloseFallbackRef.current) {
        clearTimeout(settingsPanelCloseFallbackRef.current);
      }
      if (bottomSheetCloseFallbackRef.current) {
        clearTimeout(bottomSheetCloseFallbackRef.current);
      }
      if (composerLiftFrameRef.current !== null) {
        cancelAnimationFrame(composerLiftFrameRef.current);
        composerLiftFrameRef.current = null;
      }
      clearComposerKeyboardResetTimer();
      cancelKeyboardInsetFinalize();
    },
    []
  );

  useEffect(() => {
  const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(normalizeSystemColorScheme(colorScheme));
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready || !hasSharedImageBridge()) return;

    let mounted = true;
    const appendSharedImages = async (inputs: SharedImageInput[]) => {
      // Android may deliver the same shared URI both as an initial intent and
      // as a native event; keep the composer from duplicating that attachment.
      const nextInputs = inputs.filter((input) => {
        const uri = getSharedImageUri(input);
        if (!uri || handledSharedImageUrisRef.current.has(uri)) {
          return false;
        }
        handledSharedImageUrisRef.current.add(uri);
        return true;
      });
      if (nextInputs.length === 0) {
        return;
      }

      try {
        const attachments = await persistSharedImageAttachments(nextInputs);
        if (mounted && attachments.length > 0) {
          setPendingAttachments((current) => [...current, ...attachments]);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert(
            isAttachmentSizeError(error) ? copy.attachmentTooLargeTitle : copy.imagePickerFailed,
            getAttachmentFailureMessage(error, copy.imagePickerFailedFallback)
          );
        }
      } finally {
        clearSharedImages();
      }
    };

    getInitialSharedImages()
      .then((images) => {
        if (mounted && Array.isArray(images)) {
          void appendSharedImages(images);
        }
      })
      .catch(() => undefined);

    const unsubscribe = subscribeSharedImages((images) => {
      if (Array.isArray(images)) {
        void appendSharedImages(images);
      }
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [
    copy.attachmentTooLargeMessage,
    copy.attachmentTooLargeTitle,
    copy.imagePickerFailed,
    copy.imagePickerFailedFallback,
    ready,
  ]);

  function updateConversations(
    nextConversations: ConversationRecord[],
    nextActiveId: string | null,
    options?: {
      scrollToBottom?: boolean;
      resetFollowState?: boolean;
    }
  ) {
    const scrollToBottom = options?.scrollToBottom ?? true;
    const resetFollowState = options?.resetFollowState ?? scrollToBottom;

    if (scrollToBottom) {
      shouldScrollToBottomRef.current = true;
      pendingScrollToBottomCountRef.current = 2;
    }
    if (resetFollowState) {
      autoFollowScrollRef.current = true;
      setIsChatNearBottom(true);
    }
    setPersisted((current) => ({
      ...current,
      conversations: nextConversations,
      activeConversationId: nextActiveId,
    }));
  }

  function isChatScrollNearBottom(metrics: ChatScrollMetrics): boolean {
    const visibleBottom = metrics.offsetY + metrics.viewportHeight;
    return visibleBottom >= metrics.contentHeight - CHAT_BOTTOM_FOLLOW_THRESHOLD;
  }

  function getChatScrollMaxOffset(metrics: ChatScrollMetrics): number {
    return Math.max(0, metrics.contentHeight - metrics.viewportHeight);
  }

  function scrollChatToLatest(options?: { animated?: boolean; keepStreamingSynced?: boolean }) {
    if (typeof options?.keepStreamingSynced === 'boolean') {
      streamingAutoFollowEnabledRef.current = options.keepStreamingSynced;
    }
    autoFollowScrollRef.current = true;
    setIsChatNearBottom(true);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: options?.animated ?? true });
    });
  }

  function handleChatScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const metrics: ChatScrollMetrics = {
      offsetY: event.nativeEvent.contentOffset.y,
      viewportHeight: event.nativeEvent.layoutMeasurement.height,
      contentHeight: event.nativeEvent.contentSize.height,
    };
    chatScrollMetricsRef.current = metrics;
    const nearBottom = isChatScrollNearBottom(metrics);
    autoFollowScrollRef.current = nearBottom;
    if (!nearBottom) {
      cancelKeyboardSettleScroll();
      streamingAutoFollowEnabledRef.current = false;
    }
    setIsChatNearBottom((current) => (current === nearBottom ? current : nearBottom));
  }

  function handleChatContentSizeChange(_width: number, height: number) {
    const previousContentHeight = chatScrollMetricsRef.current?.contentHeight ?? null;
    if (chatScrollMetricsRef.current) {
      chatScrollMetricsRef.current = {
        ...chatScrollMetricsRef.current,
        contentHeight: height,
      };
      if (!streamingAutoFollowEnabledRef.current) {
        const nearBottom = isChatScrollNearBottom(chatScrollMetricsRef.current);
        autoFollowScrollRef.current = nearBottom;
        setIsChatNearBottom((current) => (current === nearBottom ? current : nearBottom));
      }
    }
    if (previousContentHeight === null || Math.abs(height - previousContentHeight) > 1) {
      scheduleStreamingScroll();
    }
  }

  function jumpToLatest() {
    scrollChatToLatest({ animated: true, keepStreamingSynced: sending });
  }

  function commitKeyboardInsetBottom(nextBottom: number) {
    setKeyboardInsetBottom((current) => (Math.abs(current - nextBottom) <= 1 ? current : nextBottom));
  }

  function syncChatBottomOccupiedHeight(nextOccupiedHeight: number) {
    if (Platform.OS !== 'android') {
      return;
    }
    const previousOccupiedHeight = previousChatBottomOccupiedHeightRef.current;
    previousChatBottomOccupiedHeightRef.current = nextOccupiedHeight;
    if (previousOccupiedHeight === null) {
      return;
    }
    const delta = nextOccupiedHeight - previousOccupiedHeight;
    if (Math.abs(delta) <= 1) {
      return;
    }
    if (composerExpanded) {
      cancelKeyboardSettleScroll();
      return;
    }
    if (!autoFollowScrollRef.current) {
      cancelKeyboardSettleScroll();
      return;
    }
    // Follow the bottom cover delta directly so the latest messages glide with
    // the composer instead of flashing after a delayed snap-to-end correction.
    scheduleKeyboardSettleScroll(delta);
  }

  function applyChatKeyboardInsetBottom(nextBottom: number) {
    const normalizedBottom = Math.max(0, Math.round(nextBottom));
    if (Math.abs(chatKeyboardInsetRef.current - normalizedBottom) <= 1) {
      return;
    }
    chatKeyboardInsetRef.current = normalizedBottom;
    chatKeyboardInsetAnimated.setValue(normalizedBottom);
    syncChatBottomOccupiedHeight(chatBottomBaseHeight + normalizedBottom);
  }

  function cancelKeyboardInsetFinalize() {
    if (keyboardInsetCommitFrameRef.current !== null) {
      cancelAnimationFrame(keyboardInsetCommitFrameRef.current);
      keyboardInsetCommitFrameRef.current = null;
    }
  }

  function applyKeyboardInsetBottom(
    nextBottom: number,
    options?: { immediate?: boolean }
  ) {
    const normalizedBottom = Math.max(0, Math.round(nextBottom));
    keyboardInsetBottomRef.current = normalizedBottom;
    pendingKeyboardInsetBottomRef.current = normalizedBottom;
    applyChatKeyboardInsetBottom(normalizedBottom);

    if (Platform.OS !== 'android') {
      commitKeyboardInsetBottom(normalizedBottom);
      return;
    }

    if (!settingsVisible) {
      cancelKeyboardInsetFinalize();
      return;
    }

    if (options?.immediate || normalizedBottom <= 0) {
      cancelKeyboardInsetFinalize();
      commitKeyboardInsetBottom(normalizedBottom);
      return;
    }

    cancelKeyboardInsetFinalize();
    keyboardInsetCommitFrameRef.current = requestAnimationFrame(() => {
      keyboardInsetCommitFrameRef.current = null;
      commitKeyboardInsetBottom(pendingKeyboardInsetBottomRef.current);
    });
  }

  function cancelKeyboardBridgeFallback() {
    if (keyboardBridgeFallbackTimerRef.current) {
      clearTimeout(keyboardBridgeFallbackTimerRef.current);
      keyboardBridgeFallbackTimerRef.current = null;
    }
  }

  function clearComposerKeyboardResetTimer() {
    if (composerKeyboardResetTimerRef.current) {
      clearTimeout(composerKeyboardResetTimerRef.current);
      composerKeyboardResetTimerRef.current = null;
    }
  }

  function cancelKeyboardSettleScroll() {
    pendingKeyboardFollowDeltaRef.current = 0;
    if (keyboardSettleScrollFrameRef.current !== null) {
      cancelAnimationFrame(keyboardSettleScrollFrameRef.current);
      keyboardSettleScrollFrameRef.current = null;
    }
  }

  function scheduleKeyboardSettleScroll(delta: number) {
    if (Platform.OS !== 'android') {
      return;
    }
    if (composerExpanded) {
      pendingKeyboardFollowDeltaRef.current = 0;
      return;
    }
    pendingKeyboardFollowDeltaRef.current += delta;
    if (keyboardSettleScrollFrameRef.current !== null) {
      return;
    }
    keyboardSettleScrollFrameRef.current = requestAnimationFrame(() => {
      keyboardSettleScrollFrameRef.current = null;
      const deltaToApply = pendingKeyboardFollowDeltaRef.current;
      pendingKeyboardFollowDeltaRef.current = 0;
      const metrics = chatScrollMetricsRef.current;
      if (!metrics || !autoFollowScrollRef.current || Math.abs(deltaToApply) <= 1) {
        return;
      }
      const maxOffset = getChatScrollMaxOffset(metrics);
      if (maxOffset <= 1) {
        return;
      }
      const nextOffset = Math.min(maxOffset, Math.max(0, metrics.offsetY + deltaToApply));
      if (Math.abs(nextOffset - metrics.offsetY) <= 1) {
        return;
      }
      chatScrollMetricsRef.current = {
        ...metrics,
        offsetY: nextOffset,
      };
      setIsChatNearBottom(true);
      scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
    });
  }

  function loadEarlierConversationMessages() {
    if (!activeConversation || hiddenConversationMessageCount <= 0) {
      return;
    }

    setConversationWindowState((current) => {
      const baseVisibleCount =
        current.conversationId === activeConversation.id
          ? current.visibleCount
          : INITIAL_VISIBLE_CONVERSATION_MESSAGES;

      return {
        conversationId: activeConversation.id,
        visibleCount: Math.min(
          activeConversation.messages.length,
          baseVisibleCount + LOAD_MORE_CONVERSATION_MESSAGES_STEP
        ),
      };
    });
  }

  function animateComposerAutoLiftTo(nextLift: number, force = false) {
    const normalizedLift = Math.max(0, Math.round(nextLift));
    const animationId = composerLiftAnimationIdRef.current + 1;
    if (
      !force &&
      Math.abs(normalizedLift - composerAutoLiftTargetRef.current) <= 1 &&
      Math.abs(normalizedLift - composerAutoLiftCurrentRef.current) <= 1
    ) {
      return;
    }

    composerLiftAnimationIdRef.current = animationId;
    composerAutoLiftTargetRef.current = normalizedLift;
    if (Platform.OS === 'android') {
      composerLiftTranslateY.stopAnimation();
      composerLiftTranslateY.setValue(-normalizedLift);
      composerAutoLiftCurrentRef.current = normalizedLift;
      return;
    }
    composerLiftTranslateY.stopAnimation((value) => {
      if (animationId !== composerLiftAnimationIdRef.current) {
        return;
      }
      composerAutoLiftCurrentRef.current = Math.max(0, -value);
      if (!force && Math.abs(normalizedLift - composerAutoLiftCurrentRef.current) <= 1) {
        composerLiftTranslateY.setValue(-normalizedLift);
        composerAutoLiftCurrentRef.current = normalizedLift;
        return;
      }
      Animated.timing(composerLiftTranslateY, {
        toValue: -normalizedLift,
        duration: normalizedLift === 0 ? 190 : 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (
          finished &&
          animationId === composerLiftAnimationIdRef.current &&
          Math.abs(normalizedLift - composerAutoLiftTargetRef.current) <= 1
        ) {
          composerLiftTranslateY.setValue(-normalizedLift);
          composerAutoLiftCurrentRef.current = normalizedLift;
        }
      });
    });
  }

  function getKeyboardTop() {
    const metrics = Keyboard.metrics();
    if (metrics && metrics.height > 0) {
      const frameTop =
        Number.isFinite(metrics.screenY) && metrics.screenY > 0 && metrics.screenY < windowHeight
          ? metrics.screenY
          : windowHeight - metrics.height;
      return Math.max(0, Math.min(windowHeight, frameTop));
    }

    if (keyboardTopRef.current !== null) {
      return Math.max(0, Math.min(windowHeight, keyboardTopRef.current));
    }
    if (keyboardInsetBottomRef.current > 0) {
      return Math.max(0, windowHeight - keyboardInsetBottomRef.current);
    }
    return windowHeight;
  }

  function cancelPendingSettingsAutoScroll() {
    if (settingsAutoScrollFrameRef.current !== null) {
      cancelAnimationFrame(settingsAutoScrollFrameRef.current);
      settingsAutoScrollFrameRef.current = null;
    }
    if (settingsAutoScrollRetryTimerRef.current) {
      clearTimeout(settingsAutoScrollRetryTimerRef.current);
      settingsAutoScrollRetryTimerRef.current = null;
    }
    if (settingsAutoScrollLateRetryTimerRef.current) {
      clearTimeout(settingsAutoScrollLateRetryTimerRef.current);
      settingsAutoScrollLateRetryTimerRef.current = null;
    }
  }

  function ensureSettingsInputVisible(target: TextInput | null, animated = true) {
    const scrollView = settingsScrollRef.current;
    if (!settingsVisible || !target || !scrollView) {
      return;
    }
    const scrollNode = findNodeHandle(scrollView);
    const targetNode = findNodeHandle(target);
    const innerViewNode = scrollView.getInnerViewNode?.();
    if (!scrollNode || !targetNode || innerViewNode == null) {
      return;
    }
    const keyboardTop = getKeyboardTop();
    UIManager.measureInWindow(scrollNode, (_scrollX: number, scrollY: number, _scrollWidth: number, scrollHeight: number) => {
      if (!settingsVisible || !settingsScrollRef.current) {
        return;
      }
      const viewportTop = Math.max(0, scrollY);
      const viewportHeight = Math.max(0, scrollHeight);
      if (viewportHeight <= 0) {
        return;
      }
      const viewportBottom = viewportTop + viewportHeight;
      const keyboardLimitedBottom = Math.min(viewportBottom, Math.max(viewportTop, keyboardTop));
      const visibleViewportHeight = Math.max(0, keyboardLimitedBottom - viewportTop);
      if (visibleViewportHeight <= SETTINGS_INPUT_VISIBLE_GAP * 2) {
        return;
      }
      UIManager.measureLayout(
        targetNode,
        innerViewNode,
        () => {},
        (_left: number, top: number, _width: number, height: number) => {
          if (!settingsVisible || !settingsScrollRef.current) {
            return;
          }
          const inputTop = Math.max(0, top);
          const inputBottom = inputTop + Math.max(0, height);
          const currentOffset = Math.max(0, settingsScrollOffsetRef.current);
          const visibleTop = currentOffset + SETTINGS_INPUT_VISIBLE_GAP;
          const visibleBottom = currentOffset + visibleViewportHeight - SETTINGS_INPUT_VISIBLE_GAP;
          let nextOffset = currentOffset;
          if (inputBottom > visibleBottom) {
            nextOffset = inputBottom - visibleViewportHeight + SETTINGS_INPUT_VISIBLE_GAP;
          } else if (inputTop < visibleTop) {
            nextOffset = inputTop - SETTINGS_INPUT_VISIBLE_GAP;
          } else {
            return;
          }
          nextOffset = Math.max(0, Math.round(nextOffset));
          if (Math.abs(nextOffset - currentOffset) <= 1) {
            return;
          }
          settingsScrollRef.current.scrollTo({ y: nextOffset, animated });
          settingsScrollOffsetRef.current = nextOffset;
        }
      );
    });
  }

  function scheduleSettingsInputVisibility(target: TextInput | null, animated = true) {
    if (!settingsVisible) {
      return;
    }
    cancelPendingSettingsAutoScroll();
    const resolvedTarget = target ?? settingsFocusedInputRef.current;
    if (!resolvedTarget) {
      return;
    }
    settingsAutoScrollFrameRef.current = requestAnimationFrame(() => {
      settingsAutoScrollFrameRef.current = null;
      ensureSettingsInputVisible(resolvedTarget, animated);
    });
    settingsAutoScrollRetryTimerRef.current = setTimeout(() => {
      settingsAutoScrollRetryTimerRef.current = null;
      ensureSettingsInputVisible(resolvedTarget, false);
    }, 180);
    settingsAutoScrollLateRetryTimerRef.current = setTimeout(() => {
      settingsAutoScrollLateRetryTimerRef.current = null;
      ensureSettingsInputVisible(resolvedTarget, false);
    }, 360);
  }

  function focusSettingsInput(inputRef: React.RefObject<TextInput | null>) {
    const input = inputRef.current;
    settingsFocusedInputRef.current = input;
    scheduleSettingsInputVisibility(input);
  }

  function resetComposerAutoLift() {
    keyboardVisibleRef.current = false;
    applyKeyboardInsetBottom(0, { immediate: true });
    keyboardTopRef.current = null;
    cancelKeyboardBridgeFallback();
    cancelKeyboardSettleScroll();
    composerLiftMeasureIdRef.current += 1;
    if (composerLiftFrameRef.current !== null) {
      cancelAnimationFrame(composerLiftFrameRef.current);
      composerLiftFrameRef.current = null;
    }
    clearComposerKeyboardResetTimer();
    animateComposerAutoLiftTo(0, true);
  }

  function handleComposerBlur() {
    if (Platform.OS === 'android' && hasKeyboardInsetsBridge()) {
      // Let the native inset bridge drive the closing animation on Android so
      // blur does not yank the composer to 0 before the IME has actually
      // finished reporting its animated bottom insets.
      if (keyboardInsetBottomRef.current <= 0 && !keyboardVisibleRef.current) {
        resetComposerAutoLift();
      }
      return;
    }
    resetComposerAutoLift();
  }

  function updateComposerAutoLift() {
    if (Platform.OS === 'android') {
      composerLiftMeasureIdRef.current += 1;
      if (composerLiftFrameRef.current !== null) {
        cancelAnimationFrame(composerLiftFrameRef.current);
        composerLiftFrameRef.current = null;
      }
      animateComposerAutoLiftTo(0, true);
      return;
    }

    if (!keyboardVisibleRef.current) {
      resetComposerAutoLift();
      return;
    }

    if (composerLiftFrameRef.current !== null) {
      return;
    }

    const measureId = composerLiftMeasureIdRef.current;
    composerLiftFrameRef.current = requestAnimationFrame(() => {
      composerLiftFrameRef.current = null;
      if (!keyboardVisibleRef.current || measureId !== composerLiftMeasureIdRef.current) {
        return;
      }
      composerDockRef.current?.measureInWindow((_x, y, _width, height) => {
        if (!keyboardVisibleRef.current || measureId !== composerLiftMeasureIdRef.current) {
          return;
        }
        const desiredGap = compactWindow ? Math.max(4, COMPOSER_VISIBLE_BOTTOM_GAP - 3) : COMPOSER_VISIBLE_BOTTOM_GAP;
        const keyboardTop = getKeyboardTop();
        const keyboardTargetBottom = keyboardTop - desiredGap;
        const bottomGap = windowHeight - (y + height);
        const currentLift = composerAutoLiftCurrentRef.current;
        const keyboardLift = Math.max(0, Math.round(currentLift + y + height - keyboardTargetBottom));
        const bottomGapLift = Math.max(0, Math.round(currentLift + desiredGap - bottomGap));
        const keyboardHeight = Math.max(0, windowHeight - keyboardTop);
        const maxLift = Math.max(
          0,
          Math.round(Math.min(windowHeight * 0.7, Math.max(windowHeight * 0.35, keyboardHeight + desiredGap)))
        );
        const nextLift = Math.min(maxLift, Math.max(keyboardLift, bottomGapLift));
        animateComposerAutoLiftTo(nextLift, nextLift === 0);
      });
    });
  }

  function handleComposerDockLayout(event: LayoutChangeEvent) {
    const nextHeight = Math.max(0, Math.round(event.nativeEvent.layout.height));
    setComposerDockHeight((current) => (Math.abs(current - nextHeight) <= 1 ? current : nextHeight));
    if (Platform.OS !== 'android') {
      updateComposerAutoLift();
    }
  }

  function buildDraftConversation(): ConversationRecord {
    return createConversation(activeProfile, copy.newSession);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  function getAttachmentFailureMessage(error: unknown, fallbackMessage: string): string {
    if (isAttachmentSizeError(error)) {
      // Size errors carry structured fields so the user sees the file name,
      // measured size, and active limit in the current UI language.
      return copy.attachmentTooLargeMessage(
        error.fileName,
        formatBytes(error.size),
        formatBytes(error.limit)
      );
    }
    return error instanceof Error ? error.message : fallbackMessage;
  }

  function acknowledgeConversationLengthWarning(conversationId: string) {
    conversationWarningAlertedAtRef.current[conversationId] = Date.now();
    setPersisted((current) => {
      const target = current.conversations.find((conversation) => conversation.id === conversationId);
      if (!target || target.lengthWarningAcknowledgedAt) {
        return current;
      }

      return {
        ...current,
        conversations: current.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lengthWarningAcknowledgedAt: new Date().toISOString(),
              }
            : conversation
        ),
      };
    });
  }

  async function activateFreshSession(options?: { preserveDraft?: boolean }) {
    const preserveDraft = options?.preserveDraft ?? false;
    if (!preserveDraft) {
      await deleteAttachmentRecords(pendingAttachments).catch(() => undefined);
    }

    shouldScrollToBottomRef.current = true;
    pendingScrollToBottomCountRef.current = 2;
    autoFollowScrollRef.current = true;
    streamingAutoFollowEnabledRef.current = false;
    setIsChatNearBottom(true);
    setPersisted((current) => ({
      ...current,
      activeConversationId: null,
    }));
    if (!preserveDraft) {
      setComposerText('');
      setPendingAttachments([]);
    }
    setAttachmentMenuVisible(false);
    setChatMenuVisible(false);
    closeSessionsDrawer(false);
    closeBottomSheet(false);
  }

  function promptConversationLengthWarning(
    conversation: ConversationRecord,
    guard: ConversationLengthGuard
  ): Promise<boolean> {
    if (conversation.lengthWarningAcknowledgedAt) {
      return Promise.resolve(true);
    }

    const lastAlertAt = conversationWarningAlertedAtRef.current[conversation.id] ?? 0;
    if (Date.now() - lastAlertAt < CONVERSATION_LENGTH_WARNING_ALERT_COOLDOWN_MS) {
      return Promise.resolve(true);
    }

    conversationWarningAlertedAtRef.current[conversation.id] = Date.now();
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        copy.conversationLengthWarningTitle,
        copy.conversationLengthWarningMessage(
          guard.messageCount,
          guard.blockMessageCount,
          formatBytes(guard.storageBytes),
          formatBytes(guard.blockBytes)
        ),
        [
          {
            text: copy.cancel,
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: copy.conversationLengthNewSession,
            onPress: () => {
              acknowledgeConversationLengthWarning(conversation.id);
              void activateFreshSession({ preserveDraft: true });
              resolve(false);
            },
          },
          {
            text: copy.conversationLengthContinueCurrent,
            onPress: () => {
              acknowledgeConversationLengthWarning(conversation.id);
              resolve(true);
            },
          },
        ]
      );
    });
  }

  function showConversationLengthBlockedAlert(conversation: ConversationRecord, guard: ConversationLengthGuard) {
    Alert.alert(
      copy.conversationLengthBlockedTitle,
      copy.conversationLengthBlockedMessage(
        guard.messageCount,
        guard.blockMessageCount,
        formatBytes(guard.storageBytes),
        formatBytes(guard.blockBytes)
      ),
      [
        { text: copy.cancel, style: 'cancel' },
        {
          text: copy.conversationLengthNewSession,
          onPress: () => {
            acknowledgeConversationLengthWarning(conversation.id);
            void activateFreshSession({ preserveDraft: true });
          },
        },
      ]
    );
  }

  async function refreshAttachmentCacheStats() {
    setRefreshingAttachmentCacheStats(true);
    try {
      setAttachmentCacheStats(await loadAttachmentCacheStats(persisted.conversations, pendingAttachments));
    } catch {
      Alert.alert(copy.attachmentCacheTitle, copy.attachmentCacheStatsFailed);
    } finally {
      setRefreshingAttachmentCacheStats(false);
    }
  }

  async function openSettings(returnTarget: 'chat' | 'drawer' = 'chat') {
    setChatMenuVisible(false);
    apiProfileFocusedInputCountRef.current = 0;
    if (apiProfileBlurSaveTimerRef.current) {
      clearTimeout(apiProfileBlurSaveTimerRef.current);
      apiProfileBlurSaveTimerRef.current = null;
    }
    const animationId = settingsPanelAnimationIdRef.current + 1;
    settingsPanelAnimationIdRef.current = animationId;
    if (settingsPanelCloseFallbackRef.current) {
      clearTimeout(settingsPanelCloseFallbackRef.current);
      settingsPanelCloseFallbackRef.current = null;
    }
    settingsPanelTranslateX.stopAnimation();
    settingsContentProgress.stopAnimation();
    settingsContentProgress.setValue(1);
    setSettingsContentMotion('forward');
    settingsReturnTargetRef.current = returnTarget;
    setDraftProfile(activeProfile);
    resetApiProfileEditor(activeProfile);
    setSettingsSection('root');
    setSettingsVisible(true);
    setApiKey(await loadProfileApiKey(activeProfile.id));
  }

  function closeSettingsPanel(options: { returnToDrawer?: boolean } = {}) {
    apiProfileFocusedInputCountRef.current = 0;
    if (draftProfileSaveTimerRef.current) {
      clearTimeout(draftProfileSaveTimerRef.current);
      draftProfileSaveTimerRef.current = null;
    }
    if (apiProfileBlurSaveTimerRef.current) {
      clearTimeout(apiProfileBlurSaveTimerRef.current);
      apiProfileBlurSaveTimerRef.current = null;
    }
    if (settingsSection === 'api') {
      const closingDraftProfile = draftProfileRef.current;
      if (hasDraftBaseUrl(closingDraftProfile) && hasDraftProfileLabel(closingDraftProfile)) {
        void persistDraftApiProfile({
          profile: closingDraftProfile,
          key: apiKeyRef.current,
        });
      } else {
        const persistedProfile = getActiveProfile(persisted);
        skipDraftProfileAutosavePassesRef.current = 2;
        lastDraftApiProfileEditAtRef.current = 0;
        setDraftProfile(persistedProfile);
        resetApiProfileEditor(persistedProfile);
        loadProfileApiKey(persistedProfile.id).then(setApiKey).catch(() => setApiKey(''));
      }
    }
    const canReturnToDrawer = options.returnToDrawer ?? true;
    const animationId = settingsPanelAnimationIdRef.current + 1;
    settingsPanelAnimationIdRef.current = animationId;
    if (settingsPanelCloseFallbackRef.current) {
      clearTimeout(settingsPanelCloseFallbackRef.current);
    }
    settingsPanelTranslateX.stopAnimation();
    const finishClose = () => {
      if (settingsPanelAnimationIdRef.current !== animationId) {
        return;
      }
      if (settingsPanelCloseFallbackRef.current) {
        clearTimeout(settingsPanelCloseFallbackRef.current);
        settingsPanelCloseFallbackRef.current = null;
      }
      const shouldReturnToDrawer = canReturnToDrawer && settingsReturnTargetRef.current === 'drawer';
      if (shouldReturnToDrawer) {
        setSessionsVisible(true);
        requestAnimationFrame(() => {
          sessionDrawerRef.current?.openDrawer();
        });
      }
      setSettingsVisible(false);
      setSettingsSection('root');
      settingsContentProgress.setValue(1);
      setSettingsContentMotion('forward');
      settingsReturnTargetRef.current = 'chat';
    };
    settingsPanelCloseFallbackRef.current = setTimeout(finishClose, 260);
    Animated.timing(settingsPanelTranslateX, {
      toValue: settingsPanelHiddenOffsetRef.current,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(finishClose);
  }

  function animateSettingsContentIn(motion: 'forward' | 'rootEnter') {
    const animationId = settingsContentAnimationIdRef.current + 1;
    settingsContentAnimationIdRef.current = animationId;
    settingsContentProgress.stopAnimation();
    setSettingsContentMotion(motion);
    settingsContentProgress.setValue(0);
    requestAnimationFrame(() => {
      if (settingsContentAnimationIdRef.current !== animationId) {
        return;
      }
      Animated.timing(settingsContentProgress, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }

  function navigateToSettingsSection(section: SettingsSection) {
    if (settingsSection === section) {
      return;
    }
    setSettingsSection(section);
    if (section === 'storage') {
      void refreshAttachmentCacheStats();
    }
    animateSettingsContentIn(section === 'root' ? 'rootEnter' : 'forward');
  }

  function goBackFromSettings() {
    if (settingsSection !== 'root') {
      const animationId = settingsContentAnimationIdRef.current + 1;
      settingsContentAnimationIdRef.current = animationId;
      settingsContentProgress.stopAnimation();
      setSettingsContentMotion('back');
      Animated.timing(settingsContentProgress, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || settingsContentAnimationIdRef.current !== animationId) {
          return;
        }
        setSettingsSection('root');
        animateSettingsContentIn('rootEnter');
      });
      return;
    }
    closeSettingsPanel();
  }

  function getBottomSheetHiddenOffset() {
    return Math.max(420, Math.ceil(windowHeight * 0.74));
  }

  function openBottomSheet() {
    const animationId = bottomSheetAnimationIdRef.current + 1;
    bottomSheetAnimationIdRef.current = animationId;
    const hiddenOffset = getBottomSheetHiddenOffset();
    if (bottomSheetCloseFallbackRef.current) {
      clearTimeout(bottomSheetCloseFallbackRef.current);
      bottomSheetCloseFallbackRef.current = null;
    }
    bottomSheetAfterCloseRef.current = null;
    bottomSheetTranslateY.stopAnimation();
    bottomSheetBackdropOpacity.stopAnimation();
    bottomSheetTranslateY.setValue(hiddenOffset);
    bottomSheetBackdropOpacity.setValue(0);
    setBottomSheetMode('models');
    setModelPickerVisible(true);
    const startOpenAnimation = () => {
      if (bottomSheetAnimationIdRef.current !== animationId) {
        return;
      }
      Animated.parallel([
        Animated.timing(bottomSheetBackdropOpacity, {
          toValue: 1,
          duration: SHEET_OPEN_DURATION_MS - 60,
          easing: SHEET_SETTLE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(bottomSheetTranslateY, {
          toValue: 0,
          duration: SHEET_OPEN_DURATION_MS,
          easing: SHEET_SETTLE_EASING,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && bottomSheetAnimationIdRef.current === animationId) {
          bottomSheetTranslateY.setValue(0);
          bottomSheetBackdropOpacity.setValue(1);
        }
      });
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(startOpenAnimation);
    });
  }

  function closeBottomSheet(animate = true, afterClose?: () => void) {
    const animationId = bottomSheetAnimationIdRef.current + 1;
    bottomSheetAnimationIdRef.current = animationId;
    bottomSheetAfterCloseRef.current = afterClose ?? null;
    const hiddenOffset = getBottomSheetHiddenOffset();
    if (bottomSheetCloseFallbackRef.current) {
      clearTimeout(bottomSheetCloseFallbackRef.current);
    }
    bottomSheetTranslateY.stopAnimation();
    bottomSheetBackdropOpacity.stopAnimation();
    const finishClose = () => {
      if (bottomSheetAnimationIdRef.current !== animationId) {
        return;
      }
      if (bottomSheetCloseFallbackRef.current) {
        clearTimeout(bottomSheetCloseFallbackRef.current);
        bottomSheetCloseFallbackRef.current = null;
      }
      bottomSheetTranslateY.setValue(hiddenOffset);
      bottomSheetBackdropOpacity.setValue(0);
      setBottomSheetMode(null);
      setModelPickerVisible(false);
      const complete = bottomSheetAfterCloseRef.current;
      bottomSheetAfterCloseRef.current = null;
      complete?.();
    };
    if (!animate) {
      finishClose();
      return;
    }
    bottomSheetCloseFallbackRef.current = setTimeout(finishClose, SHEET_CLOSE_DURATION_MS + 120);
    Animated.parallel([
      Animated.timing(bottomSheetBackdropOpacity, {
        toValue: 0,
        duration: SHEET_CLOSE_DURATION_MS - 40,
        easing: MOTION_EXIT_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(bottomSheetTranslateY, {
        toValue: hiddenOffset,
        duration: SHEET_CLOSE_DURATION_MS,
        easing: MOTION_EXIT_EASING,
        useNativeDriver: true,
      }),
    ]).start(finishClose);
  }

  function handleSettingsTouchStart(event: GestureResponderEvent) {
    const { pageX, pageY } = event.nativeEvent;
    settingsTouchStartRef.current = { x: pageX, y: pageY };
    settingsTouchHasClosedRef.current = false;
  }

  function maybeNavigateSettingsFromTouch(event: GestureResponderEvent): boolean {
    const start = settingsTouchStartRef.current;
    if (!start || settingsTouchHasClosedRef.current) {
      return false;
    }

    const { pageX, pageY } = event.nativeEvent;
    const dx = pageX - start.x;
    const dy = pageY - start.y;
    if (!isLooseDirectionalDelta(dx, dy, 'right', 56)) {
      return false;
    }

    if (dx > 0) {
      settingsTouchHasClosedRef.current = true;
      goBackFromSettings();
      return true;
    }

    return false;
  }

  function handleSettingsTouchMove(event: GestureResponderEvent) {
    maybeNavigateSettingsFromTouch(event);
  }

  function handleSettingsTouchEnd() {
    settingsTouchStartRef.current = null;
    settingsTouchHasClosedRef.current = false;
  }

  function openApiProfiles() {
    const profile = activeProfile;
    apiProfileFocusedInputCountRef.current = 0;
    setDraftProfile(profile);
    resetApiProfileEditor(profile);
    navigateToSettingsSection('api');
    loadProfileApiKey(profile.id).then(setApiKey).catch(() => setApiKey(''));
  }

  async function openApiProfileEditorFromPicker(profile: ApiProfile) {
    const key = await loadProfileApiKey(profile.id).catch(() => '');
    closeBottomSheet(true, () => {
      apiProfileFocusedInputCountRef.current = 0;
      settingsReturnTargetRef.current = 'chat';
      setChatMenuVisible(false);
      setSessionsVisible(false);
      setDraftProfile(profile);
      resetApiProfileEditor(profile);
      setApiKey(key);
      setSettingsSection('api');
      setSettingsContentMotion('forward');
      settingsContentProgress.setValue(1);
      settingsPanelTranslateX.stopAnimation();
      settingsPanelTranslateX.setValue(0);
      setSettingsVisible(true);
    });
  }

  async function selectDraftApiProfile(profile: ApiProfile) {
    apiProfileFocusedInputCountRef.current = 0;
    skipDraftProfileAutosavePassesRef.current = 2;
    setDraftProfile(profile);
    setApiKey(await loadProfileApiKey(profile.id));
    resetApiProfileEditor(profile);
  }

  function createNewApiProfile() {
    const profile = sanitizeProfile({
      ...DEFAULT_PROFILE,
      id: makeId('profile'),
      label: `${DEFAULT_PROFILE.label} ${persisted.profiles.length + 1}`,
    });
    setPersisted((current) => ({
      ...current,
      profiles: [...current.profiles, profile],
      activeProfileId: profile.id,
      profile,
    }));
    apiProfileFocusedInputCountRef.current = 0;
    skipDraftProfileAutosavePassesRef.current = 2;
    setDraftProfile(profile);
    setApiKey('');
    resetApiProfileEditor(profile);
    void saveProfileApiKey(profile.id, '');
  }

  function applyUiLanguage(language: UiLanguage) {
    setPersisted((current) => ({
      ...current,
      uiLanguage: language,
    }));
  }

  function applyThemeMode(themeMode: ThemeMode) {
    setPersisted((current) => ({
      ...current,
      themeMode,
    }));
  }

  function applyThemePreset(themePreset: ThemePreset) {
    setPersisted((current) => ({
      ...current,
      themePreset,
    }));
  }

  function applyChatBackgroundImageOpacity(chatBackgroundImageOpacity: ChatBackgroundImageOpacity) {
    setPersisted((current) => ({
      ...current,
      chatBackgroundImageOpacity,
    }));
  }

  async function pickCustomChatBackgroundImage() {
    try {
      const nextUri = await pickChatBackgroundImage(persisted.chatBackgroundImageUri);
      if (!nextUri) {
        return;
      }
      setPersisted((current) => ({
        ...current,
        chatBackgroundImageUri: nextUri,
      }));
    } catch (error) {
      Alert.alert(copy.imagePickerFailed, copy.imagePickerFailedFallback);
    }
  }

  async function clearCustomChatBackgroundImage() {
    const currentUri = persisted.chatBackgroundImageUri;
    if (!currentUri) {
      return;
    }
    await deleteChatBackgroundImage(currentUri).catch(() => undefined);
    setPersisted((current) => ({
      ...current,
      chatBackgroundImageUri: null,
    }));
  }

  function applyDrawerOpenGestureMode(drawerOpenGestureMode: DrawerOpenGestureMode) {
    setPersisted((current) => ({
      ...current,
      interactionSettings: {
        ...current.interactionSettings,
        drawerOpenGestureMode,
      },
    }));
  }

  function applyDrawerEdgeWidthPx(drawerEdgeWidthPx: number) {
    setPersisted((current) => ({
      ...current,
      interactionSettings: {
        ...current.interactionSettings,
        drawerEdgeWidthPx: normalizeDrawerEdgeWidthPx(drawerEdgeWidthPx),
      },
    }));
  }

  async function checkLatestVersion() {
    setCheckingVersion(true);
    try {
      const latest = await fetchLatestRelease();
      if (isNewerRelease(latest.version)) {
        const buttons: AlertButton[] = [{ text: copy.close, style: 'cancel' }];
        const releaseUrl = latest.url;
        if (releaseUrl) {
          buttons.push({
            text: copy.github,
            onPress: () => openExternalUrl(releaseUrl),
          });
        }
        Alert.alert(copy.latestVersionTitle, copy.latestVersionAvailable(latest.version), buttons);
      } else {
        Alert.alert(copy.latestVersionTitle, `${copy.latestVersionCurrent}\n\n${copy.versionLabel}: v${APP_VERSION}`);
      }
    } catch {
      Alert.alert(copy.latestVersionFailedTitle, copy.latestVersionFailedMessage);
    } finally {
      setCheckingVersion(false);
    }
  }

  async function persistDraftApiProfile(
    options: {
      refetchModels?: boolean;
      profile?: ApiProfile;
      key?: string;
      requireBaseUrl?: boolean;
      applySavedProfileToEditor?: boolean;
    } = {}
  ) {
    const draft = options.profile ?? draftProfileRef.current;
    if (!hasDraftBaseUrl(draft)) {
      // Let users clear a preset URL before pasting a replacement; saved profiles and network actions still require a URL.
      if (options.requireBaseUrl) {
        Alert.alert(copy.baseUrlRequiredTitle, copy.baseUrlRequiredMessage);
      }
      return undefined;
    }
    if (!hasDraftProfileLabel(draft)) {
      // Let users clear a profile name before pasting a replacement; saved profiles still require a non-empty label.
      return undefined;
    }

    const requestId = profileSaveRequestIdRef.current + 1;
    profileSaveRequestIdRef.current = requestId;
    let profile = sanitizeProfile(draft);
    setSavingProfile(true);
    try {
      const key = (options.key ?? apiKeyRef.current).trim();
      await saveProfileApiKey(profile.id, key);
      const nextReasoningEfforts = getCachedReasoningEffortsForProfile({
        ...profile,
        cachedReasoningEfforts: inferReasoningEffortOptions(profile),
      });
      profile = {
        ...profile,
        cachedReasoningEfforts: nextReasoningEfforts,
      };
      if (key && options.refetchModels) {
        try {
          const result = await fetchAvailableModels({ profile, apiKey: key });
          profile = {
            ...profile,
            cachedModels: uniqueStrings([profile.model, ...result.models]),
          };
        } catch {
          profile = {
            ...profile,
            cachedModels: getCachedModelsForProfile(profile),
          };
        }
      }
      if (profileSaveRequestIdRef.current !== requestId) {
        return profile;
      }
      setPersisted((current) => {
        const profiles = upsertProfile(current.profiles, profile);
        return {
          ...current,
          activeProfileId: profile.id,
          profiles,
          profile,
        };
      });
      if (options.applySavedProfileToEditor) {
        setDraftProfile(profile);
      }
      setAvailableModels(getCachedModelsForProfile(profile));
      setReasoningEffortOptions(getCachedReasoningEffortsForProfile(profile));
      return profile;
    } finally {
      if (profileSaveRequestIdRef.current === requestId) {
        setSavingProfile(false);
      }
    }
  }

  async function handleSaveApiProfile() {
    const savedProfile = await persistDraftApiProfile({
      refetchModels: true,
      requireBaseUrl: true,
      applySavedProfileToEditor: true,
    });
    if (!savedProfile) {
      return;
    }
  }

  function queueDraftApiProfileSave(delayMs = 600) {
    if (skipDraftProfileAutosavePassesRef.current > 0) {
      skipDraftProfileAutosavePassesRef.current -= 1;
      return;
    }
    if (!settingsVisible || settingsSection !== 'api') {
      return;
    }
    if (apiProfileFocusedInputCountRef.current > 0) {
      return;
    }
    if (draftProfileSaveTimerRef.current) {
      clearTimeout(draftProfileSaveTimerRef.current);
    }
    draftProfileSaveTimerRef.current = setTimeout(() => {
      draftProfileSaveTimerRef.current = null;
      const elapsedMs = Date.now() - lastDraftApiProfileEditAtRef.current;
      if (lastDraftApiProfileEditAtRef.current > 0 && elapsedMs < delayMs) {
        queueDraftApiProfileSave(Math.max(120, delayMs - elapsedMs + 80));
        return;
      }
      void persistDraftApiProfile();
    }, delayMs);
  }

  function resetApiProfileEditor(profile: ApiProfile) {
    lastDraftApiProfileEditAtRef.current = 0;
    setAdvancedApiSettingsOpen(profileHasAdvancedValues(profile));
    setAvailableModels(getCachedModelsForProfile(profile));
    setReasoningEffortOptions(getCachedReasoningEffortsForProfile(profile));
    setReasoningEffortsFetched(false);
  }

  function markDraftApiProfileEdited() {
    lastDraftApiProfileEditAtRef.current = Date.now();
  }

  function handleApiProfileInputFocus(inputRef: React.RefObject<TextInput | null>) {
    if (apiProfileBlurSaveTimerRef.current) {
      clearTimeout(apiProfileBlurSaveTimerRef.current);
      apiProfileBlurSaveTimerRef.current = null;
    }
    apiProfileFocusedInputCountRef.current += 1;
    focusSettingsInput(inputRef);
  }

  function handleApiProfileInputBlur() {
    apiProfileFocusedInputCountRef.current = Math.max(0, apiProfileFocusedInputCountRef.current - 1);
    if (apiProfileBlurSaveTimerRef.current) {
      clearTimeout(apiProfileBlurSaveTimerRef.current);
    }
    apiProfileBlurSaveTimerRef.current = setTimeout(() => {
      apiProfileBlurSaveTimerRef.current = null;
      if (apiProfileFocusedInputCountRef.current > 0) {
        return;
      }
      queueDraftApiProfileSave(120);
    }, 120);
  }

  function refreshReasoningEffortOptions(profile: ApiProfile = draftProfile) {
    const options = inferReasoningEffortOptions(profile);
    setReasoningEffortOptions(options);
    setReasoningEffortsFetched(true);
    setDraftProfile((current) => ({
      ...current,
      cachedReasoningEfforts: options,
    }));

    if (!options.includes(profile.reasoningEffort)) {
      setDraftProfile((current) => ({ ...current, reasoningEffort: options[0] ?? 'none' }));
    }
  }

  function updateDraftProfileWithReasoningReset(updater: (current: ApiProfile) => ApiProfile) {
    markDraftApiProfileEdited();
    setReasoningEffortsFetched(false);
    setDraftProfile((current) => {
      const updated = updater(current);
      return sanitizeEditableProfileDraft(updated);
    });
  }

  function applyReasoningEffort(effort: ReasoningEffort) {
    markDraftApiProfileEdited();
    setDraftProfile((current) => ({
      ...current,
      reasoningEffort: effort,
      cachedReasoningEfforts: uniqueStrings([effort, ...(current.cachedReasoningEfforts ?? [])]) as ReasoningEffort[],
    }));
    setReasoningEffortOptions((current) => uniqueStrings([effort, ...current]) as ReasoningEffort[]);
  }

  function getAdvancedApiSummary(profile: ApiProfile): string {
    const capabilities = inferProviderCapabilities(profile);
    const activeItems = [
      capabilities.supportsWebSearch
        ? `${copy.webSearch} ${profile.webSearchEnabled ? copy.webSearchEnabled : copy.webSearchDisabled}`
        : '',
      profile.storeResponses ? copy.storageEnabled : copy.storageDisabled,
      profile.projectId ? copy.projectId : '',
      profile.organization ? copy.organization : '',
      profile.systemPrompt ? copy.systemPrompt : '',
    ];
    const summary = activeItems.filter(Boolean).join(' | ');
    return summary || copy.advancedDefaultsSummary;
  }

  function openExternalUrl(url: string) {
    Linking.openURL(url).catch(() => undefined);
  }

  function formatApiError(error: unknown): string {
    const status = getApiErrorStatus(error);
    const rawMessage = getApiErrorMessage(error);
    const lowered = rawMessage.toLowerCase();
    let friendly = '';

    if (status === 401) {
      friendly = copy.apiErrorUnauthorized;
    } else if (status === 403) {
      friendly = copy.apiErrorForbidden;
    } else if (status === 404) {
      friendly = copy.apiErrorNotFound;
    } else if (status === 400 || status === 422) {
      friendly = copy.apiErrorBadRequest;
    } else if (status === 429) {
      friendly = copy.apiErrorRateLimited;
    } else if (status && status >= 500) {
      friendly = copy.apiErrorServer;
    } else if (lowered.includes('timeout') || lowered.includes('timed out')) {
      friendly = copy.apiErrorTimeout;
    } else if (
      lowered.includes('network request failed') ||
      lowered.includes('failed to fetch') ||
      lowered.includes('network')
    ) {
      friendly = copy.apiErrorNetwork;
    }

    if (!friendly) {
      return rawMessage;
    }

    return `${friendly}\n\n${copy.apiErrorRawPrefix}: ${rawMessage}`;
  }

  async function handleTestApiProfile() {
    if (!hasDraftBaseUrl(draftProfile)) {
      Alert.alert(copy.baseUrlRequiredTitle, copy.baseUrlRequiredMessage);
      return;
    }

    const profile = sanitizeProfile(draftProfile);
    const key = apiKey.trim();
    if (!key) {
      Alert.alert(copy.apiKeyRequiredTitle, copy.apiKeyRequiredMessage);
      return;
    }

    setTestingProfile(true);
    try {
      const result = await testApiConnection({ profile, apiKey: key });
      Alert.alert(
        copy.testConnectionSuccessTitle,
        copy.testConnectionSuccessMessage(result.latencyMs, result.endpoint, result.sampleText)
      );
    } catch (error) {
      Alert.alert(copy.testConnectionFailedTitle, formatApiError(error));
    } finally {
      setTestingProfile(false);
    }
  }

  async function deleteApiProfile(profileId: string) {
    if (persisted.profiles.length <= 1) {
      Alert.alert(copy.deleteApiProfileTitle, copy.cannotDeleteOnlyApiProfile);
      return;
    }

    await deleteProfileApiKey(profileId);
    setPersisted((current) => {
      const profiles = current.profiles.filter((profile) => profile.id !== profileId);
      const activeProfileId =
        current.activeProfileId === profileId ? profiles[0].id : current.activeProfileId;
      const profile = profiles.find((item) => item.id === activeProfileId) ?? profiles[0];
      return {
        ...current,
        profiles,
        activeProfileId,
        profile,
      };
    });

    if (draftProfile.id === profileId) {
      const nextProfile = persisted.profiles.find((profile) => profile.id !== profileId) ?? DEFAULT_PROFILE;
      setDraftProfile(nextProfile);
      setApiKey(await loadProfileApiKey(nextProfile.id));
    }
  }

  function confirmDeleteApiProfile(profileId: string) {
    Alert.alert(copy.deleteApiProfileTitle, copy.deleteApiProfileMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: () => {
          void deleteApiProfile(profileId);
        },
      },
    ]);
  }

  function appendPendingAttachments(attachments: PendingAttachment[]) {
    if (attachments.length > 0) {
      setPendingAttachments((current) => [...current, ...attachments]);
      setAttachmentMenuVisible(false);
    }
  }

  async function attachPendingFrom(
    pickAttachments: () => Promise<PendingAttachment[]>,
    failedTitle: string,
    fallbackMessage: string
  ) {
    try {
      appendPendingAttachments(await pickAttachments());
    } catch (error) {
      Alert.alert(
        isAttachmentSizeError(error) ? copy.attachmentTooLargeTitle : failedTitle,
        getAttachmentFailureMessage(error, fallbackMessage)
      );
    }
  }

  async function attachFromCamera() {
    await attachPendingFrom(captureImageAttachment, copy.imagePickerFailed, copy.imagePickerFailedFallback);
  }

  async function attachImages() {
    await attachPendingFrom(pickImageAttachments, copy.imagePickerFailed, copy.imagePickerFailedFallback);
  }

  async function attachFiles() {
    await attachPendingFrom(pickDocumentAttachments, copy.filePickerFailed, copy.filePickerFailedFallback);
  }

  async function fetchModelsForProfile(profile: ApiProfile = activeProfile, key = apiKey) {
    if (!hasDraftBaseUrl(profile)) {
      Alert.alert(copy.baseUrlRequiredTitle, copy.baseUrlRequiredMessage);
      return;
    }

    if (!key.trim()) {
      openSettings();
      Alert.alert(copy.apiKeyRequiredTitle, copy.apiKeyRequiredMessage);
      return;
    }

    setFetchingModels(true);
    try {
      const result = await fetchAvailableModels({ profile, apiKey: key.trim() });
      const nextModels = uniqueStrings([profile.model, ...result.models]);
      setAvailableModels(nextModels);
      setPersisted((current) => {
        const currentProfile = current.profiles.find((item) => item.id === profile.id) ?? getActiveProfile(current);
        const updatedProfile = { ...currentProfile, cachedModels: nextModels };
        const profiles = upsertProfile(current.profiles, updatedProfile);
        return {
          ...current,
          profiles,
          profile: current.activeProfileId === updatedProfile.id ? updatedProfile : current.profile,
        };
      });
      if (result.models.length === 0) {
        Alert.alert(copy.modelPickerTitle, copy.modelsEmpty);
      }
    } catch (error) {
      Alert.alert(copy.modelsFetchFailed, error instanceof Error ? error.message : copy.modelsFetchFailed);
    } finally {
      setFetchingModels(false);
    }
  }

  async function fetchModelsForDraftProfile() {
    if (!hasDraftBaseUrl(draftProfile)) {
      Alert.alert(copy.baseUrlRequiredTitle, copy.baseUrlRequiredMessage);
      return;
    }

    const profile = sanitizeProfile(draftProfile);
    const key = apiKey.trim();
    if (!key) {
      Alert.alert(copy.apiKeyRequiredTitle, copy.apiKeyRequiredMessage);
      return;
    }

    setFetchingModels(true);
    try {
      const result = await fetchAvailableModels({ profile, apiKey: key });
      const nextModels = uniqueStrings([profile.model, ...result.models]);
      setAvailableModels(nextModels);
      setDraftProfile((current) => ({ ...current, model: profile.model, cachedModels: nextModels }));
      if (result.models.length === 0) {
        Alert.alert(copy.modelPickerTitle, copy.modelsEmpty);
      }
    } catch (error) {
      Alert.alert(copy.modelsFetchFailed, error instanceof Error ? error.message : copy.modelsFetchFailed);
    } finally {
      setFetchingModels(false);
    }
  }

  async function switchActiveApiProfile(profileId: string) {
    const nextProfile = persisted.profiles.find((profile) => profile.id === profileId);
    if (!nextProfile || nextProfile.id === persisted.activeProfileId) {
      closeBottomSheet();
      return;
    }

    const key = await loadProfileApiKey(nextProfile.id);
    setPersisted((current) => ({
      ...current,
      activeProfileId: nextProfile.id,
      profile: nextProfile,
    }));
    skipDraftProfileAutosavePassesRef.current = 2;
    setDraftProfile(nextProfile);
    setApiKey(key);
    resetApiProfileEditor(nextProfile);
    setAvailableModels(getCachedModelsForProfile(nextProfile));
    closeBottomSheet(true, () => {
      if (key.trim()) {
        void fetchModelsForProfile(nextProfile, key);
      }
    });
  }

  function openModelPicker() {
    setAvailableModels(getCachedModelsForProfile(activeProfile));
    openBottomSheet();
  }

  function applyModelToActiveProfile(model: string) {
    const nextModel = model.trim();
    if (!nextModel) {
      return;
    }
    closeBottomSheet(true, () => {
      setPersisted((current) => {
        const profile = getActiveProfile(current);
        const updatedProfile: ApiProfile = { ...profile, model: nextModel, cachedModels: uniqueStrings([nextModel, ...(profile.cachedModels ?? [])]) };
        const profiles = upsertProfile(current.profiles, updatedProfile);
        return {
          ...current,
          profiles,
          profile: updatedProfile,
        };
      });
      setDraftProfile((current) => ({ ...current, model: nextModel }));
    });
  }

  function flushStreamingText() {
    const conversationId = streamingConversationIdRef.current;
    const messageId = streamingMessageIdRef.current;
    if (!conversationId || !messageId) {
      return;
    }

    const nextText = streamingTextRef.current;
    skipNextPersistRef.current = true;
    setPersisted((current) => ({
      ...current,
      conversations: current.conversations.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              updatedAt: new Date().toISOString(),
              messages: item.messages.map((message) =>
                message.id === messageId ? { ...message, text: nextText } : message
              ),
            }
          : item
      ),
    }));
  }

  function scheduleStreamingFlush() {
    if (streamingFlushTimerRef.current) {
      return;
    }

    streamingFlushTimerRef.current = setTimeout(() => {
      streamingFlushTimerRef.current = null;
      flushStreamingText();
    }, STREAMING_FLUSH_INTERVAL_MS);
  }

  function scheduleStreamingScroll() {
    if (!sending || !streamingMessageIdRef.current) {
      return;
    }
    if (!streamingAutoFollowEnabledRef.current) {
      return;
    }
    if (!autoFollowScrollRef.current) {
      return;
    }
    if (streamingScrollTimerRef.current) {
      return;
    }

    streamingScrollTimerRef.current = setTimeout(() => {
      streamingScrollTimerRef.current = null;
      requestAnimationFrame(() => {
        // Keep bottom-pinned streaming quiet: jump directly instead of replaying
        // a visible animation on every text growth tick.
        scrollChatToLatest({ animated: false });
      });
    }, STREAMING_SCROLL_INTERVAL_MS);
  }

  function clearStreamingFlushTimer() {
    if (streamingFlushTimerRef.current) {
      clearTimeout(streamingFlushTimerRef.current);
      streamingFlushTimerRef.current = null;
    }
    if (streamingScrollTimerRef.current) {
      clearTimeout(streamingScrollTimerRef.current);
      streamingScrollTimerRef.current = null;
    }
  }

  function removePendingAttachment(id: string) {
    setAttachmentMenuVisible(false);
    const attachment = pendingAttachments.find((item) => item.id === id);
    setPendingAttachments((current) => current.filter((item) => item.id !== id));
    setPreviewAttachment((current) => (current?.id === id ? null : current));
    if (attachment) {
      deleteAttachmentRecords([attachment]).catch(() => undefined);
    }
  }

  function openPendingAttachment(attachment: PendingAttachment) {
    setAttachmentMenuVisible(false);
    openAttachmentPreviewOrFile(attachment);
  }

  function openAttachmentPreviewOrFile(attachment: AttachmentRecord) {
    if (attachment.kind === 'image') {
      setPreviewAttachment(attachment);
      return;
    }

    void openPrivateFile(attachment.uri).then((opened) => {
      if (!opened) {
        Alert.alert(copy.attachmentOpenFailedTitle, copy.attachmentOpenFailedMessage);
      }
    });
  }

  function createUserMessage(text: string, attachments: AttachmentRecord[]): ChatMessage {
    return {
      id: makeId('msg'),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
      attachments,
    };
  }

  function createAssistantMessage(
    text: string,
    responseId: string,
    attachments: AttachmentRecord[] = []
  ): ChatMessage {
    return {
      id: makeId('msg'),
      role: 'assistant',
      text,
      createdAt: new Date().toISOString(),
      attachments,
      responseId,
    };
  }

  function openConversationAttachment(attachment: AttachmentRecord) {
    openAttachmentPreviewOrFile(attachment);
  }

  function handleStopGenerating() {
    abortControllerRef.current?.abort();
  }

  async function handleSend() {
    if (sending) return;

    const trimmed = composerText.trim();
    if (!trimmed && pendingAttachments.length === 0) {
      return;
    }
    if (!apiKey.trim()) {
      openSettings();
      Alert.alert(copy.apiKeyRequiredTitle, copy.apiKeyRequiredMessage);
      return;
    }

    const shouldSuggestLiveSearch =
      looksLikeLiveSearchPrompt(trimmed) &&
      !activeProfileCapabilities.supportsWebSearch &&
      Date.now() - lastUnsupportedLiveSearchAlertAtRef.current > UNSUPPORTED_LIVE_SEARCH_ALERT_COOLDOWN_MS;
    if (shouldSuggestLiveSearch) {
      lastUnsupportedLiveSearchAlertAtRef.current = Date.now();
      Alert.alert(copy.liveSearchSuggestedTitle, copy.liveSearchSuggestedMessage);
    }

    const existingConversation = activeConversation;
    const conversation = existingConversation ?? buildDraftConversation();
    const sendGuard = getConversationLengthGuard(conversation, {
      extraMessages: 1,
      extraBytes: estimateDraftTurnStorageBytes(
        trimmed,
        pendingAttachments,
        CONVERSATION_LENGTH_ASSISTANT_RESERVE_BYTES
      ),
    });
    if (sendGuard.level === 'blocked') {
      showConversationLengthBlockedAlert(conversation, sendGuard);
      return;
    }
    if (sendGuard.level === 'warning') {
      const shouldContinue = await promptConversationLengthWarning(conversation, sendGuard);
      if (!shouldContinue) {
        return;
      }
    }

    const baseConversations = existingConversation
      ? persisted.conversations
      : upsertConversation(persisted.conversations, conversation);
    const userMessage = createUserMessage(trimmed, pendingAttachments);
    const title =
      conversation.messages.length === 0
        ? trimTitle(trimmed || pendingAttachments[0]?.name || copy.newSession, copy.newSession)
        : conversation.title;

    const optimisticConversation: ConversationRecord = {
      ...conversation,
      title,
      model: activeProfile.model,
      assistantKind: classifyModel(activeProfile.model),
      updatedAt: userMessage.createdAt,
      messages: [...conversation.messages, userMessage],
    };
    const streamingAssistantMessage = createAssistantMessage('', '');
    const streamingConversation: ConversationRecord = {
      ...optimisticConversation,
      messages: [...optimisticConversation.messages, streamingAssistantMessage],
    };

    const optimisticConversations = upsertConversation(baseConversations, streamingConversation);
    updateConversations(optimisticConversations, conversation.id);

    setComposerText('');
    setPendingAttachments([]);
    setAttachmentMenuVisible(false);
    setSending(true);
    streamingAutoFollowEnabledRef.current = false;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    streamingTextRef.current = '';
    streamingConversationIdRef.current = conversation.id;
    streamingMessageIdRef.current = streamingAssistantMessage.id;

    try {
      const turn = await createAssistantTurn({
        profile: activeProfile,
        apiKey: apiKey.trim(),
        conversation,
        nextUserMessage: userMessage,
        signal: abortController.signal,
        onTextDelta: (delta) => {
          streamingTextRef.current += delta;
          scheduleStreamingFlush();
        },
      });
      clearStreamingFlushTimer();
      const assistantMessage: ChatMessage = {
        ...streamingAssistantMessage,
        text: turn.assistantText || streamingTextRef.current || '(empty response)',
        responseId: turn.responseId,
        attachments: turn.attachments,
        createdAt: new Date().toISOString(),
      };
      const completedConversation: ConversationRecord = {
        ...optimisticConversation,
        previousResponseId: turn.responseId,
        updatedAt: assistantMessage.createdAt,
        messages: [...optimisticConversation.messages, assistantMessage],
      };
      updateConversations(
        upsertConversation(optimisticConversations, completedConversation),
        conversation.id,
        {
          scrollToBottom: autoFollowScrollRef.current,
          resetFollowState: autoFollowScrollRef.current,
        }
      );

      if (conversation.messages.length === 0) {
        void createConversationTitle({
          profile: activeProfile,
          apiKey: apiKey.trim(),
          userText: trimmed,
          assistantText: assistantMessage.text,
          language: uiLanguage,
        }).then((generatedTitle) => {
          if (generatedTitle.trim()) {
            renameConversation(conversation.id, generatedTitle);
          }
        });
      }
    } catch (error) {
      clearStreamingFlushTimer();
      if (abortController.signal.aborted) {
        const stoppedMessage: ChatMessage = {
          ...streamingAssistantMessage,
          text: streamingTextRef.current || copy.generationStopped,
          createdAt: new Date().toISOString(),
        };
        const stoppedConversation: ConversationRecord = {
          ...optimisticConversation,
          updatedAt: stoppedMessage.createdAt,
          messages: [...optimisticConversation.messages, stoppedMessage],
        };
        updateConversations(
          upsertConversation(optimisticConversations, stoppedConversation),
          conversation.id,
          {
            scrollToBottom: autoFollowScrollRef.current,
            resetFollowState: autoFollowScrollRef.current,
          }
        );
        return;
      }

      const message = formatApiError(error);
      const failedConversation: ConversationRecord = {
        ...optimisticConversation,
        updatedAt: new Date().toISOString(),
        messages: [
          ...optimisticConversation.messages,
          {
            id: makeId('msg'),
            role: 'assistant',
            text: 'Request failed.',
            createdAt: new Date().toISOString(),
            attachments: [],
            error: message,
          },
        ],
      };
      updateConversations(
        upsertConversation(optimisticConversations, failedConversation),
        conversation.id,
        {
          scrollToBottom: autoFollowScrollRef.current,
          resetFollowState: autoFollowScrollRef.current,
        }
      );
      Alert.alert(copy.sendFailed, message);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      streamingConversationIdRef.current = null;
      streamingMessageIdRef.current = null;
      streamingTextRef.current = '';
      streamingAutoFollowEnabledRef.current = false;
      setSending(false);
    }
  }

  async function regenerateAssistantMessage(messageId: string) {
    if (sending || !activeConversation) {
      return;
    }
    if (!apiKey.trim()) {
      openSettings();
      Alert.alert(copy.apiKeyRequiredTitle, copy.apiKeyRequiredMessage);
      return;
    }

    const assistantIndex = activeConversation.messages.findIndex(
      (message) => message.id === messageId && message.role === 'assistant'
    );
    if (assistantIndex <= 0) {
      return;
    }

    let userIndex = assistantIndex - 1;
    while (userIndex >= 0 && activeConversation.messages[userIndex].role !== 'user') {
      userIndex -= 1;
    }
    if (userIndex < 0) {
      return;
    }

    const nextUserMessage = activeConversation.messages[userIndex];
    const previousMessages = activeConversation.messages.slice(0, userIndex);
    const preservedMessages = activeConversation.messages.slice(0, userIndex + 1);
    const removedMessages = activeConversation.messages.slice(userIndex + 1);
    const previousResponseId =
      [...previousMessages].reverse().find((message) => message.role === 'assistant' && message.responseId)?.responseId ??
      null;
    const contextConversation: ConversationRecord = {
      ...activeConversation,
      messages: previousMessages,
      previousResponseId,
    };
    const streamingAssistantMessage = createAssistantMessage('', '');
    const optimisticConversation: ConversationRecord = {
      ...activeConversation,
      model: activeProfile.model,
      assistantKind: classifyModel(activeProfile.model),
      updatedAt: new Date().toISOString(),
      messages: [...preservedMessages, streamingAssistantMessage],
    };

    await deleteAttachmentRecords(removedMessages.flatMap((message) => message.attachments)).catch(() => undefined);
    updateConversations(upsertConversation(persisted.conversations, optimisticConversation), activeConversation.id);
    setChatMenuVisible(false);
    setAttachmentMenuVisible(false);
    setSending(true);
    streamingAutoFollowEnabledRef.current = false;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    streamingTextRef.current = '';
    streamingConversationIdRef.current = activeConversation.id;
    streamingMessageIdRef.current = streamingAssistantMessage.id;

    try {
      const turn = await createAssistantTurn({
        profile: activeProfile,
        apiKey: apiKey.trim(),
        conversation: contextConversation,
        nextUserMessage,
        signal: abortController.signal,
        onTextDelta: (delta) => {
          streamingTextRef.current += delta;
          scheduleStreamingFlush();
        },
      });
      clearStreamingFlushTimer();
      const assistantMessage: ChatMessage = {
        ...streamingAssistantMessage,
        text: turn.assistantText || streamingTextRef.current || '(empty response)',
        responseId: turn.responseId,
        attachments: turn.attachments,
        createdAt: new Date().toISOString(),
      };
      const completedConversation: ConversationRecord = {
        ...optimisticConversation,
        previousResponseId: turn.responseId,
        updatedAt: assistantMessage.createdAt,
        messages: [...preservedMessages, assistantMessage],
      };
      updateConversations(
        upsertConversation(persisted.conversations, completedConversation),
        activeConversation.id,
        {
          scrollToBottom: autoFollowScrollRef.current,
          resetFollowState: autoFollowScrollRef.current,
        }
      );
    } catch (error) {
      clearStreamingFlushTimer();
      const fallbackText = abortController.signal.aborted ? copy.generationStopped : 'Request failed.';
      const regeneratedMessage: ChatMessage = {
        ...streamingAssistantMessage,
        text: streamingTextRef.current || fallbackText,
        createdAt: new Date().toISOString(),
        error: abortController.signal.aborted ? undefined : formatApiError(error),
      };
      const failedConversation: ConversationRecord = {
        ...optimisticConversation,
        updatedAt: regeneratedMessage.createdAt,
        messages: [...preservedMessages, regeneratedMessage],
      };
      updateConversations(
        upsertConversation(persisted.conversations, failedConversation),
        activeConversation.id,
        {
          scrollToBottom: autoFollowScrollRef.current,
          resetFollowState: autoFollowScrollRef.current,
        }
      );
      if (!abortController.signal.aborted) {
        Alert.alert(copy.sendFailed, regeneratedMessage.error ?? copy.sendFailed);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      streamingConversationIdRef.current = null;
      streamingMessageIdRef.current = null;
      streamingTextRef.current = '';
      streamingAutoFollowEnabledRef.current = false;
      setSending(false);
    }
  }

  async function editUserMessage(messageId: string, nextText: string) {
    if (sending || !activeConversation) {
      return;
    }
    const trimmed = nextText.trim();
    if (!trimmed || !apiKey.trim()) {
      if (!apiKey.trim()) {
        openSettings();
        Alert.alert(copy.apiKeyRequiredTitle, copy.apiKeyRequiredMessage);
      }
      return;
    }

    const userIndex = activeConversation.messages.findIndex(
      (message) => message.id === messageId && message.role === 'user'
    );
    if (userIndex < 0) {
      return;
    }

    const currentUserMessage = activeConversation.messages[userIndex];
    const assistantIndex = activeConversation.messages.findIndex(
      (message, index) => index > userIndex && message.role === 'assistant'
    );
    const currentAssistantMessage = assistantIndex >= 0 ? activeConversation.messages[assistantIndex] : undefined;
    const variants = normalizeMessageVariants(currentUserMessage, currentAssistantMessage);
    const nextVariantIndex = variants.length;
    const editedUserMessage: ChatMessage = {
      ...currentUserMessage,
      text: trimmed,
      attachments: currentUserMessage.attachments,
      activeVariantIndex: nextVariantIndex,
      variants: [
        ...variants,
        {
          id: makeId('variant'),
          text: trimmed,
          createdAt: new Date().toISOString(),
          attachments: currentUserMessage.attachments,
        },
      ],
    };
    const previousMessages = activeConversation.messages.slice(0, userIndex);
    const afterAssistantIndex = assistantIndex >= 0 ? assistantIndex + 1 : userIndex + 1;
    const suffixMessages = activeConversation.messages.slice(afterAssistantIndex);
    const removedMessages = assistantIndex >= 0
      ? [activeConversation.messages[assistantIndex], ...suffixMessages]
      : suffixMessages;
    const previousResponseId =
      [...previousMessages].reverse().find((message) => message.role === 'assistant' && message.responseId)?.responseId ??
      null;
    const contextConversation: ConversationRecord = {
      ...activeConversation,
      messages: previousMessages,
      previousResponseId,
    };
    const streamingAssistantMessage = createAssistantMessage('', '');
    const optimisticConversation: ConversationRecord = {
      ...activeConversation,
      model: activeProfile.model,
      assistantKind: classifyModel(activeProfile.model),
      updatedAt: new Date().toISOString(),
      messages: [...previousMessages, editedUserMessage, streamingAssistantMessage],
      previousResponseId,
    };

    await deleteAttachmentRecords(removedMessages.flatMap((message) => message.attachments)).catch(() => undefined);
    updateConversations(upsertConversation(persisted.conversations, optimisticConversation), activeConversation.id);
    setChatMenuVisible(false);
    setAttachmentMenuVisible(false);
    setSending(true);
    streamingAutoFollowEnabledRef.current = false;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    streamingTextRef.current = '';
    streamingConversationIdRef.current = activeConversation.id;
    streamingMessageIdRef.current = streamingAssistantMessage.id;

    try {
      const turn = await createAssistantTurn({
        profile: activeProfile,
        apiKey: apiKey.trim(),
        conversation: contextConversation,
        nextUserMessage: editedUserMessage,
        signal: abortController.signal,
        onTextDelta: (delta) => {
          streamingTextRef.current += delta;
          scheduleStreamingFlush();
        },
      });
      clearStreamingFlushTimer();
      const assistantMessage: ChatMessage = {
        ...streamingAssistantMessage,
        text: turn.assistantText || streamingTextRef.current || '(empty response)',
        responseId: turn.responseId,
        attachments: turn.attachments,
        createdAt: new Date().toISOString(),
      };
      const completedUserMessage: ChatMessage = {
        ...editedUserMessage,
        variants: editedUserMessage.variants?.map((variant, index) =>
          index === nextVariantIndex
            ? {
                ...variant,
                assistantMessageId: assistantMessage.id,
                assistantText: assistantMessage.text,
                assistantResponseId: assistantMessage.responseId,
                assistantError: assistantMessage.error,
              }
            : variant
        ),
      };
      const completedConversation: ConversationRecord = {
        ...optimisticConversation,
        previousResponseId: turn.responseId,
        updatedAt: assistantMessage.createdAt,
        messages: [...previousMessages, completedUserMessage, assistantMessage],
      };
      updateConversations(
        upsertConversation(persisted.conversations, completedConversation),
        activeConversation.id,
        {
          scrollToBottom: autoFollowScrollRef.current,
          resetFollowState: autoFollowScrollRef.current,
        }
      );
    } catch (error) {
      clearStreamingFlushTimer();
      const assistantMessage: ChatMessage = {
        ...streamingAssistantMessage,
        text: streamingTextRef.current || (abortController.signal.aborted ? copy.generationStopped : 'Request failed.'),
        createdAt: new Date().toISOString(),
        error: abortController.signal.aborted ? undefined : formatApiError(error),
      };
      const failedUserMessage: ChatMessage = {
        ...editedUserMessage,
        variants: editedUserMessage.variants?.map((variant, index) =>
          index === nextVariantIndex
            ? {
                ...variant,
                assistantMessageId: assistantMessage.id,
                assistantText: assistantMessage.text,
                assistantResponseId: assistantMessage.responseId,
                assistantError: assistantMessage.error,
              }
            : variant
        ),
      };
      const failedConversation: ConversationRecord = {
        ...optimisticConversation,
        updatedAt: assistantMessage.createdAt,
        messages: [...previousMessages, failedUserMessage, assistantMessage],
      };
      updateConversations(
        upsertConversation(persisted.conversations, failedConversation),
        activeConversation.id,
        {
          scrollToBottom: autoFollowScrollRef.current,
          resetFollowState: autoFollowScrollRef.current,
        }
      );
      if (!abortController.signal.aborted) {
        Alert.alert(copy.sendFailed, assistantMessage.error ?? copy.sendFailed);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      streamingConversationIdRef.current = null;
      streamingMessageIdRef.current = null;
      streamingTextRef.current = '';
      streamingAutoFollowEnabledRef.current = false;
      setSending(false);
    }
  }

  function switchUserMessageVariant(messageId: string, direction: -1 | 1) {
    if (!activeConversation) {
      return;
    }
    const userIndex = activeConversation.messages.findIndex(
      (message) => message.id === messageId && message.role === 'user'
    );
    if (userIndex < 0) {
      return;
    }
    const currentUserMessage = activeConversation.messages[userIndex];
    const assistantIndex = activeConversation.messages.findIndex(
      (message, index) => index > userIndex && message.role === 'assistant'
    );
    const currentAssistantMessage = assistantIndex >= 0 ? activeConversation.messages[assistantIndex] : undefined;
    const variants = normalizeMessageVariants(currentUserMessage, currentAssistantMessage);
    if (variants.length <= 1) {
      return;
    }
    const currentIndex = Math.min(Math.max(currentUserMessage.activeVariantIndex ?? 0, 0), variants.length - 1);
    const nextIndex = (currentIndex + direction + variants.length) % variants.length;
    const nextVariant = variants[nextIndex];
    const nextUserMessage: ChatMessage = {
      ...currentUserMessage,
      text: nextVariant.text,
      createdAt: nextVariant.createdAt,
      attachments: nextVariant.attachments,
      variants,
      activeVariantIndex: nextIndex,
    };
    const nextMessages = [...activeConversation.messages];
    nextMessages[userIndex] = nextUserMessage;
    if (assistantIndex >= 0) {
      nextMessages[assistantIndex] = {
        ...nextMessages[assistantIndex],
        text: nextVariant.assistantText ?? '',
        responseId: nextVariant.assistantResponseId,
        error: nextVariant.assistantError,
      };
    }
    const previousResponseId =
      [...nextMessages].reverse().find((message) => message.role === 'assistant' && message.responseId)?.responseId ??
      null;
    updateConversations(
      upsertConversation(persisted.conversations, {
        ...activeConversation,
        previousResponseId,
        updatedAt: new Date().toISOString(),
        messages: nextMessages,
      }),
      activeConversation.id
    );
  }

  regenerateAssistantMessageRef.current = (messageId: string) => {
    void regenerateAssistantMessage(messageId);
  };
  openPendingAttachmentRef.current = openPendingAttachment;
  removePendingAttachmentRef.current = removePendingAttachment;
  openConversationAttachmentRef.current = openConversationAttachment;
  editUserMessageRef.current = (messageId: string, nextText: string) => {
    void editUserMessage(messageId, nextText);
  };
  switchUserMessageVariantRef.current = switchUserMessageVariant;

  async function createNewSession() {
    await activateFreshSession();
    closeSettingsPanel({ returnToDrawer: false });
  }

  function openSessionsDrawer(velocity = 0) {
    setChatMenuVisible(false);
    setAttachmentMenuVisible(false);
    setSessionsVisible(true);
    if (velocity > 0) {
      sessionDrawerRef.current?.openDrawer({ velocity });
      return;
    }

    sessionDrawerRef.current?.openDrawer();
  }

  function closeSessionsDrawer(animate = true, velocity = 0) {
    if (!animate) {
      resetSessionDrawerUi();
      setSessionsVisible(false);
      sessionDrawerRef.current?.closeDrawer({ speed: 1000 });
      return;
    }

    if (velocity < 0) {
      sessionDrawerRef.current?.closeDrawer({ velocity });
      return;
    }

    sessionDrawerRef.current?.closeDrawer();
  }

  function openSettingsFromSessions() {
    void openSettings('drawer');
  }

  function toggleSessionSelection(conversationId: string) {
    setSelectedSessionIds((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId]
    );
  }

  function toggleSessionSelectionMode() {
    setSessionSelectionMode((current) => {
      if (current) {
        setSelectedSessionIds([]);
        setSelectedExportMenuVisible(false);
      }
      return !current;
    });
  }

  async function exportSelectedSessionFiles(format: 'markdown' | 'json') {
    const selected = sortedConversations.filter((conversation) => selectedSessionIds.includes(conversation.id));
    if (selected.length === 0) {
      return;
    }

    const exported = await exportConversationsToUserDirectory({
      conversations: selected,
      format,
      defaultTitle: copy.newSession,
    });
    if (!exported) {
      return;
    }

    setSelectedExportMenuVisible(false);
    Alert.alert(
      copy.exportSelectedSessionsTitle,
      format === 'json' ? copy.exportedSessionJson(exported.fileName) : copy.exportedSessionMarkdown(exported.fileName)
    );
    setSessionSelectionMode(false);
    setSelectedSessionIds([]);
  }

  function promptSelectedSessionExports() {
    const count = selectedSessionIds.length;
    if (count === 0) {
      return;
    }

    setSelectedExportMenuVisible(true);
  }

  function toggleSessionSearch() {
    setSessionSearchVisible((visible) => {
      if (visible) {
        setSessionSearchQuery('');
        setSessionSearchRaised(false);
      }
      return !visible;
    });
  }

  async function deleteSelectedSessions() {
    const selectedIds = new Set(selectedSessionIds);
    if (selectedIds.size === 0) {
      return;
    }

    const selectedConversations = persisted.conversations.filter((conversation) => selectedIds.has(conversation.id));
    await deleteAttachmentRecords(selectedConversations.flatMap(getConversationAttachments)).catch(() => undefined);
    const conversations = persisted.conversations.filter((conversation) => !selectedIds.has(conversation.id));
    const nextActiveId = selectedIds.has(persisted.activeConversationId ?? '')
      ? conversations[0]?.id ?? null
      : persisted.activeConversationId;
    updateConversations(conversations, nextActiveId);
    setSelectedSessionIds([]);
    setSessionSelectionMode(false);
    setSelectedExportMenuVisible(false);
  }

  function confirmDeleteSelectedSessions() {
    const count = selectedSessionIds.length;
    if (count === 0) {
      return;
    }

    Alert.alert(copy.deleteSessionTitle, copy.selectedSessionsDeleteMessage(count), [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: () => {
          void deleteSelectedSessions();
        },
      },
    ]);
  }

  function togglePinConversation(conversationId: string) {
    setPersisted((current) => ({
      ...current,
      conversations: current.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              pinned: !conversation.pinned,
            }
          : conversation
      ),
    }));
    setSessionContextMenuId(null);
  }

  async function shareActiveConversation() {
    setChatMenuVisible(false);
    if (!activeConversation) {
      return;
    }
    await Share.share({
      title: activeConversation.title,
      message: formatConversationMarkdown(activeConversation),
    }).catch(() => undefined);
  }

  function confirmDeleteActiveConversation() {
    setChatMenuVisible(false);
    if (!activeConversation) {
      return;
    }
    confirmDeleteConversation(activeConversation.id);
  }

  function openConversation(conversationId: string) {
    if (sessionSelectionMode) {
      toggleSessionSelection(conversationId);
      return;
    }
    shouldScrollToBottomRef.current = true;
    pendingScrollToBottomCountRef.current = 2;
    autoFollowScrollRef.current = true;
    streamingAutoFollowEnabledRef.current = false;
    setIsChatNearBottom(true);
    setPersisted((current) => ({
      ...current,
      activeConversationId: conversationId,
    }));
    setSelectedSessionIds([]);
    setSessionSelectionMode(false);
    setSelectedExportMenuVisible(false);
    closeSessionsDrawer();
  }

  function renameConversation(conversationId: string, title: string) {
    const nextTitle = trimTitle(title, copy.newSession);
    setPersisted((current) => ({
      ...current,
      conversations: current.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: nextTitle,
              updatedAt: new Date().toISOString(),
            }
          : conversation
      ),
    }));
  }

  function promptRenameConversation(conversation: ConversationRecord) {
    setSessionContextMenuId(null);
    setRenamingConversationId(conversation.id);
    setDraftSessionTitle(conversation.title);
  }

  function closeRenameModal() {
    setRenamingConversationId(null);
    setDraftSessionTitle('');
  }

  function saveRenamedConversation() {
    if (!renamingConversationId) {
      return;
    }
    renameConversation(renamingConversationId, draftSessionTitle);
    closeRenameModal();
  }

  async function exportConversationFile(conversation: ConversationRecord, format: 'markdown' | 'json') {
    const exported = await exportConversationsToUserDirectory({
      conversations: [conversation],
      format,
      defaultTitle: copy.newSession,
    });
    if (!exported) {
      return;
    }

    Alert.alert(
      copy.exportSession,
      format === 'json' ? copy.exportedSessionJson(exported.fileName) : copy.exportedSessionMarkdown(exported.fileName)
    );
  }

  async function deleteConversation(conversationId: string) {
    const conversation = persisted.conversations.find((item) => item.id === conversationId);
    if (conversation) {
      await deleteAttachmentRecords(getConversationAttachments(conversation)).catch(() => undefined);
    }
    const conversations = persisted.conversations.filter((item) => item.id !== conversationId);
    const nextActiveId =
      persisted.activeConversationId === conversationId ? conversations[0]?.id ?? null : persisted.activeConversationId;
    setSelectedSessionIds((current) => current.filter((id) => id !== conversationId));
    updateConversations(conversations, nextActiveId);
  }

  function confirmDeleteConversation(conversationId: string) {
    setSessionContextMenuId(null);
    Alert.alert(copy.deleteSessionTitle, uiLanguage === 'zh' ? '确定删除该会话？' : 'Delete this conversation?', [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: () => {
          void deleteConversation(conversationId);
        },
      },
    ]);
  }

  function applyChatBubbleOpacity(opacity: ChatBubbleOpacity) {
    const nextOpacity = normalizeChatBubbleOpacity(opacity);
    setPersisted((current) => {
      if (Math.abs((current.chatBubbleOpacity ?? DEFAULT_CHAT_BUBBLE_OPACITY) - nextOpacity) <= 0.0001) {
        return current;
      }
      return {
        ...current,
        chatBubbleOpacity: nextOpacity,
      };
    });
  }

  async function clearChatRecordsOnly() {
    setSavingProfile(true);
    try {
      const recovery = await clearChatsAndRecoverProfileState();
      skipNextPersistRef.current = true;
      setPersisted(recovery.persisted);
      setDraftProfile(recovery.activeProfile);
      setApiKey(recovery.activeProfileKey);
      setComposerText('');
      setPendingAttachments([]);
      setUnreadableConversationIds([]);
      setAttachmentCacheStats(null);
      closeSettingsPanel({ returnToDrawer: false });
      closeSessionsDrawer(false);
      closeBottomSheet(false);
      setSettingsSection('root');
    } catch (error) {
      Alert.alert(copy.clearFailed, error instanceof Error ? error.message : copy.clearFailedFallback);
    } finally {
      setSavingProfile(false);
    }
  }

  async function clearAttachmentCacheOnly() {
    setSavingProfile(true);
    try {
      await clearAttachmentCacheFiles();
      await refreshAttachmentCacheStats();
      Alert.alert(copy.attachmentCacheTitle, copy.clearAttachmentCacheSuccess);
    } catch (error) {
      Alert.alert(copy.clearFailed, error instanceof Error ? error.message : copy.clearFailedFallback);
    } finally {
      setSavingProfile(false);
    }
  }

  async function openStorageLocation(
    locationUri: string,
    fallbackTitle: string,
    fallbackMessage: (uri: string) => string
  ) {
    const result = await openStorageLocationWithClipboard(locationUri);
    if (result.kind === 'opened') {
      return;
    }

    Alert.alert(fallbackTitle, fallbackMessage(result.uri));
  }

  function confirmClearLocalData() {
    Alert.alert(copy.clearDataTitle, copy.clearDataMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.clear,
        style: 'destructive',
        onPress: () => {
          void clearChatRecordsOnly();
        },
      },
    ]);
  }

  function confirmClearAttachmentCache() {
    Alert.alert(copy.clearAttachmentCacheTitle, copy.clearAttachmentCacheMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.clear,
        style: 'destructive',
        onPress: () => {
          void clearAttachmentCacheOnly();
        },
      },
    ]);
  }

  function confirmStartupRecovery() {
    Alert.alert(copy.loadingRecoveryTitle, copy.loadingRecoveryMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.loadingRecoveryAction,
        style: 'destructive',
        onPress: () => {
          void recoverFromStartupStall();
        },
      },
    ]);
  }

  async function recoverFromStartupStall() {
    try {
      startupBootstrapCancelledRef.current = true;
      if (startupAttachmentSweepTimerRef.current) {
        clearTimeout(startupAttachmentSweepTimerRef.current);
        startupAttachmentSweepTimerRef.current = null;
      }
      if (startupRecoveryTimerRef.current) {
        clearTimeout(startupRecoveryTimerRef.current);
        startupRecoveryTimerRef.current = null;
      }
      const rawBackup = await exportRawChatStorageBackupToUserDirectory({
        manifestLines: [
          'Triggered from startup recovery after local chat bootstrap stalled.',
          'The structured chat export path may fail when AsyncStorage rows exceed CursorWindow limits.',
        ],
      }).catch(() => null);
      const recovery = await clearChatsAndRecoverProfileState();
      skipNextPersistRef.current = true;
      setPersisted(recovery.persisted);
      setDraftProfile(recovery.activeProfile);
      setApiKey(recovery.activeProfileKey);
      setComposerText('');
      setPendingAttachments([]);
      setUnreadableConversationIds([]);
      setStartupRecoveryVisible(false);
      setReady(true);
      Alert.alert(
        copy.loadingRecoveryTitle,
        rawBackup
          ? copy.loadingRecoverySuccessWithBackup(rawBackup.folderName)
          : copy.loadingRecoverySuccess
      );
    } catch (error) {
      Alert.alert(copy.clearFailed, error instanceof Error ? error.message : copy.clearFailedFallback);
    }
  }

  async function exportUnreadableConversation(conversationId: string) {
    try {
      const result = await exportUnreadableConversationBackup(conversationId);
      if (result.kind === 'conversation') {
        Alert.alert(copy.unreadableSessionExportTitle, copy.unreadableSessionExportSuccess(result.fileName));
        return;
      }

      if (result.kind === 'raw-backup') {
        Alert.alert(copy.unreadableSessionExportTitle, copy.unreadableSessionExportFallbackSuccess(result.folderName));
        return;
      }

      Alert.alert(copy.unreadableSessionExportTitle, copy.unreadableSessionExportUnavailable);
    } catch (error) {
      Alert.alert(copy.clearFailed, error instanceof Error ? error.message : copy.clearFailedFallback);
    }
  }

  function confirmDeleteUnreadableConversation(conversationId: string) {
    Alert.alert(copy.unreadableSessionDeleteTitle, copy.unreadableSessionDeleteMessage(conversationId), [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: () => {
          void deleteUnreadableConversation(conversationId);
        },
      },
    ]);
  }

  async function deleteUnreadableConversation(conversationId: string) {
    try {
      setUnreadableConversationIds(await deleteUnreadableConversationRecord(conversationId));
      Alert.alert(copy.unreadableSessionDeleteTitle, copy.unreadableSessionDeleteSuccess);
    } catch (error) {
      Alert.alert(copy.clearFailed, error instanceof Error ? error.message : copy.clearFailedFallback);
    }
  }

  function renderSettingsRoot() {
    const chatBackgroundLabel = persisted.chatBackgroundImageUri
      ? copy.chatBackgroundImageActive
      : copy.chatBackgroundImageInactive;
    const items: Array<{ key: SettingsSection; title: string; subtitle: string; action: 'api' | 'navigate' }> = [
      {
        key: 'api',
        title: copy.apiSection,
        subtitle: `${activeProfile.label} · ${activeProfile.model}`,
        action: 'api',
      },
      {
        key: 'storage',
        title: copy.storageSection,
        subtitle: copy.localStorageTitle,
        action: 'navigate',
      },
      {
        key: 'language',
        title: copy.language,
        subtitle: uiLanguage === 'zh' ? copy.chinese : copy.english,
        action: 'navigate',
      },
      {
        key: 'theme',
        title: copy.themeSection,
        subtitle:
          `${persisted.themeMode === 'dark'
            ? copy.themeDark
            : persisted.themeMode === 'light'
              ? copy.themeLight
              : copy.themeSystem} · ${
            persisted.themePreset === 'graphite'
              ? copy.themePresetGraphite
              : persisted.themePreset === 'sunset'
                ? copy.themePresetSunset
                : persisted.themePreset === 'forest'
                  ? copy.themePresetForest
                  : persisted.themePreset === 'rose'
                    ? copy.themePresetRose
               : copy.themePresetClassic
          } · ${chatBackgroundLabel}`,
        action: 'navigate',
      },
      {
        key: 'interaction',
        title: copy.interactionSection,
        subtitle:
          persisted.interactionSettings.drawerOpenGestureMode === 'edge'
            ? `${copy.drawerGestureModeEdge} · ${persisted.interactionSettings.drawerEdgeWidthPx}px`
            : copy.drawerGestureModeFullscreen,
        action: 'navigate',
      },
      {
        key: 'about',
        title: copy.aboutSection,
        subtitle: copy.createdBy,
        action: 'navigate',
      },
    ];

    return (
      <SettingsRootSection
        theme={theme}
        items={items}
        onOpenApiProfiles={openApiProfiles}
        onNavigate={(sectionKey) => navigateToSettingsSection(sectionKey as SettingsSection)}
      />
    );
  }

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingScreen} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          {startupRecoveryVisible ? (
            <View style={styles.loadingShell}>
              <View style={styles.loadingRecoveryPanel}>
                <Text style={styles.loadingHint}>{copy.loadingTakingLong}</Text>
                <Pressable style={styles.loadingRecoveryButton} onPress={confirmStartupRecovery}>
                  <Text style={styles.loadingRecoveryButtonText}>{copy.loadingRecoveryAction}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const composerDisabled = predictedActiveConversationGuard?.level === 'blocked';
  const canSend = (!!composerText.trim() || pendingAttachments.length > 0) && !composerDisabled;
  const usingInsecureHttp = draftProfile.baseUrl.trim().toLowerCase().startsWith('http://');
  const themedPanel = { backgroundColor: theme.surfaceAlt, borderColor: theme.border };
  const themedFieldInput = { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text };
  const themedSelected = { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder };
  const themedSelectedText = { color: theme.selectedText };
  const themedMutedText = { color: theme.muted };
  const themedSubtleText = { color: theme.subtle };
  const themedControl = { backgroundColor: theme.controlSurface, borderColor: theme.controlBorder };
  const themedComposerSurface = { backgroundColor: theme.composerSurface, borderColor: theme.composerBorder };
  const themedPrimaryAction = { backgroundColor: theme.composerButton };
  const themedPrimaryActionText = { color: theme.composerButtonText };
  const settingsTitle =
    settingsSection === 'root'
      ? copy.settingsTitle
      : settingsSection === 'api'
        ? copy.apiSection
      : settingsSection === 'language'
        ? copy.language
      : settingsSection === 'theme'
        ? copy.themeSection
      : settingsSection === 'interaction'
        ? copy.interactionSection
      : settingsSection === 'storage'
        ? copy.storageSection
      : copy.aboutSection;
  const attachmentCacheSummaryText = attachmentCacheStats
    ? copy.attachmentCacheStats(
        attachmentCacheStats.fileCount,
        formatBytes(attachmentCacheStats.totalBytes),
        attachmentCacheStats.referencedFileCount,
        formatBytes(attachmentCacheStats.referencedTotalBytes)
      )
    : copy.attachmentCacheStats(0, formatBytes(0), 0, formatBytes(0));
  const resolvedChatBackgroundImageOpacity =
    persisted.chatBackgroundImageOpacity ?? DEFAULT_CHAT_BACKGROUND_IMAGE_OPACITY;
  const chatBackgroundOverlayStyle = {
    backgroundColor:
      persisted.chatBackgroundImageUri
        ? multiplyColorAlpha(theme.chatBackgroundOverlay, 1 - resolvedChatBackgroundImageOpacity)
        : theme.chatBackgroundOverlay,
  };
  const effectiveSessionDrawerLockMode: LegacyDrawerLockMode =
    settingsVisible || modelPickerVisible || chatMenuVisible
      ? sessionsVisible
        ? 'locked-open'
        : 'locked-closed'
      : sessionDrawerLockMode;
  const drawerOverlayColor = theme.scheme === 'dark' ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0.22)';
  const drawerEdgeWidth = drawerOpenGestureMode === 'fullscreen' ? windowWidth : drawerOpenEdgeWidth;
  const renderSessionDrawerNavigationView = () => (
    <SafeAreaView
      style={[
        styles.sessionDrawer,
        {
          width: sessionDrawerWidth,
          backgroundColor: theme.surface,
          borderRightWidth: 1,
          borderRightColor: theme.border,
        },
      ]}
      edges={['top', 'left', 'bottom']}
    >
      <View style={[styles.drawerHeader, { paddingTop: drawerTopInset }]}>
        <View style={styles.drawerHeaderActions}>
          <Pressable
            style={[
              styles.drawerIconButton,
              {
                backgroundColor: sessionSearchVisible ? theme.primarySoft : theme.surface,
                borderColor: sessionSearchVisible ? theme.primary : theme.border,
              },
            ]}
            onPress={toggleSessionSearch}
            accessibilityRole="button"
            accessibilityLabel={copy.sessionSearchPlaceholder}
          >
            <SearchIcon color={theme.text} />
          </Pressable>
          <Pressable
            style={[styles.drawerIconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={openSettingsFromSessions}
            accessibilityRole="button"
            accessibilityLabel={copy.settings}
          >
            <SettingsIcon color={theme.text} />
          </Pressable>
        </View>
      </View>

      <SlideFadePresence visible={sessionSearchVisible} from="top" style={styles.drawerSearchWrap}>
        {sessionSearchNeedsRaise && (
          <Pressable
            style={[styles.drawerSearchRaiseButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setSessionSearchRaised((raised) => !raised)}
            accessibilityRole="button"
            accessibilityLabel={copy.expandComposer}
          >
            <DirectionIcon direction={sessionSearchIsRaised ? 'down' : 'up'} color={theme.muted} />
          </Pressable>
        )}
        <TextInput
          value={sessionSearchQuery}
          onChangeText={setSessionSearchQuery}
          style={[
            styles.drawerSearchInput,
            sessionSearchNeedsRaise && styles.drawerSearchInputWithRaise,
            sessionSearchIsRaised && styles.drawerSearchInputRaised,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
          ]}
          placeholder={copy.sessionSearchPlaceholder}
          placeholderTextColor={theme.placeholder}
          autoFocus
          multiline={sessionSearchIsRaised}
          scrollEnabled={sessionSearchIsRaised}
          textAlignVertical="top"
        />
      </SlideFadePresence>

      <View style={styles.drawerSectionHeader}>
        <View style={styles.drawerSectionTitleWrap}>
          <Text style={[styles.drawerSectionLabel, { color: theme.text }]}>{copy.recordsSection}</Text>
        </View>
        <Pressable
          style={[
            styles.drawerHeaderButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
            sessionSelectionMode && [styles.drawerHeaderButtonActive, themedSelected],
            persisted.conversations.length === 0 && styles.disabledAction,
          ]}
          onPress={toggleSessionSelectionMode}
          disabled={persisted.conversations.length === 0}
        >
          <Text
            style={[
              styles.drawerHeaderButtonText,
              { color: theme.subtle },
              sessionSelectionMode && { color: theme.primary },
            ]}
          >
            {sessionSelectionMode ? copy.cancelSelection : copy.selectSessions}
          </Text>
        </Pressable>
        {sessionSelectionMode && (
          <Pressable
            style={[styles.drawerCopyButton, selectedSessionIds.length === 0 && styles.disabledAction]}
            onPress={promptSelectedSessionExports}
            disabled={selectedSessionIds.length === 0}
          >
            <Text style={styles.drawerCopyButtonText}>{copy.exportSelectedSessions}</Text>
          </Pressable>
        )}
        {sessionSelectionMode && (
          <Pressable
            style={[styles.drawerDeleteButton, selectedSessionIds.length === 0 && styles.disabledAction]}
            onPress={confirmDeleteSelectedSessions}
            disabled={selectedSessionIds.length === 0}
          >
            <Text style={styles.drawerDeleteButtonText}>{copy.deleteSelectedSessions}</Text>
          </Pressable>
        )}
      </View>
      {sessionSelectionMode && (
        <Text style={[styles.drawerSelectionText, { color: theme.muted }]}>
          {copy.selectedSessionsCount(selectedSessionIds.length)}
        </Text>
      )}

      <FlatList
        style={styles.drawerHistoryScroll}
        contentContainerStyle={styles.drawerHistoryContent}
        data={visibleConversations}
        keyExtractor={(conversation) => conversation.id}
        renderItem={renderDrawerSession}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={
          <View
            collapsable={false}
            style={[styles.drawerHistoryFooterSwipeArea, { minHeight: drawerBlankSwipeFooterHeight }]}
          />
        }
        ListEmptyComponent={
          <Text style={[styles.emptySessionText, { color: theme.muted }]}>
            {persisted.conversations.length === 0 ? copy.sessionsEmpty : copy.sessionsNoMatches}
          </Text>
        }
      />

      <Pressable
        style={[
          styles.drawerNewChatButton,
          {
            backgroundColor: theme.actionStrong,
            shadowColor: isDark ? '#000000' : '#0F172A',
          },
        ]}
        onPress={createNewSession}
      >
        <PlusIcon light />
        <Text style={[styles.drawerNewChatText, { color: theme.actionStrongText }]}>{copy.newSession}</Text>
      </Pressable>
    </SafeAreaView>
  );

  return (
    <SafeAreaProvider>
      <LinearGradient colors={theme.gradient} style={styles.root}>
        <StatusBar barStyle={theme.statusBar} />
        <LegacyDrawerLayout
          ref={setSessionDrawerInstance}
          drawerPosition="left"
          drawerType="slide"
          drawerWidth={sessionDrawerWidth}
          edgeWidth={drawerEdgeWidth}
          minSwipeDistance={8}
          drawerLockMode={effectiveSessionDrawerLockMode}
          overlayColor={drawerOverlayColor}
          drawerBackgroundColor={theme.surface}
          keyboardDismissMode="none"
          useNativeAnimations
          onDrawerStateChanged={handleSessionDrawerStateChange}
          onDrawerOpen={() => setSessionsVisible(true)}
          onDrawerClose={() => {
            setSessionsVisible(false);
            resetSessionDrawerUi();
          }}
          renderNavigationView={renderSessionDrawerNavigationView}
        >
          <View style={styles.mainScene}>
        {/* Keep the background layer one level above the gradient shell and one level below
            every chat control, so custom images and built-in presets cover the full scene. */}
        <View
          pointerEvents="none"
          style={[
            styles.chatBackgroundLayer,
            {
              backgroundColor: theme.chatBackgroundBase,
            },
          ]}
        >
          {persisted.chatBackgroundImageUri && (
            <Image
              source={{ uri: persisted.chatBackgroundImageUri }}
              style={[
                styles.chatBackgroundImage,
                {
                  opacity: resolvedChatBackgroundImageOpacity,
                },
              ]}
              resizeMode="cover"
            />
          )}
          <View style={[styles.chatBackgroundOverlay, chatBackgroundOverlayStyle]} />
        </View>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            enabled={Platform.OS === 'ios'}
            style={styles.flex}
          >
            <View style={[styles.topBar, { paddingTop: topBarExtraInset }]}>
            <Pressable
              style={[styles.iconAction, themedControl]}
              onPress={() => openSessionsDrawer()}
              accessibilityRole="button"
              accessibilityLabel={copy.openSessions}
            >
              <MenuIcon color={theme.text} />
            </Pressable>
            <Pressable style={styles.sessionSwitcher} onPress={openModelPicker}>
              <View style={[styles.modelPill, themedControl]}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{activeProfile.model}</Text>
              </View>
            </Pressable>
            <View style={styles.topActions}>
              <Pressable
                style={[styles.iconAction, themedControl]}
                onPress={createNewSession}
                accessibilityRole="button"
                accessibilityLabel={copy.newSession}
              >
                <PlusIcon color={theme.text} />
              </Pressable>
              <Pressable
                style={[styles.iconAction, themedControl]}
                onPress={() => setChatMenuVisible((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel="Conversation menu"
              >
                <MoreIcon color={theme.text} />
              </Pressable>
            </View>
            </View>

            {chatMenuVisible && <Pressable style={styles.chatMenuDismiss} onPress={() => setChatMenuVisible(false)} />}
            <SlideFadePresence
              visible={chatMenuVisible}
              from="top"
              style={[styles.chatMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
                <Pressable
                  style={[styles.chatMenuItem, !activeConversation && styles.disabledAction]}
                  onPress={() => {
                    void shareActiveConversation();
                  }}
                  disabled={!activeConversation}
                >
                  <Text style={[styles.chatMenuText, { color: theme.text }]}>{uiLanguage === 'zh' ? '分享' : 'Share'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.chatMenuItem, !activeConversation && styles.disabledAction]}
                  onPress={confirmDeleteActiveConversation}
                  disabled={!activeConversation}
                >
                  <Text style={[styles.chatMenuText, styles.chatMenuDangerText]}>{copy.delete}</Text>
                </Pressable>
            </SlideFadePresence>

            <DrawerGestureContext.Provider value={drawerGestureContextValue}>
              <View style={styles.chatShell}>
                <View style={styles.chatScrollWrap}>
                  <ScrollView
                    ref={scrollRef}
                    style={styles.chatScroll}
                    contentContainerStyle={[styles.chatContent, { paddingBottom: chatContentBottomPadding }]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    nestedScrollEnabled
                    onScroll={handleChatScroll}
                    scrollEventThrottle={80}
                    onContentSizeChange={handleChatContentSizeChange}
                  >
                    {activeConversation ? (
                      activeConversation.messages.length > 0 ? (
                        <>
                          {activeConversationDisplayGuard && activeConversationDisplayGuard.level !== 'safe' && (
                            <View
                              style={[
                                styles.conversationLengthNotice,
                                activeConversationDisplayGuard.level === 'blocked'
                                  ? styles.conversationLengthNoticeBlocked
                                  : styles.conversationLengthNoticeWarning,
                              ]}
                            >
                              <View style={styles.conversationLengthNoticeHeader}>
                                <Text style={styles.conversationLengthNoticeTitle}>
                                  {activeConversationDisplayGuard.level === 'blocked'
                                    ? copy.conversationLengthBlockedTitle
                                    : copy.conversationLengthWarningTitle}
                                </Text>
                                <View
                                  style={[
                                    styles.conversationLengthInlineBadge,
                                    activeConversationDisplayGuard.level === 'blocked'
                                      ? styles.drawerSessionGuardBadgeBlocked
                                      : styles.drawerSessionGuardBadgeWarning,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.drawerSessionGuardBadgeText,
                                      activeConversationDisplayGuard.level === 'blocked'
                                        ? styles.drawerSessionGuardBadgeTextBlocked
                                        : styles.drawerSessionGuardBadgeTextWarning,
                                    ]}
                                  >
                                    {conversationStatusBadgeCopy(activeConversationDisplayGuard)}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.conversationLengthNoticeText}>
                                {activeConversationDisplayGuard.level === 'blocked'
                                  ? copy.conversationLengthBlockedMessage(
                                      activeConversationDisplayGuard.messageCount,
                                      activeConversationDisplayGuard.blockMessageCount,
                                      formatBytes(activeConversationDisplayGuard.storageBytes),
                                      formatBytes(activeConversationDisplayGuard.blockBytes)
                                    )
                                  : copy.conversationLengthWarningMessage(
                                      activeConversationDisplayGuard.messageCount,
                                      activeConversationDisplayGuard.blockMessageCount,
                                      formatBytes(activeConversationDisplayGuard.storageBytes),
                                      formatBytes(activeConversationDisplayGuard.blockBytes)
                                    )}
                              </Text>
                              <Pressable
                                style={styles.conversationLengthNoticeButton}
                                onPress={() => {
                                  void activateFreshSession({ preserveDraft: true });
                                }}
                              >
                                <Text style={styles.conversationLengthNoticeButtonText}>
                                  {copy.conversationLengthNewSession}
                                </Text>
                              </Pressable>
                            </View>
                          )}
                          {hiddenConversationMessageCount > 0 && (
                            <View
                              style={[
                                styles.conversationWindowNotice,
                                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                              ]}
                            >
                              <Text style={[styles.conversationWindowNoticeTitle, { color: theme.text }]}>
                                {uiLanguage === 'zh' ? '超长会话保护已启用' : 'Large chat protection is on'}
                              </Text>
                              <Text style={[styles.conversationWindowNoticeText, { color: theme.muted }]}>
                                {uiLanguage === 'zh'
                                  ? `当前先显示最近 ${visibleConversationMessages.length} / ${activeConversation.messages.length} 条消息，避免超长会话拖慢启动或首屏。`
                                  : `Showing the latest ${visibleConversationMessages.length} of ${activeConversation.messages.length} messages first so very large chats do not block startup.`}
                              </Text>
                              <Pressable
                                style={[
                                  styles.conversationWindowNoticeButton,
                                  { backgroundColor: theme.surface, borderColor: theme.border },
                                ]}
                                onPress={loadEarlierConversationMessages}
                              >
                                <Text
                                  style={[
                                    styles.conversationWindowNoticeButtonText,
                                    { color: theme.primary },
                                  ]}
                                >
                                  {uiLanguage === 'zh'
                                    ? `加载更早的 ${Math.min(LOAD_MORE_CONVERSATION_MESSAGES_STEP, hiddenConversationMessageCount)} 条消息`
                                    : `Load ${Math.min(LOAD_MORE_CONVERSATION_MESSAGES_STEP, hiddenConversationMessageCount)} earlier messages`}
                                </Text>
                              </Pressable>
                            </View>
                          )}
                          {visibleConversationMessages.map((message) => (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              language={uiLanguage}
                              theme={theme}
                              bubbleOpacity={persisted.chatBubbleOpacity ?? DEFAULT_CHAT_BUBBLE_OPACITY}
                              isStreaming={sending && message.id === streamingMessageIdRef.current}
                              onRegenerate={handleRegenerateMessage}
                              onEditUserMessage={handleEditUserMessage}
                              onSwitchVariant={handleSwitchUserMessageVariant}
                              onOpenAttachment={handleOpenConversationAttachment}
                            />
                          ))}
                        </>
                      ) : (
                        <View style={styles.emptyStateCard}>
                          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>{activeConversation.title}</Text>
                          <Text style={[styles.emptyStateText, { color: theme.muted }]}>{copy.emptyStateBody}</Text>
                        </View>
                      )
                    ) : (
                      <View style={styles.emptyStateCard}>
                        <Text style={[styles.emptyStateTitle, { color: theme.text }]}>{copy.noActiveSessionTitle}</Text>
                        <Text style={[styles.emptyStateText, { color: theme.muted }]}>{copy.noActiveSessionBody}</Text>
                      </View>
                    )}

                  </ScrollView>
                </View>

                <Animated.View style={[styles.jumpToLatestWrap, { bottom: jumpToLatestBottomAnimated }]}>
                  <SlideFadePresence
                    visible={!!activeConversation && activeConversation.messages.length > 0 && !isChatNearBottom}
                    from="bottom"
                  >
                    <Pressable
                      style={[
                        styles.jumpToLatestButton,
                        { backgroundColor: theme.controlSurface, borderColor: theme.controlBorder },
                      ]}
                      onPress={jumpToLatest}
                      accessibilityRole="button"
                      accessibilityLabel={copy.jumpToLatest}
                    >
                      <ArrowDown size={16} color={theme.primary} strokeWidth={2.6} />
                      <Text style={[styles.jumpToLatestText, { color: theme.primary }]}>{copy.jumpToLatest}</Text>
                    </Pressable>
                  </SlideFadePresence>
                </Animated.View>

                <Animated.View
                  ref={composerDockRef}
                  onLayout={handleComposerDockLayout}
                  style={[
                    styles.composerDock,
                    { marginBottom: chatComposerMarginBottomAnimated },
                    Platform.OS === 'ios' && { transform: [{ translateY: composerLiftTranslateY }] },
                  ]}
                >
                  <PendingAttachmentBar
                    attachments={pendingAttachments}
                    theme={theme}
                    onOpenAttachment={handleOpenPendingAttachment}
                    onRemoveAttachment={handleRemovePendingAttachment}
                    removeAccessibilityLabel={copy.delete}
                  />
                  <SlideFadePresence
                    visible={attachmentMenuVisible && !composerDisabled}
                    from="bottom"
                    style={styles.attachOptionRow}
                  >
                    <Pressable style={[styles.attachOption, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={attachFromCamera}>
                      <Camera size={18} color={theme.primary} strokeWidth={2.3} />
                      <Text style={[styles.attachOptionText, { color: theme.text }]} numberOfLines={1}>{copy.camera}</Text>
                    </Pressable>
                    <Pressable style={[styles.attachOption, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={attachImages}>
                      <ImageIcon size={18} color={theme.primary} strokeWidth={2.3} />
                      <Text style={[styles.attachOptionText, { color: theme.text }]} numberOfLines={1}>{copy.image}</Text>
                    </Pressable>
                    <Pressable style={[styles.attachOption, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={attachFiles}>
                      <FileText size={18} color={theme.primary} strokeWidth={2.3} />
                      <Text style={[styles.attachOptionText, { color: theme.text }]} numberOfLines={1}>{copy.file}</Text>
                    </Pressable>
                  </SlideFadePresence>
                  <SlideFadePresence
                    visible={!!composerLiveSearchStatus && !composerDisabled}
                    from="bottom"
                    style={[
                      styles.liveSearchHintRow,
                      {
                        backgroundColor:
                          composerLiveSearchStatus === 'ready'
                            ? theme.primarySoft
                            : theme.surface,
                        borderColor:
                          composerLiveSearchStatus === 'ready'
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.liveSearchHintText,
                        {
                          color:
                            composerLiveSearchStatus === 'ready'
                              ? theme.primary
                              : theme.muted,
                        },
                      ]}
                    >
                      {composerLiveSearchStatus === 'ready'
                        ? copy.liveSearchReadyHint
                        : composerLiveSearchStatus === 'disabled'
                          ? copy.liveSearchDisabledHint
                          : copy.liveSearchUnsupportedHint}
                    </Text>
                  </SlideFadePresence>
                  <View style={styles.composerRow}>
                  <Pressable
                    style={[
                      styles.attachButton,
                      {
                        backgroundColor: attachmentMenuVisible ? theme.primarySoft : theme.controlSurface,
                        borderColor: attachmentMenuVisible ? theme.primary : theme.controlBorder,
                      },
                    ]}
                    onPress={() => setAttachmentMenuVisible((visible) => !visible)}
                  disabled={composerDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={copy.attachMenu}
                  >
                    <PlusIcon color={attachmentMenuVisible ? theme.primary : theme.text} />
                  </Pressable>
                <View style={[styles.composerInputWrap, themedComposerSurface]}>
                  {composerNeedsExpand && (
                    <Pressable
                      style={styles.composerExpandButton}
                      onPress={() => setComposerExpanded(true)}
                      disabled={composerDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={copy.expandComposer}
                    >
                      <Maximize2 size={17} color={theme.subtle} strokeWidth={2.2} />
                    </Pressable>
                  )}
                  <Pressable
                    style={[
                      styles.composerOverlayButton,
                      {
                        backgroundColor: theme.composerButton,
                        borderColor: theme.composerButton,
                      },
                      (!sending && !canSend) && styles.disabledAction,
                    ]}
                    onPress={sending ? handleStopGenerating : handleSend}
                    disabled={!sending && !canSend}
                    accessibilityRole="button"
                    accessibilityLabel={sending ? copy.stopGenerating : copy.send}
                  >
                    {sending ? <StopIcon color={theme.composerButtonText} /> : <SendIcon color={theme.composerButtonText} />}
                  </Pressable>
                    <TextInput
                    value={composerText}
                    onChangeText={setComposerText}
                    onFocus={() => {
                      if (Platform.OS === 'android') {
                        const metrics = Keyboard.metrics();
                        if (
                          keyboardInsetBottomRef.current > 0 ||
                          (metrics && Math.max(0, Math.round(metrics.height ?? 0)) > 0)
                        ) {
                          keyboardVisibleRef.current = true;
                        }
                        return;
                      }
                      keyboardVisibleRef.current = true;
                      updateComposerAutoLift();
                    }}
                    onBlur={handleComposerBlur}
                    editable={!composerDisabled}
                    multiline
                    scrollEnabled
                    placeholder={
                      composerDisabled
                        ? copy.conversationLengthComposerBlockedPlaceholder
                        : copy.composerPlaceholder
                    }
                    placeholderTextColor={theme.placeholder}
                    style={[
                      styles.composerInput,
                      styles.composerInputWithActions,
                      composerSingleLine && styles.composerInputSingleLine,
                      { color: theme.text },
                    ]}
                    textAlignVertical={composerSingleLine ? 'center' : 'top'}
                  />
                </View>
                  </View>
                </Animated.View>
              </View>
            </DrawerGestureContext.Provider>
          </KeyboardAvoidingView>
        </SafeAreaView>
          </View>
        </LegacyDrawerLayout>

      <Modal visible={settingsVisible} animationType="none" transparent statusBarTranslucent onRequestClose={goBackFromSettings}>
        <View style={[styles.settingsModalRoot, { backgroundColor: theme.surface }]}>
        <Animated.View
          style={[styles.settingsScreen, { backgroundColor: theme.surface, transform: [{ translateX: settingsPanelTranslateX }] }]}
          onStartShouldSetResponderCapture={() => false}
          onMoveShouldSetResponderCapture={(event) => maybeNavigateSettingsFromTouch(event)}
          onTouchStart={handleSettingsTouchStart}
          onTouchMove={handleSettingsTouchMove}
          onTouchEnd={handleSettingsTouchEnd}
          onTouchCancel={handleSettingsTouchEnd}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'android' ? 'height' : 'padding'}
            enabled={settingsVisible}
            style={styles.flex}
          >
            <SafeAreaView
              style={[styles.settingsScreenSafe, { paddingTop: modalTopInset, backgroundColor: theme.surface }]}
              edges={['top', 'left', 'right', 'bottom']}
            >
            <SettingsHeader
              theme={theme}
              title={settingsTitle}
              subtitle={copy.settingsSubtitle}
              showBackButton={settingsSection !== 'root'}
              onBack={goBackFromSettings}
            />

            <ScrollView
              ref={settingsScrollRef}
              style={styles.settingsScreenScroll}
              contentContainerStyle={[styles.settingsScreenScrollContent, { paddingBottom: 24 + settingsKeyboardInset }]}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                if (!settingsVisible || !settingsFocusedInputRef.current) {
                  return;
                }
                if (!keyboardVisibleRef.current && settingsKeyboardInset <= 0) {
                  return;
                }
                scheduleSettingsInputVisibility(settingsFocusedInputRef.current, false);
              }}
              onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                settingsScrollOffsetRef.current = Math.max(0, event.nativeEvent.contentOffset.y);
              }}
            >
              <Animated.View
                style={[
                  styles.settingsContentScene,
                  {
                    opacity: settingsContentProgress,
                    transform: [{ translateX: settingsContentTranslateX }],
                  },
                ]}
              >
              {settingsSection === 'root' && renderSettingsRoot()}

              {settingsSection === 'api' && (
                <SettingsApiSection
                  theme={theme}
                  copy={{
                    apiProfilesTitle: copy.apiProfilesTitle,
                    newApiProfile: copy.newApiProfile,
                    apiProfilesSubtitle: copy.apiProfilesSubtitle,
                    activeApiProfile: copy.activeApiProfile,
                    basicApiSettings: copy.basicApiSettings,
                    profileLabel: copy.profileLabel,
                    apiPreset: copy.apiPreset,
                    connectionSettings: copy.connectionSettings,
                    testingApiConnection: copy.testingApiConnection,
                    testApiConnection: copy.testApiConnection,
                    deleteApiProfile: copy.deleteApiProfile,
                    endpointMode: copy.endpointMode,
                    baseUrl: copy.baseUrl,
                    baseUrlHint: copy.baseUrlHint,
                    insecureHttpWarning: copy.insecureHttpWarning,
                    apiKey: copy.apiKey,
                    modelAndReasoning: copy.modelAndReasoning,
                    model: copy.model,
                    fetchingModels: copy.fetchingModels,
                    fetchModels: copy.fetchModels,
                    reasoningEffort: copy.reasoningEffort,
                    currentValue: copy.currentValue,
                    fetchReasoningEfforts: copy.fetchReasoningEfforts,
                    reasoningEffortsReady: copy.reasoningEffortsReady,
                    reasoningEffortsUnavailable: copy.reasoningEffortsUnavailable,
                    advancedApiSettings: copy.advancedApiSettings,
                    hideAdvancedSettings: copy.hideAdvancedSettings,
                    showAdvancedSettings: copy.showAdvancedSettings,
                    webSearch: copy.webSearch,
                    webSearchEnabled: copy.webSearchEnabled,
                    webSearchDisabled: copy.webSearchDisabled,
                    webSearchHint: copy.webSearchHint,
                    responseStorage: copy.responseStorage,
                    storageEnabled: copy.storageEnabled,
                    storageDisabled: copy.storageDisabled,
                    projectId: copy.projectId,
                    organization: copy.organization,
                    systemPrompt: copy.systemPrompt,
                    advancedConfigHint: copy.advancedConfigHint,
                  }}
                  uiLanguage={uiLanguage}
                  profiles={persisted.profiles}
                  activeProfileId={persisted.activeProfileId}
                  draftProfile={draftProfile}
                  apiKey={apiKey}
                  availableModels={availableModels}
                  testingProfile={testingProfile}
                  savingProfile={savingProfile}
                  fetchingModels={fetchingModels}
                  usingInsecureHttp={usingInsecureHttp}
                  advancedApiSettingsOpen={advancedApiSettingsOpen}
                  reasoningEffortOptions={reasoningEffortOptions}
                  reasoningEffortsFetched={reasoningEffortsFetched}
                  supportsWebSearch={draftProfileCapabilities.supportsWebSearch}
                  advancedSummary={getAdvancedApiSummary(draftProfile)}
                  profileLabelInputRef={profileLabelInputRef}
                  baseUrlInputRef={baseUrlInputRef}
                  apiKeyInputRef={apiKeyInputRef}
                  modelInputRef={modelInputRef}
                  projectIdInputRef={projectIdInputRef}
                  organizationInputRef={organizationInputRef}
                  systemPromptInputRef={systemPromptInputRef}
                  onCreateNewApiProfile={createNewApiProfile}
                  onSelectDraftApiProfile={selectDraftApiProfile}
                  onFocusApiProfileInput={handleApiProfileInputFocus}
                  onBlurApiProfileInput={handleApiProfileInputBlur}
                  onChangeProfileLabel={(value) => {
                    markDraftApiProfileEdited();
                    setDraftProfile((current) => ({ ...current, label: value }));
                  }}
                  onApplyPreset={(preset) => updateDraftProfileWithReasoningReset((current) => applyApiPreset(current, preset))}
                  onTestApiProfile={handleTestApiProfile}
                  onConfirmDeleteApiProfile={confirmDeleteApiProfile}
                  onSelectProtocol={(protocol) =>
                    updateDraftProfileWithReasoningReset((current) => ({ ...current, apiProtocol: protocol }))
                  }
                  onChangeBaseUrl={(value) => {
                    markDraftApiProfileEdited();
                    setDraftProfile((current) => ({ ...current, baseUrl: value }));
                  }}
                  onChangeApiKey={(value) => {
                    markDraftApiProfileEdited();
                    setApiKey(value);
                  }}
                  onChangeModel={(value) =>
                    updateDraftProfileWithReasoningReset((current) => ({ ...current, model: value }))
                  }
                  onFetchModels={() => {
                    void fetchModelsForDraftProfile();
                  }}
                  onSelectModel={(model) => updateDraftProfileWithReasoningReset((current) => ({ ...current, model }))}
                  onRefreshReasoningEfforts={() => refreshReasoningEffortOptions(draftProfile)}
                  onApplyReasoningEffort={applyReasoningEffort}
                  onToggleAdvancedApiSettings={() => setAdvancedApiSettingsOpen((current) => !current)}
                  onToggleWebSearch={() => {
                    markDraftApiProfileEdited();
                    setDraftProfile((current) => ({ ...current, webSearchEnabled: !current.webSearchEnabled }));
                  }}
                  onToggleStoreResponses={() => {
                    markDraftApiProfileEdited();
                    setDraftProfile((current) => ({ ...current, storeResponses: !current.storeResponses }));
                  }}
                  onChangeProjectId={(value) => {
                    markDraftApiProfileEdited();
                    setDraftProfile((current) => ({ ...current, projectId: value }));
                  }}
                  onChangeOrganization={(value) => {
                    markDraftApiProfileEdited();
                    setDraftProfile((current) => ({ ...current, organization: value }));
                  }}
                  onChangeSystemPrompt={(value) => {
                    markDraftApiProfileEdited();
                    setDraftProfile((current) => ({ ...current, systemPrompt: value }));
                  }}
                />
              )}

              {settingsSection === 'language' && (
                <SettingsLanguageSection
                  theme={theme}
                  copy={{
                    chinese: copy.chinese,
                    english: copy.english,
                  }}
                  uiLanguage={uiLanguage}
                  onApplyUiLanguage={applyUiLanguage}
                />
              )}

              {settingsSection === 'theme' && (
                <SettingsAppearanceSection
                  theme={theme}
                  copy={{
                    themeSection: copy.themeSection,
                    themeModeLabel: copy.themeModeLabel,
                    themePresetLabel: copy.themePresetLabel,
                    themePresetClassic: copy.themePresetClassic,
                    themePresetGraphite: copy.themePresetGraphite,
                    themePresetSunset: copy.themePresetSunset,
                    themePresetForest: copy.themePresetForest,
                    themePresetRose: copy.themePresetRose,
                    chatBackgroundLabel: copy.chatBackgroundLabel,
                    chatBackgroundPlain: copy.chatBackgroundPlain,
                    chatBackgroundGrid: copy.chatBackgroundGrid,
                    chatBackgroundBands: copy.chatBackgroundBands,
                    chatBackgroundImageLabel: copy.chatBackgroundImageLabel,
                    chatBackgroundImagePick: copy.chatBackgroundImagePick,
                    chatBackgroundImageRecrop: copy.chatBackgroundImageRecrop,
                    chatBackgroundImageClear: copy.chatBackgroundImageClear,
                    chatBackgroundImageActive: copy.chatBackgroundImageActive,
                    chatBackgroundImageInactive: copy.chatBackgroundImageInactive,
                    chatBackgroundImageCropHint: copy.chatBackgroundImageCropHint,
                    chatBackgroundImageOpacityLabel: copy.chatBackgroundImageOpacityLabel,
                    chatBackgroundImageOpacityHint: copy.chatBackgroundImageOpacityHint,
                    chatBackgroundImageOpacityPlaceholder: copy.chatBackgroundImageOpacityPlaceholder,
                    chatBubbleOpacityLabel: copy.chatBubbleOpacityLabel,
                    chatBubbleOpacityHint: copy.chatBubbleOpacityHint,
                    chatBubbleOpacityPlaceholder: copy.chatBubbleOpacityPlaceholder,
                    chatBubblePreviewLabel: copy.chatBubblePreviewLabel,
                    appearanceChooseTitle: copy.appearanceChooseTitle,
                    appearanceCollapsedHint: copy.appearanceCollapsedHint,
                    themeLight: copy.themeLight,
                    themeDark: copy.themeDark,
                    themeSystem: copy.themeSystem,
                  }}
                  themeMode={persisted.themeMode}
                  themePreset={persisted.themePreset}
                  chatBackgroundPreset={persisted.chatBackgroundPreset}
                  chatBackgroundImageOpacity={persisted.chatBackgroundImageOpacity as ChatBackgroundImageOpacity}
                  chatBubbleOpacity={persisted.chatBubbleOpacity as ChatBubbleOpacity}
                  chatBackgroundImageUri={persisted.chatBackgroundImageUri}
                  hasChatBackgroundImage={!!persisted.chatBackgroundImageUri}
                  onApplyThemeMode={applyThemeMode}
                  onApplyThemePreset={applyThemePreset}
                  onApplyChatBackgroundImageOpacity={applyChatBackgroundImageOpacity}
                  onApplyChatBubbleOpacity={applyChatBubbleOpacity}
                  onPickChatBackgroundImage={() => {
                    void pickCustomChatBackgroundImage();
                  }}
                  onClearChatBackgroundImage={() => {
                    void clearCustomChatBackgroundImage();
                  }}
                  chatBackgroundImageOpacityInputRef={chatBackgroundOpacityInputRef}
                  chatBubbleOpacityInputRef={chatBubbleOpacityInputRef}
                  onFocusChatBackgroundImageOpacityInput={() => focusSettingsInput(chatBackgroundOpacityInputRef)}
                  onFocusChatBubbleOpacityInput={() => focusSettingsInput(chatBubbleOpacityInputRef)}
                />
              )}

              {settingsSection === 'interaction' && (
                <SettingsInteractionSection
                  theme={theme}
                  copy={{
                    interactionPreviewHint: copy.interactionPreviewHint,
                    drawerGestureTitle: copy.drawerGestureTitle,
                    drawerGestureDescription: copy.drawerGestureDescription,
                    drawerGestureModeLabel: copy.drawerGestureModeLabel,
                    drawerGestureModeFullscreen: copy.drawerGestureModeFullscreen,
                    drawerGestureModeEdge: copy.drawerGestureModeEdge,
                    drawerGesturePreviewTitle: copy.drawerGesturePreviewTitle,
                    drawerGesturePreviewFullscreenHint: copy.drawerGesturePreviewFullscreenHint,
                    drawerGesturePreviewEdgeHint: copy.drawerGesturePreviewEdgeHint,
                    drawerEdgeWidthLabel: copy.drawerEdgeWidthLabel,
                    drawerEdgeWidthHint: copy.drawerEdgeWidthHint,
                    drawerLabTitle: copy.drawerLabTitle,
                    drawerLabDescription: copy.drawerLabDescription,
                    openDrawerLab: copy.openDrawerLab,
                  }}
                  drawerOpenGestureMode={persisted.interactionSettings.drawerOpenGestureMode}
                  drawerEdgeWidthPx={persisted.interactionSettings.drawerEdgeWidthPx}
                  drawerEdgeWidthInputRef={drawerEdgeWidthInputRef}
                  onApplyDrawerOpenGestureMode={applyDrawerOpenGestureMode}
                  onApplyDrawerEdgeWidthPx={applyDrawerEdgeWidthPx}
                  onFocusDrawerEdgeWidthInput={() => focusSettingsInput(drawerEdgeWidthInputRef)}
                  onOpenDrawerLab={() => setDrawerLabVisible(true)}
                />
              )}

              {settingsSection === 'storage' && (
                <SettingsStorageSection
                  theme={theme}
                  copy={copy}
                  attachmentCacheSummary={attachmentCacheSummaryText}
                  refreshingAttachmentCacheStats={refreshingAttachmentCacheStats}
                  savingProfile={savingProfile}
                  unreadableConversationIds={unreadableConversationIds}
                  onOpenChatRecordsLocation={() => {
                    void openStorageLocation(
                      getChatRecordsLocationUri(),
                      copy.storagePathCopiedTitle,
                      copy.storagePathCopiedMessage
                    );
                  }}
                  onOpenAttachmentCacheLocation={() => {
                    void openStorageLocation(
                      getAttachmentCacheLocationUri(),
                      copy.storagePathCopiedTitle,
                      copy.storagePathCopiedMessage
                    );
                  }}
                  onRefreshAttachmentCacheStats={() => {
                    void refreshAttachmentCacheStats();
                  }}
                  onConfirmClearAttachmentCache={confirmClearAttachmentCache}
                  onExportUnreadableConversation={(conversationId) => {
                    void exportUnreadableConversation(conversationId);
                  }}
                  onConfirmDeleteUnreadableConversation={confirmDeleteUnreadableConversation}
                  onConfirmClearLocalData={confirmClearLocalData}
                />
              )}

              {settingsSection === 'about' && (
                <SettingsAboutSection
                  theme={theme}
                  copy={copy}
                  appVersion={APP_VERSION}
                  checkingVersion={checkingVersion}
                  onOpenUrl={openExternalUrl}
                  onCheckLatestVersion={() => {
                    void checkLatestVersion();
                  }}
                />
              )}
              </Animated.View>
            </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>
        </View>
      </Modal>

      <Modal visible={modelPickerVisible} animationType="none" transparent onRequestClose={() => closeBottomSheet()}>
        <View style={styles.modalSheetRoot} pointerEvents={bottomSheetMode === 'models' ? 'auto' : 'none'}>
          <Animated.View style={[styles.modalBackdropLayer, { opacity: bottomSheetBackdropOpacity }]} />
          <Pressable style={styles.modalDismissArea} onPress={() => closeBottomSheet()} />
          <Animated.View
            style={[
              styles.modalCardCompact,
              styles.modelPickerSheet,
              {
                height: modelPickerSheetHeight,
                maxHeight: modelPickerSheetHeight,
                backgroundColor: theme.surface,
                borderColor: theme.border,
                transform: [{ translateY: bottomSheetTranslateY }],
              },
            ]}
          >
            <ModelPickerContent
              profiles={persisted.profiles}
              activeProfileId={persisted.activeProfileId}
              activeModel={activeProfile.model}
              availableModels={availableModels}
              fetchingModels={fetchingModels}
              theme={theme}
              copy={{
                title: copy.modelPickerTitle,
                fetchModels: copy.fetchModels,
                fetchingModels: copy.fetchingModels,
                activeApiProfile: copy.activeApiProfile,
                activeModel: copy.activeModel,
                modelsEmpty: copy.modelsEmpty,
              }}
              onFetchModels={() => {
                void fetchModelsForProfile(activeProfile, apiKey);
              }}
              onSelectProfile={(profileId) => {
                void switchActiveApiProfile(profileId);
              }}
              onLongPressProfile={(profile) => {
                triggerLongPressHaptic();
                void openApiProfileEditorFromPicker(profile);
              }}
              onSelectModel={applyModelToActiveProfile}
            />
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={composerExpanded} animationType="slide" onRequestClose={() => setComposerExpanded(false)}>
        <SafeAreaView
          style={[styles.fullComposerScreen, { backgroundColor: theme.surface }]}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View style={styles.fullComposerHeader}>
            <Pressable style={[styles.fullComposerClose, themedControl]} onPress={() => setComposerExpanded(false)}>
              <X size={19} color={theme.text} strokeWidth={2.4} />
            </Pressable>
          </View>
          <TextInput
            value={composerText}
            onChangeText={setComposerText}
            editable={!composerDisabled}
            multiline
            autoFocus
            scrollEnabled
            placeholder={
              composerDisabled
                ? copy.conversationLengthComposerBlockedPlaceholder
                : copy.composerPlaceholder
            }
            placeholderTextColor={theme.placeholder}
            style={[styles.fullComposerInput, themedFieldInput]}
            textAlignVertical="top"
          />
          <SlideFadePresence
            visible={!!composerLiveSearchStatus && !composerDisabled}
            from="bottom"
            style={[
              styles.fullComposerLiveSearchHint,
              {
                backgroundColor:
                  composerLiveSearchStatus === 'ready'
                    ? theme.primarySoft
                    : theme.surfaceAlt,
                borderColor:
                  composerLiveSearchStatus === 'ready'
                    ? theme.primary
                    : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.liveSearchHintText,
                {
                  color:
                    composerLiveSearchStatus === 'ready'
                      ? theme.primary
                      : theme.muted,
                },
              ]}
            >
              {composerLiveSearchStatus === 'ready'
                ? copy.liveSearchReadyHint
                : composerLiveSearchStatus === 'disabled'
                  ? copy.liveSearchDisabledHint
                  : copy.liveSearchUnsupportedHint}
            </Text>
          </SlideFadePresence>
          <View style={styles.fullComposerActions}>
            <Pressable
              style={[styles.fullComposerSend, { backgroundColor: theme.composerButton }, (!sending && !canSend) && styles.disabledAction]}
              onPress={() => {
                setComposerExpanded(false);
                if (sending) {
                  handleStopGenerating();
                } else {
                  void handleSend();
                }
              }}
              disabled={!sending && !canSend}
            >
              {sending ? <StopIcon color={theme.composerButtonText} /> : <SendIcon color={theme.composerButtonText} />}
              <Text style={[styles.fullComposerSendText, { color: theme.composerButtonText }]}>{sending ? copy.stopGenerating : copy.send}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={selectedExportMenuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedExportMenuVisible(false)}
      >
        <Pressable style={styles.contextMenuBackdrop} onPress={() => setSelectedExportMenuVisible(false)}>
          <View style={styles.sessionContextMenu}>
            <View style={styles.selectedExportMenuHeader}>
              <Text style={styles.selectedExportMenuTitle}>{copy.exportSelectedSessionsTitle}</Text>
              <Text style={styles.selectedExportMenuMessage}>
                {copy.exportSelectedSessionsMessage(selectedSessionIds.length)}
              </Text>
            </View>
            <Pressable
              style={styles.contextMenuItem}
              onPress={() => {
                void exportSelectedSessionFiles('markdown');
              }}
            >
              <View style={styles.contextMenuIconWrap}>
                <FileText size={17} color="#E5E7EB" strokeWidth={2.3} />
              </View>
              <Text style={styles.contextMenuText}>{copy.exportSessionMarkdown}</Text>
            </Pressable>
            <Pressable
              style={styles.contextMenuItem}
              onPress={() => {
                void exportSelectedSessionFiles('json');
              }}
            >
              <View style={styles.contextMenuIconWrap}>
                <FileText size={17} color="#E5E7EB" strokeWidth={2.3} />
              </View>
              <Text style={styles.contextMenuText}>{copy.exportSessionJson}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!sessionContextConversation} animationType="fade" transparent onRequestClose={() => setSessionContextMenuId(null)}>
        <Pressable style={styles.contextMenuBackdrop} onPress={() => setSessionContextMenuId(null)}>
          <View style={styles.sessionContextMenu}>
            <Pressable
              style={styles.contextMenuItem}
              onPress={() => {
                if (sessionContextConversation) {
                  togglePinConversation(sessionContextConversation.id);
                }
              }}
            >
              <View style={styles.contextMenuIconWrap}>
                <PinIcon light />
              </View>
              <Text style={styles.contextMenuText}>
                {sessionContextConversation?.pinned
                  ? uiLanguage === 'zh' ? '取消置顶' : 'Unpin'
                  : uiLanguage === 'zh' ? '置顶' : 'Pin'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.contextMenuItem}
              onPress={() => {
                if (sessionContextConversation) {
                  promptRenameConversation(sessionContextConversation);
                }
              }}
            >
              <View style={styles.contextMenuIconWrap}>
                <EditIcon />
              </View>
              <Text style={styles.contextMenuText}>{copy.renameSession}</Text>
            </Pressable>
            <Pressable
              style={styles.contextMenuItem}
              onPress={() => {
                if (sessionContextConversation) {
                  setSessionContextMenuId(null);
                  void exportConversationFile(sessionContextConversation, 'markdown');
                }
              }}
            >
              <View style={styles.contextMenuIconWrap}>
                <FileText size={17} color="#E5E7EB" strokeWidth={2.3} />
              </View>
              <Text style={styles.contextMenuText}>{copy.exportSessionMarkdown}</Text>
            </Pressable>
            <Pressable
              style={styles.contextMenuItem}
              onPress={() => {
                if (sessionContextConversation) {
                  setSessionContextMenuId(null);
                  void exportConversationFile(sessionContextConversation, 'json');
                }
              }}
            >
              <View style={styles.contextMenuIconWrap}>
                <FileText size={17} color="#E5E7EB" strokeWidth={2.3} />
              </View>
              <Text style={styles.contextMenuText}>{copy.exportSessionJson}</Text>
            </Pressable>
            <Pressable
              style={styles.contextMenuItem}
              onPress={() => {
                if (sessionContextConversation) {
                  confirmDeleteConversation(sessionContextConversation.id);
                }
              }}
            >
              <View style={styles.contextMenuIconWrap}>
                <TrashIcon />
              </View>
              <Text style={[styles.contextMenuText, styles.contextMenuDangerText]}>{copy.delete}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!renamingConversation} animationType="fade" transparent>
        <View style={styles.modalBackdropCentered}>
          <View style={[styles.renameCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{copy.renameSessionTitle}</Text>
            <TextInput
              value={draftSessionTitle}
              onChangeText={setDraftSessionTitle}
              style={[styles.fieldInput, themedFieldInput, styles.renameInput]}
              placeholder={copy.renameSessionPlaceholder}
              placeholderTextColor={theme.placeholder}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalGhost, { borderColor: theme.border }]} onPress={closeRenameModal}>
                <Text style={[styles.modalGhostText, { color: theme.subtle }]}>{copy.cancel}</Text>
              </Pressable>
              <Pressable style={[styles.modalPrimary, themedPrimaryAction]} onPress={saveRenamedConversation}>
                <Text style={[styles.modalPrimaryText, themedPrimaryActionText]}>{copy.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ImageAttachmentViewer
        attachment={previewAttachment}
        closeLabel={copy.close}
        onClose={() => setPreviewAttachment(null)}
      />

      <DrawerGestureLab
        visible={drawerLabVisible}
        language={uiLanguage}
        theme={theme}
        onClose={() => setDrawerLabVisible(false)}
      />
    </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  mainScene: {
    flex: 1,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingShell: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  loadingRecoveryPanel: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  loadingHint: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  loadingRecoveryButton: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#111827',
  },
  loadingRecoveryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sessionSwitcher: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  modelPill: {
    maxWidth: '100%',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingLeft: 12,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
    flexShrink: 1,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatMenuDismiss: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9,
  },
  chatMenu: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 66 : 74,
    right: 14,
    zIndex: 10,
    minWidth: 150,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  chatMenuItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  chatMenuText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  chatMenuDangerText: {
    color: '#DC2626',
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatShell: {
    flex: 1,
  },
  chatBackgroundLayer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  chatBackgroundImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.28,
  },
  chatBackgroundOverlay: {
    ...StyleSheet.absoluteFill,
  },
  chatBackgroundGridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.96,
  },
  chatBackgroundGridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.84,
  },
  chatBackgroundBand: {
    position: 'absolute',
    left: -24,
    right: -24,
    height: 144,
    borderRadius: 48,
    opacity: 0.66,
  },
  chatBackgroundBandTop: {
    top: 56,
    transform: [{ rotate: '-6deg' }],
  },
  chatBackgroundBandMiddle: {
    top: '38%',
    transform: [{ rotate: '4deg' }],
  },
  chatBackgroundBandBottom: {
    bottom: 84,
    transform: [{ rotate: '-5deg' }],
  },
  drawerOpenEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
    backgroundColor: 'transparent',
  },
  chatScrollWrap: {
    flex: 1,
    position: 'relative',
  },
  jumpToLatestWrap: {
    position: 'absolute',
    right: 18,
    zIndex: 6,
  },
  jumpToLatestButton: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  jumpToLatestText: {
    fontSize: 13,
    fontWeight: '800',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  emptyStateCard: {
    marginTop: 36,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  emptyStateTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  liveSearchHintRow: {
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fullComposerLiveSearchHint: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  liveSearchHintText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  conversationWindowNotice: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  conversationWindowNoticeTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  conversationWindowNoticeText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  conversationWindowNoticeButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 12,
  },
  conversationWindowNoticeButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  conversationLengthNotice: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  conversationLengthNoticeWarning: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  conversationLengthNoticeBlocked: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  conversationLengthNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  conversationLengthNoticeTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
  conversationLengthNoticeText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  conversationLengthNoticeButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 12,
  },
  conversationLengthNoticeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  conversationLengthInlineBadge: {
    alignSelf: 'flex-start',
  },
  composerDock: {
    marginHorizontal: 12,
    marginTop: 0,
    paddingBottom: 2,
  },
  composerRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  composerInputWrap: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    padding: 3,
  },
  composerInput: {
    width: '100%',
    minHeight: 38,
    maxHeight: 210,
    color: '#111827',
    fontSize: 15,
    lineHeight: 20,
    paddingLeft: 9,
    paddingRight: 41,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: Platform.OS === 'android' ? 6 : 7,
    textAlignVertical: 'top',
  },
  composerInputWithActions: {
    paddingRight: 41,
  },
  composerInputSingleLine: {
    paddingTop: Platform.OS === 'android' ? 0 : 8,
    paddingBottom: Platform.OS === 'android' ? 0 : 7,
    includeFontPadding: false,
  },  composerOverlayButton: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  composerExpandButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 3,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  composerOverlaySend: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  attachButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  attachOptionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    width: '100%',
  },
  attachOption: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  attachOptionText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  fullComposerScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 28 : 10,
    paddingBottom: 14,
  },
  fullComposerHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },  fullComposerClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullComposerInput: {
    flex: 1,
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    color: '#111827',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fullComposerActions: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
  },  fullComposerGhostText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  fullComposerSend: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
  },
  fullComposerSendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledAction: {
    opacity: 0.6,
  },
  modalSheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  drawerModalRoot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
  },  drawerUnderlayPressable: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  drawerMainDismissLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 21,
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 6, height: 0 },
    elevation: 12,
  },
  sessionDrawer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  modalDismissArea: {
    flex: 1,
    width: '100%',
  },
  modalBackdropCentered: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  attachmentPreviewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  attachmentPreviewCard: {
    width: '100%',
    maxHeight: '86%',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  attachmentPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  attachmentPreviewTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  attachmentPreviewTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  attachmentPreviewMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentPreviewIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  attachmentPreviewImage: {
    width: '100%',
    height: 420,
    maxHeight: '72%',
    borderRadius: 14,
    backgroundColor: '#020617',
  },
  contextMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    justifyContent: 'center',
    paddingHorizontal: 42,
  },
  sessionContextMenu: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    backgroundColor: '#111827',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#273449',
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  selectedExportMenuHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#273449',
  },
  selectedExportMenuTitle: {
    color: '#F9FAFB',
    fontSize: 17,
    fontWeight: '900',
  },
  selectedExportMenuMessage: {
    marginTop: 4,
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  contextMenuItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  contextMenuIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextMenuText: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '800',
  },
  contextMenuDangerText: {
    color: '#FCA5A5',
  },  modalCardCompact: {
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modelPickerSheet: {
    overflow: 'hidden',
  },
  settingsScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  settingsModalRoot: {
    flex: 1,
  },
  settingsScreenSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
  },
  settingsScreenScroll: {
    flex: 1,
    marginTop: 18,
  },
  settingsScreenScrollContent: {
    paddingBottom: 24,
  },
  settingsContentScene: {
    flexGrow: 1,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  modalScroll: {
    marginTop: 18,
  },
  sectionLabel: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    color: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldInputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inlineUtilityButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inlineUtilityButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  settingsNavItem: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsNavText: {
    flex: 1,
  },
  settingsNavTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  settingsNavSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },
  drawerHeader: {
    minHeight: 54,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  drawerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerHeaderButton: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerHeaderButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  drawerHeaderButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },  drawerSearchWrap: {
    position: 'relative',
    marginHorizontal: 22,
    marginTop: 10,
  },
  drawerSearchInput: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
  },
  drawerSearchInputWithRaise: {
    paddingRight: 46,
  },
  drawerSearchInputRaised: {
    minHeight: 102,
    maxHeight: 146,
  },
  drawerSearchRaiseButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  drawerSectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  drawerSectionTitleWrap: {
    flex: 1,
    minWidth: 132,
  },
  drawerSectionLabel: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  drawerCopyButton: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: '#111827',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCopyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  drawerDeleteButton: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerDeleteButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  drawerSelectionText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 22,
    marginBottom: 6,
  },
  drawerHistoryScroll: {
    flex: 1,
  },
  drawerHistoryContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 2,
    paddingBottom: 108,
  },
  drawerHistoryFooterSwipeArea: {
    width: '100%',
  },
  drawerSessionItem: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    minHeight: 48,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'transparent',
    borderBottomColor: '#E6ECF2',
    backgroundColor: 'transparent',
  },
  drawerSessionItemActive: {
    borderBottomColor: '#BFDBFE',
    backgroundColor: 'transparent',
  },
  drawerSessionItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  drawerSessionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
  },
  drawerSessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 8,
  },
  drawerSessionTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  drawerSessionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  drawerSessionGuardBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  drawerSessionGuardBadgeWarning: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  drawerSessionGuardBadgeBlocked: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  drawerSessionGuardBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  drawerSessionGuardBadgeTextWarning: {
    color: '#B45309',
  },
  drawerSessionGuardBadgeTextBlocked: {
    color: '#B91C1C',
  },
  sessionSelectMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionSelectMarkActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  drawerNewChatButton: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'android' ? 24 : 28,
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: '#111827',
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  drawerNewChatText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  renameInput: {
    marginTop: 16,
  },
  renameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingOptionGroup: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  settingOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  settingOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  settingOptionRadioSelected: {
    borderColor: '#2563EB',
  },
  settingOptionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  settingOptionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  secondaryActionLabel: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },  profileSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },  profileSummaryBadge: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  profileSummaryAction: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },
  infoPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  infoPanelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  storageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  infoPanelTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  infoPanelText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  cacheRefreshButton: {
    marginTop: 0,
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cacheStatsText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  unreadableRecoveryRow: {
    gap: 10,
    marginTop: 14,
  },
  pluginBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileChipRow: {
    gap: 8,
    paddingBottom: 12,
  },
  profileChip: {
    width: 138,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  profileChipSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  profileChipTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  profileChipMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  settingsGroupCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 14,
  },  settingsGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },  settingsGroupTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },  settingsGroupMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },  formSectionHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  sectionValue: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },  profileItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },  profileItemMain: {
    flex: 1,
  },  profileItemSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },  profileStateActive: {
    color: '#1D4ED8',
  },
  suggestionRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  suggestionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedChip: {
    backgroundColor: '#DBEAFE',
    borderColor: '#60A5FA',
  },  binaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },  binaryChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  compactSettingCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  compactSettingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactSettingTitleWrap: {
    flex: 1,
  },
  compactSettingTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  compactSettingSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  advancedToggle: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  advancedToggleTextWrap: {
    flex: 1,
  },
  advancedToggleTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  advancedToggleSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  advancedToggleAction: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  advancedPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  switchRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  switchSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  compactSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    padding: 3,
    justifyContent: 'center',
  },
  compactSwitchOn: {
    backgroundColor: '#2563EB',
  },
  compactSwitchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  compactSwitchThumbOn: {
    alignSelf: 'flex-end',
  },
  inlineHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  warningText: {
    color: '#B45309',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  dangerButton: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dangerButtonCompact: {
    flex: 1,
    marginTop: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  unreadableDeleteButton: {
    backgroundColor: '#fff1f2',
  },
  unreadableDeleteButtonText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
  },
  profileUtilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  dangerButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalGhost: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  modalGhostText: {
    color: '#334155',
    fontWeight: '700',
  },
  modalPrimary: {
    borderRadius: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalPrimarySmall: {
    borderRadius: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptySessionText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8,
  },  sessionActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
  },
  sessionMeta: {
    flex: 1,
    minWidth: 0,
  },  sessionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },  sessionActionText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
});
