// TypeScript interfaces for FinCompass

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMode: 'UPI' | 'Bank Transfer' | 'Cash' | 'Credit Card';
  type: 'Need' | 'Want';
}

export type CategoryGroup = 'Needs' | 'Wants' | 'Savings';

export interface Category {
  id: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
  color: string;
  group?: CategoryGroup;
}

export interface DebtPayment {
  month: string;
  emi: number;
  principalPaid: number;
  remainingBalance: number;
  isPaid: boolean;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  monthlyAmount: number;
  allocation: number; // percentage
  color: string;
  isActive: boolean;
  icon?: string;
  targetAmount?: number;
}

export interface MonthlyProjection {
  month: string;
  categories: { [key: string]: number };
  total: number;
}

export type BudgetingRuleId = 'none' | '50-30-20' | '70-20-10' | '80-20' | 'custom';

export interface BudgetingRule {
  id: BudgetingRuleId;
  label: string;
  description: string;
  targets: { Needs: number; Wants: number; Savings: number } | null; // null when id === 'none'
}

export interface CreditCard {
  id: string;
  nickname: string;
  last4: string;
  bank?: string;
  color: string;
  smsTrackingEnabled: boolean;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  amount: number;
  merchant?: string;
  date: string;
  status: 'pending' | 'confirmed' | 'dismissed';
  source: 'sms' | 'manual';
  rawSmsSnippet?: string;
}

export interface AppData {
  salary: number;
  expenses: Expense[];
  categories: Category[];
  debtPayments: DebtPayment[];
  investments: Investment[];
  annualProjections: MonthlyProjection[];
  debtTotal: number;
  debtEmi: number;
  debtTenure: number;
  debtStartMonth?: string;
  debtInterestRate?: number;
  debtEmiDay?: number;
  debtReminderEnabled?: boolean;
  isSetupCompleted?: boolean;
  budgetingRule?: BudgetingRule;
  overrideDebtLock?: boolean;
  creditCards?: CreditCard[];
  cardTransactions?: CardTransaction[];
}

