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
const app = read('App.tsx');
const markdownRenderer = read('src/components/MarkdownRenderer.tsx');
const messageBubble = read('src/components/MessageBubble.tsx');
const codeBlock = read('src/components/CodeBlock.tsx');
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
check(String(packageJson.dependencies.expo ?? '').startsWith('~56.'), 'Expo SDK should remain version 56');
check(appJson.expo?.android?.package === 'com.fanshanng.aichatpocket', 'Android package name changed');
check(index.includes("registerRootComponent(App)"), 'Root component registration missing');

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

console.log('Smoke checks passed');
