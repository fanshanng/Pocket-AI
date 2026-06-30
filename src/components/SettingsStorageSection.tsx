import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '../theme';

type StorageCopy = {
  localStorageTitle: string;
  openChatRecordsLocation: string;
  localStorageDescription: string;
  openLocationWithExternalApp: string;
  attachmentCacheTitle: string;
  openAttachmentCacheLocation: string;
  refreshAttachmentCacheStats: string;
  refreshingAttachmentCacheStats: string;
  attachmentCacheDescription: string;
  clearAttachmentCache: string;
  clearAttachmentCacheHint: string;
  unreadableSessionsRecoveryTitle: string;
  unreadableSessionsRecoveryDescription: (count: number) => string;
  unreadableSessionsRecoveryHint: string;
  unreadableSessionLabel: (index: number, conversationId: string) => string;
  exportUnreadableSession: string;
  deleteUnreadableSession: string;
  clearLocalData: string;
  clearLocalHint: string;
};

type Props = {
  theme: AppTheme;
  copy: StorageCopy;
  attachmentCacheSummary: string;
  refreshingAttachmentCacheStats: boolean;
  savingProfile: boolean;
  unreadableConversationIds: string[];
  onOpenChatRecordsLocation: () => void;
  onOpenAttachmentCacheLocation: () => void;
  onRefreshAttachmentCacheStats: () => void;
  onConfirmClearAttachmentCache: () => void;
  onExportUnreadableConversation: (conversationId: string) => void;
  onConfirmDeleteUnreadableConversation: (conversationId: string) => void;
  onConfirmClearLocalData: () => void;
};

function SettingsStorageSectionComponent({
  theme,
  copy,
  attachmentCacheSummary,
  refreshingAttachmentCacheStats,
  savingProfile,
  unreadableConversationIds,
  onOpenChatRecordsLocation,
  onOpenAttachmentCacheLocation,
  onRefreshAttachmentCacheStats,
  onConfirmClearAttachmentCache,
  onExportUnreadableConversation,
  onConfirmDeleteUnreadableConversation,
  onConfirmClearLocalData,
}: Props) {
  return (
    <>
      <View style={[styles.infoPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <View style={styles.infoPanelHeaderRow}>
          <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.localStorageTitle}</Text>
          <Pressable
            style={[styles.inlineUtilityButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={onOpenChatRecordsLocation}
          >
            <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
              {copy.openChatRecordsLocation}
            </Text>
          </Pressable>
        </View>
        <Text style={[styles.infoPanelText, { color: theme.muted }]}>{copy.localStorageDescription}</Text>
        <Text style={[styles.inlineHint, { color: theme.muted }]}>{copy.openLocationWithExternalApp}</Text>
      </View>

      <View style={[styles.infoPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <View style={styles.infoPanelHeaderRow}>
          <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.attachmentCacheTitle}</Text>
          <View style={styles.storageActionRow}>
            <Pressable
              style={[styles.inlineUtilityButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={onOpenAttachmentCacheLocation}
            >
              <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
                {copy.openAttachmentCacheLocation}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.inlineUtilityButton,
                styles.cacheRefreshButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                refreshingAttachmentCacheStats && styles.disabledAction,
              ]}
              onPress={onRefreshAttachmentCacheStats}
              disabled={refreshingAttachmentCacheStats}
            >
              <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
                {refreshingAttachmentCacheStats
                  ? copy.refreshingAttachmentCacheStats
                  : copy.refreshAttachmentCacheStats}
              </Text>
            </Pressable>
          </View>
        </View>
        <Text style={[styles.infoPanelText, { color: theme.muted }]}>{copy.attachmentCacheDescription}</Text>
        <Text style={[styles.cacheStatsText, { color: theme.text }]}>{attachmentCacheSummary}</Text>
        <Pressable style={styles.dangerButton} onPress={onConfirmClearAttachmentCache} disabled={savingProfile}>
          <Text style={styles.dangerButtonText}>{copy.clearAttachmentCache}</Text>
        </Pressable>
        <Text style={[styles.inlineHint, { color: theme.muted }]}>{copy.clearAttachmentCacheHint}</Text>
      </View>

      {unreadableConversationIds.length > 0 && (
        <View style={[styles.infoPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.unreadableSessionsRecoveryTitle}</Text>
          <Text style={[styles.infoPanelText, { color: theme.muted }]}>
            {copy.unreadableSessionsRecoveryDescription(unreadableConversationIds.length)}
          </Text>
          <Text style={[styles.inlineHint, { color: theme.muted }]}>{copy.unreadableSessionsRecoveryHint}</Text>
          {unreadableConversationIds.map((conversationId, index) => (
            <View key={conversationId} style={styles.unreadableRecoveryRow}>
              <Text style={[styles.cacheStatsText, { color: theme.text }]}>
                {copy.unreadableSessionLabel(index, conversationId)}
              </Text>
              <View style={styles.storageActionRow}>
                <Pressable
                  style={[styles.inlineUtilityButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => onExportUnreadableConversation(conversationId)}
                >
                  <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
                    {copy.exportUnreadableSession}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.inlineUtilityButton,
                    styles.unreadableDeleteButton,
                    { borderColor: theme.border },
                  ]}
                  onPress={() => onConfirmDeleteUnreadableConversation(conversationId)}
                >
                  <Text style={styles.unreadableDeleteButtonText}>{copy.deleteUnreadableSession}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.dangerButton} onPress={onConfirmClearLocalData} disabled={savingProfile}>
        <Text style={styles.dangerButtonText}>{copy.clearLocalData}</Text>
      </Pressable>
      <Text style={[styles.inlineHint, { color: theme.muted }]}>{copy.clearLocalHint}</Text>
    </>
  );
}

export const SettingsStorageSection = memo(SettingsStorageSectionComponent);

const styles = StyleSheet.create({
  infoPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  infoPanelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoPanelTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  infoPanelText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  inlineHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  inlineUtilityButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  inlineUtilityButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  storageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  cacheRefreshButton: {
    marginTop: 0,
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cacheStatsText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  unreadableRecoveryRow: {
    gap: 10,
    marginTop: 14,
  },
  dangerButton: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dangerButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  unreadableDeleteButton: {
    backgroundColor: '#fff1f2',
  },
  unreadableDeleteButtonText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledAction: {
    opacity: 0.45,
  },
});
