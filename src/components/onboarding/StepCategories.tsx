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
import { Category, CategoryGroup } from '../../types';

export interface StepCategoriesProps {
  salary: number;
  categoriesList: Category[];
  enabledCategories: Record<string, boolean>;
  categoryBudgets: Record<string, string>;
  onToggleCategory: (id: string) => void;
  onChangeCategoryBudget: (id: string, text: string) => void;
  onAddCategory: (group: CategoryGroup, name: string, budget: string) => void;
  firstInputRef?: React.RefObject<TextInput | null>;
}

interface GroupConfig {
  key: CategoryGroup;
  title: string;
  targetPercent: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const GROUPS: GroupConfig[] = [
  {
    key: 'Needs',
    title: 'Needs',
    targetPercent: 50,
    color: Colors.groupNeeds,
    icon: 'home-outline',
    description: 'Housing, groceries, transit, utilities & health',
  },
  {
    key: 'Wants',
    title: 'Wants',
    targetPercent: 30,
    color: Colors.groupWants,
    icon: 'cart-outline',
    description: 'Entertainment, shopping, dining & lifestyle',
  },
  {
    key: 'Savings',
    title: 'Savings & Debt',
    targetPercent: 20,
    color: Colors.groupSavings,
    icon: 'wallet-outline',
    description: 'Emergency reserve, investments & savings buffer',
  },
];

export default function StepCategories({
  salary,
  categoriesList,
  enabledCategories,
  categoryBudgets,
  onToggleCategory,
  onChangeCategoryBudget,
  onAddCategory,
  firstInputRef,
}: StepCategoriesProps) {
  // Inline add category form state per group
  const [activeAddGroup, setActiveAddGroup] = useState<CategoryGroup | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');

  const handleOpenAdd = (group: CategoryGroup) => {
    setActiveAddGroup(group);
    setNewCatName('');
    setNewCatBudget('');
  };

  const handleConfirmAdd = (group: CategoryGroup) => {
    const cleanName = newCatName.trim();
    if (!cleanName) return;
    const cleanBudget = newCatBudget.replace(/[^0-9]/g, '') || '0';
    onAddCategory(group, cleanName, cleanBudget);
    setActiveAddGroup(null);
    setNewCatName('');
    setNewCatBudget('');
  };

  // Calculate total allocated
  const totalAllocated = categoriesList.reduce((sum, cat) => {
    if (!enabledCategories[cat.id]) return sum;
    const val = parseFloat(categoryBudgets[cat.id]) || 0;
    return sum + val;
  }, 0);

  const totalAllocatedPercent = salary > 0 ? Math.round((totalAllocated / salary) * 100) : 0;
  const isOverSalary = totalAllocated > salary;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.heroIconCircle}>
        <Ionicons name="pie-chart-outline" size={48} color={Colors.primaryLight} />
      </View>
      <Text style={styles.stepTitle}>Plan your spending</Text>
      <Text style={styles.stepDescription}>
        Group expenses by Needs (50%), Wants (30%), and Savings (20%). Adjust limits or add categories as needed.
      </Text>

      {/* Salary vs Allocated Overview Bar */}
      <View style={styles.budgetOverview}>
        <View>
          <Text style={styles.overviewSub}>Monthly Income</Text>
          <Text style={styles.overviewSalary}>{formatCurrencyFull(salary)}</Text>
        </View>
        <View style={styles.overviewRight}>
          <Text style={styles.overviewSub}>Total Allocated</Text>
          <Text
            style={[
              styles.overviewBudget,
              isOverSalary ? { color: Colors.accentRed } : { color: Colors.accentGreen },
            ]}
          >
            {formatCurrencyFull(totalAllocated)} ({totalAllocatedPercent}%)
          </Text>
        </View>
      </View>

      {/* 3 Group Sections: Needs, Wants, Savings */}
      <View style={styles.groupsContainer}>
        {GROUPS.map(group => {
          const groupCategories = categoriesList.filter(
            c => (c.group || 'Needs') === group.key
          );

          const groupSubtotal = groupCategories.reduce((sum, cat) => {
            if (!enabledCategories[cat.id]) return sum;
            return sum + (parseFloat(categoryBudgets[cat.id]) || 0);
          }, 0);

          const groupPercent = salary > 0 ? Math.round((groupSubtotal / salary) * 100) : 0;
          const isOverGroupTarget = groupPercent > group.targetPercent;
          const progressWidth = Math.min(100, groupPercent);

          return (
            <View key={group.key} style={styles.groupCard}>
              {/* Group Header */}
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <View style={[styles.groupIconCircle, { backgroundColor: withAlpha(group.color, 0.15) }]}>
                    <Ionicons name={group.icon} size={18} color={group.color} />
                  </View>
                  <View>
                    <View style={styles.groupNameAndTarget}>
                      <Text style={styles.groupTitle}>{group.title}</Text>
                      <View style={[styles.targetBadge, { borderColor: withAlpha(group.color, 0.4) }]}>
                        <Text style={[styles.targetBadgeText, { color: group.color }]}>
                          Target: {group.targetPercent}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.groupDescription}>{group.description}</Text>
                  </View>
                </View>

                {/* Subtotal and % */}
                <View style={styles.groupSubtotalBox}>
                  <Text style={styles.groupSubtotalAmount}>
                    {formatCurrencyFull(groupSubtotal)}
                  </Text>
                  <Text
                    style={[
                      styles.groupSubtotalPercent,
                      isOverGroupTarget ? { color: Colors.accentAmber } : { color: group.color },
                    ]}
                  >
                    {groupPercent}% of income
                  </Text>
                </View>
              </View>

              {/* Progress bar with 50/30/20 target guide tick */}
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressWidth}%`,
                        backgroundColor: group.color,
                      },
                    ]}
                  />
                  {/* Guideline Target Tick */}
                  <View
                    style={[
                      styles.targetTickLine,
                      { left: `${group.targetPercent}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressBarMeta}>
                  <Text style={styles.progressBarLabel}>0%</Text>
                  <Text style={[styles.progressBarLabel, { color: group.color }]}>
                    Guide: {group.targetPercent}%
                  </Text>
                  <Text style={styles.progressBarLabel}>100%</Text>
                </View>
              </View>

              {/* Categories in this group */}
              <View style={styles.categoryList}>
                {groupCategories.map((cat, catIdx) => {
                  const isEnabled = enabledCategories[cat.id];
                  const isFirstInput = group.key === 'Needs' && catIdx === 0;

                  return (
                    <View
                      key={cat.id}
                      style={[styles.categoryRow, !isEnabled && styles.categoryRowDisabled]}
                    >
                      <TouchableOpacity
                        onPress={() => onToggleCategory(cat.id)}
                        style={styles.categoryToggle}
                        activeOpacity={0.7}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isEnabled }}
                        accessibilityLabel={`${cat.name} category toggle`}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isEnabled && {
                              backgroundColor: group.color,
                              borderColor: group.color,
                            },
                          ]}
                        >
                          {isEnabled && (
                            <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.categoryName,
                            { color: isEnabled ? Colors.textPrimary : Colors.textSecondary },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>

                      {isEnabled ? (
                        <View style={styles.budgetInputWrap}>
                          <Text style={styles.budgetInputSymbol}>₹</Text>
                          <TextInput
                            ref={isFirstInput ? firstInputRef : undefined}
                            key={`step-2-cat-${cat.id}`}
                            style={styles.budgetInput}
                            keyboardType="numeric"
                            value={categoryBudgets[cat.id]}
                            onChangeText={text => onChangeCategoryBudget(cat.id, text)}
                            cursorColor={Colors.primaryLight}
                            selectionColor={Colors.primary}
                            accessibilityLabel={`${cat.name} budget amount in rupees`}
                          />
                        </View>
                      ) : (
                        <Text style={styles.disabledLabel}>Excluded</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Add Category per Group */}
              {activeAddGroup === group.key ? (
                <View style={styles.inlineAddCard}>
                  <View style={styles.inlineAddHeader}>
                    <Text style={styles.inlineAddTitle}>Add to {group.title}</Text>
                    <TouchableOpacity onPress={() => setActiveAddGroup(null)}>
                      <Ionicons name="close" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inlineAddFields}>
                    <TextInput
                      style={styles.inlineAddNameInput}
                      placeholder="Category name"
                      placeholderTextColor={Colors.textMuted}
                      value={newCatName}
                      onChangeText={setNewCatName}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                    <View style={styles.inlineAddBudgetWrap}>
                      <Text style={styles.budgetInputSymbol}>₹</Text>
                      <TextInput
                        style={styles.inlineAddBudgetInput}
                        placeholder="Limit"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        value={newCatBudget}
                        onChangeText={text => setNewCatBudget(text.replace(/[^0-9]/g, ''))}
                        cursorColor={Colors.primaryLight}
                        selectionColor={Colors.primary}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.inlineAddConfirmBtn, { backgroundColor: group.color }]}
                    onPress={() => handleConfirmAdd(group.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color={Colors.onPrimary} />
                    <Text style={styles.inlineAddConfirmBtnText}>Save category</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addGroupBtn}
                  onPress={() => handleOpenAdd(group.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={16} color={group.color} />
                  <Text style={[styles.addGroupBtnText, { color: group.color }]}>
                    Add category to {group.title}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Info Tip Card */}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
        <Text style={styles.tipText}>
          The 50/30/20 benchmark: Allocate up to 50% for essentials, 30% for discretionary wants, and 20% for debt payoff and savings.
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
    maxWidth: 620,
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
    marginBottom: Spacing.xl,
  },
  budgetOverview: {
    width: '100%',
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewSub: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  overviewSalary: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    ...TabularNums,
  },
  overviewRight: {
    alignItems: 'flex-end',
  },
  overviewBudget: {
    ...Typography.bodyBold,
    ...TabularNums,
  },
  groupsContainer: {
    width: '100%',
    gap: Spacing.xl,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  groupIconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupNameAndTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  groupTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  targetBadge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  targetBadgeText: {
    ...Typography.badge,
  },
  groupDescription: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  groupSubtotalBox: {
    alignItems: 'flex-end',
  },
  groupSubtotalAmount: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    ...TabularNums,
  },
  groupSubtotalPercent: {
    ...Typography.small,
    ...TabularNums,
    marginTop: 2,
  },
  progressBarWrapper: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetTickLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.textPrimary,
    opacity: 0.7,
  },
  progressBarMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressBarLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    fontSize: 10,
  },
  categoryList: {
    width: '100%',
    gap: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(Colors.border, 0.6),
  },
  categoryRowDisabled: {
    opacity: 0.45,
  },
  categoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  categoryName: {
    ...Typography.bodyBold,
  },
  budgetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    width: 110,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetInputSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  budgetInput: {
    ...Typography.body,
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  disabledLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  addGroupBtnText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  inlineAddCard: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineAddTitle: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  inlineAddFields: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inlineAddNameInput: {
    ...Typography.body,
    flex: 1.5,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 38,
    color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  inlineAddBudgetWrap: {
    ...Typography.body,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    height: 38,
  },
  inlineAddBudgetInput: {
    ...Typography.body,
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  inlineAddConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  inlineAddConfirmBtnText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.onPrimary,
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
