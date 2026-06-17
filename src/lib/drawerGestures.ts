export const DRAWER_OPEN_EDGE_FRACTION = 0.25;
export const DRAWER_SWIPE_SLOPE = 0.35;
export const DRAWER_SWIPE_MIN_DISTANCE = 5;
export const DRAWER_OPEN_SWIPE_MIN_DISTANCE = 18;
export const DRAWER_OPEN_SWIPE_SLOPE = 1.1;
export const DRAWER_OPEN_SWIPE_FAST_VELOCITY = 0.42;
export const SESSION_CLOSE_SWIPE_SLOPE = 0.65;
export const SESSION_CLOSE_SWIPE_MIN_DISTANCE = 14;

export type DrawerGestureSample = {
  dx: number;
  dy: number;
  vx?: number;
  x0?: number;
};

export function isLooseDirectionalSwipe(
  gestureState: DrawerGestureSample,
  direction: 'left' | 'right',
  minDistance = DRAWER_SWIPE_MIN_DISTANCE
): boolean {
  const signedDx = direction === 'right' ? gestureState.dx : -gestureState.dx;
  if (signedDx < minDistance) {
    return false;
  }

  const absX = Math.abs(gestureState.dx);
  const absY = Math.abs(gestureState.dy);
  return absX > absY * DRAWER_SWIPE_SLOPE || Math.abs(gestureState.vx ?? 0) > 0.14;
}

export function isLooseDirectionalDelta(
  dx: number,
  dy: number,
  direction: 'left' | 'right',
  minDistance = DRAWER_SWIPE_MIN_DISTANCE
): boolean {
  const signedDx = direction === 'right' ? dx : -dx;
  if (signedDx < minDistance) {
    return false;
  }

  return Math.abs(dx) > Math.abs(dy) * DRAWER_SWIPE_SLOPE;
}

export function isSensitiveSessionCloseSwipe(gestureState: DrawerGestureSample): boolean {
  const signedDx = -gestureState.dx;
  if (signedDx < SESSION_CLOSE_SWIPE_MIN_DISTANCE) {
    return false;
  }

  const absX = Math.abs(gestureState.dx);
  const absY = Math.abs(gestureState.dy);
  return absX > Math.max(18, absY * SESSION_CLOSE_SWIPE_SLOPE) || (gestureState.vx ?? 0) < -0.18;
}

export function isIntentionalDrawerOpenSwipe(gestureState: DrawerGestureSample): boolean {
  const signedDx = gestureState.dx;
  if (signedDx < DRAWER_OPEN_SWIPE_MIN_DISTANCE) {
    return false;
  }

  const absX = Math.abs(gestureState.dx);
  const absY = Math.abs(gestureState.dy);
  const fastRightSwipe = (gestureState.vx ?? 0) > DRAWER_OPEN_SWIPE_FAST_VELOCITY;

  // Edge swipes start over the message list, so require a clear horizontal
  // intent before taking the responder away from normal vertical scrolling.
  return (
    absX > Math.max(DRAWER_OPEN_SWIPE_MIN_DISTANCE, absY * DRAWER_OPEN_SWIPE_SLOPE) ||
    (fastRightSwipe && absX > absY * 0.8)
  );
}

export function isWithinDrawerOpenEdge(x0: number, windowWidth: number): boolean {
  return x0 <= windowWidth * DRAWER_OPEN_EDGE_FRACTION;
}
