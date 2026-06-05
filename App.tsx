import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

import { MessageBubble } from './src/components/MessageBubble';
import {
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
  assistantLabel,
  classifyModel,
  DEFAULT_LANGUAGE,
  DEFAULT_PROFILE,
  getEndpointHint,
  getModelHint,
  getProtocolStorageHint,
  getReasoningEffortHint,
  MODEL_SUGGESTIONS,
  REASONING_EFFORT_OPTIONS,
} from './src/lib/models';
import {
  createAssistantTurn,
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
import type {
  ApiProfile,
  AttachmentRecord,
  ChatMessage,
  ConversationRecord,
  PendingAttachment,
  PersistedState,
  UiLanguage,
} from './src/types';

type LanguageCopy = {
  eyebrow: string;
  title: string;
  settings: string;
  settingsTitle: string;
  settingsSubtitle: string;
  generalSection: string;
  apiSection: string;
  apiProfilesTitle: string;
  apiProfilesSubtitle: string;
  manageApiProfiles: string;
  newApiProfile: string;
  activeApiProfile: string;
  selectedApiProfile: string;
  deleteApiProfile: string;
  deleteApiProfileTitle: string;
  deleteApiProfileMessage: string;
  cannotDeleteOnlyApiProfile: string;
  testApiConnection: string;
  testingApiConnection: string;
  testConnectionSuccessTitle: string;
  testConnectionSuccessMessage: (latencyMs: number, endpoint: string, sampleText: string) => string;
  testConnectionFailedTitle: string;
  privacySection: string;
  localStorageTitle: string;
  localStorageDescription: string;
  language: string;
  chinese: string;
  english: string;
  openSessions: string;
  newSession: string;
  currentSession: string;
  noSession: string;
  localEncrypted: string;
  directApi: string;
  modelHintLabel: string;
  activeModel: string;
  profileLabel: string;
  apiPreset: string;
  endpointMode: string;
  baseUrl: string;
  baseUrlHint: string;
  advancedConfigHint: string;
  insecureHttpWarning: string;
  apiKey: string;
  model: string;
  reasoningEffort: string;
  responseStorage: string;
  storageEnabled: string;
  storageDisabled: string;
  projectId: string;
  organization: string;
  systemPrompt: string;
  clearLocalData: string;
  clearLocalHint: string;
  close: string;
  save: string;
  saving: string;
  sessionsTitle: string;
  sessionsEmpty: string;
  sessionSearchPlaceholder: string;
  sessionsNoMatches: string;
  renameSession: string;
  renameSessionTitle: string;
  renameSessionPlaceholder: string;
  exportSession: string;
  copiedSessionExport: string;
  done: string;
  delete: string;
  deleteSessionTitle: string;
  deleteSessionMessage: string;
  clearDataTitle: string;
  clearDataMessage: string;
  cancel: string;
  clear: string;
  composerPlaceholder: string;
  image: string;
  file: string;
  send: string;
  sending: string;
  queuedAttachments: string;
  emptyStateTitle: string;
  emptyStateBody: string;
  noActiveSessionTitle: string;
  noActiveSessionBody: string;
  imagePickerFailed: string;
  imagePickerFailedFallback: string;
  filePickerFailed: string;
  filePickerFailedFallback: string;
  apiKeyRequiredTitle: string;
  apiKeyRequiredMessage: string;
  sendFailed: string;
  stopGenerating: string;
  generationStopped: string;
  apiErrorNetwork: string;
  apiErrorUnauthorized: string;
  apiErrorForbidden: string;
  apiErrorNotFound: string;
  apiErrorRateLimited: string;
  apiErrorBadRequest: string;
  apiErrorServer: string;
  apiErrorTimeout: string;
  apiErrorRawPrefix: string;
  clearFailed: string;
  clearFailedFallback: string;
  loading: string;
  sessionCount: (count: number) => string;
  sessionMeta: (assistant: string, model: string, count: number) => string;
};

type SharedImageNativeModule = {
  getInitialImages?: () => Promise<SharedImageInput[]>;
  clear?: () => void;
};

function getSharedImageUri(input: SharedImageInput): string {
  return typeof input === 'string' ? input : input.uri;
}

const COPY: Record<UiLanguage, LanguageCopy> = {
  zh: {
    eyebrow: '本地优先 AI 聊天',
    title: 'Pocket AI',
    settings: '设置',
    settingsTitle: '设置',
    settingsSubtitle: '管理语言、会话和 API 配置。密钥只保存在本机。',
    generalSection: '通用',
    apiSection: 'API 配置',
    apiProfilesTitle: 'API 配置',
    apiProfilesSubtitle: '可以保存多个 API 配置，点完成会自动保存并作为当前聊天使用。',
    manageApiProfiles: '管理 API 配置',
    newApiProfile: '新增配置',
    activeApiProfile: '当前使用',
    selectedApiProfile: '正在编辑',
    deleteApiProfile: '删除配置',
    deleteApiProfileTitle: '删除 API 配置？',
    deleteApiProfileMessage: '这会删除该配置和它保存的 API key，不会删除聊天记录。',
    cannotDeleteOnlyApiProfile: '至少需要保留一个 API 配置。',
    testApiConnection: '测试连接',
    testingApiConnection: '测试中...',
    testConnectionSuccessTitle: '连接可用',
    testConnectionSuccessMessage: (latencyMs, endpoint, sampleText) =>
      `接口已响应，用时 ${latencyMs}ms。\n\n${endpoint}${sampleText ? `\n\n返回示例：${sampleText}` : ''}`,
    testConnectionFailedTitle: '连接测试失败',
    privacySection: '隐私与本地数据',
    localStorageTitle: '聊天记录保存位置',
    localStorageDescription:
      '聊天记录、会话列表和 API 配置会加密后保存在本机应用私有存储（AsyncStorage: ai-chat-pocket.state.v1）。加密密钥和 API key 保存在系统 SecureStore/Keystore；导入的附件会复制到应用私有文件目录。卸载应用或清空本地数据会删除这些内容。',
    language: '界面语言',
    chinese: '中文',
    english: 'English',
    openSessions: '管理会话',
    newSession: '新建会话',
    currentSession: '当前会话',
    noSession: '暂无会话',
    localEncrypted: '本地加密',
    directApi: '直连 API',
    modelHintLabel: '模型说明',
    activeModel: '当前模型',
    profileLabel: '配置名称',
    apiPreset: '服务商预设',
    endpointMode: '接口类型',
    baseUrl: 'Base URL',
    baseUrlHint: '这里只填 API 根地址，接口类型会决定自动拼接 `/responses` 或 `/chat/completions`。',
    advancedConfigHint:
      'Project ID 和 Organization 是 OpenAI 账号/项目路由字段，DeepSeek 一般留空。系统提示词会作为长期规则随上下文发送，例如：“你是我的中文学习助手，回答先给结论，再给例子。”',
    insecureHttpWarning: '当前使用的是 HTTP。API key、消息和附件不会经过 TLS 加密，建议网关支持后切换到 HTTPS。',
    apiKey: 'API Key',
    model: '模型',
    reasoningEffort: '推理强度',
    responseStorage: '服务端响应存储',
    storageEnabled: '开启',
    storageDisabled: '关闭',
    projectId: 'Project ID',
    organization: 'Organization',
    systemPrompt: '系统提示词',
    clearLocalData: '清空本地数据',
    clearLocalHint: '会删除本机保存的 API key、加密后的会话记录、复制的附件以及本地状态。',
    close: '关闭',
    save: '保存',
    saving: '保存中...',
    sessionsTitle: '会话',
    sessionsEmpty: '还没有保存的会话。',
    sessionSearchPlaceholder: '搜索会话或消息...',
    sessionsNoMatches: '没有匹配的会话。',
    renameSession: '重命名',
    renameSessionTitle: '重命名会话',
    renameSessionPlaceholder: '输入新的会话名称',
    exportSession: '复制导出',
    copiedSessionExport: '已复制为 Markdown。',
    done: '完成',
    delete: '删除',
    deleteSessionTitle: '删除会话？',
    deleteSessionMessage: '这会删除该会话的本地消息记录，以及为它复制到应用目录里的附件。',
    clearDataTitle: '清空全部本地数据？',
    clearDataMessage: '这会删除保存的 API key、本地聊天记录、复制的附件和加密状态。',
    cancel: '取消',
    clear: '清空',
    composerPlaceholder: '问点什么...',
    image: '图片',
    file: '文件',
    send: '发送',
    sending: '发送中...',
    queuedAttachments: '待发送附件',
    emptyStateTitle: '开始对话',
    emptyStateBody: '支持文本、图片和文件输入。会话历史保存在本机，界面会根据模型名标记为 Codex 或 CLI。',
    noActiveSessionTitle: '还没有激活会话',
    noActiveSessionBody: '先新建一个会话，保存 API key，然后就可以开始聊天。',
    imagePickerFailed: '选择图片失败',
    imagePickerFailedFallback: '无法读取所选图片。',
    filePickerFailed: '选择文件失败',
    filePickerFailedFallback: '无法读取所选文件。',
    apiKeyRequiredTitle: '需要 API key',
    apiKeyRequiredMessage: '请先在设置里保存 API key。',
    sendFailed: '发送失败',
    stopGenerating: '停止生成',
    generationStopped: '已停止生成。',
    apiErrorNetwork: '网络请求失败。请检查手机网络、Base URL、代理或网关证书。',
    apiErrorUnauthorized: '鉴权失败。请检查 API key 是否正确，是否属于当前服务商或项目。',
    apiErrorForbidden: '当前账号或项目没有权限访问这个模型/接口。',
    apiErrorNotFound: '接口或模型不存在。请检查 Base URL、接口类型和模型名称。',
    apiErrorRateLimited: '请求过于频繁或额度不足。请稍后重试，或检查账号额度。',
    apiErrorBadRequest: '请求参数不兼容。请检查接口类型、模型名称、附件类型和推理强度。',
    apiErrorServer: '服务端暂时不可用。请稍后重试，或切换到其他配置。',
    apiErrorTimeout: '请求超时。请检查网络，或换用更快的模型/网关。',
    apiErrorRawPrefix: '原始错误',
    clearFailed: '清空失败',
    clearFailedFallback: '无法清空本地数据。',
    loading: '正在载入本地聊天数据...',
    sessionCount: (count) => `${count} 个会话`,
    sessionMeta: (assistant, model, count) => `${assistant} | ${model} | ${count} 条消息`,
  },
  en: {
    eyebrow: 'LOCAL-FIRST AI CHAT',
    title: 'Pocket AI',
    settings: 'Settings',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage language, sessions, and API configuration. Your key stays on this device.',
    generalSection: 'General',
    apiSection: 'API Configuration',
    apiProfilesTitle: 'API Profiles',
    apiProfilesSubtitle: 'Save multiple API profiles. Done saves and applies the edited profile automatically.',
    manageApiProfiles: 'Manage API profiles',
    newApiProfile: 'New profile',
    activeApiProfile: 'Current',
    selectedApiProfile: 'Editing',
    deleteApiProfile: 'Delete profile',
    deleteApiProfileTitle: 'Delete API profile?',
    deleteApiProfileMessage: 'This deletes the profile and its saved API key, but keeps chat history.',
    cannotDeleteOnlyApiProfile: 'Keep at least one API profile.',
    testApiConnection: 'Test connection',
    testingApiConnection: 'Testing...',
    testConnectionSuccessTitle: 'Connection works',
    testConnectionSuccessMessage: (latencyMs, endpoint, sampleText) =>
      `Endpoint responded in ${latencyMs}ms.\n\n${endpoint}${sampleText ? `\n\nSample: ${sampleText}` : ''}`,
    testConnectionFailedTitle: 'Connection test failed',
    privacySection: 'Privacy & Local Data',
    localStorageTitle: 'Where chats are stored',
    localStorageDescription:
      'Chats, sessions, and API profiles are encrypted into this app private storage (AsyncStorage: ai-chat-pocket.state.v1). The encryption key and API keys are stored in system SecureStore/Keystore; imported attachments are copied into the app private file directory. Uninstalling the app or clearing local data removes them.',
    language: 'Interface language',
    chinese: 'Chinese',
    english: 'English',
    openSessions: 'Manage sessions',
    newSession: 'New session',
    currentSession: 'Current session',
    noSession: 'No active session',
    localEncrypted: 'Local encrypted',
    directApi: 'Direct API',
    modelHintLabel: 'Model notes',
    activeModel: 'Active model',
    profileLabel: 'Profile label',
    apiPreset: 'Provider preset',
    endpointMode: 'Endpoint mode',
    baseUrl: 'Base URL',
    baseUrlHint: 'Enter only the API root. The endpoint mode decides whether `/responses` or `/chat/completions` is appended.',
    advancedConfigHint:
      'Project ID and Organization are OpenAI account/project routing fields; leave them empty for DeepSeek. The system prompt is sent as a long-lived rule, for example: "You are my Chinese learning assistant. Answer with a short conclusion, then examples."',
    insecureHttpWarning: 'You are using HTTP. Your API key, messages, and attachments are not protected by TLS. Switch to HTTPS when your gateway supports it.',
    apiKey: 'API key',
    model: 'Model',
    reasoningEffort: 'Reasoning effort',
    responseStorage: 'Server response storage',
    storageEnabled: 'Enabled',
    storageDisabled: 'Disabled',
    projectId: 'Project ID',
    organization: 'Organization',
    systemPrompt: 'System prompt',
    clearLocalData: 'Clear all local data',
    clearLocalHint: 'This removes the saved API key, encrypted chat history, copied attachments, and local app state.',
    close: 'Close',
    save: 'Save',
    saving: 'Saving...',
    sessionsTitle: 'Sessions',
    sessionsEmpty: 'No saved sessions yet.',
    sessionSearchPlaceholder: 'Search sessions or messages...',
    sessionsNoMatches: 'No matching sessions.',
    renameSession: 'Rename',
    renameSessionTitle: 'Rename session',
    renameSessionPlaceholder: 'Enter a new session name',
    exportSession: 'Copy export',
    copiedSessionExport: 'Copied as Markdown.',
    done: 'Done',
    delete: 'Delete',
    deleteSessionTitle: 'Delete session?',
    deleteSessionMessage: 'This removes the local messages and copied attachments for this session.',
    clearDataTitle: 'Clear all local data?',
    clearDataMessage: 'This deletes the saved API key, local chat history, copied attachments, and encrypted state on this device.',
    cancel: 'Cancel',
    clear: 'Clear',
    composerPlaceholder: 'Ask anything...',
    image: 'Image',
    file: 'File',
    send: 'Send',
    sending: 'Sending...',
    queuedAttachments: 'Queued attachments',
    emptyStateTitle: 'Start chatting',
    emptyStateBody: 'Use text, images, or files. Chat history stays on-device, and the UI tags sessions as Codex or CLI based on the model name.',
    noActiveSessionTitle: 'No active session',
    noActiveSessionBody: 'Create a session, save an API key, and start chatting.',
    imagePickerFailed: 'Image picker failed',
    imagePickerFailedFallback: 'Unable to read the selected image.',
    filePickerFailed: 'File picker failed',
    filePickerFailedFallback: 'Unable to read the selected file.',
    apiKeyRequiredTitle: 'API key required',
    apiKeyRequiredMessage: 'Save your API key in settings first.',
    sendFailed: 'Send failed',
    stopGenerating: 'Stop generating',
    generationStopped: 'Generation stopped.',
    apiErrorNetwork: 'Network request failed. Check phone connectivity, Base URL, proxy, or gateway certificate.',
    apiErrorUnauthorized: 'Authentication failed. Check that the API key matches this provider and project.',
    apiErrorForbidden: 'This account or project cannot access the selected model or endpoint.',
    apiErrorNotFound: 'Endpoint or model not found. Check Base URL, endpoint mode, and model name.',
    apiErrorRateLimited: 'Too many requests or insufficient quota. Try later or check account quota.',
    apiErrorBadRequest: 'Request parameters are incompatible. Check endpoint mode, model name, attachments, and reasoning effort.',
    apiErrorServer: 'The provider is temporarily unavailable. Try later or switch profiles.',
    apiErrorTimeout: 'Request timed out. Check the network, or use a faster model/gateway.',
    apiErrorRawPrefix: 'Raw error',
    clearFailed: 'Clear failed',
    clearFailedFallback: 'Unable to clear local data.',
    loading: 'Loading local chat vault...',
    sessionCount: (count) => `${count} sessions`,
    sessionMeta: (assistant, model, count) => `${assistant} | ${model} | ${count} messages`,
  },
};

function createConversation(profile: ApiProfile, defaultTitle: string): ConversationRecord {
  const now = new Date().toISOString();
  return {
    id: makeId('conversation'),
    title: defaultTitle,
    model: profile.model,
    assistantKind: classifyModel(profile.model),
    createdAt: now,
    updatedAt: now,
    previousResponseId: null,
    messages: [],
  };
}

function trimTitle(value: string, defaultTitle: string): string {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (!compact) return defaultTitle;
  return compact.length > 36 ? `${compact.slice(0, 36)}...` : compact;
}

function upsertConversation(
  conversations: ConversationRecord[],
  conversation: ConversationRecord
): ConversationRecord[] {
  const next = conversations.filter((item) => item.id !== conversation.id);
  return [conversation, ...next];
}

function getConversationAttachments(conversation: ConversationRecord): AttachmentRecord[] {
  return conversation.messages.flatMap((message) => message.attachments);
}

function getAllConversationAttachments(conversations: ConversationRecord[]): AttachmentRecord[] {
  return conversations.flatMap(getConversationAttachments);
}

function sanitizeProfile(profile: ApiProfile): ApiProfile {
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    id: profile.id || makeId('profile'),
    label: profile.label.trim() || DEFAULT_PROFILE.label,
    apiProtocol: profile.apiProtocol ?? DEFAULT_PROFILE.apiProtocol,
    baseUrl: profile.baseUrl.trim() || DEFAULT_PROFILE.baseUrl,
    model: profile.model.trim() || DEFAULT_PROFILE.model,
    projectId: profile.projectId.trim(),
    organization: profile.organization.trim(),
    systemPrompt: profile.systemPrompt.trim(),
  };
}

function getActiveProfile(state: PersistedState): ApiProfile {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profile;
}

function upsertProfile(profiles: ApiProfile[], profile: ApiProfile): ApiProfile[] {
  const exists = profiles.some((item) => item.id === profile.id);
  if (!exists) {
    return [...profiles, profile];
  }
  return profiles.map((item) => (item.id === profile.id ? profile : item));
}

function applyApiPreset(profile: ApiProfile, preset: (typeof API_PRESETS)[number]): ApiProfile {
  return {
    ...profile,
    apiProtocol: preset.apiProtocol,
    baseUrl: preset.baseUrl,
    model: preset.model,
    storeResponses: preset.storeResponses,
    reasoningEffort: preset.reasoningEffort,
    projectId: preset.id === 'deepseek' ? '' : profile.projectId,
    organization: preset.id === 'deepseek' ? '' : profile.organization,
  };
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function conversationMatchesQuery(conversation: ConversationRecord, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchable = [
    conversation.title,
    conversation.model,
    ...conversation.messages.map((message) => message.text),
    ...conversation.messages.flatMap((message) => message.attachments.map((attachment) => attachment.name)),
  ]
    .join('\n')
    .toLowerCase();

  return searchable.includes(query);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatConversationMarkdown(conversation: ConversationRecord): string {
  const lines = [
    `# ${conversation.title}`,
    '',
    `- Model: ${conversation.model}`,
    `- Created: ${formatDateTime(conversation.createdAt)}`,
    `- Updated: ${formatDateTime(conversation.updatedAt)}`,
    '',
  ];

  for (const message of conversation.messages) {
    lines.push(`## ${message.role === 'user' ? 'User' : 'Assistant'} - ${formatDateTime(message.createdAt)}`);
    lines.push('');
    lines.push(message.text.trim() || '(empty)');
    if (message.error) {
      lines.push('');
      lines.push(`Error: ${message.error}`);
    }
    if (message.attachments.length > 0) {
      lines.push('');
      lines.push('Attachments:');
      for (const attachment of message.attachments) {
        lines.push(`- ${attachment.kind}: ${attachment.name}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export default function App() {
  const scrollRef = useRef<ScrollView>(null);
  const skipNextPersistRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingTextRef = useRef('');
  const handledSharedImageUrisRef = useRef(new Set<string>());
  const [ready, setReady] = useState(false);
  const [persisted, setPersisted] = useState<PersistedState>(EMPTY_STATE);
  const [apiKey, setApiKey] = useState('');
  const [draftProfile, setDraftProfile] = useState<ApiProfile>(DEFAULT_PROFILE);
  const [draftLanguage, setDraftLanguage] = useState<UiLanguage>(DEFAULT_LANGUAGE);
  const [composerText, setComposerText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [testingProfile, setTestingProfile] = useState(false);
  const [sending, setSending] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sessionsVisible, setSessionsVisible] = useState(false);
  const [apiProfilesVisible, setApiProfilesVisible] = useState(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [draftSessionTitle, setDraftSessionTitle] = useState('');

  const uiLanguage = persisted.uiLanguage;
  const copy = COPY[uiLanguage];
  const activeProfile = getActiveProfile(persisted);
  const activeConversation =
    persisted.conversations.find((item) => item.id === persisted.activeConversationId) ?? null;
  const activeSessionTitle = activeConversation?.title || copy.noSession;
  const normalizedSessionSearch = normalizeSearchText(sessionSearchQuery);
  const visibleConversations = persisted.conversations.filter((conversation) =>
    conversationMatchesQuery(conversation, normalizedSessionSearch)
  );
  const renamingConversation =
    persisted.conversations.find((conversation) => conversation.id === renamingConversationId) ?? null;

  useEffect(() => {
    (async () => {
      const state = await loadPersistedState();
      const key = await migrateLegacyApiKey(state.activeProfileId);
      setPersisted(state);
      setDraftProfile(getActiveProfile(state));
      setDraftLanguage(state.uiLanguage);
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
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [persisted, pendingAttachments, composerText, settingsVisible, sessionsVisible, apiProfilesVisible]);

  useEffect(() => {
    if (!ready || Platform.OS !== 'android') return;
    const sharedImageModule = NativeModules.SharedImage as SharedImageNativeModule | undefined;
    if (!sharedImageModule) return;

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
        sharedImageModule.clear?.();
      }
    };

    sharedImageModule
      .getInitialImages?.()
      .then((images) => {
        if (mounted && Array.isArray(images)) {
          void appendSharedImages(images);
        }
      })
      .catch(() => undefined);

    const emitter = new NativeEventEmitter(NativeModules.SharedImage);
    const subscription = emitter.addListener('SharedImages', (images: SharedImageInput[]) => {
      if (Array.isArray(images)) {
        void appendSharedImages(images);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [copy.imagePickerFailed, copy.imagePickerFailedFallback, ready]);

  function updateConversations(nextConversations: ConversationRecord[], nextActiveId: string | null) {
    setPersisted((current) => ({
      ...current,
      conversations: nextConversations,
      activeConversationId: nextActiveId,
    }));
  }

  function ensureConversation(): ConversationRecord {
    if (activeConversation) {
      return activeConversation;
    }

    const created = createConversation(activeProfile, copy.newSession);
    updateConversations([created, ...persisted.conversations], created.id);
    return created;
  }

  async function openSettings() {
    setDraftProfile(activeProfile);
    setDraftLanguage(persisted.uiLanguage);
    setApiKey(await loadProfileApiKey(activeProfile.id));
    setSettingsVisible(true);
  }

  function openApiProfiles() {
    setDraftProfile(activeProfile);
    loadProfileApiKey(activeProfile.id).then(setApiKey).catch(() => setApiKey(''));
    setApiProfilesVisible(true);
  }

  async function selectDraftApiProfile(profile: ApiProfile) {
    setDraftProfile(profile);
    setApiKey(await loadProfileApiKey(profile.id));
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
  }

  async function handleSaveSettings() {
    setSavingProfile(true);
    try {
      setPersisted((current) => ({
        ...current,
        uiLanguage: draftLanguage,
      }));
      setSettingsVisible(false);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveApiProfile() {
    const profile = sanitizeProfile(draftProfile);
    setSavingProfile(true);
    try {
      await saveProfileApiKey(profile.id, apiKey.trim());
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
      setApiProfilesVisible(false);
    } finally {
      setSavingProfile(false);
    }
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

  async function attachImages() {
    try {
      const attachments = await pickImageAttachments();
      if (attachments.length > 0) {
        setPendingAttachments((current) => [...current, ...attachments]);
      }
    } catch (error) {
      Alert.alert(copy.imagePickerFailed, error instanceof Error ? error.message : copy.imagePickerFailedFallback);
    }
  }

  async function attachFiles() {
    try {
      const attachments = await pickDocumentAttachments();
      if (attachments.length > 0) {
        setPendingAttachments((current) => [...current, ...attachments]);
      }
    } catch (error) {
      Alert.alert(copy.filePickerFailed, error instanceof Error ? error.message : copy.filePickerFailedFallback);
    }
  }

  function removePendingAttachment(id: string) {
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
    setSending(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    streamingTextRef.current = '';

    try {
      const turn = await createAssistantTurn({
        profile: activeProfile,
        apiKey: apiKey.trim(),
        conversation,
        nextUserMessage: userMessage,
        signal: abortController.signal,
        onTextDelta: (delta) => {
          streamingTextRef.current += delta;
          setPersisted((current) => ({
            ...current,
            conversations: current.conversations.map((item) =>
              item.id === conversation.id
                ? {
                    ...item,
                    updatedAt: new Date().toISOString(),
                    messages: item.messages.map((message) =>
                      message.id === streamingAssistantMessage.id
                        ? {
                            ...message,
                            text: `${message.text}${delta}`,
                          }
                        : message
                    ),
                  }
                : item
            ),
          }));
        },
      });
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
    } catch (error) {
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
      streamingTextRef.current = '';
      setSending(false);
    }
  }

  async function createNewSession() {
    await deleteAttachmentRecords(pendingAttachments).catch(() => undefined);
    const conversation = createConversation(activeProfile, copy.newSession);
    updateConversations([conversation, ...persisted.conversations], conversation.id);
    setComposerText('');
    setPendingAttachments([]);
    setSessionsVisible(false);
    setSettingsVisible(false);
  }

  function openConversation(conversationId: string) {
    setPersisted((current) => ({
      ...current,
      activeConversationId: conversationId,
    }));
    setSessionsVisible(false);
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
    updateConversations(conversations, nextActiveId);
  }

  function confirmDeleteConversation(conversationId: string) {
    Alert.alert(copy.deleteSessionTitle, copy.deleteSessionMessage, [
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
      setDraftLanguage(DEFAULT_LANGUAGE);
      setApiKey('');
      setComposerText('');
      setPendingAttachments([]);
      setSettingsVisible(false);
      setSessionsVisible(false);
      setApiProfilesVisible(false);
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

  if (!ready) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingTitle}>Pocket AI</Text>
        <Text style={styles.loadingText}>{copy.loading}</Text>
      </SafeAreaView>
    );
  }

  const detectedKind = classifyModel(activeProfile.model);
  const composerDisabled = sending;
  const canSend = !!composerText.trim() || pendingAttachments.length > 0;
  const usingInsecureHttp = draftProfile.baseUrl.trim().toLowerCase().startsWith('http://');

  return (
    <LinearGradient colors={['#FFFFFF', '#F6F8FB', '#EEF3F8']} style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 8}
          style={styles.flex}
        >
          <View style={styles.topBar}>
            <Pressable
              style={styles.iconAction}
              onPress={() => setSessionsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={copy.openSessions}
            >
              <Text style={styles.menuIconText}>☰</Text>
            </Pressable>
            <Pressable style={styles.sessionSwitcher} onPress={() => setSessionsVisible(true)}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.sessionLine} numberOfLines={1}>
                {activeSessionTitle} · {assistantLabel(detectedKind)} · {activeProfile.label} · {activeProfile.model}
              </Text>
            </Pressable>
            <View style={styles.topActions}>
              <Pressable
                style={styles.iconAction}
                onPress={createNewSession}
                accessibilityRole="button"
                accessibilityLabel={copy.newSession}
              >
                <Text style={styles.iconActionText}>+</Text>
              </Pressable>
              <Pressable
                style={styles.iconAction}
                onPress={openSettings}
                accessibilityRole="button"
                accessibilityLabel={copy.settings}
              >
                <Text style={styles.iconActionText}>⋯</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.chatShell}>
            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
              {activeConversation ? (
                activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      language={uiLanguage}
                    />
                  ))
                ) : (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>{activeConversation.title}</Text>
                    <Text style={styles.emptyStateText}>{copy.emptyStateBody}</Text>
                  </View>
                )
              ) : (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateTitle}>{copy.noActiveSessionTitle}</Text>
                  <Text style={styles.emptyStateText}>{copy.noActiveSessionBody}</Text>
                </View>
              )}

            </ScrollView>

            <View style={styles.composerCard}>
              {pendingAttachments.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pendingRail}
                >
                  {pendingAttachments.map((attachment) => (
                    <Pressable
                      key={attachment.id}
                      style={styles.pendingChip}
                      onPress={() => removePendingAttachment(attachment.id)}
                    >
                      <Text style={styles.pendingChipType}>{attachment.kind.toUpperCase()}</Text>
                      <Text style={styles.pendingChipText} numberOfLines={1}>
                        {attachment.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <View style={styles.composerRow}>
                <Pressable
                  style={styles.smallAction}
                  onPress={attachImages}
                  disabled={composerDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={copy.image}
                >
                  <Text style={styles.smallActionText}>{uiLanguage === 'zh' ? '图' : 'Img'}</Text>
                </Pressable>
                <Pressable
                  style={styles.smallAction}
                  onPress={attachFiles}
                  disabled={composerDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={copy.file}
                >
                  <Text style={styles.smallActionText}>{uiLanguage === 'zh' ? '文' : 'Doc'}</Text>
                </Pressable>
                <TextInput
                  value={composerText}
                  onChangeText={setComposerText}
                  editable={!composerDisabled}
                  multiline
                  scrollEnabled
                  placeholder={copy.composerPlaceholder}
                  placeholderTextColor="#78869D"
                  style={styles.composerInput}
                />
                <Pressable
                  style={[
                    styles.sendAction,
                    (!sending && !canSend) && styles.disabledAction,
                  ]}
                  onPress={sending ? handleStopGenerating : handleSend}
                  disabled={!sending && !canSend}
                  accessibilityRole="button"
                  accessibilityLabel={sending ? copy.stopGenerating : copy.send}
                >
                  <Text style={styles.sendActionText}>{sending ? '■' : '↑'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={settingsVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{copy.settingsTitle}</Text>
            <Text style={styles.modalSubtitle}>{copy.settingsSubtitle}</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.sectionLabel}>{copy.generalSection}</Text>

              <Text style={styles.fieldLabel}>{copy.language}</Text>
              <View style={styles.binaryRow}>
                <Pressable
                  style={[styles.binaryChip, draftLanguage === 'zh' && styles.selectedChip]}
                  onPress={() => setDraftLanguage('zh')}
                >
                  <Text style={[styles.binaryChipText, draftLanguage === 'zh' && styles.selectedChipText]}>
                    {copy.chinese}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.binaryChip, draftLanguage === 'en' && styles.selectedChip]}
                  onPress={() => setDraftLanguage('en')}
                >
                  <Text style={[styles.binaryChipText, draftLanguage === 'en' && styles.selectedChipText]}>
                    {copy.english}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.quickActionsRow}>
                <Pressable style={styles.secondaryActionCard} onPress={() => setSessionsVisible(true)}>
                  <Text style={styles.secondaryActionLabel}>{copy.openSessions}</Text>
                </Pressable>
                <Pressable style={styles.secondaryActionCard} onPress={createNewSession}>
                  <Text style={styles.secondaryActionLabel}>{copy.newSession}</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionLabel}>{copy.apiSection}</Text>
              <Pressable style={styles.profileSummaryCard} onPress={openApiProfiles}>
                <View style={styles.profileSummaryHeader}>
                  <Text style={styles.profileSummaryTitle}>{activeProfile.label}</Text>
                  <Text style={styles.profileSummaryBadge}>{copy.activeApiProfile}</Text>
                </View>
                <Text style={styles.profileSummaryText} numberOfLines={1}>
                  {activeProfile.model} · {activeProfile.baseUrl}
                </Text>
                <Text style={styles.profileSummaryAction}>{copy.manageApiProfiles}</Text>
              </Pressable>

              <Text style={styles.sectionLabel}>{copy.privacySection}</Text>
              <View style={styles.infoPanel}>
                <Text style={styles.infoPanelTitle}>{copy.localStorageTitle}</Text>
                <Text style={styles.infoPanelText}>{copy.localStorageDescription}</Text>
              </View>
              <Pressable style={styles.dangerButton} onPress={confirmClearLocalData} disabled={savingProfile}>
                <Text style={styles.dangerButtonText}>{copy.clearLocalData}</Text>
              </Pressable>
              <Text style={styles.inlineHint}>{copy.clearLocalHint}</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setSettingsVisible(false)}>
                <Text style={styles.modalGhostText}>{copy.close}</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={handleSaveSettings} disabled={savingProfile}>
                <Text style={styles.modalPrimaryText}>{savingProfile ? copy.saving : copy.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={apiProfilesVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>{copy.apiProfilesTitle}</Text>
                <Text style={styles.modalSubtitle}>{copy.apiProfilesSubtitle}</Text>
              </View>
              <Pressable style={styles.modalPrimarySmall} onPress={createNewApiProfile}>
                <Text style={styles.modalPrimaryText}>{copy.newApiProfile}</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.profileList}>
                {persisted.profiles.map((profile) => {
                  const isActive = profile.id === persisted.activeProfileId;
                  const isEditing = profile.id === draftProfile.id;
                  return (
                    <Pressable
                      key={profile.id}
                      style={[
                        styles.profileItem,
                        isEditing && styles.profileItemSelected,
                      ]}
                      onPress={() => {
                        void selectDraftApiProfile(profile);
                      }}
                    >
                      <View style={styles.profileItemMain}>
                        <Text style={styles.profileItemTitle}>{profile.label}</Text>
                        <Text style={styles.profileItemSubtitle} numberOfLines={1}>
                          {profile.model} · {profile.baseUrl}
                        </Text>
                      </View>
                      <Text style={[styles.profileStateText, isActive && styles.profileStateActive]}>
                        {isActive ? copy.activeApiProfile : isEditing ? copy.selectedApiProfile : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>{copy.selectedApiProfile}</Text>
              <Text style={styles.fieldLabel}>{copy.profileLabel}</Text>
              <TextInput
                value={draftProfile.label}
                onChangeText={(value) => setDraftProfile((current) => ({ ...current, label: value }))}
                style={styles.fieldInput}
                placeholder="My API"
                placeholderTextColor="#9BA7B7"
              />

              <Text style={styles.fieldLabel}>{copy.apiPreset}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                {API_PRESETS.map((preset) => {
                  const selected =
                    draftProfile.apiProtocol === preset.apiProtocol &&
                    draftProfile.baseUrl === preset.baseUrl &&
                    draftProfile.model === preset.model;
                  return (
                    <Pressable
                      key={preset.id}
                      style={[styles.suggestionChip, selected && styles.selectedChip]}
                      onPress={() => setDraftProfile((current) => applyApiPreset(current, preset))}
                    >
                      <Text style={[styles.suggestionChipText, selected && styles.selectedChipText]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>{copy.endpointMode}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                {API_PROTOCOL_OPTIONS.map((protocol) => (
                  <Pressable
                    key={protocol}
                    style={[styles.suggestionChip, draftProfile.apiProtocol === protocol && styles.selectedChip]}
                    onPress={() => setDraftProfile((current) => ({ ...current, apiProtocol: protocol }))}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        draftProfile.apiProtocol === protocol && styles.selectedChipText,
                      ]}
                    >
                      {apiProtocolLabel(protocol, draftLanguage)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.inlineHint}>{getEndpointHint(draftProfile.apiProtocol, draftLanguage)}</Text>

              <Text style={styles.fieldLabel}>{copy.baseUrl}</Text>
              <TextInput
                value={draftProfile.baseUrl}
                onChangeText={(value) => setDraftProfile((current) => ({ ...current, baseUrl: value }))}
                style={styles.fieldInput}
                autoCapitalize="none"
                placeholder="https://api.openai.com/v1"
                placeholderTextColor="#9BA7B7"
              />
              <Text style={styles.inlineHint}>{COPY[draftLanguage].baseUrlHint}</Text>
              {usingInsecureHttp && <Text style={styles.warningText}>{COPY[draftLanguage].insecureHttpWarning}</Text>}

              <Text style={styles.fieldLabel}>{copy.apiKey}</Text>
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                style={styles.fieldInput}
                autoCapitalize="none"
                secureTextEntry
                placeholder="sk-..."
                placeholderTextColor="#9BA7B7"
              />

              <Text style={styles.fieldLabel}>{copy.model}</Text>
              <TextInput
                value={draftProfile.model}
                onChangeText={(value) => setDraftProfile((current) => ({ ...current, model: value }))}
                style={styles.fieldInput}
                autoCapitalize="none"
                placeholder="gpt-5.4"
                placeholderTextColor="#9BA7B7"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                {MODEL_SUGGESTIONS.map((model) => (
                  <Pressable
                    key={model}
                    style={[styles.suggestionChip, draftProfile.model === model && styles.selectedChip]}
                    onPress={() => setDraftProfile((current) => ({ ...current, model }))}
                  >
                    <Text style={[styles.suggestionChipText, draftProfile.model === model && styles.selectedChipText]}>
                      {model}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.inlineHint}>{getModelHint(draftProfile.model, draftLanguage)}</Text>

              <Text style={styles.fieldLabel}>{copy.reasoningEffort}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                {REASONING_EFFORT_OPTIONS.map((effort) => (
                  <Pressable
                    key={effort}
                    style={[styles.suggestionChip, draftProfile.reasoningEffort === effort && styles.selectedChip]}
                    onPress={() => setDraftProfile((current) => ({ ...current, reasoningEffort: effort }))}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        draftProfile.reasoningEffort === effort && styles.selectedChipText,
                      ]}
                    >
                      {effort}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.inlineHint}>
                {getReasoningEffortHint(draftProfile.model, draftProfile.reasoningEffort, draftLanguage)}
              </Text>

              {draftProfile.apiProtocol === 'responses' && (
                <>
                  <Text style={styles.fieldLabel}>{copy.responseStorage}</Text>
                  <View style={styles.binaryRow}>
                    <Pressable
                      style={[styles.binaryChip, draftProfile.storeResponses && styles.selectedChip]}
                      onPress={() => setDraftProfile((current) => ({ ...current, storeResponses: true }))}
                    >
                      <Text style={[styles.binaryChipText, draftProfile.storeResponses && styles.selectedChipText]}>
                        {copy.storageEnabled}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.binaryChip, !draftProfile.storeResponses && styles.selectedChip]}
                      onPress={() => setDraftProfile((current) => ({ ...current, storeResponses: false }))}
                    >
                      <Text style={[styles.binaryChipText, !draftProfile.storeResponses && styles.selectedChipText]}>
                        {copy.storageDisabled}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
              <Text style={styles.inlineHint}>
                {getProtocolStorageHint(draftProfile.apiProtocol, draftProfile.storeResponses, draftLanguage)}
              </Text>

              <Text style={styles.fieldLabel}>{copy.projectId}</Text>
              <TextInput
                value={draftProfile.projectId}
                onChangeText={(value) => setDraftProfile((current) => ({ ...current, projectId: value }))}
                style={styles.fieldInput}
                autoCapitalize="none"
                placeholder="Optional"
                placeholderTextColor="#9BA7B7"
              />

              <Text style={styles.fieldLabel}>{copy.organization}</Text>
              <TextInput
                value={draftProfile.organization}
                onChangeText={(value) => setDraftProfile((current) => ({ ...current, organization: value }))}
                style={styles.fieldInput}
                autoCapitalize="none"
                placeholder="Optional"
                placeholderTextColor="#9BA7B7"
              />

              <Text style={styles.fieldLabel}>{copy.systemPrompt}</Text>
              <TextInput
                value={draftProfile.systemPrompt}
                onChangeText={(value) => setDraftProfile((current) => ({ ...current, systemPrompt: value }))}
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                multiline
                placeholder="Optional long-lived instruction"
                placeholderTextColor="#9BA7B7"
              />
              <Text style={styles.inlineHint}>{copy.advancedConfigHint}</Text>

              <View style={styles.profileUtilityRow}>
                <Pressable
                  style={[styles.secondaryActionCard, testingProfile && styles.disabledAction]}
                  onPress={handleTestApiProfile}
                  disabled={testingProfile || savingProfile}
                >
                  <Text style={styles.secondaryActionLabel}>
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
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setApiProfilesVisible(false)}>
                <Text style={styles.modalGhostText}>{copy.close}</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={handleSaveApiProfile} disabled={savingProfile}>
                <Text style={styles.modalPrimaryText}>{savingProfile ? copy.saving : copy.done}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={sessionsVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.modalTitle}>{copy.sessionsTitle}</Text>
              <Pressable style={styles.modalPrimarySmall} onPress={createNewSession}>
                <Text style={styles.modalPrimaryText}>{copy.newSession}</Text>
              </Pressable>
            </View>
            <TextInput
              value={sessionSearchQuery}
              onChangeText={setSessionSearchQuery}
              style={[styles.fieldInput, styles.sessionSearchInput]}
              placeholder={copy.sessionSearchPlaceholder}
              placeholderTextColor="#9BA7B7"
            />
            <ScrollView style={styles.modalScroll}>
              {persisted.conversations.length === 0 ? (
                <Text style={styles.emptySessionText}>{copy.sessionsEmpty}</Text>
              ) : visibleConversations.length === 0 ? (
                <Text style={styles.emptySessionText}>{copy.sessionsNoMatches}</Text>
              ) : (
                visibleConversations.map((conversation) => (
                  <View key={conversation.id} style={styles.sessionItem}>
                    <Pressable style={styles.sessionMeta} onPress={() => openConversation(conversation.id)}>
                      <Text style={styles.sessionTitle}>{conversation.title}</Text>
                      <Text style={styles.sessionSubtitle}>
                        {copy.sessionMeta(
                          assistantLabel(conversation.assistantKind),
                          conversation.model,
                          conversation.messages.length
                        )}
                      </Text>
                    </Pressable>
                    <View style={styles.sessionActions}>
                      <Pressable onPress={() => promptRenameConversation(conversation)}>
                        <Text style={styles.sessionActionText}>{copy.renameSession}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          void copyConversationExport(conversation);
                        }}
                      >
                        <Text style={styles.sessionActionText}>{copy.exportSession}</Text>
                      </Pressable>
                      <Pressable onPress={() => confirmDeleteConversation(conversation.id)}>
                        <Text style={styles.deleteText}>{copy.delete}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setSessionsVisible(false)}>
                <Text style={styles.modalGhostText}>{copy.done}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!renamingConversation} animationType="fade" transparent>
        <View style={styles.modalBackdropCentered}>
          <View style={styles.renameCard}>
            <Text style={styles.modalTitle}>{copy.renameSessionTitle}</Text>
            <TextInput
              value={draftSessionTitle}
              onChangeText={setDraftSessionTitle}
              style={[styles.fieldInput, styles.renameInput]}
              placeholder={copy.renameSessionPlaceholder}
              placeholderTextColor="#9BA7B7"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={closeRenameModal}>
                <Text style={styles.modalGhostText}>{copy.cancel}</Text>
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
    paddingTop: 18,
    paddingBottom: 6,
    gap: 8,
  },
  sessionSwitcher: {
    flex: 1,
  },
  title: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '800',
  },
  sessionLine: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionText: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  menuIconText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
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
    paddingBottom: 28,
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
  composerCard: {
    marginHorizontal: 12,
    marginTop: 2,
    marginBottom: Platform.OS === 'android' ? 8 : 10,
    padding: 5,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  composerRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  composerInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 96,
    color: '#111827',
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingTop: 9,
    paddingBottom: 7,
    textAlignVertical: 'top',
  },
  smallAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8E0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallActionText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  sendAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  disabledAction: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'flex-end',
  },
  modalBackdropCentered: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
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
  sessionSearchInput: {
    marginTop: 16,
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
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
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
  },
  profileSummaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  profileSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  profileSummaryTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  profileSummaryBadge: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  profileSummaryText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
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
  profileList: {
    gap: 10,
    marginBottom: 12,
  },
  profileItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileItemSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  profileItemMain: {
    flex: 1,
  },
  profileItemTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  profileItemSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
  profileStateText: {
    minWidth: 48,
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  profileStateActive: {
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
  },
  selectedChipText: {
    color: '#1D4ED8',
  },
  binaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  binaryChip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  binaryChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
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
  },
  sessionItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sessionActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
  },
  sessionMeta: {
    flex: 1,
  },
  sessionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  sessionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  deleteText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionActionText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
});
