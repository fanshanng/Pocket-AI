import type { ApiProfile, ApiProtocol } from '../types';
import { modelSupportsReasoning } from './models';

export type ProviderCapabilities = {
  supportsResponses: boolean;
  supportsChatCompletions: boolean;
  supportsResponseChaining: boolean;
  supportsStreaming: boolean;
  supportsImages: boolean;
  supportsFiles: boolean;
  supportsSystemPrompt: boolean;
  supportsReasoning: boolean;
  supportsWebSearch: boolean;
};

const EMPTY_CAPABILITIES: ProviderCapabilities = {
  supportsResponses: false,
  supportsChatCompletions: false,
  supportsResponseChaining: false,
  supportsStreaming: false,
  supportsImages: false,
  supportsFiles: false,
  supportsSystemPrompt: false,
  supportsReasoning: false,
  supportsWebSearch: false,
};

function isDeepSeekReasoningModel(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('deepseek-v4') || normalized === 'deepseek-reasoner';
}

export function inferProtocolCapabilities(protocol: ApiProtocol): ProviderCapabilities {
  if (protocol === 'chatCompletions') {
    return {
      ...EMPTY_CAPABILITIES,
      supportsChatCompletions: true,
      supportsStreaming: true,
      supportsSystemPrompt: true,
    };
  }

  return {
    ...EMPTY_CAPABILITIES,
    supportsResponses: true,
    supportsResponseChaining: true,
    supportsStreaming: true,
    supportsImages: true,
    supportsFiles: true,
    supportsSystemPrompt: true,
  };
}

export function inferProviderCapabilities(profile: Pick<ApiProfile, 'apiProtocol' | 'model'>): ProviderCapabilities {
  const capabilities = inferProtocolCapabilities(profile.apiProtocol);
  return {
    ...capabilities,
    // Keep web search off until a later version adds explicit profile UI and request payload support.
    supportsWebSearch: false,
    supportsReasoning:
      profile.apiProtocol === 'chatCompletions'
        ? isDeepSeekReasoningModel(profile.model)
        : modelSupportsReasoning(profile.model),
  };
}

export function canSendNativeAttachments(capabilities: ProviderCapabilities): boolean {
  return capabilities.supportsImages || capabilities.supportsFiles;
}
