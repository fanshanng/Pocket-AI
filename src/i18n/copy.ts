import type { UiLanguage } from '../types';

export type LanguageCopy = {
  settings: string;
  settingsTitle: string;
  settingsSubtitle: string;
  apiSection: string;
  recordsSection: string;
  storageSection: string;
  apiProfilesTitle: string;
  apiProfilesSubtitle: string;
  newApiProfile: string;
  activeApiProfile: string;
  deleteApiProfile: string;
  deleteApiProfileTitle: string;
  deleteApiProfileMessage: string;
  cannotDeleteOnlyApiProfile: string;
  testApiConnection: string;
  testingApiConnection: string;
  testConnectionSuccessTitle: string;
  testConnectionSuccessMessage: (latencyMs: number, endpoint: string, sampleText: string) => string;
  testConnectionFailedTitle: string;
  localStorageTitle: string;
  localStorageDescription: string;
  aboutSection: string;
  createdBy: string;
  themeSection: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  versionLabel: string;
  checkLatestVersion: string;
  checkingLatestVersion: string;
  latestVersionTitle: string;
  latestVersionCurrent: string;
  latestVersionAvailable: (version: string) => string;
  latestVersionFailedTitle: string;
  latestVersionFailedMessage: string;
  github: string;
  language: string;
  chinese: string;
  english: string;
  openSessions: string;
  newSession: string;
  activeModel: string;
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
  deleteSelectedSessions: string;
  selectedSessionsCount: (count: number) => string;
  selectedSessionsDeleteMessage: (count: number) => string;
  expandComposer: string;
  done: string;
  delete: string;
  deleteSessionTitle: string;
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
};

export const COPY: Record<UiLanguage, LanguageCopy> = {
  zh: {
    settings: '设置',
    settingsTitle: '设置',
    settingsSubtitle: '管理语言、会话和 API 配置。密钥只保存在本机。',
    apiSection: 'API 配置',
    recordsSection: '聊天记录',
    storageSection: '聊天记录存储',
    apiProfilesTitle: 'API 配置',
    apiProfilesSubtitle: '可以保存多个 API 配置，点完成会自动保存并作为当前聊天使用。',
    newApiProfile: '新增配置',
    activeApiProfile: '当前使用',
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
    localStorageTitle: '聊天记录保存位置',
    localStorageDescription:
      '聊天记录、会话列表和 API 配置会加密后保存在本机应用私有存储（AsyncStorage: ai-chat-pocket.state.v1）。加密密钥和 API key 保存在系统 SecureStore/Keystore；导入的附件会复制到应用私有文件目录。卸载应用或清空本地数据会删除这些内容。',
    aboutSection: '关于',
    createdBy: '共创维护',
    themeSection: '外观',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    versionLabel: '当前版本',
    checkLatestVersion: '检查最新版本',
    checkingLatestVersion: '检查中...',
    latestVersionTitle: '版本检查',
    latestVersionCurrent: '已是最新版本。',
    latestVersionAvailable: (version) => `发现新版本：${version}`,
    latestVersionFailedTitle: '检查失败',
    latestVersionFailedMessage: '无法从 GitHub 获取最新版本信息。',
    github: 'GitHub',
    language: '界面语言',
    chinese: '中文',
    english: 'English',
    openSessions: '管理会话',
    newSession: '新建会话',
    activeModel: '当前模型',
    modelPickerTitle: '选择模型',
    fetchModels: '重新获取模型',
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
    deleteSelectedSessions: '删除所选',
    selectedSessionsCount: (count) => `已选 ${count} 个`,
    selectedSessionsDeleteMessage: (count) => `确定删除选中的 ${count} 个会话？`,
    expandComposer: '大屏编辑',
    done: '完成',
    delete: '删除',
    deleteSessionTitle: '删除会话？',
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
  },
  en: {
    settings: 'Settings',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage language, sessions, and API configuration. Your key stays on this device.',
    apiSection: 'API Configuration',
    recordsSection: 'Chat History',
    storageSection: 'Chat Storage',
    apiProfilesTitle: 'API Profiles',
    apiProfilesSubtitle: 'Save multiple API profiles. Done saves and applies the edited profile automatically.',
    newApiProfile: 'New profile',
    activeApiProfile: 'Current',
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
    localStorageTitle: 'Where chats are stored',
    localStorageDescription:
      'Chats, sessions, and API profiles are encrypted into this app private storage (AsyncStorage: ai-chat-pocket.state.v1). The encryption key and API keys are stored in system SecureStore/Keystore; imported attachments are copied into the app private file directory. Uninstalling the app or clearing local data removes them.',
    aboutSection: 'About',
    createdBy: 'Co-maintainers',
    themeSection: 'Appearance',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    versionLabel: 'Current version',
    checkLatestVersion: 'Check latest version',
    checkingLatestVersion: 'Checking...',
    latestVersionTitle: 'Version check',
    latestVersionCurrent: 'You are on the latest version.',
    latestVersionAvailable: (version) => `New version available: ${version}`,
    latestVersionFailedTitle: 'Check failed',
    latestVersionFailedMessage: 'Unable to fetch the latest version from GitHub.',
    github: 'GitHub',
    language: 'Interface language',
    chinese: 'Chinese',
    english: 'English',
    openSessions: 'Manage sessions',
    newSession: 'New session',
    activeModel: 'Active model',
    modelPickerTitle: 'Choose model',
    fetchModels: 'Refetch models',
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
    deleteSelectedSessions: 'Delete selected',
    selectedSessionsCount: (count) => `${count} selected`,
    selectedSessionsDeleteMessage: (count) => `Delete ${count} selected sessions?`,
    expandComposer: 'Expand editor',
    done: 'Done',
    delete: 'Delete',
    deleteSessionTitle: 'Delete session?',
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
  },
};
