import { memo, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { X } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AttachmentRecord } from '../types';

type Props = {
  attachment: AttachmentRecord | null;
  closeLabel: string;
  onClose: () => void;
};

function getContainedImageSize(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const safeWidth = Math.max(1, imageWidth);
  const safeHeight = Math.max(1, imageHeight);
  const fitScale = Math.min(viewportWidth / safeWidth, viewportHeight / safeHeight);
  return {
    width: Math.max(1, Math.round(safeWidth * fitScale)),
    height: Math.max(1, Math.round(safeHeight * fitScale)),
  };
}

function ImageAttachmentViewerComponent({ attachment, closeLabel, onClose }: Props) {
  const visible = !!attachment && attachment.kind === 'image';
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (!visible || !attachment) {
      setImageSize({ width: 1, height: 1 });
      return;
    }

    let cancelled = false;
    setImageSize({ width: 1, height: 1 });
    Image.getSize(
      attachment.uri,
      (width, height) => {
        if (!cancelled && width > 0 && height > 0) {
          setImageSize({ width, height });
        }
      },
      () => {
        if (!cancelled) {
          setImageSize({ width: 1, height: 1 });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [attachment, visible]);

  const fittedImageSize = useMemo(
    () =>
      getContainedImageSize(
        imageSize.width,
        imageSize.height,
        Math.max(220, windowWidth - 28),
        Math.max(260, windowHeight - insets.top - insets.bottom - 112)
      ),
    [imageSize.height, imageSize.width, insets.bottom, insets.top, windowHeight, windowWidth]
  );

  if (!visible || !attachment) {
    return null;
  }

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.viewerRoot} unstable_forceActive>
        <View style={styles.viewerBackdrop} />
        <View style={styles.viewerSurface}>
          <ImageZoom
            key={`${attachment.uri}-viewer`}
            source={{ uri: attachment.uri }}
            minScale={1}
            maxScale={4}
            doubleTapScale={3}
            isPanEnabled
            isPinchEnabled
            isDoubleTapEnabled
            style={[
              styles.image,
              {
                width: fittedImageSize.width,
                height: fittedImageSize.height,
              },
            ]}
            resizeMode="contain"
          />
        </View>
        <Pressable
          style={[
            styles.closeButton,
            {
              top: Math.max(insets.top + 10, 18),
            },
          ]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          hitSlop={12}
        >
          <X size={30} color="#F8FAFC" strokeWidth={2.35} />
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

export const ImageAttachmentViewer = memo(ImageAttachmentViewerComponent);

const styles = StyleSheet.create({
  viewerRoot: {
    flex: 1,
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
  },
  viewerSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    zIndex: 2,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
