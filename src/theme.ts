import type { ColorSchemeName } from 'react-native';

import type { ThemeMode } from './types';

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
  dangerSoft: string;
  divider: string;
  input: string;
  placeholder: string;
  userBubble: string;
  userBorder: string;
};

const LIGHT_THEME: AppTheme = {
  scheme: 'light',
  gradient: ['#FFFFFF', '#F6F8FB', '#EEF3F8'],
  statusBar: 'dark-content',
  text: '#111827',
  muted: '#64748B',
  subtle: '#334155',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#D8E0EA',
  strong: '#111827',
  primary: '#2563EB',
  primarySoft: '#EFF6FF',
  dangerSoft: '#FEF2F2',
  divider: '#E6ECF2',
  input: '#FFFFFF',
  placeholder: '#78869D',
  userBubble: '#DBEAFE',
  userBorder: '#93C5FD',
};

const DARK_THEME: AppTheme = {
  scheme: 'dark',
  gradient: ['#0B1020', '#111827', '#172033'],
  statusBar: 'light-content',
  text: '#E5E7EB',
  muted: '#94A3B8',
  subtle: '#CBD5E1',
  surface: '#111827',
  surfaceAlt: '#1F2937',
  border: '#334155',
  strong: '#F8FAFC',
  primary: '#60A5FA',
  primarySoft: '#172554',
  dangerSoft: '#3F1D24',
  divider: '#334155',
  input: '#111827',
  placeholder: '#94A3B8',
  userBubble: '#1E3A8A',
  userBorder: '#2563EB',
};

export function resolveTheme(mode: ThemeMode, systemScheme: 'light' | 'dark' | null | undefined): AppTheme {
  const scheme = mode === 'system' ? systemScheme ?? 'light' : mode;
  return scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

export function normalizeSystemColorScheme(value: ColorSchemeName | null | undefined): 'light' | 'dark' | null {
  return value === 'dark' || value === 'light' ? value : null;
}
