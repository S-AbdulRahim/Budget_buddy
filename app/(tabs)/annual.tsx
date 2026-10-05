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
import { Colors, Spacing, BorderRadius, Typography, Shadows, formatCurrencyFull, getCategoryColor, TabularNums, withAlpha } from '../../src/theme';
import { loadData } from '../../src/data/storage';
import { AppData } from '../../src/types';

const TABLE_HEADER_HEIGHT = 44;
const TABLE_ROW_HEIGHT = 42;
const CATEGORY_COL_WIDTH = 110;
const MONTH_COL_WIDTH = 65;

export default function AnnualScreen() {
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
        <Ionicons name="calendar" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading annual overview...</Text>
      </View>
    );
  }

  const categoryNames = Object.keys(data.annualProjections[0]?.categories || {});
  const annualTotal = data.annualProjections.reduce((sum, m) => sum + m.total, 0);
  const annualByCat: { [key: string]: number } = {};
  categoryNames.forEach(cat => {
    annualByCat[cat] = data.annualProjections.reduce(
      (sum, m) => sum + (m.categories[cat] || 0),
      0
    );
  });

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
      <Text style={styles.title}>Annual Plan</Text>
      <Text style={styles.subtitle}>12-month budget projection</Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.primary }]}>
          <Text style={styles.summaryLabel}>Annual Budget</Text>
          <Text style={styles.summaryValue}>{formatCurrencyFull(annualTotal)}</Text>
          <Text style={styles.summaryNote}>12 months</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.accentGreen }]}>
          <Text style={styles.summaryLabel}>Monthly Avg</Text>
          <Text style={[styles.summaryValue, { color: Colors.accentGreen }]}>
            {formatCurrencyFull(Math.round(annualTotal / 12))}
          </Text>
          <Text style={styles.summaryNote}>per month</Text>
        </View>
      </View>

      {/* Category Annual Totals */}
      <Text style={styles.sectionTitle}>Annual by Category</Text>
      <View style={styles.catTotalCard}>
        {categoryNames.map((cat, index) => {
          const catTotal = annualByCat[cat];
          const catColor = getCategoryColor(cat);
          const percentage = annualTotal > 0 ? (catTotal / annualTotal) * 100 : 0;
          const isLast = index === categoryNames.length - 1;

          return (
            <View key={cat} style={[styles.catRow, isLast && styles.catRowLast]}>
              <View style={styles.catLeft}>
                <View style={[styles.catDot, { backgroundColor: catColor }]} />
                <Text style={styles.catName}>{cat}</Text>
              </View>
              <View style={styles.catRight}>
                <View style={styles.catBarTrack}>
                  <View
                    style={[
                      styles.catBarFill,
                      { width: `${percentage}%`, backgroundColor: catColor },
                    ]}
                  />
                </View>
                <Text style={styles.catTotal}>{formatCurrencyFull(catTotal)}</Text>
                <Text style={[styles.catPercent, { color: catColor }]}>
                  {Math.round(percentage)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Monthly Breakdown Table */}
      <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
      <View style={styles.table}>
        <View style={styles.tableContainer}>
          {/* Fixed Left Column: Category */}
          <View style={styles.fixedColumn}>
            {/* Header Cell */}
            <View style={[styles.tableCellFirst, styles.tableCellHeader, { height: TABLE_HEADER_HEIGHT }]}>
              <Text style={styles.tableHeaderText}>Category</Text>
            </View>

            {/* Category Rows */}
            {categoryNames.map((cat, index) => (
              <View
                key={cat}
                style={[
                  styles.tableCellFirst,
                  { height: TABLE_ROW_HEIGHT },
                  index % 2 === 1 && styles.tableRowAlt,
                ]}
              >
                <View style={[styles.miniDot, { backgroundColor: getCategoryColor(cat) }]} />
                <Text style={styles.tableCellText} numberOfLines={1}>{cat}</Text>
              </View>
            ))}

            {/* Total Row */}
            <View style={[styles.tableCellFirst, styles.tableRowTotal, { height: TABLE_ROW_HEIGHT }]}>
              <Text style={styles.tableTotalText}>TOTAL</Text>
            </View>
          </View>

          {/* Scrollable Right Columns: Months + Total */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableArea}>
            <View>
              {/* Header Row */}
              <View style={[styles.tableRow, { height: TABLE_HEADER_HEIGHT }]}>
                {data.annualProjections.map(m => (
                  <View key={m.month} style={[styles.tableCell, styles.tableCellHeader]}>
                    <Text style={styles.tableHeaderText}>{m.month}</Text>
                  </View>
                ))}
                <View style={[styles.tableCell, styles.tableCellHeader, styles.tableCellTotal]}>
                  <Text style={[styles.tableHeaderText, { color: Colors.primary }]}>Total</Text>
                </View>
              </View>

              {/* Data Rows */}
              {categoryNames.map((cat, index) => (
                <View
                  key={cat}
                  style={[
                    styles.tableRow,
                    { height: TABLE_ROW_HEIGHT },
                    index % 2 === 1 && styles.tableRowAlt,
                  ]}
                >
                  {data.annualProjections.map(m => (
                    <View key={m.month} style={styles.tableCell}>
                      <Text style={styles.tableCellValue}>
                        ₹{((m.categories[cat] || 0) / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.tableCell, styles.tableCellTotal]}>
                    <Text style={[styles.tableCellValue, styles.tableCellTotalHighlight]}>
                      ₹{(annualByCat[cat] / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
              ))}

              {/* Total Row */}
              <View style={[styles.tableRow, styles.tableRowTotal, { height: TABLE_ROW_HEIGHT }]}>
                {data.annualProjections.map(m => (
                  <View key={m.month} style={styles.tableCell}>
                    <Text style={styles.tableTotalValue}>
                      ₹{(m.total / 1000).toFixed(0)}K
                    </Text>
                  </View>
                ))}
                <View style={[styles.tableCell, styles.tableCellTotal]}>
                  <Text style={[styles.tableTotalValue, { color: Colors.primary }]}>
                    ₹{(annualTotal / 1000).toFixed(0)}K
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    ...Shadows.card,
  },
  summaryLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  summaryNote: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  catTotalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catRowLast: {
    borderBottomWidth: 0,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 120,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  catRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  catBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  catTotal: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 70,
    textAlign: 'right',
  },
  catPercent: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
    width: 35,
    textAlign: 'right',
  },
  table: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableContainer: {
    flexDirection: 'row',
  },
  fixedColumn: {
    width: CATEGORY_COL_WIDTH,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    zIndex: 1,
  },
  scrollableArea: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowAlt: {
    backgroundColor: withAlpha(Colors.surfaceHighlight, 0.4),
  },
  tableRowTotal: {
    backgroundColor: withAlpha(Colors.primary, 0.1),
    borderTopWidth: 2,
    borderTopColor: withAlpha(Colors.primary, 0.3),
  },
  tableCell: {
    width: MONTH_COL_WIDTH,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(Colors.border, 0.4),
    flexDirection: 'row',
  },
  tableCellHeader: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableCellFirst: {
    width: CATEGORY_COL_WIDTH,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(Colors.border, 0.4),
    flexDirection: 'row',
  },
  tableCellTotal: {
    backgroundColor: withAlpha(Colors.primary, 0.08),
  },
  tableCellTotalHighlight: {
    color: Colors.primary,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
  },
  tableHeaderText: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontFamily: Typography.bodyBold.fontFamily,
    textTransform: 'uppercase',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tableCellText: {
    ...Typography.small,
    color: Colors.textPrimary,
    flex: 1,
  },
  tableCellValue: {
    ...Typography.small,
    color: Colors.textSecondary,
    ...TabularNums,
  },
  tableTotalText: {
    ...Typography.small,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyBold.fontFamily,
    letterSpacing: 1,
  },
  tableTotalValue: {
    ...Typography.small,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
  },
});
