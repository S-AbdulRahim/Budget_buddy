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
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, TabularNums, withAlpha } from '../theme';
import { CreditCard } from '../types';
import { CREDIT_CARD_COLORS } from '../data/budgetData';

interface AddCreditCardModalProps {
  visible: boolean;
  initialCard?: CreditCard | null;
  onSave: (cardData: Omit<CreditCard, 'id'>) => void;
  onClose: () => void;
  onRequestSmsConsent?: () => void;
  hasSmsPermission?: boolean;
}

const POPULAR_BANKS = ['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'Other'];

export default function AddCreditCardModal({
  visible,
  initialCard,
  onSave,
  onClose,
  onRequestSmsConsent,
  hasSmsPermission = false,
}: AddCreditCardModalProps) {
  const [nickname, setNickname] = useState('');
  const [bank, setBank] = useState('HDFC');
  const [customBank, setCustomBank] = useState('');
  const [last4, setLast4] = useState('');
  const [color, setColor] = useState(CREDIT_CARD_COLORS[0]);
  const [smsTrackingEnabled, setSmsTrackingEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCard) {
      setNickname(initialCard.nickname);
      const isPreset = POPULAR_BANKS.includes(initialCard.bank || '');
      if (isPreset) {
        setBank(initialCard.bank || 'HDFC');
        setCustomBank('');
      } else {
        setBank('Other');
        setCustomBank(initialCard.bank || '');
      }
      setLast4(initialCard.last4);
      setColor(initialCard.color || CREDIT_CARD_COLORS[0]);
      setSmsTrackingEnabled(initialCard.smsTrackingEnabled ?? true);
    } else {
      setNickname('');
      setBank('HDFC');
      setCustomBank('');
      setLast4('');
      setColor(CREDIT_CARD_COLORS[0]);
      setSmsTrackingEnabled(Platform.OS === 'android');
    }
    setError(null);
  }, [initialCard, visible]);

  const handleLast4Change = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
    setLast4(clean);
  };

  const handleToggleSms = (val: boolean) => {
    if (val && !hasSmsPermission && onRequestSmsConsent) {
      onRequestSmsConsent();
    }
    setSmsTrackingEnabled(val);
  };

  const handleSubmit = () => {
    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      setError('Please enter a card nickname');
      return;
    }
    if (last4.length !== 4) {
      setError('Last 4 digits must be exactly 4 numbers');
      return;
    }

    const resolvedBank = bank === 'Other' ? customBank.trim() || 'Other' : bank;

    onSave({
      nickname: trimmedNick,
      bank: resolvedBank,
      last4,
      color,
      smsTrackingEnabled: Platform.OS === 'android' ? smsTrackingEnabled : false,
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
                  <Ionicons name="card-outline" size={24} color={Colors.primary} />
                  <Text style={styles.title}>
                    {initialCard ? 'Edit Credit Card' : 'Add Credit Card'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close card modal"
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

                {/* Card Preview Banner */}
                <View style={[styles.cardPreview, { backgroundColor: color }]}>
                  <View style={styles.previewTop}>
                    <Text style={styles.previewBank}>{bank === 'Other' ? customBank || 'CARD' : bank}</Text>
                    <Ionicons name="card" size={20} color={Colors.onPrimary} />
                  </View>
                  <Text style={styles.previewNumber}>•••• •••• •••• {last4 || '••••'}</Text>
                  <Text style={styles.previewName}>{nickname || 'CARD HOLDER'}</Text>
                </View>

                {/* Nickname Input */}
                <Text style={styles.inputLabel}>Card Nickname</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. HDFC Millennia, SBI Cashback"
                  placeholderTextColor={Colors.textMuted}
                  value={nickname}
                  onChangeText={text => {
                    setNickname(text);
                    if (error) setError(null);
                  }}
                />

                {/* Bank Selector */}
                <Text style={styles.inputLabel}>Issuing Bank</Text>
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

                {/* Last 4 Digits Input */}
                <Text style={styles.inputLabel}>Last 4 Digits</Text>
                <TextInput
                  style={[styles.textInput, TabularNums]}
                  placeholder="1234"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={last4}
                  onChangeText={handleLast4Change}
                />
                <Text style={styles.helperText}>
                  For your security, FinCompass never stores or asks for full card numbers or CVVs.
                </Text>

                {/* Card Color Picker */}
                <Text style={styles.inputLabel}>Card Color</Text>
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
                      accessibilityRole="button"
                      accessibilityLabel={`Select color ${c}`}
                      activeOpacity={0.8}
                    >
                      {color === c && (
                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* SMS Tracking Toggle (native / Android only) */}
                {Platform.OS === 'android' && (
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleTextWrap}>
                      <Text style={styles.toggleTitle}>Auto-detect SMS Spends</Text>
                      <Text style={styles.toggleSubtitle}>
                        Parse transaction alerts from {bank === 'Other' ? 'bank' : bank} SMS
                      </Text>
                    </View>
                    <Switch
                      value={smsTrackingEnabled}
                      onValueChange={handleToggleSms}
                      trackColor={{ false: Colors.surfaceHighlight, true: Colors.primary }}
                      thumbColor={Colors.white}
                    />
                  </View>
                )}
              </ScrollView>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel card editing"
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSubmit}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Save credit card"
                >
                  <Text style={styles.saveText}>Save Card</Text>
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
  errorContainer: {
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
  cardPreview: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  previewBank: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.onPrimary,
    letterSpacing: 1,
  },
  previewNumber: {
    ...Typography.subtitle,
    ...TabularNums,
    color: Colors.onPrimary,
    marginBottom: Spacing.md,
    letterSpacing: 2,
  },
  previewName: {
    ...Typography.small,
    color: Colors.onPrimary,
    textTransform: 'uppercase',
  },
  inputLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
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
  helperText: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: withAlpha(Colors.primary, 0.15),
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginVertical: Spacing.xs,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.1 }],
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  toggleSubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
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
