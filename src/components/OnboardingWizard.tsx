import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../theme';
import { Category, Investment } from '../types';
import { updateSettings } from '../data/storage';

interface OnboardingWizardProps {
  onSuccess: () => void;
}

export default function OnboardingWizard({ onSuccess }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [salary, setSalary] = useState('');
  
  // Categories state
  const [enabledCategories, setEnabledCategories] = useState<{ [key: string]: boolean }>({
    '1': true, // Rent
    '2': true, // Groceries
    '3': true, // Transportation
    '4': true, // Utilities
    '5': true, // Entertainment
    '6': true, // Shopping
    '7': true, // Healthcare
    '8': true, // Savings
  });
  const [categoryBudgets, setCategoryBudgets] = useState<{ [key: string]: string }>({
    '1': '15000',
    '2': '8000',
    '3': '3000',
    '4': '3000',
    '5': '2000',
    '6': '3000',
    '7': '2000',
    '8': '7300',
  });
  const categoriesList: Omit<Category, 'spent' | 'budget'>[] = [
    { id: '1', name: 'Rent', icon: 'home', color: '#6C5CE7' },
    { id: '2', name: 'Groceries', icon: 'cart', color: '#00E676' },
    { id: '3', name: 'Transportation', icon: 'car', color: '#00D2FF' },
    { id: '4', name: 'Utilities', icon: 'flash', color: '#FFB74D' },
    { id: '5', name: 'Entertainment', icon: 'game-controller', color: '#FF6B9D' },
    { id: '6', name: 'Shopping', icon: 'bag-handle', color: '#FF5252' },
    { id: '7', name: 'Healthcare', icon: 'medkit', color: '#26C6DA' },
    { id: '8', name: 'Savings', icon: 'wallet', color: '#7C4DFF' },
  ];

  // Debt state
  const [hasDebt, setHasDebt] = useState(false);
  const [debtTotal, setDebtTotal] = useState('');
  const [debtEmi, setDebtEmi] = useState('');
  const [debtStartMonth, setDebtStartMonth] = useState('Jun 26');

  // Investments state
  const [hasInvestments, setHasInvestments] = useState(false);
  const [investFunds, setInvestFunds] = useState<{ [key: string]: string }>({
    '1': '5000', // Tata Ethical
    '2': '5000', // Nippon ETF
    '3': '3700', // Taurus
    '4': '3000', // Umrah Reserve
  });
  const investmentFundsList: Omit<Investment, 'allocation' | 'isActive'>[] = [
    { id: '1', name: 'Tata Ethical ELSS Fund', type: 'ELSS (Tax Saving)', color: '#6C5CE7', monthlyAmount: 0 },
    { id: '2', name: 'Nippon India ETF Shariah BeES', type: 'ETF (Shariah)', color: '#00D2FF', monthlyAmount: 0 },
    { id: '3', name: 'Taurus Ethical Fund', type: 'Equity (Ethical)', color: '#00E676', monthlyAmount: 0 },
    { id: '4', name: 'Umrah Reserve Fund', type: 'Goal-based Saving', color: '#FFB74D', monthlyAmount: 0 },
  ];

  const handleNext = () => {
    if (step === 1) {
      const parsedSalary = parseFloat(salary);
      if (isNaN(parsedSalary) || parsedSalary <= 0) {
        Alert.alert('Invalid Salary', 'Please enter a valid monthly salary.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate categories
      const totalBudget = Object.keys(categoryBudgets).reduce((sum, key) => {
        if (!enabledCategories[key]) return sum;
        const val = parseFloat(categoryBudgets[key]) || 0;
        return sum + val;
      }, 0);
      
      const parsedSalary = parseFloat(salary);
      if (totalBudget > parsedSalary) {
        Alert.alert(
          'Budget Exceeded',
          `Your total category budget (₹${totalBudget.toLocaleString()}) exceeds your monthly salary (₹${parsedSalary.toLocaleString()}). Please adjust.`
        );
        return;
      }
      setStep(3);
    } else if (step === 3) {
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
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const parsedSalary = parseFloat(salary) || 0;
      
      // Map categories
      const categories: Category[] = categoriesList
        .filter(c => enabledCategories[c.id])
        .map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          budget: parseFloat(categoryBudgets[c.id]) || 0,
          spent: 0,
        }));

      // Map debt
      const debtSettings = {
        total: hasDebt ? parseFloat(debtTotal) || 0 : 0,
        emi: hasDebt ? parseFloat(debtEmi) || 0 : 0,
        startMonth: hasDebt ? debtStartMonth : '',
      };

      // Map investments
      const totalInvAmount = Object.values(investFunds).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const investments: Investment[] = investmentFundsList.map(fund => {
        const mAmount = hasInvestments ? parseFloat(investFunds[fund.id]) || 0 : 0;
        const allocation = totalInvAmount > 0 ? Math.round((mAmount / totalInvAmount) * 100) : 0;
        return {
          id: fund.id,
          name: fund.name,
          type: fund.type,
          color: fund.color,
          monthlyAmount: mAmount,
          allocation,
          isActive: false, // Remains inactive until debt is cleared
        };
      });

      await updateSettings(parsedSalary, categories, debtSettings, investments);
      onSuccess();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Save Failed', 'Could not save configurations. Please try again.');
    }
  };

  const toggleCategory = (id: string) => {
    setEnabledCategories(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateCategoryBudget = (id: string, text: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [id]: text.replace(/[^0-9]/g, ''),
    }));
  };

  const updateInvestFund = (id: string, text: string) => {
    setInvestFunds(prev => ({
      ...prev,
      [id]: text.replace(/[^0-9]/g, ''),
    }));
  };

  // Calculations for step indicators
  const totalBudget = Object.keys(categoryBudgets).reduce((sum, key) => {
    if (!enabledCategories[key]) return sum;
    return sum + (parseFloat(categoryBudgets[key]) || 0);
  }, 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budget Buddy</Text>
          <Text style={styles.headerSubtitle}>Personal Finance Onboarding</Text>
          
          {/* Progress Indicators */}
          <View style={styles.indicators}>
            {[1, 2, 3, 4].map(i => (
              <View
                key={i}
                style={[
                  styles.indicator,
                  i <= step ? styles.indicatorActive : null,
                  i === step ? styles.indicatorCurrent : null,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Step 1: Salary */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="card" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Enter Monthly Income</Text>
            <Text style={styles.stepDescription}>
              Input your monthly net salary or standard income to structure your monthly budgets.
            </Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="60,000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={salary}
                onChangeText={text => setSalary(text.replace(/[^0-9]/g, ''))}
                autoFocus
              />
            </View>
          </View>
        )}

        {/* Step 2: Categories Setup */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Configure Category Budgets</Text>
            <Text style={styles.stepDescription}>
              Set limits for your primary spending categories. Unchecked categories will be disabled.
            </Text>

            <View style={styles.budgetOverview}>
              <Text style={styles.overviewLabel}>Salary: ₹{parseFloat(salary).toLocaleString()}</Text>
              <Text style={[
                styles.overviewBudget,
                totalBudget > parseFloat(salary) ? { color: Colors.accentRed } : { color: Colors.accentGreen }
              ]}>
                Allocated: ₹{totalBudget.toLocaleString()} ({Math.round((totalBudget / parseFloat(salary)) * 100)}%)
              </Text>
            </View>

            <View style={styles.categoryList}>
              {categoriesList.map(cat => {
                const isEnabled = enabledCategories[cat.id];
                return (
                  <View key={cat.id} style={[styles.categoryRow, !isEnabled && styles.categoryRowDisabled]}>
                    <TouchableOpacity
                      onPress={() => toggleCategory(cat.id)}
                      style={styles.categoryToggle}
                    >
                      <View style={[styles.checkbox, isEnabled && styles.checkboxChecked, { borderColor: cat.color }]}>
                        {isEnabled && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text style={[styles.categoryName, { color: isEnabled ? Colors.textPrimary : Colors.textSecondary }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                    
                    {isEnabled ? (
                      <View style={styles.budgetInputWrap}>
                        <Text style={styles.budgetInputSymbol}>₹</Text>
                        <TextInput
                          style={styles.budgetInput}
                          keyboardType="numeric"
                          value={categoryBudgets[cat.id]}
                          onChangeText={text => updateCategoryBudget(cat.id, text)}
                        />
                      </View>
                    ) : (
                      <Text style={styles.disabledLabel}>Disabled</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Debt Settings */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="trending-down" size={32} color={Colors.accentAmber} />
            </View>
            <Text style={styles.stepTitle}>Debt Payoff Tracker</Text>
            <Text style={styles.stepDescription}>
              Do you have a loan or active debt you want to track and pay down monthly?
            </Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !hasDebt && styles.toggleButtonActive]}
                onPress={() => setHasDebt(false)}
              >
                <Text style={[styles.toggleButtonText, !hasDebt && styles.toggleButtonTextActive]}>No Debt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, hasDebt && styles.toggleButtonActive]}
                onPress={() => setHasDebt(true)}
              >
                <Text style={[styles.toggleButtonText, hasDebt && styles.toggleButtonTextActive]}>Has Debt</Text>
              </TouchableOpacity>
            </View>

            {hasDebt && (
              <View style={styles.debtForm}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Total Debt Amount</Text>
                  <View style={styles.formInputWrap}>
                    <Text style={styles.formInputSymbol}>₹</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="2,00,000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={debtTotal}
                      onChangeText={text => setDebtTotal(text.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Monthly EMI</Text>
                  <View style={styles.formInputWrap}>
                    <Text style={styles.formInputSymbol}>₹</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="16,700"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={debtEmi}
                      onChangeText={text => setDebtEmi(text.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Payoff Start Month</Text>
                  <View style={styles.formInputWrap}>
                    <TextInput
                      style={[styles.formInput, { paddingLeft: Spacing.md }]}
                      placeholder="Jun '26"
                      placeholderTextColor={Colors.textMuted}
                      value={debtStartMonth}
                      onChangeText={setDebtStartMonth}
                    />
                  </View>
                </View>

                {parseFloat(debtTotal) > 0 && parseFloat(debtEmi) > 0 && (
                  <View style={styles.tenureNote}>
                    <Ionicons name="information-circle" size={16} color={Colors.accent} />
                    <Text style={styles.tenureNoteText}>
                      Estimated Tenure: {Math.ceil(parseFloat(debtTotal) / parseFloat(debtEmi))} months
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Step 4: Investments Setup */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="leaf" size={32} color={Colors.accentGreen} />
            </View>
            <Text style={styles.stepTitle}>Halal Investment SIPs</Text>
            <Text style={styles.stepDescription}>
              Plan long-term Shariah-compliant monthly mutual funds or savings targets.
            </Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !hasInvestments && styles.toggleButtonActive]}
                onPress={() => setHasInvestments(false)}
              >
                <Text style={[styles.toggleButtonText, !hasInvestments && styles.toggleButtonTextActive]}>Skip SIPs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, hasInvestments && styles.toggleButtonActive]}
                onPress={() => setHasInvestments(true)}
              >
                <Text style={[styles.toggleButtonText, hasInvestments && styles.toggleButtonTextActive]}>Set SIP Plan</Text>
              </TouchableOpacity>
            </View>

            {hasInvestments && (
              <View style={styles.investList}>
                {hasDebt && (
                  <View style={styles.investLockNotice}>
                    <Ionicons name="lock-closed" size={16} color={Colors.accentAmber} />
                    <Text style={styles.investLockNoticeText}>
                      Note: Since you have configured active debt, these investments will remain locked until the debt is cleared.
                    </Text>
                  </View>
                )}
                
                {investmentFundsList.map(fund => (
                  <View key={fund.id} style={styles.investRow}>
                    <View>
                      <Text style={styles.investName}>{fund.name}</Text>
                      <Text style={styles.investType}>{fund.type}</Text>
                    </View>
                    <View style={styles.investInputWrap}>
                      <Text style={styles.investInputSymbol}>₹</Text>
                      <TextInput
                        style={styles.investInput}
                        keyboardType="numeric"
                        value={investFunds[fund.id]}
                        onChangeText={text => updateInvestFund(fund.id, text)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 4 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Complete Setup</Text>
              <Ionicons name="checkmark-done" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  headerTitle: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  indicators: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  indicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceHighlight,
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
  },
  indicatorCurrent: {
    backgroundColor: Colors.primaryLight,
    width: 32,
  },
  stepContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceHighlight,
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
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginRight: Spacing.sm,
  },
  input: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    width: 150,
    textAlign: 'left',
  },
  budgetOverview: {
    width: '100%',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  overviewBudget: {
    ...Typography.caption,
    fontWeight: '700',
  },
  categoryList: {
    width: '100%',
    gap: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRowDisabled: {
    opacity: 0.5,
  },
  categoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    width: 100,
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
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 6,
  },
  disabledLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
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
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.md,
  },
  tenureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  tenureNoteText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
  },
  investList: {
    width: '100%',
    gap: Spacing.md,
  },
  investLockNotice: {
    flexDirection: 'row',
    backgroundColor: Colors.accentAmber + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentAmber + '30',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  investLockNoticeText: {
    ...Typography.caption,
    color: Colors.accentAmber,
    flex: 1,
    lineHeight: 16,
  },
  investRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  investInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    width: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  investInputSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  investInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  backButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  backButtonText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 1.5,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  nextButtonText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
  submitButton: {
    flex: 1.5,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.accentGreen,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  submitButtonText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
});
