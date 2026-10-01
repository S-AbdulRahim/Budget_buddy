import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, TabularNums, withAlpha, formatCurrencyFull } from '../theme';
import { CardTransaction, Category, CreditCard } from '../types';

interface PendingTransactionsModalProps {
  visible: boolean;
  transactions: CardTransaction[];
  cards: CreditCard[];
  categories: Category[];
  onConfirm: (transactionId: string, details: { category: string; type?: 'Need' | 'Want'; description?: string }) => Promise<void>;
  onDismiss: (transactionId: string) => Promise<void>;
  onClose: () => void;
}

export default function PendingTransactionsModal({
  visible,
  transactions,
  cards,
  categories,
  onConfirm,
  onDismiss,
  onClose,
}: PendingTransactionsModalProps) {
  // State for user's selected category & type per transaction: Record<txId, { category: string, type: 'Need' | 'Want' }>
  const [selections, setSelections] = useState<Record<string, { category: string; type: 'Need' | 'Want' }>>({});

  const getSelection = (tx: CardTransaction) => {
    if (selections[tx.id]) {
      return selections[tx.id];
    }
    // Default to Groceries / Shopping or first category
    const defaultCat =
      categories.find(c => c.name === 'Shopping') ||
      categories.find(c => c.name === 'Groceries') ||
      categories[0];
    const categoryName = defaultCat ? defaultCat.name : 'Shopping';
    const type: 'Need' | 'Want' = defaultCat?.group === 'Needs' ? 'Need' : 'Want';
    return { category: categoryName, type };
  };

  const handleSelectCategory = (txId: string, category: Category) => {
    const type: 'Need' | 'Want' = category.group === 'Needs' ? 'Need' : 'Want';
    setSelections(prev => ({
      ...prev,
      [txId]: { category: category.name, type },
    }));
  };

  const handleToggleType = (txId: string) => {
    const current = getSelection(transactions.find(t => t.id === txId)!);
    setSelections(prev => ({
      ...prev,
      [txId]: { ...current, type: current.type === 'Need' ? 'Want' : 'Need' },
    }));
  };

  const renderTransactionItem = ({ item }: { item: CardTransaction }) => {
    const card = cards.find(c => c.id === item.cardId);
    const sel = getSelection(item);

    return (
      <View style={styles.cardItem}>
        {/* Header: Card info + Amount */}
        <View style={styles.cardItemHeader}>
          <View style={styles.cardBadge}>
            <View style={[styles.cardDot, { backgroundColor: card?.color || Colors.primary }]} />
            <Text style={styles.cardBadgeText}>
              {card ? `${card.nickname} (•••• ${card.last4})` : 'Credit Card'}
            </Text>
          </View>
          <Text style={styles.amountText}>{formatCurrencyFull(item.amount)}</Text>
        </View>

        {/* Merchant & Date */}
        <View style={styles.merchantRow}>
          <View style={styles.merchantIconWrap}>
            <Ionicons name="cart-outline" size={18} color={Colors.primaryLight} />
          </View>
          <View style={styles.merchantInfo}>
            <Text style={styles.merchantName}>{item.merchant || 'Card Transaction'}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>

        {/* Ephemeral SMS Snippet (if available) */}
        {item.rawSmsSnippet ? (
          <View style={styles.snippetBox}>
            <View style={styles.snippetHeader}>
              <Ionicons name="shield-checkmark-outline" size={12} color={Colors.accentGreen} />
              <Text style={styles.snippetLabel}>On-device snippet (discarded upon review)</Text>
            </View>
            <Text style={styles.snippetText} numberOfLines={2}>
              {item.rawSmsSnippet}
            </Text>
          </View>
        ) : null}

        {/* Category Picker */}
        <Text style={styles.sectionMiniTitle}>Assign Budget Category</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.categoryChipsList}
          renderItem={({ item: cat }) => {
            const isSelected = sel.category === cat.name;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  isSelected && {
                    backgroundColor: withAlpha(cat.color || Colors.primary, 0.2),
                    borderColor: cat.color || Colors.primary,
                  },
                ]}
                onPress={() => handleSelectCategory(item.id, cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && { color: cat.color || Colors.primaryLight, fontFamily: Typography.bodyBold.fontFamily },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Need vs Want & Actions */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[
              styles.typeToggle,
              sel.type === 'Need' ? styles.typeNeed : styles.typeWant,
            ]}
            onPress={() => handleToggleType(item.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Toggle type, currently ${sel.type}`}
          >
            <Ionicons
              name={sel.type === 'Need' ? 'shield-outline' : 'heart-outline'}
              size={14}
              color={sel.type === 'Need' ? Colors.groupNeeds : Colors.groupWants}
            />
            <Text
              style={[
                styles.typeToggleText,
                { color: sel.type === 'Need' ? Colors.groupNeeds : Colors.groupWants },
              ]}
            >
              {sel.type}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => onDismiss(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Dismiss transaction"
            >
              <Ionicons name="close" size={16} color={Colors.textSecondary} />
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() =>
                onConfirm(item.id, {
                  category: sel.category,
                  type: sel.type,
                  description: item.merchant,
                })
              }
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Confirm and add transaction to expenses"
            >
              <Ionicons name="checkmark" size={16} color={Colors.onPrimary} />
              <Text style={styles.confirmText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons name="card-outline" size={24} color={Colors.primary} />
                  <Text style={styles.headerTitle}>Review Detected Spends</Text>
                  {transactions.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{transactions.length}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close pending review modal"
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Transactions List */}
              {transactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="checkmark-circle-outline" size={48} color={Colors.accentGreen} />
                  </View>
                  <Text style={styles.emptyTitle}>All Caught Up!</Text>
                  <Text style={styles.emptySubtitle}>
                    There are no pending card transactions awaiting review.
                  </Text>
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.doneBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={transactions}
                  keyExtractor={item => item.id}
                  renderItem={renderTransactionItem}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.onPrimary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  listContent: {
    gap: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  cardBadgeText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  amountText: {
    ...Typography.subtitle,
    ...TabularNums,
    color: Colors.accentRed,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  merchantIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: withAlpha(Colors.primary, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  dateText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  snippetBox: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accentGreen,
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  snippetLabel: {
    ...Typography.badge,
    color: Colors.accentGreen,
  },
  snippetText: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionMiniTitle: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  categoryChipsList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  typeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  typeNeed: {
    backgroundColor: withAlpha(Colors.groupNeeds, 0.12),
    borderColor: withAlpha(Colors.groupNeeds, 0.3),
  },
  typeWant: {
    backgroundColor: withAlpha(Colors.groupWants, 0.12),
    borderColor: withAlpha(Colors.groupWants, 0.3),
  },
  typeToggleText: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dismissText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryButton,
  },
  confirmText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.onPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIconWrap: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  doneBtn: {
    backgroundColor: Colors.primaryButton,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  doneBtnText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
});
