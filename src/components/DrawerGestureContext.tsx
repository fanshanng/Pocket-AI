import { createContext, useContext } from 'react';

export type DrawerGestureContextValue = {
  lockDrawerGesture: () => void;
  unlockDrawerGesture: () => void;
  horizontalGestureLocked: boolean;
};

const noop = () => undefined;

export const DrawerGestureContext = createContext<DrawerGestureContextValue>({
  lockDrawerGesture: noop,
  unlockDrawerGesture: noop,
  horizontalGestureLocked: false,
});

export function useDrawerGesture() {
  return useContext(DrawerGestureContext);
}
