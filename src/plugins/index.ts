import type { ChatMessage, UiLanguage } from '../types';
import { latexMathPlugin } from './latexMath';
import type { ContentPlugin } from './types';

const contentPlugins: ContentPlugin[] = [latexMathPlugin];
const codeFencePattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;

export function getContentPlugins(): ContentPlugin[] {
  return contentPlugins;
}

export function applyContentPlugins(
  text: string,
  context: { message: ChatMessage; language: UiLanguage; isUser: boolean }
): string {
  function transformChunk(chunk: string) {
    return contentPlugins.reduce(
      (current, plugin) => plugin.transformText?.(current, context) ?? current,
      chunk
    );
  }

  let transformed = '';
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = codeFencePattern.exec(text))) {
    transformed += transformChunk(text.slice(cursor, match.index));
    transformed += match[0];
    cursor = match.index + match[0].length;
  }

  return transformed + transformChunk(text.slice(cursor));
}
