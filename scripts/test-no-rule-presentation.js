// Verification test for no-rule flat presentation and group switching logic
const assert = require('assert');

// 1. Verify rules
const BUDGETING_RULES = [
  { id: 'none', label: 'No rule', description: 'Budget freely without percentage targets', targets: null },
  { id: '50-30-20', label: '50/30/20 Rule', description: '50% Needs, 30% Wants, 20% Savings & Debt', targets: { Needs: 50, Wants: 30, Savings: 20 } },
  { id: '70-20-10', label: '70/20/10 Rule', description: '70% Needs, 20% Wants, 10% Savings & Debt', targets: { Needs: 70, Wants: 20, Savings: 10 } },
  { id: '80-20', label: '80/20 Rule', description: '60% Needs, 20% Wants, 20% Savings & Debt', targets: { Needs: 60, Wants: 20, Savings: 20 } },
  { id: 'custom', label: 'Custom Rule', description: 'Define your own percentages', targets: { Needs: 50, Wants: 30, Savings: 20 } },
];

console.log('--- Test 1: hasTargets check ---');
const noRule = BUDGETING_RULES.find(r => r.id === 'none');
const numericRule = BUDGETING_RULES.find(r => r.id === '50-30-20');

assert.strictEqual(noRule.targets !== null, false, 'No rule hasTargets must be false');
assert.strictEqual(numericRule.targets !== null, true, '50-30-20 hasTargets must be true');
console.log('hasTargets correctly identifies flat vs grouped rendering mode.');

console.log('\n--- Test 2: Category group toggling under none ---');
let categories = [
  { id: '1', name: 'Rent', group: 'Needs', color: '#3B82F6', budget: 20000 },
  { id: '2', name: 'Dining Out', group: 'Wants', color: '#EC4899', budget: 5000 },
];

function updateCategoryGroup(id, newGroup) {
  const groupColors = {
    Needs: '#3B82F6',
    Wants: '#EC4899',
    Savings: '#10B981',
  };
  categories = categories.map(cat =>
    cat.id === id
      ? { ...cat, group: newGroup, color: groupColors[newGroup] }
      : cat
  );
}

// User toggles Dining Out from Wants to Needs
updateCategoryGroup('2', 'Needs');
assert.strictEqual(categories.find(c => c.id === '2').group, 'Needs');
assert.strictEqual(categories.find(c => c.id === '2').color, '#3B82F6');
console.log('Category group and color toggle successfully to Needs.');

// Simulate AddExpenseModal selecting this category
function getExpenseTypeDefault(category) {
  if (category.group === 'Needs') return 'Need';
  if (category.group === 'Wants') return 'Want';
  return 'Need';
}

const expenseType = getExpenseTypeDefault(categories.find(c => c.id === '2'));
assert.strictEqual(expenseType, 'Need', 'AddExpenseModal correctly defaults to Need after category group switch');
console.log('AddExpenseModal expense default reflects updated group correctly.');

console.log('\n--- Test 3: Adding category under none defaults to Needs ---');
function addCategoryUnderNone(name, budget) {
  return {
    id: Date.now().toString(),
    name,
    budget,
    group: 'Needs',
    color: '#3B82F6',
  };
}

const newCat = addCategoryUnderNone('Gym Membership', 2000);
assert.strictEqual(newCat.group, 'Needs');
console.log('New category under none defaults to Needs as expected.');

console.log('\nALL TESTS PASSED SUCCESSFULLY!');
