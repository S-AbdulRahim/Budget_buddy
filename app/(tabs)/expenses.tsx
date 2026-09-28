import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/theme';
import { loadData, addExpense, deleteExpense } from '../../src/data/storage';
import { AppData } from '../../src/types';
import ExpenseItem from '../../src/components/ExpenseItem';
import AddExpenseModal from '../../src/components/AddExpenseModal';
import ConfirmModal from '../../src/components/ConfirmModal';

export default function ExpensesScreen() {
  const [data, setData] = useState<AppData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; description: string } | null>(null);

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
    setDeleteTarget({ id, description });
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      const updated = await deleteExpense(deleteTarget.id);
      setData(updated);
      setDeleteTarget(null);
    }
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

        <View style={{ height: Spacing.huge * 2 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddExpense}
        categories={data.categories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteTarget !== null}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deleteTarget?.description}"?`}
        cancelText="Cancel"
        confirmText="Delete"
        confirmStyle="destructive"
        icon="trash-outline"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
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
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
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
    marginTop: Spacing.xs,
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
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.elevated,
  },
});
