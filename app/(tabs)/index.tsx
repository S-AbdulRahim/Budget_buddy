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
import { Colors, Spacing, BorderRadius, Typography, Shadows, formatCurrency } from '../../src/theme';
import { loadData } from '../../src/data/storage';
import { AppData } from '../../src/types';
import StatCard from '../../src/components/StatCard';
import ProgressBar from '../../src/components/ProgressBar';
import OnboardingWizard from '../../src/components/OnboardingWizard';

export default function DashboardScreen() {
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
          <Text style={styles.greeting}>Budget Buddy</Text>
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

      {/* Stat Cards */}
      <View style={styles.statRow}>
        <StatCard
          icon="pie-chart"
          label="Total Budget"
          value={formatCurrency(totalBudget)}
          color={Colors.primary}
        />
        <View style={{ width: Spacing.md }} />
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
        <View style={{ width: Spacing.md }} />
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
    marginTop: 2,
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accentGreen + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accentGreen + '30',
  },
  salaryText: {
    ...Typography.caption,
    color: Colors.accentGreen,
    fontWeight: '700',
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
  },
});
