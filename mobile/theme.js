// Shared design tokens for the mobile app — mirrors web/app/globals.css so
// both clients feel like the same product. Direction A: "clinical warmth" —
// deep teal + a single warm coral accent, on a warm sand background.

export const colors = {
  bg: '#f6f4ee',
  surface: '#ffffff',
  surface2: '#f1ede2',
  text: '#1c2420',
  textMuted: '#5b655f',
  textFaint: '#8b9289',
  accent: '#0e6b58',
  accentHover: '#0b5445',
  accentSoft: '#dceee8',
  accentDisabled: '#a7c4bc',
  accentGradient: ['#12806a', '#0b5445'],
  coral: '#e1603a',
  coralSoft: '#fbe6de',
  border: '#e4dfd1',
  borderSoft: '#ece7d9',
  danger: '#c73b33',
  dangerSoft: '#fbe6e3',
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

export const shadow = {
  shadowColor: '#1c2420',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const statusColors = {
  confirmed: { bg: colors.successSoft, text: colors.success },
  cancelled: { bg: colors.dangerSoft, text: colors.danger },
  rescheduled: { bg: colors.warningSoft, text: colors.warning },
};
