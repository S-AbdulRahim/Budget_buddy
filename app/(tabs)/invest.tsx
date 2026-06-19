import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, formatCurrencyFull } from '../../src/theme';
import { loadData } from '../../src/data/storage';
import { AppData } from '../../src/types';

function AllocationBar({ value, maxValue, color }: { value: number; maxValue: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  useEffect(() => {
    Animated.timing(width, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={barStyles.track}>
      <Animated.View
        style={[
          barStyles.fill,
          {
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default function InvestScreen() {
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
        <Ionicons name="leaf" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading investments...</Text>
      </View>
    );
  }

  const totalSIP = data.investments.reduce((sum, inv) => sum + inv.monthlyAmount, 0);
  const debtCleared = data.debtPayments.every(p => p.remainingBalance === 0 && p.isPaid);

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
      <Text style={styles.title}>Halal Invest</Text>
      <Text style={styles.subtitle}>Shariah-compliant SIP plan</Text>

      {/* Lock Banner */}
      {!debtCleared && (
        <View style={styles.lockBanner}>
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={20} color={Colors.accentAmber} />
          </View>
          <View style={styles.lockContent}>
            <Text style={styles.lockTitle}>Investments Locked</Text>
            <Text style={styles.lockText}>
              SIP investments will begin after your debt of {formatCurrencyFull(data.debtTotal)} is fully cleared. 
              Stay focused on debt payoff first!
            </Text>
          </View>
        </View>
      )}

      {/* Total SIP Card */}
      <View style={styles.sipCard}>
        <View style={styles.sipCardHeader}>
          <View>
            <Text style={styles.sipLabel}>Total Monthly SIP</Text>
            <Text style={styles.sipAmount}>{formatCurrencyFull(totalSIP)}</Text>
          </View>
          <View style={styles.sipBadge}>
            <Ionicons name="leaf" size={14} color={Colors.accentGreen} />
            <Text style={styles.sipBadgeText}>Halal</Text>
          </View>
        </View>
        <Text style={styles.sipNote}>
          Post-debt allocation • {data.investments.length} funds • Equal to EMI amount
        </Text>
      </View>

      {/* Fund Cards */}
      <Text style={styles.sectionTitle}>Investment Funds</Text>
      {data.investments.map((fund, index) => (
        <View key={fund.id} style={[styles.fundCard, !debtCleared && styles.fundCardLocked]}>
          <View style={styles.fundHeader}>
            <View style={[styles.fundIconWrap, { backgroundColor: fund.color + '20' }]}>
              <Ionicons
                name={
                  index === 0 ? 'shield-checkmark' :
                  index === 1 ? 'analytics' :
                  index === 2 ? 'leaf' :
                  'airplane'
                }
                size={22}
                color={fund.color}
              />
            </View>
            <View style={styles.fundInfo}>
              <Text style={styles.fundName}>{fund.name}</Text>
              <Text style={styles.fundType}>{fund.type}</Text>
            </View>
            <View style={styles.fundAmountWrap}>
              <Text style={[styles.fundAmount, { color: fund.color }]}>
                {formatCurrencyFull(fund.monthlyAmount)}
              </Text>
              <Text style={styles.fundPer}>/month</Text>
            </View>
          </View>

          {/* Allocation Bar */}
          <View style={styles.fundAllocation}>
            <View style={styles.fundAllocationHeader}>
              <Text style={styles.fundAllocationLabel}>Allocation</Text>
              <Text style={[styles.fundAllocationPercent, { color: fund.color }]}>
                {fund.allocation}%
              </Text>
            </View>
            <AllocationBar value={fund.allocation} maxValue={100} color={fund.color} />
          </View>

          {/* Status */}
          <View style={styles.fundStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: debtCleared ? Colors.accentGreen : Colors.textMuted },
            ]} />
            <Text style={styles.statusText}>
              {debtCleared ? 'Active — Auto-debit enabled' : 'Pending — Starts after debt clearance'}
            </Text>
          </View>
        </View>
      ))}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>
          All funds are Shariah-compliant. Investment amounts equal your current EMI (₹16,700/month) — 
          redirected automatically after debt payoff.
        </Text>
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
  lockBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.accentAmber + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accentAmber + '30',
    gap: Spacing.md,
  },
  lockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentAmber + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockContent: {
    flex: 1,
  },
  lockTitle: {
    ...Typography.bodyBold,
    color: Colors.accentAmber,
    marginBottom: 4,
  },
  lockText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sipCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  sipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  sipLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sipAmount: {
    ...Typography.number,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  sipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentGreen + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accentGreen + '30',
  },
  sipBadgeText: {
    ...Typography.small,
    color: Colors.accentGreen,
    fontWeight: '700',
  },
  sipNote: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  fundCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fundCardLocked: {
    opacity: 0.7,
  },
  fundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  fundIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  fundInfo: {
    flex: 1,
  },
  fundName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  fundType: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  fundAmountWrap: {
    alignItems: 'flex-end',
  },
  fundAmount: {
    ...Typography.bodyBold,
  },
  fundPer: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  fundAllocation: {
    marginBottom: Spacing.md,
  },
  fundAllocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fundAllocationLabel: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  fundAllocationPercent: {
    ...Typography.small,
    fontWeight: '700',
  },
  fundStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  disclaimerText: {
    ...Typography.small,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
