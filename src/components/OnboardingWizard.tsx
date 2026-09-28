import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  LayoutChangeEvent,
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
} from '../theme';
import { Category, Investment } from '../types';
import { updateSettings } from '../data/storage';
import {
  POPULAR_GOAL_PRESETS,
  GOAL_COLORS,
  GoalPreset,
  generateDebtSchedule,
} from '../data/budgetData';
import ConfirmModal from './ConfirmModal';
import CalendarPickerModal, { getOrdinal } from './CalendarPickerModal';

interface OnboardingWizardProps {
  onSuccess: () => void;
}

interface WizardGoal {
  id: string;
  name: string;
  type: string;
  color: string;
  monthlyAmount: string;
  icon?: string;
}

const WELCOME_SLIDES = [
  {
    id: '1',
    icon: 'wallet-outline' as const,
    title: 'Know where every rupee goes',
    description: 'Track spending by category and see your month at a glance, with no spreadsheets.',
  },
  {
    id: '2',
    icon: 'trending-down-outline' as const,
    title: 'Pay off debt on your schedule',
    description: 'Plan EMIs, get reminders and watch your balance shrink month by month.',
  },
  {
    id: '3',
    icon: 'rocket-outline' as const,
    title: 'Grow toward your goals',
    description: 'Set savings and investment targets and unlock them as your debt clears.',
  },
];

export default function OnboardingWizard({ onSuccess }: OnboardingWizardProps) {
  // Wizard state: 'welcome' -> 'setup' (steps 1-4) -> 'completion'
  const [stage, setStage] = useState<'welcome' | 'setup' | 'completion'>('welcome');
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [contentWidth, setContentWidth] = useState(
    Math.min(Dimensions.get('window').width, 600)
  );

  const [step, setStep] = useState(1);
  const [salary, setSalary] = useState('');
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Input refs for automatic focus across step transitions
  const salaryInputRef = useRef<TextInput>(null);
  const firstCategoryInputRef = useRef<TextInput>(null);
  const debtTotalInputRef = useRef<TextInput>(null);
  const firstInvestInputRef = useRef<TextInput>(null);
  const welcomeScrollRef = useRef<ScrollView>(null);

  // Subtle entrance animation for completion screen
  const completionAnim = useRef(new Animated.Value(0)).current;

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
    { id: '1', name: 'Rent', icon: 'home', color: Colors.categoryRent },
    { id: '2', name: 'Groceries', icon: 'cart', color: Colors.categoryGroceries },
    { id: '3', name: 'Transportation', icon: 'car', color: Colors.categoryTransport },
    { id: '4', name: 'Utilities', icon: 'flash', color: Colors.categoryUtilities },
    { id: '5', name: 'Entertainment', icon: 'game-controller', color: Colors.categoryEntertainment },
    { id: '6', name: 'Shopping', icon: 'bag-handle', color: Colors.categoryShopping },
    { id: '7', name: 'Healthcare', icon: 'medkit', color: Colors.categoryHealthcare },
    { id: '8', name: 'Savings', icon: 'wallet', color: Colors.categorySavings },
  ];

  // Debt state
  const [hasDebt, setHasDebt] = useState(false);
  const [debtTotal, setDebtTotal] = useState('');
  const [debtEmi, setDebtEmi] = useState('');
  const [debtStartMonth, setDebtStartMonth] = useState("15 Jun '26");
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

  // Investments & Goals state
  const [hasInvestments, setHasInvestments] = useState(false);
  const [goals, setGoals] = useState<WizardGoal[]>([
    {
      id: '1',
      name: 'Emergency Fund',
      type: 'Safety Net',
      color: Colors.accentGreen,
      monthlyAmount: '5000',
      icon: 'shield-checkmark-outline',
    },
    {
      id: '2',
      name: 'Retirement Wealth',
      type: 'Long-term Growth',
      color: Colors.categoryRent,
      monthlyAmount: '5000',
      icon: 'trending-up-outline',
    },
    {
      id: '3',
      name: 'Travel & Vacation',
      type: 'Targeted Savings',
      color: Colors.accentAmber,
      monthlyAmount: '3000',
      icon: 'airplane-outline',
    },
    {
      id: '4',
      name: 'Index Fund SIP',
      type: 'Passive Wealth',
      color: Colors.primaryLight,
      monthlyAmount: '3700',
      icon: 'leaf-outline',
    },
  ]);
  const [customGoalName, setCustomGoalName] = useState('');
  const [customGoalType, setCustomGoalType] = useState('');
  const [customGoalAmount, setCustomGoalAmount] = useState('');
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);

  // Focus the primary input whenever the step changes or an optional section opens
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

  // Handle start from welcome flow
  const handleStartSetup = () => {
    setStage('setup');
    setStep(1);
  };

  const handleScrollToSlide = (index: number) => {
    const cardWidth = Math.min(contentWidth - Spacing.xl * 2, 540);
    welcomeScrollRef.current?.scrollTo({ x: index * cardWidth, animated: true });
    setWelcomeIndex(index);
  };

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
      // Validate categories
      const totalBudget = Object.keys(categoryBudgets).reduce((sum, key) => {
        if (!enabledCategories[key]) return sum;
        const val = parseFloat(categoryBudgets[key]) || 0;
        return sum + val;
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
        interestRate: hasDebt ? parseFloat(debtInterest) || 0 : 0,
        emiDay: hasDebt ? debtEmiDay : 15,
        reminderEnabled: hasDebt ? debtReminderEnabled : false,
      };

      // Map investments
      const totalInvAmount = goals.reduce((sum, g) => sum + (parseFloat(g.monthlyAmount) || 0), 0);
      const investments: Investment[] = goals.map(g => {
        const mAmount = hasInvestments ? parseFloat(g.monthlyAmount) || 0 : 0;
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
        };
      });

      await updateSettings(parsedSalary, categories, debtSettings, investments);

      // Transition to completion screen with subtle entrance animation
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

  const handleUpdateGoalAmount = (id: string, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, monthlyAmount: clean } : g)));
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
      icon: preset.icon,
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const handleAddCustomGoal = () => {
    const cleanName = customGoalName.trim();
    if (!cleanName) {
      setErrorModal({
        title: 'Goal name required',
        message: 'Please enter a name for your goal or investment.',
      });
      return;
    }
    if (goals.some(g => g.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorModal({
        title: 'Duplicate goal',
        message: 'A goal with this name already exists.',
      });
      return;
    }
    const newGoal: WizardGoal = {
      id: Date.now().toString(),
      name: cleanName,
      type: customGoalType.trim() || 'Custom goal',
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
      monthlyAmount: customGoalAmount.replace(/[^0-9]/g, '') || '5000',
      icon: 'flag-outline',
    };
    setGoals(prev => [...prev, newGoal]);
    setCustomGoalName('');
    setCustomGoalType('');
    setCustomGoalAmount('');
    setShowAddGoalForm(false);
  };

  const totalBudget = Object.keys(categoryBudgets).reduce((sum, key) => {
    if (!enabledCategories[key]) return sum;
    return sum + (parseFloat(categoryBudgets[key]) || 0);
  }, 0);

  const parsedSalaryNum = parseFloat(salary) || 0;
  const debtTotalNum = parseFloat(debtTotal) || 0;
  const debtEmiNum = parseFloat(debtEmi) || 0;
  const debtInterestNum = parseFloat(debtInterest) || 0;
  const debtSchedule = hasDebt
    ? generateDebtSchedule(debtTotalNum, debtEmiNum, debtStartMonth, debtInterestNum)
    : [];

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    setContentWidth(e.nativeEvent.layout.width);
  };

  const cardWidth = Math.max(280, Math.min(contentWidth - Spacing.xl * 2, 540));

  // ----------------------------------------------------
  // SCREEN: WELCOME FLOW
  // ----------------------------------------------------
  if (stage === 'welcome') {
    return (
      <View style={styles.container} onLayout={handleContainerLayout}>
        <ScrollView
          contentContainerStyle={styles.welcomeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.welcomeHeader}>
            <View style={styles.wordmarkRow}>
              <Text style={styles.brandTitle}>Budget Buddy</Text>
            </View>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleStartSetup}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Swipeable Cards Carousel */}
          <View style={[styles.carouselWrapper, { width: cardWidth }]}>
            <ScrollView
              ref={welcomeScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / cardWidth);
                setWelcomeIndex(idx);
              }}
              onScroll={e => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / cardWidth);
                if (idx !== welcomeIndex && idx >= 0 && idx < 3) {
                  setWelcomeIndex(idx);
                }
              }}
              scrollEventThrottle={16}
            >
              {WELCOME_SLIDES.map((slide, idx) => (
                <View key={slide.id} style={[styles.welcomeCard, { width: cardWidth }]}>
                  <View style={styles.heroIconCircle}>
                    <Ionicons name={slide.icon} size={48} color={Colors.primary} />
                  </View>
                  <Text style={styles.welcomeCardTitle}>{slide.title}</Text>
                  <Text style={styles.welcomeCardDescription}>{slide.description}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Page Dots */}
            <View style={styles.pageDots}>
              {[0, 1, 2].map(idx => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleScrollToSlide(idx)}
                  style={[
                    styles.pageDot,
                    idx === welcomeIndex ? styles.pageDotActive : null,
                  ]}
                  accessibilityLabel={`Go to slide ${idx + 1}`}
                />
              ))}
            </View>

            {/* Carousel Action Button */}
            {welcomeIndex < 2 ? (
              <TouchableOpacity
                style={styles.carouselNextBtn}
                onPress={() => handleScrollToSlide(welcomeIndex + 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.carouselNextBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.carouselGetStartedBtn}
                onPress={handleStartSetup}
                activeOpacity={0.8}
              >
                <Text style={styles.carouselGetStartedBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Trust and duration footer */}
          <View style={styles.welcomeFooter}>
            <View style={styles.trustLine}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={Colors.primaryLight}
              />
              <Text style={styles.trustLineText}>
                Your data stays on your device. No account needed.
              </Text>
            </View>
            <Text style={styles.durationHint}>Takes about 2 minutes</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // SCREEN: COMPLETION SCREEN
  // ----------------------------------------------------
  if (stage === 'completion') {
    const debtPayoffTarget =
      hasDebt && debtSchedule.length > 0
        ? `${debtSchedule[debtSchedule.length - 1].month} (${debtSchedule.length} months)`
        : 'Debt-free';

    const activeGoalsCount = hasInvestments ? goals.length : 0;

    return (
      <View style={styles.container} onLayout={handleContainerLayout}>
        <ScrollView
          contentContainerStyle={styles.completionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.completionCard,
              {
                opacity: completionAnim,
                transform: [
                  {
                    scale: completionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Success icon */}
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>

            <Text style={styles.completionTitle}>You're all set!</Text>
            <Text style={styles.completionDescription}>
              Your budget plan is configured and stored safely on your device.
            </Text>

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelGroup}>
                  <Ionicons name="cash-outline" size={20} color={Colors.primaryLight} />
                  <Text style={styles.summaryLabel}>Monthly income</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrencyFull(parsedSalaryNum)}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelGroup}>
                  <Ionicons name="pie-chart-outline" size={20} color={Colors.primaryLight} />
                  <Text style={styles.summaryLabel}>Total budget allocated</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrencyFull(totalBudget)}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelGroup}>
                  <Ionicons name="trending-down-outline" size={20} color={Colors.accentAmber} />
                  <Text style={styles.summaryLabel}>Debt payoff</Text>
                </View>
                <Text style={styles.summaryValue}>{debtPayoffTarget}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelGroup}>
                  <Ionicons name="flag-outline" size={20} color={Colors.accentGreen} />
                  <Text style={styles.summaryLabel}>Savings goals</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {activeGoalsCount > 0 ? `${activeGoalsCount} active goals` : 'Not configured'}
                </Text>
              </View>
            </View>

            {/* Go to Dashboard CTA */}
            <TouchableOpacity
              style={styles.completionButton}
              onPress={onSuccess}
              activeOpacity={0.8}
            >
              <Text style={styles.completionButtonText}>Go to Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // SCREEN: SETUP STEPS (1 TO 4)
  // ----------------------------------------------------
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budget Buddy</Text>
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
                ref={salaryInputRef}
                key="step-1-salary"
                style={styles.input}
                placeholder="60,000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={salary}
                onChangeText={text => setSalary(text.replace(/[^0-9]/g, ''))}
                autoFocus
                cursorColor={Colors.primaryLight}
                selectionColor={Colors.primary}
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
        )}

        {/* Step 2: Spending Categories */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="pie-chart-outline" size={48} color={Colors.primaryLight} />
            </View>
            <Text style={styles.stepTitle}>Plan your spending</Text>
            <Text style={styles.stepDescription}>
              Set a monthly limit for each category. Turn off the ones you don't need.
            </Text>

            <View style={styles.budgetOverview}>
              <Text style={styles.overviewLabel}>
                Salary: {formatCurrencyFull(parseFloat(salary) || 0)}
              </Text>
              <Text
                style={[
                  styles.overviewBudget,
                  totalBudget > parseFloat(salary)
                    ? { color: Colors.accentRed }
                    : { color: Colors.accentGreen },
                ]}
              >
                Allocated: {formatCurrencyFull(totalBudget)} (
                {Math.round((totalBudget / (parseFloat(salary) || 1)) * 100)}%)
              </Text>
            </View>

            <View style={styles.categoryList}>
              {categoriesList.map((cat, index) => {
                const isEnabled = enabledCategories[cat.id];
                return (
                  <View
                    key={cat.id}
                    style={[styles.categoryRow, !isEnabled && styles.categoryRowDisabled]}
                  >
                    <TouchableOpacity
                      onPress={() => toggleCategory(cat.id)}
                      style={styles.categoryToggle}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isEnabled && styles.checkboxChecked,
                          { borderColor: cat.color },
                        ]}
                      >
                        {isEnabled && <Ionicons name="checkmark" size={14} color="#fff" />}
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
                          ref={index === 0 ? firstCategoryInputRef : undefined}
                          key={`step-2-cat-${cat.id}`}
                          style={styles.budgetInput}
                          keyboardType="numeric"
                          value={categoryBudgets[cat.id]}
                          onChangeText={text => updateCategoryBudget(cat.id, text)}
                          cursorColor={Colors.primaryLight}
                          selectionColor={Colors.primary}
                        />
                      </View>
                    ) : (
                      <Text style={styles.disabledLabel}>Disabled</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Info Tip Card */}
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
              <Text style={styles.tipText}>
                A common starting rule is 50% needs, 30% wants, 20% savings and debt.
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Debt Paydown */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="trending-down-outline" size={48} color={Colors.accentAmber} />
            </View>
            <Text style={styles.stepTitle}>Any debt to tackle?</Text>
            <Text style={styles.stepDescription}>
              Add a loan or EMI to track your payoff journey.
            </Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !hasDebt && styles.toggleButtonActive]}
                onPress={() => setHasDebt(false)}
              >
                <Text style={[styles.toggleButtonText, !hasDebt && styles.toggleButtonTextActive]}>
                  Not now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, hasDebt && styles.toggleButtonActive]}
                onPress={() => setHasDebt(true)}
              >
                <Text style={[styles.toggleButtonText, hasDebt && styles.toggleButtonTextActive]}>
                  Yes, track debt
                </Text>
              </TouchableOpacity>
            </View>

            {hasDebt && (
              <View style={styles.debtForm}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Total Debt Amount</Text>
                  <View style={styles.formInputWrap}>
                    <Text style={styles.formInputSymbol}>₹</Text>
                    <TextInput
                      ref={debtTotalInputRef}
                      key="step-3-debt-total"
                      style={styles.formInput}
                      placeholder="2,00,000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={debtTotal}
                      onChangeText={text => setDebtTotal(text.replace(/[^0-9]/g, ''))}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Monthly EMI</Text>
                  <View style={styles.formInputWrap}>
                    <Text style={styles.formInputSymbol}>₹</Text>
                    <TextInput
                      key="step-3-debt-emi"
                      style={styles.formInput}
                      placeholder="16,700"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={debtEmi}
                      onChangeText={text => setDebtEmi(text.replace(/[^0-9]/g, ''))}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Annual Interest Rate (%)</Text>
                  <View style={styles.formInputWrap}>
                    <Text style={styles.formInputSymbol}>%</Text>
                    <TextInput
                      key="step-3-debt-interest"
                      style={styles.formInput}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={debtInterest}
                      onChangeText={text => setDebtInterest(text.replace(/[^0-9.]/g, ''))}
                      cursorColor={Colors.primaryLight}
                      selectionColor={Colors.primary}
                    />
                  </View>
                </View>

                {/* Neutral Interest Phrasing */}
                {!debtInterest || debtInterest === '0' || parseFloat(debtInterest) === 0 ? (
                  <View style={styles.neutralBadge}>
                    <Ionicons name="leaf-outline" size={20} color={Colors.accentGreen} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.neutralBadgeTitle}>0% Interest • Interest-free loan</Text>
                      <Text style={styles.neutralBadgeSubtitle}>
                        No interest charges or accrual on this balance.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.interestBadge}>
                    <Ionicons name="warning-outline" size={20} color={Colors.accentAmber} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.interestBadgeTitle}>{debtInterest}% Annual Interest</Text>
                      <Text style={styles.interestBadgeSubtitle}>
                        Standard loan with monthly interest accrual.
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>EMI Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerWrap}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={Colors.primaryLight}
                      style={{ marginRight: Spacing.sm }}
                    />
                    <Text
                      style={[
                        styles.datePickerText,
                        !debtStartMonth && { color: Colors.textMuted },
                      ]}
                    >
                      {debtStartMonth || 'Select EMI date'}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={Colors.textSecondary}
                      style={{ marginLeft: 'auto' }}
                    />
                  </TouchableOpacity>

                  {/* Reminder Check Option */}
                  <TouchableOpacity
                    style={styles.reminderCheckOption}
                    onPress={handleToggleReminder}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        debtReminderEnabled && styles.checkboxBoxChecked,
                      ]}
                    >
                      {debtReminderEnabled && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <View style={styles.reminderCheckContent}>
                      <Text style={styles.reminderCheckLabel}>Send reminder notification</Text>
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

                {parseFloat(debtTotal) > 0 && parseFloat(debtEmi) > 0 && (
                  <View style={styles.tenureNote}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
                    <Text style={styles.tenureNoteText}>
                      {(() => {
                        const total = parseFloat(debtTotal);
                        const emi = parseFloat(debtEmi);
                        const rate = parseFloat(debtInterest) || 0;
                        if (rate === 0) {
                          const tenure = Math.ceil(total / emi);
                          return `Estimated tenure: ${tenure} months (Interest-Free)`;
                        }
                        const r = rate / 12 / 100;
                        if (emi <= total * r) {
                          return `Warning: Monthly interest (${formatCurrencyFull(Math.round(total * r))}) exceeds EMI`;
                        }
                        const n = Math.ceil(-Math.log(1 - (r * total) / emi) / Math.log(1 + r));
                        const totalInterestPaid = Math.max(0, Math.round(n * emi - total));
                        return `Estimated tenure: ${n} months • Total interest: ${formatCurrencyFull(totalInterestPaid)}`;
                      })()}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Info Tip Card */}
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
              <Text style={styles.tipText}>
                Skip this if you're debt-free. You can add a loan later in Settings.
              </Text>
            </View>
          </View>
        )}

        {/* Step 4: Savings & Goals */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="flag-outline" size={48} color={Colors.primaryLight} />
            </View>
            <Text style={styles.stepTitle}>What are you saving for?</Text>
            <Text style={styles.stepDescription}>
              Add goals like an emergency fund, travel or retirement, and watch them grow.
            </Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !hasInvestments && styles.toggleButtonActive]}
                onPress={() => setHasInvestments(false)}
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
                onPress={() => setHasInvestments(true)}
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

                {/* Popular Presets Bar */}
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Quick add suggestions:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetScroll}
                  >
                    {POPULAR_GOAL_PRESETS.map(preset => {
                      const isAdded = goals.some(
                        g => g.name.toLowerCase() === preset.name.toLowerCase()
                      );
                      return (
                        <TouchableOpacity
                          key={preset.name}
                          style={[styles.presetChip, isAdded && styles.presetChipAdded]}
                          onPress={() => handleAddPresetGoal(preset)}
                          disabled={isAdded}
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
                  </ScrollView>
                </View>

                {/* Goals List */}
                {goals.length === 0 ? (
                  <View style={styles.emptyGoalsCard}>
                    <Ionicons name="flag-outline" size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyGoalsText}>
                      No goals added yet. Tap any suggestion above or add a custom goal below.
                    </Text>
                  </View>
                ) : (
                  goals.map((goal, index) => (
                    <View key={goal.id} style={styles.investRow}>
                      <View
                        style={[
                          styles.goalIconWrap,
                          { backgroundColor: goal.color + '20' },
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
                      <View style={styles.goalRightWrap}>
                        <View style={styles.investInputWrap}>
                          <Text style={styles.investInputSymbol}>₹</Text>
                          <TextInput
                            ref={index === 0 ? firstInvestInputRef : undefined}
                            key={`step-4-goal-${goal.id}`}
                            style={styles.investInput}
                            keyboardType="numeric"
                            value={goal.monthlyAmount}
                            onChangeText={text => handleUpdateGoalAmount(goal.id, text)}
                            cursorColor={Colors.primaryLight}
                            selectionColor={Colors.primary}
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.deleteGoalBtn}
                          onPress={() => handleDeleteGoal(goal.id)}
                          accessibilityLabel={`Delete ${goal.name}`}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.accentRed} />
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
                      placeholder="Goal name (e.g. Wedding, Tech Setup, Travel)"
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
                      <View style={[styles.investInputWrap, { flex: 1, height: 42 }]}>
                        <Text style={styles.investInputSymbol}>₹</Text>
                        <TextInput
                          style={styles.investInput}
                          placeholder="Amount"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={customGoalAmount}
                          onChangeText={setCustomGoalAmount}
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
                      <Text style={styles.addGoalConfirmBtnText}>Add goal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Info Tip Card */}
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
              <Text style={styles.tipText}>
                Small, regular contributions add up. Even a modest monthly amount matters.
              </Text>
            </View>
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
    paddingTop: Spacing.huge + Spacing.md,
    paddingBottom: Spacing.xxxl,
  },

  // Welcome flow styles
  welcomeScrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  welcomeHeader: {
    width: '100%',
    maxWidth: 540,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  carouselWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  welcomeCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '18',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeCardTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  welcomeCardDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 380,
  },
  pageDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceHighlight,
  },
  pageDotActive: {
    width: 24,
    backgroundColor: Colors.primaryLight,
  },
  carouselNextBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.subtle,
  },
  carouselNextBtnText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
  carouselGetStartedBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentGreen,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.elevated,
  },
  carouselGetStartedBtnText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
  welcomeFooter: {
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 540,
    width: '100%',
  },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trustLineText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  durationHint: {
    ...Typography.small,
    color: Colors.textMuted,
  },

  // Setup Step Styles
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
    marginTop: Spacing.xs,
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
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

  // Input styles
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

  // Info tip card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accent + '15',
    borderWidth: 1,
    borderColor: Colors.accent + '35',
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

  // Budget Overview in Step 2
  budgetOverview: {
    width: '100%',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    ...TabularNums,
  },
  overviewBudget: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
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

  // Toggle buttons
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

  // Debt form
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
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.md,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  neutralBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accentGreen + '15',
    borderWidth: 1,
    borderColor: Colors.accentGreen + '35',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  neutralBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentGreen,
  },
  neutralBadgeSubtitle: {
    ...Typography.small,
    color: Colors.accentGreen,
    opacity: 0.85,
    marginTop: 2,
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accentAmber + '15',
    borderWidth: 1,
    borderColor: Colors.accentAmber + '35',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  interestBadgeTitle: {
    ...Typography.bodyBold,
    color: Colors.accentAmber,
  },
  interestBadgeSubtitle: {
    ...Typography.small,
    color: Colors.accentAmber,
    opacity: 0.85,
    marginTop: 2,
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
    fontFamily: Typography.bodyBold.fontFamily,
    ...TabularNums,
  },

  // Goals & Investments Form
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
    lineHeight: 18,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    padding: Spacing.sm,
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
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
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
    backgroundColor: Colors.surfaceHighlight + '40',
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
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    marginTop: 4,
  },
  addGoalConfirmBtnText: {
    ...Typography.bodyBold,
    color: '#fff',
  },

  // Actions row
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    maxWidth: 600,
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

  // Completion Screen Styles
  completionScrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  completionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 540,
    width: '100%',
    ...Shadows.elevated,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success + '18',
    borderWidth: 1,
    borderColor: Colors.success + '35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  completionTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  completionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    ...TabularNums,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  completionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  completionButtonText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
});
