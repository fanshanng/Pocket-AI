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
const openai = read('src/lib/openai.ts');
const files = read('src/lib/files.ts');
const storage = read('src/lib/storage.ts');
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

console.log('Smoke checks passed');
