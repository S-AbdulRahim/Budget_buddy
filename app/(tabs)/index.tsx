import React, { useState, useCallback, useEffect } from 'react';
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
import { Colors, Spacing, BorderRadius, Typography, Shadows, formatCurrency, TabularNums, withAlpha } from '../../src/theme';
import { loadData, confirmCardTransaction, dismissCardTransaction } from '../../src/data/storage';
import { AppData } from '../../src/types';
import StatCard from '../../src/components/StatCard';
import ProgressBar from '../../src/components/ProgressBar';
import OnboardingWizard from '../../src/components/OnboardingWizard';
import PendingTransactionsModal from '../../src/components/PendingTransactionsModal';
import { setupLiveSmsListener } from '../../src/data/smsService';

export default function DashboardScreen() {
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const fetchData = useCallback(async () => {
    const loaded = await loadData();
    setData(loaded);
  }, []);

  useEffect(() => {
    const unsubscribe = setupLiveSmsListener(() => {
      fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

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
        <Ionicons name="wallet" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!data.isSetupCompleted) {
    return <OnboardingWizard onSuccess={fetchData} />;
  }

  const totalBudget = data.categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = data.categories.reduce((sum, c) => sum + c.spent, 0);
  const remaining = data.salary - totalSpent - data.debtEmi;
  const savingsRate = data.salary > 0 ? Math.round(((data.salary - totalSpent - data.debtEmi) / data.salary) * 100) : 0;
  const pendingTransactions = (data.cardTransactions || []).filter(t => t.status === 'pending');

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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>FinCompass</Text>
          <Text style={styles.month}>
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.salaryBadge}>
          <Ionicons name="cash" size={16} color={Colors.accentGreen} />
          <Text style={styles.salaryText}>₹{data.salary.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Salary Card */}
      <View style={styles.salaryCard}>
        <View style={styles.salaryCardInner}>
          <View>
            <Text style={styles.salaryLabel}>Monthly Salary</Text>
            <Text style={styles.salaryAmount}>₹{data.salary.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.salaryBreakdown}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.accentRed }]} />
              <Text style={styles.breakdownText}>Spent: ₹{totalSpent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.accentAmber }]} />
              <Text style={styles.breakdownText}>EMI: ₹{data.debtEmi.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.accentGreen }]} />
              <Text style={styles.breakdownText}>Free: ₹{remaining.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
        {/* Mini bar */}
        <View style={styles.miniBar}>
          <View style={[styles.miniBarSegment, { flex: totalSpent, backgroundColor: Colors.accentRed }]} />
          <View style={[styles.miniBarSegment, { flex: data.debtEmi, backgroundColor: Colors.accentAmber }]} />
          <View style={[styles.miniBarSegment, { flex: Math.max(remaining, 0), backgroundColor: Colors.accentGreen }]} />
        </View>
      </View>

      {/* Pending Transactions Review Banner */}
      {pendingTransactions.length > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => setShowPendingModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Review ${pendingTransactions.length} pending card transactions`}
        >
          <View style={styles.pendingBannerLeft}>
            <View style={styles.pendingBannerIcon}>
              <Ionicons name="card-outline" size={20} color={Colors.onPrimary} />
            </View>
            <View style={styles.pendingBannerTextWrap}>
              <View style={styles.pendingBannerTitleRow}>
                <Text style={styles.pendingBannerTitle}>
                  {pendingTransactions.length} Card Spend{pendingTransactions.length > 1 ? 's' : ''} Detected
                </Text>
                <View style={styles.pendingCountPill}>
                  <Text style={styles.pendingCountPillText}>{pendingTransactions.length}</Text>
                </View>
              </View>
              <Text style={styles.pendingBannerSub}>
                Tap to review & assign to budget categories
              </Text>
            </View>
          </View>
          <View style={styles.pendingBannerAction}>
            <Text style={styles.pendingBannerActionText}>Review</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primaryLight} />
          </View>
        </TouchableOpacity>
      )}

      {/* Stat Cards */}
      <View style={styles.statRow}>
        <StatCard
          icon="pie-chart"
          label="Total Budget"
          value={formatCurrency(totalBudget)}
          color={Colors.primary}
        />
        <StatCard
          icon="arrow-down-circle"
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          color={Colors.accentRed}
        />
      </View>
      <View style={styles.statRow}>
        <StatCard
          icon="shield-checkmark"
          label="Remaining"
          value={formatCurrency(remaining)}
          color={Colors.accentGreen}
          subtitle="After EMI"
        />
        <StatCard
          icon="trending-up"
          label="Savings Rate"
          value={`${savingsRate}%`}
          color={Colors.accent}
        />
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <View style={styles.categoryCard}>
          {data.categories.map(cat => (
            <ProgressBar
              key={cat.id}
              label={cat.name}
              spent={cat.spent}
              budget={cat.budget}
              color={cat.color}
            />
          ))}
        </View>
      </View>

      <View style={{ height: Spacing.xxxl }} />

      {/* Pending Transactions Modal */}
      <PendingTransactionsModal
        visible={showPendingModal}
        transactions={pendingTransactions}
        cards={data.creditCards || []}
        categories={data.categories}
        onConfirm={async (id, details) => {
          await confirmCardTransaction(id, details);
          await fetchData();
        }}
        onDismiss={async id => {
          await dismissCardTransaction(id);
          await fetchData();
        }}
        onClose={() => setShowPendingModal(false)}
      />
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
    paddingTop: Spacing.huge + Spacing.md,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xxl,
  },
  greeting: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  month: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: withAlpha(Colors.accentGreen, 0.12),
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentGreen, 0.25),
  },
  salaryText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
    color: Colors.accentGreen,
  },
  salaryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  salaryCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  salaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  salaryAmount: {
    ...Typography.number,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  salaryBreakdown: {
    gap: 6,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownText: {
    ...Typography.small,
    color: Colors.textSecondary,
    ...TabularNums,
  },
  miniBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  miniBarSegment: {
    borderRadius: 3,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.3),
  },
  pendingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  pendingBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerTextWrap: {
    flex: 1,
  },
  pendingBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pendingBannerTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  pendingCountPill: {
    backgroundColor: Colors.accentAmber,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  pendingCountPillText: {
    ...Typography.badge,
    color: Colors.surfaceElevated,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  pendingBannerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: Spacing.sm,
  },
  pendingBannerActionText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.primaryLight,
  },
});

