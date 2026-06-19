// Theme / Design System for Budget Buddy
// Dark mode with vibrant accent colors

export const Colors = {
  // Base
  background: '#0A0E1A',
  surface: '#131829',
  surfaceElevated: '#1A2035',
  surfaceHighlight: '#222842',
  
  // Text
  textPrimary: '#F0F2F8',
  textSecondary: '#8B92A8',
  textMuted: '#5A6178',
  
  // Brand
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4834D4',
  
  // Accent
  accent: '#00D2FF',
  accentGreen: '#00E676',
  accentAmber: '#FFB74D',
  accentRed: '#FF5252',
  accentPink: '#FF6B9D',
  
  // Status
  success: '#00E676',
  warning: '#FFB74D',
  danger: '#FF5252',
  info: '#00D2FF',
  
  // Category Colors
  categoryRent: '#6C5CE7',
  categoryGroceries: '#00E676',
  categoryTransport: '#00D2FF',
  categoryUtilities: '#FFB74D',
  categoryEntertainment: '#FF6B9D',
  categoryShopping: '#FF5252',
  categoryHealthcare: '#26C6DA',
  categorySavings: '#7C4DFF',
  categoryMiscellaneous: '#8B92A8',
  
  // Cards
  cardGradientStart: '#1A2035',
  cardGradientEnd: '#131829',
  
  // Borders
  border: '#2A3050',
  borderLight: '#333A55',
  
  // Overlay
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

export const Typography = {
  hero: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  number: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
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
