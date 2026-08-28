// Shared design tokens for the mobile app — mirrors web/app/globals.css so
// both clients feel like the same product.

export const colors = {
  bg: '#f3f6fb',
  surface: '#ffffff',
  surface2: '#f8fafd',
  text: '#10182b',
  textMuted: '#6b7686',
  textFaint: '#9aa4b2',
  accent: '#2f6fed',
  accentHover: '#2559c9',
  accentSoft: '#e8f0fe',
  accentGradient: ['#dceafe', '#f3f8ff'],
  border: '#e6eaf2',
  borderSoft: '#eef1f7',
  danger: '#e0473e',
  dangerSoft: '#fdeceb',
  success: '#1f9d63',
  successSoft: '#e5f8ee',
  warning: '#b8791a',
  warningSoft: '#fdf3e0',
  white: '#ffffff',
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadow = {
  shadowColor: '#10182b',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const statusColors = {
  confirmed: { bg: colors.successSoft, text: colors.success },
  cancelled: { bg: colors.dangerSoft, text: colors.danger },
  rescheduled: { bg: colors.warningSoft, text: colors.warning },
};
