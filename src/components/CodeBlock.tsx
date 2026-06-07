import { memo, useEffect, useMemo, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Maximize2, X } from 'lucide-react-native';

type Props = {
  code: string;
  language?: string;
  deferHighlight?: boolean;
  colorScheme?: 'light' | 'dark';
};

type HighlightKind =
  | 'plain'
  | 'comment'
  | 'keyword'
  | 'string'
  | 'number'
  | 'function'
  | 'variable'
  | 'operator'
  | 'property'
  | 'tag'
  | 'attr'
  | 'inserted'
  | 'deleted';

type HighlightToken = {
  text: string;
  kind: HighlightKind;
};

const LANGUAGE_ALIASES: Record<string, string> = {
  cmd: 'dos',
  csharp: 'cs',
  cs: 'cs',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  css: 'css',
  diff: 'diff',
  docker: 'dockerfile',
  dockerfile: 'dockerfile',
  go: 'go',
  golang: 'go',
  html: 'xml',
  java: 'java',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  kotlin: 'kotlin',
  kt: 'kotlin',
  py: 'python',
  python: 'python',
  rs: 'rust',
  rust: 'rust',
  bash: 'bash',
  powershell: 'powershell',
  ps1: 'powershell',
  sh: 'bash',
  shell: 'bash',
  sql: 'sql',
  ts: 'typescript',
  typescript: 'typescript',
  yaml: 'yaml',
  yml: 'yaml',
};

const HIGHLIGHT_LANGUAGES = new Set([
  'bash',
  'c',
  'cpp',
  'cs',
  'css',
  'diff',
  'dockerfile',
  'dos',
  'go',
  'java',
  'javascript',
  'json',
  'kotlin',
  'markdown',
  'powershell',
  'python',
  'rust',
  'sql',
  'typescript',
  'xml',
  'yaml',
]);

const LANGUAGE_ACCENTS: Record<string, string> = {
  bash: '#22D3EE',
  c: '#A78BFA',
  cpp: '#A78BFA',
  cs: '#C084FC',
  css: '#38BDF8',
  diff: '#F87171',
  dockerfile: '#60A5FA',
  dos: '#93C5FD',
  go: '#67E8F9',
  java: '#F97316',
  javascript: '#FACC15',
  json: '#A7F3D0',
  kotlin: '#C084FC',
  markdown: '#F9A8D4',
  powershell: '#60A5FA',
  python: '#FCD34D',
  rust: '#FB923C',
  sql: '#2DD4BF',
  typescript: '#60A5FA',
  xml: '#F472B6',
  yaml: '#A3E635',
};

const MAX_HIGHLIGHT_CHARS = 12000;
const MONOSPACE_CHAR_WIDTH = 8.7;
const MAX_ESTIMATED_CODE_WIDTH = 12000;

const KEYWORDS: Record<string, Set<string>> = {
  bash: new Set(['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'in', 'export', 'local', 'readonly', 'return', 'exit', 'set', 'unset']),
  c: new Set(['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while']),
  cpp: new Set(['alignas', 'alignof', 'auto', 'bool', 'break', 'case', 'catch', 'class', 'const', 'constexpr', 'continue', 'decltype', 'default', 'delete', 'do', 'double', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'final', 'float', 'for', 'friend', 'if', 'inline', 'int', 'long', 'namespace', 'new', 'noexcept', 'nullptr', 'operator', 'override', 'private', 'protected', 'public', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'template', 'this', 'throw', 'true', 'try', 'typedef', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'while']),
  cs: new Set(['abstract', 'as', 'async', 'await', 'base', 'bool', 'break', 'case', 'catch', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'namespace', 'new', 'null', 'object', 'out', 'override', 'private', 'protected', 'public', 'readonly', 'record', 'ref', 'return', 'sealed', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'using', 'var', 'virtual', 'void', 'while']),
  css: new Set(['important', 'media', 'supports', 'keyframes', 'from', 'to']),
  dockerfile: new Set(['FROM', 'RUN', 'COPY', 'ADD', 'CMD', 'ENTRYPOINT', 'ENV', 'ARG', 'WORKDIR', 'EXPOSE', 'USER', 'VOLUME', 'LABEL', 'SHELL', 'HEALTHCHECK', 'ONBUILD', 'STOPSIGNAL']),
  go: new Set(['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var']),
  java: new Set(['abstract', 'assert', 'boolean', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'false', 'final', 'finally', 'float', 'for', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'void', 'volatile', 'while']),
  javascript: new Set(['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'yield']),
  json: new Set(['true', 'false', 'null']),
  kotlin: new Set(['as', 'break', 'class', 'continue', 'data', 'do', 'else', 'false', 'for', 'fun', 'if', 'in', 'interface', 'is', 'null', 'object', 'package', 'return', 'sealed', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'val', 'var', 'when', 'while']),
  markdown: new Set([]),
  powershell: new Set(['begin', 'break', 'catch', 'class', 'continue', 'data', 'do', 'dynamicparam', 'else', 'elseif', 'end', 'exit', 'filter', 'finally', 'for', 'foreach', 'from', 'function', 'if', 'in', 'param', 'process', 'return', 'switch', 'throw', 'trap', 'try', 'until', 'using', 'var', 'while']),
  python: new Set(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield']),
  rust: new Set(['as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while']),
  sql: new Set(['ADD', 'ALTER', 'AND', 'AS', 'ASC', 'BETWEEN', 'BY', 'CASE', 'CREATE', 'DELETE', 'DESC', 'DISTINCT', 'DROP', 'ELSE', 'EXISTS', 'FROM', 'GROUP', 'HAVING', 'IN', 'INDEX', 'INNER', 'INSERT', 'INTO', 'IS', 'JOIN', 'LEFT', 'LIKE', 'LIMIT', 'NOT', 'NULL', 'ON', 'OR', 'ORDER', 'OUTER', 'PRIMARY', 'RIGHT', 'SELECT', 'SET', 'TABLE', 'THEN', 'UNION', 'UPDATE', 'VALUES', 'WHEN', 'WHERE', 'WITH']),
  typescript: new Set(['abstract', 'any', 'as', 'async', 'await', 'boolean', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'keyof', 'let', 'module', 'namespace', 'never', 'new', 'null', 'number', 'of', 'private', 'protected', 'public', 'readonly', 'return', 'static', 'string', 'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'unknown', 'var', 'void', 'while', 'yield']),
  yaml: new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off']),
};

const TOKEN_PATTERN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|--[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\$[A-Za-z_][\w-]*|[A-Za-z_][\w-]*(?=\s*\()|[A-Za-z_][\w-]*|[{}\[\]().,;:+\-*/%=<>!&|^~?]+)/g;

function normalizeLanguage(language?: string): string {
  const compact = (language || '').trim().toLowerCase().replace(/^language-/, '');
  if (!compact) {
    return 'text';
  }
  return LANGUAGE_ALIASES[compact] ?? compact;
}

function displayLanguage(language: string): string {
  const labels: Record<string, string> = {
    bash: 'Bash',
    c: 'C',
    cpp: 'C++',
    cs: 'C#',
    css: 'CSS',
    diff: 'Diff',
    dockerfile: 'Dockerfile',
    dos: 'CMD',
    go: 'Go',
    html: 'HTML',
    java: 'Java',
    javascript: 'JavaScript',
    json: 'JSON',
    kotlin: 'Kotlin',
    markdown: 'Markdown',
    powershell: 'PowerShell',
    python: 'Python',
    rust: 'Rust',
    sql: 'SQL',
    text: 'Text',
    typescript: 'TypeScript',
    xml: 'HTML',
    yaml: 'YAML',
  };
  return labels[language] ?? language.toUpperCase();
}

function inferLanguage(code: string, language?: string): string {
  const explicit = normalizeLanguage(language);
  if (explicit !== 'text') {
    return explicit;
  }

  const trimmed = code.trim();
  if (!trimmed) return 'text';
  if (/^\s*[{[]/.test(trimmed) && /[}\]]\s*$/.test(trimmed)) return 'json';
  if (/^\s*<(!doctype|html|div|span|script|style|[a-z][\w-]*[\s>])/i.test(trimmed)) return 'xml';
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|WITH)\b/i.test(trimmed)) return 'sql';
  if (/^\s*(package\s+main|func\s+\w+\s*\()/m.test(trimmed)) return 'go';
  if (/^\s*(fn\s+\w+|let\s+mut|use\s+std::)/m.test(trimmed)) return 'rust';
  if (/^\s*(fun\s+\w+|val\s+\w+|var\s+\w+|class\s+\w+)/m.test(trimmed)) return 'kotlin';
  if (/^\s*(public\s+class|class\s+\w+|import\s+java\.)/m.test(trimmed)) return 'java';
  if (/^\s*(def\s+\w+|import\s+\w+|from\s+\w+\s+import|print\()/m.test(trimmed)) return 'python';
  if (/^\s*(const|let|var|function|import\s+.*from|export\s+)/m.test(trimmed)) return 'javascript';
  if (/^\s*(interface|type\s+\w+\s*=|enum\s+\w+)/m.test(trimmed)) return 'typescript';
  if (/^\s*(npm|npx|yarn|pnpm|git|cd|curl|adb|\$|export\s+|set\s+)/im.test(trimmed)) return 'bash';
  if (/^\s*(Get-|Set-|New-|Remove-|Write-|Start-|Stop-|\$[A-Za-z_])/m.test(trimmed)) return 'powershell';
  if (/^\s*(FROM|RUN|COPY|ADD|CMD|ENTRYPOINT|ENV|ARG|WORKDIR)\b/im.test(trimmed)) return 'dockerfile';
  if (/^\s*(#|##|```|\-\s|\*\s|\d+\.\s)/m.test(trimmed)) return 'markdown';
  if (/^\s*(diff --git|@@\s|[+-]{3}\s)/m.test(trimmed)) return 'diff';
  if (/^\s*[\w.-]+:\s+/m.test(trimmed)) return 'yaml';
  if (/[.#][\w-]+\s*\{[\s\S]*\}/.test(trimmed)) return 'css';
  return 'text';
}

export function normalizeCodeLanguage(language?: string): string {
  return normalizeLanguage(language);
}

function estimateCodeContentWidth(code: string): number {
  const longestLine = (code || ' ')
    .split('\n')
    .reduce((longest, line) => Math.max(longest, line.replace(/\t/g, '    ').length), 0);
  return Math.min(MAX_ESTIMATED_CODE_WIDTH, Math.max(40, longestLine * MONOSPACE_CHAR_WIDTH + 24));
}

function PlainCode({ code, width, wrap }: { code: string; width?: number; wrap: boolean }) {
  return (
    <Text
      selectable
      style={[
        styles.plainCode,
        wrap ? styles.codeTextWrapped : styles.codeTextNoWrap,
        width ? { width } : undefined,
      ]}
    >
      {code || ' '}
    </Text>
  );
}

function pushPlain(tokens: HighlightToken[], text: string) {
  if (!text) return;
  const previous = tokens[tokens.length - 1];
  if (previous?.kind === 'plain') {
    previous.text += text;
    return;
  }
  tokens.push({ text, kind: 'plain' });
}

function pushToken(tokens: HighlightToken[], text: string, kind: HighlightKind) {
  if (!text) return;
  const previous = tokens[tokens.length - 1];
  if (previous?.kind === kind) {
    previous.text += text;
    return;
  }
  tokens.push({ text, kind });
}

function tokenizeDiff(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  for (const line of code.split(/(\n)/)) {
    if (line === '\n') {
      pushPlain(tokens, line);
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      pushToken(tokens, line, 'inserted');
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      pushToken(tokens, line, 'deleted');
    } else if (line.startsWith('@@')) {
      pushToken(tokens, line, 'keyword');
    } else {
      pushPlain(tokens, line);
    }
  }
  return tokens;
}

function tokenizeMarkup(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const tagPattern = /<\/?[\w:-]+(?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(code))) {
    pushPlain(tokens, code.slice(cursor, match.index));
    const tag = match[0];
    const innerPattern = /(\/?[\w:-]+)|([\w:-]+)(?=\=)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([<>/=]+)/g;
    let innerCursor = 0;
    let innerMatch: RegExpExecArray | null;
    while ((innerMatch = innerPattern.exec(tag))) {
      pushPlain(tokens, tag.slice(innerCursor, innerMatch.index));
      const value = innerMatch[0];
      if (innerMatch[1]) {
        pushToken(tokens, value, 'tag');
      } else if (innerMatch[2]) {
        pushToken(tokens, value, 'attr');
      } else if (innerMatch[3]) {
        pushToken(tokens, value, 'string');
      } else {
        pushToken(tokens, value, 'operator');
      }
      innerCursor = innerPattern.lastIndex;
    }
    pushPlain(tokens, tag.slice(innerCursor));
    cursor = tagPattern.lastIndex;
  }

  pushPlain(tokens, code.slice(cursor));
  return tokens;
}

function tokenizeJson(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const jsonPattern = /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|[{}\[\]:,])/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = jsonPattern.exec(code))) {
    pushPlain(tokens, code.slice(cursor, match.index));
    const value = match[0];
    if (/^"/.test(value) && code.slice(jsonPattern.lastIndex).trimStart().startsWith(':')) {
      pushToken(tokens, value, 'property');
    } else if (/^"/.test(value)) {
      pushToken(tokens, value, 'string');
    } else if (/^(true|false|null)$/i.test(value)) {
      pushToken(tokens, value, 'keyword');
    } else if (/^-?\d/.test(value)) {
      pushToken(tokens, value, 'number');
    } else {
      pushToken(tokens, value, 'operator');
    }
    cursor = jsonPattern.lastIndex;
  }
  pushPlain(tokens, code.slice(cursor));
  return tokens;
}

function classifyToken(token: string, language: string): HighlightKind {
  const keywordSet = KEYWORDS[language] ?? KEYWORDS.javascript;
  const upperToken = token.toUpperCase();
  if (/^(\/\*|\/\/|#|--)/.test(token)) return 'comment';
  if (/^["'`]/.test(token)) return 'string';
  if (/^-?\d/.test(token)) return 'number';
  if (/^\$[A-Za-z_]/.test(token)) return 'variable';
  if (/^[{}[\]().,;:+\-*/%=<>!&|^~?]+$/.test(token)) return 'operator';
  if (keywordSet.has(token) || keywordSet.has(upperToken)) return 'keyword';
  if (/^[A-Za-z_][\w-]*$/.test(token)) return 'function';
  return 'plain';
}

function tokenizeGeneric(code: string, language: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  TOKEN_PATTERN.lastIndex = 0;

  while ((match = TOKEN_PATTERN.exec(code))) {
    pushPlain(tokens, code.slice(cursor, match.index));
    pushToken(tokens, match[0], classifyToken(match[0], language));
    cursor = TOKEN_PATTERN.lastIndex;
  }

  pushPlain(tokens, code.slice(cursor));
  return tokens;
}

function tokenizeCode(code: string, language: string): HighlightToken[] {
  if (language === 'diff') return tokenizeDiff(code);
  if (language === 'xml') return tokenizeMarkup(code);
  if (language === 'json') return tokenizeJson(code);
  return tokenizeGeneric(code, language);
}

function tokenStyle(kind: HighlightKind) {
  switch (kind) {
    case 'comment':
      return styles.tokenComment;
    case 'keyword':
      return styles.tokenKeyword;
    case 'string':
      return styles.tokenString;
    case 'number':
      return styles.tokenNumber;
    case 'function':
      return styles.tokenFunction;
    case 'variable':
      return styles.tokenVariable;
    case 'operator':
      return styles.tokenOperator;
    case 'property':
      return styles.tokenProperty;
    case 'tag':
      return styles.tokenTag;
    case 'attr':
      return styles.tokenAttr;
    case 'inserted':
      return styles.tokenInserted;
    case 'deleted':
      return styles.tokenDeleted;
    default:
      return null;
  }
}

function HighlightedCode({
  code,
  language,
  width,
  wrap,
}: {
  code: string;
  language: string;
  width?: number;
  wrap: boolean;
}) {
  const tokens = useMemo(() => tokenizeCode(code || ' ', language), [code, language]);

  return (
    <Text
      selectable
      style={[
        styles.plainCode,
        wrap ? styles.codeTextWrapped : styles.codeTextNoWrap,
        width ? { width } : undefined,
      ]}
    >
      {tokens.map((token, index) => (
        <Text key={`${index}-${token.kind}`} style={tokenStyle(token.kind)}>
          {token.text}
        </Text>
      ))}
    </Text>
  );
}

function CodeContent({
  canHighlight,
  code,
  language,
  width,
  wrap,
}: {
  canHighlight: boolean;
  code: string;
  language: string;
  width?: number;
  wrap: boolean;
}) {
  if (canHighlight) {
    return <HighlightedCode code={code} language={language} width={width} wrap={wrap} />;
  }

  return <PlainCode code={code} width={width} wrap={wrap} />;
}

function CodeBlockComponent({ code, language, deferHighlight = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [codeBodyWidth, setCodeBodyWidth] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const normalizedCode = code.replace(/\r\n?/g, '\n').replace(/\n$/, '');
  const resolvedLanguage = useMemo(
    () => inferLanguage(normalizedCode, language),
    [language, normalizedCode]
  );
  const canHighlight =
    !deferHighlight &&
    normalizedCode.length <= MAX_HIGHLIGHT_CHARS &&
    HIGHLIGHT_LANGUAGES.has(resolvedLanguage);
  const accentColor = LANGUAGE_ACCENTS[resolvedLanguage] ?? '#93C5FD';
  const contentWidth = useMemo(() => estimateCodeContentWidth(normalizedCode), [normalizedCode]);
  const fullscreenContentWidth = Math.max(contentWidth, Math.max(320, Math.floor(windowWidth - 24)));

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyCode() {
    if (!normalizedCode.trim()) return;
    await Clipboard.setStringAsync(normalizedCode);
    setCopied(true);
  }

  function handleCodeBodyLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.max(0, Math.floor(event.nativeEvent.layout.width));
    setCodeBodyWidth((current) => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.languageWrap}>
          <View style={[styles.languageDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.language, { color: accentColor }]} numberOfLines={1} ellipsizeMode="tail">
            {displayLanguage(resolvedLanguage)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.copyButton} onPress={copyCode} accessibilityRole="button">
            <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
          </Pressable>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => setFullscreenVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Fullscreen code"
          >
            <Maximize2 size={16} color="#93C5FD" strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>
      <View style={styles.codeBody} onLayout={handleCodeBodyLayout}>
        <CodeContent
          canHighlight={canHighlight}
          code={normalizedCode}
          language={resolvedLanguage}
          width={codeBodyWidth || undefined}
          wrap
        />
      </View>
      <Modal visible={fullscreenVisible} animationType="fade" onRequestClose={() => setFullscreenVisible(false)}>
        <SafeAreaView style={styles.fullscreenRoot}>
          <View style={styles.fullscreenHeader}>
            <View style={styles.languageWrap}>
              <View style={[styles.languageDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.language, { color: accentColor }]} numberOfLines={1} ellipsizeMode="tail">
                {displayLanguage(resolvedLanguage)}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.copyButton} onPress={copyCode} accessibilityRole="button">
                <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => setFullscreenVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close fullscreen code"
              >
                <X size={18} color="#E5E7EB" strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.fullscreenVertical}
            contentContainerStyle={styles.fullscreenVerticalContent}
            showsVerticalScrollIndicator
          >
            <ScrollView
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator
              style={styles.codeScroll}
              contentContainerStyle={[styles.codeScrollContent, { minWidth: fullscreenContentWidth }]}
            >
              <CodeContent
                canHighlight={canHighlight}
                code={normalizedCode}
                language={resolvedLanguage}
                width={fullscreenContentWidth}
                wrap={false}
              />
            </ScrollView>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export const CodeBlock = memo(CodeBlockComponent);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minWidth: 240,
    maxWidth: '100%',
    alignSelf: 'stretch',
    borderRadius: 14,
    backgroundColor: '#0B1220',
    marginTop: 4,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerActions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  languageWrap: {
    flexShrink: 1,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  languageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  language: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  copyButton: {
    flexShrink: 0,
    minHeight: 30,
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 4,
  },
  copyText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  headerIconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBody: {
    width: '100%',
    backgroundColor: '#0B1220',
  },
  codeScroll: {
    maxWidth: '100%',
    backgroundColor: '#0B1220',
  },
  codeScrollContent: {
    flexGrow: 0,
    alignItems: 'flex-start',
  },
  plainCode: {
    color: '#E5E7EB',
    backgroundColor: '#0B1220',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    includeFontPadding: false,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 40,
  },
  codeTextWrapped: {
    alignSelf: 'stretch',
    flexShrink: 1,
  },
  codeTextNoWrap: {
    flexShrink: 0,
  },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  fullscreenHeader: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  fullscreenVertical: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  fullscreenVerticalContent: {
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  tokenComment: {
    color: '#718096',
  },
  tokenKeyword: {
    color: '#C084FC',
    fontWeight: '700',
  },
  tokenString: {
    color: '#A7F3D0',
  },
  tokenNumber: {
    color: '#F9A8D4',
  },
  tokenFunction: {
    color: '#93C5FD',
  },
  tokenVariable: {
    color: '#FCD34D',
  },
  tokenOperator: {
    color: '#CBD5E1',
  },
  tokenProperty: {
    color: '#67E8F9',
  },
  tokenTag: {
    color: '#F472B6',
    fontWeight: '700',
  },
  tokenAttr: {
    color: '#FCD34D',
  },
  tokenInserted: {
    color: '#86EFAC',
  },
  tokenDeleted: {
    color: '#FDA4AF',
  },
});
