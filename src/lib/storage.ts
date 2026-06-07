import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';

import type { ApiProfile, ConversationRecord, PersistedState, ThemeMode } from '../types';
import { DEFAULT_LANGUAGE, DEFAULT_PROFILE } from './models';

const STATE_KEY = 'ai-chat-pocket.state.v1';
const API_KEY_KEY = 'ai-chat-pocket.api-key.v1';
const API_KEY_PREFIX = 'ai-chat-pocket.api-key.profile.';
const STATE_ENCRYPTION_KEY_KEY = 'ai-chat-pocket.state-encryption-key.v1';

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
};

function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function normalizeProfile(profile: Partial<ApiProfile> | undefined, fallbackId = DEFAULT_PROFILE.id): ApiProfile {
  const id = profile?.id?.trim() || fallbackId;
  const model = profile?.model?.trim() || DEFAULT_PROFILE.model;
  const reasoningEffort = profile?.reasoningEffort ?? DEFAULT_PROFILE.reasoningEffort;
  return {
    ...DEFAULT_PROFILE,
    ...(profile ?? {}),
    id,
    model,
    reasoningEffort,
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

async function encryptPersistedState(state: PersistedState): Promise<string> {
  const key = await getOrCreateStateKey();
  const nonce = await Crypto.getRandomBytesAsync(nacl.secretbox.nonceLength);
  const ciphertext = nacl.secretbox(decodeUTF8(JSON.stringify(state)), nonce, key);

  const envelope: EncryptedStateEnvelope = {
    kind: 'encrypted-state-v1',
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
  };

  return JSON.stringify(envelope);
}

export async function loadPersistedState(): Promise<PersistedState> {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  if (!raw) {
    return EMPTY_STATE;
  }

  try {
    return await decryptPersistedState(raw);
  } catch {
    return EMPTY_STATE;
  }
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, await encryptPersistedState(state));
}

export async function clearPersistedState(): Promise<void> {
  await AsyncStorage.removeItem(STATE_KEY);
  await SecureStore.deleteItemAsync(STATE_ENCRYPTION_KEY_KEY);
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
