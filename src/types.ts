export type AssistantKind = 'codex' | 'cli';

export type AttachmentKind = 'image' | 'file';

export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

export type UiLanguage = 'zh' | 'en';

export type ApiProtocol = 'responses' | 'chatCompletions';

export type ApiProfile = {
  id: string;
  label: string;
  apiProtocol: ApiProtocol;
  baseUrl: string;
  model: string;
  projectId: string;
  organization: string;
  systemPrompt: string;
  reasoningEffort: ReasoningEffort;
  storeResponses: boolean;
};

export type AttachmentRecord = {
  id: string;
  kind: AttachmentKind;
  name: string;
  uri: string;
  mimeType: string;
  size: number;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  attachments: AttachmentRecord[];
  error?: string;
  responseId?: string;
};

export type ConversationRecord = {
  id: string;
  title: string;
  model: string;
  assistantKind: AssistantKind;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  previousResponseId: string | null;
  messages: ChatMessage[];
};

export type PersistedState = {
  activeConversationId: string | null;
  conversations: ConversationRecord[];
  activeProfileId: string;
  profiles: ApiProfile[];
  profile: ApiProfile;
  uiLanguage: UiLanguage;
};

export type PendingAttachment = AttachmentRecord;
