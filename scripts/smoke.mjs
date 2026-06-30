import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const packageJson = JSON.parse(read('package.json'));
const appJson = JSON.parse(read('app.json'));
const index = read('index.ts');
const releaseAudit = read('scripts/release-audit.mjs');
const app = read('App.tsx');
const markdownRenderer = read('src/components/MarkdownRenderer.tsx');
const messageBubble = read('src/components/MessageBubble.tsx');
const codeBlock = read('src/components/CodeBlock.tsx');
const drawerLab = read('src/components/DrawerGestureLab.tsx');
const imageAttachmentViewer = read('src/components/ImageAttachmentViewer.tsx');
const drawerLabImageGestureExperiment = read('src/components/DrawerLabImageGestureExperiment.tsx');
const pendingAttachmentBar = read('src/components/PendingAttachmentBar.tsx');
const modelPickerContent = read('src/components/ModelPickerContent.tsx');
const settingsApiSection = read('src/components/SettingsApiSection.tsx');
const settingsAppearanceSection = read('src/components/SettingsAppearanceSection.tsx');
const settingsRootSection = read('src/components/SettingsRootSection.tsx');
const settingsStorageSection = read('src/components/SettingsStorageSection.tsx');
const settingsLanguageSection = read('src/components/SettingsLanguageSection.tsx');
const types = read('src/types.ts');
const profileDrafts = read('src/lib/profileDrafts.ts');
const providerCapabilities = read('src/lib/providerCapabilities.ts');
const conversations = read('src/lib/conversations.ts');
const drawerGestures = read('src/lib/drawerGestures.ts');
const openai = read('src/lib/openai.ts');
const files = read('src/lib/files.ts');
const attachmentCache = read('src/lib/attachmentCache.ts');
const chatStorageActions = read('src/lib/chatStorageActions.ts');
const conversationExport = read('src/lib/conversationExport.ts');
const storage = read('src/lib/storage.ts');
const theme = read('src/theme.ts');
const markdownRegression = read('scripts/fixtures/markdown-regression.md');
const sharedImagesBridge = read('src/native/sharedImages.ts');
const keyboardInsetsBridge = read('src/native/keyboardInsets.ts');
const sharedImageModule = read('android/app/src/main/java/com/fanshanng/aichatpocket/SharedImageModule.kt');
const keyboardInsetsModule = read('android/app/src/main/java/com/fanshanng/aichatpocket/KeyboardInsetsModule.kt');
const manifest = read('android/app/src/main/AndroidManifest.xml');

check(packageJson.main === 'index.ts', 'package.json main should remain index.ts');
check(packageJson.scripts?.['release:audit'] === 'node scripts/release-audit.mjs', 'Release audit script should stay wired in package.json');
check(String(packageJson.dependencies.expo ?? '').startsWith('~56.'), 'Expo SDK should remain version 56');
check(packageJson.dependencies['@likashefqet/react-native-image-zoom'], 'Drawer Lab image zoom dependency missing');
check(appJson.expo?.android?.package === 'com.fanshanng.aichatpocket', 'Android package name changed');
check(index.includes("registerRootComponent(App)"), 'Root component registration missing');
for (const auditGuard of [
  'assertReleaseNoteShape',
  'assertForbiddenUploadFiles',
  'README should not contain a Download section',
  'README should not point to local-only release-notes/',
  'release-notes/RELEASE_NOTES_v',
  'Current release note still contains Pending markers',
  'release-notes/',
]) {
  check(releaseAudit.includes(auditGuard), `Release audit guard missing ${auditGuard}`);
}

for (const exportName of [
  'createAssistantTurn',
  'createConversationTitle',
  'fetchAvailableModels',
  'testApiConnection',
]) {
  check(openai.includes(`export async function ${exportName}`), `${exportName} export missing`);
}

for (const exportName of [
  'pickImageAttachments',
  'captureImageAttachment',
  'pickDocumentAttachments',
  'persistSharedImageAttachments',
  'getAttachmentCacheStats',
]) {
  check(files.includes(`export async function ${exportName}`), `${exportName} export missing`);
}

for (const exportName of [
  'collectAttachmentCacheReferences',
  'loadAttachmentCacheStats',
]) {
  check(attachmentCache.includes(`export function ${exportName}`) || attachmentCache.includes(`export async function ${exportName}`), `${exportName} export missing`);
}

for (const exportName of [
  'getConversationExportContent',
  'getConversationExportBaseName',
  'exportConversationsToUserDirectory',
]) {
  check(conversationExport.includes(`export function ${exportName}`) || conversationExport.includes(`export async function ${exportName}`), `${exportName} export missing`);
}

for (const exportName of [
  'openStorageLocationWithClipboard',
  'exportUnreadableConversationBackup',
  'deleteUnreadableConversationRecord',
  'clearChatsAndRecoverProfileState',
]) {
  check(chatStorageActions.includes(`export function ${exportName}`) || chatStorageActions.includes(`export async function ${exportName}`), `${exportName} export missing`);
}

for (const exportName of [
  'loadPersistedState',
  'savePersistedState',
  'migrateLegacyApiKey',
  'loadProfileApiKey',
]) {
  check(storage.includes(`export async function ${exportName}`), `${exportName} export missing`);
}
check(storage.includes('themePreset: DEFAULT_THEME_PRESET'), 'Persisted state should keep a default theme preset');
check(storage.includes('themePreset: normalizeThemePreset(parsed.themePreset)'), 'Persisted state should normalize saved theme presets');
check(storage.includes("const CONVERSATION_INDEX_KEY = 'ai-chat-pocket.conversation-index.v1'"), 'Conversation index key missing');
check(storage.includes("const CONVERSATION_KEY_PREFIX = 'ai-chat-pocket.conversation.v1.'"), 'Per-conversation storage key prefix missing');
check(storage.includes('Older bundled-chat state is migrated automatically') || storage.includes('migrateLegacyStateIfNeeded'), 'Legacy bundled chat migration guard missing');
for (const themeGuard of [
  'DEFAULT_THEME_PRESET',
  "THEME_PRESET_OPTIONS: ThemePreset[] = ['classic', 'graphite', 'sunset', 'forest', 'rose']",
  'normalizeThemePreset',
  'getThemePresetSwatches',
  'resolveTheme(',
]) {
  check(theme.includes(themeGuard), `Theme preset guard missing ${themeGuard}`);
}

check(sharedImageModule.includes('private const val NAME = "SharedImage"'), 'SharedImage native module name changed');
check(sharedImageModule.includes('private const val EVENT_SHARED_IMAGES = "SharedImages"'), 'SharedImage event name changed');
check(keyboardInsetsModule.includes('private const val NAME = "KeyboardInsets"'), 'KeyboardInsets native module name changed');
check(keyboardInsetsModule.includes('private const val EVENT_KEYBOARD_INSETS = "KeyboardInsetsChanged"'), 'KeyboardInsets event name changed');
check(app.includes('subscribeSharedImages'), 'SharedImage app subscription usage missing');
check(app.includes('subscribeKeyboardInsets'), 'KeyboardInsets app subscription usage missing');
check(sharedImagesBridge.includes('NativeModules.SharedImage'), 'SharedImage JS bridge module usage missing');
check(sharedImagesBridge.includes("'SharedImages'"), 'SharedImage JS bridge event changed');
check(keyboardInsetsBridge.includes('NativeModules.KeyboardInsets'), 'KeyboardInsets JS bridge module usage missing');
check(keyboardInsetsBridge.includes("'KeyboardInsetsChanged'"), 'KeyboardInsets JS bridge event changed');
check(manifest.includes('android.intent.action.SEND'), 'Android share intent missing');
check(manifest.includes('android.intent.action.SEND_MULTIPLE'), 'Android multi-share intent missing');
check(manifest.includes('android.permission.CAMERA'), 'Android camera permission missing');

for (const marker of [
  '<!-- case:long-block-math -->',
  '<!-- case:latex-fenced-math -->',
  '<!-- case:wide-table -->',
  '<!-- case:table-inline-math-code -->',
  '<!-- case:plain-code -->',
  '<!-- case:unclosed-code-fence -->',
  '<!-- case:unclosed-math -->',
]) {
  check(markdownRegression.includes(marker), `Markdown regression fixture missing ${marker}`);
}

const wideTableHeader = markdownRegression
  .split('\n')
  .find((line) => line.startsWith('| ID | Name | Formula |'));
check(
  !!wideTableHeader && wideTableHeader.split('|').filter((cell) => cell.trim()).length >= 10,
  'Markdown regression wide table should keep at least 10 columns'
);
check(markdownRegression.includes('```latex'), 'Markdown regression fixture missing latex fenced math');
check(markdownRegression.includes('```ts'), 'Markdown regression fixture missing plain TypeScript code fence');
check(markdownRegression.includes('```python') && !markdownRegression.trimEnd().endsWith('```'), 'Markdown regression fixture should keep one intentionally unclosed fence');
check(markdownRegression.includes('$a_i+b_i=c_i$'), 'Markdown regression fixture missing table inline math');
check(markdownRegression.includes('`const value = list[i]`'), 'Markdown regression fixture missing table inline code');

for (const sourceGuard of [
  'function normalizeMarkdownForStreaming',
  'fenceMatches.length % 2 === 1',
  'function shouldRenderFenceAsMath',
  'function isMathFenceLanguage',
  "normalized === 'latex'",
  "normalized === 'tex'",
  "normalized === 'math'",
  'function looksLikeLatexMath',
  'markdownItWithMath',
  'math_inline',
  'math_block',
  'BlockMathView',
  'HorizontalScrollable',
  'EagerHorizontalScrollable',
  'getEstimatedTableWidth',
  'tableCellText',
]) {
  check(markdownRenderer.includes(sourceGuard), `Markdown renderer guard missing ${sourceGuard}`);
}

check(
  /code_block:[\s\S]*shouldRenderFenceAsMath[\s\S]*BlockMathView[\s\S]*CodeBlock/.test(markdownRenderer),
  'Markdown code_block rule should preserve math-fence and code-block paths'
);
check(
  /fence:[\s\S]*shouldRenderFenceAsMath[\s\S]*BlockMathView[\s\S]*CodeBlock/.test(markdownRenderer),
  'Markdown fence rule should preserve math-fence and code-block paths'
);
check(
  /table:[\s\S]*HorizontalScrollable[\s\S]*contentWidth=\{tableWidth\}/.test(markdownRenderer),
  'Markdown table rule should preserve horizontal scroll with estimated width'
);
check(
  /function BlockMathView[\s\S]*<EagerHorizontalScrollable[\s\S]*contentWidth=\{resolvedWidth\}/.test(markdownRenderer),
  'Markdown formula blocks should preserve the known-good eager horizontal scroll behavior'
);
check(
  markdownRenderer.includes('shouldActivateOnStart') && markdownRenderer.includes('onTouchStart={beginLock}'),
  'Markdown formula horizontal scroll should keep the guarded eager capture used by the rollback baseline'
);
check(
  messageBubble.includes('onHorizontalGestureStart={lockDrawerGesture}') &&
    messageBubble.includes('onHorizontalGestureEnd={unlockDrawerGesture}'),
  'MessageBubble should keep drawer gesture locking for Markdown horizontal scroll'
);
check(messageBubble.includes('onOpenAttachment?: (attachment: AttachmentRecord) => void;'), 'MessageBubble image preview callback prop missing');
check(messageBubble.includes('attachment.kind === \'image\''), 'MessageBubble should still detect image attachments');
check(messageBubble.includes('onOpenAttachment(attachment);'), 'MessageBubble should hand attachment taps back to App when provided');
check(messageBubble.includes('Image.getSize('), 'MessageBubble image preview sizing should read source dimensions');
check(messageBubble.includes('isImageOnlyMessage'), 'MessageBubble should keep the pure-image bubble branch');
check(messageBubble.includes('isSplitImageTextMessage'), 'MessageBubble should keep the split image-plus-text branch');
check(messageBubble.includes('imageOnlyBubble'), 'MessageBubble should keep the dedicated image-only bubble styles');
check(codeBlock.includes('Copy'), 'CodeBlock copy action missing');
check(codeBlock.includes('Fullscreen code'), 'CodeBlock fullscreen action missing');
check(codeBlock.includes('onScrollBeginDrag={onHorizontalGestureStart}'), 'CodeBlock horizontal gesture start hook missing');
check(codeBlock.includes('onScrollEndDrag={onHorizontalGestureEnd}'), 'CodeBlock horizontal gesture end hook missing');
for (const viewerGuard of [
  '@likashefqet/react-native-image-zoom',
  'ImageZoom',
  'GestureHandlerRootView',
  'useSafeAreaInsets',
  'hitSlop={12}',
  'resizeMode="contain"',
  'statusBarTranslucent',
  'isPinchEnabled',
  'isDoubleTapEnabled',
  'unstable_forceActive',
]) {
  check(imageAttachmentViewer.includes(viewerGuard), `Image attachment viewer guard missing ${viewerGuard}`);
}
check(!imageAttachmentViewer.includes('Gesture.Pinch()'), 'Production image viewer should not keep pinch gestures active');
for (const labGestureGuard of [
  '@likashefqet/react-native-image-zoom',
  'ImageZoom',
  'DrawerLabImageGestureOverlay',
  'icon-source.png.jpg',
  'onPress={onOpen}',
  'unstable_forceActive',
  'isSingleTapEnabled',
  'isDoubleTapEnabled',
  'onProgrammaticZoom',
  "zoomRef.current.zoom({",
  'onSingleTap={handleClose}',
  'scale={scaleValue}',
  '...StyleSheet.absoluteFill',
]) {
  check(drawerLabImageGestureExperiment.includes(labGestureGuard), `Drawer Lab image gesture experiment missing ${labGestureGuard}`);
}
check(!drawerLabImageGestureExperiment.includes('Gesture.Pinch()'), 'Drawer Lab image experiment should now rely on the dedicated image zoom library instead of local pinch wiring');
check(!drawerLabImageGestureExperiment.includes('gestureHandlerRootHOC'), 'Drawer Lab image experiment should no longer rely on a nested modal-specific HOC path');
check(
  drawerLab.includes('<DrawerLabImageGestureExperiment') &&
    drawerLab.includes('<DrawerLabImageGestureOverlay') &&
    drawerLab.includes('{imageLabViewerVisible ? (') &&
    drawerLab.includes('visible') &&
    drawerLab.includes('unstable_forceActive') &&
    drawerLab.includes('copy.imageGestureTitle') &&
    drawerLab.includes('copy.imageGestureDescription'),
  'Drawer Lab should render the isolated image gesture experiment'
);

check(conversations.includes('export function formatConversationMarkdown'), 'Markdown conversation export missing');
check(conversations.includes('export function formatConversationJson'), 'JSON conversation export missing');
check(conversations.includes('export function formatConversationsJson'), 'Multi-conversation JSON export missing');
check(conversations.includes('schemaVersion: 1'), 'JSON conversation export schema version missing');
check(conversations.includes('formatAttachmentForExport'), 'JSON export should sanitize attachment metadata');
check(conversations.includes('Export only portable metadata'), 'JSON export privacy audit comment missing');
check(!conversations.includes('apiKey'), 'Conversation export code should not reference API keys');
check(!/formatAttachmentForExport[\s\S]*uri:/.test(conversations), 'JSON export should not include local attachment URIs');
check(app.includes("exportConversationFile(sessionContextConversation, 'json')"), 'Session context JSON export action missing');
check(app.includes("exportConversationFile(sessionContextConversation, 'markdown')"), 'Session context Markdown export action missing');
check(app.includes("exportSelectedSessionFiles('json')"), 'Selected session JSON export action missing');
check(app.includes('loadAttachmentCacheStats('), 'App should load attachment cache stats through the extracted helper');
check(app.includes('exportConversationsToUserDirectory({'), 'App should export sessions through the extracted helper');
check(chatStorageActions.includes('exportTextFileToUserDirectory({'), 'Storage export helpers should save user-visible files');
check(app.includes('openStorageLocationWithClipboard('), 'App should open storage paths through the extracted helper');
check(app.includes('exportUnreadableConversationBackup('), 'App should export unreadable sessions through the extracted helper');
check(app.includes('deleteUnreadableConversationRecord('), 'App should delete unreadable sessions through the extracted helper');
check(app.includes('clearChatsAndRecoverProfileState()'), 'App should share the post-clear recovery helper across storage cleanup flows');
check(app.includes('refreshAttachmentCacheStats'), 'Attachment cache stats refresh action missing');
check(app.includes('copy.attachmentCacheStats'), 'Attachment cache stats display missing');
check(app.includes('Let users clear a preset URL before pasting a replacement'), 'API Base URL editor should allow temporary empty values');
check(app.includes('requireBaseUrl?: boolean'), 'API profile save should expose an explicit Base URL requirement');
check(app.includes('hasDraftBaseUrl(draft)'), 'API profile save should use editable draft Base URL guard');
check(app.includes('sanitizeEditableProfileDraft(updated)'), 'API draft updates should use editable draft sanitization');
check(app.includes('copy.baseUrlRequiredMessage'), 'API Base URL required prompt missing');
check(profileDrafts.includes('export function hasDraftBaseUrl'), 'API draft Base URL helper missing');
check(profileDrafts.includes('export function hasDraftProfileLabel'), 'API draft profile label helper missing');
check(profileDrafts.includes('export function sanitizeEditableProfileDraft'), 'API editable draft sanitizer missing');
check(app.includes('hasDraftProfileLabel(draft)'), 'API profile save should allow temporary empty profile labels');
check(
  profileDrafts.includes('baseUrl: hasDraftBaseUrl(profile) ? sanitized.baseUrl : profile.baseUrl'),
  'API editable draft sanitizer should preserve temporary empty Base URL values'
);
check(
  profileDrafts.includes('label: hasDraftProfileLabel(profile) ? sanitized.label : profile.label'),
  'API editable draft sanitizer should preserve temporary empty profile labels'
);
check(profileDrafts.includes('persisted profiles still use sanitizeProfile'), 'API draft sanitizer audit comment missing');
for (const capabilityGuard of [
  'export type ProviderCapabilities',
  'supportsResponses',
  'supportsChatCompletions',
  'supportsResponseChaining',
  'supportsStreaming',
  'supportsImages',
  'supportsFiles',
  'supportsSystemPrompt',
  'supportsReasoning',
  'supportsWebSearch',
  'export function inferProtocolCapabilities',
  'export function inferProviderCapabilities',
  'export function canSendNativeAttachments',
  'isDeepSeekReasoningModel',
]) {
  check(providerCapabilities.includes(capabilityGuard), `Provider capability guard missing ${capabilityGuard}`);
}
check(
  providerCapabilities.includes("supportsWebSearch: supportsOpenAIWebSearch(profile)") &&
    providerCapabilities.includes("normalizedBaseUrl === 'https://api.openai.com/v1'"),
  'Provider web search capability should be limited to supported OpenAI Responses profiles'
);
check(
  providerCapabilities.includes("profile.apiProtocol === 'chatCompletions'") &&
    providerCapabilities.includes('modelSupportsReasoning(profile.model)'),
  'Provider reasoning capability should reflect protocol and model inference'
);
check(openai.includes('inferProviderCapabilities'), 'Provider capability metadata should guard request construction when web search is enabled');
check(files.includes('export type AttachmentCacheStats'), 'Attachment cache stats type missing');
check(files.includes('FileSystem.readDirectoryAsync(ATTACHMENT_DIR)'), 'Attachment cache stats should read the attachment directory');
check(files.includes('referencedFileCount'), 'Attachment cache stats should include referenced attachment count');
check(
  attachmentCache.includes('...getAllConversationAttachments(conversations)') &&
    attachmentCache.includes('...pendingAttachments'),
  'Attachment cache stats should include saved and pending attachment references'
);
check(conversations.includes('message.variants?.flatMap((variant) => variant.attachments)'), 'Conversation attachment collection should include variant attachments');
check(files.includes('normalizeDisplayName'), 'Attachment display names should preserve decoded original names');
check(files.includes('name: displayName'), 'Attachment records should keep display names separate from safe storage names');
check(files.includes('export const MAX_ATTACHMENT_BYTES'), 'Attachment size limit should be exported for guarded UI messages');
check(files.includes('AttachmentSizeError'), 'Attachment size errors should use a typed error');
check(files.includes('FileSystem.deleteAsync(destination'), 'Oversized copied attachments should be cleaned up');
check(app.includes('copy.attachmentTooLargeMessage'), 'Oversized attachment UI message missing');
check(app.includes('previewAttachment') && app.includes('<ImageAttachmentViewer'), 'Image attachment preview viewer missing');
check(app.includes('function openAttachmentPreviewOrFile(attachment: AttachmentRecord)'), 'App should share attachment open/preview logic');
check(app.includes('onOpenAttachment={handleOpenConversationAttachment}'), 'Conversation messages should pass attachment preview handling into MessageBubble');
check(!app.includes('attachmentPreviewDelete') && !app.includes('attachmentPreviewActions'), 'Pending image preview should only use the top-right close button');
check(app.includes('<PendingAttachmentBar'), 'Pending attachment rail should be rendered through PendingAttachmentBar');
check(pendingAttachmentBar.includes('styles.thumb'), 'Pending image attachment thumbnail missing');
check(pendingAttachmentBar.includes('styles.removeButton'), 'Pending attachment chips should keep the overlay remove button');
check(pendingAttachmentBar.includes("attachment.kind === 'image'"), 'Pending attachment rail should still branch for image thumbnails');
check(app.includes('<ModelPickerContent'), 'Model picker should be rendered through ModelPickerContent');
check(app.includes('<SettingsApiSection'), 'API settings should render through SettingsApiSection');
check(app.includes('<SettingsLanguageSection'), 'Language settings should render through SettingsLanguageSection');
check(app.includes('<SettingsRootSection'), 'Settings root navigation should render through SettingsRootSection');
check(modelPickerContent.includes('onFetchModels'), 'Model picker fetch action missing');
check(settingsApiSection.includes('SlideFadePresence'), 'API settings should preserve the advanced-section motion container');
check(settingsApiSection.includes('copy.webSearch') && settingsApiSection.includes('copy.responseStorage'), 'API settings should keep advanced web-search and response-storage controls');
check(settingsApiSection.includes('onSelectDraftApiProfile') && settingsApiSection.includes('onFocusApiProfileInput'), 'API settings should keep profile selection and input focus handoff props');
check(settingsLanguageSection.includes("onApplyUiLanguage('zh')") && settingsLanguageSection.includes("onApplyUiLanguage('en')"), 'Language settings should preserve both language actions');
check(settingsRootSection.includes('onOpenApiProfiles') && settingsRootSection.includes('onNavigate(item.key)'), 'Settings root navigation should keep API and generic navigation actions');
check(modelPickerContent.includes('onLongPressProfile'), 'Model picker profile long-press editor action missing');
check(modelPickerContent.includes('onSelectModel(model)'), 'Model picker model selection action missing');
check(modelPickerContent.includes("removeClippedSubviews={Platform.OS === 'android'}"), 'Model picker Android list clipping guard missing');
check(
  app.includes('const chatKeyboardInsetAnimated = useRef(new Animated.Value(0)).current;') &&
    app.includes('applyChatKeyboardInsetBottom(normalizedBottom);') &&
    app.includes('{ marginBottom: chatComposerMarginBottomAnimated }') &&
    app.includes("Dimensions.addEventListener('change'") &&
    !app.includes('useWindowDimensions('),
  'Android chat composer should consume keyboard inset through the animated chat dock path without window-dimension keyboard churn'
);
check(
  app.includes('pendingKeyboardFollowDeltaRef') &&
    app.includes('const maxOffset = getChatScrollMaxOffset(metrics)') &&
    app.includes('scrollRef.current?.scrollTo({ y: nextOffset, animated: false })') &&
    app.includes('if (composerExpanded) {') &&
    app.includes('if (maxOffset <= 1) {'),
  'Android keyboard follow compensation missing'
);
check(
  app.includes("const settingsKeyboardInset = Platform.OS === 'android' ? keyboardInsetBottom : 0;"),
  'Settings keyboard inset split missing'
);
check(
  app.includes('const innerViewNode = scrollView.getInnerViewNode?.();') &&
    app.includes('UIManager.measureLayout(') &&
    app.includes('settingsAutoScrollLateRetryTimerRef') &&
    app.includes("behavior={Platform.OS === 'android' ? 'height' : 'padding'}") &&
    app.includes('scheduleSettingsInputVisibility(settingsFocusedInputRef.current, false);'),
  'Settings keyboard avoidance should measure against the settings viewport and refresh after content-size changes'
);
check(
  app.includes('applySavedProfileToEditor?: boolean;') &&
    app.includes('if (options.applySavedProfileToEditor) {') &&
    app.includes('function queueDraftApiProfileSave(delayMs = 600) {'),
  'API profile autosave should avoid writing stale drafts back into active inputs'
);
check(
  app.includes('const apiProfileBlurSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);') &&
    app.includes('const apiProfileFocusedInputCountRef = useRef(0);') &&
    app.includes('const lastDraftApiProfileEditAtRef = useRef(0);') &&
    app.includes('function handleApiProfileInputFocus(') &&
    app.includes('function handleApiProfileInputBlur() {') &&
    app.includes('if (settingsSection === \'api\') {') &&
    app.includes('queueDraftApiProfileSave(Math.max(120, delayMs - elapsedMs + 80));'),
  'API profile autosave should defer while focused, wait for edit idle time, and discard invalid close drafts'
);
check(app.includes('streamingAutoFollowEnabledRef'), 'Streaming follow toggle missing');
check(app.includes('handleChatContentSizeChange'), 'Chat content-size tracking missing');
check(app.includes('copy.jumpToLatest'), 'Jump-to-latest button copy missing');
check(types.includes('webSearchEnabled: boolean;'), 'API profiles should persist a web search toggle');
check(providerCapabilities.includes('supportsWebSearch: supportsOpenAIWebSearch(profile)'), 'Provider capability inference should gate web search to supported profiles');
check(openai.includes("return [{ type: 'web_search' }];"), 'Responses requests should enable the official web_search tool when configured');
check(openai.includes('function buildRuntimeSystemPrompt(profile: ApiProfile): string {'), 'Responses requests should add a runtime prompt for current-date and live-search grounding');
check(openai.includes('Current local device date/time:'), 'Responses runtime prompt should inject the local device date/time');
check(openai.includes('use web search before answering when it improves accuracy'), 'Responses runtime prompt should tell live questions to prefer web search');
check(openai.includes('const assistantText = streamed.text || extractResponsesAssistantText(streamed.finalPayload);'), 'Responses streaming should fall back to the final payload text when tool-backed output does not emit deltas');
check(openai.includes('const assistantText = streamed.text || extractChatCompletionAssistantText(streamed.finalPayload);'), 'Chat Completions streaming should fall back to the correct final payload text extractor');
check(settingsApiSection.includes('copy.webSearch') && settingsApiSection.includes('draftProfile.webSearchEnabled'), 'API settings should expose the web search toggle');
check(app.includes('function looksLikeLiveSearchPrompt(text: string): boolean {'), 'Chat send path should detect clearly time-sensitive live-search prompts');
check(app.includes('copy.liveSearchSuggestedTitle') && app.includes('copy.liveSearchSuggestedMessage'), 'Chat send path should surface a light reminder when the active profile cannot search the web');
check(app.includes('UNSUPPORTED_LIVE_SEARCH_ALERT_COOLDOWN_MS'), 'Live-search reminder should keep a cooldown to avoid spamming alerts');
check(app.includes("type ComposerLiveSearchStatus = 'ready' | 'disabled' | 'unsupported';"), 'Composer should derive a visible live-search status state');
check(app.includes('copy.liveSearchReadyHint') && app.includes('copy.liveSearchDisabledHint') && app.includes('copy.liveSearchUnsupportedHint'), 'Composer should expose visible live-search hints for ready, disabled, and unsupported states');
check(app.includes('styles.liveSearchHintRow') && app.includes('styles.fullComposerLiveSearchHint'), 'Composer should render the live-search hint in both compact and expanded input surfaces');
check(app.includes('const previousContentHeight = chatScrollMetricsRef.current?.contentHeight ?? null;'), 'Streaming auto-follow should compare content height before scheduling another bottom follow');
check(app.includes('scrollChatToLatest({ animated: false });'), 'Streaming auto-follow should use a quiet non-animated bottom pin');
check(!app.includes('const nextText = streamingTextRef.current;\r\n    scheduleStreamingScroll();') && !app.includes('const nextText = streamingTextRef.current;\n    scheduleStreamingScroll();'), 'Streaming flush should not schedule another scroll before layout confirms content growth');
check(app.includes('<SettingsAppearanceSection'), 'Theme settings should render through SettingsAppearanceSection');
check(app.includes('<SettingsStorageSection'), 'Storage settings should render through SettingsStorageSection');
check(settingsAppearanceSection.includes('onApplyThemePreset'), 'Theme settings should expose a theme preset action');
check(settingsAppearanceSection.includes('copy.themePresetLabel'), 'Theme settings should show a theme preset section');
check(settingsAppearanceSection.includes('getThemePresetSwatches(option.preset)'), 'Theme settings should render preset swatch previews');
check(app.includes('persisted.themePreset'), 'Theme settings should persist the selected preset');
check(types.includes("export type ChatBackgroundPreset = 'plain' | 'grid' | 'bands';"), 'Chat background preset type missing');
check(storage.includes('chatBackgroundPreset: DEFAULT_CHAT_BACKGROUND_PRESET'), 'Persisted state should keep a default chat background preset');
check(storage.includes('chatBackgroundPreset: normalizeChatBackgroundPreset(parsed.chatBackgroundPreset)'), 'Persisted state should normalize saved chat background presets');
check(storage.includes('chatBackgroundImageUri: null'), 'Persisted state should keep a default custom chat background image field');
check(storage.includes('chatBackgroundImageUri: normalizeOptionalLocalUri(parsed.chatBackgroundImageUri)'), 'Persisted state should normalize saved custom chat background image values');
check(storage.includes('chatBackgroundImageOpacity: DEFAULT_CHAT_BACKGROUND_IMAGE_OPACITY'), 'Persisted state should keep a default custom chat background image opacity');
check(storage.includes('chatBackgroundImageOpacity: normalizeChatBackgroundImageOpacity(parsed.chatBackgroundImageOpacity)'), 'Persisted state should normalize saved custom chat background image opacity values');
check(types.includes('chatBackgroundImageUri: string | null;'), 'Persisted state should store a custom chat background image URI');
check(types.includes('chatBackgroundImageOpacity: number;'), 'Persisted state should store a custom chat background image opacity');
check(files.includes('export async function pickChatBackgroundImage'), 'Files module should expose chat background image picking');
check(files.includes('export async function deleteChatBackgroundImage'), 'Files module should expose chat background image cleanup');
check(files.includes('allowsEditing: true'), 'Chat background image picker should enable system cropping');
check(files.includes('aspect: [9, 16]'), 'Chat background image picker should request a stable crop aspect');
check(theme.includes("CHAT_BACKGROUND_PRESET_OPTIONS: ChatBackgroundPreset[] = ['plain']"), 'Theme module should keep only the plain chat background preset');
check(theme.includes('CHAT_BACKGROUND_IMAGE_OPACITY_MIN'), 'Theme module should expose a chat background image opacity minimum');
check(theme.includes('CHAT_BACKGROUND_IMAGE_OPACITY_MAX'), 'Theme module should expose a chat background image opacity maximum');
check(theme.includes('normalizeChatBackgroundImageOpacity'), 'Theme module should normalize chat background image opacity');
check(theme.includes('export function getChatBackgroundPresetSwatches'), 'Theme module should expose chat background swatch previews');
check(theme.includes('chatBackgroundGridStrong'), 'Theme module should expose stronger grid background tokens');
check(theme.includes('chatBackgroundBandSoft'), 'Theme module should expose visible band background tokens');
check(settingsAppearanceSection.includes('copy.chatBackgroundLabel'), 'Appearance settings should expose a chat background section');
check(!settingsAppearanceSection.includes('onApplyChatBackgroundPreset'), 'Appearance settings should no longer expose legacy chat background preset switching');
check(settingsAppearanceSection.includes('onPickChatBackgroundImage'), 'Appearance settings should expose chat background image picking');
check(settingsAppearanceSection.includes('chatBackgroundImagePick'), 'Appearance settings should expose chat background image labels');
check(settingsAppearanceSection.includes('chatBackgroundImageRecrop'), 'Appearance settings should expose chat background image recrop labels');
check(settingsAppearanceSection.includes('chatBackgroundImageCropHint'), 'Appearance settings should expose chat background image crop guidance');
check(settingsAppearanceSection.includes('chatBackgroundImageOpacityLabel'), 'Appearance settings should expose chat background image opacity labels');
check(settingsAppearanceSection.includes('chatBackgroundImageOpacityHint'), 'Appearance settings should expose direct opacity input guidance');
check(settingsAppearanceSection.includes('TextInput'), 'Appearance settings should use a direct opacity text input');
check(settingsAppearanceSection.includes('keyboardType="numeric"'), 'Appearance settings should request a numeric opacity keyboard');
check(settingsAppearanceSection.includes('appearanceCollapsedHint'), 'Appearance settings should expose collapsed group summaries');
check(settingsAppearanceSection.includes('chatBackgroundImageUri ? ('), 'Appearance settings should render a background image preview when present');
check(settingsStorageSection.includes('attachmentCacheSummary'), 'Storage settings should accept a preformatted attachment cache summary');
check(settingsStorageSection.includes('onRefreshAttachmentCacheStats'), 'Storage settings should expose cache refresh actions');
check(settingsStorageSection.includes('onConfirmClearLocalData'), 'Storage settings should expose local-clear confirmation actions');
check(settingsStorageSection.includes('unreadableConversationIds.map'), 'Storage settings should render unreadable-session recovery rows');
check(!app.includes('function applyChatBackgroundPreset(chatBackgroundPreset: ChatBackgroundPreset)'), 'App should no longer keep legacy chat background preset mutation helpers');
check(app.includes('function applyChatBackgroundImageOpacity(chatBackgroundImageOpacity: ChatBackgroundImageOpacity)'), 'App should persist chat background image opacity changes');
check(app.includes('themeModeLabel: copy.themeModeLabel'), 'Appearance settings should receive the display-mode label copy');
check(app.includes('chatBackgroundPreset={persisted.chatBackgroundPreset}'), 'Appearance settings should receive the saved chat background preset');
check(app.includes('chatBackgroundImageUri={persisted.chatBackgroundImageUri}'), 'Appearance settings should receive the saved chat background image URI');
check(app.includes('styles.chatBackgroundLayer'), 'Chat screen should render the decorative background layer');
check(app.includes('persisted.chatBackgroundImageUri && ('), 'Chat screen should render a custom chat background image when present');
check(app.includes('function pickCustomChatBackgroundImage()'), 'App should expose custom chat background image picking');
check(app.includes('const resolvedChatBackgroundImageOpacity ='), 'Chat screen should derive a resolved custom background image opacity value');
check(app.includes('opacity: resolvedChatBackgroundImageOpacity'), 'Chat screen should apply saved custom background image opacity');
check(app.includes('multiplyColorAlpha(theme.chatBackgroundOverlay, 1 - resolvedChatBackgroundImageOpacity)'), 'Chat screen should rebalance the overlay when a custom background image is visible');
check(!app.includes('CHAT_BACKGROUND_GRID_COLUMNS'), 'Chat screen should no longer keep legacy grid background columns');
check(!app.includes("persisted.chatBackgroundPreset === 'grid'"), 'Chat screen should no longer render legacy grid backgrounds');
check(!app.includes("persisted.chatBackgroundPreset === 'bands'"), 'Chat screen should no longer render legacy band backgrounds');

for (const drawerGuard of [
  'export const DRAWER_OPEN_EDGE_FRACTION = 0.18',
  'export const DRAWER_OPEN_EDGE_MAX_WIDTH = 72',
  'export const DRAWER_SWIPE_SLOPE = 0.35',
  'export const DRAWER_OPEN_SWIPE_MIN_DISTANCE = 16',
  'export const DRAWER_OPEN_SWIPE_SLOPE = 1.35',
  'export const DRAWER_OPEN_EDGE_QUICK_CLAIM_MAX_WIDTH = 32',
  'export const DRAWER_OPEN_EDGE_QUICK_CLAIM_MIN_DISTANCE = 10',
  'export const DRAWER_OPEN_EDGE_QUICK_CLAIM_SLOPE = 1.05',
  'export const SESSION_CLOSE_SWIPE_SLOPE = 0.65',
  'export const SESSION_CLOSE_SWIPE_MIN_DISTANCE = 14',
  'export function isLooseDirectionalSwipe',
  'export function isIntentionalDrawerOpenSwipe',
  'export function getDrawerOpenQuickClaimWidth',
  'export function isIntentionalDrawerOpenSwipeNearEdge',
  'export function isSensitiveSessionCloseSwipe',
  'export function getDrawerOpenEdgeWidth',
  'export function isWithinDrawerOpenEdge',
]) {
  check(drawerGestures.includes(drawerGuard), `Drawer gesture guard missing ${drawerGuard}`);
}

check(drawerGestures.includes('Math.min(DRAWER_OPEN_EDGE_MAX_WIDTH, windowWidth * DRAWER_OPEN_EDGE_FRACTION)'), 'Drawer open edge should cap wide-screen hit area');
check(app.includes('const drawerOpenGestureMode = persisted.interactionSettings.drawerOpenGestureMode'), 'Drawer open gesture should read the saved trigger mode');
check(app.includes('const drawerOpenEdgeWidth = getConfiguredDrawerOpenWidth('), 'Drawer edge width should still follow the saved interaction setting');
check(app.includes('<LegacyDrawerLayout'), 'Production chat should use LegacyDrawerLayout');
check(app.includes('drawerType="slide"'), 'Production drawer should use slide motion like the lab default');
check(app.includes('drawerWidth={sessionDrawerWidth}'), 'Production drawer should bind the computed session drawer width');
check(app.includes('edgeWidth={drawerEdgeWidth}'), 'Production drawer should map the configured trigger width into DrawerLayout edgeWidth');
check(app.includes('renderNavigationView={renderSessionDrawerNavigationView}'), 'Production drawer should render sessions through DrawerLayout navigation view');
check(app.includes('const renderSessionDrawerNavigationView = () => ('), 'Production drawer should expose a dedicated navigation view renderer');
check(app.includes('width: sessionDrawerWidth'), 'Session drawer surface should stay bounded to the configured side width');
check(app.includes('borderRightWidth: 1'), 'Session drawer surface should render as a side panel instead of a fullscreen overlay');
check(app.includes('const drawerEdgeWidth = drawerOpenGestureMode === \'fullscreen\' ? windowWidth : drawerOpenEdgeWidth'), 'Fullscreen trigger mode should widen only the drawer edge gesture width');
check(drawerGestures.includes('absX > absY * DRAWER_OPEN_SWIPE_SLOPE'), 'Drawer open swipe should keep the older quick feel after clear horizontal intent');
check(drawerGestures.includes('very left edge gets this slightly earlier claim path'), 'Drawer quick-claim path should stay documented as edge-only');
check(drawerGestures.includes('message-list vertical scrolling keeps priority'), 'Drawer open swipe should document the vertical-scroll boundary');
check(drawerGestures.includes('export function getConfiguredDrawerOpenWidth'), 'Drawer gesture helpers should expose the configured trigger width');
check(drawerGestures.includes('export function isWithinConfiguredDrawerOpenArea'), 'Drawer gesture helpers should expose the configured trigger area guard');
check(
  /function openSessionsDrawer[\s\S]*sessionDrawerRef\.current\?\.openDrawer\(/.test(app),
  'Drawer open should drive the DrawerLayout instance directly'
);
check(
  /function closeSessionsDrawer[\s\S]*sessionDrawerRef\.current\?\.closeDrawer\(/.test(app),
  'Drawer close should drive the DrawerLayout instance directly'
);
check(
  app.includes('function handleSessionDrawerStateChange(state: LegacyDrawerState, drawerWillShow: boolean)'),
  'Production drawer should sync visible state from DrawerLayout state changes'
);
check(
  app.includes('const effectiveSessionDrawerLockMode: LegacyDrawerLockMode ='),
  'Production drawer should derive an effective DrawerLayout lock mode from the live UI state'
);
check(app.includes('sessionDrawerRef.current?.closeDrawer({ speed: 1000 })'), 'Forced drawer close should still support an immediate cleanup path');
check(app.includes('const drawerOverlayColor = theme.scheme === \'dark\''), 'Production drawer should define an explicit overlay tint for the DrawerLayout shell');
check(app.includes("isLooseDirectionalDelta(dx, dy, 'right', 56)"), 'Settings return swipe threshold should stay unchanged');
check(app.includes('horizontalGestureLocked'), 'Horizontal gesture lock state missing');

console.log('Smoke checks passed');
