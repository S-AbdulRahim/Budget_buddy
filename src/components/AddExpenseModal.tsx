import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../theme';
import { Category } from '../types';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: {
    description: string;
    category: string;
    amount: number;
    paymentMode: 'UPI' | 'Bank Transfer' | 'Cash' | 'Credit Card';
    type: 'Need' | 'Want';
    date: string;
  }) => void;
  categories: Category[];
}

const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Credit Card'] as const;

export default function AddExpenseModal({ visible, onClose, onAdd, categories }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState<typeof PAYMENT_MODES[number]>('UPI');
  const [expenseType, setExpenseType] = useState<'Need' | 'Want'>('Need');

  const handleAdd = () => {
    if (!description.trim() || !amount || !selectedCategory) return;

    onAdd({
      description: description.trim(),
      category: selectedCategory,
      amount: parseFloat(amount),
      paymentMode,
      type: expenseType,
      date: new Date().toISOString().split('T')[0],
    });

    // Reset form
    setDescription('');
    setAmount('');
    setSelectedCategory('');
    setPaymentMode('UPI');
    setExpenseType('Need');
    onClose();
  };

  const isValid = description.trim() && amount && parseFloat(amount) > 0 && selectedCategory;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Log Expense</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Weekly vegetables"
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              cursorColor={Colors.primaryLight}
              selectionColor={Colors.primary}
            />

            {/* Amount */}
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              cursorColor={Colors.primaryLight}
              selectionColor={Colors.primary}
            />

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipGroup}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    selectedCategory === cat.name && {
                      backgroundColor: cat.color + '30',
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === cat.name && { color: cat.color },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Mode */}
            <Text style={styles.label}>Payment Mode</Text>
            <View style={styles.chipGroup}>
              {PAYMENT_MODES.map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.chip,
                    paymentMode === mode && {
                      backgroundColor: Colors.primary + '30',
                      borderColor: Colors.primary,
                    },
                  ]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      paymentMode === mode && { color: Colors.primaryLight },
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Need / Want Toggle */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  expenseType === 'Need' && { backgroundColor: Colors.accentGreen + '20', borderColor: Colors.accentGreen },
                ]}
                onPress={() => setExpenseType('Need')}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={expenseType === 'Need' ? Colors.accentGreen : Colors.textMuted}
                />
                <Text style={[styles.toggleText, expenseType === 'Need' && { color: Colors.accentGreen }]}>
                  Need
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  expenseType === 'Want' && { backgroundColor: Colors.accentPink + '20', borderColor: Colors.accentPink },
                ]}
                onPress={() => setExpenseType('Want')}
              >
                <Ionicons
                  name="heart"
                  size={18}
                  color={expenseType === 'Want' ? Colors.accentPink : Colors.textMuted}
                />
                <Text style={[styles.toggleText, expenseType === 'Want' && { color: Colors.accentPink }]}>
                  Want
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleAdd}
            disabled={!isValid}
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.submitText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '90%',
    paddingBottom: Spacing.xxxl,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  body: {
    paddingHorizontal: Spacing.xl,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Typography.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  toggleText: {
    ...Typography.bodyBold,
    color: Colors.textMuted,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
});
