import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, TabularNums, withAlpha } from '../theme';
import { Category, CreditCard } from '../types';

interface AddCardExpenseModalProps {
  visible: boolean;
  cards: CreditCard[];
  categories: Category[];
  onSave: (data: {
    cardId: string;
    amount: number;
    merchant: string;
    date: string;
    category: string;
    type: 'Need' | 'Want';
  }) => void;
  onClose: () => void;
}

export default function AddCardExpenseModal({
  visible,
  cards,
  categories,
  onSave,
  onClose,
}: AddCardExpenseModalProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.name || 'Shopping'
  );
  const [type, setType] = useState<'Need' | 'Want'>('Want');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setAmount(clean);
    if (error) setError(null);
  };

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat.name);
    setType(cat.group === 'Needs' ? 'Need' : 'Want');
  };

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    const cardId = selectedCardId || cards[0]?.id;
    if (!cardId) {
      setError('Please select a credit card');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    onSave({
      cardId,
      amount: num,
      merchant: merchant.trim() || 'Credit Card Spend',
      date: today,
      category: selectedCategory,
      type,
    });
    setAmount('');
    setMerchant('');
    onClose();
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
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons name="card-outline" size={24} color={Colors.primary} />
                  <Text style={styles.title}>Log Card Expense</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {error && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Card Selection */}
                <Text style={styles.label}>Select Card</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardChips}>
                  {cards.map(card => {
                    const isSelected = (selectedCardId || cards[0]?.id) === card.id;
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          styles.cardChip,
                          isSelected && {
                            borderColor: card.color || Colors.primary,
                            backgroundColor: withAlpha(card.color || Colors.primary, 0.15),
                          },
                        ]}
                        onPress={() => setSelectedCardId(card.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.cardDot, { backgroundColor: card.color || Colors.primary }]} />
                        <Text style={[styles.cardChipText, isSelected && { color: Colors.textPrimary, fontFamily: Typography.bodyBold.fontFamily }]}>
                          {card.nickname} (•••• {card.last4})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Amount */}
                <Text style={styles.label}>Amount</Text>
                <View style={styles.amountInputWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.amountInput, TabularNums]}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={handleAmountChange}
                    autoFocus
                  />
                </View>

                {/* Merchant / Description */}
                <Text style={styles.label}>Merchant / Description</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Amazon, Swiggy, DMart"
                  placeholderTextColor={Colors.textMuted}
                  value={merchant}
                  onChangeText={setMerchant}
                />

                {/* Category Selection */}
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryChips}>
                  {categories.map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          isSelected && {
                            borderColor: cat.color || Colors.primary,
                            backgroundColor: withAlpha(cat.color || Colors.primary, 0.2),
                          },
                        ]}
                        onPress={() => handleSelectCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && {
                              color: cat.color || Colors.primaryLight,
                              fontFamily: Typography.bodyBold.fontFamily,
                            },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Need vs Want */}
                <Text style={styles.label}>Classification</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, type === 'Need' && styles.typeBtnActiveNeed]}
                    onPress={() => setType('Need')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="shield-outline"
                      size={16}
                      color={type === 'Need' ? Colors.groupNeeds : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeBtnText,
                        type === 'Need' && { color: Colors.groupNeeds, fontFamily: Typography.bodyBold.fontFamily },
                      ]}
                    >
                      Need
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, type === 'Want' && styles.typeBtnActiveWant]}
                    onPress={() => setType('Want')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="heart-outline"
                      size={16}
                      color={type === 'Want' ? Colors.groupWants : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeBtnText,
                        type === 'Want' && { color: Colors.groupWants, fontFamily: Typography.bodyBold.fontFamily },
                      ]}
                    >
                      Want
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel manual card expense"
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSubmit}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Save manual card expense"
                >
                  <Text style={styles.saveText}>Save Expense</Text>
                </TouchableOpacity>
              </View>
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
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollArea: {
    marginVertical: Spacing.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: withAlpha(Colors.danger, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.danger, 0.3),
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    flex: 1,
  },
  label: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  cardChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  cardChipText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    ...Typography.title,
    color: Colors.primaryLight,
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    ...Typography.title,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    ...Typography.body,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtnActiveNeed: {
    backgroundColor: withAlpha(Colors.groupNeeds, 0.15),
    borderColor: Colors.groupNeeds,
  },
  typeBtnActiveWant: {
    backgroundColor: withAlpha(Colors.groupWants, 0.15),
    borderColor: Colors.groupWants,
  },
  typeBtnText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
});
