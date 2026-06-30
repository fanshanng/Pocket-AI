import type { ConversationRecord } from '../types';
import { formatConversationMarkdown, formatConversationsJson, trimTitle } from './conversations';
import { exportTextFileToUserDirectory, type ExportedUserFile } from './files';

export type ConversationExportFormat = 'markdown' | 'json';

export function getConversationExportContent(
  conversations: ConversationRecord[],
  format: ConversationExportFormat
): string {
  return format === 'json'
    ? formatConversationsJson(conversations)
    : conversations.map(formatConversationMarkdown).join('\n\n---\n\n');
}

export function getConversationExportBaseName(
  conversations: ConversationRecord[],
  format: ConversationExportFormat,
  defaultTitle: string
): string {
  if (conversations.length === 1) {
    const conversation = conversations[0];
    return `${trimTitle(conversation.title, defaultTitle)}-${format}`;
  }

  return `pocket-ai-sessions-${conversations.length}-${format}`;
}

export async function exportConversationsToUserDirectory(input: {
  conversations: ConversationRecord[];
  format: ConversationExportFormat;
  defaultTitle: string;
}): Promise<ExportedUserFile | null> {
  const { conversations, format, defaultTitle } = input;
  return exportTextFileToUserDirectory({
    suggestedBaseName: getConversationExportBaseName(conversations, format, defaultTitle),
    extension: format === 'json' ? 'json' : 'md',
    mimeType: format === 'json' ? 'application/json' : 'text/markdown',
    content: getConversationExportContent(conversations, format),
  });
}
