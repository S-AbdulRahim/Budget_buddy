import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, getStatusColor } from '../theme';

interface ProgressBarProps {
  label: string;
  spent: number;
  budget: number;
  color: string;
  showAmount?: boolean;
}

export default function ProgressBar({ label, spent, budget, color, showAmount = true }: ProgressBarProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const statusColor = getStatusColor(percentage);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percentage, { color: statusColor }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolation,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>
      {showAmount && (
        <View style={styles.footer}>
          <Text style={styles.amount}>
            ₹{spent.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.remaining, { color: spent > budget ? Colors.danger : Colors.textMuted }]}>
            {spent > budget
              ? `₹${(spent - budget).toLocaleString('en-IN')} over`
              : `₹${(budget - spent).toLocaleString('en-IN')} left`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  percentage: {
    ...Typography.caption,
    fontWeight: '700',
  },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  amount: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  remaining: {
    ...Typography.small,
  },
});
