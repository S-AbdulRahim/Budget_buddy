import React, { useState } from 'react';
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
import { POPULAR_GOAL_PRESETS, GOAL_COLORS, GoalPreset } from '../../data/budgetData';
import InsightCard from '../InsightCard';

export interface WizardGoal {
  id: string;
  name: string;
  type: string;
  color: string;
  monthlyAmount: string;
  targetAmount?: string;
  icon?: string;
}

export interface StepGoalsProps {
  hasInvestments: boolean;
  onToggleHasInvestments: (has: boolean) => void;
  hasDebt: boolean;
  salary: number;
  goals: WizardGoal[];
  onChangeGoalMonthly: (id: string, text: string) => void;
  onChangeGoalTarget: (id: string, text: string) => void;
  onDeleteGoal: (id: string) => void;
  onAddPresetGoal: (preset: GoalPreset) => void;
  onAddCustomGoal: (name: string, type: string, monthly: string, target?: string) => void;
  firstInputRef?: React.RefObject<TextInput | null>;
}

export default function StepGoals({
  hasInvestments,
  onToggleHasInvestments,
  hasDebt,
  salary,
  goals,
  onChangeGoalMonthly,
  onChangeGoalTarget,
  onDeleteGoal,
  onAddPresetGoal,
  onAddCustomGoal,
  firstInputRef,
}: StepGoalsProps) {
  // Custom goal form state
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [customGoalName, setCustomGoalName] = useState('');
  const [customGoalType, setCustomGoalType] = useState('');
  const [customGoalMonthly, setCustomGoalMonthly] = useState('');
  const [customGoalTarget, setCustomGoalTarget] = useState('');
  const [showCustomTargetField, setShowCustomTargetField] = useState(false);

  // Expanded target inputs for existing goals
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({});

  const toggleTargetField = (goalId: string) => {
    setExpandedTargets(prev => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const handleCreateCustomGoal = () => {
    const cleanName = customGoalName.trim();
    if (!cleanName) return;
    const cleanType = customGoalType.trim() || 'Custom goal';
    const cleanMonthly = customGoalMonthly.replace(/[^0-9]/g, '') || '5000';
    const cleanTarget = customGoalTarget.replace(/[^0-9]/g, '');

    onAddCustomGoal(cleanName, cleanType, cleanMonthly, cleanTarget || undefined);

    setCustomGoalName('');
    setCustomGoalType('');
    setCustomGoalMonthly('');
    setCustomGoalTarget('');
    setShowCustomTargetField(false);
    setShowAddGoalForm(false);
  };

  // Monthly summary calculations
  const totalMonthlyContribution = goals.reduce(
    (sum, g) => sum + (parseFloat(g.monthlyAmount) || 0),
    0
  );
  const percentOfSalary =
    salary > 0 ? Math.round((totalMonthlyContribution / salary) * 100) : 0;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.heroIconCircle}>
        <Ionicons name="flag-outline" size={48} color={Colors.primaryLight} />
      </View>
      <Text style={styles.stepTitle}>What are you saving for?</Text>
      <Text style={styles.stepDescription}>
        Set monthly contributions toward your savings and investment goals. Optional targets show your timeline.
      </Text>

      {/* Yes/No Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !hasInvestments && styles.toggleButtonActive]}
          onPress={() => onToggleHasInvestments(false)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !hasInvestments && styles.toggleButtonTextActive,
            ]}
          >
            Not now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, hasInvestments && styles.toggleButtonActive]}
          onPress={() => onToggleHasInvestments(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleButtonText,
              hasInvestments && styles.toggleButtonTextActive,
            ]}
          >
            Yes, set goals
          </Text>
        </TouchableOpacity>
      </View>

      {hasInvestments && (
        <View style={styles.investList}>
          {hasDebt && (
            <View style={styles.investLockNotice}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.accentAmber} />
              <Text style={styles.investLockNoticeText}>
                Note: Since you configured an active loan, contributions unlock as your debt clears.
              </Text>
            </View>
          )}

          {/* Popular Presets with Multi-Row Wrapping */}
          <View style={styles.presetSection}>
            <Text style={styles.presetSectionTitle}>Quick add suggestions:</Text>
            <View style={styles.presetWrap}>
              {POPULAR_GOAL_PRESETS.map(preset => {
                const isAdded = goals.some(
                  g => g.name.toLowerCase() === preset.name.toLowerCase()
                );
                return (
                  <TouchableOpacity
                    key={preset.name}
                    style={[styles.presetChip, isAdded && styles.presetChipAdded]}
                    onPress={() => onAddPresetGoal(preset)}
                    disabled={isAdded}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isAdded ? 'checkmark-circle' : (preset.icon as any)}
                      size={14}
                      color={isAdded ? Colors.accentGreen : preset.color}
                    />
                    <Text
                      style={[
                        styles.presetChipText,
                        isAdded && styles.presetChipTextAdded,
                      ]}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Monthly Summary Banner */}
          {goals.length > 0 && (
            <View style={styles.summaryBanner}>
              <View>
                <Text style={styles.summaryBannerLabel}>Monthly Contribution</Text>
                <Text style={styles.summaryBannerAmount}>
                  Total per month: {formatCurrencyFull(totalMonthlyContribution)}
                </Text>
              </View>
              <View style={styles.summaryPercentBadge}>
                <Text style={styles.summaryPercentText}>{percentOfSalary}% of income</Text>
              </View>
            </View>
          )}

          {/* Goals List */}
          {goals.length === 0 ? (
            <View style={styles.emptyGoalsCard}>
              <Ionicons name="flag-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyGoalsText}>
                No goals added yet. Tap any suggestion above or add a custom goal below.
              </Text>
            </View>
          ) : (
            <View style={styles.goalsContainer}>
              <Text style={styles.sectionHeaderTitle}>Monthly contribution</Text>
              {goals.map((goal, index) => {
                const monthlyNum = parseFloat(goal.monthlyAmount) || 0;
                const targetNum = parseFloat(goal.targetAmount || '') || 0;
                const hasTarget = targetNum > 0;
                const isTargetExpanded = expandedTargets[goal.id] || hasTarget;

                let etaText = '';
                if (hasTarget && monthlyNum > 0) {
                  const months = Math.ceil(targetNum / monthlyNum);
                  const years = (months / 12).toFixed(1);
                  etaText = `Estimated: ~${months} mo (${years} yr)`;
                }

                return (
                  <View key={goal.id} style={styles.goalCard}>
                    {/* Top Row: Icon, Name, Type, Delete */}
                    <View style={styles.goalHeaderRow}>
                      <View
                        style={[
                          styles.goalIconWrap,
                          { backgroundColor: withAlpha(goal.color, 0.15) },
                        ]}
                      >
                        <Ionicons
                          name={(goal.icon as any) || 'flag-outline'}
                          size={18}
                          color={goal.color}
                        />
                      </View>
                      <View style={styles.goalInfoWrap}>
                        <Text style={styles.investName} numberOfLines={1}>
                          {goal.name}
                        </Text>
                        <Text style={styles.investType} numberOfLines={1}>
                          {goal.type}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteGoalBtn}
                        onPress={() => onDeleteGoal(goal.id)}
                        accessibilityLabel={`Delete ${goal.name}`}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.accentRed} />
                      </TouchableOpacity>
                    </View>

                    {/* Monthly Contribution Field */}
                    <View style={styles.goalInputRow}>
                      <Text style={styles.inputFieldLabel}>Monthly:</Text>
                      <View style={styles.monthlyInputBox}>
                        <Text style={styles.currencySymbolSmall}>₹</Text>
                        <TextInput
                          ref={index === 0 ? firstInputRef : undefined}
                          key={`step-4-goal-${goal.id}`}
                          style={styles.monthlyInput}
                          keyboardType="numeric"
                          value={goal.monthlyAmount}
                          onChangeText={text => onChangeGoalMonthly(goal.id, text)}
                          cursorColor={Colors.primaryLight}
                          selectionColor={Colors.primary}
                          accessibilityLabel={`${goal.name} monthly contribution amount`}
                        />
                        <Text style={styles.perMonthSuffix}>/ month</Text>
                      </View>
                    </View>

                    {/* Target Amount & ETA */}
                    {isTargetExpanded ? (
                      <View style={styles.targetSection}>
                        <View style={styles.targetInputRow}>
                          <Text style={styles.inputFieldLabel}>Target:</Text>
                          <View style={styles.targetInputBox}>
                            <Text style={styles.currencySymbolSmall}>₹</Text>
                            <TextInput
                              key={`step-4-target-${goal.id}`}
                              style={styles.monthlyInput}
                              placeholder="Total goal (e.g. 1,00,000)"
                              placeholderTextColor={Colors.textMuted}
                              keyboardType="numeric"
                              value={goal.targetAmount || ''}
                              onChangeText={text => onChangeGoalTarget(goal.id, text)}
                              cursorColor={Colors.primaryLight}
                              selectionColor={Colors.primary}
                              accessibilityLabel={`${goal.name} total target amount`}
                            />
                          </View>
                        </View>
                        {etaText ? (
                          <View style={styles.etaBadge}>
                            <Ionicons name="time-outline" size={14} color={Colors.primaryLight} />
                            <Text style={styles.etaText}>{etaText}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.setTargetBtn}
                        onPress={() => toggleTargetField(goal.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={14} color={Colors.primaryLight} />
                        <Text style={styles.setTargetBtnText}>Set a target amount (optional)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Add Custom Goal Section */}
          {!showAddGoalForm ? (
            <TouchableOpacity
              style={styles.openAddGoalBtn}
              onPress={() => setShowAddGoalForm(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primaryLight} />
              <Text style={styles.openAddGoalBtnText}>Add your own custom goal</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addGoalCard}>
              <View style={styles.addGoalHeader}>
                <Text style={styles.addGoalCardTitle}>Create custom goal</Text>
                <TouchableOpacity onPress={() => setShowAddGoalForm(false)}>
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.addGoalInput}
                placeholder="Goal name (e.g. Wedding, Emergency Fund, Travel)"
                placeholderTextColor={Colors.textMuted}
                value={customGoalName}
                onChangeText={setCustomGoalName}
                cursorColor={Colors.primaryLight}
                selectionColor={Colors.primary}
              />

              <View style={styles.addGoalRow}>
                <TextInput
                  style={[styles.addGoalInput, { flex: 1.2 }]}
                  placeholder="Category (e.g. Savings, SIP)"
                  placeholderTextColor={Colors.textMuted}
                  value={customGoalType}
                  onChangeText={setCustomGoalType}
                  cursorColor={Colors.primaryLight}
                  selectionColor={Colors.primary}
                />
                <View style={styles.customMonthlyWrap}>
                  <Text style={styles.currencySymbolSmall}>₹</Text>
                  <TextInput
                    style={styles.monthlyInput}
                    placeholder="Monthly"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={customGoalMonthly}
                    onChangeText={setCustomGoalMonthly}
                    cursorColor={Colors.primaryLight}
                    selectionColor={Colors.primary}
                  />
                  <Text style={styles.perMonthSuffix}>/ mo</Text>
                </View>
              </View>

              {/* Optional Target for Custom Goal */}
              {showCustomTargetField ? (
                <View style={styles.customTargetWrap}>
                  <Text style={styles.inputFieldLabel}>Target Goal (optional):</Text>
                  <View style={styles.targetInputBox}>
                    <Text style={styles.currencySymbolSmall}>₹</Text>
                    <TextInput
                      style={styles.monthlyInput}
                      placeholder="e.g. 1,00,000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={customGoalTarget}
                      onChangeText={setCustomGoalTarget}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.setTargetBtn}
                  onPress={() => setShowCustomTargetField(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={14} color={Colors.primaryLight} />
                  <Text style={styles.setTargetBtnText}>Set a target amount (optional)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.addGoalConfirmBtn}
                onPress={handleCreateCustomGoal}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color={Colors.onPrimary} />
                <Text style={styles.addGoalConfirmBtnText}>Add goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Personalized Investment/SIP Insight */}
      {(() => {
        const totalSIP = hasInvestments
          ? goals.reduce((sum, g) => sum + (parseFloat(g.monthlyAmount) || 0), 0)
          : 0;

        if (totalSIP > 0) {
          const r = 0.10; // 10% annual
          const i = r / 12; // monthly rate
          const n = 240; // 20 years (240 months)
          // FV of monthly SIP: P * [((1 + i)^n - 1) / i] * (1 + i)
          const fv20 = totalSIP * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
          const totalContributed = totalSIP * n;

          return (
            <InsightCard
              icon="trending-up-outline"
              text={`Investing ${formatCurrencyFull(totalSIP)}/month could grow to approximately ${formatCurrencyFull(Math.round(fv20))} in 20 years (from ${formatCurrencyFull(totalContributed)} total contributed) at a conservative 10% annual return.`}
              subtext="Assumes a smoothed 10% average annual return compounded monthly; actual market returns fluctuate year to year and are not guaranteed."
              style={{ marginTop: Spacing.xl }}
            />
          );
        }

        return (
          <InsightCard
            icon="leaf-outline"
            text="Even ₹1,000/month in a diversified index fund compounds significantly over decades. Add your first goal above to see the math."
            style={{ marginTop: Spacing.xl }}
          />
        );
      })()}
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
  investList: {
    width: '100%',
    gap: Spacing.lg,
  },
  investLockNotice: {
    flexDirection: 'row',
    backgroundColor: withAlpha(Colors.accentAmber, 0.1),
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentAmber, 0.3),
    gap: Spacing.sm,
    alignItems: 'center',
  },
  investLockNoticeText: {
    ...Typography.caption,
    color: Colors.accentAmber,
    flex: 1,
    lineHeight: 18,
  },
  presetSection: {
    marginBottom: Spacing.xs,
  },
  presetSectionTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  presetChipAdded: {
    opacity: 0.5,
    borderColor: Colors.border,
  },
  presetChipText: {
    ...Typography.small,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  presetChipTextAdded: {
    color: Colors.textMuted,
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryBannerLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  summaryBannerAmount: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    ...TabularNums,
    marginTop: 2,
  },
  summaryPercentBadge: {
    backgroundColor: withAlpha(Colors.primary, 0.15),
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  summaryPercentText: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
  },
  emptyGoalsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: withAlpha(Colors.surfaceHighlight, 0.4),
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  emptyGoalsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  goalsContainer: {
    gap: Spacing.md,
  },
  sectionHeaderTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfoWrap: {
    flex: 1,
  },
  investName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  investType: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteGoalBtn: {
    padding: Spacing.xs,
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  inputFieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  monthlyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    maxWidth: 200,
  },
  currencySymbolSmall: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  monthlyInput: {
    ...Typography.body,
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  perMonthSuffix: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  targetSection: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: withAlpha(Colors.border, 0.6),
  },
  targetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  targetInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    maxWidth: 200,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-end',
    backgroundColor: withAlpha(Colors.primary, 0.1),
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  etaText: {
    ...Typography.small,
    color: Colors.primaryLight,
    ...TabularNums,
  },
  setTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.xs,
  },
  setTargetBtnText: {
    ...Typography.small,
    color: Colors.primaryLight,
  },
  openAddGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  openAddGoalBtnText: {
    ...Typography.bodyBold,
    color: Colors.primaryLight,
  },
  addGoalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  addGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  addGoalCardTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  addGoalInput: {
    ...Typography.body,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 40,
    color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  addGoalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  customMonthlyWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    height: 40,
  },
  customTargetWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  addGoalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    marginTop: 4,
  },
  addGoalConfirmBtnText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
});
