import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, withAlpha, formatCurrencyFull } from '../../theme';
import { BudgetingRule } from '../../types';
import BudgetingRulePicker from '../BudgetingRulePicker';
import InsightCard from '../InsightCard';

export interface StepBudgetingRuleProps {
  salary: number;
  selectedRule: BudgetingRule;
  onSelectRule: (rule: BudgetingRule, isValid: boolean) => void;
}

export default function StepBudgetingRule({
  salary,
  selectedRule,
  onSelectRule,
}: StepBudgetingRuleProps) {
  const getRuleInsight = (): { text: string; subtext?: string; icon: keyof typeof Ionicons.glyphMap } => {
    const formattedSalary = formatCurrencyFull(salary);
    const subtext = 'You can change this budgeting split anytime later in Settings without resetting your category limits.';

    switch (selectedRule.id) {
      case '50-30-20': {
        const y = Math.round(salary * 0.20);
        const z = y * 12;
        return {
          text: `With your ${formattedSalary} income, this sets aside ${formatCurrencyFull(y)} every month for savings and debt — that's ${formatCurrencyFull(z)} a year working for your future.`,
          subtext,
          icon: 'trending-up-outline',
        };
      }
      case '70-20-10': {
        const y = Math.round(salary * 0.20);
        const w = Math.round(salary * 0.70);
        return {
          text: `With your ${formattedSalary} income, this puts ${formatCurrencyFull(y)} every month toward savings and debt, while keeping ${formatCurrencyFull(w)} for everyday essentials.`,
          subtext,
          icon: 'shield-checkmark-outline',
        };
      }
      case '80-20': {
        const y = Math.round(salary * 0.20);
        return {
          text: `With your ${formattedSalary} income, ${formatCurrencyFull(y)} every month goes straight to savings and debt before anything else.`,
          subtext,
          icon: 'wallet-outline',
        };
      }
      case 'custom': {
        const pct = selectedRule.targets?.Savings ?? 0;
        const y = Math.round(salary * (pct / 100));
        return {
          text: `Your custom split directs ${formatCurrencyFull(y)} (${pct}%) to savings and debt every month.`,
          subtext,
          icon: 'options-outline',
        };
      }
      case 'none':
      default: {
        return {
          text: "Setting your own limits gives you full control. You can always apply a rule later in Settings.",
          subtext,
          icon: 'compass-outline',
        };
      }
    }
  };

  const insight = getRuleInsight();

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

      {/* Insight Card */}
      <InsightCard
        icon={insight.icon}
        text={insight.text}
        subtext={insight.subtext}
        style={{ marginTop: Spacing.xl }}
      />
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
});
