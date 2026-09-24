import { useColorScheme } from 'react-native';
import type { NoteColor } from '../features/notes/types';

const light = {
  background: '#F6F6F8',
  surface: '#FFFFFF',
  text: '#1F1F1F',
  textMuted: '#5F6368',
  border: '#DADCE0',
  accent: '#1A73E8',
  warning: '#B06000',
  danger: '#D93025',
};

const dark: typeof light = {
  background: '#121212',
  surface: '#1E1F22',
  text: '#E8EAED',
  textMuted: '#9AA0A6',
  border: '#3C4043',
  accent: '#8AB4F8',
  warning: '#FDD663',
  danger: '#F28B82',
};

export type ThemeColors = typeof light;
export type Scheme = 'light' | 'dark';

const NOTE_BACKGROUNDS: Record<Scheme, Record<NoteColor, string>> = {
  light: {
    default: light.surface,
    red: '#FAAFA8',
    orange: '#F39F76',
    yellow: '#FFF8B8',
    green: '#E2F6D3',
    teal: '#B4DDD3',
    blue: '#D4E4ED',
    purple: '#D3BFDB',
    pink: '#F6E2DD',
    gray: '#EFEFF1',
  },
  dark: {
    default: dark.surface,
    red: '#77172E',
    orange: '#692B17',
    yellow: '#7C4A03',
    green: '#264D3B',
    teal: '#0C625D',
    blue: '#256377',
    purple: '#472E5B',
    pink: '#6C394F',
    gray: '#4B443A',
  },
};

export function useScheme(): Scheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function useThemeColors(): ThemeColors {
  return useScheme() === 'dark' ? dark : light;
}

export const noteBackground = (color: NoteColor, scheme: Scheme) =>
  NOTE_BACKGROUNDS[scheme][color];
