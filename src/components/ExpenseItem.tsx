import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, getCategoryColor, getCategoryIcon } from '../theme';

interface ExpenseItemProps {
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMode: string;
  type: string;
  onDelete?: () => void;
}

export default function ExpenseItem({
  description,
  category,
  amount,
  date,
  paymentMode,
  type,
  onDelete,
}: ExpenseItemProps) {
  const catColor = getCategoryColor(category);
  const catIcon = getCategoryIcon(category);
  
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: catColor + '20' }]}>
        <Ionicons name={catIcon as any} size={22} color={catColor} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>{description}</Text>
        <View style={styles.meta}>
          <Text style={styles.category}>{category}</Text>
          <View style={styles.dot} />
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>
      
      <View style={styles.right}>
        <Text style={styles.amount}>-₹{amount.toLocaleString('en-IN')}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: paymentMode === 'UPI' ? '#6C5CE720' : '#00D2FF20' }]}>
            <Text style={[styles.badgeText, { color: paymentMode === 'UPI' ? '#6C5CE7' : '#00D2FF' }]}>
              {paymentMode}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: type === 'Need' ? '#00E67620' : '#FF6B9D20' }]}>
            <Text style={[styles.badgeText, { color: type === 'Need' ? '#00E676' : '#FF6B9D' }]}>
              {type}
            </Text>
          </View>
        </View>
      </View>
      
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  description: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: Spacing.sm,
  },
  date: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  amount: {
    ...Typography.bodyBold,
    color: Colors.accentRed,
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});
