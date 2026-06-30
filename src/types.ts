export type AssistantKind = 'codex' | 'cli';

export type AttachmentKind = 'image' | 'file';

export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

export type UiLanguage = 'zh' | 'en';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemePreset = 'classic' | 'graphite' | 'sunset' | 'forest' | 'rose';
export type ChatBackgroundPreset = 'plain' | 'grid' | 'bands';
export type DrawerOpenGestureMode = 'fullscreen' | 'edge';

export type InteractionSettings = {
  drawerOpenGestureMode: DrawerOpenGestureMode;
  drawerEdgeWidthPx: number;
};

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
  webSearchEnabled: boolean;
  cachedModels: string[];
  cachedReasoningEfforts: ReasoningEffort[];
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

export type ChatMessageVariant = {
  id: string;
  text: string;
  createdAt: string;
  attachments: AttachmentRecord[];
  assistantMessageId?: string;
  assistantText?: string;
  assistantResponseId?: string;
  assistantError?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  attachments: AttachmentRecord[];
  error?: string;
  responseId?: string;
  variants?: ChatMessageVariant[];
  activeVariantIndex?: number;
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
  lengthWarningAcknowledgedAt?: string | null;
};

export type PersistedState = {
  activeConversationId: string | null;
  conversations: ConversationRecord[];
  activeProfileId: string;
  profiles: ApiProfile[];
  profile: ApiProfile;
  uiLanguage: UiLanguage;
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  chatBackgroundPreset: ChatBackgroundPreset;
  chatBackgroundImageUri: string | null;
  chatBackgroundImageOpacity: number;
  chatBubbleOpacity: number;
  interactionSettings: InteractionSettings;
};

export type PendingAttachment = AttachmentRecord;
