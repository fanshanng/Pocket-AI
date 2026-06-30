import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';

import type { ApiProfile, ConversationRecord, PersistedState, ThemeMode } from '../types';
import { DEFAULT_LANGUAGE, DEFAULT_PROFILE } from './models';
import {
  DEFAULT_CHAT_BUBBLE_OPACITY,
  DEFAULT_CHAT_BACKGROUND_IMAGE_OPACITY,
  DEFAULT_CHAT_BACKGROUND_PRESET,
  DEFAULT_THEME_PRESET,
  normalizeChatBubbleOpacity,
  normalizeChatBackgroundImageOpacity,
  normalizeChatBackgroundPreset,
  normalizeThemePreset,
} from '../theme';
import { DEFAULT_INTERACTION_SETTINGS, normalizeInteractionSettings } from './interactionSettings';

const STATE_KEY = 'ai-chat-pocket.state.v1';
const PROFILE_STATE_KEY = 'ai-chat-pocket.profile-state.v1';
const API_KEY_KEY = 'ai-chat-pocket.api-key.v1';
const API_KEY_PREFIX = 'ai-chat-pocket.api-key.profile.';
const STATE_ENCRYPTION_KEY_KEY = 'ai-chat-pocket.state-encryption-key.v1';
const CONVERSATION_INDEX_KEY = 'ai-chat-pocket.conversation-index.v1';
const CONVERSATION_KEY_PREFIX = 'ai-chat-pocket.conversation.v1.';

export type PersistedStateLoadIssues = {
  unreadableConversationIds: string[];
};

export type UnreadableConversationExport = {
  conversationId: string;
  storageKey: string;
  exportedAt: string;
  rawValue: string;
};

type EncryptedStateEnvelope = {
  kind: 'encrypted-state-v1';
  nonce: string;
  ciphertext: string;
};

export const EMPTY_STATE: PersistedState = {
  activeConversationId: null,
  conversations: [],
  activeProfileId: DEFAULT_PROFILE.id,
  profiles: [DEFAULT_PROFILE],
  profile: DEFAULT_PROFILE,
  uiLanguage: DEFAULT_LANGUAGE,
  themeMode: 'system',
  themePreset: DEFAULT_THEME_PRESET,
  chatBackgroundPreset: DEFAULT_CHAT_BACKGROUND_PRESET,
  chatBackgroundImageUri: null,
  chatBackgroundImageOpacity: DEFAULT_CHAT_BACKGROUND_IMAGE_OPACITY,
  chatBubbleOpacity: DEFAULT_CHAT_BUBBLE_OPACITY,
  interactionSettings: DEFAULT_INTERACTION_SETTINGS,
};

type PersistedProfileState = Pick<PersistedState, 'activeProfileId' | 'profiles' | 'profile'>;
type PersistedConversationIndex = Pick<
  PersistedState,
  | 'activeConversationId'
  | 'uiLanguage'
  | 'themeMode'
  | 'themePreset'
  | 'chatBackgroundPreset'
  | 'chatBackgroundImageUri'
  | 'chatBackgroundImageOpacity'
  | 'chatBubbleOpacity'
  | 'interactionSettings'
> & {
  conversationIds: string[];
};

const EMPTY_LOAD_ISSUES: PersistedStateLoadIssues = {
  unreadableConversationIds: [],
};

let lastPersistedStateLoadIssues: PersistedStateLoadIssues = EMPTY_LOAD_ISSUES;
let protectedConversationIds = new Set<string>();

function rememberLoadIssues(unreadableConversationIds: string[]): void {
  const normalizedIds = [...new Set(unreadableConversationIds)];
  lastPersistedStateLoadIssues = {
    unreadableConversationIds: normalizedIds,
  };
  protectedConversationIds = new Set(normalizedIds);
}

export function consumePersistedStateLoadIssues(): PersistedStateLoadIssues {
  const issues = lastPersistedStateLoadIssues;
  lastPersistedStateLoadIssues = EMPTY_LOAD_ISSUES;
  return issues;
}

export function getPersistedStateLoadIssues(): PersistedStateLoadIssues {
  return lastPersistedStateLoadIssues;
}

function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function normalizeOptionalLocalUri(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeProfile(profile: Partial<ApiProfile> | undefined, fallbackId = DEFAULT_PROFILE.id): ApiProfile {
  const id = profile?.id?.trim() || fallbackId;
  const model = profile?.model?.trim() || DEFAULT_PROFILE.model;
  const reasoningEffort = profile?.reasoningEffort ?? DEFAULT_PROFILE.reasoningEffort;
  const webSearchEnabled = profile?.webSearchEnabled ?? DEFAULT_PROFILE.webSearchEnabled;
  return {
    ...DEFAULT_PROFILE,
    ...(profile ?? {}),
    id,
    model,
    reasoningEffort,
    webSearchEnabled,
    cachedModels: Array.isArray(profile?.cachedModels) && profile.cachedModels.length > 0
      ? profile.cachedModels.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [model],
    cachedReasoningEfforts:
      Array.isArray(profile?.cachedReasoningEfforts) && profile.cachedReasoningEfforts.length > 0
        ? profile.cachedReasoningEfforts
        : [reasoningEffort],
  };
}

function normalizeConversation(conversation: Partial<ConversationRecord>): ConversationRecord | null {
  if (!conversation.id || !conversation.createdAt || !conversation.updatedAt || !Array.isArray(conversation.messages)) {
    return null;
  }

  return {
    id: conversation.id,
    title: conversation.title?.trim() || 'New session',
    model: conversation.model?.trim() || DEFAULT_PROFILE.model,
    assistantKind: conversation.assistantKind ?? 'cli',
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    pinned: conversation.pinned ?? false,
    previousResponseId: conversation.previousResponseId ?? null,
    messages: conversation.messages,
    lengthWarningAcknowledgedAt:
      typeof conversation.lengthWarningAcknowledgedAt === 'string' && conversation.lengthWarningAcknowledgedAt.trim().length > 0
        ? conversation.lengthWarningAcknowledgedAt
        : null,
  };
}

function normalizePersistedState(parsed: Partial<PersistedState>): PersistedState {
  const legacyProfile = normalizeProfile(parsed.profile, DEFAULT_PROFILE.id);
  const profiles =
    parsed.profiles && parsed.profiles.length > 0
      ? parsed.profiles.map((profile, index) => normalizeProfile(profile, index === 0 ? legacyProfile.id : `profile-${index}`))
      : [legacyProfile];
  const activeProfileId =
    parsed.activeProfileId && profiles.some((profile) => profile.id === parsed.activeProfileId)
      ? parsed.activeProfileId
      : profiles[0].id;
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];

  return {
    activeConversationId: parsed.activeConversationId ?? null,
    conversations: (parsed.conversations ?? [])
      .map((conversation) => normalizeConversation(conversation))
      .filter((conversation): conversation is ConversationRecord => conversation !== null),
    activeProfileId,
    profiles,
    profile: activeProfile,
    uiLanguage: parsed.uiLanguage ?? DEFAULT_LANGUAGE,
    themeMode: normalizeThemeMode(parsed.themeMode),
    themePreset: normalizeThemePreset(parsed.themePreset),
    chatBackgroundPreset: normalizeChatBackgroundPreset(parsed.chatBackgroundPreset),
    chatBackgroundImageUri: normalizeOptionalLocalUri(parsed.chatBackgroundImageUri),
    chatBackgroundImageOpacity: normalizeChatBackgroundImageOpacity(parsed.chatBackgroundImageOpacity),
    chatBubbleOpacity: normalizeChatBubbleOpacity(parsed.chatBubbleOpacity),
    interactionSettings: normalizeInteractionSettings(parsed.interactionSettings),
  };
}

function isEncryptedStateEnvelope(value: unknown): value is EncryptedStateEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as EncryptedStateEnvelope).kind === 'encrypted-state-v1' &&
    typeof (value as EncryptedStateEnvelope).nonce === 'string' &&
    typeof (value as EncryptedStateEnvelope).ciphertext === 'string'
  );
}

async function getStoredStateKey(): Promise<Uint8Array | null> {
  const raw = await SecureStore.getItemAsync(STATE_ENCRYPTION_KEY_KEY);
  if (!raw) {
    return null;
  }

  try {
    return decodeBase64(raw);
  } catch {
    return null;
  }
}

async function getOrCreateStateKey(): Promise<Uint8Array> {
  const existing = await getStoredStateKey();
  if (existing) {
    return existing;
  }

  const key = await Crypto.getRandomBytesAsync(nacl.secretbox.keyLength);
  await SecureStore.setItemAsync(STATE_ENCRYPTION_KEY_KEY, encodeBase64(key));
  return key;
}

async function decryptPersistedState(raw: string): Promise<PersistedState> {
  const parsed = JSON.parse(raw) as EncryptedStateEnvelope | PersistedState;

  if (!isEncryptedStateEnvelope(parsed)) {
    return normalizePersistedState(parsed as PersistedState);
  }

  const key = await getStoredStateKey();
  if (!key) {
    return EMPTY_STATE;
  }

  try {
    const plaintext = nacl.secretbox.open(
      decodeBase64(parsed.ciphertext),
      decodeBase64(parsed.nonce),
      key
    );

    if (!plaintext) {
      return EMPTY_STATE;
    }

    return normalizePersistedState(JSON.parse(encodeUTF8(plaintext)) as PersistedState);
  } catch {
    return EMPTY_STATE;
  }
}

async function decryptPersistedConversationIndex(raw: string): Promise<PersistedConversationIndex | null> {
  const parsed = JSON.parse(raw) as EncryptedStateEnvelope | PersistedConversationIndex;

  if (!isEncryptedStateEnvelope(parsed)) {
    const plain = parsed as Partial<PersistedConversationIndex> & Partial<PersistedState>;
    const normalized = normalizePersistedState({
      ...EMPTY_STATE,
      activeConversationId: plain.activeConversationId ?? null,
      conversations: Array.isArray(plain.conversations) ? plain.conversations : [],
      uiLanguage: plain.uiLanguage,
      themeMode: plain.themeMode,
      themePreset: plain.themePreset,
      chatBackgroundPreset: plain.chatBackgroundPreset,
      chatBackgroundImageUri: plain.chatBackgroundImageUri,
      chatBackgroundImageOpacity: plain.chatBackgroundImageOpacity,
      chatBubbleOpacity: plain.chatBubbleOpacity,
      interactionSettings: plain.interactionSettings,
    });
    return {
      activeConversationId: normalized.activeConversationId,
      conversationIds:
        Array.isArray(plain.conversationIds)
          ? plain.conversationIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          : normalized.conversations.map((conversation) => conversation.id),
      uiLanguage: normalized.uiLanguage,
      themeMode: normalized.themeMode,
      themePreset: normalized.themePreset,
      chatBackgroundPreset: normalized.chatBackgroundPreset,
      chatBackgroundImageUri: normalized.chatBackgroundImageUri,
      chatBackgroundImageOpacity: normalized.chatBackgroundImageOpacity,
      chatBubbleOpacity: normalized.chatBubbleOpacity,
      interactionSettings: normalized.interactionSettings,
    };
  }

  const key = await getStoredStateKey();
  if (!key) {
    return null;
  }

  try {
    const plaintext = nacl.secretbox.open(
      decodeBase64(parsed.ciphertext),
      decodeBase64(parsed.nonce),
      key
    );

    if (!plaintext) {
      return null;
    }

    const decoded = JSON.parse(encodeUTF8(plaintext)) as Partial<PersistedConversationIndex>;
    const normalized = normalizePersistedState({
      activeConversationId: decoded.activeConversationId ?? null,
      conversations: [],
      uiLanguage: decoded.uiLanguage,
      themeMode: decoded.themeMode,
      themePreset: decoded.themePreset,
      chatBackgroundPreset: decoded.chatBackgroundPreset,
      chatBackgroundImageUri: decoded.chatBackgroundImageUri,
      chatBackgroundImageOpacity: decoded.chatBackgroundImageOpacity,
      chatBubbleOpacity: decoded.chatBubbleOpacity,
      interactionSettings: decoded.interactionSettings,
    });

    return {
      activeConversationId: normalized.activeConversationId,
      conversationIds:
        Array.isArray(decoded.conversationIds)
          ? decoded.conversationIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          : [],
      uiLanguage: normalized.uiLanguage,
      themeMode: normalized.themeMode,
      themePreset: normalized.themePreset,
      chatBackgroundPreset: normalized.chatBackgroundPreset,
      chatBackgroundImageUri: normalized.chatBackgroundImageUri,
      chatBackgroundImageOpacity: normalized.chatBackgroundImageOpacity,
      chatBubbleOpacity: normalized.chatBubbleOpacity,
      interactionSettings: normalized.interactionSettings,
    };
  } catch {
    return null;
  }
}

async function decryptProfileState(raw: string): Promise<PersistedProfileState> {
  const parsed = JSON.parse(raw) as EncryptedStateEnvelope | PersistedProfileState;

  if (!isEncryptedStateEnvelope(parsed)) {
    const normalized = normalizePersistedState(parsed as PersistedState);
    return {
      activeProfileId: normalized.activeProfileId,
      profiles: normalized.profiles,
      profile: normalized.profile,
    };
  }

  const key = await getStoredStateKey();
  if (!key) {
    return {
      activeProfileId: DEFAULT_PROFILE.id,
      profiles: [DEFAULT_PROFILE],
      profile: DEFAULT_PROFILE,
    };
  }

  try {
    const plaintext = nacl.secretbox.open(
      decodeBase64(parsed.ciphertext),
      decodeBase64(parsed.nonce),
      key
    );

    if (!plaintext) {
      return {
        activeProfileId: DEFAULT_PROFILE.id,
        profiles: [DEFAULT_PROFILE],
        profile: DEFAULT_PROFILE,
      };
    }

    const normalized = normalizePersistedState(JSON.parse(encodeUTF8(plaintext)) as PersistedState);
    return {
      activeProfileId: normalized.activeProfileId,
      profiles: normalized.profiles,
      profile: normalized.profile,
    };
  } catch {
    return {
      activeProfileId: DEFAULT_PROFILE.id,
      profiles: [DEFAULT_PROFILE],
      profile: DEFAULT_PROFILE,
    };
  }
}

async function encryptPersistedState(state: PersistedState): Promise<string> {
  return encryptEncryptedPayload(state);
}

async function encryptEncryptedPayload(payload: unknown): Promise<string> {
  const key = await getOrCreateStateKey();
  const nonce = await Crypto.getRandomBytesAsync(nacl.secretbox.nonceLength);
  const ciphertext = nacl.secretbox(decodeUTF8(JSON.stringify(payload)), nonce, key);

  const envelope: EncryptedStateEnvelope = {
    kind: 'encrypted-state-v1',
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
  };

  return JSON.stringify(envelope);
}

function conversationKey(conversationId: string): string {
  return `${CONVERSATION_KEY_PREFIX}${conversationId}`;
}

async function loadConversationIndexState(): Promise<PersistedConversationIndex | null> {
  const currentIndexRaw = await AsyncStorage.getItem(CONVERSATION_INDEX_KEY).catch(() => null);
  if (!currentIndexRaw) {
    return null;
  }

  return decryptPersistedConversationIndex(currentIndexRaw).catch(() => null);
}

async function decryptConversationRecord(raw: string): Promise<ConversationRecord | null> {
  const parsed = JSON.parse(raw) as EncryptedStateEnvelope | Partial<ConversationRecord>;

  if (!isEncryptedStateEnvelope(parsed)) {
    return normalizeConversation(parsed);
  }

  const key = await getStoredStateKey();
  if (!key) {
    return null;
  }

  try {
    const plaintext = nacl.secretbox.open(
      decodeBase64(parsed.ciphertext),
      decodeBase64(parsed.nonce),
      key
    );

    if (!plaintext) {
      return null;
    }

    return normalizeConversation(JSON.parse(encodeUTF8(plaintext)) as Partial<ConversationRecord>);
  } catch {
    return null;
  }
}

async function readConversationRecords(ids: string[]): Promise<{
  records: ConversationRecord[];
  unreadableIds: string[];
}> {
  if (ids.length === 0) {
    return {
      records: [],
      unreadableIds: [],
    };
  }

  const records: ConversationRecord[] = [];
  const unreadableIds: string[] = [];

  for (const id of ids) {
    let raw: string | null = null;
    try {
      // Read conversation rows individually so one oversized/corrupt record
      // does not block every other chat from loading.
      raw = await AsyncStorage.getItem(conversationKey(id));
    } catch {
      unreadableIds.push(id);
      continue;
    }

    if (!raw) {
      continue;
    }

    try {
      const normalized = await decryptConversationRecord(raw);
      if (normalized) {
        records.push(normalized);
      } else {
        unreadableIds.push(id);
      }
    } catch {
      unreadableIds.push(id);
      continue;
    }
  }

  return {
    records,
    unreadableIds,
  };
}

async function migrateLegacyStateIfNeeded(): Promise<PersistedState | null> {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const legacyState = await decryptPersistedState(raw);
    const migratedState = {
      ...legacyState,
      activeConversationId: null,
    };
    await savePersistedState(migratedState);
    await AsyncStorage.removeItem(STATE_KEY);
    return migratedState;
  } catch {
    return null;
  }
}

export async function loadPersistedState(): Promise<PersistedState> {
  const indexRaw = await AsyncStorage.getItem(CONVERSATION_INDEX_KEY);
  if (indexRaw) {
    try {
      const index = await decryptPersistedConversationIndex(indexRaw);
      if (index) {
        const { records: conversations, unreadableIds } = await readConversationRecords(index.conversationIds);
        rememberLoadIssues(unreadableIds);

        return {
          ...EMPTY_STATE,
          // Opening the app after a cold start should land in a fresh draft surface.
          activeConversationId: null,
          conversations,
          uiLanguage: index.uiLanguage,
          themeMode: index.themeMode,
          themePreset: index.themePreset,
          chatBackgroundPreset: index.chatBackgroundPreset,
          chatBackgroundImageUri: index.chatBackgroundImageUri,
          chatBackgroundImageOpacity: index.chatBackgroundImageOpacity,
          chatBubbleOpacity: normalizeChatBubbleOpacity(index.chatBubbleOpacity),
          interactionSettings: index.interactionSettings,
        };
      }
    } catch {
      rememberLoadIssues([]);
      return EMPTY_STATE;
    }
  }

  const migrated = await migrateLegacyStateIfNeeded();
  if (migrated) {
    rememberLoadIssues([]);
    return migrated;
  }

  rememberLoadIssues([]);
  return EMPTY_STATE;
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  const conversationPairs = await Promise.all(
    state.conversations.map(async (conversation) => [
      conversationKey(conversation.id),
      await encryptEncryptedPayload(conversation),
    ] as [string, string])
  );

  const currentIndex = await loadConversationIndexState();
  const loadedConversationIds = new Set(state.conversations.map((conversation) => conversation.id));
  const preservedUnreadableIds = (currentIndex?.conversationIds ?? []).filter(
    (conversationId) =>
      protectedConversationIds.has(conversationId) && !loadedConversationIds.has(conversationId)
  );
  const nextConversationIds = [
    ...state.conversations.map((conversation) => conversation.id),
    ...preservedUnreadableIds,
  ];
  const indexState: PersistedConversationIndex = {
    activeConversationId: state.activeConversationId,
    conversationIds: nextConversationIds,
    uiLanguage: state.uiLanguage,
    themeMode: state.themeMode,
    themePreset: state.themePreset,
    chatBackgroundPreset: state.chatBackgroundPreset,
    chatBackgroundImageUri: state.chatBackgroundImageUri,
    chatBackgroundImageOpacity: state.chatBackgroundImageOpacity,
    chatBubbleOpacity: state.chatBubbleOpacity,
    interactionSettings: state.interactionSettings,
  };
  const previousConversationKeys = (currentIndex?.conversationIds ?? []).map(conversationKey);
  const nextConversationKeys = new Set([
    ...conversationPairs.map(([key]) => key),
    ...preservedUnreadableIds.map(conversationKey),
  ]);
  const staleConversationKeys = previousConversationKeys.filter((key) => !nextConversationKeys.has(key));

  await AsyncStorage.setMany(
    Object.fromEntries([
      [CONVERSATION_INDEX_KEY, await encryptEncryptedPayload(indexState)],
      ...conversationPairs,
    ])
  );
  if (staleConversationKeys.length > 0) {
    await AsyncStorage.removeMany(staleConversationKeys);
  }
  await AsyncStorage.removeItem(STATE_KEY);
}

export async function exportUnreadableConversationRaw(
  conversationId: string
): Promise<UnreadableConversationExport | null> {
  const trimmedId = conversationId.trim();
  if (!trimmedId) {
    return null;
  }

  const rawValue = await AsyncStorage.getItem(conversationKey(trimmedId));
  if (!rawValue) {
    return null;
  }

  return {
    conversationId: trimmedId,
    storageKey: conversationKey(trimmedId),
    exportedAt: new Date().toISOString(),
    rawValue,
  };
}

export async function deletePersistedConversationById(conversationId: string): Promise<boolean> {
  const trimmedId = conversationId.trim();
  if (!trimmedId) {
    return false;
  }

  const currentIndex = await loadConversationIndexState();
  const nextConversationIds = (currentIndex?.conversationIds ?? []).filter((id) => id !== trimmedId);
  const nextProtectedConversationIds = [...protectedConversationIds].filter((id) => id !== trimmedId);
  const nextLoadIssues = lastPersistedStateLoadIssues.unreadableConversationIds.filter((id) => id !== trimmedId);

  await AsyncStorage.removeItem(conversationKey(trimmedId)).catch(() => undefined);

  if (currentIndex) {
    const nextIndexState: PersistedConversationIndex = {
      ...currentIndex,
      activeConversationId:
        currentIndex.activeConversationId === trimmedId ? nextConversationIds[0] ?? null : currentIndex.activeConversationId,
      conversationIds: nextConversationIds,
    };

    await AsyncStorage.setItem(CONVERSATION_INDEX_KEY, await encryptEncryptedPayload(nextIndexState));
  }

  protectedConversationIds = new Set(nextProtectedConversationIds);
  rememberLoadIssues(nextLoadIssues);
  return true;
}

export async function clearPersistedState(): Promise<void> {
  rememberLoadIssues([]);
  await AsyncStorage.removeItem(STATE_KEY);
  await AsyncStorage.removeItem(CONVERSATION_INDEX_KEY);
  const keys = await AsyncStorage.getAllKeys();
  const conversationKeys = keys.filter((key) => key.startsWith(CONVERSATION_KEY_PREFIX));
  if (conversationKeys.length > 0) {
    await AsyncStorage.removeMany(conversationKeys);
  }
  await AsyncStorage.removeItem(PROFILE_STATE_KEY);
  await SecureStore.deleteItemAsync(STATE_ENCRYPTION_KEY_KEY);
}

export async function clearPersistedStateOnly(): Promise<void> {
  // Avoid reading the existing value first. Oversized AsyncStorage rows can
  // already fail at getItem() time with CursorWindow limits, while removeItem
  // can still clear the offending key.
  rememberLoadIssues([]);
  await AsyncStorage.removeItem(STATE_KEY);
  await AsyncStorage.removeItem(CONVERSATION_INDEX_KEY);
  const keys = await AsyncStorage.getAllKeys().catch(() => []);
  const conversationKeys = keys.filter((key) => key.startsWith(CONVERSATION_KEY_PREFIX));
  if (conversationKeys.length > 0) {
    await AsyncStorage.removeMany(conversationKeys);
  }
}

export async function loadPersistedProfileState(): Promise<PersistedProfileState | null> {
  const raw = await AsyncStorage.getItem(PROFILE_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return await decryptProfileState(raw);
  } catch {
    return null;
  }
}

export async function savePersistedProfileState(state: PersistedState): Promise<void> {
  const profileState: PersistedProfileState = {
    activeProfileId: state.activeProfileId,
    profiles: state.profiles,
    profile: state.profile,
  };

  await AsyncStorage.setItem(PROFILE_STATE_KEY, await encryptPersistedState(profileState as PersistedState));
}

export function mergePersistedProfileState(
  state: PersistedState,
  profileState: PersistedProfileState | null
): PersistedState {
  if (!profileState) {
    return state;
  }

  const normalized = normalizePersistedState({
    ...state,
    activeProfileId: profileState.activeProfileId,
    profiles: profileState.profiles,
    profile: profileState.profile,
  });

  return {
    ...state,
    activeProfileId: normalized.activeProfileId,
    profiles: normalized.profiles,
    profile: normalized.profile,
  };
}

export async function loadApiKey(): Promise<string> {
  return (await SecureStore.getItemAsync(API_KEY_KEY)) ?? '';
}

export async function saveApiKey(value: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_KEY, value);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_KEY);
}

function profileApiKeyKey(profileId: string): string {
  return `${API_KEY_PREFIX}${profileId}`;
}

export async function loadProfileApiKey(profileId: string): Promise<string> {
  const profileKey = await SecureStore.getItemAsync(profileApiKeyKey(profileId));
  if (profileKey !== null) {
    return profileKey;
  }

  if (profileId === DEFAULT_PROFILE.id) {
    return loadApiKey();
  }

  return '';
}

export async function saveProfileApiKey(profileId: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(profileApiKeyKey(profileId), value);
  if (profileId === DEFAULT_PROFILE.id) {
    await saveApiKey(value);
  }
}

export async function deleteProfileApiKey(profileId: string): Promise<void> {
  await SecureStore.deleteItemAsync(profileApiKeyKey(profileId));
  if (profileId === DEFAULT_PROFILE.id) {
    await deleteApiKey();
  }
}

export async function migrateLegacyApiKey(profileId: string): Promise<string> {
  const current = await SecureStore.getItemAsync(profileApiKeyKey(profileId));
  if (current !== null) {
    return current;
  }

  const legacy = await loadApiKey();
  if (legacy) {
    await saveProfileApiKey(profileId, legacy);
  }
  return legacy;
}
