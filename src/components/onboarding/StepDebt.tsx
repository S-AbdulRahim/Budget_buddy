import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  TabularNums,
  formatCurrencyFull,
  withAlpha,
} from '../../theme';
import { getOrdinal } from '../CalendarPickerModal';

export interface StepDebtProps {
  hasDebt: boolean;
  onToggleHasDebt: (has: boolean) => void;
  debtTotal: string;
  onChangeDebtTotal: (val: string) => void;
  debtEmi: string;
  onChangeDebtEmi: (val: string) => void;
  debtInterest: string;
  onChangeDebtInterest: (val: string) => void;
  debtStartMonth: string;
  debtEmiDay: number;
  debtReminderEnabled: boolean;
  onToggleReminder: () => void;
  onOpenDatePicker: () => void;
  totalInputRef?: React.RefObject<TextInput | null>;
}

export default function StepDebt({
  hasDebt,
  onToggleHasDebt,
  debtTotal,
  onChangeDebtTotal,
  debtEmi,
  onChangeDebtEmi,
  debtInterest,
  onChangeDebtInterest,
  debtStartMonth,
  debtEmiDay,
  debtReminderEnabled,
  onToggleReminder,
  onOpenDatePicker,
  totalInputRef,
}: StepDebtProps) {
  const isZeroInterest = !debtInterest || debtInterest === '0' || parseFloat(debtInterest) === 0;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.heroIconCircle}>
        <Ionicons name="trending-down-outline" size={48} color={Colors.accentAmber} />
      </View>
      <Text style={styles.stepTitle}>Any debt to tackle?</Text>
      <Text style={styles.stepDescription}>
        Add a loan or EMI to track your payoff journey.
      </Text>

      {/* Yes/No Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !hasDebt && styles.toggleButtonActive]}
          onPress={() => onToggleHasDebt(false)}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleButtonText, !hasDebt && styles.toggleButtonTextActive]}>
            Not now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, hasDebt && styles.toggleButtonActive]}
          onPress={() => onToggleHasDebt(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleButtonText, hasDebt && styles.toggleButtonTextActive]}>
            Yes, track debt
          </Text>
        </TouchableOpacity>
      </View>

      {hasDebt && (
        <View style={styles.debtForm}>
          {/* Total Debt Amount */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Total Debt Amount</Text>
            <View style={styles.formInputWrap}>
              <Text style={styles.formInputSymbol}>₹</Text>
              <TextInput
                ref={totalInputRef}
                key="step-3-debt-total"
                style={styles.formInput}
                placeholder="2,00,000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={debtTotal}
                onChangeText={text => onChangeDebtTotal(text.replace(/[^0-9]/g, ''))}
                cursorColor={Colors.primaryLight}
                selectionColor={Colors.primary}
                accessibilityLabel="Total debt amount in rupees"
              />
            </View>
          </View>

          {/* Monthly EMI */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Monthly EMI</Text>
            <View style={styles.formInputWrap}>
              <Text style={styles.formInputSymbol}>₹</Text>
              <TextInput
                key="step-3-debt-emi"
                style={styles.formInput}
                placeholder="16,700"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={debtEmi}
                onChangeText={text => onChangeDebtEmi(text.replace(/[^0-9]/g, ''))}
                cursorColor={Colors.primaryLight}
                selectionColor={Colors.primary}
                accessibilityLabel="Monthly EMI amount in rupees"
              />
            </View>
          </View>

          {/* Annual Interest Rate */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Annual Interest Rate (%)</Text>
            <View style={styles.formInputWrap}>
              <Text style={styles.formInputSymbol}>%</Text>
              <TextInput
                key="step-3-debt-interest"
                style={styles.formInput}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={debtInterest}
                onChangeText={text => onChangeDebtInterest(text.replace(/[^0-9.]/g, ''))}
                cursorColor={Colors.primaryLight}
                selectionColor={Colors.primary}
                accessibilityLabel="Annual interest rate percentage"
              />
            </View>
          </View>

          {/* Neutral Phrasing for 0% vs standard interest badge */}
          {isZeroInterest ? (
            <View style={styles.neutralBadge}>
              <Ionicons name="leaf-outline" size={20} color={Colors.accentGreen} />
              <View style={{ flex: 1 }}>
                <Text style={styles.neutralBadgeTitle}>0% Interest • Interest-free loan</Text>
                <Text style={styles.neutralBadgeSubtitle}>
                  No interest charges or accrual on this balance.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.interestBadge}>
              <Ionicons name="warning-outline" size={20} color={Colors.accentAmber} />
              <View style={{ flex: 1 }}>
                <Text style={styles.interestBadgeTitle}>{debtInterest}% Annual Interest</Text>
                <Text style={styles.interestBadgeSubtitle}>
                  Standard loan with monthly interest accrual.
                </Text>
              </View>
            </View>
          )}

          {/* EMI Date Picker Trigger */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>EMI Date</Text>
            <TouchableOpacity
              style={styles.datePickerWrap}
              onPress={onOpenDatePicker}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select EMI date"
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.primaryLight}
                style={{ marginRight: Spacing.sm }}
              />
              <Text
                style={[
                  styles.datePickerText,
                  !debtStartMonth && { color: Colors.textMuted },
                ]}
              >
                {debtStartMonth || 'Select EMI date'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={Colors.textSecondary}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>

            {/* Reminder Toggle */}
            <TouchableOpacity
              style={styles.reminderCheckOption}
              onPress={onToggleReminder}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: debtReminderEnabled }}
            >
              <View
                style={[
                  styles.checkboxBox,
                  debtReminderEnabled && styles.checkboxBoxChecked,
                ]}
              >
                {debtReminderEnabled && (
                  <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />
                )}
              </View>
              <View style={styles.reminderCheckContent}>
                <Text style={styles.reminderCheckLabel}>Send reminder notification</Text>
                {debtReminderEnabled ? (
                  <Text style={styles.reminderCheckHint}>
                    Notification will be sent on the {getOrdinal(debtEmiDay)} of every month
                  </Text>
                ) : (
                  <Text style={styles.reminderCheckHintMuted}>
                    Check to receive a monthly reminder on the {getOrdinal(debtEmiDay)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Calculated Tenure Note */}
          {parseFloat(debtTotal) > 0 && parseFloat(debtEmi) > 0 && (
            <View style={styles.tenureNote}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
              <Text style={styles.tenureNoteText}>
                {(() => {
                  const total = parseFloat(debtTotal);
                  const emi = parseFloat(debtEmi);
                  const rate = parseFloat(debtInterest) || 0;
                  if (rate === 0) {
                    const tenure = Math.ceil(total / emi);
                    return `Estimated tenure: ${tenure} months (Interest-Free)`;
                  }
                  const r = rate / 12 / 100;
                  if (emi <= total * r) {
                    return `Warning: Monthly interest (${formatCurrencyFull(Math.round(total * r))}) exceeds EMI`;
                  }
                  const n = Math.ceil(-Math.log(1 - (r * total) / emi) / Math.log(1 + r));
                  const totalInterestPaid = Math.max(0, Math.round(n * emi - total));
                  return `Estimated tenure: ${n} months • Total interest: ${formatCurrencyFull(totalInterestPaid)}`;
                })()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Info Tip Card */}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
        <Text style={styles.tipText}>
          Skip this if you're debt-free. You can add a loan later in Settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: withAlpha(Colors.accentAmber, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentAmber, 0.28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.subtle,
  },
  toggleButtonText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: Colors.textPrimary,
  },
  debtForm: {
    width: '100%',
    gap: Spacing.lg,
  },
  formField: {
    width: '100%',
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  formInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  formInputSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  formInput: {
    ...Typography.body,
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.md,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  neutralBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accentGreen, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentGreen, 0.28),
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  neutralBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentGreen,
  },
  neutralBadgeSubtitle: {
    ...Typography.small,
    color: Colors.accentGreen,
    opacity: 0.85,
    marginTop: 2,
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accentAmber, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentAmber, 0.28),
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  interestBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentAmber,
  },
  interestBadgeSubtitle: {
    ...Typography.small,
    color: Colors.accentAmber,
    opacity: 0.85,
    marginTop: 2,
  },
  datePickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  datePickerText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  reminderCheckOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reminderCheckContent: {
    flex: 1,
  },
  reminderCheckLabel: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  reminderCheckHint: {
    ...Typography.small,
    color: Colors.primaryLight,
    marginTop: 2,
  },
  reminderCheckHintMuted: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tenureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  tenureNoteText: {
    ...Typography.caption,
    color: Colors.accent,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.25),
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
    marginTop: Spacing.xxl,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.accent,
    flex: 1,
    lineHeight: 18,
  },
});
