import type { ApiProfile, AttachmentRecord, ChatMessage, ConversationRecord, UiLanguage } from '../types';
import { fetch as expoFetch } from 'expo/fetch';

import {
  extractDownloadableUrls,
  persistRemoteAttachment,
  readAttachmentAsDataUrl,
} from './files';
import { modelSupportsReasoning } from './models';

type ResponsesInputItem = {
  role: 'user' | 'assistant' | 'system';
  content:
    | string
    | Array<
        | { type: 'input_text'; text: string }
        | { type: 'input_image'; image_url: string }
        | { type: 'input_file'; filename: string; file_data: string }
      >;
};

type ChatCompletionMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type RequestOptions = {
  profile: ApiProfile;
  apiKey: string;
  conversation: ConversationRecord;
  nextUserMessage: ChatMessage;
  signal?: AbortSignal;
  onTextDelta?: (delta: string) => void;
};

type ApiErrorDetails = {
  status?: number;
  message: string;
  code?: string;
  type?: string;
};

type ResponseTurn = {
  assistantText: string;
  responseId: string;
  attachments: AttachmentRecord[];
};

export type ApiConnectionTestResult = {
  endpoint: string;
  model: string;
  latencyMs: number;
  responseId: string;
  sampleText: string;
};

export type FetchModelsResult = {
  endpoint: string;
  models: string[];
};

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  type?: string;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiRequestError';
    this.status = details.status;
    this.code = details.code;
    this.type = details.type;
  }
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof ApiRequestError ? error.status : undefined;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unknown error';
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function buildHeaders(profile: ApiProfile, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (profile.apiProtocol === 'responses' && profile.projectId.trim()) {
    headers['OpenAI-Project'] = profile.projectId.trim();
  }
  if (profile.apiProtocol === 'responses' && profile.organization.trim()) {
    headers['OpenAI-Organization'] = profile.organization.trim();
  }
  return headers;
}

function buildReasoning(profile: ApiProfile): { effort: ApiProfile['reasoningEffort'] } | undefined {
  if (!modelSupportsReasoning(profile.model)) {
    return undefined;
  }

  return { effort: profile.reasoningEffort };
}

function isDeepSeekChatModel(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('deepseek-v4') || normalized === 'deepseek-reasoner' || normalized === 'deepseek-chat';
}

function buildResponsesRequestBody(
  profile: ApiProfile,
  input: ResponsesInputItem[],
  previousResponseId?: string | null,
  stream = false
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: profile.model.trim(),
    store: profile.storeResponses,
    stream,
    input,
  };

  if (previousResponseId) {
    body.previous_response_id = previousResponseId;
  }

  const reasoning = buildReasoning(profile);
  if (reasoning) {
    body.reasoning = reasoning;
  }

  return body;
}

function buildChatCompletionRequestBody(
  profile: ApiProfile,
  messages: ChatCompletionMessage[],
  stream = false
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: profile.model.trim(),
    messages,
    stream,
  };

  if (isDeepSeekChatModel(profile.model) && profile.reasoningEffort !== 'none') {
    body.reasoning_effort = profile.reasoningEffort === 'xhigh' ? 'max' : 'high';
    body.thinking = { type: 'enabled' };
  } else if (isDeepSeekChatModel(profile.model)) {
    body.thinking = { type: 'disabled' };
  }

  return body;
}

async function messageToInput(message: ChatMessage): Promise<ResponsesInputItem> {
  const trimmedText = message.text.trim();
  if (message.attachments.length === 0) {
    return {
      role: message.role,
      content: trimmedText || '...',
    };
  }

  const content: Extract<ResponsesInputItem['content'], Array<unknown>> = [];
  if (trimmedText) {
    content.push({ type: 'input_text', text: trimmedText });
  }

  for (const attachment of message.attachments) {
    const dataUrl = await readAttachmentAsDataUrl(attachment);
    if (attachment.kind === 'image') {
      content.push({ type: 'input_image', image_url: dataUrl });
    } else {
      content.push({
        type: 'input_file',
        filename: attachment.name,
        file_data: dataUrl,
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: 'input_text', text: '...' });
  }

  return {
    role: message.role,
    content,
  };
}

async function messageToChatCompletionMessage(message: ChatMessage): Promise<ChatCompletionMessage> {
  const trimmedText = message.text.trim();
  if (message.attachments.length === 0) {
    return {
      role: message.role,
      content: trimmedText || '...',
    };
  }

  const content: string[] = [];
  if (trimmedText) {
    content.push(trimmedText);
  }

  const attachmentNames = message.attachments.map((attachment) => `${attachment.kind}: ${attachment.name}`);
  content.push(
    `[Attachments not sent in Chat Completions mode: ${attachmentNames.join(', ')}. Please answer based on the text context only.]`
  );

  if (content.length === 0) {
    content.push('...');
  }

  return {
    role: message.role,
    content: content.join('\n\n'),
  };
}

async function buildFullInput(
  conversation: ConversationRecord,
  nextUserMessage: ChatMessage,
  systemPrompt: string
): Promise<ResponsesInputItem[]> {
  const input: ResponsesInputItem[] = [];
  if (systemPrompt.trim()) {
    input.push({
      role: 'system',
      content: systemPrompt.trim(),
    });
  }

  for (const message of conversation.messages) {
    input.push(await messageToInput(message));
  }
  input.push(await messageToInput(nextUserMessage));
  return input;
}

async function buildFullChatCompletionMessages(
  conversation: ConversationRecord,
  nextUserMessage: ChatMessage,
  systemPrompt: string
): Promise<ChatCompletionMessage[]> {
  const messages: ChatCompletionMessage[] = [];
  if (systemPrompt.trim()) {
    messages.push({
      role: 'system',
      content: systemPrompt.trim(),
    });
  }

  for (const message of conversation.messages) {
    messages.push(await messageToChatCompletionMessage(message));
  }
  messages.push(await messageToChatCompletionMessage(nextUserMessage));
  return messages;
}

function extractResponsesAssistantText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  if (payload?.response) {
    return extractResponsesAssistantText(payload.response);
  }

  if (payload?.item) {
    return extractResponsesAssistantText(payload.item);
  }

  if (typeof payload?.part?.text === 'string') {
    return payload.part.text.trim();
  }

  const directContent = Array.isArray(payload?.content) ? payload.content : [];
  if (directContent.length > 0) {
    return directContent
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  const chunks: string[] = [];
  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string') {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join('\n').trim();
}

function extractResponsesOutputAttachments(payload: any): Array<{ url: string; name?: string; mimeType?: string }> {
  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  const attachments: Array<{ url: string; name?: string; mimeType?: string }> = [];

  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      const url = part?.image_url || part?.url || part?.file_url;
      if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
        attachments.push({
          url,
          name: typeof part?.filename === 'string' ? part.filename : undefined,
          mimeType: typeof part?.mime_type === 'string' ? part.mime_type : undefined,
        });
      }
    }
  }

  return attachments;
}

function extractChatCompletionAssistantText(payload: any): string {
  const choices = Array.isArray(payload?.choices) ? payload.choices : [];
  const chunks: string[] = [];
  for (const choice of choices) {
    const content = choice?.message?.content;
    if (typeof content === 'string') {
      chunks.push(content);
    }
  }
  return chunks.join('\n').trim();
}

async function collectAssistantAttachments(
  assistantText: string,
  explicitAttachments: Array<{ url: string; name?: string; mimeType?: string }> = []
): Promise<AttachmentRecord[]> {
  const candidates = [
    ...explicitAttachments,
    ...extractDownloadableUrls(assistantText).map((url) => ({ url })),
  ];
  const unique = new Map(candidates.map((item) => [item.url, item]));
  const attachments: AttachmentRecord[] = [];

  for (const item of unique.values()) {
    const attachment = await persistRemoteAttachment(item);
    if (attachment) {
      attachments.push(attachment);
    }
  }

  return attachments;
}

async function requestJson(url: string, init: RequestInit): Promise<any> {
  const response = await expoFetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiRequestError(parseApiError(response.status, payload));
  }
  return payload;
}

function uniqueCompact(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function looksLikeModelId(value: string): boolean {
  const compact = value.trim();
  return (
    /^[A-Za-z0-9][A-Za-z0-9._:/+-]{1,127}$/.test(compact) &&
    !/^https?:\/\//i.test(compact) &&
    /(gpt|o\d|deepseek|claude|gemini|qwen|glm|llama|mistral|yi-|kimi|moonshot|doubao|hunyuan|ernie|codex|chat|reasoner|flash|turbo|mini|pro|max|vision|audio|embedding|rerank|whisper|tts|dall)/i.test(
      compact
    )
  );
}

function collectModelStrings(value: unknown, output: string[]) {
  if (typeof value === 'string') {
    if (looksLikeModelId(value)) {
      output.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectModelStrings(item, output));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const record = value as Record<string, unknown>;
  for (const key of ['id', 'model', 'name']) {
    const candidate = record[key];
    if (typeof candidate === 'string' && looksLikeModelId(candidate)) {
      output.push(candidate);
    }
  }

  Object.values(record).forEach((item) => collectModelStrings(item, output));
}

function extractModels(payload: any): string[] {
  const directModels = Array.isArray(payload?.data)
    ? payload.data
        .map((item: any) => (typeof item === 'string' ? item : item?.id || item?.model || item?.name))
        .filter((item: unknown): item is string => typeof item === 'string' && looksLikeModelId(item))
    : [];

  if (directModels.length > 0) {
    return uniqueCompact(directModels).sort((a, b) => a.localeCompare(b));
  }

  const collected: string[] = [];
  collectModelStrings(payload, collected);
  return uniqueCompact(collected).sort((a, b) => a.localeCompare(b));
}

function sanitizeGeneratedTitle(text: string, language: UiLanguage): string {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  const cleaned = (firstLine || '')
    .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '')
    .replace(/^(标题|会话标题|title)\s*[:：-]\s*/i, '')
    .replace(/[。.!！?？,，;；]+$/g, '')
    .trim();
  const limit = 15;
  return Array.from(cleaned).slice(0, limit).join('');
}

function parseApiError(status: number | undefined, payload: any): ApiErrorDetails {
  const errorPayload = payload?.error && typeof payload.error === 'object' ? payload.error : payload;
  const message =
    (typeof errorPayload?.message === 'string' && errorPayload.message.trim()) ||
    (typeof payload?.message === 'string' && payload.message.trim()) ||
    (status ? `HTTP ${status}` : 'Request failed');

  return {
    status,
    message,
    code: typeof errorPayload?.code === 'string' ? errorPayload.code : undefined,
    type: typeof errorPayload?.type === 'string' ? errorPayload.type : undefined,
  };
}

function appendSseChunk(buffer: string, chunk: string): string {
  return buffer + chunk.replace(/\r/g, '');
}

function parseSseEvents(buffer: string): { events: string[]; rest: string } {
  const events: string[] = [];
  let rest = buffer;
  let index = rest.indexOf('\n\n');

  while (index >= 0) {
    const rawEvent = rest.slice(0, index);
    rest = rest.slice(index + 2);
    const data = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');

    if (data) {
      events.push(data);
    }
    index = rest.indexOf('\n\n');
  }

  return { events, rest };
}

function extractResponsesStreamDelta(payload: any): string {
  const type = String(payload?.type ?? '');
  if (typeof payload?.delta === 'string') {
    return payload.delta;
  }
  if (!/delta/i.test(type)) {
    return '';
  }
  if (typeof payload?.text === 'string') {
    return payload.text;
  }
  if (typeof payload?.output_text === 'string') {
    return payload.output_text;
  }
  return '';
}

function extractChatCompletionStreamDelta(payload: any): string {
  const choices = Array.isArray(payload?.choices) ? payload.choices : [];
  return choices
    .map((choice: any) => choice?.delta?.content)
    .filter((value: unknown): value is string => typeof value === 'string')
    .join('');
}

async function requestStream(
  url: string,
  init: RequestInit,
  extractDelta: (payload: any) => string,
  onTextDelta?: (delta: string) => void
): Promise<{ text: string; id: string; finalPayload: any | null }> {
  const response = await expoFetch(url, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiRequestError(parseApiError(response.status, payload));
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming is not available in this runtime.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let id = '';
  let finalPayload: any | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer = appendSseChunk(buffer, decoder.decode(value, { stream: true }));
    const parsed = parseSseEvents(buffer);
    buffer = parsed.rest;

    for (const event of parsed.events) {
      if (event === '[DONE]') {
        continue;
      }

      const payload = JSON.parse(event);
      finalPayload = payload;
      if (typeof payload?.id === 'string') {
        id = payload.id;
      }

      const delta = extractDelta(payload);
      if (delta) {
        text += delta;
        onTextDelta?.(delta);
      }
    }
  }

  return { text, id, finalPayload };
}

export async function testApiConnection(options: {
  profile: ApiProfile;
  apiKey: string;
  timeoutMs?: number;
}): Promise<ApiConnectionTestResult> {
  const { profile, apiKey, timeoutMs = 15000 } = options;
  const headers = buildHeaders(profile, apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    if (profile.apiProtocol === 'chatCompletions') {
      const endpoint = `${normalizeBaseUrl(profile.baseUrl)}/chat/completions`;
      const payload = await requestJson(endpoint, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: profile.model.trim(),
          messages: [{ role: 'user', content: 'Reply with OK.' }],
          stream: false,
          max_tokens: 16,
        }),
      });

      return {
        endpoint,
        model: profile.model.trim(),
        latencyMs: Date.now() - startedAt,
        responseId: typeof payload?.id === 'string' ? payload.id : '',
        sampleText: extractChatCompletionAssistantText(payload),
      };
    }

    const endpoint = `${normalizeBaseUrl(profile.baseUrl)}/responses`;
    const payload = await requestJson(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: profile.model.trim(),
        input: 'Reply with OK.',
        stream: false,
        store: false,
        max_output_tokens: 16,
      }),
    });

    return {
      endpoint,
      model: profile.model.trim(),
      latencyMs: Date.now() - startedAt,
      responseId: typeof payload?.id === 'string' ? payload.id : '',
      sampleText: extractResponsesAssistantText(payload),
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiRequestError({ message: `Request timed out after ${Math.round(timeoutMs / 1000)} seconds.` });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAvailableModels(options: {
  profile: ApiProfile;
  apiKey: string;
  timeoutMs?: number;
}): Promise<FetchModelsResult> {
  const { profile, apiKey, timeoutMs = 15000 } = options;
  const baseUrl = normalizeBaseUrl(profile.baseUrl);
  const endpointCandidates = [`${baseUrl}/models`, `${baseUrl}/model`];
  if (!/\/v1$/i.test(baseUrl)) {
    endpointCandidates.push(`${baseUrl}/v1/models`);
  }
  const endpoints = uniqueCompact(endpointCandidates);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let lastError: unknown;
  let emptyResult: FetchModelsResult | null = null;

  try {
    for (const endpoint of endpoints) {
      try {
        const payload = await requestJson(endpoint, {
          method: 'GET',
          headers: buildHeaders(profile, apiKey),
          signal: controller.signal,
        });

        const result = {
          endpoint,
          models: extractModels(payload),
        };

        if (result.models.length > 0) {
          return result;
        }
        emptyResult = emptyResult || result;
      } catch (error) {
        lastError = error;
        if (controller.signal.aborted) {
          throw error;
        }
      }
    }

    if (emptyResult) {
      return emptyResult;
    }
    throw lastError;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiRequestError({ message: `Request timed out after ${Math.round(timeoutMs / 1000)} seconds.` });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createConversationTitle(options: {
  profile: ApiProfile;
  apiKey: string;
  userText: string;
  assistantText: string;
  language: UiLanguage;
  timeoutMs?: number;
}): Promise<string> {
  const { profile, apiKey, userText, assistantText, language, timeoutMs = 15000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const prompt =
    language === 'zh'
      ? `请根据下面这轮对话生成一个中文标题，只输出标题，15个字以内，不要标点。\n\n用户：${userText || '(附件)'}\n\n助手：${assistantText}`
      : `Generate a short chat title. Output only the title, within 15 characters, no punctuation.\n\nUser: ${userText || '(attachment)'}\n\nAssistant: ${assistantText}`;

  try {
    if (profile.apiProtocol === 'chatCompletions') {
      const payload = await requestJson(`${normalizeBaseUrl(profile.baseUrl)}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(profile, apiKey),
        signal: controller.signal,
        body: JSON.stringify({
          model: profile.model.trim(),
          messages: [
            {
              role: 'system',
              content:
                language === 'zh'
                  ? '你只负责生成极短会话标题。只输出标题本身。'
                  : 'You only generate very short chat titles. Output only the title.',
            },
            { role: 'user', content: prompt },
          ],
          stream: false,
          max_tokens: 32,
        }),
      });

      return sanitizeGeneratedTitle(extractChatCompletionAssistantText(payload), language);
    }

    const payload = await requestJson(`${normalizeBaseUrl(profile.baseUrl)}/responses`, {
      method: 'POST',
      headers: buildHeaders(profile, apiKey),
      signal: controller.signal,
      body: JSON.stringify({
        model: profile.model.trim(),
        input: prompt,
        stream: false,
        store: false,
        max_output_tokens: 32,
      }),
    });

    return sanitizeGeneratedTitle(extractResponsesAssistantText(payload), language);
  } catch (error) {
    if (controller.signal.aborted) {
      return '';
    }
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

export async function createAssistantTurn(options: RequestOptions): Promise<ResponseTurn> {
  const { profile, apiKey, conversation, nextUserMessage, signal, onTextDelta } = options;
  const headers = buildHeaders(profile, apiKey);

  if (profile.apiProtocol === 'chatCompletions') {
    const messages = await buildFullChatCompletionMessages(conversation, nextUserMessage, profile.systemPrompt);
    try {
      const streamed = await requestStream(
        `${normalizeBaseUrl(profile.baseUrl)}/chat/completions`,
        {
          method: 'POST',
          headers,
          signal,
          body: JSON.stringify(buildChatCompletionRequestBody(profile, messages, true)),
        },
        extractChatCompletionStreamDelta,
        onTextDelta
      );

      const assistantText = streamed.text || extractResponsesAssistantText(streamed.finalPayload);
      return {
        assistantText,
        responseId: streamed.id,
        attachments: await collectAssistantAttachments(
          assistantText,
          extractResponsesOutputAttachments(streamed.finalPayload)
        ),
      };
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
    }

    const payload = await requestJson(`${normalizeBaseUrl(profile.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify(buildChatCompletionRequestBody(profile, messages, false)),
    });

    const assistantText = extractChatCompletionAssistantText(payload);
    return {
      assistantText,
      responseId: payload.id ?? '',
      attachments: await collectAssistantAttachments(assistantText),
    };
  }

  const url = `${normalizeBaseUrl(profile.baseUrl)}/responses`;

  const attemptWithChain = async (): Promise<ResponseTurn> => {
    try {
      const streamed = await requestStream(
        url,
        {
          method: 'POST',
          headers,
          signal,
          body: JSON.stringify(
            buildResponsesRequestBody(profile, [await messageToInput(nextUserMessage)], conversation.previousResponseId, true)
          ),
        },
        extractResponsesStreamDelta,
        onTextDelta
      );

      const assistantText = streamed.text || extractResponsesAssistantText(streamed.finalPayload);
      return {
        assistantText,
        responseId: streamed.id,
        attachments: await collectAssistantAttachments(
          assistantText,
          extractResponsesOutputAttachments(streamed.finalPayload)
        ),
      };
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
    }

    const payload = await requestJson(url, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify(
        buildResponsesRequestBody(profile, [await messageToInput(nextUserMessage)], conversation.previousResponseId)
      ),
    });

    const assistantText = extractResponsesAssistantText(payload);
    return {
      assistantText,
      responseId: payload.id,
      attachments: await collectAssistantAttachments(assistantText, extractResponsesOutputAttachments(payload)),
    };
  };

  const attemptFullContext = async (): Promise<ResponseTurn> => {
    const fullInput = await buildFullInput(conversation, nextUserMessage, profile.systemPrompt);
    try {
      const streamed = await requestStream(
        url,
        {
          method: 'POST',
          headers,
          signal,
          body: JSON.stringify(buildResponsesRequestBody(profile, fullInput, null, true)),
        },
        extractResponsesStreamDelta,
        onTextDelta
      );

      return {
        assistantText: streamed.text,
        responseId: streamed.id,
        attachments: await collectAssistantAttachments(streamed.text),
      };
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
    }

    const payload = await requestJson(url, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify(
        buildResponsesRequestBody(profile, fullInput)
      ),
    });

    const assistantText = extractResponsesAssistantText(payload);
    return {
      assistantText,
      responseId: payload.id,
      attachments: await collectAssistantAttachments(assistantText, extractResponsesOutputAttachments(payload)),
    };
  };

  if (profile.storeResponses && conversation.previousResponseId) {
    try {
      return await attemptWithChain();
    } catch {
      return await attemptFullContext();
    }
  }

  return await attemptFullContext();
}
