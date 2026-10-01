import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, TabularNums, withAlpha, formatCurrencyFull } from '../../src/theme';
import {
  loadData,
  updateSettings,
  resetData,
  setBudgetingRule,
  setDebtLockOverride,
} from '../../src/data/storage';
import { AppData, Category, CategoryGroup, Investment, BudgetingRule } from '../../src/types';
import ConfirmModal from '../../src/components/ConfirmModal';
import CalendarPickerModal, { getOrdinal } from '../../src/components/CalendarPickerModal';
import BudgetingRulePicker from '../../src/components/BudgetingRulePicker';
import CategoryRow from '../../src/components/CategoryRow';
import { POPULAR_GOAL_PRESETS, GOAL_COLORS, GoalPreset, BUDGETING_RULES, distributeGroupBudget } from '../../src/data/budgetData';


export default function SettingsScreen() {

  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal states
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string; onOk?: () => void } | null>(null);

  // Form states
  const [salary, setSalary] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Debt states
  const [hasDebt, setHasDebt] = useState(false);
  const [debtTotal, setDebtTotal] = useState('');
  const [debtEmi, setDebtEmi] = useState('');
  const [debtStartMonth, setDebtStartMonth] = useState('');
  const [debtEmiDay, setDebtEmiDay] = useState(15);
  const [debtReminderEnabled, setDebtReminderEnabled] = useState(true);
  const [debtInterest, setDebtInterest] = useState('0');

  const handleToggleReminder = async () => {
    const nextVal = !debtReminderEnabled;
    setDebtReminderEnabled(nextVal);
    if (nextVal && Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }
  };

  // Investment & Goals states
  const [hasInvestments, setHasInvestments] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalType, setNewGoalType] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [showGoalTargetField, setShowGoalTargetField] = useState(false);
  const [expandedGoalTargets, setExpandedGoalTargets] = useState<Record<string, boolean>>({});
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null);

  // Add custom category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<CategoryGroup>('Needs');

  // Budgeting Rule & Debt Override states
  const [budgetingRule, setBudgetingRuleState] = useState<BudgetingRule>(BUDGETING_RULES[1]);
  const [overrideDebtLock, setOverrideDebtLock] = useState(false);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [touchedCategoryIds, setTouchedCategoryIds] = useState<Set<string>>(new Set());

  const handleAutoDistributeBudgets = (
    rule: BudgetingRule = budgetingRule,
    salaryStr: string = salary,
    forceAll: boolean = false
  ) => {
    const parsedSal = parseFloat(salaryStr) || 0;
    if (!rule.targets || parsedSal <= 0) return;
    const groups: CategoryGroup[] = ['Needs', 'Wants', 'Savings'];
    setCategories(prev => {
      let res = [...prev];
      groups.forEach(grp => {
        const targetPct = rule.targets?.[grp] ?? 0;
        const grpTarget = (parsedSal * targetPct) / 100;
        const grpCats = res.filter(c => (c.group || 'Needs') === grp);
        const catNames = grpCats.map(c => c.name);
        const distributed = distributeGroupBudget(grpTarget, catNames, grp);
        res = res.map(cat => {
          if ((cat.group || 'Needs') === grp && (forceAll || !touchedCategoryIds.has(cat.id))) {
            return {
              ...cat,
              budget: distributed[cat.name] ?? cat.budget,
            };
          }
          return cat;
        });
      });
      return res;
    });
    if (forceAll) {
      setTouchedCategoryIds(new Set());
    }
  };

  const fetchData = useCallback(async () => {
    const loaded = await loadData();
    setData(loaded);
    
    // Set form initial states
    setSalary(loaded.salary.toString());
    setCategories(loaded.categories);
    setHasDebt(loaded.debtTotal > 0);
    setDebtTotal(loaded.debtTotal > 0 ? loaded.debtTotal.toString() : '');
    setDebtEmi(loaded.debtEmi > 0 ? loaded.debtEmi.toString() : '');
    setDebtStartMonth(loaded.debtStartMonth || "15 Jun '26");
    setDebtEmiDay(loaded.debtEmiDay || 15);
    setDebtReminderEnabled(loaded.debtReminderEnabled ?? true);
    setDebtInterest((loaded.debtInterestRate ?? 0).toString());
    
    const hasSIP = loaded.investments.some(inv => inv.monthlyAmount > 0);
    setHasInvestments(hasSIP);
    setInvestments(loaded.investments);
    setBudgetingRuleState(loaded.budgetingRule || BUDGETING_RULES[1]);
    setOverrideDebtLock(!!loaded.overrideDebtLock);
  }, []);

  const handleSelectBudgetingRule = async (newRule: BudgetingRule, isValid: boolean) => {

    setBudgetingRuleState(newRule);
    if (isValid) {
      await setBudgetingRule(newRule);
      setData(prev => (prev ? { ...prev, budgetingRule: newRule } : prev));
      if (newRule.targets) {
        handleAutoDistributeBudgets(newRule, salary, false);
      }
    }
  };

  const handleConfirmOverride = async () => {
    setShowOverrideConfirm(false);
    setOverrideDebtLock(true);
    await setDebtLockOverride(true);
    setData(prev => (prev ? { ...prev, overrideDebtLock: true } : prev));
  };

  const handleRevertOverride = async () => {
    setOverrideDebtLock(false);
    await setDebtLockOverride(false);
    setData(prev => (prev ? { ...prev, overrideDebtLock: false } : prev));
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!data) return;

    const parsedSalary = parseFloat(salary);
    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      setAlertModal({
        title: 'Invalid salary',
        message: 'Please enter a valid monthly salary.',
      });
      return;
    }

    // Validate Categories Budgets
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    if (totalBudget > parsedSalary) {
      setAlertModal({
        title: 'Budget exceeded',
        message: `Your total category budgets (₹${totalBudget.toLocaleString()}) exceed your monthly income (₹${parsedSalary.toLocaleString()}).`,
      });
      return;
    }

    let debtSettings: {
      total: number;
      emi: number;
      startMonth: string;
      interestRate: number;
      emiDay?: number;
      reminderEnabled?: boolean;
    } = {
      total: 0,
      emi: 0,
      startMonth: '',
      interestRate: 0,
      emiDay: 15,
      reminderEnabled: true,
    };

    if (hasDebt) {
      const total = parseFloat(debtTotal);
      const emi = parseFloat(debtEmi);
      const interest = parseFloat(debtInterest) || 0;
      if (isNaN(total) || total <= 0 || isNaN(emi) || emi <= 0) {
        setAlertModal({
          title: 'Invalid loan details',
          message: 'Please enter valid loan and EMI amounts.',
        });
        return;
      }
      if (emi > total) {
        setAlertModal({
          title: 'Invalid EMI',
          message: 'Monthly EMI cannot exceed total debt.',
        });
        return;
      }
      if (interest < 0) {
        setAlertModal({
          title: 'Invalid interest rate',
          message: 'Interest rate cannot be negative.',
        });
        return;
      }
      if (interest > 0) {
        const monthlyRate = interest / 12 / 100;
        const monthlyInterest = total * monthlyRate;
        if (emi <= monthlyInterest) {
          setAlertModal({
            title: 'EMI too low',
            message: `With an interest rate of ${interest}%, your monthly interest alone is ₹${Math.round(monthlyInterest).toLocaleString()}, which equals or exceeds your EMI of ₹${emi.toLocaleString()}. Please increase your EMI.`,
          });
          return;
        }
      }
      debtSettings = {
        total,
        emi,
        startMonth: debtStartMonth || "15 Jun '26",
        interestRate: interest,
        emiDay: debtEmiDay,
        reminderEnabled: debtReminderEnabled,
      };
    }

    // Process investments
    const updatedInvestments = investments.map(inv => {
      const mAmount = hasInvestments ? inv.monthlyAmount : 0;
      return {
        ...inv,
        monthlyAmount: mAmount,
      };
    });
    const totalSIP = updatedInvestments.reduce((sum, inv) => sum + inv.monthlyAmount, 0);
    const finalInvestments = updatedInvestments.map(inv => ({
      ...inv,
      allocation: totalSIP > 0 ? Math.round((inv.monthlyAmount / totalSIP) * 100) : 0,
    }));

    try {
      await updateSettings(parsedSalary, categories, debtSettings, finalInvestments, {
        budgetingRule,
        overrideDebtLock,
      });
      setAlertModal({
        title: 'Settings saved',
        message: 'Your configurations have been updated successfully.',
        onOk: () => router.replace('/(tabs)'),
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      setAlertModal({
        title: 'Save failed',
        message: 'An error occurred while saving your settings.',
      });
    }
  };

  const handleReset = () => {
    setResetModalVisible(true);
  };

  const handleConfirmReset = async () => {
    setResetModalVisible(false);
    await resetData();
    router.replace('/(tabs)');
  };

  const handleUpdateCategoryBudget = (id: string, text: string) => {
    setTouchedCategoryIds(prev => new Set(prev).add(id));
    const numeric = parseFloat(text.replace(/[^0-9]/g, '')) || 0;
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, budget: numeric } : cat))
    );
  };

  const handleUpdateCategoryGroup = (id: string, group: CategoryGroup) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id
          ? {
              ...cat,
              group,
              color:
                group === 'Needs'
                  ? Colors.groupNeeds
                  : group === 'Wants'
                  ? Colors.groupWants
                  : Colors.groupSavings,
            }
          : cat
      )
    );
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    }
  };

  const handleAddCategory = () => {
    const cleanName = newCatName.trim();
    const budgetVal = parseFloat(newCatBudget) || 0;

    if (!cleanName) {
      setAlertModal({
        title: 'Missing name',
        message: 'Please enter a category name.',
      });
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setAlertModal({
        title: 'Duplicate category',
        message: 'A category with this name already exists.',
      });
      return;
    }

    const hasTargets = budgetingRule?.targets !== null;
    const assignedGroup = hasTargets ? newCatGroup : 'Needs';

    const newCategory: Category = {
      id: Date.now().toString(),
      name: cleanName,
      icon: 'ellipsis-horizontal-circle',
      color:
        assignedGroup === 'Needs'
          ? Colors.groupNeeds
          : assignedGroup === 'Wants'
          ? Colors.groupWants
          : Colors.groupSavings,
      budget: budgetVal,
      spent: 0,
      group: assignedGroup,
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCatName('');
    setNewCatBudget('');
  };

  const handleUpdateInvestAmount = (id: string, text: string) => {
    const numeric = parseFloat(text.replace(/[^0-9]/g, '')) || 0;
    setInvestments(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, monthlyAmount: numeric } : inv))
    );
  };

  const handleUpdateInvestTarget = (id: string, text: string) => {
    const numeric = parseFloat(text.replace(/[^0-9]/g, '')) || undefined;
    setInvestments(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, targetAmount: numeric } : inv))
    );
  };

  const handleDeleteInvest = (id: string, name: string) => {
    setGoalToDelete({ id, name });
  };

  const handleConfirmDeleteGoal = () => {
    if (goalToDelete) {
      setInvestments(prev => prev.filter(inv => inv.id !== goalToDelete.id));
      setGoalToDelete(null);
    }
  };

  const handleAddPresetGoal = (preset: GoalPreset) => {
    if (investments.some(inv => inv.name.toLowerCase() === preset.name.toLowerCase())) {
      setAlertModal({
        title: 'Goal already added',
        message: `"${preset.name}" is already in your goals list.`,
      });
      return;
    }
    const newInv: Investment = {
      id: Date.now().toString(),
      name: preset.name,
      type: preset.type,
      color: preset.color,
      monthlyAmount: preset.defaultAmount,
      targetAmount: preset.targetAmount,
      allocation: 0,
      isActive: false,
      icon: preset.icon,
    };
    setInvestments(prev => [...prev, newInv]);
  };

  const handleAddCustomGoal = () => {
    const cleanName = newGoalName.trim();
    if (!cleanName) {
      setAlertModal({
        title: 'Missing name',
        message: 'Please enter a name for your goal or investment.',
      });
      return;
    }
    if (investments.some(inv => inv.name.toLowerCase() === cleanName.toLowerCase())) {
      setAlertModal({
        title: 'Duplicate goal',
        message: 'A goal with this name already exists.',
      });
      return;
    }
    const amountVal = parseFloat(newGoalAmount.replace(/[^0-9]/g, '')) || 0;
    const targetVal = parseFloat(newGoalTarget.replace(/[^0-9]/g, '')) || undefined;
    const newInv: Investment = {
      id: Date.now().toString(),
      name: cleanName,
      type: newGoalType.trim() || 'Custom Goal',
      color: GOAL_COLORS[investments.length % GOAL_COLORS.length],
      monthlyAmount: amountVal,
      targetAmount: targetVal,
      allocation: 0,
      isActive: false,
      icon: 'flag-outline',
    };
    setInvestments(prev => [...prev, newInv]);
    setNewGoalName('');
    setNewGoalType('');
    setNewGoalAmount('');
    setNewGoalTarget('');
    setShowGoalTargetField(false);
    setShowAddGoalForm(false);
  };

  if (!data) {
    return (
      <View style={styles.loading}>
        <Ionicons name="settings" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  const totalAllocatedBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure app preferences and database slates</Text>

        {/* Monthly Salary */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cash-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Monthly Income</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Net Monthly Salary</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputSymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={salary}
                onChangeText={text => setSalary(text.replace(/[^0-9]/g, ''))}
                cursorColor={Colors.primaryLight}
                selectionColor={Colors.primary}
              />
            </View>
          </View>
        </View>

        {/* Budgeting Framework Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="compass-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Budgeting Framework</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose a percentage framework to guide your spending, or budget freely without a rule.
          </Text>
          <BudgetingRulePicker
            selectedRule={budgetingRule}
            onSelectRule={handleSelectBudgetingRule}
          />
        </View>

        {/* Categories Budgets */}
        <View style={styles.section}>
          {(() => {
            const hasTargets = budgetingRule?.targets !== null;
            const groups = [
              {
                key: 'Needs' as CategoryGroup,
                title: hasTargets ? `Needs (${budgetingRule.targets!.Needs}% target)` : 'Needs',
                color: Colors.groupNeeds,
                icon: 'home-outline' as const,
              },
              {
                key: 'Wants' as CategoryGroup,
                title: hasTargets ? `Wants (${budgetingRule.targets!.Wants}% target)` : 'Wants',
                color: Colors.groupWants,
                icon: 'cart-outline' as const,
              },
              {
                key: 'Savings' as CategoryGroup,
                title: hasTargets ? `Savings & Debt (${budgetingRule.targets!.Savings}% target)` : 'Savings & Debt',
                color: Colors.groupSavings,
                icon: 'wallet-outline' as const,
              },
            ];

            return (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderTitleGroup}>
                    <Ionicons name="pie-chart-outline" size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Budgets & Categories</Text>
                  </View>
                  <Text style={[
                    styles.overviewBudget,
                    totalAllocatedBudget > parseFloat(salary) ? { color: Colors.accentRed } : { color: Colors.accentGreen }
                  ]}>
                    Total Allocated: ₹{totalAllocatedBudget.toLocaleString()}
                  </Text>
                </View>

                {hasTargets && (
                  <TouchableOpacity
                    style={styles.autoDistributeBtn}
                    onPress={() => handleAutoDistributeBudgets(budgetingRule, salary, false)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Auto-distribute budgets from rule"
                  >
                    <Ionicons name="sparkles-outline" size={14} color={Colors.primaryLight} />
                    <Text style={styles.autoDistributeBtnText}>
                      Auto-distribute untouched budgets from rule
                    </Text>
                  </TouchableOpacity>
                )}

                {hasTargets ? (
                  groups.map(group => {
                    const groupCats = categories.filter(c => (c.group || 'Needs') === group.key);
                    const groupSubtotal = groupCats.reduce((sum, c) => sum + c.budget, 0);
                    const parsedSal = parseFloat(salary) || 1;
                    const groupPct = Math.round((groupSubtotal / parsedSal) * 100);

                    return (
                      <View key={group.key} style={[styles.card, { marginBottom: Spacing.md }]}>
                        <View style={styles.groupSubHeader}>
                          <View style={styles.groupSubTitleRow}>
                            <Ionicons name={group.icon} size={16} color={group.color} />
                            <Text style={[styles.groupSubTitle, { color: group.color }]}>{group.title}</Text>
                          </View>
                          <Text style={styles.groupSubAmount}>
                            {formatCurrencyFull(groupSubtotal)} ({groupPct}%)
                          </Text>
                        </View>

                        {groupCats.length === 0 ? (
                          <Text style={styles.emptyGroupText}>No categories in this group.</Text>
                        ) : (
                          groupCats.map((cat, index) => (
                            <CategoryRow
                              key={cat.id}
                              category={cat}
                              budget={cat.budget}
                              onChangeBudget={text => handleUpdateCategoryBudget(cat.id, text)}
                              onDelete={() => handleDeleteCategory(cat.id, cat.name)}
                              showColorDot={true}
                              showGroupPicker={false}
                              isLast={index === groupCats.length - 1}
                            />
                          ))
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={[styles.card, { marginBottom: Spacing.md }]}>
                    {categories.length === 0 ? (
                      <Text style={styles.emptyGroupText}>No categories configured.</Text>
                    ) : (
                      categories.map((cat, index) => (
                        <CategoryRow
                          key={cat.id}
                          category={cat}
                          budget={cat.budget}
                          onChangeBudget={text => handleUpdateCategoryBudget(cat.id, text)}
                          onChangeGroup={newGroup => handleUpdateCategoryGroup(cat.id, newGroup)}
                          onDelete={() => handleDeleteCategory(cat.id, cat.name)}
                          showColorDot={true}
                          showGroupPicker={true}
                          isLast={index === categories.length - 1}
                        />
                      ))
                    )}
                  </View>
                )}

                {/* Add Custom Category */}
                <View style={styles.card}>
                  <View style={styles.addCategoryForm}>
                    <Text style={styles.addCategoryTitle}>Add Custom Category</Text>

                    {/* Group Selector Chips (only shown when hasTargets is true) */}
                    {hasTargets && (
                      <View style={styles.groupSelectorRow}>
                        {(['Needs', 'Wants', 'Savings'] as CategoryGroup[]).map(g => (
                          <TouchableOpacity
                            key={g}
                            style={[
                              styles.groupSelectorChip,
                              newCatGroup === g && {
                                backgroundColor: withAlpha(
                                  g === 'Needs' ? Colors.groupNeeds : g === 'Wants' ? Colors.groupWants : Colors.groupSavings,
                                  0.2
                                ),
                                borderColor: g === 'Needs' ? Colors.groupNeeds : g === 'Wants' ? Colors.groupWants : Colors.groupSavings,
                              },
                            ]}
                            onPress={() => setNewCatGroup(g)}
                          >
                            <Text
                              style={[
                                styles.groupSelectorChipText,
                                newCatGroup === g && {
                                  color: g === 'Needs' ? Colors.groupNeeds : g === 'Wants' ? Colors.groupWants : Colors.groupSavings,
                                },
                              ]}
                            >
                              {g}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <View style={styles.addCategoryRow}>
                      <TextInput
                        style={[styles.addCategoryInput, { flex: 1.5 }]}
                        placeholder="Category Name (e.g. Charity)"
                        placeholderTextColor={Colors.textMuted}
                        value={newCatName}
                        onChangeText={setNewCatName}
                        cursorColor={Colors.primaryLight}
                        selectionColor={Colors.primary}
                      />
                      <View style={[styles.smallInputWrap, { flex: 1, height: 40 }]}>
                        <Text style={styles.smallInputSymbol}>₹</Text>
                        <TextInput
                          style={styles.smallTextInput}
                          placeholder="Budget"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={newCatBudget}
                          onChangeText={text => setNewCatBudget(text.replace(/[^0-9]/g, ''))}
                          cursorColor={Colors.primaryLight}
                          selectionColor={Colors.primary}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.addCatButton}
                        onPress={handleAddCategory}
                        accessibilityRole="button"
                        accessibilityLabel="Add category"
                      >
                        <Ionicons name="add" size={20} color={Colors.onPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            );
          })()}
        </View>

        {/* Debt paydown Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trending-down-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Debt Payoff Settings</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Track Active Debt</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, hasDebt ? styles.toggleBtnActive : null]}
                onPress={() => setHasDebt(!hasDebt)}
              >
                <View style={[styles.toggleCircle, hasDebt ? styles.toggleCircleActive : null]} />
              </TouchableOpacity>
            </View>

            {hasDebt && (
              <View style={styles.formContent}>
                <View style={styles.field}>
                  <Text style={styles.label}>Total Debt Amount</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputSymbol}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={debtTotal}
                      onChangeText={text => setDebtTotal(text.replace(/[^0-9]/g, ''))}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Monthly EMI</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputSymbol}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={debtEmi}
                      onChangeText={text => setDebtEmi(text.replace(/[^0-9]/g, ''))}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Annual Interest Rate (%)</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputSymbol}>%</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      value={debtInterest}
                      onChangeText={text => setDebtInterest(text.replace(/[^0-9.]/g, ''))}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                </View>

                {/* Neutral interest phrasing */}
                {(!debtInterest || debtInterest === '0' || parseFloat(debtInterest) === 0) ? (
                  <View style={styles.halalBadge}>
                    <Ionicons name="leaf-outline" size={18} color={Colors.accentGreen} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.halalBadgeTitle}>0% Interest • Interest-free loan</Text>
                      <Text style={styles.halalBadgeSubtitle}>No interest charges or accrual on this balance.</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.conventionalBadge}>
                    <Ionicons name="warning-outline" size={18} color={Colors.accentAmber} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.conventionalBadgeTitle}>{debtInterest}% Annual Interest</Text>
                      <Text style={styles.conventionalBadgeSubtitle}>Standard loan with monthly interest accrual.</Text>
                    </View>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>EMI Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerWrap}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} style={{ marginRight: Spacing.sm }} />
                    <Text style={[styles.datePickerText, !debtStartMonth && { color: Colors.textMuted }]}>
                      {debtStartMonth || "Select EMI date"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>

                  {/* Reminder Check Option */}
                  <TouchableOpacity
                    style={styles.reminderCheckOption}
                    onPress={handleToggleReminder}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkboxBox, debtReminderEnabled && styles.checkboxBoxChecked]}>
                      {debtReminderEnabled && (
                        <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />
                      )}
                    </View>
                    <View style={styles.reminderCheckContent}>
                      <Text style={styles.reminderCheckLabel}>
                        Send reminder notification
                      </Text>
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
              </View>
            )}
          </View>
        </View>

        {/* Investments & Goals Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Investment & Savings Goals</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Enable Investment & Savings Goals</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, hasInvestments ? styles.toggleBtnActive : null]}
                onPress={() => setHasInvestments(!hasInvestments)}
              >
                <View style={[styles.toggleCircle, hasInvestments ? styles.toggleCircleActive : null]} />
              </TouchableOpacity>
            </View>

            {hasInvestments && (
              <View style={styles.formContent}>
                {/* High-Interest Debt Pause Notice & Override Control */}
                {hasDebt && (parseFloat(debtInterest) || 0) > 0 && (
                  <View style={!overrideDebtLock ? styles.lockNoticeCard : styles.activeOverrideNoticeCard}>
                    <View style={styles.lockNoticeHeader}>
                      <Ionicons
                        name={!overrideDebtLock ? "lock-closed-outline" : "checkmark-circle"}
                        size={18}
                        color={!overrideDebtLock ? Colors.accentAmber : Colors.accentGreen}
                      />
                      <Text style={!overrideDebtLock ? styles.lockNoticeTitle : styles.activeOverrideTitle}>
                        {!overrideDebtLock
                          ? `Investments Paused for ${debtInterest}% Interest Debt`
                          : 'Concurrent Investing Active'}
                      </Text>
                    </View>
                    <Text style={styles.lockNoticeText}>
                      {!overrideDebtLock
                        ? `Your loan accrues ${debtInterest}% annual interest. Paying off interest-bearing debt first eliminates costly finance charges. You can override this and start investing concurrently.`
                        : `You have chosen to invest concurrently alongside your ${debtInterest}% interest loan repayments.`}
                    </Text>
                    {!overrideDebtLock ? (
                      <TouchableOpacity
                        style={styles.overrideBtn}
                        onPress={() => setShowOverrideConfirm(true)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Start investing anyway"
                      >
                        <Ionicons name="flash-outline" size={16} color={Colors.accent} />
                        <Text style={styles.overrideBtnText}>Start investing anyway</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.revertOverrideBtn}
                        onPress={handleRevertOverride}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Pause investing to prioritize debt"
                      >
                        <Text style={styles.revertOverrideBtnText}>Pause investing to prioritize debt payoff</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Popular Presets with Multi-Row Wrapping */}
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Quick Add Suggestions:</Text>
                  <View style={styles.presetWrap}>
                    {POPULAR_GOAL_PRESETS.map(preset => {
                      const isAdded = investments.some(inv => inv.name.toLowerCase() === preset.name.toLowerCase());
                      return (
                        <TouchableOpacity
                          key={preset.name}
                          style={[styles.presetChip, isAdded && styles.presetChipAdded]}
                          onPress={() => handleAddPresetGoal(preset)}
                          disabled={isAdded}
                        >
                          <Ionicons
                            name={isAdded ? "checkmark-circle" : (preset.icon as any)}
                            size={14}
                            color={isAdded ? Colors.accentGreen : preset.color}
                          />
                          <Text style={[styles.presetChipText, isAdded && styles.presetChipTextAdded]}>
                            {preset.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Goals List */}
                {investments.length === 0 ? (
                  <View style={styles.emptyGoalsCard}>
                    <Ionicons name="flag-outline" size={32} color={Colors.textMuted} />
                    <Text style={styles.emptyGoalsText}>
                      No goals configured. Tap a suggestion above or create a custom goal below.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.goalsListContainer}>
                    <Text style={styles.goalsListTitle}>Monthly contribution</Text>
                    {investments.map(inv => {
                      const hasTarget = !!inv.targetAmount && inv.targetAmount > 0;
                      const isExpanded = expandedGoalTargets[inv.id] || hasTarget;
                      let etaText = '';
                      if (hasTarget && inv.monthlyAmount > 0) {
                        const months = Math.ceil(inv.targetAmount! / inv.monthlyAmount);
                        const years = (months / 12).toFixed(1);
                        etaText = `Estimated: ~${months} mo (${years} yr)`;
                      }

                      return (
                        <View key={inv.id} style={styles.goalCard}>
                          <View style={styles.investRow}>
                            <View style={[styles.goalIconWrap, { backgroundColor: withAlpha(inv.color || Colors.primary, 0.15) }]}>
                              <Ionicons name={(inv.icon as any) || 'flag'} size={18} color={inv.color || Colors.primary} />
                            </View>
                            <View style={styles.goalInfoWrap}>
                              <Text style={styles.investName} numberOfLines={1}>{inv.name}</Text>
                              <Text style={styles.investType} numberOfLines={1}>{inv.type}</Text>
                            </View>
                            <View style={styles.goalRightWrap}>
                              <View style={styles.monthlyInputWrap}>
                                <Text style={styles.smallInputSymbol}>₹</Text>
                                <TextInput
                                  style={styles.smallTextInput}
                                  keyboardType="numeric"
                                  value={inv.monthlyAmount.toString()}
                                  onChangeText={text => handleUpdateInvestAmount(inv.id, text)}
                                  cursorColor={Colors.primaryLight}
                                  selectionColor={Colors.primary}
                                />
                                <Text style={styles.perMonthSuffix}>/ mo</Text>
                              </View>
                              <TouchableOpacity
                                style={styles.deleteGoalBtn}
                                onPress={() => handleDeleteInvest(inv.id, inv.name)}
                                accessibilityRole="button"
                                accessibilityLabel={`Delete ${inv.name}`}
                              >
                                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Target Amount & ETA */}
                          {isExpanded ? (
                            <View style={styles.targetSection}>
                              <View style={styles.targetRow}>
                                <Text style={styles.targetFieldLabel}>Target Goal:</Text>
                                <View style={styles.targetInputBox}>
                                  <Text style={styles.smallInputSymbol}>₹</Text>
                                  <TextInput
                                    style={styles.smallTextInput}
                                    placeholder="Total (e.g. 1,00,000)"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="numeric"
                                    value={inv.targetAmount ? inv.targetAmount.toString() : ''}
                                    onChangeText={text => handleUpdateInvestTarget(inv.id, text)}
                                    cursorColor={Colors.primaryLight}
                                    selectionColor={Colors.primary}
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
                              onPress={() => setExpandedGoalTargets(prev => ({ ...prev, [inv.id]: true }))}
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
                  >
                    <Ionicons name="add-circle-outline" size={18} color={Colors.primaryLight} />
                    <Text style={styles.openAddGoalBtnText}>Add Custom Goal / Investment</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.addGoalCard}>
                    <View style={styles.addGoalHeader}>
                      <Text style={styles.addGoalCardTitle}>Create Custom Goal</Text>
                      <TouchableOpacity onPress={() => setShowAddGoalForm(false)}>
                        <Ionicons name="close" size={18} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.addGoalInput}
                      placeholder="Goal Name (e.g. Wedding, Dream Car, Tech Setup)"
                      placeholderTextColor={Colors.textMuted}
                      value={newGoalName}
                      onChangeText={setNewGoalName}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                    <View style={styles.addGoalRow}>
                      <TextInput
                        style={[styles.addGoalInput, { flex: 1.2 }]}
                        placeholder="Category (e.g. Savings, SIP)"
                        placeholderTextColor={Colors.textMuted}
                        value={newGoalType}
                        onChangeText={setNewGoalType}
                        cursorColor={Colors.primaryLight}
                        selectionColor={Colors.primary}
                      />
                      <View style={[styles.monthlyInputWrap, { flex: 1, height: 40 }]}>
                        <Text style={styles.smallInputSymbol}>₹</Text>
                        <TextInput
                          style={styles.smallTextInput}
                          placeholder="Monthly"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={newGoalAmount}
                          onChangeText={setNewGoalAmount}
                          cursorColor={Colors.primaryLight}
                          selectionColor={Colors.primary}
                        />
                        <Text style={styles.perMonthSuffix}>/ mo</Text>
                      </View>
                    </View>

                    {/* Optional Target for Custom Goal */}
                    {showGoalTargetField ? (
                      <View style={styles.targetRow}>
                        <Text style={styles.targetFieldLabel}>Target Goal:</Text>
                        <View style={styles.targetInputBox}>
                          <Text style={styles.smallInputSymbol}>₹</Text>
                          <TextInput
                            style={styles.smallTextInput}
                            placeholder="e.g. 1,00,000"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                            value={newGoalTarget}
                            onChangeText={setNewGoalTarget}
                            cursorColor={Colors.primaryLight}
                            selectionColor={Colors.primary}
                          />
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.setTargetBtn}
                        onPress={() => setShowGoalTargetField(true)}
                      >
                        <Ionicons name="add" size={14} color={Colors.primaryLight} />
                        <Text style={styles.setTargetBtnText}>Set a target amount (optional)</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.addGoalConfirmBtn}
                      onPress={handleAddCustomGoal}
                      accessibilityRole="button"
                      accessibilityLabel="Add goal"
                    >
                      <Ionicons name="add" size={18} color={Colors.onPrimary} />
                      <Text style={styles.addGoalConfirmBtnText}>Add Goal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Credit Cards Section Link */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Credit Cards</Text>
          </View>
          <TouchableOpacity
            style={styles.cardNavRow}
            onPress={() => router.push('/(tabs)/cards')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Manage your credit cards"
          >
            <View style={styles.cardNavLeft}>
              <View style={styles.cardNavIcon}>
                <Ionicons name="card" size={20} color={Colors.primaryLight} />
              </View>
              <View style={styles.cardNavInfo}>
                <Text style={styles.cardNavTitle}>Manage Credit Cards</Text>
                <Text style={styles.cardNavSubtitle}>
                  View cards, automated SMS spend tracking & pending reviews
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>


        {/* System Operations */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>System Operations</Text>
          </View>
          <View style={[styles.card, styles.resetCard]}>
            <Text style={styles.resetText}>
              Clears the local database and returns the application to its first-launch onboarding state.
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.onPrimary} />
              <Text style={styles.resetButtonText}>Reset Application Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Actions */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-done" size={22} color={Colors.onPrimary} />
          <Text style={styles.saveButtonText}>Save Configurations</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.huge * 2 }} />
      </ScrollView>

      {/* Confirmation Modals */}
      <ConfirmModal
        visible={resetModalVisible}
        title="Reset Application"
        message="Are you sure you want to clear all configurations and transactions? This will return the app to the onboarding screen."
        cancelText="Cancel"
        confirmText="Reset Everything"
        confirmStyle="destructive"
        icon="warning-outline"
        onCancel={() => setResetModalVisible(false)}
        onConfirm={handleConfirmReset}
      />

      <ConfirmModal
        visible={categoryToDelete !== null}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? Existing expenses for this category will remain, but the budget will be removed.`}
        cancelText="Cancel"
        confirmText="Delete"
        confirmStyle="destructive"
        icon="trash-outline"
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
      />

      <ConfirmModal
        visible={goalToDelete !== null}
        title="Delete Goal"
        message={`Are you sure you want to remove the goal "${goalToDelete?.name}"?`}
        cancelText="Cancel"
        confirmText="Delete"
        confirmStyle="destructive"
        icon="trash-outline"
        onCancel={() => setGoalToDelete(null)}
        onConfirm={handleConfirmDeleteGoal}
      />

      <ConfirmModal
        visible={showOverrideConfirm}
        title="Start investing anyway?"
        message={`Your debt accrues interest at ${debtInterest}%. Mathematically, paying off high-interest debt usually saves more money than standard investments earn. Are you sure you want to invest concurrently?`}
        confirmText="Start investing anyway"
        cancelText="Keep debt focus"
        confirmStyle="primary"
        icon="alert-circle-outline"
        onCancel={() => setShowOverrideConfirm(false)}
        onConfirm={handleConfirmOverride}
      />

      <ConfirmModal
        visible={alertModal !== null}
        title={alertModal?.title || ''}
        message={alertModal?.message || ''}
        confirmText="OK"
        showCancel={false}
        confirmStyle="primary"
        icon="alert-circle-outline"
        onCancel={() => {
          const cb = alertModal?.onOk;
          setAlertModal(null);
          cb?.();
        }}
        onConfirm={() => {
          const cb = alertModal?.onOk;
          setAlertModal(null);
          cb?.();
        }}
      />

      {/* Calendar Date/Month Picker Modal */}
      <CalendarPickerModal
        visible={showDatePicker}
        initialValue={debtStartMonth}
        onClose={() => setShowDatePicker(false)}
        onSelect={(formattedDate, day) => {
          setDebtStartMonth(formattedDate);
          setDebtEmiDay(day);
        }}
      />
    </KeyboardAvoidingView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.huge + Spacing.md,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  lockNoticeCard: {
    backgroundColor: withAlpha(Colors.accentAmber, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentAmber, 0.25),
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  activeOverrideNoticeCard: {
    backgroundColor: withAlpha(Colors.accentGreen, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentGreen, 0.25),
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  lockNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  lockNoticeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentAmber,
    flex: 1,
  },
  activeOverrideTitle: {
    ...Typography.bodyBold,
    color: Colors.accentGreen,
    flex: 1,
  },
  lockNoticeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: withAlpha(Colors.accent, 0.15),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.35),
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  overrideBtnText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.accent,
  },
  revertOverrideBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  revertOverrideBtnText: {
    ...Typography.small,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  overviewBudget: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
  },
  autoDistributeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.25),
    marginBottom: Spacing.md,
  },
  autoDistributeBtnText: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  categoryRowLast: {
    borderBottomWidth: 0,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
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
  inputSymbol: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    ...TabularNums,
  },
  textInput: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.md,
    ...TabularNums,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  categoryRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  smallInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    width: 100,
  },
  smallInputSymbol: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  smallTextInput: {
    ...Typography.caption,
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.sm,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  deleteCatButton: {
    padding: Spacing.sm,
  },
  addCategoryForm: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addCategoryTitle: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyBold.fontFamily,
    marginBottom: Spacing.md,
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addCategoryInput: {
    ...Typography.caption,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 40,
    color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  addCatButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primaryButton,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleBtn: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHighlight,
    padding: 2,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.onPrimary,
  },
  formContent: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  field: {
    width: '100%',
  },
  halalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accentGreen, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentGreen, 0.28),
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  halalBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentGreen,
  },
  halalBadgeSubtitle: {
    ...Typography.small,
    color: Colors.accentGreen,
    opacity: 0.85,
    marginTop: 2,
  },
  conventionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accentAmber, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentAmber, 0.28),
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  conventionalBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentAmber,
  },
  conventionalBadgeSubtitle: {
    ...Typography.small,
    color: Colors.accentAmber,
    opacity: 0.85,
    marginTop: 2,
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
  investRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  goalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfoWrap: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  goalRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  deleteGoalBtn: {
    padding: 6,
  },
  presetSection: {
    marginBottom: Spacing.xs,
  },
  presetSectionTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  presetScroll: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: 4,
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
  emptyGoalsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: withAlpha(Colors.surfaceHighlight, 0.3),
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  emptyGoalsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
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
    marginTop: Spacing.sm,
  },
  openAddGoalBtnText: {
    ...Typography.bodyBold,
    color: Colors.primaryLight,
  },
  addGoalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
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
  addGoalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryButton,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    marginTop: 4,
  },
  addGoalConfirmBtnText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
  resetCard: {
    borderColor: withAlpha(Colors.accentRed, 0.25),
    backgroundColor: withAlpha(Colors.accentRed, 0.05),
    gap: Spacing.lg,
  },
  resetText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentRed,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  resetButtonText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryButton,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
    ...Shadows.elevated,
  },
  saveButtonText: {
    ...Typography.subtitle,
    color: Colors.onPrimary,
  },

  // Category Groups in Settings
  groupSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(Colors.border, 0.5),
  },
  groupSubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  groupSubTitle: {
    ...Typography.bodyBold,
  },
  groupSubAmount: {
    ...Typography.caption,
    ...TabularNums,
    color: Colors.textSecondary,
  },
  emptyGroupText: {
    ...Typography.small,
    color: Colors.textMuted,
    paddingVertical: Spacing.sm,
  },
  groupSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  groupSelectorChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupSelectorChipText: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textSecondary,
  },

  // Goals List with Monthly & Target
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  goalsListContainer: {
    gap: Spacing.md,
  },
  goalsListTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  goalCard: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  monthlyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 110,
    height: 36,
  },
  perMonthSuffix: {
    ...Typography.small,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  targetSection: {
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: withAlpha(Colors.border, 0.5),
    gap: Spacing.xs,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  targetFieldLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  targetInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 140,
    height: 32,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    backgroundColor: withAlpha(Colors.primary, 0.12),
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
    paddingTop: 2,
  },
  setTargetBtnText: {
    ...Typography.small,
    color: Colors.primaryLight,
  },
  cardNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardNavIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: withAlpha(Colors.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNavInfo: {
    flex: 1,
    gap: 2,
  },
  cardNavTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  cardNavSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

