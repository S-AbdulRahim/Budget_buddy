import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  LayoutChangeEvent,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  formatCurrencyFull,
} from '../theme';
import { Category, CategoryGroup, Investment } from '../types';
import { updateSettings } from '../data/storage';
import {
  INITIAL_EMPTY_DATA,
  GoalPreset,
  generateDebtSchedule,
} from '../data/budgetData';
import ConfirmModal from './ConfirmModal';
import CalendarPickerModal from './CalendarPickerModal';
import BrandMark from './BrandMark';

// Subcomponents
import WelcomeCarousel from './onboarding/WelcomeCarousel';
import StepIncome from './onboarding/StepIncome';
import StepCategories from './onboarding/StepCategories';
import StepDebt from './onboarding/StepDebt';
import StepGoals, { WizardGoal } from './onboarding/StepGoals';
import Completion from './onboarding/Completion';

interface OnboardingWizardProps {
  onSuccess: () => void;
}

export default function OnboardingWizard({ onSuccess }: OnboardingWizardProps) {
  // Wizard stage: 'welcome' -> 'setup' (steps 1-4) -> 'completion'
  const [stage, setStage] = useState<'welcome' | 'setup' | 'completion'>('welcome');
  const [step, setStep] = useState(1);
  const [contentWidth, setContentWidth] = useState(
    Math.min(Dimensions.get('window').width, 640)
  );

  // Error modal & Date picker
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Input refs for automatic focus across step transitions
  const salaryInputRef = useRef<TextInput>(null);
  const firstCategoryInputRef = useRef<TextInput>(null);
  const debtTotalInputRef = useRef<TextInput>(null);
  const firstInvestInputRef = useRef<TextInput>(null);

  // Subtle entrance animation for completion screen
  const completionAnim = useRef(new Animated.Value(0)).current;

  // Step 1: Salary state
  const [salary, setSalary] = useState('');

  // Step 2: Categories state
  const [categoriesList, setCategoriesList] = useState<Category[]>(
    INITIAL_EMPTY_DATA.categories
  );
  const [enabledCategories, setEnabledCategories] = useState<Record<string, boolean>>({
    '1': true, // Rent
    '2': true, // Groceries
    '3': true, // Transportation
    '4': true, // Utilities
    '5': true, // Entertainment
    '6': true, // Shopping
    '7': true, // Healthcare
    '8': true, // Savings
  });
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({
    '1': '15000',
    '2': '8000',
    '3': '3000',
    '4': '3000',
    '5': '2000',
    '6': '3000',
    '7': '2000',
    '8': '7300',
  });

  // Step 3: Debt state
  const [hasDebt, setHasDebt] = useState(false);
  const [debtTotal, setDebtTotal] = useState('');
  const [debtEmi, setDebtEmi] = useState('');
  const [debtStartMonth, setDebtStartMonth] = useState("15 Jun '26");
  const [debtEmiDay, setDebtEmiDay] = useState(15);
  const [debtReminderEnabled, setDebtReminderEnabled] = useState(true);
  const [debtInterest, setDebtInterest] = useState('0');

  // Step 4: Goals & Investments state
  const [hasInvestments, setHasInvestments] = useState(false);
  const [goals, setGoals] = useState<WizardGoal[]>([
    {
      id: '1',
      name: 'Emergency Fund',
      type: 'Safety Net',
      color: Colors.accentGreen,
      monthlyAmount: '5000',
      targetAmount: '150000',
      icon: 'shield-checkmark-outline',
    },
    {
      id: '2',
      name: 'Retirement Wealth',
      type: 'Long-term Growth',
      color: Colors.categoryRent,
      monthlyAmount: '5000',
      targetAmount: '1000000',
      icon: 'trending-up-outline',
    },
    {
      id: '3',
      name: 'Travel & Vacation',
      type: 'Targeted Savings',
      color: Colors.accentAmber,
      monthlyAmount: '3000',
      targetAmount: '50000',
      icon: 'airplane-outline',
    },
    {
      id: '4',
      name: 'Index Fund SIP',
      type: 'Passive Wealth',
      color: Colors.primaryLight,
      monthlyAmount: '3700',
      targetAmount: '300000',
      icon: 'leaf-outline',
    },
  ]);

  // Focus the primary input whenever the step changes
  useEffect(() => {
    if (stage !== 'setup') return;

    const timer = setTimeout(() => {
      if (step === 1) {
        salaryInputRef.current?.focus();
      } else if (step === 2) {
        firstCategoryInputRef.current?.focus();
      } else if (step === 3 && hasDebt) {
        debtTotalInputRef.current?.focus();
      } else if (step === 4 && hasInvestments) {
        firstInvestInputRef.current?.focus();
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [stage, step, hasDebt, hasInvestments]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    setContentWidth(e.nativeEvent.layout.width);
  };

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

  // Step 2 Handlers
  const handleToggleCategory = (id: string) => {
    setEnabledCategories(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleChangeCategoryBudget = (id: string, text: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [id]: text.replace(/[^0-9]/g, ''),
    }));
  };

  const handleAddCategory = (group: CategoryGroup, name: string, budget: string) => {
    const newId = Date.now().toString();
    const newCategory: Category = {
      id: newId,
      name,
      icon: 'ellipsis-horizontal-circle',
      color: group === 'Needs' ? Colors.groupNeeds : group === 'Wants' ? Colors.groupWants : Colors.groupSavings,
      budget: parseFloat(budget) || 0,
      spent: 0,
      group,
    };
    setCategoriesList(prev => [...prev, newCategory]);
    setEnabledCategories(prev => ({ ...prev, [newId]: true }));
    setCategoryBudgets(prev => ({ ...prev, [newId]: budget }));
  };

  // Step 4 Handlers
  const handleChangeGoalMonthly = (id: string, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, monthlyAmount: clean } : g)));
  };

  const handleChangeGoalTarget = (id: string, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, targetAmount: clean } : g)));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleAddPresetGoal = (preset: GoalPreset) => {
    if (goals.some(g => g.name.toLowerCase() === preset.name.toLowerCase())) {
      setErrorModal({
        title: 'Goal already added',
        message: `"${preset.name}" is already in your goals list.`,
      });
      return;
    }
    const newGoal: WizardGoal = {
      id: Date.now().toString(),
      name: preset.name,
      type: preset.type,
      color: preset.color,
      monthlyAmount: preset.defaultAmount.toString(),
      targetAmount: preset.targetAmount ? preset.targetAmount.toString() : undefined,
      icon: preset.icon,
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const handleAddCustomGoal = (
    name: string,
    type: string,
    monthly: string,
    target?: string
  ) => {
    if (goals.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      setErrorModal({
        title: 'Duplicate goal',
        message: 'A goal with this name already exists.',
      });
      return;
    }
    const newGoal: WizardGoal = {
      id: Date.now().toString(),
      name,
      type,
      color: Colors.accent,
      monthlyAmount: monthly,
      targetAmount: target,
      icon: 'flag-outline',
    };
    setGoals(prev => [...prev, newGoal]);
  };

  // Navigation & Validation
  const handleNext = () => {
    if (step === 1) {
      const parsedSalary = parseFloat(salary);
      if (isNaN(parsedSalary) || parsedSalary <= 0) {
        setErrorModal({
          title: 'Invalid salary',
          message: 'Please enter a valid monthly salary.',
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const totalBudget = Object.keys(categoryBudgets).reduce((sum, key) => {
        if (!enabledCategories[key]) return sum;
        return sum + (parseFloat(categoryBudgets[key]) || 0);
      }, 0);

      const parsedSalary = parseFloat(salary);
      if (totalBudget > parsedSalary) {
        setErrorModal({
          title: 'Budget exceeded',
          message: `Your total category budget (${formatCurrencyFull(totalBudget)}) exceeds your monthly salary (${formatCurrencyFull(parsedSalary)}). Please adjust.`,
        });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (hasDebt) {
        const total = parseFloat(debtTotal);
        const emi = parseFloat(debtEmi);
        const interest = parseFloat(debtInterest) || 0;
        if (isNaN(total) || total <= 0 || isNaN(emi) || emi <= 0) {
          setErrorModal({
            title: 'Invalid loan details',
            message: 'Please enter valid loan and monthly EMI amounts.',
          });
          return;
        }
        if (emi > total) {
          setErrorModal({
            title: 'Invalid EMI',
            message: 'Monthly EMI cannot exceed total debt.',
          });
          return;
        }
        if (interest < 0) {
          setErrorModal({
            title: 'Invalid interest rate',
            message: 'Interest rate cannot be negative.',
          });
          return;
        }
        if (interest > 0) {
          const monthlyRate = interest / 12 / 100;
          const monthlyInterest = total * monthlyRate;
          if (emi <= monthlyInterest) {
            setErrorModal({
              title: 'EMI too low',
              message: `With an interest rate of ${interest}%, monthly interest alone is ${formatCurrencyFull(Math.round(monthlyInterest))}, which equals or exceeds your EMI of ${formatCurrencyFull(emi)}. Please increase your EMI.`,
            });
            return;
          }
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
      const finalCategories: Category[] = categoriesList
        .filter(c => enabledCategories[c.id])
        .map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          budget: parseFloat(categoryBudgets[c.id]) || 0,
          spent: 0,
          group: c.group || 'Needs',
        }));

      // Map debt
      const debtSettings = {
        total: hasDebt ? parseFloat(debtTotal) || 0 : 0,
        emi: hasDebt ? parseFloat(debtEmi) || 0 : 0,
        startMonth: hasDebt ? debtStartMonth : '',
        interestRate: hasDebt ? parseFloat(debtInterest) || 0 : 0,
        emiDay: hasDebt ? debtEmiDay : 15,
        reminderEnabled: hasDebt ? debtReminderEnabled : false,
      };

      // Map investments
      const totalInvAmount = goals.reduce((sum, g) => sum + (parseFloat(g.monthlyAmount) || 0), 0);
      const investments: Investment[] = goals.map(g => {
        const mAmount = hasInvestments ? parseFloat(g.monthlyAmount) || 0 : 0;
        const targetAmt = g.targetAmount ? parseFloat(g.targetAmount) || undefined : undefined;
        const allocation = totalInvAmount > 0 ? Math.round((mAmount / totalInvAmount) * 100) : 0;
        return {
          id: g.id,
          name: g.name,
          type: g.type,
          color: g.color,
          monthlyAmount: mAmount,
          allocation,
          isActive: false, // Inactive until debt is cleared
          icon: g.icon,
          targetAmount: targetAmt,
        };
      });

      await updateSettings(parsedSalary, finalCategories, debtSettings, investments);

      // Transition to completion screen
      setStage('completion');
      Animated.timing(completionAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setErrorModal({
        title: 'Save failed',
        message: 'Could not save configurations. Please try again.',
      });
    }
  };

  // ----------------------------------------------------
  // STAGE: WELCOME CAROUSEL
  // ----------------------------------------------------
  if (stage === 'welcome') {
    return (
      <View style={styles.container} onLayout={handleContainerLayout}>
        <WelcomeCarousel
          onStartSetup={() => {
            setStage('setup');
            setStep(1);
          }}
          contentWidth={contentWidth}
        />
      </View>
    );
  }

  // ----------------------------------------------------
  // STAGE: COMPLETION SCREEN
  // ----------------------------------------------------
  if (stage === 'completion') {
    const parsedSalaryNum = parseFloat(salary) || 0;
    const totalAllocatedBudget = categoriesList.reduce((sum, cat) => {
      if (!enabledCategories[cat.id]) return sum;
      return sum + (parseFloat(categoryBudgets[cat.id]) || 0);
    }, 0);

    const needsBudget = categoriesList
      .filter(c => (c.group || 'Needs') === 'Needs' && enabledCategories[c.id])
      .reduce((sum, c) => sum + (parseFloat(categoryBudgets[c.id]) || 0), 0);

    const wantsBudget = categoriesList
      .filter(c => c.group === 'Wants' && enabledCategories[c.id])
      .reduce((sum, c) => sum + (parseFloat(categoryBudgets[c.id]) || 0), 0);

    const savingsBudget = categoriesList
      .filter(c => c.group === 'Savings' && enabledCategories[c.id])
      .reduce((sum, c) => sum + (parseFloat(categoryBudgets[c.id]) || 0), 0);

    const debtSchedule = hasDebt
      ? generateDebtSchedule(
          parseFloat(debtTotal) || 0,
          parseFloat(debtEmi) || 0,
          debtStartMonth,
          parseFloat(debtInterest) || 0
        )
      : [];

    const debtPayoffTarget =
      hasDebt && debtSchedule.length > 0
        ? `${debtSchedule[debtSchedule.length - 1].month} (${debtSchedule.length} mo)`
        : 'Debt-free';

    const activeGoalsCount = hasInvestments ? goals.length : 0;

    return (
      <View style={styles.container} onLayout={handleContainerLayout}>
        <Completion
          salary={parsedSalaryNum}
          totalBudget={totalAllocatedBudget}
          needsBudget={needsBudget}
          wantsBudget={wantsBudget}
          savingsBudget={savingsBudget}
          hasDebt={hasDebt}
          debtPayoffTarget={debtPayoffTarget}
          goalsCount={activeGoalsCount}
          onGoToDashboard={onSuccess}
          animValue={completionAnim}
          contentWidth={contentWidth}
        />
      </View>
    );
  }

  // ----------------------------------------------------
  // STAGE: SETUP STEPS (1 TO 4)
  // ----------------------------------------------------
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      onLayout={handleContainerLayout}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with BrandMark & Step Indicators */}
        <View style={styles.header}>
          <BrandMark size="sm" />
          <Text style={styles.headerSubtitle}>Step {step} of 4</Text>

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

        {/* Step 1: Monthly Income */}
        {step === 1 && (
          <StepIncome
            salary={salary}
            onChangeSalary={setSalary}
            inputRef={salaryInputRef}
          />
        )}

        {/* Step 2: Spending Categories (50/30/20 Groups) */}
        {step === 2 && (
          <StepCategories
            salary={parseFloat(salary) || 0}
            categoriesList={categoriesList}
            enabledCategories={enabledCategories}
            categoryBudgets={categoryBudgets}
            onToggleCategory={handleToggleCategory}
            onChangeCategoryBudget={handleChangeCategoryBudget}
            onAddCategory={handleAddCategory}
            firstInputRef={firstCategoryInputRef}
          />
        )}

        {/* Step 3: Debt Paydown */}
        {step === 3 && (
          <StepDebt
            hasDebt={hasDebt}
            onToggleHasDebt={setHasDebt}
            debtTotal={debtTotal}
            onChangeDebtTotal={setDebtTotal}
            debtEmi={debtEmi}
            onChangeDebtEmi={setDebtEmi}
            debtInterest={debtInterest}
            onChangeDebtInterest={setDebtInterest}
            debtStartMonth={debtStartMonth}
            debtEmiDay={debtEmiDay}
            debtReminderEnabled={debtReminderEnabled}
            onToggleReminder={handleToggleReminder}
            onOpenDatePicker={() => setShowDatePicker(true)}
            totalInputRef={debtTotalInputRef}
          />
        )}

        {/* Step 4: Savings & Goals */}
        {step === 4 && (
          <StepGoals
            hasInvestments={hasInvestments}
            onToggleHasInvestments={setHasInvestments}
            hasDebt={hasDebt}
            salary={parseFloat(salary) || 0}
            goals={goals}
            onChangeGoalMonthly={handleChangeGoalMonthly}
            onChangeGoalTarget={handleChangeGoalTarget}
            onDeleteGoal={handleDeleteGoal}
            onAddPresetGoal={handleAddPresetGoal}
            onAddCustomGoal={handleAddCustomGoal}
            firstInputRef={firstInvestInputRef}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {step > 1 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 4 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Proceed to next step"
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.onPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Complete budget setup"
            >
              <Text style={styles.submitButtonText}>Complete Setup</Text>
              <Ionicons name="checkmark-done" size={18} color={Colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Validation Alert Modal */}
      <ConfirmModal
        visible={errorModal !== null}
        title={errorModal?.title || ''}
        message={errorModal?.message || ''}
        confirmText="OK"
        showCancel={false}
        confirmStyle="primary"
        icon="alert-circle-outline"
        onCancel={() => setErrorModal(null)}
        onConfirm={() => setErrorModal(null)}
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
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  indicators: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
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
    color: Colors.onPrimary,
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
    color: Colors.onPrimary,
  },
});
