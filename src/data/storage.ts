// AsyncStorage wrapper for data persistence
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Expense, Category, Investment, BudgetingRule, CreditCard, CardTransaction, BankAccount, AccountTransaction } from '../types';
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
      if (!data.creditCards) {
        hasMigration = true;
        data.creditCards = [];
      } else {
        data.creditCards = data.creditCards.map(c => {
          if (!c.cardType) {
            hasMigration = true;
            return { ...c, cardType: 'credit' as const };
          }
          return c;
        });
      }
      if (!data.cardTransactions) {
        hasMigration = true;
        data.cardTransactions = [];
      }
      if (!data.bankAccounts) {
        hasMigration = true;
        data.bankAccounts = [];
      }
      if (!data.accountTransactions) {
        hasMigration = true;
        data.accountTransactions = [];
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

export async function addCreditCard(card: Omit<CreditCard, 'id'>): Promise<AppData> {
  const data = await loadData();
  const newCard: CreditCard = {
    ...card,
    id: Date.now().toString(),
  };
  data.creditCards = [...(data.creditCards || []), newCard];
  await saveData(data);
  return data;
}

export async function updateCreditCard(cardId: string, updates: Partial<CreditCard>): Promise<AppData> {
  const data = await loadData();
  data.creditCards = (data.creditCards || []).map(c => (c.id === cardId ? { ...c, ...updates } : c));
  await saveData(data);
  return data;
}

export async function deleteCreditCard(cardId: string): Promise<AppData> {
  const data = await loadData();
  data.creditCards = (data.creditCards || []).filter(c => c.id !== cardId);
  // Dismiss or remove any pending transactions for this card and strip raw snippets
  data.cardTransactions = (data.cardTransactions || []).map(tx => {
    if (tx.cardId === cardId && tx.status === 'pending') {
      const { rawSmsSnippet, ...rest } = tx;
      return { ...rest, status: 'dismissed' as const };
    }
    return tx;
  });
  await saveData(data);
  return data;
}

export async function addCardTransactions(transactions: Omit<CardTransaction, 'id'>[]): Promise<AppData> {
  const data = await loadData();
  const existing = data.cardTransactions || [];

  const newTxList: CardTransaction[] = [];
  transactions.forEach((tx, idx) => {
    const isDuplicate = existing.some(
      e =>
        e.cardId === tx.cardId &&
        e.amount === tx.amount &&
        e.date === tx.date &&
        (e.merchant === tx.merchant || (e.rawSmsSnippet && tx.rawSmsSnippet && e.rawSmsSnippet === tx.rawSmsSnippet))
    );
    if (!isDuplicate) {
      newTxList.push({
        ...tx,
        id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      });
    }
  });

  if (newTxList.length > 0) {
    data.cardTransactions = [...newTxList, ...existing];
    await saveData(data);
  }
  return data;
}

export async function confirmCardTransaction(
  transactionId: string,
  expenseDetails: { category: string; type?: 'Need' | 'Want'; description?: string }
): Promise<AppData> {
  const data = await loadData();
  const txIndex = (data.cardTransactions || []).findIndex(t => t.id === transactionId);
  if (txIndex === -1) return data;

  const tx = data.cardTransactions![txIndex];
  const cat = data.categories.find(c => c.name === expenseDetails.category);
  const defaultType = cat?.group === 'Needs' ? 'Need' : 'Want';
  const card = (data.creditCards || []).find(c => c.id === tx.cardId);
  const paymentMode = card?.cardType === 'debit' ? 'Debit Card' : 'Credit Card';

  const newExpense: Expense = {
    id: Date.now().toString(),
    amount: tx.amount,
    category: expenseDetails.category,
    description: expenseDetails.description || tx.merchant || (card?.cardType === 'debit' ? 'Debit Card Spend' : 'Credit Card Spend'),
    date: tx.date,
    paymentMode,
    type: expenseDetails.type || defaultType,
  };

  data.expenses = [newExpense, ...data.expenses];

  // Recompute category spent
  if (cat) {
    cat.spent = data.expenses
      .filter(e => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  // Update status to confirmed and strip ephemeral snippet
  const { rawSmsSnippet, ...cleanTx } = tx;
  data.cardTransactions![txIndex] = {
    ...cleanTx,
    status: 'confirmed',
  };

  await saveData(data);
  return data;
}

export async function dismissCardTransaction(transactionId: string): Promise<AppData> {
  const data = await loadData();
  const txIndex = (data.cardTransactions || []).findIndex(t => t.id === transactionId);
  if (txIndex === -1) return data;

  const tx = data.cardTransactions![txIndex];
  // Update status to dismissed and strip ephemeral snippet
  const { rawSmsSnippet, ...cleanTx } = tx;
  data.cardTransactions![txIndex] = {
    ...cleanTx,
    status: 'dismissed',
  };

  await saveData(data);
  return data;
}

export async function addManualCardTransaction(
  cardId: string,
  amount: number,
  merchant: string,
  date: string,
  category: string,
  type: 'Need' | 'Want'
): Promise<AppData> {
  const data = await loadData();
  const newTxId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const card = (data.creditCards || []).find(c => c.id === cardId);
  const paymentMode = card?.cardType === 'debit' ? 'Debit Card' : 'Credit Card';

  const newTx: CardTransaction = {
    id: newTxId,
    cardId,
    amount,
    merchant,
    date,
    status: 'confirmed',
    source: 'manual',
  };

  data.cardTransactions = [newTx, ...(data.cardTransactions || [])];

  const newExpense: Expense = {
    id: Date.now().toString(),
    amount,
    category,
    description: merchant || (card?.cardType === 'debit' ? 'Debit Card Spend' : 'Credit Card Spend'),
    date,
    paymentMode,
    type,
  };
  data.expenses = [newExpense, ...data.expenses];

  const cat = data.categories.find(c => c.name === category);
  if (cat) {
    cat.spent = data.expenses
      .filter(e => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  await saveData(data);
  return data;
}

export async function addBankAccount(account: Omit<BankAccount, 'id'>): Promise<AppData> {
  const data = await loadData();
  const newAccount: BankAccount = {
    ...account,
    id: Date.now().toString(),
  };
  data.bankAccounts = [...(data.bankAccounts || []), newAccount];
  await saveData(data);
  return data;
}

export async function updateBankAccount(accountId: string, updates: Partial<BankAccount>): Promise<AppData> {
  const data = await loadData();
  data.bankAccounts = (data.bankAccounts || []).map(a => (a.id === accountId ? { ...a, ...updates } : a));
  await saveData(data);
  return data;
}

export async function deleteBankAccount(accountId: string): Promise<AppData> {
  const data = await loadData();
  data.bankAccounts = (data.bankAccounts || []).filter(a => a.id !== accountId);
  data.accountTransactions = (data.accountTransactions || []).filter(t => t.accountId !== accountId);
  await saveData(data);
  return data;
}

export async function addManualAccountTransaction(
  accountId: string,
  amount: number,
  description: string,
  date: string,
  type: 'debit' | 'credit',
  category?: string,
  expenseType: 'Need' | 'Want' = 'Need'
): Promise<AppData> {
  const data = await loadData();
  const newTxId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newTx: AccountTransaction = {
    id: newTxId,
    accountId,
    amount,
    description,
    date,
    type,
    category,
  };

  data.accountTransactions = [newTx, ...(data.accountTransactions || [])];

  if (type === 'debit' && category) {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount,
      category,
      description: description || 'Bank Account Debit',
      date,
      paymentMode: 'Bank Transfer',
      type: expenseType,
    };
    data.expenses = [newExpense, ...data.expenses];

    const cat = data.categories.find(c => c.name === category);
    if (cat) {
      cat.spent = data.expenses
        .filter(e => e.category === cat.name)
        .reduce((sum, e) => sum + e.amount, 0);
    }
  }

  await saveData(data);
  return data;
}

