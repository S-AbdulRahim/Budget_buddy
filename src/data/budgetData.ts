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
      name: 'Emergency Fund',
      type: 'Safety Net',
      monthlyAmount: 0,
      allocation: 0,
      color: '#3DBE7B',
      isActive: false,
      icon: 'shield-checkmark-outline',
    },
    {
      id: '2',
      name: 'Retirement Wealth',
      type: 'Long-term Growth',
      monthlyAmount: 0,
      allocation: 0,
      color: '#8B7FE8',
      isActive: false,
      icon: 'trending-up-outline',
    },
    {
      id: '3',
      name: 'Travel & Vacation',
      type: 'Targeted Savings',
      monthlyAmount: 0,
      allocation: 0,
      color: '#F2A93B',
      isActive: false,
      icon: 'airplane-outline',
    },
    {
      id: '4',
      name: 'Index Fund SIP',
      type: 'Passive Wealth',
      monthlyAmount: 0,
      allocation: 0,
      color: '#4FD1C5',
      isActive: false,
      icon: 'leaf-outline',
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
  { name: 'Emergency Fund', type: 'Safety Net', defaultAmount: 5000, icon: 'shield-checkmark-outline', color: '#3DBE7B' },
  { name: 'Retirement Wealth', type: 'Long-term Growth', defaultAmount: 5000, icon: 'trending-up-outline', color: '#8B7FE8' },
  { name: 'Travel & Vacation', type: 'Experiences', defaultAmount: 3000, icon: 'airplane-outline', color: '#F2A93B' },
  { name: 'Education Fund', type: 'Future Planning', defaultAmount: 4000, icon: 'school-outline', color: '#4FD1C5' },
  { name: 'New Home Fund', type: 'Property Goal', defaultAmount: 10000, icon: 'home-outline', color: '#D97757' },
  { name: 'Vehicle Fund', type: 'Asset Goal', defaultAmount: 5000, icon: 'car-outline', color: '#26C6DA' },
  { name: 'Index Fund SIP', type: 'Passive Wealth', defaultAmount: 5000, icon: 'leaf-outline', color: '#C9A24E' },
];

export const GOAL_COLORS = [
  '#3DBE7B', '#8B7FE8', '#F2A93B', '#4FD1C5', '#D97757', '#26C6DA', '#E5555C', '#C9A24E'
];
