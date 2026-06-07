import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const KEYBOARD_INSETS_EVENT = 'KeyboardInsetsChanged';

type KeyboardInsetsNativeModule = {
  start?: () => void;
  stop?: () => void;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
};

export type KeyboardInsetsEvent = {
  bottom?: number;
  screenY?: number;
  visible?: boolean;
};

function getKeyboardInsetsModule(): KeyboardInsetsNativeModule | undefined {
  return NativeModules.KeyboardInsets as KeyboardInsetsNativeModule | undefined;
}

export function hasKeyboardInsetsBridge(): boolean {
  return Platform.OS === 'android' && typeof getKeyboardInsetsModule()?.start === 'function';
}

export function startKeyboardInsetsTracking(): void {
  if (Platform.OS === 'android') {
    getKeyboardInsetsModule()?.start?.();
  }
}

export function subscribeKeyboardInsets(listener: (event: KeyboardInsetsEvent) => void): (() => void) | undefined {
  const keyboardInsetsModule = getKeyboardInsetsModule();
  if (!hasKeyboardInsetsBridge() || !keyboardInsetsModule) {
    return undefined;
  }

  const emitter = new NativeEventEmitter(NativeModules.KeyboardInsets);
  const subscription = emitter.addListener(KEYBOARD_INSETS_EVENT, listener);
  keyboardInsetsModule.start?.();

  return () => {
    subscription.remove();
    keyboardInsetsModule.stop?.();
  };
}
