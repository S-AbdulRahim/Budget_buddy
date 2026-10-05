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
import { BankAccount } from '../types';
import { CREDIT_CARD_COLORS } from '../data/budgetData';

interface AddBankAccountModalProps {
  visible: boolean;
  initialAccount?: BankAccount | null;
  onSave: (accountData: Omit<BankAccount, 'id'>) => void;
  onClose: () => void;
}

const POPULAR_BANKS = ['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'Other'];

export default function AddBankAccountModal({
  visible,
  initialAccount,
  onSave,
  onClose,
}: AddBankAccountModalProps) {
  const [nickname, setNickname] = useState('');
  const [bank, setBank] = useState('HDFC');
  const [customBank, setCustomBank] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
  const [lastDigits, setLastDigits] = useState('');
  const [color, setColor] = useState(CREDIT_CARD_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAccount) {
      setNickname(initialAccount.nickname);
      const isPreset = POPULAR_BANKS.includes(initialAccount.bank || '');
      if (isPreset) {
        setBank(initialAccount.bank || 'HDFC');
        setCustomBank('');
      } else {
        setBank('Other');
        setCustomBank(initialAccount.bank || '');
      }
      setAccountType(initialAccount.accountType || 'savings');
      setLastDigits(initialAccount.lastDigits || '');
      setColor(initialAccount.color || CREDIT_CARD_COLORS[0]);
    } else {
      setNickname('');
      setBank('HDFC');
      setCustomBank('');
      setAccountType('savings');
      setLastDigits('');
      setColor(CREDIT_CARD_COLORS[0]);
    }
    setError(null);
  }, [initialAccount, visible]);

  const handleLastDigitsChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
    setLastDigits(clean);
  };

  const handleSubmit = () => {
    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      setError('Please enter an account nickname');
      return;
    }

    const resolvedBank = bank === 'Other' ? customBank.trim() || 'Other' : bank;

    onSave({
      nickname: trimmedNick,
      bank: resolvedBank,
      accountType,
      lastDigits: lastDigits || undefined,
      color,
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
                  <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
                  <Text style={styles.title}>
                    {initialAccount ? 'Edit Bank Account' : 'Add Bank Account'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close account modal"
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

                {/* Account Preview Card */}
                <View style={[styles.accountPreview, { backgroundColor: color }]}>
                  <View style={styles.previewTop}>
                    <Text style={styles.previewBank}>
                      {(bank === 'Other' ? customBank || 'BANK' : bank) + ` • ${accountType.toUpperCase()}`}
                    </Text>
                    <Ionicons name="business-outline" size={20} color={Colors.onPrimary} />
                  </View>
                  <Text style={styles.previewNumber}>
                    A/C {lastDigits ? `•••• •••• ${lastDigits}` : '•••• •••• ••••'}
                  </Text>
                  <Text style={styles.previewName}>{nickname || 'PRIMARY ACCOUNT'}</Text>
                </View>

                {/* Account Type Selector */}
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeChip, accountType === 'savings' && styles.typeChipActive]}
                    onPress={() => setAccountType('savings')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={16}
                      color={accountType === 'savings' ? Colors.primaryLight : Colors.textMuted}
                    />
                    <Text style={[styles.typeChipText, accountType === 'savings' && styles.typeChipTextActive]}>
                      Savings Account
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeChip, accountType === 'current' && styles.typeChipActive]}
                    onPress={() => setAccountType('current')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={16}
                      color={accountType === 'current' ? Colors.primaryLight : Colors.textMuted}
                    />
                    <Text style={[styles.typeChipText, accountType === 'current' && styles.typeChipTextActive]}>
                      Current Account
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Nickname Input */}
                <Text style={styles.inputLabel}>Account Nickname</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Salary Account, Emergency Fund"
                  placeholderTextColor={Colors.textMuted}
                  value={nickname}
                  onChangeText={text => {
                    setNickname(text);
                    if (error) setError(null);
                  }}
                />

                {/* Bank Selector */}
                <Text style={styles.inputLabel}>Bank Name</Text>
                <View style={styles.chipRow}>
                  {POPULAR_BANKS.map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.chip,
                        bank === b && styles.chipActive,
                      ]}
                      onPress={() => setBank(b)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          bank === b && styles.chipTextActive,
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {bank === 'Other' && (
                  <TextInput
                    style={[styles.textInput, { marginTop: Spacing.sm }]}
                    placeholder="Enter bank name"
                    placeholderTextColor={Colors.textMuted}
                    value={customBank}
                    onChangeText={setCustomBank}
                  />
                )}

                {/* Last 4 Digits Input (Optional) */}
                <Text style={styles.inputLabel}>Last 3-4 Digits (Optional)</Text>
                <TextInput
                  style={[styles.textInput, TabularNums]}
                  placeholder="e.g. 5678"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={lastDigits}
                  onChangeText={handleLastDigitsChange}
                />
                <Text style={styles.helperText}>
                  Only for identifying this account. Never enter full account numbers.
                </Text>

                {/* Account Color Picker */}
                <Text style={styles.inputLabel}>Account Color</Text>
                <View style={styles.colorRow}>
                  {CREDIT_CARD_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        color === c && styles.colorCircleActive,
                      ]}
                      onPress={() => setColor(c)}
                      activeOpacity={0.8}
                    >
                      {color === c && (
                        <Ionicons name="checkmark" size={16} color={Colors.onPrimary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
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
                  <Text style={styles.saveText}>
                    {initialAccount ? 'Save Changes' : 'Add Account'}
                  </Text>
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
  accountPreview: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    justifyContent: 'space-between',
    height: 140,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBank: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.onPrimary,
    letterSpacing: 1,
  },
  previewNumber: {
    ...Typography.bodyBold,
    ...TabularNums,
    color: Colors.onPrimary,
    letterSpacing: 2,
    marginVertical: Spacing.sm,
  },
  previewName: {
    ...Typography.small,
    color: Colors.onPrimary,
    textTransform: 'uppercase',
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: withAlpha(Colors.primary, 0.18),
    borderColor: Colors.primary,
  },
  typeChipText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textMuted,
  },
  typeChipTextActive: {
    color: Colors.primaryLight,
  },
  inputLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
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
  helperText: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: withAlpha(Colors.primary, 0.2),
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.1 }],
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
