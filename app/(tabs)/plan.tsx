import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, withAlpha } from '../../src/theme';
import { loadData } from '../../src/data/storage';
import { AppData } from '../../src/types';
import DebtSection from '../../src/components/plan/DebtSection';
import InvestSection from '../../src/components/plan/InvestSection';

export default function PlanScreen() {
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'Debt' | 'Invest'>('Debt');
  const [hasInitializedSegment, setHasInitializedSegment] = useState(false);

  const fetchData = useCallback(async () => {
    const loaded = await loadData();
    setData(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (data && !hasInitializedSegment) {
      if (data.debtTotal === 0) {
        setActiveSegment('Invest');
      } else {
        setActiveSegment('Debt');
      }
      setHasInitializedSegment(true);
    }
  }, [data, hasInitializedSegment]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <View style={styles.loading}>
        <Ionicons name="trending-down" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Plan</Text>
        <Text style={styles.subtitle}>Debt payoff & wealth building</Text>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'Debt' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('Debt')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Debt payoff plan"
            accessibilityState={{ selected: activeSegment === 'Debt' }}
          >
            <Ionicons
              name={activeSegment === 'Debt' ? 'trending-down' : 'trending-down-outline'}
              size={18}
              color={activeSegment === 'Debt' ? Colors.primaryLight : Colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'Debt' && styles.segmentTextActive,
              ]}
            >
              Debt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'Invest' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('Invest')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Investment and savings goals"
            accessibilityState={{ selected: activeSegment === 'Invest' }}
          >
            <Ionicons
              name={activeSegment === 'Invest' ? 'leaf' : 'leaf-outline'}
              size={18}
              color={activeSegment === 'Invest' ? Colors.primaryLight : Colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'Invest' && styles.segmentTextActive,
              ]}
            >
              Invest
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segment Content */}
      <View style={styles.contentWrap}>
        {activeSegment === 'Debt' ? (
          <DebtSection
            data={data}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onDataUpdated={setData}
          />
        ) : (
          <InvestSection
            data={data}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onSwitchToDebt={() => setActiveSegment('Debt')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.huge + Spacing.md,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    ...Shadows.subtle,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: withAlpha(Colors.primary, 0.2),
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.5),
  },
  segmentText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    ...Typography.bodyBold,
    color: Colors.primaryLight,
  },
  contentWrap: {
    flex: 1,
  },
});
