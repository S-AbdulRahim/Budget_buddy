import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, formatCurrencyFull } from '../../src/theme';
import { loadData, toggleDebtPayment } from '../../src/data/storage';
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

  const handleTogglePayment = async (month: string) => {
    const updated = await toggleDebtPayment(month);
    setData(updated);
  };

  if (!data) {
    return (
      <View style={styles.loading}>
        <Ionicons name="trending-down" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading debt tracker...</Text>
      </View>
    );
  }

  if (data.debtTotal === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, styles.emptyContainer]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.title}>Debt Payoff</Text>
        <Text style={styles.subtitle}>Track your journey to debt freedom</Text>
        
        <View style={styles.emptyDebtCard}>
          <Ionicons name="gift-outline" size={64} color={Colors.accentGreen} />
          <Text style={styles.emptyDebtTitle}>You are debt-free!</Text>
          <Text style={styles.emptyDebtText}>
            No active debt payoffs configured. You can log debt under the Settings screen if you want to track a payoff schedule.
          </Text>
        </View>
      </ScrollView>
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
              <TouchableOpacity
                style={[
                  styles.paymentDot,
                  {
                    backgroundColor: payment.isPaid || payment.remainingBalance === 0
                      ? Colors.accentGreen
                      : Colors.surfaceHighlight,
                  },
                ]}
                onPress={() => handleTogglePayment(payment.month)}
                disabled={payment.remainingBalance === 0}
              >
                {(payment.isPaid || payment.remainingBalance === 0) && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </TouchableOpacity>
              {index < data.debtPayments.length - 1 && <View style={styles.paymentLine} />}
            </View>

            <View style={[
              styles.paymentCard,
              (payment.remainingBalance === 0 || payment.isPaid) && styles.paymentCardCleared,
            ]}>
              <View style={styles.paymentCardHeader}>
                <Text style={styles.paymentMonth}>{payment.month}</Text>
                {payment.remainingBalance === 0 ? (
                  <View style={styles.clearedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
                    <Text style={styles.clearedText}>Cleared</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.paidBadge,
                      payment.isPaid ? styles.paidBadgeActive : null
                    ]}
                    onPress={() => handleTogglePayment(payment.month)}
                  >
                    <Ionicons
                      name={payment.isPaid ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={payment.isPaid ? Colors.accentGreen : Colors.textSecondary}
                    />
                    <Text style={[
                      styles.paidBadgeText,
                      payment.isPaid ? { color: Colors.accentGreen } : null
                    ]}>
                      {payment.isPaid ? 'Paid' : 'Mark Paid'}
                    </Text>
                  </TouchableOpacity>
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
                    { color: payment.remainingBalance === 0 || payment.isPaid ? Colors.accentGreen : Colors.accentAmber },
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
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  emptyDebtCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    width: '100%',
    ...Shadows.elevated,
  },
  emptyDebtTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyDebtText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paidBadgeActive: {
    backgroundColor: Colors.accentGreen + '15',
    borderColor: Colors.accentGreen + '30',
  },
  paidBadgeText: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
