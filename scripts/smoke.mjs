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
const pendingAttachmentBar = read('src/components/PendingAttachmentBar.tsx');
const modelPickerContent = read('src/components/ModelPickerContent.tsx');
const profileDrafts = read('src/lib/profileDrafts.ts');
const providerCapabilities = read('src/lib/providerCapabilities.ts');
const conversations = read('src/lib/conversations.ts');
const drawerGestures = read('src/lib/drawerGestures.ts');
const openai = read('src/lib/openai.ts');
const files = read('src/lib/files.ts');
const storage = read('src/lib/storage.ts');
const markdownRegression = read('scripts/fixtures/markdown-regression.md');
const sharedImagesBridge = read('src/native/sharedImages.ts');
const keyboardInsetsBridge = read('src/native/keyboardInsets.ts');
const sharedImageModule = read('android/app/src/main/java/com/fanshanng/aichatpocket/SharedImageModule.kt');
const keyboardInsetsModule = read('android/app/src/main/java/com/fanshanng/aichatpocket/KeyboardInsetsModule.kt');
const manifest = read('android/app/src/main/AndroidManifest.xml');

check(packageJson.main === 'index.ts', 'package.json main should remain index.ts');
check(packageJson.scripts?.['release:audit'] === 'node scripts/release-audit.mjs', 'Release audit script should stay wired in package.json');
check(String(packageJson.dependencies.expo ?? '').startsWith('~56.'), 'Expo SDK should remain version 56');
check(appJson.expo?.android?.package === 'com.fanshanng.aichatpocket', 'Android package name changed');
check(index.includes("registerRootComponent(App)"), 'Root component registration missing');
for (const auditGuard of [
  'assertReleaseNoteShape',
  'assertForbiddenUploadFiles',
  'README should not contain a Download section',
  'release-notes/RELEASE_NOTES_v',
  'Current release note still contains Pending markers',
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
  'loadPersistedState',
  'savePersistedState',
  'migrateLegacyApiKey',
  'loadProfileApiKey',
]) {
  check(storage.includes(`export async function ${exportName}`), `${exportName} export missing`);
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
  messageBubble.includes('onHorizontalGestureStart={lockDrawerGesture}') &&
    messageBubble.includes('onHorizontalGestureEnd={unlockDrawerGesture}'),
  'MessageBubble should keep drawer gesture locking for Markdown horizontal scroll'
);
check(codeBlock.includes('Copy'), 'CodeBlock copy action missing');
check(codeBlock.includes('Fullscreen code'), 'CodeBlock fullscreen action missing');
check(codeBlock.includes('onScrollBeginDrag={onHorizontalGestureStart}'), 'CodeBlock horizontal gesture start hook missing');
check(codeBlock.includes('onScrollEndDrag={onHorizontalGestureEnd}'), 'CodeBlock horizontal gesture end hook missing');

check(conversations.includes('export function formatConversationMarkdown'), 'Markdown conversation export missing');
check(conversations.includes('export function formatConversationJson'), 'JSON conversation export missing');
check(conversations.includes('export function formatConversationsJson'), 'Multi-conversation JSON export missing');
check(conversations.includes('schemaVersion: 1'), 'JSON conversation export schema version missing');
check(conversations.includes('formatAttachmentForExport'), 'JSON export should sanitize attachment metadata');
check(conversations.includes('Export only portable metadata'), 'JSON export privacy audit comment missing');
check(!conversations.includes('apiKey'), 'Conversation export code should not reference API keys');
check(!/formatAttachmentForExport[\s\S]*uri:/.test(conversations), 'JSON export should not include local attachment URIs');
check(app.includes("copyConversationExport(sessionContextConversation, 'json')"), 'Session context JSON export action missing');
check(app.includes("copyConversationExport(sessionContextConversation, 'markdown')"), 'Session context Markdown export action missing');
check(app.includes("copySelectedSessionExports('json')"), 'Selected session JSON export action missing');
check(app.includes('refreshAttachmentCacheStats'), 'Attachment cache stats refresh action missing');
check(app.includes('copy.attachmentCacheStats'), 'Attachment cache stats display missing');
check(app.includes('Let users clear a preset URL before pasting a replacement'), 'API Base URL editor should allow temporary empty values');
check(app.includes('requireBaseUrl?: boolean'), 'API profile save should expose an explicit Base URL requirement');
check(app.includes('hasDraftBaseUrl(draft)'), 'API profile save should use editable draft Base URL guard');
check(app.includes('sanitizeEditableProfileDraft(updated)'), 'API draft updates should use editable draft sanitization');
check(app.includes('copy.baseUrlRequiredMessage'), 'API Base URL required prompt missing');
check(profileDrafts.includes('export function hasDraftBaseUrl'), 'API draft Base URL helper missing');
check(profileDrafts.includes('export function sanitizeEditableProfileDraft'), 'API editable draft sanitizer missing');
check(
  profileDrafts.includes('baseUrl: hasDraftBaseUrl(profile) ? sanitized.baseUrl : profile.baseUrl'),
  'API editable draft sanitizer should preserve temporary empty Base URL values'
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
  providerCapabilities.includes('supportsWebSearch: false') &&
    providerCapabilities.includes('later version adds explicit profile UI and request payload support'),
  'Provider web search capability should stay off until UI and request payload support are added'
);
check(
  providerCapabilities.includes("profile.apiProtocol === 'chatCompletions'") &&
    providerCapabilities.includes('modelSupportsReasoning(profile.model)'),
  'Provider reasoning capability should reflect protocol and model inference'
);
check(!openai.includes('inferProviderCapabilities'), 'Provider capability metadata should not change request construction yet');
check(files.includes('export type AttachmentCacheStats'), 'Attachment cache stats type missing');
check(files.includes('FileSystem.readDirectoryAsync(ATTACHMENT_DIR)'), 'Attachment cache stats should read the attachment directory');
check(files.includes('referencedFileCount'), 'Attachment cache stats should include referenced attachment count');
check(app.includes('...getAllConversationAttachments(persisted.conversations)') && app.includes('...pendingAttachments'), 'Attachment cache stats should include saved and pending attachment references');
check(conversations.includes('message.variants?.flatMap((variant) => variant.attachments)'), 'Conversation attachment collection should include variant attachments');
check(files.includes('normalizeDisplayName'), 'Attachment display names should preserve decoded original names');
check(files.includes('name: displayName'), 'Attachment records should keep display names separate from safe storage names');
check(files.includes('export const MAX_ATTACHMENT_BYTES'), 'Attachment size limit should be exported for guarded UI messages');
check(files.includes('AttachmentSizeError'), 'Attachment size errors should use a typed error');
check(files.includes('FileSystem.deleteAsync(destination'), 'Oversized copied attachments should be cleaned up');
check(app.includes('copy.attachmentTooLargeMessage'), 'Oversized attachment UI message missing');
check(app.includes('previewAttachment') && app.includes('attachmentPreviewImage'), 'Pending image attachment preview modal missing');
check(!app.includes('attachmentPreviewDelete') && !app.includes('attachmentPreviewActions'), 'Pending image preview should only use the top-right close button');
check(app.includes('<PendingAttachmentBar'), 'Pending attachment rail should be rendered through PendingAttachmentBar');
check(pendingAttachmentBar.includes('styles.thumb'), 'Pending image attachment thumbnail missing');
check(pendingAttachmentBar.includes('formatMeta(attachment)'), 'Pending attachment chips should show type and size metadata');
check(app.includes('<ModelPickerContent'), 'Model picker should be rendered through ModelPickerContent');
check(modelPickerContent.includes('onFetchModels'), 'Model picker fetch action missing');
check(modelPickerContent.includes('onLongPressProfile'), 'Model picker profile long-press editor action missing');
check(modelPickerContent.includes('onSelectModel(model)'), 'Model picker model selection action missing');
check(modelPickerContent.includes("removeClippedSubviews={Platform.OS === 'android'}"), 'Model picker Android list clipping guard missing');
check(app.includes('composerLayoutLift'), 'Android composer layout lift missing');
check(app.includes("Platform.OS === 'android' ? composerLayoutLift : 0"), 'Android composer lift should use layout margin for correct tap targets');

for (const drawerGuard of [
  'export const DRAWER_OPEN_EDGE_FRACTION = 0.25',
  'export const DRAWER_SWIPE_SLOPE = 0.35',
  'export const SESSION_CLOSE_SWIPE_SLOPE = 0.65',
  'export const SESSION_CLOSE_SWIPE_MIN_DISTANCE = 14',
  'export function isLooseDirectionalSwipe',
  'export function isSensitiveSessionCloseSwipe',
  'export function isWithinDrawerOpenEdge',
]) {
  check(drawerGestures.includes(drawerGuard), `Drawer gesture guard missing ${drawerGuard}`);
}

check(app.includes('isWithinDrawerOpenEdge(gestureState.x0, windowWidth)'), 'Drawer open edge should use centralized gesture strategy');
check(app.includes('style={[styles.drawerOpenEdge, { width: windowWidth * DRAWER_OPEN_EDGE_FRACTION }]}'), 'Drawer open edge width should stay at the guarded fraction');
check(app.includes("isLooseDirectionalSwipe(gestureState, 'right', 7)"), 'Drawer open swipe threshold should stay unchanged');
check(app.includes("isLooseDirectionalDelta(dx, dy, 'right', 56)"), 'Settings return swipe threshold should stay unchanged');
check(app.includes('horizontalGestureLocked'), 'Horizontal gesture lock state missing');

console.log('Smoke checks passed');
