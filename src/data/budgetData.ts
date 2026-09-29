// Default budget data seeded from the user's Excel spreadsheet
import { AppData, BudgetingRule, Category, CategoryGroup, DebtPayment, MonthlyProjection } from '../types';
import { Colors } from '../theme';

export const DEFAULT_CATEGORY_GROUPS: Record<string, CategoryGroup> = {
  Rent: 'Needs',
  Groceries: 'Needs',
  Transportation: 'Needs',
  Utilities: 'Needs',
  Healthcare: 'Needs',
  Entertainment: 'Wants',
  Shopping: 'Wants',
  Savings: 'Savings',
};

export const BUDGETING_RULES: BudgetingRule[] = [
  {
    id: 'none',
    label: "No rule — I'll set my own limits",
    description: 'Just enter a budget for each category. No suggested split.',
    targets: null,
  },
  {
    id: '50-30-20',
    label: '50 / 30 / 20',
    description: '50% needs, 30% wants, 20% savings & debt. The most common starting point.',
    targets: { Needs: 50, Wants: 30, Savings: 20 },
  },
  {
    id: '70-20-10',
    label: '70 / 20 / 10',
    description: '70% needs, 20% savings & debt, 10% wants. For tighter budgets or big debt goals.',
    targets: { Needs: 70, Wants: 10, Savings: 20 },
  },
  {
    id: '80-20',
    label: '80 / 20',
    description: '80% everyday spending, 20% savings & debt. Simple, two-bucket thinking.',
    targets: { Needs: 60, Wants: 20, Savings: 20 },
  },
  {
    id: 'custom',
    label: 'Custom split',
    description: 'Set your own Needs / Wants / Savings percentages.',
    targets: null,
  },
];

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
    { id: '1', name: 'Rent', icon: 'home', budget: 0, spent: 0, color: Colors.categoryRent, group: 'Needs' },
    { id: '2', name: 'Groceries', icon: 'cart', budget: 0, spent: 0, color: Colors.categoryGroceries, group: 'Needs' },
    { id: '3', name: 'Transportation', icon: 'car', budget: 0, spent: 0, color: Colors.categoryTransport, group: 'Needs' },
    { id: '4', name: 'Utilities', icon: 'flash', budget: 0, spent: 0, color: Colors.categoryUtilities, group: 'Needs' },
    { id: '5', name: 'Entertainment', icon: 'game-controller', budget: 0, spent: 0, color: Colors.categoryEntertainment, group: 'Wants' },
    { id: '6', name: 'Shopping', icon: 'bag-handle', budget: 0, spent: 0, color: Colors.categoryShopping, group: 'Wants' },
    { id: '7', name: 'Healthcare', icon: 'medkit', budget: 0, spent: 0, color: Colors.categoryHealthcare, group: 'Needs' },
    { id: '8', name: 'Savings', icon: 'wallet', budget: 0, spent: 0, color: Colors.categorySavings, group: 'Savings' },
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
      color: Colors.accentGreen,
      isActive: false,
      icon: 'shield-checkmark-outline',
      targetAmount: 150000,
    },
    {
      id: '2',
      name: 'Retirement Wealth',
      type: 'Long-term Growth',
      monthlyAmount: 0,
      allocation: 0,
      color: Colors.categoryRent,
      isActive: false,
      icon: 'trending-up-outline',
      targetAmount: 1000000,
    },
    {
      id: '3',
      name: 'Travel & Vacation',
      type: 'Targeted Savings',
      monthlyAmount: 0,
      allocation: 0,
      color: Colors.accentAmber,
      isActive: false,
      icon: 'airplane-outline',
      targetAmount: 50000,
    },
    {
      id: '4',
      name: 'Index Fund SIP',
      type: 'Passive Wealth',
      monthlyAmount: 0,
      allocation: 0,
      color: Colors.primaryLight,
      isActive: false,
      icon: 'leaf-outline',
      targetAmount: 300000,
    },
  ],
  
  annualProjections: [],
  isSetupCompleted: false,
  budgetingRule: BUDGETING_RULES[1],
  overrideDebtLock: false,
};

// Kept for backward compatibility if any older layouts reference it
export const DEFAULT_DATA = INITIAL_EMPTY_DATA;

export interface GoalPreset {
  name: string;
  type: string;
  defaultAmount: number;
  icon: string;
  color: string;
  targetAmount?: number;
}

export const POPULAR_GOAL_PRESETS: GoalPreset[] = [
  { name: 'Emergency Fund', type: 'Safety Net', defaultAmount: 5000, targetAmount: 150000, icon: 'shield-checkmark-outline', color: Colors.accentGreen },
  { name: 'Retirement Wealth', type: 'Long-term Growth', defaultAmount: 5000, targetAmount: 1000000, icon: 'trending-up-outline', color: Colors.categoryRent },
  { name: 'Travel & Vacation', type: 'Experiences', defaultAmount: 3000, targetAmount: 50000, icon: 'airplane-outline', color: Colors.accentAmber },
  { name: 'Education Fund', type: 'Future Planning', defaultAmount: 4000, targetAmount: 200000, icon: 'school-outline', color: Colors.primaryLight },
  { name: 'New Home Fund', type: 'Property Goal', defaultAmount: 10000, targetAmount: 500000, icon: 'home-outline', color: Colors.accentPink },
  { name: 'Vehicle Fund', type: 'Asset Goal', defaultAmount: 5000, targetAmount: 150000, icon: 'car-outline', color: Colors.categoryHealthcare },
  { name: 'Index Fund SIP', type: 'Passive Wealth', defaultAmount: 5000, targetAmount: 300000, icon: 'leaf-outline', color: Colors.accent },
];

export const GOAL_COLORS = [
  Colors.accentGreen,
  Colors.categoryRent,
  Colors.accentAmber,
  Colors.primaryLight,
  Colors.accentPink,
  Colors.categoryHealthcare,
  Colors.accentRed,
  Colors.accent,
];
