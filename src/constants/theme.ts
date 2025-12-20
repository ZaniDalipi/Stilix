// Modern theme configuration for Stilix
export const colors = {
  // Primary palette - Vibrant gradient colors
  primary: '#FF385C',
  primaryDark: '#E31C5F',
  primaryLight: '#FF5A7D',

  // Secondary palette
  secondary: '#00A699',
  secondaryDark: '#008A7B',
  secondaryLight: '#00C4B4',

  // Accent colors for variety
  accent1: '#7C3AED', // Purple
  accent2: '#F59E0B', // Amber
  accent3: '#10B981', // Emerald
  accent4: '#3B82F6', // Blue

  // Neutrals
  white: '#FFFFFF',
  black: '#1A1A2E',

  // Grays - Softer tones
  gray100: '#F8FAFC',
  gray200: '#F1F5F9',
  gray300: '#E2E8F0',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',

  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Discount badge colors
  discount: '#EF4444',
  discountBg: '#FEE2E2',
  hotDeal: '#F97316',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundGradientStart: '#667EEA',
  backgroundGradientEnd: '#764BA2',
  cardBackground: '#FFFFFF',

  // Text colors
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#FFFFFF',

  // Border colors
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Shadow
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  shadowColored: 'rgba(255, 56, 92, 0.2)',

  // Gradient colors
  gradientPink: ['#FF385C', '#FF6B6B'],
  gradientPurple: ['#7C3AED', '#A78BFA'],
  gradientBlue: ['#3B82F6', '#60A5FA'],
  gradientGreen: ['#10B981', '#34D399'],
  gradientOrange: ['#F97316', '#FBBF24'],
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 34,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const layout = {
  screenPadding: spacing.lg,
  cardGap: spacing.md,
  gridColumns: 2,
};

export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  layout,
  animations,
};
