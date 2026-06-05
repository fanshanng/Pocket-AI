import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  NativeEventEmitter,
  NativeModules,
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
import type { GestureResponderEvent } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

import { MessageBubble } from './src/components/MessageBubble';
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
  DEFAULT_LANGUAGE,
  DEFAULT_PROFILE,
  getEndpointHint,
  getModelHint,
  getProtocolStorageHint,
  getReasoningEffortHint,
  modelSupportsReasoning,
  MODEL_SUGGESTIONS,
  REASONING_EFFORT_OPTIONS,
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
import type {
  ApiProfile,
  AttachmentRecord,
  ChatMessage,
  ConversationRecord,
  PendingAttachment,
  PersistedState,
  ReasoningEffort,
  UiLanguage,
} from './src/types';
import { getContentPlugins } from './src/plugins';

type LanguageCopy = {
  eyebrow: string;
  title: string;
  settings: string;
  settingsTitle: string;
  settingsSubtitle: string;
  back: string;
  generalSection: string;
  apiSection: string;
  recordsSection: string;
  storageSection: string;
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
  pluginsSection: string;
  pluginsTitle: string;
  pluginsDescription: string;
  aboutSection: string;
  createdBy: string;
  github: string;
  blog: string;
  email: string;
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
  switchModel: string;
  modelPickerTitle: string;
  fetchModels: string;
  fetchingModels: string;
  modelsEmpty: string;
  modelsFetchFailed: string;
  basicApiSettings: string;
  advancedApiSettings: string;
  showAdvancedSettings: string;
  hideAdvancedSettings: string;
  currentValue: string;
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
  fetchReasoningEfforts: string;
  reasoningEffortsReady: string;
  reasoningEffortsUnavailable: string;
  reasoningEffortCustomPlaceholder: string;
  reasoningEffortInvalid: string;
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
  selectSessions: string;
  cancelSelection: string;
  copySelectedSessions: string;
  latestSessionsFirst: string;
  selectedSessionsCount: (count: number) => string;
  done: string;
  delete: string;
  deleteSessionTitle: string;
  deleteSessionMessage: string;
  clearDataTitle: string;
  clearDataMessage: string;
  cancel: string;
  clear: string;
  composerPlaceholder: string;
  attachMenu: string;
  camera: string;
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
  sessionMeta: (model: string, count: number) => string;
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
    back: '返回',
    generalSection: '通用',
    apiSection: 'API 配置',
    recordsSection: '聊天记录',
    storageSection: '聊天记录存储',
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
    pluginsSection: '插件',
    pluginsTitle: '内置内容插件',
    pluginsDescription: '插件会在消息显示前做轻量处理，例如把常见 LaTeX/密码学公式转成更易读的符号。',
    aboutSection: '关于',
    createdBy: '由 fanshanng 共创维护',
    github: 'GitHub',
    blog: '博客',
    email: '邮箱',
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
    switchModel: '切换模型',
    modelPickerTitle: '选择模型',
    fetchModels: '获取模型',
    fetchingModels: '获取中...',
    modelsEmpty: '暂无可选模型，请先获取或手动输入。',
    modelsFetchFailed: '获取模型失败',
    basicApiSettings: '常用配置',
    advancedApiSettings: '高级配置',
    showAdvancedSettings: '展开高级配置',
    hideAdvancedSettings: '收起高级配置',
    currentValue: '当前',
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
    fetchReasoningEfforts: '获取推理强度',
    reasoningEffortsReady: '已根据当前接口和模型更新可选推理强度。',
    reasoningEffortsUnavailable: '当前模型未识别到推理强度参数，建议保持关闭。',
    reasoningEffortCustomPlaceholder: '输入其他值，如 medium/high',
    reasoningEffortInvalid: '无效推理强度，未应用。',
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
    selectSessions: '选择',
    cancelSelection: '取消选择',
    copySelectedSessions: '复制所选',
    latestSessionsFirst: '最新对话在上方',
    selectedSessionsCount: (count) => `已选 ${count} 个`,
    done: '完成',
    delete: '删除',
    deleteSessionTitle: '删除会话？',
    deleteSessionMessage: '这会删除该会话的本地消息记录，以及为它复制到应用目录里的附件。',
    clearDataTitle: '清空全部本地数据？',
    clearDataMessage: '这会删除保存的 API key、本地聊天记录、复制的附件和加密状态。',
    cancel: '取消',
    clear: '清空',
    composerPlaceholder: '问点什么...',
    attachMenu: '添加附件',
    camera: '拍照',
    image: '图片',
    file: '文件',
    send: '发送',
    sending: '发送中...',
    queuedAttachments: '待发送附件',
    emptyStateTitle: '开始对话',
    emptyStateBody: '支持文本、图片和文件输入。会话历史保存在本机，可随时管理 API 配置和本地会话。',
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
    sessionMeta: (model, count) => `${model} | ${count} 条消息`,
  },
  en: {
    eyebrow: 'LOCAL-FIRST AI CHAT',
    title: 'Pocket AI',
    settings: 'Settings',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage language, sessions, and API configuration. Your key stays on this device.',
    back: 'Back',
    generalSection: 'General',
    apiSection: 'API Configuration',
    recordsSection: 'Chat History',
    storageSection: 'Chat Storage',
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
    pluginsSection: 'Plugins',
    pluginsTitle: 'Built-in content plugins',
    pluginsDescription: 'Plugins lightly transform messages before display, such as making common LaTeX and cryptography formulas easier to read.',
    aboutSection: 'About',
    createdBy: 'Co-created and maintained by fanshanng',
    github: 'GitHub',
    blog: 'Blog',
    email: 'Email',
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
    switchModel: 'Switch model',
    modelPickerTitle: 'Choose model',
    fetchModels: 'Fetch models',
    fetchingModels: 'Fetching...',
    modelsEmpty: 'No models yet. Fetch models or type one manually.',
    modelsFetchFailed: 'Unable to fetch models',
    basicApiSettings: 'Basic settings',
    advancedApiSettings: 'Advanced settings',
    showAdvancedSettings: 'Show advanced settings',
    hideAdvancedSettings: 'Hide advanced settings',
    currentValue: 'Current',
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
    fetchReasoningEfforts: 'Fetch efforts',
    reasoningEffortsReady: 'Reasoning effort choices were updated for this endpoint and model.',
    reasoningEffortsUnavailable: 'No reasoning effort parameter was detected for this model. Keep it off.',
    reasoningEffortCustomPlaceholder: 'Enter another value, e.g. medium/high',
    reasoningEffortInvalid: 'Invalid reasoning effort. Not applied.',
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
    selectSessions: 'Select',
    cancelSelection: 'Cancel selection',
    copySelectedSessions: 'Copy selected',
    latestSessionsFirst: 'Latest chats first',
    selectedSessionsCount: (count) => `${count} selected`,
    done: 'Done',
    delete: 'Delete',
    deleteSessionTitle: 'Delete session?',
    deleteSessionMessage: 'This removes the local messages and copied attachments for this session.',
    clearDataTitle: 'Clear all local data?',
    clearDataMessage: 'This deletes the saved API key, local chat history, copied attachments, and encrypted state on this device.',
    cancel: 'Cancel',
    clear: 'Clear',
    composerPlaceholder: 'Ask anything...',
    attachMenu: 'Add attachment',
    camera: 'Camera',
    image: 'Image',
    file: 'File',
    send: 'Send',
    sending: 'Sending...',
    queuedAttachments: 'Queued attachments',
    emptyStateTitle: 'Start chatting',
    emptyStateBody: 'Use text, images, or files. Chat history stays on-device, with local session and API profile management.',
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
    sessionMeta: (model, count) => `${model} | ${count} messages`,
  },
};

const STREAMING_FLUSH_INTERVAL_MS = 120;

type SettingsSection = 'root' | 'api' | 'language' | 'records' | 'storage' | 'plugins' | 'about';

function createConversation(profile: ApiProfile, defaultTitle: string): ConversationRecord {
  const now = new Date().toISOString();
  return {
    id: makeId('conversation'),
    title: defaultTitle,
    model: profile.model,
    assistantKind: classifyModel(profile.model),
    createdAt: now,
    updatedAt: now,
    pinned: false,
    previousResponseId: null,
    messages: [],
  };
}

function trimTitle(value: string, defaultTitle: string): string {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (!compact) return defaultTitle;
  return compact.length > 36 ? `${compact.slice(0, 36)}...` : compact;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function upsertConversation(
  conversations: ConversationRecord[],
  conversation: ConversationRecord
): ConversationRecord[] {
  const next = conversations.filter((item) => item.id !== conversation.id);
  return [conversation, ...next];
}

function sortConversationsForList(conversations: ConversationRecord[]): ConversationRecord[] {
  return [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
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

function inferReasoningEffortOptions(profile: ApiProfile): ReasoningEffort[] {
  const model = profile.model.trim().toLowerCase();
  if (!modelSupportsReasoning(profile.model)) {
    return ['none'];
  }

  if (profile.apiProtocol === 'chatCompletions') {
    if (model.startsWith('deepseek-v4') || model === 'deepseek-reasoner') {
      return ['none', 'high', 'xhigh'];
    }
    return ['none'];
  }

  if (model.startsWith('gpt-5') || /^o\d/.test(model)) {
    return REASONING_EFFORT_OPTIONS;
  }

  return ['none'];
}

function profileHasAdvancedValues(profile: ApiProfile): boolean {
  return (
    profile.projectId.trim().length > 0 ||
    profile.organization.trim().length > 0 ||
    profile.systemPrompt.trim().length > 0 ||
    profile.storeResponses
  );
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

function formatRelativeTime(value: string, language: UiLanguage): string {
  const date = new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) {
    return language === 'zh' ? '刚刚' : 'Just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return language === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return language === 'zh' ? `${hours}小时前` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return language === 'zh' ? `${days}天前` : `${days}d ago`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatConversationListMeta(conversation: ConversationRecord, language: UiLanguage): string {
  const messageText =
    language === 'zh'
      ? `${conversation.messages.length}条消息`
      : `${conversation.messages.length} messages`;
  return `${conversation.model} | ${messageText} | ${formatRelativeTime(conversation.updatedAt, language)}`;
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
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const shouldScrollToBottomRef = useRef(true);
  const skipNextPersistRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingTextRef = useRef('');
  const streamingFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamingConversationIdRef = useRef<string | null>(null);
  const handledSharedImageUrisRef = useRef(new Set<string>());
  const sessionDrawerTranslateX = useRef(new Animated.Value(0)).current;
  const sessionDrawerHiddenOffsetRef = useRef(360);
  const sessionDrawerAnimationIdRef = useRef(0);
  const sessionDrawerCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerGestureOpeningRef = useRef(false);
  const drawerGestureFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsPanelTranslateX = useRef(new Animated.Value(0)).current;
  const settingsPanelHiddenOffsetRef = useRef(360);
  const settingsPanelAnimationIdRef = useRef(0);
  const settingsPanelCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsReturnTargetRef = useRef<'chat' | 'drawer'>('chat');
  const settingsTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const settingsTouchHasClosedRef = useRef(false);
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
  const [apiProfilesVisible, setApiProfilesVisible] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('root');
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionSelectionMode, setSessionSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [sessionContextMenuId, setSessionContextMenuId] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [draftSessionTitle, setDraftSessionTitle] = useState('');
  const [advancedApiSettingsOpen, setAdvancedApiSettingsOpen] = useState(false);
  const [reasoningEffortOptions, setReasoningEffortOptions] = useState<ReasoningEffort[]>(['none']);
  const [reasoningEffortsFetched, setReasoningEffortsFetched] = useState(false);

  const uiLanguage = persisted.uiLanguage;
  const copy = COPY[uiLanguage];
  const activeProfile = getActiveProfile(persisted);
  const activeConversation =
    persisted.conversations.find((item) => item.id === persisted.activeConversationId) ?? null;
  const activeSessionTitle = activeConversation?.title || copy.noSession;
  const normalizedSessionSearch = normalizeSearchText(sessionSearchQuery);
  const sortedConversations = sortConversationsForList(persisted.conversations);
  const visibleConversations = sortedConversations.filter((conversation) =>
    conversationMatchesQuery(conversation, normalizedSessionSearch)
  );
  const renamingConversation =
    persisted.conversations.find((conversation) => conversation.id === renamingConversationId) ?? null;
  const sessionContextConversation =
    persisted.conversations.find((conversation) => conversation.id === sessionContextMenuId) ?? null;
  sessionDrawerHiddenOffsetRef.current = Math.max(windowWidth, 320);
  settingsPanelHiddenOffsetRef.current = Math.max(windowWidth, 320);
  const sessionDrawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 14 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.18,
        onPanResponderGrant: () => {
          sessionDrawerTranslateX.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            sessionDrawerTranslateX.setValue(Math.max(-sessionDrawerHiddenOffsetRef.current, gestureState.dx));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -windowWidth * 0.22 || gestureState.vx < -0.75) {
            closeSessionsDrawer();
            return;
          }
          openSessionsDrawer();
        },
        onPanResponderTerminate: () => {
          closeSessionsDrawer();
        },
      }),
    [sessionDrawerTranslateX, windowWidth]
  );
  const chatOpenDrawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (sessionsVisible || settingsVisible || apiProfilesVisible || modelPickerVisible || chatMenuVisible) {
            return false;
          }
          return gestureState.dx > 16 && gestureState.dx > Math.abs(gestureState.dy) * 1.35;
        },
        onPanResponderGrant: () => {
          drawerGestureOpeningRef.current = true;
          if (drawerGestureFallbackRef.current) {
            clearTimeout(drawerGestureFallbackRef.current);
          }
          drawerGestureFallbackRef.current = setTimeout(() => {
            if (drawerGestureOpeningRef.current) {
              drawerGestureOpeningRef.current = false;
              closeSessionsDrawer();
            }
          }, 900);
          sessionDrawerTranslateX.stopAnimation();
          setSessionsVisible(true);
          sessionDrawerTranslateX.setValue(-sessionDrawerHiddenOffsetRef.current);
        },
        onPanResponderMove: (_, gestureState) => {
          const nextX = Math.min(0, -sessionDrawerHiddenOffsetRef.current + Math.max(0, gestureState.dx));
          sessionDrawerTranslateX.setValue(nextX);
        },
        onPanResponderRelease: (_, gestureState) => {
          drawerGestureOpeningRef.current = false;
          if (drawerGestureFallbackRef.current) {
            clearTimeout(drawerGestureFallbackRef.current);
            drawerGestureFallbackRef.current = null;
          }
          if (gestureState.dx > windowWidth * 0.22 || gestureState.vx > 0.75) {
            openSessionsDrawer();
            return;
          }
          closeSessionsDrawer();
        },
        onPanResponderTerminate: () => {
          drawerGestureOpeningRef.current = false;
          if (drawerGestureFallbackRef.current) {
            clearTimeout(drawerGestureFallbackRef.current);
            drawerGestureFallbackRef.current = null;
          }
          closeSessionsDrawer();
        },
      }),
    [
      apiProfilesVisible,
      chatMenuVisible,
      modelPickerVisible,
      sessionDrawerTranslateX,
      sessionsVisible,
      settingsVisible,
      windowWidth,
    ]
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
    if (!sessionsVisible) {
      return;
    }
    if (drawerGestureOpeningRef.current) {
      return;
    }
    openSessionsDrawer();
  }, [sessionDrawerTranslateX, sessionsVisible, windowWidth]);

  useEffect(() => {
    if (!settingsVisible) {
      return;
    }
    const hiddenOffset = settingsPanelHiddenOffsetRef.current;
    settingsPanelTranslateX.setValue(hiddenOffset);
    Animated.timing(settingsPanelTranslateX, {
      toValue: 0,
      duration: 190,
      useNativeDriver: true,
    }).start();
  }, [settingsPanelTranslateX, settingsVisible, windowWidth]);

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) {
      return;
    }
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
    shouldScrollToBottomRef.current = false;
  }, [
    activeConversation?.id,
    activeConversation?.messages.length,
    pendingAttachments.length,
    settingsVisible,
    sessionsVisible,
    apiProfilesVisible,
  ]);

  useEffect(
    () => () => {
      if (streamingFlushTimerRef.current) {
        clearTimeout(streamingFlushTimerRef.current);
      }
      if (sessionDrawerCloseFallbackRef.current) {
        clearTimeout(sessionDrawerCloseFallbackRef.current);
      }
      if (settingsPanelCloseFallbackRef.current) {
        clearTimeout(settingsPanelCloseFallbackRef.current);
      }
      if (drawerGestureFallbackRef.current) {
        clearTimeout(drawerGestureFallbackRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (reasoningEffortsFetched) {
      setReasoningEffortOptions(inferReasoningEffortOptions(draftProfile));
      return;
    }

    setReasoningEffortOptions(uniqueStrings(['none', draftProfile.reasoningEffort]) as ReasoningEffort[]);
  }, [draftProfile.apiProtocol, draftProfile.model, draftProfile.reasoningEffort, reasoningEffortsFetched]);

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
    shouldScrollToBottomRef.current = true;
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

  async function openSettings(returnTarget: 'chat' | 'drawer' = 'chat') {
    setChatMenuVisible(false);
    const animationId = settingsPanelAnimationIdRef.current + 1;
    settingsPanelAnimationIdRef.current = animationId;
    if (settingsPanelCloseFallbackRef.current) {
      clearTimeout(settingsPanelCloseFallbackRef.current);
      settingsPanelCloseFallbackRef.current = null;
    }
    settingsPanelTranslateX.stopAnimation();
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
      settingsReturnTargetRef.current = 'chat';
    };
    settingsPanelCloseFallbackRef.current = setTimeout(finishClose, 260);
    Animated.timing(settingsPanelTranslateX, {
      toValue: settingsPanelHiddenOffsetRef.current,
      duration: 160,
      useNativeDriver: true,
    }).start(finishClose);
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
    if (Math.abs(dx) <= 72 || Math.abs(dx) <= Math.abs(dy) * 1.25) {
      return false;
    }

    if (dx > 0) {
      settingsTouchHasClosedRef.current = true;
      closeSettingsPanel();
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
    setDraftProfile(activeProfile);
    loadProfileApiKey(activeProfile.id).then(setApiKey).catch(() => setApiKey(''));
    resetApiProfileEditor(activeProfile);
    setApiProfilesVisible(true);
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

  function resetApiProfileEditor(profile: ApiProfile) {
    setAdvancedApiSettingsOpen(profileHasAdvancedValues(profile));
    setReasoningEffortOptions(uniqueStrings(['none', profile.reasoningEffort]) as ReasoningEffort[]);
    setReasoningEffortsFetched(false);
  }

  function refreshReasoningEffortOptions(profile: ApiProfile = draftProfile) {
    const options = inferReasoningEffortOptions(profile);
    setReasoningEffortOptions(options);
    setReasoningEffortsFetched(true);

    if (!options.includes(profile.reasoningEffort)) {
      setDraftProfile((current) => ({ ...current, reasoningEffort: options[0] ?? 'none' }));
    }
  }

  function updateDraftProfileWithReasoningReset(updater: (current: ApiProfile) => ApiProfile) {
    setReasoningEffortsFetched(false);
    setDraftProfile(updater);
  }

  function applyReasoningEffort(effort: ReasoningEffort) {
    setDraftProfile((current) => ({ ...current, reasoningEffort: effort }));
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

  async function attachFromCamera() {
    try {
      appendPendingAttachments(await captureImageAttachment());
    } catch (error) {
      Alert.alert(copy.imagePickerFailed, error instanceof Error ? error.message : copy.imagePickerFailedFallback);
    }
  }

  async function attachImages() {
    try {
      appendPendingAttachments(await pickImageAttachments());
    } catch (error) {
      Alert.alert(copy.imagePickerFailed, error instanceof Error ? error.message : copy.imagePickerFailedFallback);
    }
  }

  async function attachFiles() {
    try {
      appendPendingAttachments(await pickDocumentAttachments());
    } catch (error) {
      Alert.alert(copy.filePickerFailed, error instanceof Error ? error.message : copy.filePickerFailedFallback);
    }
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
      setAvailableModels(result.models);
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
    setAvailableModels((current) => uniqueStrings([activeProfile.model, draftProfile.model, ...MODEL_SUGGESTIONS, ...current]));
    setModelPickerVisible(true);
    if (apiKey.trim()) {
      void fetchModelsForProfile(activeProfile, apiKey);
    }
  }

  function applyModelToActiveProfile(model: string) {
    const nextModel = model.trim();
    if (!nextModel) {
      return;
    }
    setPersisted((current) => {
      const profile = getActiveProfile(current);
      const updatedProfile: ApiProfile = { ...profile, model: nextModel };
      const profiles = upsertProfile(current.profiles, updatedProfile);
      return {
        ...current,
        profiles,
        profile: updatedProfile,
      };
    });
    setDraftProfile((current) => ({ ...current, model: nextModel }));
    setModelPickerVisible(false);
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

  function clearStreamingFlushTimer() {
    if (streamingFlushTimerRef.current) {
      clearTimeout(streamingFlushTimerRef.current);
      streamingFlushTimerRef.current = null;
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

  function openSessionsDrawer() {
    const animationId = sessionDrawerAnimationIdRef.current + 1;
    sessionDrawerAnimationIdRef.current = animationId;
    setChatMenuVisible(false);
    setAttachmentMenuVisible(false);
    if (sessionDrawerCloseFallbackRef.current) {
      clearTimeout(sessionDrawerCloseFallbackRef.current);
      sessionDrawerCloseFallbackRef.current = null;
    }
    sessionDrawerTranslateX.stopAnimation();
    if (!sessionsVisible) {
      sessionDrawerTranslateX.setValue(-sessionDrawerHiddenOffsetRef.current);
    }
    setSessionsVisible(true);
    Animated.timing(sessionDrawerTranslateX, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && sessionDrawerAnimationIdRef.current === animationId) {
        sessionDrawerTranslateX.setValue(0);
      }
    });
  }

  function closeSessionsDrawer(animate = true) {
    const animationId = sessionDrawerAnimationIdRef.current + 1;
    sessionDrawerAnimationIdRef.current = animationId;
    drawerGestureOpeningRef.current = false;
    if (drawerGestureFallbackRef.current) {
      clearTimeout(drawerGestureFallbackRef.current);
      drawerGestureFallbackRef.current = null;
    }
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
      sessionDrawerTranslateX.setValue(-sessionDrawerHiddenOffsetRef.current);
      setSessionsVisible(false);
      setSessionSelectionMode(false);
      setSelectedSessionIds([]);
    };
    if (!animate) {
      finishClose();
      return;
    }
    sessionDrawerCloseFallbackRef.current = setTimeout(finishClose, 260);
    Animated.timing(sessionDrawerTranslateX, {
      toValue: -sessionDrawerHiddenOffsetRef.current,
      duration: 160,
      useNativeDriver: true,
    }).start(finishClose);
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
      setApiProfilesVisible(false);
      setModelPickerVisible(false);
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
        key: 'plugins',
        title: copy.pluginsSection,
        subtitle: copy.pluginsDescription,
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
            style={styles.settingsNavItem}
            onPress={() => {
              if (item.key === 'api') {
                openApiProfiles();
                return;
              }
              setSettingsSection(item.key);
            }}
          >
            <View style={styles.settingsNavText}>
              <Text style={styles.settingsNavTitle}>{item.title}</Text>
              <Text style={styles.settingsNavSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
            <Text style={styles.settingsNavArrow}>›</Text>
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

  const composerDisabled = sending;
  const canSend = !!composerText.trim() || pendingAttachments.length > 0;
  const usingInsecureHttp = draftProfile.baseUrl.trim().toLowerCase().startsWith('http://');

  return (
    <LinearGradient colors={['#FFFFFF', '#F6F8FB', '#EEF3F8']} style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.flex}
        >
          <View style={styles.topBar}>
            <Pressable
              style={styles.iconAction}
              onPress={openSessionsDrawer}
              accessibilityRole="button"
              accessibilityLabel={copy.openSessions}
            >
              <Text style={styles.menuIconText}>☰</Text>
            </Pressable>
            <Pressable style={styles.sessionSwitcher} onPress={openModelPicker}>
              <View style={styles.modelPill}>
                <Text style={styles.title} numberOfLines={1}>{activeProfile.model}</Text>
                <Text style={styles.modelPillChevron}>v</Text>
              </View>
              <Text style={styles.sessionLine} numberOfLines={1}>
                {activeSessionTitle} · {activeProfile.label}
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
                onPress={() => setChatMenuVisible((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel="Conversation menu"
              >
                <Text style={styles.iconActionText}>⋯</Text>
              </Pressable>
            </View>
          </View>

          {chatMenuVisible && (
            <>
              <Pressable style={styles.chatMenuDismiss} onPress={() => setChatMenuVisible(false)} />
              <View style={styles.chatMenu}>
                <Pressable
                  style={[styles.chatMenuItem, !activeConversation && styles.disabledAction]}
                  onPress={() => {
                    void shareActiveConversation();
                  }}
                  disabled={!activeConversation}
                >
                  <Text style={styles.chatMenuText}>{uiLanguage === 'zh' ? '分享' : 'Share'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.chatMenuItem, !activeConversation && styles.disabledAction]}
                  onPress={confirmDeleteActiveConversation}
                  disabled={!activeConversation}
                >
                  <Text style={[styles.chatMenuText, styles.chatMenuDangerText]}>{copy.delete}</Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={styles.chatShell} {...chatOpenDrawerPanResponder.panHandlers}>
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
                      onRegenerate={(messageId) => {
                        void regenerateAssistantMessage(messageId);
                      }}
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
                <View style={styles.attachMenuWrap}>
                  <Pressable
                    style={[styles.smallAction, attachmentMenuVisible && styles.smallActionActive]}
                    onPress={() => setAttachmentMenuVisible((visible) => !visible)}
                    disabled={composerDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={copy.attachMenu}
                  >
                    <Text style={styles.smallActionText}>+</Text>
                  </Pressable>
                </View>
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
              {attachmentMenuVisible && !composerDisabled && (
                <View style={styles.attachOptionRow}>
                  <Pressable style={styles.attachOption} onPress={attachFromCamera}>
                    <Text style={styles.attachOptionIcon}>{uiLanguage === 'zh' ? '拍' : 'Cam'}</Text>
                    <Text style={styles.attachOptionText}>{copy.camera}</Text>
                  </Pressable>
                  <Pressable style={styles.attachOption} onPress={attachImages}>
                    <Text style={styles.attachOptionIcon}>{uiLanguage === 'zh' ? '图' : 'Img'}</Text>
                    <Text style={styles.attachOptionText}>{copy.image}</Text>
                  </Pressable>
                  <Pressable style={styles.attachOption} onPress={attachFiles}>
                    <Text style={styles.attachOptionIcon}>{uiLanguage === 'zh' ? '文' : 'Doc'}</Text>
                    <Text style={styles.attachOptionText}>{copy.file}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={settingsVisible} animationType="none" onRequestClose={() => closeSettingsPanel()}>
        <Animated.View
          style={[styles.settingsScreen, { transform: [{ translateX: settingsPanelTranslateX }] }]}
          onStartShouldSetResponderCapture={() => false}
          onMoveShouldSetResponderCapture={(event) => maybeNavigateSettingsFromTouch(event)}
          onTouchStart={handleSettingsTouchStart}
          onTouchMove={handleSettingsTouchMove}
          onTouchEnd={handleSettingsTouchEnd}
          onTouchCancel={handleSettingsTouchEnd}
        >
          <SafeAreaView style={styles.settingsScreenSafe}>
            <View style={styles.settingsHeader}>
              {settingsSection !== 'root' && (
                <Pressable style={styles.backButton} onPress={() => setSettingsSection('root')}>
                  <Text style={styles.backButtonText}>‹</Text>
                </Pressable>
              )}
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>
                  {settingsSection === 'root'
                    ? copy.settingsTitle
                    : settingsSection === 'language'
                      ? copy.language
                      : settingsSection === 'storage'
                        ? copy.storageSection
                        : settingsSection === 'plugins'
                          ? copy.pluginsSection
                          : copy.aboutSection}
                </Text>
                <Text style={styles.modalSubtitle}>{copy.settingsSubtitle}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.settingsScreenScroll}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {settingsSection === 'root' && renderSettingsRoot()}

              {settingsSection === 'language' && (
                <View style={styles.settingOptionGroup}>
                  <Pressable
                    style={[styles.settingOption, uiLanguage === 'zh' && styles.settingOptionSelected]}
                    onPress={() => applyUiLanguage('zh')}
                  >
                    <View style={[styles.settingOptionRadio, uiLanguage === 'zh' && styles.settingOptionRadioSelected]}>
                      {uiLanguage === 'zh' && <View style={styles.settingOptionRadioDot} />}
                    </View>
                    <Text style={styles.settingOptionText}>{copy.chinese}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.settingOption, uiLanguage === 'en' && styles.settingOptionSelected]}
                    onPress={() => applyUiLanguage('en')}
                  >
                    <View style={[styles.settingOptionRadio, uiLanguage === 'en' && styles.settingOptionRadioSelected]}>
                      {uiLanguage === 'en' && <View style={styles.settingOptionRadioDot} />}
                    </View>
                    <Text style={styles.settingOptionText}>{copy.english}</Text>
                  </Pressable>
                </View>
              )}

              {settingsSection === 'storage' && (
                <>
                  <View style={styles.infoPanel}>
                    <Text style={styles.infoPanelTitle}>{copy.localStorageTitle}</Text>
                    <Text style={styles.infoPanelText}>{copy.localStorageDescription}</Text>
                  </View>
                  <Pressable style={styles.dangerButton} onPress={confirmClearLocalData} disabled={savingProfile}>
                    <Text style={styles.dangerButtonText}>{copy.clearLocalData}</Text>
                  </Pressable>
                  <Text style={styles.inlineHint}>{copy.clearLocalHint}</Text>
                </>
              )}

              {settingsSection === 'plugins' && (
                <View style={styles.infoPanel}>
                  <Text style={styles.infoPanelTitle}>{copy.pluginsTitle}</Text>
                  <Text style={styles.infoPanelText}>{copy.pluginsDescription}</Text>
                  <View style={styles.pluginRow}>
                    {getContentPlugins().map((plugin) => (
                      <View key={plugin.id} style={styles.pluginBadge}>
                        <Text style={styles.pluginBadgeText}>{plugin.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {settingsSection === 'about' && (
                <View style={styles.infoPanel}>
                  <Text style={styles.infoPanelTitle}>{copy.createdBy}</Text>
                  <View style={styles.contactRow}>
                    <Pressable
                      style={styles.contactChip}
                      onPress={() => openExternalUrl('https://github.com/fanshanng')}
                    >
                      <Text style={styles.contactIcon}>GH</Text>
                      <Text style={styles.contactText}>{copy.github}</Text>
                    </Pressable>
                    <Pressable style={styles.contactChip} onPress={() => openExternalUrl('https://fanshanng.cn/')}>
                      <Text style={styles.contactIcon}>WWW</Text>
                      <Text style={styles.contactText}>{copy.blog}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.contactChip}
                      onPress={() => openExternalUrl('mailto:fanshanng@gmail.com')}
                    >
                      <Text style={styles.contactIcon}>@</Text>
                      <Text style={styles.contactText}>{copy.email}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </Modal>

      <Modal visible={modelPickerVisible} animationType="slide" transparent onRequestClose={() => setModelPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setModelPickerVisible(false)} />
          <View style={styles.modalCardCompact}>
            <View style={styles.sessionHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>{copy.modelPickerTitle}</Text>
                <Text style={styles.modalSubtitle}>{activeProfile.label} · {activeProfile.baseUrl}</Text>
              </View>
              <Pressable
                style={[styles.modalPrimarySmall, fetchingModels && styles.disabledAction]}
                onPress={() => {
                  void fetchModelsForProfile(activeProfile, apiKey);
                }}
                disabled={fetchingModels}
              >
                <Text style={styles.modalPrimaryText}>{fetchingModels ? copy.fetchingModels : copy.fetchModels}</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modelListContent}
            >
              {availableModels.length === 0 ? (
                <Text style={styles.emptySessionText}>{copy.modelsEmpty}</Text>
              ) : (
                availableModels.map((model) => (
                  <Pressable
                    key={model}
                    style={[styles.modelOption, activeProfile.model === model && styles.modelOptionSelected]}
                    onPress={() => applyModelToActiveProfile(model)}
                  >
                    <Text style={[styles.modelOptionText, activeProfile.model === model && styles.modelOptionTextSelected]}>
                      {model}
                    </Text>
                    {activeProfile.model === model && <Text style={styles.profileStateActive}>{copy.activeModel}</Text>}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={apiProfilesVisible} animationType="slide" transparent onRequestClose={() => setApiProfilesVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setApiProfilesVisible(false)} />
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

            <ScrollView
              style={styles.modalScroll}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileChipRow}>
                {persisted.profiles.map((profile) => {
                  const isActive = profile.id === persisted.activeProfileId;
                  const isEditing = profile.id === draftProfile.id;
                  return (
                    <Pressable
                      key={profile.id}
                      style={[styles.profileChip, isEditing && styles.profileChipSelected]}
                      onPress={() => {
                        void selectDraftApiProfile(profile);
                      }}
                    >
                      <Text style={[styles.profileChipTitle, isEditing && styles.profileChipTitleSelected]}>
                        {profile.label}
                      </Text>
                      <Text style={[styles.profileChipMeta, isEditing && styles.profileChipMetaSelected]} numberOfLines={1}>
                        {isActive ? copy.activeApiProfile : profile.model}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.formSectionHeader}>
                <Text style={styles.sectionLabel}>{copy.basicApiSettings}</Text>
                <Text style={styles.sectionValue} numberOfLines={1}>
                  {draftProfile.model}
                </Text>
              </View>
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
                      onPress={() => updateDraftProfileWithReasoningReset((current) => applyApiPreset(current, preset))}
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
                    onPress={() => updateDraftProfileWithReasoningReset((current) => ({ ...current, apiProtocol: protocol }))}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        draftProfile.apiProtocol === protocol && styles.selectedChipText,
                      ]}
                    >
                      {apiProtocolLabel(protocol, uiLanguage)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.inlineHint}>{getEndpointHint(draftProfile.apiProtocol, uiLanguage)}</Text>

              <Text style={styles.fieldLabel}>{copy.baseUrl}</Text>
              <TextInput
                value={draftProfile.baseUrl}
                onChangeText={(value) => setDraftProfile((current) => ({ ...current, baseUrl: value }))}
                style={styles.fieldInput}
                autoCapitalize="none"
                placeholder="https://api.openai.com/v1"
                placeholderTextColor="#9BA7B7"
              />
              <Text style={styles.inlineHint}>{copy.baseUrlHint}</Text>
              {usingInsecureHttp && <Text style={styles.warningText}>{copy.insecureHttpWarning}</Text>}

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
                onChangeText={(value) => updateDraftProfileWithReasoningReset((current) => ({ ...current, model: value }))}
                style={styles.fieldInput}
                autoCapitalize="none"
                placeholder="gpt-5.4"
                placeholderTextColor="#9BA7B7"
              />
              <Pressable
                style={[styles.inlineUtilityButton, fetchingModels && styles.disabledAction]}
                onPress={() => {
                  void fetchModelsForProfile(sanitizeProfile(draftProfile), apiKey);
                }}
                disabled={fetchingModels}
              >
                <Text style={styles.inlineUtilityButtonText}>
                  {fetchingModels ? copy.fetchingModels : copy.fetchModels}
                </Text>
              </Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                {uniqueStrings([...availableModels, ...MODEL_SUGGESTIONS]).map((model) => (
                  <Pressable
                    key={model}
                    style={[styles.suggestionChip, draftProfile.model === model && styles.selectedChip]}
                    onPress={() => updateDraftProfileWithReasoningReset((current) => ({ ...current, model }))}
                  >
                    <Text style={[styles.suggestionChipText, draftProfile.model === model && styles.selectedChipText]}>
                      {model}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.inlineHint}>{getModelHint(draftProfile.model, uiLanguage)}</Text>

              <View style={styles.compactSettingCard}>
                <View style={styles.compactSettingHeader}>
                  <View style={styles.compactSettingTitleWrap}>
                    <Text style={styles.compactSettingTitle}>{copy.reasoningEffort}</Text>
                    <Text style={styles.compactSettingSubtitle}>
                      {copy.currentValue}: {draftProfile.reasoningEffort}
                    </Text>
                  </View>
                  <Pressable style={styles.inlineUtilityButton} onPress={() => refreshReasoningEffortOptions(draftProfile)}>
                    <Text style={styles.inlineUtilityButtonText}>{copy.fetchReasoningEfforts}</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                  {reasoningEffortOptions.map((effort) => (
                    <Pressable
                      key={effort}
                      style={[styles.suggestionChip, draftProfile.reasoningEffort === effort && styles.selectedChip]}
                      onPress={() => applyReasoningEffort(effort)}
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
                  {reasoningEffortsFetched
                    ? inferReasoningEffortOptions(draftProfile).length > 1
                      ? copy.reasoningEffortsReady
                      : copy.reasoningEffortsUnavailable
                    : getReasoningEffortHint(draftProfile.model, draftProfile.reasoningEffort, uiLanguage)}
                </Text>
              </View>

              <Pressable
                style={styles.advancedToggle}
                onPress={() => setAdvancedApiSettingsOpen((current) => !current)}
              >
                <View style={styles.advancedToggleTextWrap}>
                  <Text style={styles.advancedToggleTitle}>{copy.advancedApiSettings}</Text>
                  <Text style={styles.advancedToggleSubtitle} numberOfLines={1}>
                    {getAdvancedApiSummary(draftProfile)}
                  </Text>
                  {/*
                    {draftProfile.storeResponses ? copy.storageEnabled : copy.storageDisabled}
                    {draftProfile.projectId ? ` · ${copy.projectId}` : ''}
                    {draftProfile.organization ? ` · ${copy.organization}` : ''}
                    {draftProfile.systemPrompt ? ` · ${copy.systemPrompt}` : ''}
                  */}
                </View>
                <Text style={styles.advancedToggleAction}>
                  {advancedApiSettingsOpen ? copy.hideAdvancedSettings : copy.showAdvancedSettings}
                </Text>
              </Pressable>

              {advancedApiSettingsOpen && (
                <View style={styles.advancedPanel}>
                  {draftProfile.apiProtocol === 'responses' && (
                    <>
                      <View style={styles.switchRow}>
                        <View style={styles.switchTextWrap}>
                          <Text style={styles.switchTitle}>{copy.responseStorage}</Text>
                          <Text style={styles.switchSubtitle}>
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
                      <Text style={styles.inlineHint}>
                        {getProtocolStorageHint(draftProfile.apiProtocol, draftProfile.storeResponses, uiLanguage)}
                      </Text>
                    </>
                  )}

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
                </View>
              )}

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

      <Modal visible={sessionsVisible} animationType="none" onRequestClose={() => closeSessionsDrawer()}>
        <Animated.View
          style={[styles.drawerBackdrop, { transform: [{ translateX: sessionDrawerTranslateX }] }]}
          {...sessionDrawerPanResponder.panHandlers}
        >
          <SafeAreaView style={styles.sessionDrawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderTitleBlock}>
                <Text style={styles.drawerTitle}>{copy.sessionsTitle}</Text>
                <Text style={styles.drawerHeaderHint}>{copy.latestSessionsFirst}</Text>
              </View>
              <Pressable
                style={[
                  styles.drawerHeaderButton,
                  sessionSelectionMode && styles.drawerHeaderButtonActive,
                  persisted.conversations.length === 0 && styles.disabledAction,
                ]}
                onPress={toggleSessionSelectionMode}
                disabled={persisted.conversations.length === 0}
              >
                <Text
                  style={[
                    styles.drawerHeaderButtonText,
                    sessionSelectionMode && styles.drawerHeaderButtonTextActive,
                  ]}
                >
                  {sessionSelectionMode ? copy.cancelSelection : copy.selectSessions}
                </Text>
              </Pressable>
            </View>

            <TextInput
              value={sessionSearchQuery}
              onChangeText={setSessionSearchQuery}
              style={styles.drawerSearchInput}
              placeholder={copy.sessionSearchPlaceholder}
              placeholderTextColor="#9BA7B7"
            />

            <View style={styles.drawerNav}>
              <Pressable
                style={styles.drawerNavItem}
                onPress={openSettingsFromSessions}
                accessibilityRole="button"
                accessibilityLabel={copy.settings}
              >
                <Text style={styles.drawerNavIcon}>...</Text>
                <Text style={styles.drawerNavText}>{copy.settings}</Text>
              </Pressable>
            </View>

            <View style={styles.drawerSectionHeader}>
              <Text style={styles.drawerSectionLabel}>{copy.recordsSection}</Text>
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
            </View>
            {sessionSelectionMode && (
              <Text style={styles.drawerSelectionText}>{copy.selectedSessionsCount(selectedSessionIds.length)}</Text>
            )}

            <ScrollView
              style={styles.drawerHistoryScroll}
              contentContainerStyle={styles.drawerHistoryContent}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {persisted.conversations.length === 0 ? (
                <Text style={styles.emptySessionText}>{copy.sessionsEmpty}</Text>
              ) : visibleConversations.length === 0 ? (
                <Text style={styles.emptySessionText}>{copy.sessionsNoMatches}</Text>
              ) : (
                visibleConversations.map((conversation) => {
                  const active = conversation.id === activeConversation?.id;
                  const selected = selectedSessionIds.includes(conversation.id);
                  return (
                    <Pressable
                      key={conversation.id}
                      style={[
                        styles.drawerSessionItem,
                        active && styles.drawerSessionItemActive,
                        selected && styles.drawerSessionItemSelected,
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
                          <View style={[styles.sessionSelectMark, selected && styles.sessionSelectMarkActive]}>
                            {selected && <Text style={styles.sessionSelectMarkText}>✓</Text>}
                          </View>
                        )}
                        <View style={styles.sessionMeta}>
                          <View style={styles.drawerSessionTitleRow}>
                            {conversation.pinned && <Text style={styles.drawerSessionPin}>📌</Text>}
                            <Text style={styles.drawerSessionTitle} numberOfLines={1}>
                              {conversation.title}
                            </Text>
                          </View>
                          <Text style={styles.drawerSessionSubtitle} numberOfLines={1}>
                            {formatConversationListMeta(conversation, uiLanguage)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <Pressable style={styles.drawerNewChatButton} onPress={createNewSession}>
              <Text style={styles.drawerNewChatIcon}>+</Text>
              <Text style={styles.drawerNewChatText}>{copy.newSession}</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
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
              <Text style={styles.contextMenuIcon}>📌</Text>
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
              <Text style={styles.contextMenuIcon}>✏️</Text>
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
              <Text style={styles.contextMenuIcon}>🗑</Text>
              <Text style={[styles.contextMenuText, styles.contextMenuDangerText]}>{copy.delete}</Text>
            </Pressable>
          </View>
        </Pressable>
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
    paddingTop: Platform.OS === 'android' ? 12 : 14,
    paddingBottom: 4,
    gap: 8,
  },
  sessionSwitcher: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  modelPill: {
    maxWidth: '100%',
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingLeft: 12,
    paddingRight: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
    flexShrink: 1,
  },
  modelPillChevron: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  sessionLine: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    paddingLeft: 2,
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
  composerCard: {
    marginHorizontal: 12,
    marginTop: 0,
    marginBottom: Platform.OS === 'android' ? 2 : 8,
    padding: 4,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  composerRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    color: '#111827',
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'android' ? 7 : 9,
    paddingBottom: Platform.OS === 'android' ? 7 : 8,
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
  smallActionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  smallActionText: {
    color: '#334155',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  attachMenuWrap: {
    position: 'relative',
  },
  attachOptionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 3,
    paddingTop: 8,
    paddingBottom: 4,
  },
  attachOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  attachOptionIcon: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '900',
  },
  attachOptionText: {
    color: '#111827',
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
  drawerBackdrop: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sessionDrawer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 20 : 8,
  },
  drawerDismissArea: {
    flex: 1,
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
  contextMenuIcon: {
    width: 28,
    color: '#E5E7EB',
    fontSize: 18,
    textAlign: 'center',
  },
  contextMenuText: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '800',
  },
  contextMenuDangerText: {
    color: '#FCA5A5',
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
  modalCardCompact: {
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
    paddingTop: Platform.OS === 'android' ? 20 : 8,
  },
  settingsScreenScroll: {
    flex: 1,
    marginTop: 18,
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
  backButtonText: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
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
  settingsNavArrow: {
    color: '#94A3B8',
    fontSize: 24,
    fontWeight: '800',
  },
  drawerHeader: {
    minHeight: 64,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  drawerHeaderTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  drawerTitle: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '900',
  },
  drawerHeaderHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
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
  },
  drawerHeaderButtonTextActive: {
    color: '#2563EB',
  },
  drawerSearchInput: {
    minHeight: 48,
    marginHorizontal: 22,
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
  },
  drawerNav: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  drawerNavItem: {
    minHeight: 54,
    borderRadius: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  drawerNavIcon: {
    width: 34,
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  },
  drawerNavText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  drawerSectionHeader: {
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  drawerSectionLabel: {
    flex: 1,
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
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 108,
  },
  drawerSessionItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 76,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  drawerSessionItemActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  drawerSessionItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  drawerSessionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  drawerSessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
  },
  drawerSessionPin: {
    color: '#2563EB',
    fontSize: 13,
    lineHeight: 16,
  },
  drawerSessionTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  drawerSessionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
  },
  drawerSessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 9,
    marginLeft: 4,
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
  sessionSelectMarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  drawerNewChatButton: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'android' ? 26 : 34,
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
  drawerNewChatIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
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
  },
  modelOptionTextSelected: {
    color: '#1D4ED8',
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
  pluginRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pluginBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pluginBadgeText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
  },
  contactRow: {
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
  },
  contactIcon: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '900',
  },
  contactText: {
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
  },
  profileChipTitleSelected: {
    color: '#1D4ED8',
  },
  profileChipMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  profileChipMetaSelected: {
    color: '#2563EB',
  },
  formSectionHeader: {
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
