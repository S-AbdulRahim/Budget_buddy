// AsyncStorage wrapper for data persistence
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Expense } from '../types';
import { DEFAULT_DATA } from './budgetData';

const STORAGE_KEY = '@budget_buddy_data';

export async function loadData(): Promise<AppData> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json) as AppData;
    }
    // First launch — seed with default data
    await saveData(DEFAULT_DATA);
    return DEFAULT_DATA;
  } catch (error) {
    console.error('Error loading data:', error);
    return DEFAULT_DATA;
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

export async function resetData(): Promise<AppData> {
  await saveData(DEFAULT_DATA);
  return DEFAULT_DATA;
}
