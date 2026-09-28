import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  TabularNums,
  formatCurrencyFull,
  withAlpha,
} from '../../theme';
import BrandMark from '../BrandMark';

export interface CompletionProps {
  salary: number;
  totalBudget: number;
  needsBudget: number;
  wantsBudget: number;
  savingsBudget: number;
  hasDebt: boolean;
  debtPayoffTarget: string;
  goalsCount: number;
  onGoToDashboard: () => void;
  animValue: Animated.Value;
  contentWidth: number;
}

export default function Completion({
  salary,
  totalBudget,
  needsBudget,
  wantsBudget,
  savingsBudget,
  hasDebt,
  debtPayoffTarget,
  goalsCount,
  onGoToDashboard,
  animValue,
  contentWidth,
}: CompletionProps) {
  const cardWidth = Math.max(280, Math.min(contentWidth - Spacing.xl * 2, 540));

  // Compute 50/30/20 allocation percentages
  const safeSalary = salary > 0 ? salary : 1;
  const needsPct = Math.round((needsBudget / safeSalary) * 100);
  const wantsPct = Math.round((wantsBudget / safeSalary) * 100);
  const savingsPct = Math.round((savingsBudget / safeSalary) * 100);
  const unallocatedPct = Math.max(0, 100 - (needsPct + wantsPct + savingsPct));

  return (
    <ScrollView
      contentContainerStyle={styles.completionScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.completionCard,
          { width: cardWidth },
          {
            opacity: animValue,
            transform: [
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* BrandMark Header */}
        <BrandMark size="lg" direction="column" style={styles.brandMarkHeader} />

        {/* Success checkmark badge */}
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
        </View>

        <Text style={styles.completionTitle}>You're all set!</Text>
        <Text style={styles.completionDescription}>
          Your budget plan is configured and stored safely on your device.
        </Text>

        {/* 50/30/20 Stacked Split Bar Card */}
        <View style={styles.stackedBarCard}>
          <View style={styles.stackedBarHeader}>
            <Text style={styles.stackedBarTitle}>50 / 30 / 20 Budget Split</Text>
            <Text style={styles.stackedBarSub}>
              {formatCurrencyFull(totalBudget)} of {formatCurrencyFull(salary)}
            </Text>
          </View>

          {/* Stacked Multi-Segment Bar */}
          <View style={styles.stackedTrack}>
            {needsPct > 0 && (
              <View
                style={[
                  styles.stackedSegment,
                  { width: `${needsPct}%`, backgroundColor: Colors.groupNeeds },
                ]}
              />
            )}
            {wantsPct > 0 && (
              <View
                style={[
                  styles.stackedSegment,
                  { width: `${wantsPct}%`, backgroundColor: Colors.groupWants },
                ]}
              />
            )}
            {savingsPct > 0 && (
              <View
                style={[
                  styles.stackedSegment,
                  { width: `${savingsPct}%`, backgroundColor: Colors.groupSavings },
                ]}
              />
            )}
            {unallocatedPct > 0 && (
              <View
                style={[
                  styles.stackedSegment,
                  { width: `${unallocatedPct}%`, backgroundColor: Colors.surfaceHighlight },
                ]}
              />
            )}
          </View>

          {/* Segment Breakdown Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.groupNeeds }]} />
              <View>
                <Text style={styles.legendLabel}>Needs: {needsPct}%</Text>
                <Text style={styles.legendTarget}>Guide: 50%</Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.groupWants }]} />
              <View>
                <Text style={styles.legendLabel}>Wants: {wantsPct}%</Text>
                <Text style={styles.legendTarget}>Guide: 30%</Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.groupSavings }]} />
              <View>
                <Text style={styles.legendLabel}>Savings: {savingsPct}%</Text>
                <Text style={styles.legendTarget}>Guide: 20%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelGroup}>
              <Ionicons name="cash-outline" size={20} color={Colors.primaryLight} />
              <Text style={styles.summaryLabel}>Monthly income</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrencyFull(salary)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelGroup}>
              <Ionicons name="pie-chart-outline" size={20} color={Colors.primaryLight} />
              <Text style={styles.summaryLabel}>Total budget allocated</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrencyFull(totalBudget)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelGroup}>
              <Ionicons name="trending-down-outline" size={20} color={Colors.accentAmber} />
              <Text style={styles.summaryLabel}>Debt payoff</Text>
            </View>
            <Text style={styles.summaryValue}>{debtPayoffTarget}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelGroup}>
              <Ionicons name="flag-outline" size={20} color={Colors.accentGreen} />
              <Text style={styles.summaryLabel}>Savings goals</Text>
            </View>
            <Text style={styles.summaryValue}>
              {goalsCount > 0 ? `${goalsCount} active goals` : 'Not configured'}
            </Text>
          </View>
        </View>

        {/* Go to Dashboard CTA */}
        <TouchableOpacity
          style={styles.completionButton}
          onPress={onGoToDashboard}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go to Dashboard"
        >
          <Text style={styles.completionButtonText}>Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.onPrimary} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  completionScrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  completionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  brandMarkHeader: {
    marginBottom: Spacing.xl,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: withAlpha(Colors.success, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.success, 0.28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  completionTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  completionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  stackedBarCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  stackedBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stackedBarTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  stackedBarSub: {
    ...Typography.small,
    color: Colors.textSecondary,
    ...TabularNums,
  },
  stackedTrack: {
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  stackedSegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
  },
  legendTarget: {
    ...Typography.small,
    color: Colors.textMuted,
    fontSize: 10,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    ...TabularNums,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  completionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  completionButtonText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
});
