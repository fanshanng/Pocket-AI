import type { DrawerOpenGestureMode, InteractionSettings } from '../types';

export const DEFAULT_DRAWER_EDGE_WIDTH_PX = 96;
export const MIN_DRAWER_EDGE_WIDTH_PX = 16;
export const MAX_DRAWER_EDGE_WIDTH_PX = 240;

export const DEFAULT_INTERACTION_SETTINGS: InteractionSettings = {
  drawerOpenGestureMode: 'fullscreen',
  drawerEdgeWidthPx: DEFAULT_DRAWER_EDGE_WIDTH_PX,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeDrawerOpenGestureMode(value: unknown): DrawerOpenGestureMode {
  return value === 'edge' ? 'edge' : 'fullscreen';
}

export function normalizeDrawerEdgeWidthPx(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_DRAWER_EDGE_WIDTH_PX;
  }

  return clampNumber(Math.round(value), MIN_DRAWER_EDGE_WIDTH_PX, MAX_DRAWER_EDGE_WIDTH_PX);
}

// Keep interaction setting normalization in one place so future drawer rollouts and migrations
// do not duplicate fallback rules across App.tsx and storage.
export function normalizeInteractionSettings(value: Partial<InteractionSettings> | undefined): InteractionSettings {
  return {
    drawerOpenGestureMode: normalizeDrawerOpenGestureMode(value?.drawerOpenGestureMode),
    drawerEdgeWidthPx: normalizeDrawerEdgeWidthPx(value?.drawerEdgeWidthPx),
  };
}
