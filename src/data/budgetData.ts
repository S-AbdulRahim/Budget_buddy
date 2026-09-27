// Default budget data seeded from the user's Excel spreadsheet
import { AppData, Category, DebtPayment, MonthlyProjection } from '../types';

export function generateDebtSchedule(total: number, emi: number, startMonthStr: string): DebtPayment[] {
  if (total <= 0 || emi <= 0) return [];
  const schedule: DebtPayment[] = [];
  let remaining = total;
  let principalPaid = 0;
  
  // Parse start month, e.g., "Jun '26" or "Jun 2026"
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let cleanStart = startMonthStr.replace("'", "").trim();
  let parts = cleanStart.split(/\s+/);
  let mName = parts[0] || "Jun";
  let yName = parts[1] || "26";
  
  let mIndex = months.findIndex(m => m.toLowerCase().startsWith(mName.toLowerCase()));
  if (mIndex === -1) mIndex = 5; // Default June
  
  let year = parseInt(yName.length === 2 ? "20" + yName : yName);
  if (isNaN(year)) year = 2026;
  
  while (remaining > 0) {
    const currentMonthStr = `${months[mIndex]} '${year.toString().slice(-2)}`;
    const currentEmi = Math.min(emi, remaining);
    principalPaid += currentEmi;
    remaining -= currentEmi;
    
    schedule.push({
      month: currentMonthStr,
      emi: currentEmi,
      principalPaid: principalPaid,
      remainingBalance: remaining,
      isPaid: false,
    });
    
    mIndex++;
    if (mIndex >= 12) {
      mIndex = 0;
      year++;
    }
  }
  
  return schedule;
}

export function generateAnnualProjections(categories: Category[]): MonthlyProjection[] {
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  
  const categoryBudgets: { [key: string]: number } = {};
  let total = 0;
  categories.forEach(cat => {
    categoryBudgets[cat.name] = cat.budget;
    total += cat.budget;
  });
  
  return months.map(month => ({
    month,
    categories: { ...categoryBudgets },
    total,
  }));
}

export const INITIAL_EMPTY_DATA: AppData = {
  salary: 0,
  
  categories: [
    { id: '1', name: 'Rent', icon: 'home', budget: 0, spent: 0, color: '#6C5CE7' },
    { id: '2', name: 'Groceries', icon: 'cart', budget: 0, spent: 0, color: '#00E676' },
    { id: '3', name: 'Transportation', icon: 'car', budget: 0, spent: 0, color: '#00D2FF' },
    { id: '4', name: 'Utilities', icon: 'flash', budget: 0, spent: 0, color: '#FFB74D' },
    { id: '5', name: 'Entertainment', icon: 'game-controller', budget: 0, spent: 0, color: '#FF6B9D' },
    { id: '6', name: 'Shopping', icon: 'bag-handle', budget: 0, spent: 0, color: '#FF5252' },
    { id: '7', name: 'Healthcare', icon: 'medkit', budget: 0, spent: 0, color: '#26C6DA' },
    { id: '8', name: 'Savings', icon: 'wallet', budget: 0, spent: 0, color: '#7C4DFF' },
  ],
  
  expenses: [],
  
  debtTotal: 0,
  debtEmi: 0,
  debtTenure: 0,
  debtStartMonth: "Jun '26",
  
  debtPayments: [],
  
  investments: [
    {
      id: '1',
      name: 'Tata Ethical ELSS Fund',
      type: 'ELSS (Tax Saving)',
      monthlyAmount: 0,
      allocation: 0,
      color: '#6C5CE7',
      isActive: false,
    },
    {
      id: '2',
      name: 'Nippon India ETF Shariah BeES',
      type: 'ETF (Shariah)',
      monthlyAmount: 0,
      allocation: 0,
      color: '#00D2FF',
      isActive: false,
    },
    {
      id: '3',
      name: 'Taurus Ethical Fund',
      type: 'Equity (Ethical)',
      monthlyAmount: 0,
      allocation: 0,
      color: '#00E676',
      isActive: false,
    },
    {
      id: '4',
      name: 'Umrah Reserve Fund',
      type: 'Goal-based Saving',
      monthlyAmount: 0,
      allocation: 0,
      color: '#FFB74D',
      isActive: false,
    },
  ],
  
  annualProjections: [],
  isSetupCompleted: false,
};

// Kept for backward compatibility if any older layouts reference it
export const DEFAULT_DATA = INITIAL_EMPTY_DATA;
