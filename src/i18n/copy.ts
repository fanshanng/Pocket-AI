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
  exportAllChats: string;
  exportAllChatsTitle: string;
  exportAllChatsSuccess: (fileName: string) => string;
  exportAllChatsAndContinue: string;
  openChatRecordsLocation: string;
  openAttachmentCacheLocation: string;
  openLocationWithExternalApp: string;
  storagePathCopiedTitle: string;
  storagePathCopiedMessage: (uri: string) => string;
  attachmentCacheTitle: string;
  attachmentCacheDescription: string;
  attachmentCacheStats: (
    fileCount: number,
    sizeLabel: string,
    referencedFileCount: number,
    referencedSizeLabel: string
  ) => string;
  refreshAttachmentCacheStats: string;
  refreshingAttachmentCacheStats: string;
  attachmentCacheStatsFailed: string;
  clearAttachmentCache: string;
  clearAttachmentCacheHint: string;
  clearAttachmentCacheTitle: string;
  clearAttachmentCacheMessage: string;
  clearAttachmentCacheSuccess: string;
  unreadableSessionsRecoveryTitle: string;
  unreadableSessionsRecoveryDescription: (count: number) => string;
  unreadableSessionsRecoveryHint: string;
  unreadableSessionLabel: (index: number, conversationId: string) => string;
  exportUnreadableSession: string;
  deleteUnreadableSession: string;
  unreadableSessionExportTitle: string;
  unreadableSessionExportSuccess: (fileName: string) => string;
  unreadableSessionExportFallbackSuccess: (folderName: string) => string;
  unreadableSessionExportUnavailable: string;
  unreadableSessionDeleteTitle: string;
  unreadableSessionDeleteMessage: (conversationId: string) => string;
  unreadableSessionDeleteSuccess: string;
  aboutSection: string;
  createdBy: string;
  maintainerLabel: string;
  earlyContributorLabel: string;
  drawerLabTitle: string;
  drawerLabDescription: string;
  openDrawerLab: string;
  interactionSection: string;
  interactionPreviewHint: string;
  drawerGestureTitle: string;
  drawerGestureDescription: string;
  drawerGestureModeLabel: string;
  drawerGestureModeFullscreen: string;
  drawerGestureModeEdge: string;
  drawerGesturePreviewTitle: string;
  drawerGesturePreviewFullscreenHint: string;
  drawerGesturePreviewEdgeHint: (widthPx: number) => string;
  drawerEdgeWidthLabel: string;
  drawerEdgeWidthHint: string;
  themeSection: string;
  themeModeLabel: string;
  themePresetLabel: string;
  themePresetClassic: string;
  themePresetGraphite: string;
  themePresetSunset: string;
  themePresetForest: string;
  themePresetRose: string;
  chatBackgroundLabel: string;
  chatBackgroundPlain: string;
  chatBackgroundGrid: string;
  chatBackgroundBands: string;
  chatBackgroundImageLabel: string;
  chatBackgroundImagePick: string;
  chatBackgroundImageRecrop: string;
  chatBackgroundImageClear: string;
  chatBackgroundImageActive: string;
  chatBackgroundImageInactive: string;
  chatBackgroundImageCropHint: string;
  chatBackgroundImageOpacityLabel: string;
  chatBackgroundImageOpacityHint: string;
  chatBackgroundImageOpacityPlaceholder: string;
  chatBubbleOpacityLabel: string;
  chatBubbleOpacityHint: string;
  chatBubbleOpacityPlaceholder: string;
  chatBubblePreviewLabel: string;
  appearanceChooseTitle: string;
  appearanceCollapsedHint: (value: string) => string;
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
  connectionSettings: string;
  modelAndReasoning: string;
  advancedApiSettings: string;
  showAdvancedSettings: string;
  hideAdvancedSettings: string;
  currentValue: string;
  profileLabel: string;
  apiPreset: string;
  endpointMode: string;
  baseUrl: string;
  baseUrlHint: string;
  baseUrlRequiredTitle: string;
  baseUrlRequiredMessage: string;
  advancedConfigHint: string;
  insecureHttpWarning: string;
  apiKey: string;
  model: string;
  reasoningEffort: string;
  fetchReasoningEfforts: string;
  reasoningEffortsReady: string;
  reasoningEffortsUnavailable: string;
  responseStorage: string;
  webSearch: string;
  webSearchEnabled: string;
  webSearchDisabled: string;
  webSearchHint: string;
  liveSearchSuggestedTitle: string;
  liveSearchSuggestedMessage: string;
  liveSearchReadyHint: string;
  liveSearchDisabledHint: string;
  liveSearchUnsupportedHint: string;
  storageEnabled: string;
  storageDisabled: string;
  advancedDefaultsSummary: string;
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
  exportSessionMarkdown: string;
  exportSessionJson: string;
  exportedSessionMarkdown: (fileName: string) => string;
  exportedSessionJson: (fileName: string) => string;
  selectSessions: string;
  cancelSelection: string;
  exportSelectedSessions: string;
  exportSelectedSessionsTitle: string;
  exportSelectedSessionsMessage: (count: number) => string;
  deleteSelectedSessions: string;
  selectedSessionsCount: (count: number) => string;
  selectedSessionsDeleteMessage: (count: number) => string;
  expandComposer: string;
  done: string;
  delete: string;
  deleteSessionTitle: string;
  clearDataTitle: string;
  clearDataMessage: string;
  clearDataExportedTitle: string;
  clearDataExportedMessage: (fileName: string) => string;
  cancel: string;
  clear: string;
  conversationLengthWarningTitle: string;
  conversationLengthWarningMessage: (
    messageCount: number,
    limitCount: number,
    currentSize: string,
    limitSize: string
  ) => string;
  conversationLengthBlockedTitle: string;
  conversationLengthBlockedMessage: (
    messageCount: number,
    limitCount: number,
    currentSize: string,
    limitSize: string
  ) => string;
  conversationLengthNewSession: string;
  conversationLengthContinueCurrent: string;
  conversationLengthStatusSafe: string;
  conversationLengthStatusWarning: string;
  conversationLengthStatusBlocked: string;
  conversationLengthComposerBlockedPlaceholder: string;
  composerPlaceholder: string;
  attachMenu: string;
  camera: string;
  image: string;
  file: string;
  send: string;
  jumpToLatest: string;
  emptyStateBody: string;
  noActiveSessionTitle: string;
  noActiveSessionBody: string;
  imagePickerFailed: string;
  imagePickerFailedFallback: string;
  filePickerFailed: string;
  filePickerFailedFallback: string;
  attachmentTooLargeTitle: string;
  attachmentTooLargeMessage: (fileName: string, sizeLabel: string, limitLabel: string) => string;
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
  loadingOfflineBadge: string;
  loadingLocalOnly: string;
  loadingOfflineHint: string;
  loadingTakingLong: string;
  loadingRecoveryTitle: string;
  loadingRecoveryMessage: string;
  loadingRecoveryAction: string;
  loadingRecoverySuccess: string;
  loadingRecoverySuccessWithBackup: (folderName: string) => string;
  unreadableSessionsRecoveredTitle: string;
  unreadableSessionsRecoveredMessage: (count: number) => string;
  attachmentOpenFailedTitle: string;
  attachmentOpenFailedMessage: string;
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
    apiProfilesSubtitle: '可以保存多个 API 配置。编辑内容会自动保存，当前选中的配置会立即用于聊天。',
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
      '聊天索引会加密后保存在本机应用私有存储（AsyncStorage: ai-chat-pocket.conversation-index.v1），每个会话会再单独加密保存为自己的本地记录；旧版本的一体化状态会在读取时自动迁移。API 配置仍单独保存在本机应用私有存储（AsyncStorage: ai-chat-pocket.profile-state.v1）。加密密钥和 API key 保存在系统 SecureStore/Keystore；导入的附件会复制到应用私有文件目录。',
    exportAllChats: '导出全部聊天记录',
    exportAllChatsTitle: '导出完成',
    exportAllChatsSuccess: (fileName) => `已导出全部聊天记录：${fileName}`,
    exportAllChatsAndContinue: '先导出全部聊天再继续',
    openChatRecordsLocation: '聊天记录位置',
    openAttachmentCacheLocation: '缓存位置',
    openLocationWithExternalApp: '尝试用其他应用打开私有目录；如果系统不支持，会回退为复制路径。',
    storagePathCopiedTitle: '已复制路径',
    storagePathCopiedMessage: (uri) => `当前目录无法直接交给外部应用打开，已复制路径：\n${uri}`,
    attachmentCacheTitle: '附件缓存',
    attachmentCacheDescription: '统计应用私有目录里的缓存文件，并同时显示当前聊天记录引用到的附件。删除缓存不会删除聊天文本，但会让这些本机附件副本失效。',
    attachmentCacheStats: (fileCount, sizeLabel, referencedFileCount, referencedSizeLabel) =>
      `缓存文件：${fileCount} 个 · ${sizeLabel}\n会话引用：${referencedFileCount} 个 · ${referencedSizeLabel}`,
    refreshAttachmentCacheStats: '刷新缓存统计',
    refreshingAttachmentCacheStats: '刷新中...',
    attachmentCacheStatsFailed: '无法读取附件缓存统计。',
    clearAttachmentCache: '删除附件缓存',
    clearAttachmentCacheHint: '会话里引用到的本地附件缓存也会一起删除；聊天文本和 API 配置不会受影响。',
    clearAttachmentCacheTitle: '删除附件缓存？',
    clearAttachmentCacheMessage: '这会删除当前设备上的附件缓存文件，包括会话里仍然引用到的本地附件副本。聊天文本、API 配置和已保存的 API key 不会删除。',
    clearAttachmentCacheSuccess: '附件缓存已删除。',
    unreadableSessionsRecoveryTitle: '异常会话恢复',
    unreadableSessionsRecoveryDescription: (count) => `检测到 ${count} 个本地异常会话，它们已经在启动时被自动跳过，不会继续卡住正常进入应用。`,
    unreadableSessionsRecoveryHint:
      '先尝试导出这条异常会话的原始记录；如果系统仍然因为 AsyncStorage 行过大而拒绝读取，会自动回退为导出整份原始聊天数据库备份。确认备份完成后，再单独删除这条异常会话。',
    unreadableSessionLabel: (index, conversationId) => `异常会话 ${index + 1} · ${conversationId}`,
    exportUnreadableSession: '导出异常记录',
    deleteUnreadableSession: '删除该异常会话',
    unreadableSessionExportTitle: '异常会话已导出',
    unreadableSessionExportSuccess: (fileName) => `已导出异常会话原始记录：${fileName}`,
    unreadableSessionExportFallbackSuccess: (folderName) =>
      `单条记录无法直接读取，已回退导出原始聊天数据库备份：${folderName}`,
    unreadableSessionExportUnavailable: '暂时无法读取这条异常会话，也没有找到可导出的原始数据库备份。',
    unreadableSessionDeleteTitle: '删除这条异常会话？',
    unreadableSessionDeleteMessage: (conversationId) =>
      `这会只删除异常会话 ${conversationId} 对应的本地记录，不会删除其他聊天、API 配置、API key 或附件缓存。\n\n建议先完成导出再删除。`,
    unreadableSessionDeleteSuccess: '异常会话已删除。',
    aboutSection: '关于',
    createdBy: '维护与协助',
    maintainerLabel: '当前维护与 v1.1.0 之后版本',
    earlyContributorLabel: '早期协助：v1.0.0 - v1.1.0',
    drawerLabTitle: '抽屉手势实验',
    drawerLabDescription: '隔离测试现成 DrawerLayout 的快滑、慢滑、上下滚动和横向滚动手感；不会替换当前聊天抽屉。',
    openDrawerLab: '打开 Drawer Lab',
    interactionSection: '交互与手势',
    interactionPreviewHint: '这一页会保存交互偏好与实验入口；正式聊天页面现在会直接读取这里的抽屉触发设置。',
    drawerGestureTitle: '聊天抽屉打开方式',
    drawerGestureDescription: '控制正式聊天界面左侧菜单的打开触发范围，并在当前稳定抽屉逻辑上直接生效。',
    drawerGestureModeLabel: '触发范围',
    drawerGestureModeFullscreen: '全屏联动',
    drawerGestureModeEdge: '边缘触发',
    drawerGesturePreviewTitle: '识别区域预览',
    drawerGesturePreviewFullscreenHint: '当前设置为全屏联动，整块聊天内容区域都可以作为右滑打开左侧菜单的起点。',
    drawerGesturePreviewEdgeHint: (widthPx) => `当前设置为边缘触发，只有左侧约 ${widthPx}px 的区域会响应右滑打开抽屉。`,
    drawerEdgeWidthLabel: '边缘触发宽度',
    drawerEdgeWidthHint: '仅在边缘触发模式下生效，超出范围会自动校正到',
    themeSection: '外观',
    themeModeLabel: '显示模式',
    themePresetLabel: '主题风格',
    themePresetClassic: '经典蓝',
    themePresetGraphite: '石墨青',
    themePresetSunset: '日落橙',
    themePresetForest: '松林绿',
    themePresetRose: '玫瑰砂',
    chatBackgroundLabel: '聊天背景',
    chatBackgroundPlain: '纯净底色',
    chatBackgroundGrid: '细网格',
    chatBackgroundBands: '柔和横带',
    chatBackgroundImageLabel: '背景图片',
    chatBackgroundImagePick: '选择背景图',
    chatBackgroundImageRecrop: '重新裁剪',
    chatBackgroundImageClear: '清除背景图',
    chatBackgroundImageActive: '已设置',
    chatBackgroundImageInactive: '未设置',
    chatBackgroundImageCropHint: '选择或重新裁剪时会使用 9:16 取景，适合作为聊天页全屏背景。',
    chatBackgroundImageOpacityLabel: '背景图不透明度',
    chatBackgroundImageOpacityHint: '直接输入 0-100，离开输入框后自动生效。100 表示背景图最明显，0 表示隐藏背景图。',
    chatBackgroundImageOpacityPlaceholder: '例如 28',
    chatBubbleOpacityLabel: '聊天气泡透明度',
    chatBubbleOpacityHint: '支持 0-100。0 时只保留文字，100 时气泡完全显示，默认 84。离开输入框后自动生效。',
    chatBubbleOpacityPlaceholder: '例如 0',
    chatBubblePreviewLabel: '气泡预览',
    appearanceChooseTitle: '点开选择',
    appearanceCollapsedHint: (value) => `当前：${value}`,
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
    connectionSettings: '连接与鉴权',
    modelAndReasoning: '模型与推理',
    advancedApiSettings: '高级配置',
    showAdvancedSettings: '展开高级配置',
    hideAdvancedSettings: '收起高级配置',
    currentValue: '当前',
    profileLabel: '配置名称',
    apiPreset: '服务商预设',
    endpointMode: '接口类型',
    baseUrl: 'Base URL',
    baseUrlHint: '这里只填 API 根地址，接口类型会决定自动拼接 `/responses` 或 `/chat/completions`。',
    baseUrlRequiredTitle: '需要 Base URL',
    baseUrlRequiredMessage: '请先填写 API 根地址，例如 `https://api.openai.com/v1` 或 `https://api.deepseek.com`。',
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
    webSearch: '网络搜索',
    webSearchEnabled: '默认开启',
    webSearchDisabled: '已关闭',
    webSearchHint: '仅对 OpenAI Responses API 生效。开启后，模型可在回答时使用联网网页搜索。',
    liveSearchSuggestedTitle: '当前配置不支持联网搜索',
    liveSearchSuggestedMessage:
      '你这条问题看起来依赖当前日期或最新信息。现在仍会继续发送，但如果想让回答更适合“今天 / 最近 / 最新”这类问题，建议切换到支持网络搜索的 OpenAI Responses 配置。',
    liveSearchReadyHint: '这条问题看起来依赖当前信息，本次会优先尝试联网搜索。',
    liveSearchDisabledHint: '当前配置支持联网搜索，但你已在设置里关闭它；这次回答可能不会优先查最新信息。',
    liveSearchUnsupportedHint: '当前配置不支持联网搜索；这次回答可能不是最新信息。',
    storageEnabled: '开启',
    storageDisabled: '关闭',
    advancedDefaultsSummary: '默认关闭或留空',
    projectId: 'Project ID',
    organization: 'Organization',
    systemPrompt: '系统提示词',
    clearLocalData: '清空聊天记录',
    clearLocalHint: '只删除本机保存的聊天记录，不删除 API 配置、已保存的 API key 和附件缓存。',
    close: '关闭',
    save: '保存',
    saving: '保存中...',
    sessionsEmpty: '还没有保存的会话。',
    sessionSearchPlaceholder: '搜索会话或消息...',
    sessionsNoMatches: '没有匹配的会话。',
    renameSession: '重命名',
    renameSessionTitle: '重命名会话',
    renameSessionPlaceholder: '输入新的会话名称',
    exportSession: '导出会话',
    exportSessionMarkdown: '导出 Markdown 文件',
    exportSessionJson: '导出 JSON 文件',
    exportedSessionMarkdown: (fileName) => `已导出 Markdown 文件：${fileName}`,
    exportedSessionJson: (fileName) => `已导出 JSON 文件：${fileName}`,
    selectSessions: '选择',
    cancelSelection: '取消选择',
    exportSelectedSessions: '导出所选',
    exportSelectedSessionsTitle: '导出所选会话',
    exportSelectedSessionsMessage: (count) => `选择 ${count} 个会话要保存的导出格式。`,
    deleteSelectedSessions: '删除所选',
    selectedSessionsCount: (count) => `已选 ${count} 个`,
    selectedSessionsDeleteMessage: (count) => `确定删除选中的 ${count} 个会话？`,
    expandComposer: '大屏编辑',
    done: '完成',
    delete: '删除',
    deleteSessionTitle: '删除会话？',
    clearDataTitle: '清空本地聊天记录？',
    clearDataMessage: '这会直接删除当前设备上的全部本地聊天记录。API 配置、已保存的 API key 和附件缓存会保留。',
    clearDataExportedTitle: '已完成清空前导出',
    clearDataExportedMessage: (fileName) => `聊天记录已先导出到：${fileName}\n\n确认后才会继续清空当前设备上的本地聊天记录和附件缓存，API 配置会保留。`,
    cancel: '取消',
    clear: '清空',
    conversationLengthWarningTitle: '当前会话快过长了',
    conversationLengthWarningMessage: (messageCount, limitCount, currentSize, limitSize) =>
      `这个会话已经接近本地安全上限。\n\n当前约 ${messageCount}/${limitCount} 条消息，本地体积约 ${currentSize}/${limitSize}。\n\n建议现在新开一个会话继续，避免后面出现载入变慢、恢复弹窗，或本地数据库行过大。`,
    conversationLengthBlockedTitle: '当前会话已到上限',
    conversationLengthBlockedMessage: (messageCount, limitCount, currentSize, limitSize) =>
      `为了避免本地聊天数据再次撑爆，这个会话已停止继续发送。\n\n当前约 ${messageCount}/${limitCount} 条消息，本地体积约 ${currentSize}/${limitSize}。\n\n请新建会话继续聊天，当前输入内容会保留。`,
    conversationLengthNewSession: '新建会话继续',
    conversationLengthContinueCurrent: '继续当前会话',
    conversationLengthStatusSafe: '正常',
    conversationLengthStatusWarning: '偏长',
    conversationLengthStatusBlocked: '已封顶',
    conversationLengthComposerBlockedPlaceholder: '当前会话已到上限，请新建会话继续...',
    composerPlaceholder: '问点什么...',
    attachMenu: '添加附件',
    camera: '拍照',
    image: '图片',
    file: '文件',
    send: '发送',
    jumpToLatest: '最新',
    emptyStateBody: '支持文本、图片和文件输入。会话历史保存在本机，可随时管理 API 配置和本地会话。',
    noActiveSessionTitle: '新的聊天草稿',
    noActiveSessionBody: '直接输入第一条消息就会开始一个新会话；如果这次没发送，也不会留下空白聊天记录。',
    imagePickerFailed: '选择图片失败',
    imagePickerFailedFallback: '无法读取所选图片。',
    filePickerFailed: '选择文件失败',
    filePickerFailedFallback: '无法读取所选文件。',
    attachmentTooLargeTitle: '附件过大',
    attachmentTooLargeMessage: (fileName, sizeLabel, limitLabel) =>
      `“${fileName}”大小为 ${sizeLabel}，超过当前 ${limitLabel} 限制。请换一个更小的文件，或先压缩后再发送。`,
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
    loadingOfflineBadge: '离线启动',
    loadingLocalOnly: '只在本机读取聊天记录、配置与附件索引，不会上传到网络。',
    loadingOfflineHint: '如果本地聊天较多，首次整理会稍慢一点，请稍等片刻。',
    loadingTakingLong: '如果这个页面停留太久，可能是某个本地会话过大。',
    loadingRecoveryTitle: '启动恢复',
    loadingRecoveryMessage: '这个恢复操作只建议在已经卡在启动页、进不去应用时使用。它会先尽量导出原始本地聊天库，再移除当前本地聊天状态，并以空白状态重新进入应用。要继续吗？',
    loadingRecoveryAction: '移除本地聊天并继续',
    loadingRecoverySuccess: '已移除当前本地聊天状态，应用将重新进入空白状态。',
    loadingRecoverySuccessWithBackup: (folderName) =>
      `已先备份原始本地聊天库到 ${folderName}，随后移除当前本地聊天状态。应用将重新进入空白状态。`,
    unreadableSessionsRecoveredTitle: '已跳过异常会话',
    unreadableSessionsRecoveredMessage: (count) =>
      `启动时有 ${count} 个本地会话无法正常读取，应用已先跳过它们并继续载入其它聊天。建议尽快单独导出或删除这些异常会话。`,
    attachmentOpenFailedTitle: '打开附件失败',
    attachmentOpenFailedMessage: '这个本地附件暂时无法直接交给外部应用打开。',
  },
  en: {
    settings: 'Settings',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage language, sessions, and API configuration. Your key stays on this device.',
    apiSection: 'API Configuration',
    recordsSection: 'Chat History',
    storageSection: 'Chat Storage',
    apiProfilesTitle: 'API Profiles',
    apiProfilesSubtitle: 'Save multiple API profiles. Edits are saved automatically, and the selected profile becomes active for chat right away.',
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
      'A small encrypted chat index is stored in app private storage (AsyncStorage: ai-chat-pocket.conversation-index.v1), and each conversation is then encrypted into its own local record. Older bundled-chat state is migrated automatically when read. Saved API profiles are still stored separately in app private storage (AsyncStorage: ai-chat-pocket.profile-state.v1). The encryption key and API keys are stored in system SecureStore/Keystore; imported attachments are copied into the app private file directory.',
    exportAllChats: 'Export all chats',
    exportAllChatsTitle: 'Export complete',
    exportAllChatsSuccess: (fileName) => `All chats were exported as ${fileName}.`,
    exportAllChatsAndContinue: 'Export all chats first',
    openChatRecordsLocation: 'Chat records location',
    openAttachmentCacheLocation: 'Cache location',
    openLocationWithExternalApp: 'Try opening this private folder with another app. If Android refuses, the path will be copied instead.',
    storagePathCopiedTitle: 'Path copied',
    storagePathCopiedMessage: (uri) => `This private directory could not be handed off to another app. The path was copied instead:\n${uri}`,
    attachmentCacheTitle: 'Attachment cache',
    attachmentCacheDescription: 'Counts cache files in app-private storage and also shows attachments still referenced by chats. Clearing cache keeps chat text but invalidates those local attachment copies.',
    attachmentCacheStats: (fileCount, sizeLabel, referencedFileCount, referencedSizeLabel) =>
      `Cache files: ${fileCount} · ${sizeLabel}\nChat references: ${referencedFileCount} · ${referencedSizeLabel}`,
    refreshAttachmentCacheStats: 'Refresh cache stats',
    refreshingAttachmentCacheStats: 'Refreshing...',
    attachmentCacheStatsFailed: 'Unable to read attachment cache stats.',
    clearAttachmentCache: 'Clear attachment cache',
    clearAttachmentCacheHint: 'Referenced local attachment copies will also be removed. Chat text and API settings stay intact.',
    clearAttachmentCacheTitle: 'Clear attachment cache?',
    clearAttachmentCacheMessage: 'This removes local attachment cache files on this device, including files still referenced by chats. Chat text, API settings, and saved API keys stay intact.',
    clearAttachmentCacheSuccess: 'Attachment cache cleared.',
    unreadableSessionsRecoveryTitle: 'Unreadable session recovery',
    unreadableSessionsRecoveryDescription: (count) =>
      `${count} unreadable local sessions were detected and already skipped during startup so the app can keep opening normally.`,
    unreadableSessionsRecoveryHint:
      'Try exporting the raw record for a broken session first. If Android still refuses to read that oversized AsyncStorage row, the app will fall back to exporting a raw chat database backup before you delete only that session.',
    unreadableSessionLabel: (index, conversationId) => `Unreadable session ${index + 1} · ${conversationId}`,
    exportUnreadableSession: 'Export broken record',
    deleteUnreadableSession: 'Delete this broken session',
    unreadableSessionExportTitle: 'Unreadable session exported',
    unreadableSessionExportSuccess: (fileName) => `The raw unreadable session record was exported as ${fileName}.`,
    unreadableSessionExportFallbackSuccess: (folderName) =>
      `The single record could not be read directly, so a raw chat database backup was exported instead: ${folderName}.`,
    unreadableSessionExportUnavailable: 'The unreadable session could not be read and no raw database backup was available to export.',
    unreadableSessionDeleteTitle: 'Delete this unreadable session?',
    unreadableSessionDeleteMessage: (conversationId) =>
      `Only the local record for unreadable session ${conversationId} will be removed. Other chats, API settings, API keys, and attachment cache stay intact.\n\nExport a backup first if you still need recovery options.`,
    unreadableSessionDeleteSuccess: 'Unreadable session removed.',
    aboutSection: 'About',
    createdBy: 'Maintainer and contributors',
    maintainerLabel: 'Current maintainer and post-v1.1.0 releases',
    earlyContributorLabel: 'Early help: v1.0.0 - v1.1.0',
    drawerLabTitle: 'Drawer gesture lab',
    drawerLabDescription: 'Test the built-in DrawerLayout feel in isolation before replacing the real chat drawer.',
    openDrawerLab: 'Open Drawer Lab',
    interactionSection: 'Interaction and gestures',
    interactionPreviewHint: 'This page saves interaction preferences and keeps the lab nearby. The live chat drawer now reads these trigger settings directly.',
    drawerGestureTitle: 'Chat drawer opening',
    drawerGestureDescription: 'Control the production chat drawer trigger range directly while keeping the current stable drawer behaviour.',
    drawerGestureModeLabel: 'Trigger range',
    drawerGestureModeFullscreen: 'Fullscreen linked',
    drawerGestureModeEdge: 'Edge only',
    drawerGesturePreviewTitle: 'Trigger preview',
    drawerGesturePreviewFullscreenHint: 'Fullscreen linked mode lets the whole chat content area start the right-swipe drawer gesture.',
    drawerGesturePreviewEdgeHint: (widthPx) => `Edge mode only responds inside roughly the left ${widthPx}px swipe-start zone.`,
    drawerEdgeWidthLabel: 'Edge trigger width',
    drawerEdgeWidthHint: 'Only applies in edge mode. Values outside the range are clamped to',
    themeSection: 'Appearance',
    themeModeLabel: 'Display mode',
    themePresetLabel: 'Theme preset',
    themePresetClassic: 'Classic Blue',
    themePresetGraphite: 'Graphite Teal',
    themePresetSunset: 'Sunset Orange',
    themePresetForest: 'Forest Pine',
    themePresetRose: 'Rose Sand',
    chatBackgroundLabel: 'Chat background',
    chatBackgroundPlain: 'Plain',
    chatBackgroundGrid: 'Soft grid',
    chatBackgroundBands: 'Horizontal bands',
    chatBackgroundImageLabel: 'Background image',
    chatBackgroundImagePick: 'Choose image',
    chatBackgroundImageRecrop: 'Recrop image',
    chatBackgroundImageClear: 'Clear image',
    chatBackgroundImageActive: 'Set',
    chatBackgroundImageInactive: 'Not set',
    chatBackgroundImageCropHint: 'Choosing or recropping uses a 9:16 frame so the image fits the live chat background cleanly.',
    chatBackgroundImageOpacityLabel: 'Image visibility',
    chatBackgroundImageOpacityHint: 'Enter 0-100 and the change applies on blur. 100 makes the image most visible, while 0 hides it.',
    chatBackgroundImageOpacityPlaceholder: 'e.g. 28',
    chatBubbleOpacityLabel: 'Chat bubble opacity',
    chatBubbleOpacityHint: 'Supports 0-100. At 0 only the text remains, while 100 shows the full bubble. Applies on blur.',
    chatBubbleOpacityPlaceholder: 'e.g. 0',
    chatBubblePreviewLabel: 'Bubble preview',
    appearanceChooseTitle: 'Tap to choose',
    appearanceCollapsedHint: (value) => `Current: ${value}`,
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
    connectionSettings: 'Connection and auth',
    modelAndReasoning: 'Model and reasoning',
    advancedApiSettings: 'Advanced settings',
    showAdvancedSettings: 'Show advanced settings',
    hideAdvancedSettings: 'Hide advanced settings',
    currentValue: 'Current',
    profileLabel: 'Profile label',
    apiPreset: 'Provider preset',
    endpointMode: 'Endpoint mode',
    baseUrl: 'Base URL',
    baseUrlHint: 'Enter only the API root. The endpoint mode decides whether `/responses` or `/chat/completions` is appended.',
    baseUrlRequiredTitle: 'Base URL required',
    baseUrlRequiredMessage: 'Enter an API root first, such as `https://api.openai.com/v1` or `https://api.deepseek.com`.',
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
    webSearch: 'Web search',
    webSearchEnabled: 'Default on',
    webSearchDisabled: 'Off',
    webSearchHint: 'Only applies to OpenAI Responses API. When enabled, the model can use live web search while answering.',
    liveSearchSuggestedTitle: 'This profile has no live web search',
    liveSearchSuggestedMessage:
      'This prompt looks like it depends on today\'s date or recent information. It will still be sent, but for better answers to “today / recent / latest” questions, switch to an OpenAI Responses profile with web search enabled.',
    liveSearchReadyHint: 'This prompt looks time-sensitive, so this turn will prefer live web search.',
    liveSearchDisabledHint: 'This profile supports live web search, but it is currently turned off in Settings.',
    liveSearchUnsupportedHint: 'This profile does not support live web search, so the answer may not reflect the latest information.',
    storageEnabled: 'Enabled',
    storageDisabled: 'Disabled',
    advancedDefaultsSummary: 'Default off or empty',
    projectId: 'Project ID',
    organization: 'Organization',
    systemPrompt: 'System prompt',
    clearLocalData: 'Clear chat records',
    clearLocalHint: 'Deletes only local chat records. API settings, saved API keys, and attachment cache stay intact.',
    close: 'Close',
    save: 'Save',
    saving: 'Saving...',
    sessionsEmpty: 'No saved sessions yet.',
    sessionSearchPlaceholder: 'Search sessions or messages...',
    sessionsNoMatches: 'No matching sessions.',
    renameSession: 'Rename',
    renameSessionTitle: 'Rename session',
    renameSessionPlaceholder: 'Enter a new session name',
    exportSession: 'Export session',
    exportSessionMarkdown: 'Export Markdown file',
    exportSessionJson: 'Export JSON file',
    exportedSessionMarkdown: (fileName) => `Exported Markdown file: ${fileName}`,
    exportedSessionJson: (fileName) => `Exported JSON file: ${fileName}`,
    selectSessions: 'Select',
    cancelSelection: 'Cancel selection',
    exportSelectedSessions: 'Export selected',
    exportSelectedSessionsTitle: 'Export selected sessions',
    exportSelectedSessionsMessage: (count) => `Choose a file format to save ${count} sessions.`,
    deleteSelectedSessions: 'Delete selected',
    selectedSessionsCount: (count) => `${count} selected`,
    selectedSessionsDeleteMessage: (count) => `Delete ${count} selected sessions?`,
    expandComposer: 'Expand editor',
    done: 'Done',
    delete: 'Delete',
    deleteSessionTitle: 'Delete session?',
    clearDataTitle: 'Clear local chat records?',
    clearDataMessage:
      'This immediately deletes all local chat records on this device. API settings, saved API keys, and attachment cache stay intact.',
    clearDataExportedTitle: 'Pre-clear export complete',
    clearDataExportedMessage: (fileName) =>
      `Chats were exported first as ${fileName}.\n\nConfirm again to continue clearing this device's local chats and attachment cache while keeping saved API profiles and API keys.`,
    cancel: 'Cancel',
    clear: 'Clear',
    conversationLengthWarningTitle: 'This chat is getting too large',
    conversationLengthWarningMessage: (messageCount, limitCount, currentSize, limitSize) =>
      `This conversation is close to the local safety limit.\n\nIt is currently about ${messageCount}/${limitCount} messages and ${currentSize}/${limitSize} in local storage size.\n\nStarting a new conversation now is recommended so startup, recovery, and local storage stay stable.`,
    conversationLengthBlockedTitle: 'This chat reached the limit',
    conversationLengthBlockedMessage: (messageCount, limitCount, currentSize, limitSize) =>
      `Sending is now blocked for this conversation to avoid breaking local chat storage again.\n\nIt is currently about ${messageCount}/${limitCount} messages and ${currentSize}/${limitSize} in local storage size.\n\nPlease start a new conversation to continue. Your current draft will be kept.`,
    conversationLengthNewSession: 'Start new conversation',
    conversationLengthContinueCurrent: 'Continue here',
    conversationLengthStatusSafe: 'Safe',
    conversationLengthStatusWarning: 'Large',
    conversationLengthStatusBlocked: 'Locked',
    conversationLengthComposerBlockedPlaceholder: 'This conversation reached the limit. Start a new one to continue...',
    composerPlaceholder: 'Ask anything...',
    attachMenu: 'Add attachment',
    camera: 'Camera',
    image: 'Image',
    file: 'File',
    send: 'Send',
    jumpToLatest: 'Latest',
    emptyStateBody: 'Use text, images, or files. Chat history stays on-device, with local session and API profile management.',
    noActiveSessionTitle: 'New chat draft',
    noActiveSessionBody: 'Send the first message to start a new session. If you leave without sending, no empty chat record is created.',
    imagePickerFailed: 'Image picker failed',
    imagePickerFailedFallback: 'Unable to read the selected image.',
    filePickerFailed: 'File picker failed',
    filePickerFailedFallback: 'Unable to read the selected file.',
    attachmentTooLargeTitle: 'Attachment too large',
    attachmentTooLargeMessage: (fileName, sizeLabel, limitLabel) =>
      `"${fileName}" is ${sizeLabel}, which is above the current ${limitLabel} limit. Use a smaller file or compress it before sending.`,
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
    loadingOfflineBadge: 'Offline startup',
    loadingLocalOnly: 'Local chats, settings, and attachment indexes are being read only on this device.',
    loadingOfflineHint: 'If the local vault is large, the first startup pass can take a little longer.',
    loadingTakingLong: 'If this screen stays too long, one local conversation may be oversized.',
    loadingRecoveryTitle: 'Startup recovery',
    loadingRecoveryMessage: 'Use this recovery flow only when the app is already stuck on startup. It will first try to export a raw local chat backup, then remove the current local chat state and reopen with a blank state. Continue?',
    loadingRecoveryAction: 'Remove local chats and continue',
    loadingRecoverySuccess: 'The current local chat state was removed. The app will reopen with a blank state.',
    loadingRecoverySuccessWithBackup: (folderName) =>
      `A raw local chat backup was saved to ${folderName} before the current local chat state was removed. The app will reopen with a blank state.`,
    unreadableSessionsRecoveredTitle: 'Unreadable sessions were skipped',
    unreadableSessionsRecoveredMessage: (count) =>
      `${count} local sessions could not be read during startup, so the app skipped them and continued loading the rest. Export or delete those problematic sessions as soon as possible.`,
    attachmentOpenFailedTitle: 'Unable to open attachment',
    attachmentOpenFailedMessage: 'This local attachment could not be handed off to another app right now.',
  },
};
