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
import { Category, CategoryGroup, BudgetingRule } from '../../types';
import CategoryRow from '../CategoryRow';
import InsightCard from '../InsightCard';

export interface StepCategoriesProps {
  salary: number;
  categoriesList: Category[];
  enabledCategories: Record<string, boolean>;
  categoryBudgets: Record<string, string>;
  onToggleCategory: (id: string) => void;
  onChangeCategoryBudget: (id: string, text: string) => void;
  onChangeCategoryGroup?: (id: string, group: CategoryGroup) => void;
  onAddCategory: (group: CategoryGroup, name: string, budget: string) => void;
  firstInputRef?: React.RefObject<TextInput | null>;
  rule: BudgetingRule;
}

interface GroupConfig {
  key: CategoryGroup;
  title: string;
  targetPercent: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export default function StepCategories({
  salary,
  categoriesList,
  enabledCategories,
  categoryBudgets,
  onToggleCategory,
  onChangeCategoryBudget,
  onChangeCategoryGroup,
  onAddCategory,
  firstInputRef,
  rule,
}: StepCategoriesProps) {
  const hasTargets = rule.targets !== null;
  const targetNeeds = rule.targets?.Needs ?? 0;
  const targetWants = rule.targets?.Wants ?? 0;
  const targetSavings = rule.targets?.Savings ?? 0;

  const GROUPS: GroupConfig[] = [
    {
      key: 'Needs',
      title: 'Needs',
      targetPercent: targetNeeds,
      color: Colors.groupNeeds,
      icon: 'home-outline',
      description: 'Housing, groceries, transit, utilities & health',
    },
    {
      key: 'Wants',
      title: 'Wants',
      targetPercent: targetWants,
      color: Colors.groupWants,
      icon: 'cart-outline',
      description: 'Entertainment, shopping, dining & lifestyle',
    },
    {
      key: 'Savings',
      title: 'Savings & Debt',
      targetPercent: targetSavings,
      color: Colors.groupSavings,
      icon: 'wallet-outline',
      description: 'Emergency reserve, investments & savings buffer',
    },
  ];

  // Inline add category form state per group (for grouped mode)
  const [activeAddGroup, setActiveAddGroup] = useState<CategoryGroup | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');

  // Inline add category state for flat mode ('none' rule)
  const [isAddingFlatCategory, setIsAddingFlatCategory] = useState(false);
  const [newFlatCatName, setNewFlatCatName] = useState('');
  const [newFlatCatBudget, setNewFlatCatBudget] = useState('');

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

  const handleConfirmAddFlat = () => {
    const cleanName = newFlatCatName.trim();
    if (!cleanName) return;
    const cleanBudget = newFlatCatBudget.replace(/[^0-9]/g, '') || '0';
    onAddCategory('Needs', cleanName, cleanBudget);
    setIsAddingFlatCategory(false);
    setNewFlatCatName('');
    setNewFlatCatBudget('');
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
        {hasTargets
          ? `Group expenses by Needs (${targetNeeds}%), Wants (${targetWants}%), and Savings (${targetSavings}%). Adjust limits or add categories as needed.`
          : 'Set spending limits for your categories that make sense for your lifestyle.'}
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

      {/* Render: Grouped (when hasTargets is true) OR Flat list (when hasTargets is false) */}
      {hasTargets ? (
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

                {/* Progress bar with target guide tick */}
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
                    const isFirstInput = group.key === 'Needs' && catIdx === 0;

                    return (
                      <CategoryRow
                        key={cat.id}
                        category={cat}
                        budget={categoryBudgets[cat.id]}
                        isEnabled={enabledCategories[cat.id]}
                        onToggle={() => onToggleCategory(cat.id)}
                        onChangeBudget={text => onChangeCategoryBudget(cat.id, text)}
                        showGroupPicker={false}
                        showCheckbox={true}
                        inputRef={isFirstInput ? firstInputRef : undefined}
                        isLast={catIdx === groupCategories.length - 1}
                      />
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
      ) : (
        /* Flat unified list for 'none' rule */
        <View style={styles.flatCard}>
          <View style={styles.categoryList}>
            {categoriesList.map((cat, catIdx) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                budget={categoryBudgets[cat.id]}
                isEnabled={enabledCategories[cat.id]}
                onToggle={() => onToggleCategory(cat.id)}
                onChangeBudget={text => onChangeCategoryBudget(cat.id, text)}
                onChangeGroup={newGroup => onChangeCategoryGroup?.(cat.id, newGroup)}
                showGroupPicker={true}
                showCheckbox={true}
                inputRef={catIdx === 0 ? firstInputRef : undefined}
                isLast={catIdx === categoriesList.length - 1 && !isAddingFlatCategory}
              />
            ))}
          </View>

          {/* Inline Add Category for Flat List */}
          {isAddingFlatCategory ? (
            <View style={styles.inlineAddCard}>
              <View style={styles.inlineAddHeader}>
                <Text style={styles.inlineAddTitle}>Add Category</Text>
                <TouchableOpacity onPress={() => setIsAddingFlatCategory(false)}>
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.inlineAddFields}>
                <TextInput
                  style={styles.inlineAddNameInput}
                  placeholder="Category name"
                  placeholderTextColor={Colors.textMuted}
                  value={newFlatCatName}
                  onChangeText={setNewFlatCatName}
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
                    value={newFlatCatBudget}
                    onChangeText={text => setNewFlatCatBudget(text.replace(/[^0-9]/g, ''))}
                    cursorColor={Colors.primaryLight}
                    selectionColor={Colors.primary}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.inlineAddConfirmBtn, { backgroundColor: Colors.primaryButton }]}
                onPress={handleConfirmAddFlat}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={Colors.onPrimary} />
                <Text style={styles.inlineAddConfirmBtnText}>Save category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addCategoryFlatBtn}
              onPress={() => {
                setIsAddingFlatCategory(true);
                setNewFlatCatName('');
                setNewFlatCatBudget('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addCategoryFlatBtnText}>Add category</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Personalized Allocation Insight */}
      {(() => {
        let text = '';
        let subtext: string | undefined;
        let icon: keyof typeof Ionicons.glyphMap = 'information-circle-outline';

        if (hasTargets) {
          if (totalAllocated <= salary) {
            const remaining = salary - totalAllocated;
            text = `You've allocated ${formatCurrencyFull(totalAllocated)} of your ${formatCurrencyFull(salary)} income. ${formatCurrencyFull(remaining)} remains unallocated — you can assign it to savings, investments, or keep it as a buffer.`;
            icon = 'checkmark-circle-outline';
          } else {
            const over = totalAllocated - salary;
            text = `Total allocated (${formatCurrencyFull(totalAllocated)}) is ${formatCurrencyFull(over)} over your monthly income. Trim ${formatCurrencyFull(over)} across your categories to keep your plan balanced.`;
            icon = 'alert-circle-outline';
          }
        } else {
          text = `Total allocated: ${formatCurrencyFull(totalAllocated)} of ${formatCurrencyFull(salary)} income.`;
          subtext = "You're setting your own limits without rigid percentage constraints.";
          icon = 'information-circle-outline';
        }

        return (
          <InsightCard
            icon={icon}
            text={text}
            subtext={subtext}
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
  flatCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addCategoryFlatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  addCategoryFlatBtnText: {
    ...Typography.bodyBold,
    color: Colors.primary,
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
    gap: Spacing.xs,
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
  budgetInputSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: 4,
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
});
