// Test script for distributeGroupBudget
const CATEGORY_DEFAULT_WEIGHTS = {
  Rent: 45,
  Groceries: 25,
  Transportation: 12,
  Utilities: 12,
  Healthcare: 6,
  Entertainment: 45,
  Shopping: 55,
  Savings: 100,
};

const GROUP_DEFAULT_WEIGHTS = {
  Needs: 20,
  Wants: 50,
  Savings: 100,
};

function distributeGroupBudget(groupTargetAmount, enabledCategoryNames, group) {
  const result = {};
  if (groupTargetAmount <= 0 || enabledCategoryNames.length === 0) {
    enabledCategoryNames.forEach(name => {
      result[name] = 0;
    });
    return result;
  }

  const defaultGroupWeight = group ? GROUP_DEFAULT_WEIGHTS[group] : 20;
  let totalWeight = 0;
  const weights = {};

  enabledCategoryNames.forEach(name => {
    const w = CATEGORY_DEFAULT_WEIGHTS[name] ?? defaultGroupWeight;
    weights[name] = w;
    totalWeight += w;
  });

  if (totalWeight <= 0) {
    enabledCategoryNames.forEach(name => {
      result[name] = 0;
    });
    return result;
  }

  let largestCat = enabledCategoryNames[0];
  let largestVal = -1;
  let currentSum = 0;

  enabledCategoryNames.forEach(name => {
    const raw = (weights[name] / totalWeight) * groupTargetAmount;
    const rounded = Math.round(raw / 50) * 50;
    result[name] = rounded;
    currentSum += rounded;
    if (rounded > largestVal) {
      largestVal = rounded;
      largestCat = name;
    }
  });

  const diff = groupTargetAmount - currentSum;
  if (diff !== 0 && largestCat) {
    result[largestCat] = Math.max(0, result[largestCat] + diff);
  }

  return result;
}

// Test cases
console.log('--- Test 1: Needs for ₹60,000 salary (50% = 30,000) ---');
const needs60k = distributeGroupBudget(30000, ['Rent', 'Groceries', 'Transportation', 'Utilities', 'Healthcare'], 'Needs');
console.log(needs60k);
const sumNeeds60k = Object.values(needs60k).reduce((a, b) => a + b, 0);
console.log('Sum:', sumNeeds60k, 'Expected: 30000', sumNeeds60k === 30000 ? 'PASS' : 'FAIL');

console.log('\n--- Test 2: Wants for ₹60,000 salary (30% = 18,000) ---');
const wants60k = distributeGroupBudget(18000, ['Entertainment', 'Shopping'], 'Wants');
console.log(wants60k);
const sumWants60k = Object.values(wants60k).reduce((a, b) => a + b, 0);
console.log('Sum:', sumWants60k, 'Expected: 18000', sumWants60k === 18000 ? 'PASS' : 'FAIL');

console.log('\n--- Test 3: Savings for ₹60,000 salary (20% = 12,000) ---');
const sav60k = distributeGroupBudget(12000, ['Savings'], 'Savings');
console.log(sav60k);
const sumSav60k = Object.values(sav60k).reduce((a, b) => a + b, 0);
console.log('Sum:', sumSav60k, 'Expected: 12000', sumSav60k === 12000 ? 'PASS' : 'FAIL');

console.log('\n--- Test 4: ₹25,000 salary (Needs 50% = 12,500) ---');
const needs25k = distributeGroupBudget(12500, ['Rent', 'Groceries', 'Transportation', 'Utilities', 'Healthcare'], 'Needs');
console.log(needs25k);
const sumNeeds25k = Object.values(needs25k).reduce((a, b) => a + b, 0);
console.log('Sum:', sumNeeds25k, 'Expected: 12500', sumNeeds25k === 12500 ? 'PASS' : 'FAIL');

console.log('\n--- Test 5: Needs with Healthcare disabled (Target = 30,000) ---');
const needsNoHealth = distributeGroupBudget(30000, ['Rent', 'Groceries', 'Transportation', 'Utilities'], 'Needs');
console.log(needsNoHealth);
const sumNeedsNoHealth = Object.values(needsNoHealth).reduce((a, b) => a + b, 0);
console.log('Sum:', sumNeedsNoHealth, 'Expected: 30000', sumNeedsNoHealth === 30000 ? 'PASS' : 'FAIL');

console.log('\n--- Test 6: Custom category in Wants (Dining) ---');
const wantsCustom = distributeGroupBudget(15000, ['Entertainment', 'Shopping', 'Dining'], 'Wants');
console.log(wantsCustom);
const sumWantsCustom = Object.values(wantsCustom).reduce((a, b) => a + b, 0);
console.log('Sum:', sumWantsCustom, 'Expected: 15000', sumWantsCustom === 15000 ? 'PASS' : 'FAIL');

console.log('\n--- Test 7: Target 0 or empty categories ---');
const zeroRes = distributeGroupBudget(0, ['Rent', 'Groceries'], 'Needs');
console.log('Zero target:', zeroRes);
const emptyRes = distributeGroupBudget(10000, [], 'Needs');
console.log('Empty cats:', emptyRes);
