import type { ChatMessage, UiLanguage } from '../types';

export type ContentTransformContext = {
  message: ChatMessage;
  language: UiLanguage;
  isUser: boolean;
};

export type ContentPlugin = {
  id: string;
  label: string;
  description: string;
  transformText?: (text: string, context: ContentTransformContext) => string;
};
