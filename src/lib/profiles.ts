import type { ApiProfile, PersistedState, ReasoningEffort } from '../types';
import { API_PRESETS, DEFAULT_PROFILE, REASONING_EFFORT_OPTIONS, modelSupportsReasoning } from './models';
import { makeId } from './ids';

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function sanitizeProfile(profile: ApiProfile): ApiProfile {
  const model = profile.model.trim() || DEFAULT_PROFILE.model;
  const reasoningEffort = profile.reasoningEffort ?? DEFAULT_PROFILE.reasoningEffort;
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    id: profile.id || makeId('profile'),
    label: profile.label.trim() || DEFAULT_PROFILE.label,
    apiProtocol: profile.apiProtocol ?? DEFAULT_PROFILE.apiProtocol,
    baseUrl: profile.baseUrl.trim() || DEFAULT_PROFILE.baseUrl,
    model,
    projectId: profile.projectId.trim(),
    organization: profile.organization.trim(),
    systemPrompt: profile.systemPrompt.trim(),
    reasoningEffort,
    cachedModels: uniqueStrings([model, ...(profile.cachedModels ?? [])]),
    cachedReasoningEfforts: uniqueStrings([reasoningEffort, ...(profile.cachedReasoningEfforts ?? [])]) as ReasoningEffort[],
  };
}

export function getActiveProfile(state: PersistedState): ApiProfile {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profile;
}

export function upsertProfile(profiles: ApiProfile[], profile: ApiProfile): ApiProfile[] {
  const exists = profiles.some((item) => item.id === profile.id);
  if (!exists) {
    return [...profiles, profile];
  }
  return profiles.map((item) => (item.id === profile.id ? profile : item));
}

export function applyApiPreset(profile: ApiProfile, preset: (typeof API_PRESETS)[number]): ApiProfile {
  return {
    ...profile,
    apiProtocol: preset.apiProtocol,
    baseUrl: preset.baseUrl,
    model: preset.model,
    storeResponses: preset.storeResponses,
    reasoningEffort: preset.reasoningEffort,
    cachedModels: [preset.model],
    cachedReasoningEfforts: [preset.reasoningEffort],
    projectId: preset.id === 'deepseek' ? '' : profile.projectId,
    organization: preset.id === 'deepseek' ? '' : profile.organization,
  };
}

export function inferReasoningEffortOptions(profile: ApiProfile): ReasoningEffort[] {
  const model = profile.model.trim().toLowerCase();
  if (!modelSupportsReasoning(profile.model)) {
    return ['none'];
  }

  if (profile.apiProtocol === 'chatCompletions') {
    if (model.startsWith('deepseek-v4') || model === 'deepseek-reasoner') {
      return ['none', 'high', 'xhigh'];
    }
    return ['none'];
  }

  if (model.startsWith('gpt-5') || /^o\d/.test(model)) {
    return REASONING_EFFORT_OPTIONS;
  }

  return ['none'];
}

export function getCachedModelsForProfile(profile: ApiProfile): string[] {
  return uniqueStrings([profile.model, ...(profile.cachedModels ?? [])]);
}

export function getCachedReasoningEffortsForProfile(profile: ApiProfile): ReasoningEffort[] {
  return uniqueStrings([profile.reasoningEffort, ...(profile.cachedReasoningEfforts ?? [])]) as ReasoningEffort[];
}

export function profileHasAdvancedValues(profile: ApiProfile): boolean {
  return (
    profile.projectId.trim().length > 0 ||
    profile.organization.trim().length > 0 ||
    profile.systemPrompt.trim().length > 0 ||
    profile.storeResponses
  );
}
