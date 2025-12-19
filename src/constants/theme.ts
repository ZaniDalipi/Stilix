// Modern theme configuration for Stilix
export const colors = {
  // Primary palette
  primary: '#FF385C', // Vibrant coral/red - inspired by modern fashion apps
  primaryDark: '#E31C5F',
  primaryLight: '#FF5A7D',

  // Secondary palette
  secondary: '#00A699', // Teal accent
  secondaryDark: '#008A7B',
  secondaryLight: '#00C4B4',

  // Neutrals
  white: '#FFFFFF',
  black: '#222222',

  // Grays
  gray100: '#F7F7F7',
  gray200: '#EBEBEB',
  gray300: '#DDDDDD',
  gray400: '#B0B0B0',
  gray500: '#717171',
  gray600: '#484848',

  // Status colors
  success: '#00A699',
  error: '#FF385C',
  warning: '#FFB400',
  info: '#428BFF',

  // Discount badge colors
  discount: '#E41E31',
  discountBg: '#FFEBEE',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F7F7F7',
  cardBackground: '#FFFFFF',

  // Text colors
  textPrimary: '#222222',
  textSecondary: '#717171',
  textMuted: '#B0B0B0',
  textLight: '#FFFFFF',

  // Border colors
  border: '#EBEBEB',
  borderDark: '#DDDDDD',

  // Shadow
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
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
};

export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const layout = {
  screenPadding: spacing.lg,
  cardGap: spacing.md,
  gridColumns: 2,
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  layout,
};
