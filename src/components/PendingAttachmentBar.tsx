import { memo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';

import type { AppTheme } from '../theme';
import type { PendingAttachment } from '../types';

type Props = {
  attachments: PendingAttachment[];
  theme: AppTheme;
  formatMeta: (attachment: PendingAttachment) => string;
  onOpenAttachment: (attachment: PendingAttachment) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  removeAccessibilityLabel: string;
};

function PendingAttachmentBarComponent({
  attachments,
  theme,
  formatMeta,
  onOpenAttachment,
  onRemoveAttachment,
  removeAccessibilityLabel,
}: Props) {
  if (attachments.length === 0) {
    return null;
  }

  // Keep attachment state and cleanup in App.tsx; this component is only a reusable composer preview rail.
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {attachments.map((attachment) => (
        <Pressable
          key={attachment.id}
          style={[styles.chip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          onPress={() => onOpenAttachment(attachment)}
        >
          {attachment.kind === 'image' && (
            <Image source={{ uri: attachment.uri }} style={styles.thumb} />
          )}
          <View style={styles.body}>
            <Text style={[styles.type, { color: theme.primary }]} numberOfLines={1}>
              {formatMeta(attachment)}
            </Text>
            <Text style={[styles.name, { color: theme.subtle }]} numberOfLines={1}>
              {attachment.name}
            </Text>
          </View>
          <Pressable
            style={[styles.removeButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            onPress={(event) => {
              event.stopPropagation();
              onRemoveAttachment(attachment.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={removeAccessibilityLabel}
          >
            <X size={13} color={theme.muted} strokeWidth={2.5} />
          </Pressable>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export const PendingAttachmentBar = memo(PendingAttachmentBarComponent);

const styles = StyleSheet.create({
  rail: {
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 8,
  },
  chip: {
    width: 214,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 13,
    borderWidth: 1,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  type: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
  },
  name: {
    fontSize: 13,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
