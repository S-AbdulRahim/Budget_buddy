import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, formatCurrencyFull } from '../../src/theme';
import { loadData } from '../../src/data/storage';
import { AppData } from '../../src/types';
import ChartBar from '../../src/components/ChartBar';

export default function DebtScreen() {
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const loaded = await loadData();
    setData(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <View style={styles.loading}>
        <Ionicons name="trending-down" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading debt tracker...</Text>
      </View>
    );
  }

  const totalPaid = data.debtPayments
    .filter(p => p.isPaid)
    .reduce((sum, p) => sum + p.emi, 0);
  const paidPercentage = (totalPaid / data.debtTotal) * 100;
  const monthsPaid = data.debtPayments.filter(p => p.isPaid).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <Text style={styles.title}>Debt Payoff</Text>
      <Text style={styles.subtitle}>Track your journey to debt freedom</Text>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Debt</Text>
            <Text style={styles.summaryValue}>{formatCurrencyFull(data.debtTotal)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Monthly EMI</Text>
            <Text style={[styles.summaryValue, { color: Colors.accentAmber }]}>
              {formatCurrencyFull(data.debtEmi)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tenure</Text>
            <Text style={[styles.summaryValue, { color: Colors.accent }]}>
              {data.debtTenure} mo
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {monthsPaid}/{data.debtTenure} months completed
            </Text>
            <Text style={[styles.progressPercent, { color: Colors.accentGreen }]}>
              {Math.round(paidPercentage)}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${paidPercentage}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressFooterText}>
              Paid: {formatCurrencyFull(totalPaid)}
            </Text>
            <Text style={styles.progressFooterText}>
              Remaining: {formatCurrencyFull(data.debtTotal - totalPaid)}
            </Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Payoff Chart</Text>
        <View style={styles.chartCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartRow}>
              {data.debtPayments.map((payment, index) => (
                <ChartBar
                  key={index}
                  label={payment.month}
                  value={payment.remainingBalance}
                  maxValue={data.debtTotal}
                  color={payment.remainingBalance === 0 ? Colors.accentGreen : Colors.primary}
                  height={140}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Payment Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        {data.debtPayments.map((payment, index) => (
          <View key={index} style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <View style={[
                styles.paymentDot,
                {
                  backgroundColor: payment.isPaid
                    ? Colors.accentGreen
                    : payment.remainingBalance === 0
                      ? Colors.accentGreen
                      : Colors.surfaceHighlight,
                },
              ]}>
                {(payment.isPaid || payment.remainingBalance === 0) && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              {index < data.debtPayments.length - 1 && <View style={styles.paymentLine} />}
            </View>

            <View style={[
              styles.paymentCard,
              payment.remainingBalance === 0 && styles.paymentCardCleared,
            ]}>
              <View style={styles.paymentCardHeader}>
                <Text style={styles.paymentMonth}>{payment.month}</Text>
                {payment.remainingBalance === 0 && (
                  <View style={styles.clearedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
                    <Text style={styles.clearedText}>Cleared</Text>
                  </View>
                )}
              </View>
              <View style={styles.paymentDetails}>
                <View style={styles.paymentDetail}>
                  <Text style={styles.paymentDetailLabel}>EMI</Text>
                  <Text style={styles.paymentDetailValue}>
                    {formatCurrencyFull(payment.emi)}
                  </Text>
                </View>
                <View style={styles.paymentDetail}>
                  <Text style={styles.paymentDetailLabel}>Remaining</Text>
                  <Text style={[
                    styles.paymentDetailValue,
                    { color: payment.remainingBalance === 0 ? Colors.accentGreen : Colors.accentAmber },
                  ]}>
                    {formatCurrencyFull(payment.remainingBalance)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: 60,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.xxl,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadows.elevated,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  progressPercent: {
    ...Typography.caption,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentGreen,
    borderRadius: BorderRadius.full,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  progressFooterText: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  chartCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
    minWidth: '100%',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  paymentLeft: {
    alignItems: 'center',
    width: 30,
  },
  paymentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  paymentLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: -2,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginLeft: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentCardCleared: {
    borderColor: Colors.accentGreen + '40',
    backgroundColor: Colors.accentGreen + '08',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentMonth: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  clearedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentGreen + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  clearedText: {
    ...Typography.small,
    color: Colors.accentGreen,
    fontWeight: '700',
  },
  paymentDetails: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  paymentDetail: {},
  paymentDetailLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  paymentDetailValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
});
