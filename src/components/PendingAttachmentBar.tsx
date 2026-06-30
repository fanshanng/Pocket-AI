import { memo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FileText, X } from 'lucide-react-native';

import type { AppTheme } from '../theme';
import type { PendingAttachment } from '../types';

type Props = {
  attachments: PendingAttachment[];
  theme: AppTheme;
  onOpenAttachment: (attachment: PendingAttachment) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  removeAccessibilityLabel: string;
};

function PendingAttachmentBarComponent({
  attachments,
  theme,
  onOpenAttachment,
  onRemoveAttachment,
  removeAccessibilityLabel,
}: Props) {
  if (attachments.length === 0) {
    return null;
  }

  // Keep attachment state in App.tsx; this rail only renders compact, preview-first attachment chips.
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {attachments.map((attachment) => (
        <Pressable
          key={attachment.id}
          style={[styles.tile, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          onPress={() => onOpenAttachment(attachment)}
        >
          {attachment.kind === 'image' ? (
            <Image source={{ uri: attachment.uri }} style={styles.thumb} />
          ) : (
            <View style={styles.fileTile}>
              <FileText size={24} color={theme.primary} strokeWidth={2.2} />
              <Text style={[styles.fileTileLabel, { color: theme.primary }]} numberOfLines={1}>
                FILE
              </Text>
              <Text style={[styles.fileTileName, { color: theme.subtle }]} numberOfLines={1}>
                {attachment.name}
              </Text>
            </View>
          )}
          <Pressable
            style={styles.removeButton}
            onPress={(event) => {
              event.stopPropagation();
              onRemoveAttachment(attachment.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={removeAccessibilityLabel}
          >
            <X size={12} color="#F8FAFC" strokeWidth={2.8} />
          </Pressable>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export const PendingAttachmentBar = memo(PendingAttachmentBarComponent);

const styles = StyleSheet.create({
  rail: {
    gap: 10,
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 8,
  },
  tile: {
    width: 82,
    height: 82,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  fileTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  fileTileLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  fileTileName: {
    marginTop: 3,
    fontSize: 10,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
});
