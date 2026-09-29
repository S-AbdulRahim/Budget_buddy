import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, withAlpha } from '../theme';
import { BudgetingRule, BudgetingRuleId } from '../types';
import { BUDGETING_RULES } from '../data/budgetData';

export interface BudgetingRulePickerProps {
  selectedRule: BudgetingRule;
  onSelectRule: (rule: BudgetingRule, isValid: boolean) => void;
}

export default function BudgetingRulePicker({
  selectedRule,
  onSelectRule,
}: BudgetingRulePickerProps) {
  // Custom split input states
  const initialNeeds = selectedRule.id === 'custom' && selectedRule.targets ? selectedRule.targets.Needs.toString() : '50';
  const initialWants = selectedRule.id === 'custom' && selectedRule.targets ? selectedRule.targets.Wants.toString() : '30';
  const initialSavings = selectedRule.id === 'custom' && selectedRule.targets ? selectedRule.targets.Savings.toString() : '20';

  const [customNeeds, setCustomNeeds] = useState(initialNeeds);
  const [customWants, setCustomWants] = useState(initialWants);
  const [customSavings, setCustomSavings] = useState(initialSavings);

  const numNeeds = parseInt(customNeeds, 10) || 0;
  const numWants = parseInt(customWants, 10) || 0;
  const numSavings = parseInt(customSavings, 10) || 0;
  const customSum = numNeeds + numWants + numSavings;
  const isCustomValid = customSum === 100;

  const handleSelectRuleId = (ruleId: BudgetingRuleId) => {
    const baseRule = BUDGETING_RULES.find(r => r.id === ruleId) || BUDGETING_RULES[1];
    if (ruleId === 'custom') {
      const customRule: BudgetingRule = {
        ...baseRule,
        targets: {
          Needs: numNeeds,
          Wants: numWants,
          Savings: numSavings,
        },
      };
      onSelectRule(customRule, isCustomValid);
    } else {
      onSelectRule(baseRule, true);
    }
  };

  const handleCustomChange = (field: 'needs' | 'wants' | 'savings', text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 3);
    let nextNeeds = numNeeds;
    let nextWants = numWants;
    let nextSavings = numSavings;

    if (field === 'needs') {
      setCustomNeeds(clean);
      nextNeeds = parseInt(clean, 10) || 0;
    } else if (field === 'wants') {
      setCustomWants(clean);
      nextWants = parseInt(clean, 10) || 0;
    } else {
      setCustomSavings(clean);
      nextSavings = parseInt(clean, 10) || 0;
    }

    const nextSum = nextNeeds + nextWants + nextSavings;
    const nextValid = nextSum === 100;
    const baseRule = BUDGETING_RULES.find(r => r.id === 'custom') || BUDGETING_RULES[4];
    const customRule: BudgetingRule = {
      ...baseRule,
      targets: {
        Needs: nextNeeds,
        Wants: nextWants,
        Savings: nextSavings,
      },
    };
    onSelectRule(customRule, nextValid);
  };

  return (
    <View style={styles.container}>
      {BUDGETING_RULES.map(rule => {
        const isSelected = selectedRule.id === rule.id;
        const targets = rule.id === 'custom' && isSelected
          ? { Needs: numNeeds, Wants: numWants, Savings: numSavings }
          : rule.targets;

        return (
          <TouchableOpacity
            key={rule.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => handleSelectRuleId(rule.id)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Select budgeting rule ${rule.label}`}
          >
            {/* Header row */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {rule.label}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={isSelected ? Colors.primary : Colors.textMuted}
              />
            </View>

            {/* Description */}
            <Text style={styles.cardDescription}>{rule.description}</Text>

            {/* Stacked Percentage Bar Preview */}
            {targets && (
              <View style={styles.previewContainer}>
                <View style={styles.previewBarTrack}>
                  <View
                    style={[
                      styles.previewBarSegment,
                      { flex: Math.max(1, targets.Needs), backgroundColor: Colors.groupNeeds },
                    ]}
                  />
                  <View
                    style={[
                      styles.previewBarSegment,
                      { flex: Math.max(1, targets.Wants), backgroundColor: Colors.groupWants },
                    ]}
                  />
                  <View
                    style={[
                      styles.previewBarSegment,
                      { flex: Math.max(1, targets.Savings), backgroundColor: Colors.groupSavings },
                    ]}
                  />
                </View>

                {/* Target Chips */}
                <View style={styles.previewMeta}>
                  <View style={styles.metaItem}>
                    <View style={[styles.metaDot, { backgroundColor: Colors.groupNeeds }]} />
                    <Text style={styles.metaText}>Needs {targets.Needs}%</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <View style={[styles.metaDot, { backgroundColor: Colors.groupWants }]} />
                    <Text style={styles.metaText}>Wants {targets.Wants}%</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <View style={[styles.metaDot, { backgroundColor: Colors.groupSavings }]} />
                    <Text style={styles.metaText}>Savings {targets.Savings}%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Custom Input Fields when Custom is selected */}
            {rule.id === 'custom' && isSelected && (
              <View style={styles.customContainer}>
                <Text style={styles.customTitle}>Enter your target percentages:</Text>
                <View style={styles.customInputRow}>
                  {/* Needs */}
                  <View style={styles.customInputGroup}>
                    <Text style={[styles.customInputLabel, { color: Colors.groupNeeds }]}>Needs</Text>
                    <View style={[styles.customInputWrap, { borderColor: Colors.groupNeeds }]}>
                      <TextInput
                        style={styles.customTextInput}
                        value={customNeeds}
                        onChangeText={t => handleCustomChange('needs', t)}
                        keyboardType="number-pad"
                        maxLength={3}
                        placeholder="50"
                        placeholderTextColor={Colors.textMuted}
                        accessibilityLabel="Needs percentage"
                      />
                      <Text style={styles.customInputPercent}>%</Text>
                    </View>
                  </View>

                  {/* Wants */}
                  <View style={styles.customInputGroup}>
                    <Text style={[styles.customInputLabel, { color: Colors.groupWants }]}>Wants</Text>
                    <View style={[styles.customInputWrap, { borderColor: Colors.groupWants }]}>
                      <TextInput
                        style={styles.customTextInput}
                        value={customWants}
                        onChangeText={t => handleCustomChange('wants', t)}
                        keyboardType="number-pad"
                        maxLength={3}
                        placeholder="30"
                        placeholderTextColor={Colors.textMuted}
                        accessibilityLabel="Wants percentage"
                      />
                      <Text style={styles.customInputPercent}>%</Text>
                    </View>
                  </View>

                  {/* Savings */}
                  <View style={styles.customInputGroup}>
                    <Text style={[styles.customInputLabel, { color: Colors.groupSavings }]}>Savings</Text>
                    <View style={[styles.customInputWrap, { borderColor: Colors.groupSavings }]}>
                      <TextInput
                        style={styles.customTextInput}
                        value={customSavings}
                        onChangeText={t => handleCustomChange('savings', t)}
                        keyboardType="number-pad"
                        maxLength={3}
                        placeholder="20"
                        placeholderTextColor={Colors.textMuted}
                        accessibilityLabel="Savings percentage"
                      />
                      <Text style={styles.customInputPercent}>%</Text>
                    </View>
                  </View>
                </View>

                {/* Validation Status */}
                <View
                  style={[
                    styles.sumBadge,
                    isCustomValid ? styles.sumBadgeValid : styles.sumBadgeInvalid,
                  ]}
                >
                  <Ionicons
                    name={isCustomValid ? 'checkmark-circle' : 'alert-circle-outline'}
                    size={16}
                    color={isCustomValid ? Colors.accentGreen : Colors.accentAmber}
                  />
                  <Text
                    style={[
                      styles.sumBadgeText,
                      isCustomValid ? styles.sumTextValid : styles.sumTextInvalid,
                    ]}
                  >
                    {isCustomValid
                      ? 'Total: 100% — Valid split'
                      : `Percentages must sum to 100% (currently ${customSum}%)`}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: withAlpha(Colors.primary, 0.08),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardLabel: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  cardLabelSelected: {
    color: Colors.primaryLight,
  },
  cardDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  previewContainer: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  previewBarTrack: {
    height: 8,
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceHighlight,
    gap: 2,
  },
  previewBarSegment: {
    height: '100%',
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  },
  metaText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  customContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  customTitle: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  customInputGroup: {
    flex: 1,
  },
  customInputLabel: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
    marginBottom: Spacing.xs,
  },
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 42,
  },
  customTextInput: {
    flex: 1,
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    padding: 0,
    textAlign: 'center',
  },
  customInputPercent: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  sumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sumBadgeValid: {
    backgroundColor: withAlpha(Colors.accentGreen, 0.12),
    borderColor: withAlpha(Colors.accentGreen, 0.3),
  },
  sumBadgeInvalid: {
    backgroundColor: withAlpha(Colors.accentAmber, 0.12),
    borderColor: withAlpha(Colors.accentAmber, 0.3),
  },
  sumBadgeText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  sumTextValid: {
    color: Colors.accentGreen,
  },
  sumTextInvalid: {
    color: Colors.accentAmber,
  },
});
