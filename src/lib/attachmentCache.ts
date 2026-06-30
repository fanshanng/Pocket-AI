import type { ConversationRecord, PendingAttachment } from '../types';
import { getAllConversationAttachments } from './conversations';
import { getAttachmentCacheStats, type AttachmentCacheStats } from './files';

export function collectAttachmentCacheReferences(
  conversations: ConversationRecord[],
  pendingAttachments: PendingAttachment[]
) {
  return [
    ...getAllConversationAttachments(conversations),
    ...pendingAttachments,
  ];
}

export async function loadAttachmentCacheStats(
  conversations: ConversationRecord[],
  pendingAttachments: PendingAttachment[]
): Promise<AttachmentCacheStats> {
  return getAttachmentCacheStats(collectAttachmentCacheReferences(conversations, pendingAttachments));
}
