import type { ApiProfile } from '../types';
import {
  getCachedModelsForProfile,
  getCachedReasoningEffortsForProfile,
  sanitizeProfile,
} from './profiles';

export function hasDraftBaseUrl(profile: ApiProfile): boolean {
  return profile.baseUrl.trim().length > 0;
}

export function hasDraftProfileLabel(profile: ApiProfile): boolean {
  return profile.label.trim().length > 0;
}

export function sanitizeEditableProfileDraft(profile: ApiProfile): ApiProfile {
  const sanitized = sanitizeProfile(profile);
  return {
    ...sanitized,
    // Editing drafts may be temporarily empty while users replace preset text; persisted profiles still use sanitizeProfile.
    label: hasDraftProfileLabel(profile) ? sanitized.label : profile.label,
    baseUrl: hasDraftBaseUrl(profile) ? sanitized.baseUrl : profile.baseUrl,
    cachedModels: getCachedModelsForProfile(sanitized),
    cachedReasoningEfforts: getCachedReasoningEffortsForProfile(sanitized),
  };
}
