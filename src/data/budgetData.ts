// Default budget data seeded from the user's Excel spreadsheet
import { AppData, Category, DebtPayment, MonthlyProjection } from '../types';

export function generateDebtSchedule(total: number, emi: number, startMonthStr: string, interestRate: number = 0): DebtPayment[] {
  if (total <= 0 || emi <= 0) return [];
  const schedule: DebtPayment[] = [];
  let remaining = total;
  let principalPaid = 0;
  
  // Parse start month, e.g., "Jun '26", "Jun 2026", "15 Jun 2026", "2026-06-01"
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let mIndex = 5; // Default June
  let year = 2026;

  if (startMonthStr) {
    const clean = startMonthStr.replace(/['",]/g, ' ').trim();
    const tokens = clean.split(/\s+/);
    const foundIdx = tokens.findIndex(t =>
      months.some(m => m.toLowerCase().startsWith(t.toLowerCase().slice(0, 3)))
    );
    if (foundIdx !== -1) {
      const match = tokens[foundIdx].toLowerCase().slice(0, 3);
      const parsedIdx = months.findIndex(m => m.toLowerCase().startsWith(match));
      if (parsedIdx !== -1) mIndex = parsedIdx;

      const yToken = tokens.find((t, i) => i !== foundIdx && /^\d{2,4}$/.test(t));
      if (yToken) {
        const parsedY = parseInt(yToken.length === 2 ? '20' + yToken : yToken);
        if (!isNaN(parsedY)) year = parsedY;
      }
    } else {
      const isoMatch = startMonthStr.match(/^(\d{4})[-/](\d{1,2})/);
      if (isoMatch) {
        year = parseInt(isoMatch[1]);
        mIndex = Math.max(0, Math.min(11, parseInt(isoMatch[2]) - 1));
      }
    }
  }
  
  const monthlyRate = interestRate > 0 ? interestRate / 12 / 100 : 0;
  let safetyCount = 0;

  while (remaining > 0 && safetyCount < 360) {
    safetyCount++;
    const currentMonthStr = `${months[mIndex]} '${year.toString().slice(-2)}`;
    
    const interestThisMonth = monthlyRate > 0 ? remaining * monthlyRate : 0;
    const principalPortion = monthlyRate > 0 ? Math.max(1, emi - interestThisMonth) : emi;
    const actualPrincipalPaid = Math.min(remaining, principalPortion);
    const currentEmi = Math.min(emi, remaining + interestThisMonth);

    principalPaid += actualPrincipalPaid;
    remaining = Math.max(0, remaining - actualPrincipalPaid);
    
    schedule.push({
      month: currentMonthStr,
      emi: Math.round(currentEmi),
      principalPaid: Math.round(principalPaid),
      remainingBalance: Math.round(remaining),
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
  debtStartMonth: "15 Jun '26",
  debtInterestRate: 0,
  debtEmiDay: 15,
  debtReminderEnabled: true,
  
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

export interface GoalPreset {
  name: string;
  type: string;
  defaultAmount: number;
  icon: string;
  color: string;
}

export const POPULAR_GOAL_PRESETS: GoalPreset[] = [
  { name: 'Emergency Fund', type: 'Safety Net', defaultAmount: 5000, icon: 'shield-checkmark', color: '#00E676' },
  { name: 'Retirement Wealth', type: 'Long-term SIP', defaultAmount: 5000, icon: 'trending-up', color: '#6C5CE7' },
  { name: 'Hajj / Umrah Fund', type: 'Goal-based Saving', defaultAmount: 3000, icon: 'airplane', color: '#FFB74D' },
  { name: 'Child Education', type: 'Future Planning', defaultAmount: 4000, icon: 'school', color: '#00D2FF' },
  { name: 'House Down Payment', type: 'Property Goal', defaultAmount: 10000, icon: 'home', color: '#FF6B9D' },
  { name: 'Gold / Precious Metals', type: 'Asset Hedge', defaultAmount: 3000, icon: 'trophy', color: '#FFD700' },
  { name: 'Ethical / Halal Index SIP', type: 'Shariah Equity', defaultAmount: 5000, icon: 'leaf', color: '#26C6DA' },
];

export const GOAL_COLORS = [
  '#00E676', '#6C5CE7', '#FFB74D', '#00D2FF', '#FF6B9D', '#26C6DA', '#FF5252', '#7C4DFF'
];
