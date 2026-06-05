import type { ChatMessage, UiLanguage } from '../types';
import { latexMathPlugin } from './latexMath';
import type { ContentPlugin } from './types';

const contentPlugins: ContentPlugin[] = [latexMathPlugin];

export function getContentPlugins(): ContentPlugin[] {
  return contentPlugins;
}

export function applyContentPlugins(
  text: string,
  context: { message: ChatMessage; language: UiLanguage; isUser: boolean }
): string {
  return contentPlugins.reduce((current, plugin) => plugin.transformText?.(current, context) ?? current, text);
}
