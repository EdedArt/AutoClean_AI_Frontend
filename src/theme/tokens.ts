export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceDimmed: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
  danger: string;
  warning: string;
  info: string;
  disabledBackground: string;
  disabledText: string;
  disabledBorder: string;
  readOnlyBackground: string;
}

export function withAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface PhaseColor {
  bg: string;
  text: string;
  border: string;
  main: string;
}

export type WashPhaseCode = 'PENDIENTE' | 'REMOJO' | 'LAVADO' | 'SECADO' | 'LISTO';

export type PhaseColorMap = Record<WashPhaseCode, PhaseColor>;

export const lightPalette: ColorPalette = {
  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F7',
  surfaceDimmed: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#475569',
  border: '#E2E8F0',
  primary: '#0E7490',
  onPrimary: '#FFFFFF',
  accent: '#10B981',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#0284C7',
  disabledBackground: '#E2E8F0',
  disabledText: '#94A3B8',
  disabledBorder: '#E2E8F0',
  readOnlyBackground: '#E2E8F0',
};

export const darkPalette: ColorPalette = {
  background: '#0B1220',
  surface: '#111A2B',
  surfaceAlt: '#17233A',
  surfaceDimmed: '#131D31',
  text: '#E5EEF8',
  textMuted: '#9FB2C8',
  border: '#24324A',
  primary: '#22D3EE',
  onPrimary: '#06222B',
  accent: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#38BDF8',
  disabledBackground: '#1E293B',
  disabledText: '#8295AB',
  disabledBorder: '#24324A',
  readOnlyBackground: '#17233A',
};

export const lightPhaseColors: PhaseColorMap = {
  PENDIENTE: {
    main: '#64748B', // slate
    bg: '#F1F5F9',
    text: '#334155',
    border: '#CBD5E1',
  },
  REMOJO: {
    main: '#0284C7', // sky
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
  },
  LAVADO: {
    main: '#0E7490', // cyan
    bg: '#CFFAFE',
    text: '#0E7490',
    border: '#A5F3FC',
  },
  SECADO: {
    main: '#D97706', // amber
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  },
  LISTO: {
    main: '#10B981', // emerald
    bg: '#D1FAE5',
    text: '#065F46',
    border: '#A7F3D0',
  },
};

export const darkPhaseColors: PhaseColorMap = {
  PENDIENTE: {
    main: '#9FB2C8', // slate
    bg: 'rgba(148, 163, 184, 0.16)',
    text: '#CBD5E1',
    border: 'rgba(148, 163, 184, 0.35)',
  },
  REMOJO: {
    main: '#38BDF8', // sky
    bg: 'rgba(56, 189, 248, 0.16)',
    text: '#7DD3FC',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  LAVADO: {
    main: '#22D3EE', // cyan
    bg: 'rgba(34, 211, 238, 0.16)',
    text: '#67E8F9',
    border: 'rgba(34, 211, 238, 0.35)',
  },
  SECADO: {
    main: '#FBBF24', // amber
    bg: 'rgba(251, 191, 36, 0.16)',
    text: '#FDE68A',
    border: 'rgba(251, 191, 36, 0.35)',
  },
  LISTO: {
    main: '#34D399', // emerald
    bg: 'rgba(52, 211, 153, 0.16)',
    text: '#6EE7B7',
    border: 'rgba(52, 211, 153, 0.35)',
  },
};

export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
} as const;

export const radius = {
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  pill: 9999,
} as const;

export const typography = {
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: 'Inter_700Bold',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_600SemiBold',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter_500Medium',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;
