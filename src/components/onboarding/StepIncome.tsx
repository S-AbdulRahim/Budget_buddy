import React from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  TabularNums,
  withAlpha,
} from '../../theme';

export interface StepIncomeProps {
  salary: string;
  onChangeSalary: (val: string) => void;
  inputRef: React.RefObject<TextInput | null>;
}

export default function StepIncome({ salary, onChangeSalary, inputRef }: StepIncomeProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.heroIconCircle}>
        <Ionicons name="cash-outline" size={48} color={Colors.primaryLight} />
      </View>
      <Text style={styles.stepTitle}>What's your monthly income?</Text>
      <Text style={styles.stepDescription}>
        Your take-home pay is the starting point for a realistic budget.
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          ref={inputRef}
          key="step-1-salary"
          style={styles.input}
          placeholder="60,000"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={salary}
          onChangeText={text => onChangeSalary(text.replace(/[^0-9]/g, ''))}
          autoFocus
          cursorColor={Colors.primaryLight}
          selectionColor={Colors.primary}
          accessibilityLabel="Monthly income input in rupees"
        />
      </View>

      {/* Info Tip Card */}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
        <Text style={styles.tipText}>
          Use your usual net salary. You can change it any time in Settings.
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
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.28),
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: Spacing.sm,
    width: '80%',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  currencySymbol: {
    ...Typography.title,
    color: Colors.primaryLight,
    marginRight: Spacing.sm,
    ...TabularNums,
  },
  input: {
    ...Typography.number,
    color: Colors.textPrimary,
    minWidth: 140,
    textAlign: 'left',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
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
