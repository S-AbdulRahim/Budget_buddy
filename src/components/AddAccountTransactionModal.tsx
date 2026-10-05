import React, { useState, useEffect } from 'react';
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
import { Colors, Spacing, BorderRadius, Typography, TabularNums, withAlpha } from '../theme';
import { BankAccount, Category } from '../types';

interface AddAccountTransactionModalProps {
  visible: boolean;
  accounts: BankAccount[];
  categories: Category[];
  initialAccountId?: string;
  onSave: (data: {
    accountId: string;
    amount: number;
    description: string;
    date: string;
    type: 'debit' | 'credit';
    category?: string;
    expenseType?: 'Need' | 'Want';
  }) => void;
  onClose: () => void;
}

export default function AddAccountTransactionModal({
  visible,
  accounts,
  categories,
  initialAccountId,
  onSave,
  onClose,
}: AddAccountTransactionModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || 'Groceries');
  const [expenseType, setExpenseType] = useState<'Need' | 'Want'>('Need');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedAccountId(initialAccountId || accounts[0]?.id || '');
      setAmount('');
      setDescription('');
      setTxType('debit');
      if (categories.length > 0) {
        setSelectedCategory(categories[0].name);
        setExpenseType(categories[0].group === 'Wants' ? 'Want' : 'Need');
      }
      setError(null);
    }
  }, [visible, accounts, categories, initialAccountId]);

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    const cat = categories.find(c => c.name === catName);
    if (cat?.group === 'Wants') {
      setExpenseType('Want');
    } else {
      setExpenseType('Need');
    }
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description or payee');
      return;
    }
    if (!selectedAccountId) {
      setError('Please select a bank account');
      return;
    }

    onSave({
      accountId: selectedAccountId,
      amount: parsedAmount,
      description: description.trim(),
      date: new Date().toISOString().split('T')[0],
      type: txType,
      category: txType === 'debit' ? selectedCategory : undefined,
      expenseType: txType === 'debit' ? expenseType : undefined,
    });
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
                  <Ionicons name="receipt-outline" size={24} color={Colors.primary} />
                  <Text style={styles.title}>Log Account Transaction</Text>
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
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Account Selection */}
                {accounts.length > 1 && (
                  <>
                    <Text style={styles.inputLabel}>Bank Account</Text>
                    <View style={styles.accountChipsRow}>
                      {accounts.map(acc => (
                        <TouchableOpacity
                          key={acc.id}
                          style={[
                            styles.accountChip,
                            selectedAccountId === acc.id && styles.accountChipActive,
                          ]}
                          onPress={() => setSelectedAccountId(acc.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.accountDot, { backgroundColor: acc.color }]} />
                          <Text
                            style={[
                              styles.accountChipText,
                              selectedAccountId === acc.id && styles.accountChipTextActive,
                            ]}
                          >
                            {acc.nickname}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Transaction Type: Debit vs Credit */}
                <Text style={styles.inputLabel}>Transaction Type</Text>
                <View style={styles.txTypeRow}>
                  <TouchableOpacity
                    style={[styles.txTypeChip, txType === 'debit' && styles.txTypeDebitActive]}
                    onPress={() => setTxType('debit')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={18}
                      color={txType === 'debit' ? Colors.accentRed : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.txTypeText,
                        txType === 'debit' && { color: Colors.accentRed, fontFamily: Typography.bodyBold.fontFamily },
                      ]}
                    >
                      Debit (Spend)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.txTypeChip, txType === 'credit' && styles.txTypeCreditActive]}
                    onPress={() => setTxType('credit')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={18}
                      color={txType === 'credit' ? Colors.accentGreen : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.txTypeText,
                        txType === 'credit' && { color: Colors.accentGreen, fontFamily: Typography.bodyBold.fontFamily },
                      ]}
                    >
                      Credit (Income)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Amount */}
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <View style={styles.amountWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.amountInput, TabularNums]}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={text => {
                      setAmount(text.replace(/[^0-9]/g, ''));
                      if (error) setError(null);
                    }}
                  />
                </View>

                {/* Description */}
                <Text style={styles.inputLabel}>Description / Payee</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Electricity Bill, ATM Withdrawal, Salary"
                  placeholderTextColor={Colors.textMuted}
                  value={description}
                  onChangeText={text => {
                    setDescription(text);
                    if (error) setError(null);
                  }}
                />

                {/* Category (if debit) */}
                {txType === 'debit' && (
                  <>
                    <Text style={styles.inputLabel}>Budget Category</Text>
                    <View style={styles.catChipsRow}>
                      {categories.map(cat => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.catChip,
                            selectedCategory === cat.name && styles.catChipActive,
                          ]}
                          onPress={() => handleSelectCategory(cat.name)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              selectedCategory === cat.name && styles.catChipTextActive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Need vs Want */}
                    <Text style={styles.inputLabel}>Classification</Text>
                    <View style={styles.typeRow}>
                      <TouchableOpacity
                        style={[styles.classChip, expenseType === 'Need' && styles.classChipNeedActive]}
                        onPress={() => setExpenseType('Need')}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.classChipText, expenseType === 'Need' && { color: Colors.accentGreen }]}>
                          Need
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.classChip, expenseType === 'Want' && styles.classChipWantActive]}
                        onPress={() => setExpenseType('Want')}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.classChipText, expenseType === 'Want' && { color: Colors.accentPink }]}>
                          Want
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveText}>Save Transaction</Text>
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
    backgroundColor: withAlpha(Colors.background, 0.8),
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: withAlpha(Colors.danger, 0.15),
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.small,
    color: Colors.danger,
    flex: 1,
  },
  inputLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  accountChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountChipActive: {
    backgroundColor: withAlpha(Colors.primary, 0.2),
    borderColor: Colors.primary,
  },
  accountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accountChipText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  accountChipTextActive: {
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  txTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  txTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txTypeDebitActive: {
    backgroundColor: withAlpha(Colors.accentRed, 0.15),
    borderColor: Colors.accentRed,
  },
  txTypeCreditActive: {
    backgroundColor: withAlpha(Colors.accentGreen, 0.15),
    borderColor: Colors.accentGreen,
  },
  txTypeText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  textInput: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  catChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: withAlpha(Colors.primary, 0.2),
    borderColor: Colors.primary,
  },
  catChipText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  classChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  classChipNeedActive: {
    backgroundColor: withAlpha(Colors.accentGreen, 0.15),
    borderColor: Colors.accentGreen,
  },
  classChipWantActive: {
    backgroundColor: withAlpha(Colors.accentPink, 0.15),
    borderColor: Colors.accentPink,
  },
  classChipText: {
    ...Typography.bodyBold,
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
