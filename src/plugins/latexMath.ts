import type { ContentPlugin } from './types';

export const latexMathPlugin: ContentPlugin = {
  id: 'latex-math',
  label: 'LaTeX Math',
  description: 'Renders LaTeX math with KaTeX while preserving the original message text.',
};
