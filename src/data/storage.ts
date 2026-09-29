// AsyncStorage wrapper for data persistence
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Expense, Category, Investment, BudgetingRule } from '../types';
import {
  INITIAL_EMPTY_DATA,
  DEFAULT_CATEGORY_GROUPS,
  BUDGETING_RULES,
  generateDebtSchedule,
  generateAnnualProjections,
} from './budgetData';

const STORAGE_KEY = '@budget_buddy_data';

export async function loadData(): Promise<AppData> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const data = JSON.parse(json) as AppData;
      let hasMigration = false;
      if (data.categories) {
        data.categories = data.categories.map(cat => {
          if (!cat.group) {
            hasMigration = true;
            return {
              ...cat,
              group: DEFAULT_CATEGORY_GROUPS[cat.name] || 'Wants',
            };
          }
          return cat;
        });
      }
      if (!data.budgetingRule) {
        hasMigration = true;
        data.budgetingRule = BUDGETING_RULES[1]; // Default to 50-30-20
      }
      if (data.overrideDebtLock === undefined) {
        hasMigration = true;
        data.overrideDebtLock = false;
      }
      if (hasMigration) {
        await saveData(data);
      }
      return data;
    }
    // First launch — seed with empty configured data
    await saveData(INITIAL_EMPTY_DATA);
    return INITIAL_EMPTY_DATA;
  } catch (error) {
    console.error('Error loading data:', error);
    return INITIAL_EMPTY_DATA;
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<AppData> {
  const data = await loadData();
  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
  };
  data.expenses = [newExpense, ...data.expenses];
  
  // Update category spent
  const category = data.categories.find(c => c.name === expense.category);
  if (category) {
    category.spent += expense.amount;
  }
  
  await saveData(data);
  return data;
}

export async function deleteExpense(expenseId: string): Promise<AppData> {
  const data = await loadData();
  const expense = data.expenses.find(e => e.id === expenseId);
  
  if (expense) {
    // Subtract from category
    const category = data.categories.find(c => c.name === expense.category);
    if (category) {
      category.spent = Math.max(0, category.spent - expense.amount);
    }
    data.expenses = data.expenses.filter(e => e.id !== expenseId);
  }
  
  await saveData(data);
  return data;
}

export async function toggleDebtPayment(month: string): Promise<AppData> {
  const data = await loadData();
  data.debtPayments = data.debtPayments.map(p =>
    p.month === month ? { ...p, isPaid: !p.isPaid } : p
  );
  await saveData(data);
  return data;
}

export async function updateSettings(
  salary: number,
  categories: Category[],
  debt: { total: number; emi: number; startMonth: string; interestRate?: number; emiDay?: number; reminderEnabled?: boolean; overrideDebtLock?: boolean },
  investments: Investment[],
  extraSettings?: { budgetingRule?: BudgetingRule; overrideDebtLock?: boolean }
): Promise<AppData> {
  const currentData = await loadData();
  
  const interestRate = debt.interestRate ?? 0;
  const debtPayments = generateDebtSchedule(debt.total, debt.emi, debt.startMonth, interestRate);
  const annualProjections = generateAnnualProjections(categories);
  
  // Extract or preserve emiDay
  let emiDay = debt.emiDay;
  if (!emiDay && debt.startMonth) {
    const dayMatch = debt.startMonth.match(/^(\d{1,2})\b/);
    if (dayMatch) {
      emiDay = parseInt(dayMatch[1], 10);
    }
  }
  if (!emiDay) {
    emiDay = currentData.debtEmiDay || 15;
  }

  // Map out previous paid months if the debt configuration is similar, or just map them by index/month
  const prevPaymentsMap = new Map(currentData.debtPayments.map(p => [p.month, p.isPaid]));
  const updatedPayments = debtPayments.map(p => ({
    ...p,
    isPaid: prevPaymentsMap.get(p.month) || false,
  }));

  const updatedData: AppData = {
    ...currentData,
    salary,
    categories,
    debtTotal: debt.total,
    debtEmi: debt.emi,
    debtTenure: updatedPayments.length,
    debtStartMonth: debt.startMonth,
    debtInterestRate: interestRate,
    debtEmiDay: emiDay,
    debtReminderEnabled: debt.reminderEnabled ?? currentData.debtReminderEnabled ?? true,
    debtPayments: updatedPayments,
    investments,
    annualProjections,
    budgetingRule: extraSettings?.budgetingRule !== undefined ? extraSettings.budgetingRule : currentData.budgetingRule || BUDGETING_RULES[1],
    overrideDebtLock: extraSettings?.overrideDebtLock !== undefined
      ? extraSettings.overrideDebtLock
      : debt.overrideDebtLock !== undefined
      ? debt.overrideDebtLock
      : currentData.overrideDebtLock ?? false,
    isSetupCompleted: true,
  };
  
  await saveData(updatedData);
  return updatedData;
}

export async function setDebtLockOverride(override: boolean): Promise<AppData> {
  const data = await loadData();
  data.overrideDebtLock = override;
  await saveData(data);
  return data;
}

export async function setBudgetingRule(rule: BudgetingRule): Promise<AppData> {
  const data = await loadData();
  data.budgetingRule = rule;
  await saveData(data);
  return data;
}

export async function resetData(): Promise<AppData> {
  await saveData(INITIAL_EMPTY_DATA);
  return INITIAL_EMPTY_DATA;
}
