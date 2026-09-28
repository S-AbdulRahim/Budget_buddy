import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/theme';
import { loadData, updateSettings, resetData } from '../../src/data/storage';
import { AppData, Category, Investment } from '../../src/types';
import ConfirmModal from '../../src/components/ConfirmModal';
import CalendarPickerModal, { getOrdinal } from '../../src/components/CalendarPickerModal';
import { POPULAR_GOAL_PRESETS, GOAL_COLORS, GoalPreset } from '../../src/data/budgetData';

export default function SettingsScreen() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal states
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

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
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null);

  // Add custom category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');

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
  }, []);

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
      Alert.alert('Invalid Salary', 'Please enter a valid monthly salary.');
      return;
    }

    // Validate Categories Budgets
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    if (totalBudget > parsedSalary) {
      Alert.alert(
        'Budget Exceeded',
        `Your total category budgets (₹${totalBudget.toLocaleString()}) exceed your monthly income (₹${parsedSalary.toLocaleString()}).`
      );
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
        Alert.alert('Invalid Debt Details', 'Please enter valid loan and EMI amounts.');
        return;
      }
      if (emi > total) {
        Alert.alert('Invalid EMI', 'Monthly EMI cannot exceed total debt.');
        return;
      }
      if (interest < 0) {
        Alert.alert('Invalid Interest Rate', 'Interest rate cannot be negative.');
        return;
      }
      if (interest > 0) {
        const monthlyRate = interest / 12 / 100;
        const monthlyInterest = total * monthlyRate;
        if (emi <= monthlyInterest) {
          Alert.alert(
            'EMI Too Low',
            `With an interest rate of ${interest}%, your monthly interest alone is ₹${Math.round(monthlyInterest).toLocaleString()}, which equals or exceeds your EMI of ₹${emi.toLocaleString()}. Please increase your EMI.`
          );
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
      await updateSettings(parsedSalary, categories, debtSettings, finalInvestments);
      Alert.alert('Settings Saved', 'Your configurations have been updated successfully.');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Save Failed', 'An error occurred while saving your settings.');
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
    const numeric = parseFloat(text.replace(/[^0-9]/g, '')) || 0;
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, budget: numeric } : cat))
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
      Alert.alert('Missing Name', 'Please enter a category name.');
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      Alert.alert('Duplicate Category', 'A category with this name already exists.');
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: cleanName,
      icon: 'ellipsis-horizontal-circle', // Default custom icon
      color: Colors.accent, // Default custom color
      budget: budgetVal,
      spent: 0,
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
      Alert.alert('Goal Already Added', `"${preset.name}" is already in your goals list.`);
      return;
    }
    const newInv: Investment = {
      id: Date.now().toString(),
      name: preset.name,
      type: preset.type,
      color: preset.color,
      monthlyAmount: preset.defaultAmount,
      allocation: 0,
      isActive: false,
      icon: preset.icon,
    };
    setInvestments(prev => [...prev, newInv]);
  };

  const handleAddCustomGoal = () => {
    const cleanName = newGoalName.trim();
    if (!cleanName) {
      Alert.alert('Missing Name', 'Please enter a name for your goal or investment.');
      return;
    }
    if (investments.some(inv => inv.name.toLowerCase() === cleanName.toLowerCase())) {
      Alert.alert('Duplicate Goal', 'A goal with this name already exists.');
      return;
    }
    const amountVal = parseFloat(newGoalAmount.replace(/[^0-9]/g, '')) || 0;
    const newInv: Investment = {
      id: Date.now().toString(),
      name: cleanName,
      type: newGoalType.trim() || 'Custom Goal',
      color: GOAL_COLORS[investments.length % GOAL_COLORS.length],
      monthlyAmount: amountVal,
      allocation: 0,
      isActive: false,
      icon: 'flag-outline',
    };
    setInvestments(prev => [...prev, newInv]);
    setNewGoalName('');
    setNewGoalType('');
    setNewGoalAmount('');
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

        {/* Categories Budgets */}
        <View style={styles.section}>
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

          <View style={styles.card}>
            {categories.map((cat, index) => (
              <View
                key={cat.id}
                style={[
                  styles.categoryRow,
                  index === categories.length - 1 && styles.categoryRowLast,
                ]}
              >
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
                
                <View style={styles.categoryRowRight}>
                  <View style={styles.smallInputWrap}>
                    <Text style={styles.smallInputSymbol}>₹</Text>
                    <TextInput
                      style={styles.smallTextInput}
                      keyboardType="numeric"
                      value={cat.budget.toString()}
                      onChangeText={text => handleUpdateCategoryBudget(cat.id, text)}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteCatButton}
                    onPress={() => handleDeleteCategory(cat.id, cat.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Add Custom Category */}
            <View style={styles.addCategoryForm}>
              <Text style={styles.addCategoryTitle}>Add Custom Category</Text>
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
                <TouchableOpacity style={styles.addCatButton} onPress={handleAddCategory}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
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

                {/* Halal / Shariah-compliant badge or conventional notice */}
                {(!debtInterest || debtInterest === '0' || parseFloat(debtInterest) === 0) ? (
                  <View style={styles.halalBadge}>
                    <Ionicons name="leaf" size={18} color={Colors.accentGreen} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.halalBadgeTitle}>0% Interest • Shariah Compliant</Text>
                      <Text style={styles.halalBadgeSubtitle}>Qard Hasan (interest-free loan). 100% Halal debt.</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.conventionalBadge}>
                    <Ionicons name="alert-circle-outline" size={18} color={Colors.accentAmber} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.conventionalBadgeTitle}>{debtInterest}% Annual Interest</Text>
                      <Text style={styles.conventionalBadgeSubtitle}>Conventional loan with interest accrual.</Text>
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
                        <Ionicons name="checkmark" size={14} color="#fff" />
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
                {/* Popular Presets Bar */}
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Quick Add Suggestions:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
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
                  </ScrollView>
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
                  investments.map(inv => (
                    <View key={inv.id} style={styles.investRow}>
                      <View style={[styles.goalIconWrap, { backgroundColor: (inv.color || Colors.primary) + '20' }]}>
                        <Ionicons name={(inv.icon as any) || 'flag'} size={18} color={inv.color || Colors.primary} />
                      </View>
                      <View style={styles.goalInfoWrap}>
                        <Text style={styles.investName} numberOfLines={1}>{inv.name}</Text>
                        <Text style={styles.investType} numberOfLines={1}>{inv.type}</Text>
                      </View>
                      <View style={styles.goalRightWrap}>
                        <View style={styles.smallInputWrap}>
                          <Text style={styles.smallInputSymbol}>₹</Text>
                          <TextInput
                            style={styles.smallTextInput}
                            keyboardType="numeric"
                            value={inv.monthlyAmount.toString()}
                            onChangeText={text => handleUpdateInvestAmount(inv.id, text)}
                            cursorColor={Colors.primaryLight}
                            selectionColor={Colors.primary}
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.deleteGoalBtn}
                          onPress={() => handleDeleteInvest(inv.id, inv.name)}
                          accessibilityLabel={`Delete ${inv.name}`}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
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
                      <View style={[styles.smallInputWrap, { flex: 1, height: 40 }]}>
                        <Text style={styles.smallInputSymbol}>₹</Text>
                        <TextInput
                          style={styles.smallTextInput}
                          placeholder="Amount"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={newGoalAmount}
                          onChangeText={setNewGoalAmount}
                          cursorColor={Colors.primaryLight}
                          selectionColor={Colors.primary}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.addGoalConfirmBtn}
                      onPress={handleAddCustomGoal}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={styles.addGoalConfirmBtnText}>Add Goal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
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
              <Ionicons name="alert-circle-outline" size={20} color="#fff" />
              <Text style={styles.resetButtonText}>Reset Application Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Actions */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-done" size={22} color="#fff" />
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
  overviewBudget: {
    ...Typography.caption,
    fontWeight: '600',
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
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
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
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
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
  },
  textInput: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.md,
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
    fontWeight: '700',
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
    backgroundColor: Colors.primary,
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
    backgroundColor: '#fff',
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
    backgroundColor: Colors.accentGreen + '15',
    borderWidth: 1,
    borderColor: Colors.accentGreen + '35',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  halalBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentGreen,
    fontSize: 13,
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
    backgroundColor: Colors.accentAmber + '15',
    borderWidth: 1,
    borderColor: Colors.accentAmber + '35',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  conventionalBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentAmber,
    fontSize: 13,
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
    fontSize: 14,
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
    fontWeight: '600',
  },
  presetChipTextAdded: {
    color: Colors.textMuted,
  },
  emptyGoalsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surfaceHighlight + '40',
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
    fontSize: 14,
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
    fontSize: 14,
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
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    marginTop: 4,
  },
  addGoalConfirmBtnText: {
    ...Typography.bodyBold,
    color: '#fff',
    fontSize: 14,
  },
  resetCard: {
    borderColor: Colors.accentRed + '40',
    backgroundColor: Colors.accentRed + '05',
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
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
    ...Shadows.elevated,
  },
  saveButtonText: {
    ...Typography.subtitle,
    color: '#fff',
  },
});
