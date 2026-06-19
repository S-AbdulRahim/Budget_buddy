import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/theme';
import { loadData, addExpense, deleteExpense } from '../../src/data/storage';
import { AppData } from '../../src/types';
import ExpenseItem from '../../src/components/ExpenseItem';
import AddExpenseModal from '../../src/components/AddExpenseModal';

export default function ExpensesScreen() {
  const [data, setData] = useState<AppData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('All');

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

  const handleAddExpense = async (expense: {
    description: string;
    category: string;
    amount: number;
    paymentMode: 'UPI' | 'Bank Transfer' | 'Cash' | 'Credit Card';
    type: 'Need' | 'Want';
    date: string;
  }) => {
    const updated = await addExpense(expense);
    setData(updated);
  };

  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteExpense(id);
            setData(updated);
          },
        },
      ]
    );
  };

  if (!data) {
    return (
      <View style={styles.loading}>
        <Ionicons name="receipt" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  const totalSpent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const categories = ['All', ...data.categories.map(c => c.name)];
  const filteredExpenses = filter === 'All'
    ? data.expenses
    : data.expenses.filter(e => e.category === filter);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Expenses</Text>
            <Text style={styles.subtitle}>{data.expenses.length} transactions</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalLabel}>Total Spent</Text>
            <Text style={styles.totalValue}>₹{totalSpent.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                filter === cat && styles.filterChipActive,
              ]}
              onPress={() => setFilter(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === cat && styles.filterTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Expense List */}
        {filteredExpenses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Tap + to log your first expense</Text>
          </View>
        ) : (
          filteredExpenses.map(expense => (
            <ExpenseItem
              key={expense.id}
              description={expense.description}
              category={expense.category}
              amount={expense.amount}
              date={expense.date}
              paymentMode={expense.paymentMode}
              type={expense.type}
              onDelete={() => handleDelete(expense.id, expense.description)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <AddExpenseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddExpense}
        categories={data.categories}
      />
    </View>
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
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  totalBadge: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    ...Typography.subtitle,
    color: Colors.accentRed,
    marginTop: 2,
  },
  filterScroll: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.xl,
  },
  filterContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.primaryLight,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge * 2,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.elevated,
  },
});
