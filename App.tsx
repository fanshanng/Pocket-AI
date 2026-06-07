import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Appearance,
  BackHandler,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type {
  AlertButton,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponderGestureState,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Maximize2,
  X,
} from 'lucide-react-native';

import {
  CheckIcon,
  DirectionIcon,
  EditIcon,
  GitHubIcon,
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
import { MessageBubble } from './src/components/MessageBubble';
import { SlideFadePresence } from './src/components/SlideFadePresence';
import { COPY } from './src/i18n/copy';
import {
  conversationMatchesQuery,
  createConversation,
  formatConversationMarkdown,
  formatRelativeTime,
  getAllConversationAttachments,
  getConversationAttachments,
  normalizeMessageVariants,
  normalizeSearchText,
  sortConversationsForList,
  trimTitle,
  upsertConversation,
} from './src/lib/conversations';
import {
  captureImageAttachment,
  clearAllAttachmentFiles,
  deleteAttachmentRecords,
  pickDocumentAttachments,
  pickImageAttachments,
  persistSharedImageAttachments,
  sweepOrphanedAttachments,
} from './src/lib/files';
import type { SharedImageInput } from './src/lib/files';
import { makeId } from './src/lib/ids';
import {
  API_PRESETS,
  API_PROTOCOL_OPTIONS,
  apiProtocolLabel,
  classifyModel,
  DEFAULT_PROFILE,
  getEndpointHint,
  getModelHint,
  getProtocolStorageHint,
  getReasoningEffortHint,
  MODEL_SUGGESTIONS,
} from './src/lib/models';
import {
  createAssistantTurn,
  createConversationTitle,
  fetchAvailableModels,
  getApiErrorMessage,
  getApiErrorStatus,
  testApiConnection,
} from './src/lib/openai';
import {
  clearPersistedState,
  deleteApiKey,
  deleteProfileApiKey,
  EMPTY_STATE,
  loadProfileApiKey,
  migrateLegacyApiKey,
  loadPersistedState,
  saveProfileApiKey,
  savePersistedState,
} from './src/lib/storage';
import {
  APP_VERSION,
  fetchLatestRelease,
  isNewerRelease,
} from './src/lib/releases';
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
  hasKeyboardInsetsBridge,
  startKeyboardInsetsTracking,
  subscribeKeyboardInsets,
} from './src/native/keyboardInsets';
import {
  clearSharedImages,
  getInitialSharedImages,
  getSharedImageUri,
  hasSharedImageBridge,
  subscribeSharedImages,
} from './src/native/sharedImages';
import { normalizeSystemColorScheme, resolveTheme } from './src/theme';
import type {
  ApiProfile,
  AttachmentRecord,
  ChatMessage,
  ConversationRecord,
  PendingAttachment,
  PersistedState,
  ReasoningEffort,
  ThemeMode,
  UiLanguage,
} from './src/types';

const STREAMING_FLUSH_INTERVAL_MS = 220;
const STREAMING_SCROLL_INTERVAL_MS = 260;
const CHAT_BOTTOM_FOLLOW_THRESHOLD = 96;
const DRAWER_SWIPE_SLOPE = 0.35;
const DRAWER_SWIPE_MIN_DISTANCE = 5;
const SESSION_CLOSE_SWIPE_SLOPE = 0.08;
const SESSION_CLOSE_SWIPE_MIN_DISTANCE = 1;
const COMPOSER_VISIBLE_BOTTOM_GAP = 8;
const MOTION_SETTLE_EASING = Easing.bezier(0.2, 0, 0, 1);
const MOTION_EXIT_EASING = Easing.bezier(0.4, 0, 1, 1);
const DRAWER_SETTLE_MIN_DURATION_MS = 170;
const DRAWER_SETTLE_MAX_DURATION_MS = 320;
const SHEET_OPEN_DURATION_MS = 260;
const SHEET_CLOSE_DURATION_MS = 220;

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getDistanceDuration(
  distance: number,
  fullDistance: number,
  minDuration: number,
  maxDuration: number,
  velocity = 0
) {
  const distanceRatio = clampNumber(distance / Math.max(1, fullDistance), 0, 1);
  const baseDuration = minDuration + (maxDuration - minDuration) * Math.sqrt(distanceRatio);
  const velocityFactor = clampNumber(1 - Math.abs(velocity) * 0.18, 0.72, 1);
  return Math.round(baseDuration * velocityFactor);
}

type SettingsSection = 'root' | 'api' | 'language' | 'theme' | 'storage' | 'about';

function isLooseDirectionalSwipe(
  gestureState: PanResponderGestureState,
  direction: 'left' | 'right',
  minDistance = DRAWER_SWIPE_MIN_DISTANCE
): boolean {
  const signedDx = direction === 'right' ? gestureState.dx : -gestureState.dx;
  if (signedDx < minDistance) {
    return false;
  }

  const absX = Math.abs(gestureState.dx);
  const absY = Math.abs(gestureState.dy);
  return absX > absY * DRAWER_SWIPE_SLOPE || Math.abs(gestureState.vx) > 0.14;
}

function isLooseDirectionalDelta(
  dx: number,
  dy: number,
  direction: 'left' | 'right',
  minDistance = DRAWER_SWIPE_MIN_DISTANCE
): boolean {
  const signedDx = direction === 'right' ? dx : -dx;
  if (signedDx < minDistance) {
    return false;
  }

  return Math.abs(dx) > Math.abs(dy) * DRAWER_SWIPE_SLOPE;
}

function isSensitiveSessionCloseSwipe(gestureState: PanResponderGestureState): boolean {
  const signedDx = -gestureState.dx;
  if (signedDx < SESSION_CLOSE_SWIPE_MIN_DISTANCE) {
    return false;
  }

  const absX = Math.abs(gestureState.dx);
  const absY = Math.abs(gestureState.dy);
  return absX > absY * SESSION_CLOSE_SWIPE_SLOPE || signedDx > 4 || Math.abs(gestureState.vx) > 0.03;
}

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const composerDockRef = useRef<View>(null);
  const composerLiftFrameRef = useRef<number | null>(null);
  const composerKeyboardResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composerLiftTranslateY = useRef(new Animated.Value(0)).current;
  const composerLiftAnimationIdRef = useRef(0);
  const composerLiftMeasureIdRef = useRef(0);
  const composerAutoLiftTargetRef = useRef(0);
  const composerAutoLiftCurrentRef = useRef(0);
  const keyboardVisibleRef = useRef(false);
  const keyboardInsetBottomRef = useRef(0);
  const keyboardTopRef = useRef<number | null>(null);
  const shouldScrollToBottomRef = useRef(true);
  const autoFollowScrollRef = useRef(true);
  const skipNextPersistRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingTextRef = useRef('');
  const streamingFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamingConversationIdRef = useRef<string | null>(null);
  const regenerateAssistantMessageRef = useRef<(messageId: string) => void>(() => undefined);
  const handledSharedImageUrisRef = useRef(new Set<string>());
  const sessionDrawerTranslateX = useRef(new Animated.Value(-Math.max(1, Math.min(windowWidth, 520)))).current;
  const sessionDrawerHiddenOffsetRef = useRef(360);
  const sessionDrawerAnimationIdRef = useRef(0);
  const sessionDrawerClosingRef = useRef(false);
  const sessionDrawerCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionDrawerDragFrameRef = useRef<number | null>(null);
  const sessionDrawerDragTargetRef = useRef(-Math.max(1, Math.min(windowWidth, 520)));
  const drawerGestureOpeningRef = useRef(false);
  const settingsPanelTranslateX = useRef(new Animated.Value(0)).current;
  const settingsContentProgress = useRef(new Animated.Value(1)).current;
  const settingsContentAnimationIdRef = useRef(0);
  const settingsPanelHiddenOffsetRef = useRef(360);
  const settingsPanelAnimationIdRef = useRef(0);
  const settingsPanelCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsReturnTargetRef = useRef<'chat' | 'drawer'>('chat');
  const settingsTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const settingsTouchHasClosedRef = useRef(false);
  const bottomSheetTranslateY = useRef(new Animated.Value(420)).current;
  const bottomSheetBackdropOpacity = useRef(new Animated.Value(0)).current;
  const bottomSheetAnimationIdRef = useRef(0);
  const bottomSheetCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomSheetAfterCloseRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [persisted, setPersisted] = useState<PersistedState>(EMPTY_STATE);
  const [apiKey, setApiKey] = useState('');
  const [draftProfile, setDraftProfile] = useState<ApiProfile>(DEFAULT_PROFILE);
  const [composerText, setComposerText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [testingProfile, setTestingProfile] = useState(false);
  const [sending, setSending] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [chatMenuVisible, setChatMenuVisible] = useState(false);
  const [sessionsVisible, setSessionsVisible] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [bottomSheetMode, setBottomSheetMode] = useState<'models' | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [checkingVersion, setCheckingVersion] = useState(false);
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
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [draftSessionTitle, setDraftSessionTitle] = useState('');
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [advancedApiSettingsOpen, setAdvancedApiSettingsOpen] = useState(false);
  const [reasoningEffortOptions, setReasoningEffortOptions] = useState<ReasoningEffort[]>(['none']);
  const [reasoningEffortsFetched, setReasoningEffortsFetched] = useState(false);
  const handleRegenerateMessage = useCallback((messageId: string) => {
    regenerateAssistantMessageRef.current(messageId);
  }, []);

  const uiLanguage = persisted.uiLanguage;
  const copy = COPY[uiLanguage];
  const theme = resolveTheme(persisted.themeMode, systemColorScheme);
  const isDark = theme.scheme === 'dark';
  const activeProfile = getActiveProfile(persisted);
  const activeConversation =
    persisted.conversations.find((item) => item.id === persisted.activeConversationId) ?? null;
  const activeLastMessage = activeConversation?.messages[activeConversation.messages.length - 1] ?? null;
  const activeLastMessageTextLength = activeLastMessage?.text.length ?? 0;
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
  const sessionDrawerWidth = Math.max(1, Math.min(windowWidth, 520));
  sessionDrawerHiddenOffsetRef.current = sessionDrawerWidth;
  settingsPanelHiddenOffsetRef.current = Math.max(windowWidth, 320);
  const sessionDrawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          isSensitiveSessionCloseSwipe(gestureState),
        onMoveShouldSetPanResponder: (_, gestureState) =>
          isSensitiveSessionCloseSwipe(gestureState),
        onPanResponderGrant: () => {
          cancelSessionDrawerDragFrame();
          sessionDrawerTranslateX.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          setSessionDrawerPosition(Math.max(-sessionDrawerHiddenOffsetRef.current, Math.min(0, gestureState.dx)));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -SESSION_CLOSE_SWIPE_MIN_DISTANCE || gestureState.vx < -0.03) {
            closeSessionsDrawer(true, gestureState.vx);
            return;
          }
          const animationId = sessionDrawerAnimationIdRef.current + 1;
          sessionDrawerAnimationIdRef.current = animationId;
          sessionDrawerClosingRef.current = false;
          animateSessionDrawerTo(0, animationId, gestureState.vx);
        },
        onPanResponderTerminate: () => {
          const animationId = sessionDrawerAnimationIdRef.current + 1;
          sessionDrawerAnimationIdRef.current = animationId;
          sessionDrawerClosingRef.current = false;
          animateSessionDrawerTo(0, animationId);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [sessionDrawerTranslateX, windowWidth]
  );
  const chatOpenDrawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          if (
            sessionsVisible ||
            settingsVisible ||
            modelPickerVisible ||
            chatMenuVisible
          ) {
            return false;
          }
          return isLooseDirectionalSwipe(gestureState, 'right', 7);
        },
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (
            sessionsVisible ||
            settingsVisible ||
            modelPickerVisible ||
            chatMenuVisible
          ) {
            return false;
          }
          return isLooseDirectionalSwipe(gestureState, 'right', 7);
        },
        onPanResponderGrant: () => {
          drawerGestureOpeningRef.current = true;
          cancelSessionDrawerDragFrame();
          sessionDrawerTranslateX.stopAnimation();
          setSessionsVisible(true);
          sessionDrawerTranslateX.setValue(-sessionDrawerHiddenOffsetRef.current);
        },
        onPanResponderMove: (_, gestureState) => {
          const nextX = Math.min(0, -sessionDrawerHiddenOffsetRef.current + Math.max(0, gestureState.dx));
          setSessionDrawerPosition(nextX);
        },
        onPanResponderRelease: (_, gestureState) => {
          drawerGestureOpeningRef.current = false;
          if (gestureState.dx > windowWidth * 0.14 || gestureState.vx > 0.38) {
            openSessionsDrawer(gestureState.vx);
            return;
          }
          closeSessionsDrawer(true, gestureState.vx);
        },
        onPanResponderTerminate: () => {
          drawerGestureOpeningRef.current = false;
          closeSessionsDrawer();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [
      chatMenuVisible,
      modelPickerVisible,
      sessionDrawerTranslateX,
      sessionsVisible,
      settingsVisible,
      windowWidth,
    ]
  );
  const chatSceneTranslateX = sessionDrawerTranslateX.interpolate({
    inputRange: [-sessionDrawerWidth, 0],
    outputRange: [0, sessionDrawerWidth],
    extrapolate: 'clamp',
  });
  const settingsContentTranslateX = settingsContentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [settingsContentMotion === 'rootEnter' ? -28 : 34, 0],
    extrapolate: 'clamp',
  });
  const androidStatusInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const compactWindow = windowHeight < 560;
  const topBarExtraInset = Platform.OS === 'android' ? Math.max(androidStatusInset + 8, compactWindow ? 18 : 32) : 12;
  const modalTopInset = Platform.OS === 'android' ? Math.max(androidStatusInset + 12, compactWindow ? 24 : 36) : 12;
  const drawerTopInset = Platform.OS === 'android' ? Math.max(androidStatusInset + 24, compactWindow ? 38 : 52) : 22;
  const composerLineCount = composerText.split('\n').length;
  const composerNeedsExpand = composerText.length >= 220 || composerLineCount >= 7;
  const composerSingleLine = composerLineCount <= 1 && composerText.length < 40;
  const composerBottomInset = Platform.OS === 'android' ? (compactWindow ? 4 : 8) : 10;
  const sessionSearchNeedsRaise = sessionSearchQuery.length > 28 || sessionSearchQuery.includes('\n');
  const sessionSearchIsRaised = sessionSearchRaised && sessionSearchNeedsRaise;
  const drawerBlankSwipeFooterHeight = visibleConversations.length < 6 ? Math.max(180, windowHeight * 0.28) : 56;
  const renderDrawerSession = useCallback(
    ({ item: conversation }: { item: ConversationRecord }) => {
      const active = conversation.id === activeConversation?.id;
      const selected = selectedSessionIds.includes(conversation.id);
      return (
        <Pressable
          style={[
            styles.drawerSessionItem,
            active && styles.drawerSessionItemActive,
            selected && [styles.drawerSessionItemSelected, { backgroundColor: theme.primarySoft }],
            { borderBottomColor: active ? theme.primary : theme.divider },
          ]}
          onPress={() => openConversation(conversation.id)}
          onLongPress={() => {
            if (!sessionSelectionMode) {
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
                <Text style={[styles.drawerSessionTime, { color: theme.muted }]} numberOfLines={1}>
                  {formatRelativeTime(conversation.updatedAt, uiLanguage)}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [activeConversation?.id, selectedSessionIds, sessionSelectionMode, theme.border, theme.divider, theme.muted, theme.primary, theme.primarySoft, theme.surface, theme.text, uiLanguage]
  );

  useEffect(() => {
    (async () => {
      const state = await loadPersistedState();
      const key = await migrateLegacyApiKey(state.activeProfileId);
      setPersisted(state);
      setDraftProfile(getActiveProfile(state));
      setApiKey(key);
      sweepOrphanedAttachments(getAllConversationAttachments(state.conversations)).catch(() => undefined);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    savePersistedState(persisted).catch(() => undefined);
  }, [persisted, ready]);

  useEffect(() => {
    if (!ready || persisted.conversations.length === 0) {
      return;
    }
    if (
      persisted.activeConversationId &&
      persisted.conversations.some((conversation) => conversation.id === persisted.activeConversationId)
    ) {
      return;
    }

    setPersisted((current) => {
      if (
        current.conversations.length === 0 ||
        (current.activeConversationId &&
          current.conversations.some((conversation) => conversation.id === current.activeConversationId))
      ) {
        return current;
      }
      const newest = [...current.conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
      return {
        ...current,
        activeConversationId: newest.id,
      };
    });
  }, [persisted.activeConversationId, persisted.conversations, ready]);

  useEffect(() => {
    if (sessionsVisible || drawerGestureOpeningRef.current) {
      return;
    }
    sessionDrawerTranslateX.setValue(-sessionDrawerHiddenOffsetRef.current);
    sessionDrawerDragTargetRef.current = -sessionDrawerHiddenOffsetRef.current;
  }, [sessionDrawerTranslateX, sessionsVisible, windowWidth]);

  function setSessionDrawerPosition(nextX: number) {
    sessionDrawerDragTargetRef.current = nextX;
    if (sessionDrawerDragFrameRef.current !== null) {
      return;
    }
    sessionDrawerDragFrameRef.current = requestAnimationFrame(() => {
      sessionDrawerDragFrameRef.current = null;
      sessionDrawerTranslateX.setValue(sessionDrawerDragTargetRef.current);
    });
  }

  function cancelSessionDrawerDragFrame() {
    if (sessionDrawerDragFrameRef.current !== null) {
      cancelAnimationFrame(sessionDrawerDragFrameRef.current);
      sessionDrawerDragFrameRef.current = null;
    }
  }

  function flushSessionDrawerDragPosition() {
    cancelSessionDrawerDragFrame();
    const nextX = clampNumber(sessionDrawerDragTargetRef.current, -sessionDrawerHiddenOffsetRef.current, 0);
    sessionDrawerDragTargetRef.current = nextX;
    sessionDrawerTranslateX.setValue(nextX);
    return nextX;
  }

  function animateSessionDrawerTo(
    toValue: number,
    animationId: number,
    velocity = 0,
    onComplete?: () => void
  ) {
    const fromValue = flushSessionDrawerDragPosition();
    const distance = Math.abs(toValue - fromValue);
    const duration = getDistanceDuration(
      distance,
      sessionDrawerHiddenOffsetRef.current,
      DRAWER_SETTLE_MIN_DURATION_MS,
      DRAWER_SETTLE_MAX_DURATION_MS,
      velocity
    );
    sessionDrawerDragTargetRef.current = toValue;
    Animated.timing(sessionDrawerTranslateX, {
      toValue,
      duration,
      easing: MOTION_SETTLE_EASING,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || sessionDrawerAnimationIdRef.current !== animationId) {
        return;
      }
      sessionDrawerTranslateX.setValue(toValue);
      sessionDrawerDragTargetRef.current = toValue;
      onComplete?.();
    });
    return duration;
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
    };
  }, [composerLiftTranslateY]);

  useEffect(() => {
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
    if (hasKeyboardInsetsBridge()) {
      return undefined;
    }

    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(keyboardShowEvent, () => {
      keyboardVisibleRef.current = true;
      if (composerKeyboardResetTimerRef.current) {
        clearTimeout(composerKeyboardResetTimerRef.current);
        composerKeyboardResetTimerRef.current = null;
      }
      updateComposerAutoLift();
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
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
    windowHeight,
    windowWidth,
  ]);

  useEffect(() => {
    const unsubscribe = subscribeKeyboardInsets((event) => {
      const bottom = Math.max(0, Math.round(event.bottom ?? 0));
      const screenY = Math.max(0, Math.round(event.screenY ?? 0));
      keyboardInsetBottomRef.current = bottom;
      keyboardTopRef.current = screenY > 0 ? screenY : null;
      keyboardVisibleRef.current = bottom > 0 || event.visible === true;
      if (bottom > 0 && composerKeyboardResetTimerRef.current) {
        clearTimeout(composerKeyboardResetTimerRef.current);
        composerKeyboardResetTimerRef.current = null;
      }
      if (bottom <= 0) {
        resetComposerAutoLift();
        return;
      }
      updateComposerAutoLift();
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
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: !sending });
    });
    shouldScrollToBottomRef.current = false;
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
      if (sessionDrawerCloseFallbackRef.current) {
        clearTimeout(sessionDrawerCloseFallbackRef.current);
      }
      if (sessionDrawerDragFrameRef.current !== null) {
        cancelAnimationFrame(sessionDrawerDragFrameRef.current);
        sessionDrawerDragFrameRef.current = null;
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
      if (composerKeyboardResetTimerRef.current) {
        clearTimeout(composerKeyboardResetTimerRef.current);
        composerKeyboardResetTimerRef.current = null;
      }
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
          Alert.alert(copy.imagePickerFailed, error instanceof Error ? error.message : copy.imagePickerFailedFallback);
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
  }, [copy.imagePickerFailed, copy.imagePickerFailedFallback, ready]);

  function updateConversations(nextConversations: ConversationRecord[], nextActiveId: string | null) {
    shouldScrollToBottomRef.current = true;
    autoFollowScrollRef.current = true;
    setPersisted((current) => ({
      ...current,
      conversations: nextConversations,
      activeConversationId: nextActiveId,
    }));
  }

  function isChatScrollNearBottom(metrics: NativeScrollEvent): boolean {
    const visibleBottom = metrics.contentOffset.y + metrics.layoutMeasurement.height;
    return visibleBottom >= metrics.contentSize.height - CHAT_BOTTOM_FOLLOW_THRESHOLD;
  }

  function handleChatScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    autoFollowScrollRef.current = isChatScrollNearBottom(event.nativeEvent);
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
    if (Platform.OS === 'android') {
      if (keyboardTopRef.current !== null) {
        return Math.max(0, Math.min(windowHeight, keyboardTopRef.current));
      }
      if (keyboardInsetBottomRef.current > 0) {
        return Math.max(0, windowHeight - keyboardInsetBottomRef.current);
      }
      return windowHeight;
    }

    const metrics = Keyboard.metrics();
    if (!metrics || metrics.height <= 0) {
      return windowHeight;
    }

    const fallbackTop = windowHeight - metrics.height;
    const frameTop =
      Number.isFinite(metrics.screenY) && metrics.screenY > 0 && metrics.screenY < windowHeight
        ? metrics.screenY
        : fallbackTop;
    return Math.max(0, Math.min(windowHeight, frameTop));
  }

  function resetComposerAutoLift() {
    keyboardVisibleRef.current = false;
    keyboardInsetBottomRef.current = 0;
    keyboardTopRef.current = null;
    composerLiftMeasureIdRef.current += 1;
    if (composerLiftFrameRef.current !== null) {
      cancelAnimationFrame(composerLiftFrameRef.current);
      composerLiftFrameRef.current = null;
    }
    if (composerKeyboardResetTimerRef.current) {
      clearTimeout(composerKeyboardResetTimerRef.current);
      composerKeyboardResetTimerRef.current = null;
    }
    animateComposerAutoLiftTo(0, true);
  }

  function updateComposerAutoLift() {
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

  function ensureConversation(): ConversationRecord {
    if (activeConversation) {
      return activeConversation;
    }

    const created = createConversation(activeProfile, copy.newSession);
    updateConversations([created, ...persisted.conversations], created.id);
    return created;
  }

  async function openSettings(returnTarget: 'chat' | 'drawer' = 'chat') {
    setChatMenuVisible(false);
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
          easing: MOTION_SETTLE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(bottomSheetTranslateY, {
          toValue: 0,
          duration: SHEET_OPEN_DURATION_MS,
          easing: MOTION_SETTLE_EASING,
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
    setDraftProfile(profile);
    resetApiProfileEditor(profile);
    navigateToSettingsSection('api');
    loadProfileApiKey(profile.id).then(setApiKey).catch(() => setApiKey(''));
  }

  async function selectDraftApiProfile(profile: ApiProfile) {
    setDraftProfile(profile);
    setApiKey(await loadProfileApiKey(profile.id));
    resetApiProfileEditor(profile);
  }

  function createNewApiProfile() {
    const profile: ApiProfile = {
      ...DEFAULT_PROFILE,
      id: makeId('profile'),
      label: `${DEFAULT_PROFILE.label} ${persisted.profiles.length + 1}`,
    };
    setPersisted((current) => ({
      ...current,
      profiles: [...current.profiles, profile],
    }));
    setDraftProfile(profile);
    setApiKey('');
    resetApiProfileEditor(profile);
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

  async function handleSaveApiProfile() {
    let profile = sanitizeProfile(draftProfile);
    setSavingProfile(true);
    try {
      const key = apiKey.trim();
      await saveProfileApiKey(profile.id, key);
      const nextReasoningEfforts = getCachedReasoningEffortsForProfile({
        ...profile,
        cachedReasoningEfforts: inferReasoningEffortOptions(profile),
      });
      profile = {
        ...profile,
        cachedReasoningEfforts: nextReasoningEfforts,
      };
      if (key) {
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
      setPersisted((current) => {
        const profiles = upsertProfile(current.profiles, profile);
        return {
          ...current,
          activeProfileId: profile.id,
          profiles,
          profile,
        };
      });
      setDraftProfile(profile);
      setAvailableModels(getCachedModelsForProfile(profile));
      setReasoningEffortOptions(getCachedReasoningEffortsForProfile(profile));
      closeBottomSheet();
    } finally {
      setSavingProfile(false);
    }
  }

  function resetApiProfileEditor(profile: ApiProfile) {
    setAdvancedApiSettingsOpen(profileHasAdvancedValues(profile));
    setAvailableModels(getCachedModelsForProfile(profile));
    setReasoningEffortOptions(getCachedReasoningEffortsForProfile(profile));
    setReasoningEffortsFetched(false);
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
    setReasoningEffortsFetched(false);
    setDraftProfile((current) => {
      const next = updater(current);
      return {
        ...next,
        cachedModels: getCachedModelsForProfile(next),
        cachedReasoningEfforts: getCachedReasoningEffortsForProfile(next),
      };
    });
  }

  function applyReasoningEffort(effort: ReasoningEffort) {
    setDraftProfile((current) => ({
      ...current,
      reasoningEffort: effort,
      cachedReasoningEfforts: uniqueStrings([effort, ...(current.cachedReasoningEfforts ?? [])]) as ReasoningEffort[],
    }));
    setReasoningEffortOptions((current) => uniqueStrings([effort, ...current]) as ReasoningEffort[]);
  }

  function getAdvancedApiSummary(profile: ApiProfile): string {
    const activeItems = [
      profile.storeResponses ? copy.storageEnabled : copy.storageDisabled,
      profile.projectId ? copy.projectId : '',
      profile.organization ? copy.organization : '',
      profile.systemPrompt ? copy.systemPrompt : '',
    ];
    return activeItems.filter(Boolean).join(' | ');
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
      Alert.alert(failedTitle, error instanceof Error ? error.message : fallbackMessage);
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

  function renderModelOption({ item: model }: { item: string }) {
    const active = activeProfile.model === model;
    return (
      <Pressable
        style={[
          styles.modelOption,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          active && [styles.modelOptionSelected, themedSelected],
        ]}
        onPress={() => applyModelToActiveProfile(model)}
      >
        <Text style={[styles.modelOptionText, { color: theme.text }, active && { color: theme.primary }]} numberOfLines={1}>
          {model}
        </Text>
        {active && <Text style={styles.profileStateActive}>{copy.activeModel}</Text>}
      </Pressable>
    );
  }

  function flushStreamingText() {
    const conversationId = streamingConversationIdRef.current;
    const messageId = streamingMessageIdRef.current;
    if (!conversationId || !messageId) {
      return;
    }

    const nextText = streamingTextRef.current;
    scheduleStreamingScroll();
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
    if (!autoFollowScrollRef.current) {
      return;
    }
    if (streamingScrollTimerRef.current) {
      return;
    }

    streamingScrollTimerRef.current = setTimeout(() => {
      streamingScrollTimerRef.current = null;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
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
    if (attachment) {
      deleteAttachmentRecords([attachment]).catch(() => undefined);
    }
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

    const conversation = ensureConversation();
    const baseConversations = activeConversation
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
      updateConversations(upsertConversation(optimisticConversations, completedConversation), conversation.id);

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
        updateConversations(upsertConversation(optimisticConversations, stoppedConversation), conversation.id);
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
      updateConversations(upsertConversation(optimisticConversations, failedConversation), conversation.id);
      Alert.alert(copy.sendFailed, message);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      streamingConversationIdRef.current = null;
      streamingMessageIdRef.current = null;
      streamingTextRef.current = '';
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
      updateConversations(upsertConversation(persisted.conversations, completedConversation), activeConversation.id);
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
      updateConversations(upsertConversation(persisted.conversations, failedConversation), activeConversation.id);
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
      updateConversations(upsertConversation(persisted.conversations, completedConversation), activeConversation.id);
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
      updateConversations(upsertConversation(persisted.conversations, failedConversation), activeConversation.id);
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

  async function createNewSession() {
    await deleteAttachmentRecords(pendingAttachments).catch(() => undefined);
    const conversation = createConversation(activeProfile, copy.newSession);
    updateConversations([conversation, ...persisted.conversations], conversation.id);
    setComposerText('');
    setPendingAttachments([]);
    setAttachmentMenuVisible(false);
    setChatMenuVisible(false);
    closeSessionsDrawer(false);
    closeSettingsPanel({ returnToDrawer: false });
  }

  function openSessionsDrawer(velocity = 0) {
    const animationId = sessionDrawerAnimationIdRef.current + 1;
    sessionDrawerAnimationIdRef.current = animationId;
    sessionDrawerClosingRef.current = false;
    setChatMenuVisible(false);
    setAttachmentMenuVisible(false);
    if (sessionDrawerCloseFallbackRef.current) {
      clearTimeout(sessionDrawerCloseFallbackRef.current);
      sessionDrawerCloseFallbackRef.current = null;
    }
    sessionDrawerTranslateX.stopAnimation();
    if (!sessionsVisible) {
      cancelSessionDrawerDragFrame();
      sessionDrawerDragTargetRef.current = -sessionDrawerHiddenOffsetRef.current;
      sessionDrawerTranslateX.setValue(-sessionDrawerHiddenOffsetRef.current);
    }
    setSessionsVisible(true);
    requestAnimationFrame(() => {
      animateSessionDrawerTo(0, animationId, velocity);
    });
  }

  function closeSessionsDrawer(animate = true, velocity = 0) {
    const animationId = sessionDrawerAnimationIdRef.current + 1;
    sessionDrawerAnimationIdRef.current = animationId;
    sessionDrawerClosingRef.current = animate;
    drawerGestureOpeningRef.current = false;
    if (sessionDrawerCloseFallbackRef.current) {
      clearTimeout(sessionDrawerCloseFallbackRef.current);
    }
    sessionDrawerTranslateX.stopAnimation();
    const finishClose = () => {
      if (sessionDrawerAnimationIdRef.current !== animationId) {
        return;
      }
      if (sessionDrawerCloseFallbackRef.current) {
        clearTimeout(sessionDrawerCloseFallbackRef.current);
        sessionDrawerCloseFallbackRef.current = null;
      }
      sessionDrawerClosingRef.current = false;
      sessionDrawerTranslateX.setValue(-sessionDrawerHiddenOffsetRef.current);
      sessionDrawerDragTargetRef.current = -sessionDrawerHiddenOffsetRef.current;
      setSessionsVisible(false);
      setSessionSelectionMode(false);
      setSelectedSessionIds([]);
      setSessionSearchVisible(false);
      setSessionSearchQuery('');
      setSessionSearchRaised(false);
    };
    if (!animate) {
      cancelSessionDrawerDragFrame();
      finishClose();
      return;
    }
    const duration = animateSessionDrawerTo(
      -sessionDrawerHiddenOffsetRef.current,
      animationId,
      velocity,
      finishClose
    );
    sessionDrawerCloseFallbackRef.current = setTimeout(finishClose, duration + 120);
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
      }
      return !current;
    });
  }

  async function copySelectedSessionExports() {
    const selected = sortedConversations.filter((conversation) => selectedSessionIds.includes(conversation.id));
    if (selected.length === 0) {
      return;
    }
    await Clipboard.setStringAsync(selected.map(formatConversationMarkdown).join('\n\n---\n\n'));
    Alert.alert(copy.copySelectedSessions, copy.copiedSessionExport);
    setSessionSelectionMode(false);
    setSelectedSessionIds([]);
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
    setPersisted((current) => ({
      ...current,
      activeConversationId: conversationId,
    }));
    setSelectedSessionIds([]);
    setSessionSelectionMode(false);
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

  async function copyConversationExport(conversation: ConversationRecord) {
    await Clipboard.setStringAsync(formatConversationMarkdown(conversation));
    Alert.alert(copy.exportSession, copy.copiedSessionExport);
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

  async function clearLocalData() {
    setSavingProfile(true);
    try {
      await Promise.all([
        clearPersistedState(),
        deleteApiKey(),
        ...persisted.profiles.map((profile) => deleteProfileApiKey(profile.id)),
        clearAllAttachmentFiles(),
      ]);
      skipNextPersistRef.current = true;
      setPersisted(EMPTY_STATE);
      setDraftProfile(DEFAULT_PROFILE);
      setApiKey('');
      setComposerText('');
      setPendingAttachments([]);
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

  function confirmClearLocalData() {
    Alert.alert(copy.clearDataTitle, copy.clearDataMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.clear,
        style: 'destructive',
        onPress: () => {
          void clearLocalData();
        },
      },
    ]);
  }

  function renderSettingsRoot() {
    const items: Array<{ key: SettingsSection; title: string; subtitle: string }> = [
      {
        key: 'api',
        title: copy.apiSection,
        subtitle: `${activeProfile.label} · ${activeProfile.model}`,
      },
      {
        key: 'storage',
        title: copy.storageSection,
        subtitle: copy.localStorageTitle,
      },
      {
        key: 'language',
        title: copy.language,
        subtitle: uiLanguage === 'zh' ? copy.chinese : copy.english,
      },
      {
        key: 'theme',
        title: copy.themeSection,
        subtitle:
          persisted.themeMode === 'dark'
            ? copy.themeDark
            : persisted.themeMode === 'light'
              ? copy.themeLight
              : copy.themeSystem,
      },
      {
        key: 'about',
        title: copy.aboutSection,
        subtitle: copy.createdBy,
      },
    ];

    return (
      <>
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.settingsNavItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            onPress={() => {
              if (item.key === 'api') {
                openApiProfiles();
                return;
              }
              navigateToSettingsSection(item.key);
            }}
          >
            <View style={styles.settingsNavText}>
              <Text style={[styles.settingsNavTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.settingsNavSubtitle, { color: theme.muted }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
                <DirectionIcon direction="right" color={theme.muted} />
          </Pressable>
        ))}
      </>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingTitle}>Pocket AI</Text>
        <Text style={styles.loadingText}>{copy.loading}</Text>
      </SafeAreaView>
    );
  }

  const composerDisabled = false;
  const canSend = !!composerText.trim() || pendingAttachments.length > 0;
  const usingInsecureHttp = draftProfile.baseUrl.trim().toLowerCase().startsWith('http://');
  const themedPanel = { backgroundColor: theme.surfaceAlt, borderColor: theme.border };
  const themedFieldInput = { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text };
  const themedSelected = { backgroundColor: theme.primarySoft, borderColor: theme.primary };
  const themedMutedText = { color: theme.muted };
  const themedSubtleText = { color: theme.subtle };

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
        <StatusBar barStyle={theme.statusBar} />
      <Animated.View style={[styles.mainScene, { transform: [{ translateX: chatSceneTranslateX }] }]}>
        <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS === 'ios'}
          keyboardVerticalOffset={0}
          style={styles.flex}
        >
          <View style={[styles.topBar, { paddingTop: topBarExtraInset }]}>
            <Pressable
              style={[styles.iconAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => openSessionsDrawer()}
              accessibilityRole="button"
              accessibilityLabel={copy.openSessions}
            >
              <MenuIcon color={theme.text} />
            </Pressable>
            <Pressable style={styles.sessionSwitcher} onPress={openModelPicker}>
              <View style={[styles.modelPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{activeProfile.model}</Text>
              </View>
            </Pressable>
            <View style={styles.topActions}>
              <Pressable
                style={[styles.iconAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={createNewSession}
                accessibilityRole="button"
                accessibilityLabel={copy.newSession}
              >
                <PlusIcon color={theme.text} />
              </Pressable>
              <Pressable
                style={[styles.iconAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
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

          <View style={styles.chatShell} {...chatOpenDrawerPanResponder.panHandlers}>
            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              onScroll={handleChatScroll}
              scrollEventThrottle={80}
              onContentSizeChange={scheduleStreamingScroll}
            >
              {activeConversation ? (
                activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      language={uiLanguage}
                      colorScheme={theme.scheme}
                      isStreaming={sending && message.id === streamingMessageIdRef.current}
                      onRegenerate={handleRegenerateMessage}
                      onEditUserMessage={editUserMessage}
                      onSwitchVariant={switchUserMessageVariant}
                    />
                  ))
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

            <Animated.View
              ref={composerDockRef}
              onLayout={updateComposerAutoLift}
              style={[
                styles.composerDock,
                { marginBottom: composerBottomInset },
                { transform: [{ translateY: composerLiftTranslateY }] },
              ]}
            >
              {pendingAttachments.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pendingRail}
                >
                  {pendingAttachments.map((attachment) => (
                    <Pressable
                      key={attachment.id}
                      style={[styles.pendingChip, themedPanel]}
                      onPress={() => removePendingAttachment(attachment.id)}
                    >
                      <Text style={[styles.pendingChipType, { color: theme.primary }]}>{attachment.kind.toUpperCase()}</Text>
                      <Text style={[styles.pendingChipText, { color: theme.subtle }]} numberOfLines={1}>
                        {attachment.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
                <View style={styles.composerRow}>
                <Pressable
                  style={[
                    styles.attachButton,
                    { backgroundColor: theme.surfaceAlt, borderColor: attachmentMenuVisible ? theme.primary : theme.border },
                    attachmentMenuVisible && styles.attachButtonActive,
                  ]}
                  onPress={() => setAttachmentMenuVisible((visible) => !visible)}
                  disabled={composerDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={copy.attachMenu}
                >
                  <PlusIcon color={theme.text} />
                </Pressable>
                <View style={[styles.composerInputWrap, { backgroundColor: theme.input, borderColor: theme.border }]}>
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
                    style={[styles.composerOverlayButton, styles.composerOverlaySend, (!sending && !canSend) && styles.disabledAction]}
                    onPress={sending ? handleStopGenerating : handleSend}
                    disabled={!sending && !canSend}
                    accessibilityRole="button"
                    accessibilityLabel={sending ? copy.stopGenerating : copy.send}
                  >
                    {sending ? <StopIcon /> : <SendIcon />}
                  </Pressable>
                  <TextInput
                    value={composerText}
                    onChangeText={setComposerText}
                    onFocus={() => {
                      if (hasKeyboardInsetsBridge()) {
                        startKeyboardInsetsTracking();
                        return;
                      }
                      keyboardVisibleRef.current = true;
                      updateComposerAutoLift();
                    }}
                    onBlur={resetComposerAutoLift}
                    editable={!composerDisabled}
                    multiline
                    scrollEnabled
                    placeholder={copy.composerPlaceholder}
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
              <SlideFadePresence
                visible={attachmentMenuVisible && !composerDisabled}
                from="bottom"
                style={styles.attachOptionRow}
              >
                  <Pressable style={[styles.attachOption, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={attachFromCamera}>
                    <Camera size={18} color="#2563EB" strokeWidth={2.3} />
                    <Text style={[styles.attachOptionText, { color: theme.text }]}>{copy.camera}</Text>
                  </Pressable>
                  <Pressable style={[styles.attachOption, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={attachImages}>
                    <ImageIcon size={18} color="#2563EB" strokeWidth={2.3} />
                    <Text style={[styles.attachOptionText, { color: theme.text }]}>{copy.image}</Text>
                  </Pressable>
                  <Pressable style={[styles.attachOption, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={attachFiles}>
                    <FileText size={18} color="#2563EB" strokeWidth={2.3} />
                    <Text style={[styles.attachOptionText, { color: theme.text }]}>{copy.file}</Text>
                  </Pressable>
              </SlideFadePresence>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </Animated.View>

      <Modal visible={settingsVisible} animationType="none" onRequestClose={goBackFromSettings}>
        <Animated.View
          style={[styles.settingsScreen, { backgroundColor: theme.surface, transform: [{ translateX: settingsPanelTranslateX }] }]}
          onStartShouldSetResponderCapture={() => false}
          onMoveShouldSetResponderCapture={(event) => maybeNavigateSettingsFromTouch(event)}
          onTouchStart={handleSettingsTouchStart}
          onTouchMove={handleSettingsTouchMove}
          onTouchEnd={handleSettingsTouchEnd}
          onTouchCancel={handleSettingsTouchEnd}
        >
          <SafeAreaView style={[styles.settingsScreenSafe, { paddingTop: modalTopInset, backgroundColor: theme.surface }]}>
            <View style={styles.settingsHeader}>
              {settingsSection !== 'root' && (
                <Pressable style={[styles.backButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={goBackFromSettings}>
                  <DirectionIcon direction="left" color={theme.muted} />
                </Pressable>
              )}
              <View style={styles.modalHeading}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {settingsSection === 'root'
                    ? copy.settingsTitle
                    : settingsSection === 'api'
                      ? copy.apiSection
                    : settingsSection === 'language'
                      ? copy.language
                      : settingsSection === 'theme'
                        ? copy.themeSection
                      : settingsSection === 'storage'
                        ? copy.storageSection
                        : copy.aboutSection}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.muted }]}>{copy.settingsSubtitle}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.settingsScreenScroll}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
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
                <>
                  <View style={styles.formSectionHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.primary }]}>{copy.apiProfilesTitle}</Text>
                    <Pressable style={styles.modalPrimarySmall} onPress={createNewApiProfile}>
                      <Text style={styles.modalPrimaryText}>{copy.newApiProfile}</Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.inlineHint, themedMutedText]}>{copy.apiProfilesSubtitle}</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileChipRow}>
                    {persisted.profiles.map((profile) => {
                      const isActive = profile.id === persisted.activeProfileId;
                      const isEditing = profile.id === draftProfile.id;
                      return (
                        <Pressable
                          key={profile.id}
                          style={[
                            styles.profileChip,
                            themedPanel,
                            isEditing && [styles.profileChipSelected, themedSelected],
                          ]}
                          onPress={() => {
                            void selectDraftApiProfile(profile);
                          }}
                        >
                          <Text style={[styles.profileChipTitle, { color: theme.text }, isEditing && { color: theme.primary }]}>
                            {profile.label}
                          </Text>
                          <Text style={[styles.profileChipMeta, { color: theme.muted }, isEditing && { color: theme.primary }]} numberOfLines={1}>
                            {isActive ? copy.activeApiProfile : profile.model}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.formSectionHeader}>
                    <Text style={[styles.sectionLabel, { color: theme.primary }]}>{copy.basicApiSettings}</Text>
                    <Text style={[styles.sectionValue, themedMutedText]} numberOfLines={1}>
                      {draftProfile.model}
                    </Text>
                  </View>
                  <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.profileLabel}</Text>
                  <TextInput
                    value={draftProfile.label}
                    onChangeText={(value) => setDraftProfile((current) => ({ ...current, label: value }))}
                    style={[styles.fieldInput, themedFieldInput]}
                    placeholder="My API"
                    placeholderTextColor={theme.placeholder}
                  />

                  <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.apiPreset}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                    {API_PRESETS.map((preset) => {
                      const selected =
                        draftProfile.apiProtocol === preset.apiProtocol &&
                        draftProfile.baseUrl === preset.baseUrl &&
                        draftProfile.model === preset.model;
                      return (
                        <Pressable
                          key={preset.id}
                          style={[styles.suggestionChip, themedPanel, selected && [styles.selectedChip, themedSelected]]}
                          onPress={() => updateDraftProfileWithReasoningReset((current) => applyApiPreset(current, preset))}
                        >
                          <Text style={[styles.suggestionChipText, themedSubtleText, selected && { color: theme.primary }]}>
                            {preset.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.endpointMode}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                    {API_PROTOCOL_OPTIONS.map((protocol) => (
                      <Pressable
                        key={protocol}
                        style={[styles.suggestionChip, themedPanel, draftProfile.apiProtocol === protocol && [styles.selectedChip, themedSelected]]}
                        onPress={() => updateDraftProfileWithReasoningReset((current) => ({ ...current, apiProtocol: protocol }))}
                      >
                        <Text style={[styles.suggestionChipText, themedSubtleText, draftProfile.apiProtocol === protocol && { color: theme.primary }]}>
                          {apiProtocolLabel(protocol, uiLanguage)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text style={[styles.inlineHint, themedMutedText]}>{getEndpointHint(draftProfile.apiProtocol, uiLanguage)}</Text>

                  <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.baseUrl}</Text>
                  <TextInput
                    value={draftProfile.baseUrl}
                    onChangeText={(value) => setDraftProfile((current) => ({ ...current, baseUrl: value }))}
                    style={[styles.fieldInput, themedFieldInput]}
                    autoCapitalize="none"
                    placeholder="https://api.openai.com/v1"
                    placeholderTextColor={theme.placeholder}
                  />
                  <Text style={[styles.inlineHint, themedMutedText]}>{copy.baseUrlHint}</Text>
                  {usingInsecureHttp && <Text style={styles.warningText}>{copy.insecureHttpWarning}</Text>}

                  <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.apiKey}</Text>
                  <TextInput
                    value={apiKey}
                    onChangeText={setApiKey}
                    style={[styles.fieldInput, themedFieldInput]}
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder="sk-..."
                    placeholderTextColor={theme.placeholder}
                  />

                  <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.model}</Text>
                  <TextInput
                    value={draftProfile.model}
                    onChangeText={(value) => updateDraftProfileWithReasoningReset((current) => ({ ...current, model: value }))}
                    style={[styles.fieldInput, themedFieldInput]}
                    autoCapitalize="none"
                    placeholder="gpt-5.4"
                    placeholderTextColor={theme.placeholder}
                  />
                  <Pressable
                    style={[styles.inlineUtilityButton, themedPanel, fetchingModels && styles.disabledAction]}
                    onPress={() => {
                      void fetchModelsForDraftProfile();
                    }}
                    disabled={fetchingModels}
                  >
                    <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
                      {fetchingModels ? copy.fetchingModels : copy.fetchModels}
                    </Text>
                  </Pressable>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                    {uniqueStrings([draftProfile.model, ...(draftProfile.cachedModels ?? []), ...availableModels, ...MODEL_SUGGESTIONS]).map((model) => (
                      <Pressable
                        key={model}
                        style={[styles.suggestionChip, themedPanel, draftProfile.model === model && [styles.selectedChip, themedSelected]]}
                        onPress={() => updateDraftProfileWithReasoningReset((current) => ({ ...current, model }))}
                      >
                        <Text style={[styles.suggestionChipText, themedSubtleText, draftProfile.model === model && { color: theme.primary }]}>
                          {model}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text style={[styles.inlineHint, themedMutedText]}>{getModelHint(draftProfile.model, uiLanguage)}</Text>

                  <View style={[styles.compactSettingCard, themedPanel]}>
                    <View style={styles.compactSettingHeader}>
                      <View style={styles.compactSettingTitleWrap}>
                        <Text style={[styles.compactSettingTitle, { color: theme.text }]}>{copy.reasoningEffort}</Text>
                        <Text style={[styles.compactSettingSubtitle, themedMutedText]}>
                          {copy.currentValue}: {draftProfile.reasoningEffort}
                        </Text>
                      </View>
                      <Pressable style={[styles.inlineUtilityButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => refreshReasoningEffortOptions(draftProfile)}>
                        <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>{copy.fetchReasoningEfforts}</Text>
                      </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                      {reasoningEffortOptions.map((effort) => (
                        <Pressable
                          key={effort}
                          style={[styles.suggestionChip, { backgroundColor: theme.surface, borderColor: theme.border }, draftProfile.reasoningEffort === effort && [styles.selectedChip, themedSelected]]}
                          onPress={() => applyReasoningEffort(effort)}
                        >
                          <Text style={[styles.suggestionChipText, themedSubtleText, draftProfile.reasoningEffort === effort && { color: theme.primary }]}>
                            {effort}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Text style={[styles.inlineHint, themedMutedText]}>
                      {reasoningEffortsFetched
                        ? inferReasoningEffortOptions(draftProfile).length > 1
                          ? copy.reasoningEffortsReady
                          : copy.reasoningEffortsUnavailable
                        : getReasoningEffortHint(draftProfile.model, draftProfile.reasoningEffort, uiLanguage)}
                    </Text>
                  </View>

                  <Pressable
                    style={[styles.advancedToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => setAdvancedApiSettingsOpen((current) => !current)}
                  >
                    <View style={styles.advancedToggleTextWrap}>
                      <Text style={[styles.advancedToggleTitle, { color: theme.text }]}>{copy.advancedApiSettings}</Text>
                      <Text style={[styles.advancedToggleSubtitle, themedMutedText]} numberOfLines={1}>
                        {getAdvancedApiSummary(draftProfile)}
                      </Text>
                    </View>
                    <Text style={[styles.advancedToggleAction, { color: theme.primary }]}>
                      {advancedApiSettingsOpen ? copy.hideAdvancedSettings : copy.showAdvancedSettings}
                    </Text>
                  </Pressable>

                  <SlideFadePresence visible={advancedApiSettingsOpen} from="top" style={[styles.advancedPanel, themedPanel]}>
                      {draftProfile.apiProtocol === 'responses' && (
                        <>
                          <View style={styles.switchRow}>
                            <View style={styles.switchTextWrap}>
                              <Text style={[styles.switchTitle, { color: theme.text }]}>{copy.responseStorage}</Text>
                              <Text style={[styles.switchSubtitle, themedMutedText]}>
                                {draftProfile.storeResponses ? copy.storageEnabled : copy.storageDisabled}
                              </Text>
                            </View>
                            <Pressable
                              style={[styles.compactSwitch, draftProfile.storeResponses && styles.compactSwitchOn]}
                              onPress={() => setDraftProfile((current) => ({ ...current, storeResponses: !current.storeResponses }))}
                            >
                              <View style={[styles.compactSwitchThumb, draftProfile.storeResponses && styles.compactSwitchThumbOn]} />
                            </Pressable>
                          </View>
                          <Text style={[styles.inlineHint, themedMutedText]}>
                            {getProtocolStorageHint(draftProfile.apiProtocol, draftProfile.storeResponses, uiLanguage)}
                          </Text>
                        </>
                      )}

                      <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.projectId}</Text>
                      <TextInput
                        value={draftProfile.projectId}
                        onChangeText={(value) => setDraftProfile((current) => ({ ...current, projectId: value }))}
                        style={[styles.fieldInput, themedFieldInput]}
                        autoCapitalize="none"
                        placeholder="Optional"
                        placeholderTextColor={theme.placeholder}
                      />

                      <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.organization}</Text>
                      <TextInput
                        value={draftProfile.organization}
                        onChangeText={(value) => setDraftProfile((current) => ({ ...current, organization: value }))}
                        style={[styles.fieldInput, themedFieldInput]}
                        autoCapitalize="none"
                        placeholder="Optional"
                        placeholderTextColor={theme.placeholder}
                      />

                      <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.systemPrompt}</Text>
                      <TextInput
                        value={draftProfile.systemPrompt}
                        onChangeText={(value) => setDraftProfile((current) => ({ ...current, systemPrompt: value }))}
                        style={[styles.fieldInput, themedFieldInput, styles.fieldInputMultiline]}
                        multiline
                        placeholder="Optional long-lived instruction"
                        placeholderTextColor={theme.placeholder}
                      />
                      <Text style={[styles.inlineHint, themedMutedText]}>{copy.advancedConfigHint}</Text>
                  </SlideFadePresence>

                  <View style={styles.profileUtilityRow}>
                    <Pressable
                      style={[styles.secondaryActionCard, themedPanel, testingProfile && styles.disabledAction]}
                      onPress={handleTestApiProfile}
                      disabled={testingProfile || savingProfile}
                    >
                      <Text style={[styles.secondaryActionLabel, { color: theme.text }]}>
                        {testingProfile ? copy.testingApiConnection : copy.testApiConnection}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.dangerButtonCompact}
                      onPress={() => confirmDeleteApiProfile(draftProfile.id)}
                      disabled={testingProfile || savingProfile}
                    >
                      <Text style={styles.dangerButtonText}>{copy.deleteApiProfile}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.modalActions}>
                    <Pressable
                      style={[styles.modalPrimary, savingProfile && styles.disabledAction]}
                      onPress={handleSaveApiProfile}
                      disabled={savingProfile}
                    >
                      <Text style={styles.modalPrimaryText}>{savingProfile ? copy.saving : copy.done}</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {settingsSection === 'language' && (
                <View style={[styles.settingOptionGroup, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Pressable
                    style={[
                      styles.settingOption,
                      { borderBottomColor: theme.border },
                      uiLanguage === 'zh' && [styles.settingOptionSelected, themedSelected],
                    ]}
                    onPress={() => applyUiLanguage('zh')}
                  >
                    <View style={[styles.settingOptionRadio, { backgroundColor: theme.surface, borderColor: theme.border }, uiLanguage === 'zh' && styles.settingOptionRadioSelected]}>
                      {uiLanguage === 'zh' && <View style={styles.settingOptionRadioDot} />}
                    </View>
                    <Text style={[styles.settingOptionText, { color: theme.text }]}>{copy.chinese}</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.settingOption,
                      { borderBottomColor: theme.border },
                      uiLanguage === 'en' && [styles.settingOptionSelected, themedSelected],
                    ]}
                    onPress={() => applyUiLanguage('en')}
                  >
                    <View style={[styles.settingOptionRadio, { backgroundColor: theme.surface, borderColor: theme.border }, uiLanguage === 'en' && styles.settingOptionRadioSelected]}>
                      {uiLanguage === 'en' && <View style={styles.settingOptionRadioDot} />}
                    </View>
                    <Text style={[styles.settingOptionText, { color: theme.text }]}>{copy.english}</Text>
                  </Pressable>
                </View>
              )}

              {settingsSection === 'theme' && (
                <View style={[styles.settingOptionGroup, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  {([
                    { mode: 'system' as const, label: copy.themeSystem },
                    { mode: 'light' as const, label: copy.themeLight },
                    { mode: 'dark' as const, label: copy.themeDark },
                  ]).map((option) => (
                    <Pressable
                      key={option.mode}
                      style={[
                        styles.settingOption,
                        { borderBottomColor: theme.border },
                        persisted.themeMode === option.mode && [styles.settingOptionSelected, themedSelected],
                      ]}
                      onPress={() => applyThemeMode(option.mode)}
                    >
                      <View style={[styles.settingOptionRadio, { backgroundColor: theme.surface, borderColor: theme.border }, persisted.themeMode === option.mode && styles.settingOptionRadioSelected]}>
                        {persisted.themeMode === option.mode && <View style={styles.settingOptionRadioDot} />}
                      </View>
                      <Text style={[styles.settingOptionText, { color: theme.text }]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {settingsSection === 'storage' && (
                <>
                  <View style={[styles.infoPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.localStorageTitle}</Text>
                    <Text style={[styles.infoPanelText, { color: theme.muted }]}>{copy.localStorageDescription}</Text>
                  </View>
                  <Pressable style={styles.dangerButton} onPress={confirmClearLocalData} disabled={savingProfile}>
                    <Text style={styles.dangerButtonText}>{copy.clearLocalData}</Text>
                  </Pressable>
                  <Text style={[styles.inlineHint, { color: theme.muted }]}>{copy.clearLocalHint}</Text>
                </>
              )}

              {settingsSection === 'about' && (
                <>
                  <View style={[styles.infoPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.createdBy}</Text>
                    <View style={styles.contactRow}>
                      <Pressable
                        style={[styles.contactChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => openExternalUrl('https://github.com/fanshanng')}
                      >
                        <GitHubIcon color={theme.text} />
                        <Text style={[styles.contactText, { color: theme.subtle }]}>fanshanng</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.contactChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => openExternalUrl('https://github.com/HDdssX')}
                      >
                        <GitHubIcon color={theme.text} />
                        <Text style={[styles.contactText, { color: theme.subtle }]}>HDdss</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={[styles.infoPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.versionLabel}</Text>
                    <Text style={[styles.infoPanelText, { color: theme.muted }]}>v{APP_VERSION}</Text>
                    <Pressable
                      style={[styles.inlineUtilityButton, themedPanel, styles.versionCheckButton, checkingVersion && styles.disabledAction]}
                      onPress={() => {
                        void checkLatestVersion();
                      }}
                      disabled={checkingVersion}
                    >
                      <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
                        {checkingVersion ? copy.checkingLatestVersion : copy.checkLatestVersion}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
              </Animated.View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </Modal>

      <Modal visible={modelPickerVisible} animationType="none" transparent onRequestClose={() => closeBottomSheet()}>
        <View style={styles.modalSheetRoot} pointerEvents={bottomSheetMode === 'models' ? 'auto' : 'none'}>
          <Animated.View style={[styles.modalBackdropLayer, { opacity: bottomSheetBackdropOpacity }]} />
          <Pressable style={styles.modalDismissArea} onPress={() => closeBottomSheet()} />
          <Animated.View style={[styles.modalCardCompact, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateY: bottomSheetTranslateY }] }]}>
            <View style={styles.sessionHeader}>
              <View style={styles.modalHeading}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{copy.modelPickerTitle}</Text>
              </View>
              <Pressable
                style={[styles.modalPrimarySmall, styles.modelFetchButton, fetchingModels && styles.disabledAction]}
                onPress={() => {
                  void fetchModelsForProfile(activeProfile, apiKey);
                }}
                disabled={fetchingModels}
              >
                <Text style={styles.modalPrimaryText}>{fetchingModels ? copy.fetchingModels : copy.fetchModels}</Text>
              </Pressable>
            </View>
            <FlatList
              style={styles.modalScroll}
              contentContainerStyle={styles.modelListContent}
              data={availableModels}
              keyExtractor={(model) => model}
              renderItem={renderModelOption}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
              ListEmptyComponent={
                <Text style={[styles.emptySessionText, { color: theme.muted }]}>{copy.modelsEmpty}</Text>
              }
            />
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={composerExpanded} animationType="slide" onRequestClose={() => setComposerExpanded(false)}>
        <SafeAreaView style={[styles.fullComposerScreen, { backgroundColor: theme.surface }]}>
          <View style={styles.fullComposerHeader}>
            <Pressable style={[styles.fullComposerClose, themedPanel]} onPress={() => setComposerExpanded(false)}>
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
            placeholder={copy.composerPlaceholder}
            placeholderTextColor={theme.placeholder}
            style={[styles.fullComposerInput, themedFieldInput]}
            textAlignVertical="top"
          />
          <View style={styles.fullComposerActions}>
            <Pressable
              style={[styles.fullComposerSend, (!sending && !canSend) && styles.disabledAction]}
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
              {sending ? <StopIcon /> : <SendIcon />}
              <Text style={styles.fullComposerSendText}>{sending ? copy.stopGenerating : copy.send}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {sessionsVisible && (
        <View
          style={styles.drawerModalRoot}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.drawerMainDismissLayer, { transform: [{ translateX: chatSceneTranslateX }] }]}>
            <Pressable
              style={styles.drawerUnderlayPressable}
              onPress={() => closeSessionsDrawer()}
              {...sessionDrawerPanResponder.panHandlers}
            />
          </Animated.View>
          <Animated.View
            style={[styles.drawerBackdrop, { width: sessionDrawerWidth, transform: [{ translateX: sessionDrawerTranslateX }] }]}
            {...sessionDrawerPanResponder.panHandlers}
          >
            <SafeAreaView
              style={[styles.sessionDrawer, { backgroundColor: theme.surface }]}
            >
              <View style={[styles.drawerHeader, { paddingTop: drawerTopInset }]}>
                <View style={styles.drawerHeaderActions}>
                  <Pressable
                    style={[
                      styles.drawerIconButton,
                      { backgroundColor: theme.surface, borderColor: sessionSearchVisible ? theme.primary : theme.border },
                      sessionSearchVisible && styles.drawerIconButtonActive,
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
                    onPress={() => {
                      void copySelectedSessionExports();
                    }}
                    disabled={selectedSessionIds.length === 0}
                  >
                    <Text style={styles.drawerCopyButtonText}>{copy.copySelectedSessions}</Text>
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
                <Text style={[styles.drawerSelectionText, { color: theme.muted }]}>{copy.selectedSessionsCount(selectedSessionIds.length)}</Text>
              )}

              <FlatList
                {...sessionDrawerPanResponder.panHandlers}
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
                    {...sessionDrawerPanResponder.panHandlers}
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
                    backgroundColor: isDark ? theme.primary : '#111827',
                    shadowColor: isDark ? '#000000' : '#0F172A',
                  },
                ]}
                onPress={createNewSession}
              >
                <PlusIcon light />
                <Text style={styles.drawerNewChatText}>{copy.newSession}</Text>
              </Pressable>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

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
              <Pressable style={styles.modalPrimary} onPress={saveRenamedConversation}>
                <Text style={styles.modalPrimaryText}>{copy.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
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
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },
  loadingText: {
    color: '#64748B',
    marginTop: 12,
    fontSize: 15,
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
  pendingRail: {
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  pendingChip: {
    maxWidth: 180,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#D7DEE8',
  },
  pendingChipType: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  pendingChipText: {
    color: '#334155',
    fontSize: 13,
  },
  composerDock: {
    marginHorizontal: 12,
    marginTop: 0,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  attachOptionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  attachOption: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  attachOptionText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
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
    paddingTop: Platform.OS === 'android' ? 20 : 8,
  },  modalDismissArea: {
    flex: 1,
    width: '100%',
  },
  modalBackdropCentered: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    paddingHorizontal: 18,
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
  settingsScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  settingsContentScene: {
    flexGrow: 1,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: 2,
  },
  modalHeading: {
    flex: 1,
    paddingRight: 12,
  },
  modalSubtitle: {
    color: '#64748B',
    marginTop: 8,
    lineHeight: 19,
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
  versionCheckButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
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
  drawerIconButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },  drawerHeaderButton: {
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
    fontSize: 16,
    fontWeight: '800',
  },
  drawerSessionTime: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },  sessionSelectMark: {
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
  modelListContent: {
    paddingBottom: 10,
  },
  modelOption: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modelOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  modelOptionText: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },  renameInput: {
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
  },  profileSummaryAction: {
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
  },  pluginBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  contactChip: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },  contactText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
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
  },  profileChipMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
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
  profileUtilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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
  modelFetchButton: {
    minHeight: 46,
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
