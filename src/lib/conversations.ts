import type { ApiProfile, AttachmentRecord, ChatMessage, ChatMessageVariant, ConversationRecord, UiLanguage } from '../types';
import { makeId } from './ids';
import { classifyModel } from './models';

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
  };
}

export function trimTitle(value: string, defaultTitle: string): string {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (!compact) return defaultTitle;
  return compact.length > 36 ? `${compact.slice(0, 36)}...` : compact;
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
  return conversation.messages.flatMap((message) => message.attachments);
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
