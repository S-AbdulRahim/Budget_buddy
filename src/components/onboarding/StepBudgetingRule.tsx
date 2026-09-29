import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, withAlpha } from '../../theme';
import { BudgetingRule } from '../../types';
import BudgetingRulePicker from '../BudgetingRulePicker';

export interface StepBudgetingRuleProps {
  selectedRule: BudgetingRule;
  onSelectRule: (rule: BudgetingRule, isValid: boolean) => void;
}

export default function StepBudgetingRule({
  selectedRule,
  onSelectRule,
}: StepBudgetingRuleProps) {
  return (
    <View style={styles.stepContainer}>
      {/* Hero Icon */}
      <View style={styles.heroIconCircle}>
        <Ionicons name="compass-outline" size={48} color={Colors.primaryLight} />
      </View>

      <Text style={styles.stepTitle}>How do you want to budget?</Text>
      <Text style={styles.stepDescription}>
        Pick a starting split, or skip it and set your own limits.
      </Text>

      {/* Rules Picker */}
      <BudgetingRulePicker
        selectedRule={selectedRule}
        onSelectRule={onSelectRule}
      />

      {/* Helper Tip Card */}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
        <Text style={styles.tipText}>
          You can change this budgeting split anytime later in Settings without resetting your category limits or spent amounts.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
    maxWidth: 440,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.25),
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    width: '100%',
  },
  tipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
});
