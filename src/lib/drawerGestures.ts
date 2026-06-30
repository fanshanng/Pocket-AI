import { normalizeDrawerEdgeWidthPx } from './interactionSettings';
import type { DrawerOpenGestureMode } from '../types';

export const DRAWER_OPEN_EDGE_FRACTION = 0.18;
export const DRAWER_OPEN_EDGE_MAX_WIDTH = 72;
export const DRAWER_SWIPE_SLOPE = 0.35;
export const DRAWER_SWIPE_MIN_DISTANCE = 5;
export const DRAWER_OPEN_SWIPE_MIN_DISTANCE = 16;
export const DRAWER_OPEN_SWIPE_SLOPE = 1.35;
export const DRAWER_OPEN_SWIPE_FAST_VELOCITY = 0.38;
export const DRAWER_OPEN_EDGE_QUICK_CLAIM_MAX_WIDTH = 32;
export const DRAWER_OPEN_EDGE_QUICK_CLAIM_MIN_DISTANCE = 10;
export const DRAWER_OPEN_EDGE_QUICK_CLAIM_SLOPE = 1.05;
export const DRAWER_OPEN_EDGE_QUICK_CLAIM_FAST_VELOCITY = 0.24;
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

  // Keep the older quick drawer feel, but only after a clear edge-started
  // horizontal intent so message-list vertical scrolling keeps priority.
  return (
    absX > absY * DRAWER_OPEN_SWIPE_SLOPE ||
    (fastRightSwipe && absX > absY * 0.8)
  );
}

export function getDrawerOpenQuickClaimWidth(configuredWidth: number): number {
  if (!Number.isFinite(configuredWidth)) {
    return DRAWER_OPEN_EDGE_QUICK_CLAIM_MAX_WIDTH;
  }

  return Math.max(16, Math.min(DRAWER_OPEN_EDGE_QUICK_CLAIM_MAX_WIDTH, configuredWidth));
}

export function isIntentionalDrawerOpenSwipeNearEdge(gestureState: DrawerGestureSample): boolean {
  const signedDx = gestureState.dx;
  if (signedDx < DRAWER_OPEN_EDGE_QUICK_CLAIM_MIN_DISTANCE) {
    return false;
  }

  const absX = Math.abs(gestureState.dx);
  const absY = Math.abs(gestureState.dy);
  const fastRightSwipe = (gestureState.vx ?? 0) > DRAWER_OPEN_EDGE_QUICK_CLAIM_FAST_VELOCITY;

  // Only the very left edge gets this slightly earlier claim path so clear
  // drawer-opening intent can start sooner without relaxing the wider chat area.
  return (
    absX > absY * DRAWER_OPEN_EDGE_QUICK_CLAIM_SLOPE ||
    (fastRightSwipe && absX > absY * 0.72)
  );
}

export function getDrawerOpenEdgeWidth(windowWidth: number): number {
  return Math.min(DRAWER_OPEN_EDGE_MAX_WIDTH, windowWidth * DRAWER_OPEN_EDGE_FRACTION);
}

export function isWithinDrawerOpenEdge(x0: number, windowWidth: number): boolean {
  return x0 <= getDrawerOpenEdgeWidth(windowWidth);
}

export function getConfiguredDrawerOpenWidth(
  windowWidth: number,
  mode: DrawerOpenGestureMode,
  edgeWidthPx: number
): number {
  if (mode === 'fullscreen') {
    return windowWidth;
  }

  return Math.min(windowWidth, normalizeDrawerEdgeWidthPx(edgeWidthPx));
}

export function isWithinConfiguredDrawerOpenArea(
  x0: number,
  windowWidth: number,
  mode: DrawerOpenGestureMode,
  edgeWidthPx: number
): boolean {
  if (!Number.isFinite(x0)) {
    return false;
  }

  return x0 >= 0 && x0 <= getConfiguredDrawerOpenWidth(windowWidth, mode, edgeWidthPx);
}
