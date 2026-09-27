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

export default function SettingsScreen() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [salary, setSalary] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Debt states
  const [hasDebt, setHasDebt] = useState(false);
  const [debtTotal, setDebtTotal] = useState('');
  const [debtEmi, setDebtEmi] = useState('');
  const [debtStartMonth, setDebtStartMonth] = useState('');

  // Investment states
  const [hasInvestments, setHasInvestments] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);

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
    setDebtStartMonth(loaded.debtStartMonth || "Jun '26");
    
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

    let debtSettings = {
      total: 0,
      emi: 0,
      startMonth: '',
    };

    if (hasDebt) {
      const total = parseFloat(debtTotal);
      const emi = parseFloat(debtEmi);
      if (isNaN(total) || total <= 0 || isNaN(emi) || emi <= 0) {
        Alert.alert('Invalid Debt Details', 'Please enter valid loan and EMI amounts.');
        return;
      }
      if (emi > total) {
        Alert.alert('Invalid EMI', 'Monthly EMI cannot exceed total debt.');
        return;
      }
      debtSettings = {
        total,
        emi,
        startMonth: debtStartMonth || "Jun '26",
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
    Alert.alert(
      'Reset Application',
      'Are you sure you want to clear all configurations and transactions? This will return the app to the onboarding screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetData();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleUpdateCategoryBudget = (id: string, text: string) => {
    const numeric = parseFloat(text.replace(/[^0-9]/g, '')) || 0;
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, budget: numeric } : cat))
    );
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the category "${name}"? Existing expenses for this category will remain, but the budget will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCategories(prev => prev.filter(cat => cat.id !== id));
          },
        },
      ]
    );
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
          <Text style={styles.sectionTitle}>💳 Monthly Income</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Net Monthly Salary</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputSymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={salary}
                onChangeText={text => setSalary(text.replace(/[^0-9]/g, ''))}
              />
            </View>
          </View>
        </View>

        {/* Categories Budgets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📁 Budgets & Categories</Text>
            <Text style={[
              styles.overviewBudget,
              totalAllocatedBudget > parseFloat(salary) ? { color: Colors.accentRed } : { color: Colors.accentGreen }
            ]}>
              Total Allocated: ₹{totalAllocatedBudget.toLocaleString()}
            </Text>
          </View>

          <View style={styles.card}>
            {categories.map(cat => (
              <View key={cat.id} style={styles.categoryRow}>
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
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteCatButton}
                    onPress={() => handleDeleteCategory(cat.id, cat.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.accentRed} />
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
          <Text style={styles.sectionTitle}>📉 Debt Payoff Settings</Text>
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
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Payoff Start Month</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={[styles.textInput, { paddingLeft: Spacing.md }]}
                      value={debtStartMonth}
                      onChangeText={setDebtStartMonth}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Investments target settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌿 Halal SIP Targets</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Enable Investment SIP Planning</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, hasInvestments ? styles.toggleBtnActive : null]}
                onPress={() => setHasInvestments(!hasInvestments)}
              >
                <View style={[styles.toggleCircle, hasInvestments ? styles.toggleCircleActive : null]} />
              </TouchableOpacity>
            </View>

            {hasInvestments && (
              <View style={styles.formContent}>
                {investments.map(inv => (
                  <View key={inv.id} style={styles.categoryRow}>
                    <View>
                      <Text style={styles.investName}>{inv.name}</Text>
                      <Text style={styles.investType}>{inv.type}</Text>
                    </View>
                    <View style={styles.smallInputWrap}>
                      <Text style={styles.smallInputSymbol}>₹</Text>
                      <TextInput
                        style={styles.smallTextInput}
                        keyboardType="numeric"
                        value={inv.monthlyAmount.toString()}
                        onChangeText={text => handleUpdateInvestAmount(inv.id, text)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* System Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ System Operations</Text>
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
    paddingTop: 60,
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
    marginTop: 2,
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  overviewBudget: {
    ...Typography.caption,
    fontWeight: '600',
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
  investName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  investType: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
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
