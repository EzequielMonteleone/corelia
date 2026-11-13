export const colors = {
  background: '#0a0a0a',
  backgroundAlt: '#0d0f13',
  surface: '#111318',
  surfaceElevated: '#171a21',
  card: '#14161c',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',
  text: '#f8fafc',
  textSecondary: '#a1a9b8',
  textMuted: '#6b7484',
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primarySoft: 'rgba(59,130,246,0.14)',
  indigo: '#818cf8',
  indigoSoft: 'rgba(129,140,248,0.14)',
  purple: '#c084fc',
  purpleSoft: 'rgba(192,132,252,0.14)',
  success: '#34d399',
  successSoft: 'rgba(52,211,153,0.14)',
  warning: '#fbbf24',
  warningSoft: 'rgba(251,191,36,0.14)',
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.14)',
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.72)',
  inputBackground: 'rgba(255,255,255,0.05)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  title: 26,
  h1: 22,
  h2: 18,
  h3: 16,
  body: 15,
  small: 13,
  caption: 11,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;
