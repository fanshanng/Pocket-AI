import type { ApiProfile, ApiProtocol, AssistantKind, ReasoningEffort, UiLanguage } from '../types';

export const DEFAULT_PROFILE: ApiProfile = {
  id: 'default',
  label: 'My API',
  apiProtocol: 'responses',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-5.4',
  projectId: '',
  organization: '',
  systemPrompt: '',
  reasoningEffort: 'xhigh',
  cachedModels: ['gpt-5.4'],
  cachedReasoningEfforts: ['high', 'xhigh'],
  storeResponses: false,
};

export const DEFAULT_LANGUAGE: UiLanguage = 'zh';

export const API_PROTOCOL_OPTIONS: ApiProtocol[] = ['responses', 'chatCompletions'];

export const API_PRESETS: Array<{
  id: 'openai' | 'deepseek';
  label: string;
  apiProtocol: ApiProtocol;
  baseUrl: string;
  model: string;
  storeResponses: boolean;
  reasoningEffort: ReasoningEffort;
}> = [
  {
    id: 'openai',
    label: 'OpenAI Responses',
    apiProtocol: 'responses',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5.4',
    storeResponses: false,
    reasoningEffort: 'xhigh',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    apiProtocol: 'chatCompletions',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
    storeResponses: false,
    reasoningEffort: 'none',
  },
];

export const MODEL_SUGGESTIONS = [
  'gpt-5.4',
  'gpt-5.5',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4o-mini',
  'gpt-5-codex',
  'gpt-5.2-codex',
  'gpt-5.1-codex-mini',
  'codex-mini-latest',
  'deepseek-v4-flash',
  'deepseek-v4-pro',
  'deepseek-chat',
  'deepseek-reasoner',
] as const;

export const REASONING_EFFORT_OPTIONS: ReasoningEffort[] = [
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
];

export const COMMON_REASONING_EFFORT_OPTIONS: ReasoningEffort[] = ['high', 'xhigh'];

export function classifyModel(model: string): AssistantKind {
  return /codex/i.test(model) ? 'codex' : 'cli';
}

export function getModelHint(model: string, language: UiLanguage = 'en'): string {
  if (/codex-mini-latest/i.test(model)) {
    return language === 'zh'
      ? 'codex-mini-latest 更偏向 Codex 工作流；如果是直接聊天，通常从 gpt-5.x 或 gpt-4.1 开始会更稳。'
      : 'codex-mini-latest is tuned for Codex workflows. For direct chat, gpt-5.x or gpt-4.1 is usually a smoother starting point.';
  }
  if (/codex/i.test(model)) {
    return language === 'zh'
      ? 'Codex 类模型更适合代码和长任务，但这里仍然使用同一套聊天界面。'
      : 'Codex-tagged models fit code-heavy or longer tasks, while still using the same chat UI here.';
  }
  return language === 'zh'
    ? 'Chat 类模型更适合日常对话和多模态输入。'
    : 'Chat-tagged models are a solid default for everyday conversation and multimodal inputs.';
}

export function modelSupportsReasoning(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return (
    normalized.startsWith('gpt-5') ||
    /^o\d/.test(normalized) ||
    normalized.startsWith('deepseek-v4') ||
    normalized.includes('deepseek-reasoner')
  );
}

export function apiProtocolLabel(protocol: ApiProtocol, language: UiLanguage = 'en'): string {
  if (protocol === 'chatCompletions') {
    return language === 'zh' ? 'Chat Completions 兼容' : 'Chat Completions compatible';
  }
  return language === 'zh' ? 'OpenAI Responses' : 'OpenAI Responses';
}

export function getEndpointHint(protocol: ApiProtocol, language: UiLanguage = 'en'): string {
  if (protocol === 'chatCompletions') {
    return language === 'zh'
      ? 'Chat Completions 模式会自动请求 `/chat/completions`。DeepSeek 通常填 `https://api.deepseek.com`，优先用 `deepseek-v4-flash` 或 `deepseek-v4-pro`。'
      : 'Chat Completions mode appends `/chat/completions`. For DeepSeek, use `https://api.deepseek.com` with `deepseek-v4-flash` or `deepseek-v4-pro`.';
  }

  return language === 'zh'
    ? 'Responses 模式会自动请求 `/responses`。OpenAI 官方 Responses API 通常填 `https://api.openai.com/v1`。'
    : 'Responses mode appends `/responses`. For OpenAI Responses API, use `https://api.openai.com/v1`.';
}

export function getReasoningEffortHint(
  model: string,
  effort: ReasoningEffort,
  language: UiLanguage = 'en'
): string {
  if (!modelSupportsReasoning(model)) {
    return language === 'zh'
      ? '只有 gpt-5 和 o 系列风格的模型名称才会发送 reasoning effort。'
      : 'Reasoning effort is only sent for gpt-5 and o-series style model names.';
  }

  if (effort === 'xhigh') {
    return language === 'zh'
      ? 'xhigh 会给模型最多的思考预算，通常会用更高延迟换更强推理。'
      : 'xhigh gives the model the most thinking budget, usually trading speed for stronger reasoning.';
  }

  if (effort === 'none' || effort === 'minimal') {
    return language === 'zh'
      ? '较低 effort 会更快、更省，但在复杂任务上的质量可能下降。'
      : 'Lower effort is faster and cheaper, but can reduce quality on harder tasks.';
  }

  return language === 'zh'
    ? '更高 effort 往往能提升复杂推理效果，但会增加延迟和 token 消耗。'
    : 'Higher effort usually improves difficult reasoning tasks at the cost of latency and tokens.';
}

export function getStorageHint(storeResponses: boolean, language: UiLanguage = 'en'): string {
  if (storeResponses) {
    return language === 'zh'
      ? '已开启服务端响应存储，后续轮次会优先使用 previous_response_id。'
      : 'Server-side response storage stays on, so follow-up turns can use previous_response_id.';
  }

  return language === 'zh'
    ? '已关闭服务端响应存储。应用会在每轮请求时重新发送本地会话上下文。'
    : 'Server-side response storage stays off. The app will resend local conversation context each turn instead.';
}

export function getProtocolStorageHint(protocol: ApiProtocol, storeResponses: boolean, language: UiLanguage = 'en'): string {
  if (protocol === 'chatCompletions') {
    return language === 'zh'
      ? 'Chat Completions / DeepSeek 模式不使用 OpenAI 的 previous_response_id；应用会每轮发送本地上下文。'
      : 'Chat Completions / DeepSeek mode does not use OpenAI previous_response_id; the app resends local context each turn.';
  }

  return getStorageHint(storeResponses, language);
}
