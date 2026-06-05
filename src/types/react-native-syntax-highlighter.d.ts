declare module 'react-native-syntax-highlighter' {
  import type { ComponentType, ReactNode } from 'react';

  type SyntaxHighlighterProps = {
    children: string;
    language?: string;
    style?: Record<string, unknown>;
    highlighter?: 'hljs' | 'highlightjs' | 'prism';
    fontFamily?: string;
    fontSize?: number;
    customStyle?: Record<string, unknown>;
    wrapLines?: boolean;
    PreTag?: ComponentType<{ children?: ReactNode }>;
    CodeTag?: ComponentType<{ children?: ReactNode }>;
  };

  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/styles/hljs' {
  export const atomOneDark: Record<string, unknown>;
  export const tomorrowNight: Record<string, unknown>;
  export const vs2015: Record<string, unknown>;
}
