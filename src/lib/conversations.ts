import type {
  ApiProfile,
  AttachmentRecord,
  ChatMessage,
  ChatMessageVariant,
  ConversationRecord,
  UiLanguage,
} from '../types';
import { makeId } from './ids';
import { classifyModel } from './models';

export const CONVERSATION_LENGTH_WARNING_MESSAGE_COUNT = 120;
export const CONVERSATION_LENGTH_BLOCK_MESSAGE_COUNT = 160;
export const CONVERSATION_LENGTH_WARNING_BYTES = 320 * 1024;
export const CONVERSATION_LENGTH_BLOCK_BYTES = 400 * 1024;
export const CONVERSATION_LENGTH_ASSISTANT_RESERVE_BYTES = 24 * 1024;

export type ConversationLengthGuardLevel = 'safe' | 'warning' | 'blocked';

export type ConversationLengthGuard = {
  level: ConversationLengthGuardLevel;
  messageCount: number;
  storageBytes: number;
  remainingMessages: number;
  remainingBytes: number;
  warningMessageCount: number;
  blockMessageCount: number;
  warningBytes: number;
  blockBytes: number;
  hitMessageThreshold: boolean;
  hitStorageThreshold: boolean;
};

export function createConversation(profile: ApiProfile, defaultTitle: string): ConversationRecord {
  const now = new Date().toISOString();
  return {
    id: makeId('conversation'),
    title: defaultTitle,
    model: profile.model,
    assistantKind: classifyModel(profile.model),
    createdAt: now,
    updatedAt: now,
    pinned: false,
    previousResponseId: null,
    messages: [],
    lengthWarningAcknowledgedAt: null,
  };
}

export function trimTitle(value: string, defaultTitle: string): string {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (!compact) return defaultTitle;
  return compact.length > 36 ? `${compact.slice(0, 36)}...` : compact;
}

export function estimateUtf8Bytes(value: string): number {
  let total = 0;
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) {
      total += 1;
    } else if (codePoint <= 0x7ff) {
      total += 2;
    } else if (codePoint <= 0xffff) {
      total += 3;
    } else {
      total += 4;
    }
  }
  return total;
}

export function estimateConversationStorageBytes(conversation: ConversationRecord): number {
  return estimateUtf8Bytes(JSON.stringify(conversation));
}

export function estimateDraftTurnStorageBytes(
  text: string,
  attachments: AttachmentRecord[],
  assistantReserveBytes = CONVERSATION_LENGTH_ASSISTANT_RESERVE_BYTES
): number {
  const draftEnvelope = {
    role: 'user',
    text,
    attachments,
  };
  return estimateUtf8Bytes(JSON.stringify(draftEnvelope)) + assistantReserveBytes;
}

export function getConversationLengthGuard(
  conversation: ConversationRecord,
  options?: {
    extraMessages?: number;
    extraBytes?: number;
  }
): ConversationLengthGuard {
  const messageCount = conversation.messages.length + Math.max(0, options?.extraMessages ?? 0);
  const storageBytes = estimateConversationStorageBytes(conversation) + Math.max(0, options?.extraBytes ?? 0);
  const hitBlockedMessageThreshold = messageCount >= CONVERSATION_LENGTH_BLOCK_MESSAGE_COUNT;
  const hitBlockedStorageThreshold = storageBytes >= CONVERSATION_LENGTH_BLOCK_BYTES;
  const hitWarningMessageThreshold = messageCount >= CONVERSATION_LENGTH_WARNING_MESSAGE_COUNT;
  const hitWarningStorageThreshold = storageBytes >= CONVERSATION_LENGTH_WARNING_BYTES;
  const level: ConversationLengthGuardLevel =
    hitBlockedMessageThreshold || hitBlockedStorageThreshold
      ? 'blocked'
      : hitWarningMessageThreshold || hitWarningStorageThreshold
        ? 'warning'
        : 'safe';

  return {
    level,
    messageCount,
    storageBytes,
    remainingMessages: Math.max(0, CONVERSATION_LENGTH_BLOCK_MESSAGE_COUNT - messageCount),
    remainingBytes: Math.max(0, CONVERSATION_LENGTH_BLOCK_BYTES - storageBytes),
    warningMessageCount: CONVERSATION_LENGTH_WARNING_MESSAGE_COUNT,
    blockMessageCount: CONVERSATION_LENGTH_BLOCK_MESSAGE_COUNT,
    warningBytes: CONVERSATION_LENGTH_WARNING_BYTES,
    blockBytes: CONVERSATION_LENGTH_BLOCK_BYTES,
    hitMessageThreshold:
      level === 'blocked' ? hitBlockedMessageThreshold : hitWarningMessageThreshold,
    hitStorageThreshold:
      level === 'blocked' ? hitBlockedStorageThreshold : hitWarningStorageThreshold,
  };
}

export function upsertConversation(
  conversations: ConversationRecord[],
  conversation: ConversationRecord
): ConversationRecord[] {
  const next = conversations.filter((item) => item.id !== conversation.id);
  return [conversation, ...next];
}

export function sortConversationsForList(conversations: ConversationRecord[]): ConversationRecord[] {
  return [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function getConversationAttachments(conversation: ConversationRecord): AttachmentRecord[] {
  return conversation.messages.flatMap((message) => [
    ...message.attachments,
    ...(message.variants?.flatMap((variant) => variant.attachments) ?? []),
  ]);
}

export function getAllConversationAttachments(conversations: ConversationRecord[]): AttachmentRecord[] {
  return conversations.flatMap(getConversationAttachments);
}

export function normalizeMessageVariants(message: ChatMessage, assistantMessage?: ChatMessage): ChatMessageVariant[] {
  const existing = message.variants && message.variants.length > 0
    ? message.variants
    : [
        {
          id: makeId('variant'),
          text: message.text,
          createdAt: message.createdAt,
          attachments: message.attachments,
          assistantMessageId: assistantMessage?.id,
          assistantText: assistantMessage?.text,
          assistantResponseId: assistantMessage?.responseId,
          assistantError: assistantMessage?.error,
        },
      ];

  const activeIndex = Math.min(Math.max(message.activeVariantIndex ?? 0, 0), existing.length - 1);
  const normalized = [...existing];
  normalized[activeIndex] = {
    ...normalized[activeIndex],
    text: message.text,
    createdAt: message.createdAt,
    attachments: message.attachments,
    assistantMessageId: assistantMessage?.id ?? normalized[activeIndex].assistantMessageId,
    assistantText: assistantMessage?.text ?? normalized[activeIndex].assistantText,
    assistantResponseId: assistantMessage?.responseId ?? normalized[activeIndex].assistantResponseId,
    assistantError: assistantMessage?.error ?? normalized[activeIndex].assistantError,
  };
  return normalized;
}

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

export function conversationMatchesQuery(conversation: ConversationRecord, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchable = [
    conversation.title,
    conversation.model,
    ...conversation.messages.map((message) => message.text),
    ...conversation.messages.flatMap((message) => message.attachments.map((attachment) => attachment.name)),
  ]
    .join('\n')
    .toLowerCase();

  return searchable.includes(query);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function formatRelativeTime(value: string, language: UiLanguage): string {
  const date = new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) {
    return language === 'zh' ? '刚刚' : 'Just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return language === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return language === 'zh' ? `${hours}小时前` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return language === 'zh' ? `${days}天前` : `${days}d ago`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatConversationMarkdown(conversation: ConversationRecord): string {
  const lines = [
    `# ${conversation.title}`,
    '',
    `- Model: ${conversation.model}`,
    `- Created: ${formatDateTime(conversation.createdAt)}`,
    `- Updated: ${formatDateTime(conversation.updatedAt)}`,
    '',
  ];

  for (const message of conversation.messages) {
    lines.push(`## ${message.role === 'user' ? 'User' : 'Assistant'} - ${formatDateTime(message.createdAt)}`);
    lines.push('');
    lines.push(message.text.trim() || '(empty)');
    if (message.error) {
      lines.push('');
      lines.push(`Error: ${message.error}`);
    }
    if (message.attachments.length > 0) {
      lines.push('');
      lines.push('Attachments:');
      for (const attachment of message.attachments) {
        lines.push(`- ${attachment.kind}: ${attachment.name}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatAttachmentForExport(attachment: AttachmentRecord) {
  // Export only portable metadata. Local file URIs stay on-device and should
  // never be copied into JSON/Markdown backups or GitHub release notes.
  return {
    id: attachment.id,
    kind: attachment.kind,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
  };
}

function formatMessageForJsonExport(message: ChatMessage) {
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    createdAt: message.createdAt,
    error: message.error,
    attachments: message.attachments.map(formatAttachmentForExport),
    variants: message.variants?.map((variant) => ({
      id: variant.id,
      text: variant.text,
      createdAt: variant.createdAt,
      attachments: variant.attachments.map(formatAttachmentForExport),
      assistantMessageId: variant.assistantMessageId,
      assistantText: variant.assistantText,
      assistantError: variant.assistantError,
    })),
    activeVariantIndex: message.activeVariantIndex,
  };
}

function formatConversationForJsonExport(conversation: ConversationRecord) {
  // Keep provider routing and local response-chain state out of backups; API
  // profiles and keys are managed through the separate settings storage path.
  return {
    id: conversation.id,
    title: conversation.title,
    model: conversation.model,
    assistantKind: conversation.assistantKind,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    pinned: conversation.pinned,
    messages: conversation.messages.map(formatMessageForJsonExport),
  };
}

export function formatConversationsJson(conversations: ConversationRecord[]): string {
  return JSON.stringify(
    {
      // Bump this only when the exported JSON shape changes and import/migration
      // code knows how to read both old and new versions.
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      source: 'Pocket AI',
      conversations: conversations.map(formatConversationForJsonExport),
    },
    null,
    2
  );
}

export function formatConversationJson(conversation: ConversationRecord): string {
  return formatConversationsJson([conversation]);
}
