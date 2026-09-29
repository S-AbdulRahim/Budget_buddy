import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, TabularNums, getCategoryColor, getCategoryIcon, withAlpha } from '../theme';

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
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(catColor, 0.15) }]}>
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
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  paymentMode === 'UPI'
                    ? withAlpha(Colors.primary, 0.15)
                    : withAlpha(Colors.accent, 0.15),
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    paymentMode === 'UPI' ? Colors.primaryLight : Colors.accent,
                },
              ]}
            >
              {paymentMode}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  type === 'Need'
                    ? withAlpha(Colors.accentGreen, 0.15)
                    : withAlpha(Colors.accentPink, 0.15),
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    type === 'Need' ? Colors.accentGreen : Colors.accentPink,
                },
              ]}
            >
              {type}
            </Text>
          </View>
        </View>
      </View>
      
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${description}`}
        >
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
    marginBottom: Spacing.xs,
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
    width: 4,
    height: 4,
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
    ...TabularNums,
    color: Colors.accentRed,
    marginBottom: Spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.badge,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  deleteBtn: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});
