import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import type { SharedImageInput } from '../lib/files';

const SHARED_IMAGES_EVENT = 'SharedImages';

type SharedImageNativeModule = {
  getInitialImages?: () => Promise<SharedImageInput[]>;
  clear?: () => void;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
};

function getSharedImageModule(): SharedImageNativeModule | undefined {
  return NativeModules.SharedImage as SharedImageNativeModule | undefined;
}

export function hasSharedImageBridge(): boolean {
  return Platform.OS === 'android' && !!getSharedImageModule();
}

export function getSharedImageUri(input: SharedImageInput): string {
  return typeof input === 'string' ? input : input.uri;
}

export async function getInitialSharedImages(): Promise<SharedImageInput[] | undefined> {
  if (!hasSharedImageBridge()) {
    return undefined;
  }

  return getSharedImageModule()?.getInitialImages?.();
}

export function clearSharedImages(): void {
  getSharedImageModule()?.clear?.();
}

export function subscribeSharedImages(listener: (images: SharedImageInput[]) => void): (() => void) | undefined {
  if (!hasSharedImageBridge()) {
    return undefined;
  }

  const emitter = new NativeEventEmitter(NativeModules.SharedImage);
  const subscription = emitter.addListener(SHARED_IMAGES_EVENT, listener);

  return () => {
    subscription.remove();
  };
}
