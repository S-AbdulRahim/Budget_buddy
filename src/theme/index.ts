// Theme / Design System for Budget Buddy
// Dark mode — refined teal + gold palette (was violet + neon cyan/green)
//
// Drop-in replacement for src/theme/index.ts. Only the Colors values changed;
// Spacing, BorderRadius, Typography, Shadows and the helper functions below
// are unchanged so nothing else in the app needs to be touched.

export const Colors = {
  // Base — unchanged, this layered dark-navy system was already solid
  background: '#0A0E1A',
  surface: '#131829',
  surfaceElevated: '#1A2035',
  surfaceHighlight: '#222842',

  // Text — unchanged
  textPrimary: '#F0F2F8',
  textSecondary: '#8B92A8',
  textMuted: '#5A6178',

  // Brand — was violet (#6C5CE7), now a deep teal.
  // Distinct from the red/amber/green status colors below, so it never
  // gets mistaken for a warning or success state.
  primary: '#0F9B8E',
  primaryLight: '#4FD1C5',
  primaryDark: '#0A6E64',

  // Secondary accent — was neon cyan (#00D2FF), now a muted gold.
  // Used for the Savings Rate stat, badges, and other non-status highlights.
  accent: '#C9A24E',
  accentGreen: '#3DBE7B',   // was #00E676 — same role (safe/cleared), less neon
  accentAmber: '#F2A93B',   // was #FFB74D — same role (warning/EMI), slightly richer
  accentRed: '#E5555C',     // was #FF5252 — same role (overspent/danger), less saturated
  accentPink: '#D97757',    // was #FF6B9D — used for the "Want" toggle; warm terracotta instead of neon pink

  // Status — mirrors the accent roles above
  success: '#3DBE7B',
  warning: '#F2A93B',
  danger: '#E5555C',
  info: '#4FD1C5',

  // Category Colors — kept broadly distinguishable for the breakdown chart,
  // nudged so none of them sits directly on top of the new accentGreen/primary teal
  categoryRent: '#8B7FE8',
  categoryGroceries: '#8BC34A',
  categoryTransport: '#4FD1C5',
  categoryUtilities: '#F2A93B',
  categoryEntertainment: '#D97757',
  categoryShopping: '#E5555C',
  categoryHealthcare: '#26C6DA',
  categorySavings: '#C9A24E',
  categoryMiscellaneous: '#8B92A8',

  // Cards
  cardGradientStart: '#1A2035',
  cardGradientEnd: '#131829',

  // Borders — unchanged
  border: '#2A3050',
  borderLight: '#333A55',

  // Overlay — unchanged
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FontFamily = {
  poppinsBold: 'Poppins_700Bold',
  poppinsSemiBold: 'Poppins_600SemiBold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
};

export const TabularNums = {
  fontVariant: ['tabular-nums' as const],
};

export const Typography = {
  hero: {
    fontSize: 32,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  body: {
    fontSize: 15,
    fontFamily: FontFamily.interRegular,
  },
  bodyBold: {
    fontSize: 15,
    fontFamily: FontFamily.interSemiBold,
  },
  caption: {
    fontSize: 13,
    fontFamily: FontFamily.interMedium,
  },
  small: {
    fontSize: 11,
    fontFamily: FontFamily.interMedium,
    letterSpacing: 0.5,
  },
  badge: {
    fontSize: 10,
    fontFamily: FontFamily.interSemiBold,
    letterSpacing: 0.3,
  },
  number: {
    fontSize: 28,
    fontFamily: FontFamily.interBold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
  },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
};

export function getStatusColor(percentage: number): string {
  if (percentage >= 90) return Colors.danger;
  if (percentage >= 70) return Colors.warning;
  return Colors.success;
}

export function getCategoryColor(category: string): string {
  const map: { [key: string]: string } = {
    'Rent': Colors.categoryRent,
    'Groceries': Colors.categoryGroceries,
    'Transportation': Colors.categoryTransport,
    'Utilities': Colors.categoryUtilities,
    'Entertainment': Colors.categoryEntertainment,
    'Shopping': Colors.categoryShopping,
    'Healthcare': Colors.categoryHealthcare,
    'Savings': Colors.categorySavings,
    'Miscellaneous': Colors.categoryMiscellaneous,
  };
  return map[category] || Colors.textMuted;
}

export function getCategoryIcon(category: string): string {
  const map: { [key: string]: string } = {
    'Rent': 'home',
    'Groceries': 'cart',
    'Transportation': 'car',
    'Utilities': 'flash',
    'Entertainment': 'game-controller',
    'Shopping': 'bag-handle',
    'Healthcare': 'medkit',
    'Savings': 'wallet',
    'Miscellaneous': 'ellipsis-horizontal-circle',
  };
  return map[category] || 'help-circle';
}

export function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}