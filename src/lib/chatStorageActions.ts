import * as Clipboard from 'expo-clipboard';

import type { ApiProfile, PersistedState } from '../types';
import {
  exportRawChatStorageBackupToUserDirectory,
  exportTextFileToUserDirectory,
  openPrivateLocation,
} from './files';
import { getActiveProfile } from './profiles';
import {
  clearPersistedStateOnly,
  deletePersistedConversationById,
  EMPTY_STATE,
  exportUnreadableConversationRaw,
  getPersistedStateLoadIssues,
  loadPersistedProfileState,
  loadProfileApiKey,
  mergePersistedProfileState,
} from './storage';

export type StorageLocationOpenResult =
  | {
      kind: 'opened';
    }
  | {
      kind: 'copied';
      uri: string;
    };

export async function openStorageLocationWithClipboard(
  locationUri: string
): Promise<StorageLocationOpenResult> {
  const opened = await openPrivateLocation(locationUri);
  if (opened) {
    return { kind: 'opened' };
  }

  await Clipboard.setStringAsync(locationUri).catch(() => undefined);
  return {
    kind: 'copied',
    uri: locationUri,
  };
}

export type UnreadableConversationExportResult =
  | {
      kind: 'conversation';
      fileName: string;
    }
  | {
      kind: 'raw-backup';
      folderName: string;
    }
  | {
      kind: 'unavailable';
    };

export async function exportUnreadableConversationBackup(
  conversationId: string
): Promise<UnreadableConversationExportResult> {
  const exported = await exportUnreadableConversationRaw(conversationId).catch(() => null);
  if (exported) {
    const file = await exportTextFileToUserDirectory({
      suggestedBaseName: `pocket-ai-unreadable-session-${conversationId}`,
      extension: 'json',
      mimeType: 'application/json',
      content: JSON.stringify(exported, null, 2),
    });

    if (file) {
      return {
        kind: 'conversation',
        fileName: file.fileName,
      };
    }
  }

  const rawBackup = await exportRawChatStorageBackupToUserDirectory({
    manifestLines: [
      `Triggered while exporting unreadable session: ${conversationId}`,
      'Single-record export failed, so the app exported the raw AsyncStorage database backup instead.',
    ],
  }).catch(() => null);

  if (rawBackup) {
    return {
      kind: 'raw-backup',
      folderName: rawBackup.folderName,
    };
  }

  return {
    kind: 'unavailable',
  };
}

export async function deleteUnreadableConversationRecord(conversationId: string): Promise<string[]> {
  await deletePersistedConversationById(conversationId);
  return getPersistedStateLoadIssues().unreadableConversationIds;
}

export type ClearedChatRecoveryState = {
  persisted: PersistedState;
  activeProfile: ApiProfile;
  activeProfileKey: string;
};

// Keep the post-clear recovery path shared so routine cleanup and startup recovery
// preserve the same profile/config restoration behavior.
export async function clearChatsAndRecoverProfileState(): Promise<ClearedChatRecoveryState> {
  await clearPersistedStateOnly();
  const profileState = await loadPersistedProfileState();
  const recoveredState = mergePersistedProfileState(EMPTY_STATE, profileState);
  const activeProfile = getActiveProfile(recoveredState);
  const activeProfileKey = await loadProfileApiKey(activeProfile.id).catch(() => '');
  return {
    persisted: recoveredState,
    activeProfile,
    activeProfileKey,
  };
}
