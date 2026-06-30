import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ImageZoom, type ImageZoomRef, ZOOM_TYPE } from '@likashefqet/react-native-image-zoom';
import { X } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTheme } from '../theme';

type PreviewProps = {
  theme: AppTheme;
  title: string;
  description: string;
  openLabel: string;
  idleLabel: string;
  onOpen: () => void;
};

type OverlayProps = {
  visible: boolean;
  theme: AppTheme;
  closeLabel: string;
  resetLabel: string;
  idleLabel: string;
  activeLabel: string;
  onClose: () => void;
};

const SAMPLE_IMAGE = require('../../assets/icon-source.png.jpg');

function getContainedSize(
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const safeWidth = Math.max(1, contentWidth);
  const safeHeight = Math.max(1, contentHeight);
  const fitScale = Math.min(viewportWidth / safeWidth, viewportHeight / safeHeight);
  return {
    width: Math.max(1, Math.round(safeWidth * fitScale)),
    height: Math.max(1, Math.round(safeHeight * fitScale)),
  };
}

function DrawerLabImageGestureExperimentComponent({
  theme,
  title,
  description,
  openLabel,
  idleLabel,
  onOpen,
}: PreviewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const assetSource = Image.resolveAssetSource(SAMPLE_IMAGE);
  const previewFrameWidth = Math.min(Math.max(windowWidth - 56, 220), 320);
  const previewFrameHeight = Math.round(Math.min(previewFrameWidth * 1.05, 280));
  const previewImageSize = useMemo(
    () =>
      getContainedSize(
        assetSource.width ?? 1,
        assetSource.height ?? 1,
        previewFrameWidth,
        previewFrameHeight
      ),
    [assetSource.height, assetSource.width, previewFrameHeight, previewFrameWidth]
  );

  return (
    <View style={[styles.panel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.viewerFrame, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={openLabel}
      >
        <View
          pointerEvents="none"
          style={[
            styles.imageWrap,
            {
              width: previewImageSize.width,
              height: previewImageSize.height,
            },
          ]}
        >
          <Image source={SAMPLE_IMAGE} style={styles.image} resizeMode="contain" />
        </View>
        <View style={[styles.previewHint, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.previewHintText, { color: theme.primary }]}>{openLabel}</Text>
        </View>
      </Pressable>

      <View style={styles.statusRow}>
        <Text style={[styles.statusPill, { color: theme.primary, backgroundColor: theme.primarySoft }]}>
          {idleLabel}
        </Text>
        <Text style={[styles.zoomText, { color: theme.subtle }]}>{openLabel}</Text>
      </View>
    </View>
  );
}

function DrawerLabImageGestureOverlayComponent({
  visible,
  theme,
  closeLabel,
  resetLabel,
  idleLabel,
  activeLabel,
  onClose,
}: OverlayProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const assetSource = Image.resolveAssetSource(SAMPLE_IMAGE);
  const viewerFrameWidth = Math.max(220, windowWidth - 28);
  const viewerFrameHeight = Math.max(260, windowHeight - insets.top - insets.bottom - 112);
  const viewerImageSize = useMemo(
    () =>
      getContainedSize(
        assetSource.width ?? 1,
        assetSource.height ?? 1,
        viewerFrameWidth,
        viewerFrameHeight
      ),
    [assetSource.height, assetSource.width, viewerFrameHeight, viewerFrameWidth]
  );
  const zoomRef = useRef<ImageZoomRef | null>(null);
  const scaleValue = useSharedValue(1);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [zoomActive, setZoomActive] = useState(false);
  const [lastEvent, setLastEvent] = useState('idle');
  const [interactionCount, setInteractionCount] = useState(0);
  const [pinchCount, setPinchCount] = useState(0);
  const [panCount, setPanCount] = useState(0);
  const [doubleTapCount, setDoubleTapCount] = useState(0);
  const [programmaticCount, setProgrammaticCount] = useState(0);

  const resetDiagnosticState = useCallback(() => {
    setZoomPercent(100);
    setZoomActive(false);
    setLastEvent('idle');
    setInteractionCount(0);
    setPinchCount(0);
    setPanCount(0);
    setDoubleTapCount(0);
    setProgrammaticCount(0);
  }, []);

  const syncZoomState = useCallback((nextScale: number) => {
    const roundedPercent = Math.max(100, Math.round(nextScale * 100));
    setZoomPercent((current) => (current === roundedPercent ? current : roundedPercent));
    setZoomActive((current) => {
      const nextActive = nextScale > 1.01;
      return current === nextActive ? current : nextActive;
    });
  }, []);

  useAnimatedReaction(
    () => scaleValue.value,
    (nextScale, previousScale) => {
      const crossedActiveThreshold =
        (previousScale ?? 1) <= 1.01 ? nextScale > 1.01 : nextScale <= 1.01;
      if (
        previousScale == null ||
        Math.abs(nextScale - previousScale) >= 0.04 ||
        crossedActiveThreshold
      ) {
        runOnJS(syncZoomState)(nextScale);
      }
    },
    [syncZoomState]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    resetDiagnosticState();
  }, [resetDiagnosticState, visible]);

  const resetTransform = useCallback(() => {
    zoomRef.current?.reset();
    syncZoomState(1);
  }, [syncZoomState]);

  const handleInteractionStart = useCallback(() => {
    setLastEvent('interaction');
    setInteractionCount((current) => current + 1);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setLastEvent('interaction-end');
  }, []);

  const handlePinchStart = useCallback(() => {
    setLastEvent('pinch');
    setPinchCount((current) => current + 1);
  }, []);

  const handlePinchEnd = useCallback(() => {
    setLastEvent('pinch-end');
  }, []);

  const handlePanStart = useCallback(() => {
    setLastEvent('pan');
    setPanCount((current) => current + 1);
  }, []);

  const handlePanEnd = useCallback(() => {
    setLastEvent('pan-end');
  }, []);

  const handleDoubleTap = useCallback((zoomType: ZOOM_TYPE) => {
    setLastEvent(zoomType === ZOOM_TYPE.ZOOM_IN ? 'double-in' : 'double-out');
    setDoubleTapCount((current) => current + 1);
  }, []);

  const handleProgrammaticZoomEvent = useCallback((zoomType: ZOOM_TYPE) => {
    setLastEvent(zoomType === ZOOM_TYPE.ZOOM_IN ? 'prog-in' : 'prog-out');
    setProgrammaticCount((current) => current + 1);
  }, []);

  const handleProgrammaticZoom = useCallback(() => {
    if (!zoomRef.current) {
      setLastEvent('ref-missing');
      return;
    }
    setLastEvent('prog-request');
    zoomRef.current.zoom({
      scale: 2,
      x: viewerImageSize.width / 2,
      y: viewerImageSize.height / 2,
    });
  }, [viewerImageSize.height, viewerImageSize.width]);

  const handleClose = useCallback(() => {
    resetTransform();
    onClose();
  }, [onClose, resetTransform]);

  if (!visible) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.overlayRoot} unstable_forceActive>
      <View style={styles.overlayBackdrop} />
      <View style={styles.overlayContent} pointerEvents="box-none">
        <View
          style={[
            styles.overlayTopBar,
            {
              top: Math.max(insets.top + 10, 18),
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.overlayActions}>
            <Pressable
              style={styles.overlayActionButton}
              onPress={handleProgrammaticZoom}
              accessibilityRole="button"
              accessibilityLabel="2x test zoom"
            >
              <Text style={styles.overlayActionText}>2x</Text>
            </Pressable>
            <Pressable
              style={styles.overlayActionButton}
              onPress={resetTransform}
              accessibilityRole="button"
              accessibilityLabel={resetLabel}
            >
              <Text style={styles.overlayActionText}>{resetLabel}</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            hitSlop={12}
          >
            <X size={30} color="#F8FAFC" strokeWidth={2.35} />
          </Pressable>
        </View>

        <View style={styles.overlayCenter}>
          <ImageZoom
            ref={zoomRef}
            source={SAMPLE_IMAGE}
            scale={scaleValue}
            minScale={1}
            maxScale={4}
            doubleTapScale={3}
            isPanEnabled
            isPinchEnabled
            isSingleTapEnabled
            isDoubleTapEnabled
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
            onPinchStart={handlePinchStart}
            onPinchEnd={handlePinchEnd}
            onPanStart={handlePanStart}
            onPanEnd={handlePanEnd}
            onDoubleTap={handleDoubleTap}
            onProgrammaticZoom={handleProgrammaticZoomEvent}
            onSingleTap={handleClose}
            style={[
              styles.viewerImage,
              {
                width: viewerImageSize.width,
                height: viewerImageSize.height,
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <View
          style={[
            styles.overlayFooter,
            {
              bottom: Math.max(insets.bottom + 18, 22),
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.overlayStatusRow}>
            <Text
              style={[
                styles.statusPill,
                styles.overlayStatusPill,
                { color: theme.primary, backgroundColor: theme.primarySoft },
              ]}
            >
              {zoomActive ? activeLabel : idleLabel}
            </Text>
            <Text style={styles.overlayZoomText}>{zoomPercent}%</Text>
          </View>
          <Text style={styles.overlayDebugText}>
            {`Last ${lastEvent} · Int ${interactionCount} · Pinch ${pinchCount} · Pan ${panCount} · Dbl ${doubleTapCount} · Prog ${programmaticCount}`}
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

export const DrawerLabImageGestureExperiment = memo(DrawerLabImageGestureExperimentComponent);
export const DrawerLabImageGestureOverlay = memo(DrawerLabImageGestureOverlayComponent);

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
  },
  description: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  viewerFrame: {
    marginTop: 12,
    height: 280,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  previewHint: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewHintText: {
    fontSize: 11,
    fontWeight: '900',
  },
  statusRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '900',
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '800',
  },
  overlayRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
  },
  overlayContent: {
    flex: 1,
  },
  overlayTopBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  overlayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overlayActionButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  overlayActionText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '900',
  },
  closeButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  viewerImage: {
    alignSelf: 'center',
  },
  overlayFooter: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'flex-start',
    gap: 8,
  },
  overlayStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  overlayStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overlayZoomText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '900',
  },
  overlayDebugText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
  },
});
