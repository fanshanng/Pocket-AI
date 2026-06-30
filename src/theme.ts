import type { ColorSchemeName } from 'react-native';

import type { ChatBackgroundPreset, ThemeMode, ThemePreset } from './types';

export type AppTheme = {
  scheme: 'light' | 'dark';
  gradient: readonly [string, string, string];
  statusBar: 'dark-content' | 'light-content';
  text: string;
  muted: string;
  subtle: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  strong: string;
  primary: string;
  primarySoft: string;
  selectedSurface: string;
  selectedBorder: string;
  selectedText: string;
  actionStrong: string;
  actionStrongText: string;
  dangerSoft: string;
  divider: string;
  input: string;
  placeholder: string;
  assistantBubble: string;
  assistantBorder: string;
  userBubble: string;
  userBorder: string;
  controlSurface: string;
  controlBorder: string;
  composerSurface: string;
  composerBorder: string;
  composerButton: string;
  composerButtonText: string;
  chatBackgroundBase: string;
  chatBackgroundOverlay: string;
  chatBackgroundLine: string;
  chatBackgroundGridStrong: string;
  chatBackgroundBandSoft: string;
  chatBackgroundBandStrong: string;
};

export const DEFAULT_THEME_PRESET: ThemePreset = 'classic';
export const DEFAULT_CHAT_BACKGROUND_PRESET: ChatBackgroundPreset = 'plain';
export const CHAT_BACKGROUND_PRESET_OPTIONS: ChatBackgroundPreset[] = ['plain'];
export const CHAT_BACKGROUND_IMAGE_OPACITY_MIN = 0;
export const CHAT_BACKGROUND_IMAGE_OPACITY_MAX = 1;
export type ChatBackgroundImageOpacity = number;
export const DEFAULT_CHAT_BACKGROUND_IMAGE_OPACITY: ChatBackgroundImageOpacity = 0.28;
export const CHAT_BUBBLE_OPACITY_MIN = 0;
export const CHAT_BUBBLE_OPACITY_MAX = 1;
export type ChatBubbleOpacity = number;
export const DEFAULT_CHAT_BUBBLE_OPACITY: ChatBubbleOpacity = 0.84;

type ParsedColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export const THEME_PRESET_OPTIONS: ThemePreset[] = ['classic', 'graphite', 'sunset', 'forest', 'rose'];

type ThemePresetConfig = {
  light: AppTheme;
  dark: AppTheme;
  preview: readonly [string, string, string];
};

const CLASSIC_LIGHT_THEME: AppTheme = {
  scheme: 'light',
  gradient: ['#FFFFFF', '#F3F8FF', '#E6F0FF'],
  statusBar: 'dark-content',
  text: '#10203A',
  muted: '#5F7392',
  subtle: '#2D486E',
  surface: '#FCFDFF',
  surfaceAlt: '#F2F7FF',
  border: '#C9D9F2',
  strong: '#111827',
  primary: '#2563EB',
  primarySoft: '#E7F0FF',
  selectedSurface: '#E7F0FF',
  selectedBorder: '#4F8FFB',
  selectedText: '#1747B8',
  actionStrong: '#1E3A8A',
  actionStrongText: '#FFFFFF',
  dangerSoft: '#FEF2F2',
  divider: '#DCE7F6',
  input: '#FFFFFF',
  placeholder: '#7487A4',
  assistantBubble: '#F3F8FF',
  assistantBorder: '#C9D9F2',
  userBubble: '#D8E8FF',
  userBorder: '#7FB0FF',
  controlSurface: '#F7FAFF',
  controlBorder: '#C9D9F2',
  composerSurface: '#FDFEFF',
  composerBorder: '#C4D7F3',
  composerButton: '#2563EB',
  composerButtonText: '#FFFFFF',
  chatBackgroundBase: '#F1F6FF',
  chatBackgroundOverlay: 'rgba(252,253,255,0.66)',
  chatBackgroundLine: 'rgba(79,143,251,0.12)',
  chatBackgroundGridStrong: 'rgba(79,143,251,0.2)',
  chatBackgroundBandSoft: 'rgba(216,232,255,0.78)',
  chatBackgroundBandStrong: 'rgba(191,216,255,0.58)',
};

const CLASSIC_DARK_THEME: AppTheme = {
  scheme: 'dark',
  gradient: ['#08101F', '#0E1A33', '#15284A'],
  statusBar: 'light-content',
  text: '#E8EEF9',
  muted: '#9CB0D0',
  subtle: '#CFD9EC',
  surface: '#0F172A',
  surfaceAlt: '#15233A',
  border: '#304764',
  strong: '#F8FAFC',
  primary: '#69ACFF',
  primarySoft: '#172A52',
  selectedSurface: '#1B376E',
  selectedBorder: '#69ACFF',
  selectedText: '#D4E6FF',
  actionStrong: '#60A5FA',
  actionStrongText: '#0B1020',
  dangerSoft: '#3F1D24',
  divider: '#2C415C',
  input: '#101B31',
  placeholder: '#8EA5C9',
  assistantBubble: '#14233C',
  assistantBorder: '#304764',
  userBubble: '#1E407D',
  userBorder: '#4B8FFF',
  controlSurface: '#101C33',
  controlBorder: '#36516F',
  composerSurface: '#0F1B31',
  composerBorder: '#36516F',
  composerButton: '#69ACFF',
  composerButtonText: '#0B1020',
  chatBackgroundBase: '#0C162B',
  chatBackgroundOverlay: 'rgba(8,16,31,0.48)',
  chatBackgroundLine: 'rgba(105,172,255,0.13)',
  chatBackgroundGridStrong: 'rgba(105,172,255,0.2)',
  chatBackgroundBandSoft: 'rgba(27,55,110,0.42)',
  chatBackgroundBandStrong: 'rgba(30,64,125,0.3)',
};

// Keep palette data centralized here so future custom backgrounds and control-surface tuning can sit on
// the same appearance layer instead of leaking button/input hard-coding back into App.tsx.
const THEME_PRESETS: Record<ThemePreset, ThemePresetConfig> = {
  classic: {
    light: CLASSIC_LIGHT_THEME,
    dark: CLASSIC_DARK_THEME,
    preview: ['#2563EB', '#D8E8FF', '#10203A'],
  },
  graphite: {
    light: {
      ...CLASSIC_LIGHT_THEME,
      gradient: ['#F9FEFD', '#EEF9F7', '#E2F3EE'],
      text: '#112927',
      muted: '#5E7B77',
      subtle: '#2D5550',
      surface: '#F4FBF8',
      surfaceAlt: '#E6F5F1',
      border: '#BADFD6',
      strong: '#0E201E',
      primary: '#0E7C75',
      primarySoft: '#DDF5EF',
      selectedSurface: '#D7F0EA',
      selectedBorder: '#27B9AE',
      selectedText: '#0F5D57',
      actionStrong: '#0E7C75',
      actionStrongText: '#FFFFFF',
      divider: '#D2E7E1',
      input: '#FCFFFE',
      placeholder: '#74908C',
      assistantBubble: '#EAF7F4',
      assistantBorder: '#BADFD6',
      userBubble: '#D3F0EA',
      userBorder: '#64D0C2',
      controlSurface: '#F0FAF6',
      controlBorder: '#9FD5CC',
      composerSurface: '#F8FEFC',
      composerBorder: '#9FD5CC',
      composerButton: '#0E7C75',
      composerButtonText: '#FFFFFF',
      chatBackgroundBase: '#EFF9F5',
      chatBackgroundOverlay: 'rgba(244,251,248,0.56)',
      chatBackgroundLine: 'rgba(14,124,117,0.12)',
      chatBackgroundGridStrong: 'rgba(39,185,174,0.18)',
      chatBackgroundBandSoft: 'rgba(211,240,234,0.78)',
      chatBackgroundBandStrong: 'rgba(159,213,204,0.54)',
    },
    dark: {
      ...CLASSIC_DARK_THEME,
      gradient: ['#081211', '#0E1A1B', '#142425'],
      text: '#E6F3F0',
      muted: '#9BB8B3',
      subtle: '#CFE5E0',
      surface: '#101B1C',
      surfaceAlt: '#172628',
      border: '#305754',
      strong: '#F2FCF9',
      primary: '#5EE0D3',
      primarySoft: '#153B3B',
      selectedSurface: '#18504B',
      selectedBorder: '#5EE0D3',
      selectedText: '#D9FBF6',
      actionStrong: '#5EE0D3',
      actionStrongText: '#08211F',
      divider: '#284442',
      input: '#122021',
      placeholder: '#88A8A3',
      assistantBubble: '#152829',
      assistantBorder: '#305754',
      userBubble: '#164742',
      userBorder: '#37C8BC',
      controlSurface: '#122324',
      controlBorder: '#3C6763',
      composerSurface: '#102021',
      composerBorder: '#3C6763',
      composerButton: '#5EE0D3',
      composerButtonText: '#08211F',
      chatBackgroundBase: '#0D1718',
      chatBackgroundOverlay: 'rgba(16,27,28,0.44)',
      chatBackgroundLine: 'rgba(94,224,211,0.12)',
      chatBackgroundGridStrong: 'rgba(94,224,211,0.18)',
      chatBackgroundBandSoft: 'rgba(21,59,59,0.44)',
      chatBackgroundBandStrong: 'rgba(24,80,75,0.28)',
    },
    preview: ['#0E7C75', '#D3F0EA', '#112927'],
  },
  sunset: {
    light: {
      ...CLASSIC_LIGHT_THEME,
      gradient: ['#FFFDFC', '#FFF6F0', '#FFEDE2'],
      text: '#2A190F',
      muted: '#8A6656',
      subtle: '#6F442C',
      surface: '#FFF8F3',
      surfaceAlt: '#FFF0E6',
      border: '#F0D1BE',
      strong: '#2B170D',
      primary: '#C85A1C',
      primarySoft: '#FFE7D8',
      selectedSurface: '#FFE4D1',
      selectedBorder: '#F39B63',
      selectedText: '#994317',
      actionStrong: '#C85A1C',
      actionStrongText: '#FFFFFF',
      divider: '#F2DBCC',
      input: '#FFFDFB',
      placeholder: '#9A7767',
      assistantBubble: '#FFF1E5',
      assistantBorder: '#F0D1BE',
      userBubble: '#FFE2CD',
      userBorder: '#F4B184',
      controlSurface: '#FFF3EA',
      controlBorder: '#E8BFA8',
      composerSurface: '#FFF9F5',
      composerBorder: '#E8BFA8',
      composerButton: '#C85A1C',
      composerButtonText: '#FFFFFF',
      chatBackgroundBase: '#FFF4EC',
      chatBackgroundOverlay: 'rgba(255,248,243,0.56)',
      chatBackgroundLine: 'rgba(200,90,28,0.11)',
      chatBackgroundGridStrong: 'rgba(243,155,99,0.18)',
      chatBackgroundBandSoft: 'rgba(255,226,205,0.78)',
      chatBackgroundBandStrong: 'rgba(244,177,132,0.56)',
    },
    dark: {
      ...CLASSIC_DARK_THEME,
      gradient: ['#150D09', '#20120E', '#2A1914'],
      text: '#F9E7DD',
      muted: '#C8A493',
      subtle: '#EBC6B4',
      surface: '#1A110D',
      surfaceAlt: '#271913',
      border: '#5A3624',
      strong: '#FFF3ED',
      primary: '#F59B5E',
      primarySoft: '#5A2D18',
      selectedSurface: '#713317',
      selectedBorder: '#F59B5E',
      selectedText: '#FFE9DB',
      actionStrong: '#F59B5E',
      actionStrongText: '#2A1308',
      divider: '#4A2A1D',
      input: '#1F1410',
      placeholder: '#B58E7D',
      assistantBubble: '#2A1B15',
      assistantBorder: '#5A3624',
      userBubble: '#68311A',
      userBorder: '#F59B5E',
      controlSurface: '#241712',
      controlBorder: '#6B422E',
      composerSurface: '#221611',
      composerBorder: '#6B422E',
      composerButton: '#F59B5E',
      composerButtonText: '#2A1308',
      chatBackgroundBase: '#18100D',
      chatBackgroundOverlay: 'rgba(26,17,13,0.44)',
      chatBackgroundLine: 'rgba(245,155,94,0.12)',
      chatBackgroundGridStrong: 'rgba(245,155,94,0.18)',
      chatBackgroundBandSoft: 'rgba(90,45,24,0.42)',
      chatBackgroundBandStrong: 'rgba(113,51,23,0.28)',
    },
    preview: ['#C85A1C', '#FFE2CD', '#2A190F'],
  },
  forest: {
    light: {
      ...CLASSIC_LIGHT_THEME,
      gradient: ['#FBFDF8', '#F1F8EC', '#E4F0DE'],
      text: '#182417',
      muted: '#61745D',
      subtle: '#355236',
      surface: '#F8FCF5',
      surfaceAlt: '#ECF5E6',
      border: '#C9DFC0',
      strong: '#152114',
      primary: '#2F7D32',
      primarySoft: '#E0F2E0',
      selectedSurface: '#DCEFD7',
      selectedBorder: '#6CBF70',
      selectedText: '#215B24',
      actionStrong: '#2F7D32',
      actionStrongText: '#FFFFFF',
      divider: '#D7E6D0',
      input: '#FEFFFC',
      placeholder: '#7A8C74',
      assistantBubble: '#EFF7EA',
      assistantBorder: '#C9DFC0',
      userBubble: '#DDEFD7',
      userBorder: '#8FCE8F',
      controlSurface: '#F2F9EE',
      controlBorder: '#B8D7AF',
      composerSurface: '#FBFEF8',
      composerBorder: '#B8D7AF',
      composerButton: '#2F7D32',
      composerButtonText: '#FFFFFF',
      chatBackgroundBase: '#F2F8EE',
      chatBackgroundOverlay: 'rgba(248,252,245,0.56)',
      chatBackgroundLine: 'rgba(47,125,50,0.11)',
      chatBackgroundGridStrong: 'rgba(108,191,112,0.18)',
      chatBackgroundBandSoft: 'rgba(221,239,215,0.78)',
      chatBackgroundBandStrong: 'rgba(184,215,175,0.56)',
    },
    dark: {
      ...CLASSIC_DARK_THEME,
      gradient: ['#0C130C', '#131C13', '#1A2519'],
      text: '#E6F0E2',
      muted: '#A4B7A0',
      subtle: '#D4E3D0',
      surface: '#131B13',
      surfaceAlt: '#1B281B',
      border: '#375238',
      strong: '#F3FAF0',
      primary: '#7ED27B',
      primarySoft: '#1F4020',
      selectedSurface: '#29552B',
      selectedBorder: '#7ED27B',
      selectedText: '#E2F8DF',
      actionStrong: '#7ED27B',
      actionStrongText: '#0D190D',
      divider: '#2C432D',
      input: '#162116',
      placeholder: '#95AA92',
      assistantBubble: '#1B2A1B',
      assistantBorder: '#375238',
      userBubble: '#2A5A2D',
      userBorder: '#7ED27B',
      controlSurface: '#172417',
      controlBorder: '#446A46',
      composerSurface: '#152315',
      composerBorder: '#446A46',
      composerButton: '#7ED27B',
      composerButtonText: '#0D190D',
      chatBackgroundBase: '#101710',
      chatBackgroundOverlay: 'rgba(19,27,19,0.44)',
      chatBackgroundLine: 'rgba(126,210,123,0.12)',
      chatBackgroundGridStrong: 'rgba(126,210,123,0.18)',
      chatBackgroundBandSoft: 'rgba(31,64,32,0.42)',
      chatBackgroundBandStrong: 'rgba(41,85,43,0.28)',
    },
    preview: ['#2F7D32', '#DDEFD7', '#182417'],
  },
  rose: {
    light: {
      ...CLASSIC_LIGHT_THEME,
      gradient: ['#FFFDFC', '#FFF5F6', '#FDEBED'],
      text: '#2A1820',
      muted: '#8B6574',
      subtle: '#6E4150',
      surface: '#FFF8F9',
      surfaceAlt: '#FFF0F2',
      border: '#F0CDD7',
      strong: '#2B1620',
      primary: '#C14F72',
      primarySoft: '#FFE3EB',
      selectedSurface: '#FFDDE7',
      selectedBorder: '#E58AA6',
      selectedText: '#983958',
      actionStrong: '#C14F72',
      actionStrongText: '#FFFFFF',
      divider: '#F2D9E1',
      input: '#FFFDFE',
      placeholder: '#9C7784',
      assistantBubble: '#FFF1F4',
      assistantBorder: '#F0CDD7',
      userBubble: '#FFDCE6',
      userBorder: '#EEA0B6',
      controlSurface: '#FFF4F6',
      controlBorder: '#E9B9C8',
      composerSurface: '#FFF9FA',
      composerBorder: '#E9B9C8',
      composerButton: '#C14F72',
      composerButtonText: '#FFFFFF',
      chatBackgroundBase: '#FFF4F6',
      chatBackgroundOverlay: 'rgba(255,248,249,0.56)',
      chatBackgroundLine: 'rgba(193,79,114,0.11)',
      chatBackgroundGridStrong: 'rgba(229,138,166,0.18)',
      chatBackgroundBandSoft: 'rgba(255,220,230,0.78)',
      chatBackgroundBandStrong: 'rgba(233,185,200,0.56)',
    },
    dark: {
      ...CLASSIC_DARK_THEME,
      gradient: ['#160D12', '#211219', '#2C1821'],
      text: '#F8E6EC',
      muted: '#C9A1AF',
      subtle: '#EBC6D1',
      surface: '#1A1015',
      surfaceAlt: '#281620',
      border: '#5E3341',
      strong: '#FFF1F5',
      primary: '#F08CAB',
      primarySoft: '#5A2538',
      selectedSurface: '#71314A',
      selectedBorder: '#F08CAB',
      selectedText: '#FFE7EE',
      actionStrong: '#F08CAB',
      actionStrongText: '#2A1018',
      divider: '#4D2935',
      input: '#1F1318',
      placeholder: '#B98C9B',
      assistantBubble: '#2A1820',
      assistantBorder: '#5E3341',
      userBubble: '#6B2E45',
      userBorder: '#F08CAB',
      controlSurface: '#24151C',
      controlBorder: '#6C4050',
      composerSurface: '#22141A',
      composerBorder: '#6C4050',
      composerButton: '#F08CAB',
      composerButtonText: '#2A1018',
      chatBackgroundBase: '#180F14',
      chatBackgroundOverlay: 'rgba(26,16,21,0.44)',
      chatBackgroundLine: 'rgba(240,140,171,0.12)',
      chatBackgroundGridStrong: 'rgba(240,140,171,0.18)',
      chatBackgroundBandSoft: 'rgba(90,37,56,0.42)',
      chatBackgroundBandStrong: 'rgba(113,49,74,0.28)',
    },
    preview: ['#C14F72', '#FFDCE6', '#2A1820'],
  },
};

export function normalizeThemePreset(value: unknown): ThemePreset {
  return typeof value === 'string' && value in THEME_PRESETS
    ? (value as ThemePreset)
    : DEFAULT_THEME_PRESET;
}

export function getThemePresetSwatches(preset: ThemePreset): readonly [string, string, string] {
  return THEME_PRESETS[normalizeThemePreset(preset)].preview;
}

export function normalizeChatBackgroundPreset(value: unknown): ChatBackgroundPreset {
  return typeof value === 'string' && CHAT_BACKGROUND_PRESET_OPTIONS.includes(value as ChatBackgroundPreset)
    ? (value as ChatBackgroundPreset)
    : DEFAULT_CHAT_BACKGROUND_PRESET;
}

export function normalizeChatBackgroundImageOpacity(value: unknown): ChatBackgroundImageOpacity {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_CHAT_BACKGROUND_IMAGE_OPACITY;
  }

  return Math.round(
    Math.max(CHAT_BACKGROUND_IMAGE_OPACITY_MIN, Math.min(CHAT_BACKGROUND_IMAGE_OPACITY_MAX, numericValue)) * 100
  ) / 100;
}

export function normalizeChatBubbleOpacity(value: unknown): ChatBubbleOpacity {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_CHAT_BUBBLE_OPACITY;
  }

  return Math.round(
    Math.max(CHAT_BUBBLE_OPACITY_MIN, Math.min(CHAT_BUBBLE_OPACITY_MAX, numericValue)) * 100
  ) / 100;
}

function clampUnitInterval(value: number) {
  return Math.max(0, Math.min(1, value));
}

function roundAlpha(value: number) {
  return Math.round(clampUnitInterval(value) * 1000) / 1000;
}

function parseHexColor(color: string): ParsedColor | null {
  const trimmed = color.trim();
  if (!trimmed.startsWith('#')) {
    return null;
  }

  const hex = trimmed.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    const [r, g, b, a = 'F'] = hex.split('');
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
      a: roundAlpha(Number.parseInt(`${a}${a}`, 16) / 255),
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: roundAlpha(hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1),
    };
  }

  return null;
}

function parseRgbColor(color: string): ParsedColor | null {
  const match = color
    .trim()
    .match(/^rgba?\(\s*(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*(?:,|\/)\s*([0-9]*\.?[0-9]+)\s*)?\)$/i);
  if (!match) {
    return null;
  }

  return {
    r: Math.max(0, Math.min(255, Number.parseInt(match[1], 10))),
    g: Math.max(0, Math.min(255, Number.parseInt(match[2], 10))),
    b: Math.max(0, Math.min(255, Number.parseInt(match[3], 10))),
    a: roundAlpha(match[4] ? Number.parseFloat(match[4]) : 1),
  };
}

function parseColor(color: string): ParsedColor | null {
  return parseHexColor(color) ?? parseRgbColor(color);
}

function formatRgbaColor({ r, g, b, a }: ParsedColor) {
  return `rgba(${r}, ${g}, ${b}, ${roundAlpha(a)})`;
}

export function withColorAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (!parsed) {
    return color;
  }

  return formatRgbaColor({
    ...parsed,
    a: alpha,
  });
}

export function multiplyColorAlpha(color: string, factor: number): string {
  const parsed = parseColor(color);
  if (!parsed) {
    return color;
  }

  return formatRgbaColor({
    ...parsed,
    a: parsed.a * clampUnitInterval(factor),
  });
}

export function getChatBackgroundPresetSwatches(
  theme: AppTheme,
  preset: ChatBackgroundPreset
): readonly [string, string, string] {
  void normalizeChatBackgroundPreset(preset);
  return [theme.chatBackgroundBase, theme.surfaceAlt, theme.chatBackgroundOverlay];
}

export function resolveTheme(
  mode: ThemeMode,
  preset: ThemePreset,
  systemScheme: 'light' | 'dark' | null | undefined
): AppTheme {
  const scheme = mode === 'system' ? systemScheme ?? 'light' : mode;
  const resolvedPreset = normalizeThemePreset(preset);
  return scheme === 'dark' ? THEME_PRESETS[resolvedPreset].dark : THEME_PRESETS[resolvedPreset].light;
}

export function normalizeSystemColorScheme(value: ColorSchemeName | null | undefined): 'light' | 'dark' | null {
  return value === 'dark' || value === 'light' ? value : null;
}
