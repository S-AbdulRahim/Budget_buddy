// TypeScript interfaces for Budget Buddy

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMode: 'UPI' | 'Bank Transfer' | 'Cash' | 'Credit Card';
  type: 'Need' | 'Want';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
  color: string;
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
}

export interface MonthlyProjection {
  month: string;
  categories: { [key: string]: number };
  total: number;
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
  isSetupCompleted?: boolean;
}
