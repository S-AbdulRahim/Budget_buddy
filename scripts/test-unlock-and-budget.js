// Test investment unlock and budgeting rules logic
const assert = require('assert');

// 1. Debt cleared test
console.log('--- Test 1: Investment Unlock with Multi-Month Debt Schedule ---');

// Mock data with a declining schedule
const multiMonthSchedule = [
  { month: "Jun '26", emi: 10000, remainingBalance: 40000, isPaid: false },
  { month: "Jul '26", emi: 10000, remainingBalance: 30000, isPaid: false },
  { month: "Aug '26", emi: 10000, remainingBalance: 20000, isPaid: false },
  { month: "Sep '26", emi: 10000, remainingBalance: 10000, isPaid: false },
  { month: "Oct '26", emi: 10000, remainingBalance: 0, isPaid: false },
];

function checkDebtClearedBuggy(data) {
  return data.debtPayments.every(p => p.remainingBalance === 0 && p.isPaid);
}

function checkDebtClearedFixed(data) {
  return data.debtTotal === 0 || data.debtPayments.length === 0 || data.debtPayments.every(p => p.isPaid);
}

// Mark every month as paid
const allPaidSchedule = multiMonthSchedule.map(p => ({ ...p, isPaid: true }));
const testDataAllPaid = { debtTotal: 50000, debtPayments: allPaidSchedule };

console.log('Old buggy formula result with all months marked paid:', checkDebtClearedBuggy(testDataAllPaid));
assert.strictEqual(checkDebtClearedBuggy(testDataAllPaid), false, 'Buggy check erroneously returns false because remainingBalance is not 0 on earlier months');

console.log('Fixed formula result with all months marked paid:', checkDebtClearedFixed(testDataAllPaid));
assert.strictEqual(checkDebtClearedFixed(testDataAllPaid), true, 'Fixed check correctly returns true');

// 2. Lock policy test
console.log('\n--- Test 2: Lock Policy for 0% vs >0% Interest ---');

function checkInvestmentLocked(data) {
  const interestRate = data.debtInterestRate ?? 0;
  const debtCleared = data.debtTotal === 0 || data.debtPayments.length === 0 || data.debtPayments.every(p => p.isPaid);
  const hasInterestDebt = data.debtTotal > 0 && interestRate > 0;
  return hasInterestDebt && !debtCleared && !data.overrideDebtLock;
}

// Case A: 0% interest loan with unpaid months
const zeroInterestLoan = {
  debtTotal: 50000,
  debtInterestRate: 0,
  debtPayments: multiMonthSchedule,
  overrideDebtLock: false,
};
console.log('0% interest loan (unpaid months) locked?:', checkInvestmentLocked(zeroInterestLoan));
assert.strictEqual(checkInvestmentLocked(zeroInterestLoan), false, '0% interest loans must NEVER be locked');

// Case B: 12% interest loan with unpaid months
const highInterestLoan = {
  debtTotal: 50000,
  debtInterestRate: 12,
  debtPayments: multiMonthSchedule,
  overrideDebtLock: false,
};
console.log('12% interest loan (unpaid months) locked?:', checkInvestmentLocked(highInterestLoan));
assert.strictEqual(checkInvestmentLocked(highInterestLoan), true, 'High interest loan must be locked');

// Case C: 12% interest loan with user override
const overriddenHighInterestLoan = {
  ...highInterestLoan,
  overrideDebtLock: true,
};
console.log('12% interest loan with user override locked?:', checkInvestmentLocked(overriddenHighInterestLoan));
assert.strictEqual(checkInvestmentLocked(overriddenHighInterestLoan), false, 'Overridden loan must unlock');

// Case D: 12% interest loan fully paid
const clearedHighInterestLoan = {
  ...highInterestLoan,
  debtPayments: allPaidSchedule,
};
console.log('12% interest loan fully paid locked?:', checkInvestmentLocked(clearedHighInterestLoan));
assert.strictEqual(checkInvestmentLocked(clearedHighInterestLoan), false, 'Fully paid loan must unlock');

// Case E: Zero debt
const noDebt = {
  debtTotal: 0,
  debtInterestRate: 0,
  debtPayments: [],
  overrideDebtLock: false,
};
console.log('No debt locked?:', checkInvestmentLocked(noDebt));
assert.strictEqual(checkInvestmentLocked(noDebt), false, 'No debt must not be locked');

// 3. Budgeting rules target check
console.log('\n--- Test 3: Budgeting Rules Split Calculations ---');
const BUDGETING_RULES = [
  { id: 'none', targets: null },
  { id: '50-30-20', targets: { Needs: 50, Wants: 30, Savings: 20 } },
  { id: '70-20-10', targets: { Needs: 70, Wants: 20, Savings: 10 } },
  { id: '80-20', targets: { Needs: 60, Wants: 20, Savings: 20 } },
  { id: 'custom', targets: { Needs: 40, Wants: 40, Savings: 20 } },
];

for (const rule of BUDGETING_RULES) {
  if (rule.targets) {
    const sum = rule.targets.Needs + rule.targets.Wants + rule.targets.Savings;
    console.log(`Rule ${rule.id} targets sum: ${sum}%`);
    assert.strictEqual(sum, 100, `Rule ${rule.id} targets must sum to 100%`);
  } else {
    console.log(`Rule ${rule.id} targets: null (freeform)`);
    assert.strictEqual(rule.targets, null);
  }
}

console.log('\nALL UNIT LOGIC TESTS PASSED SUCCESSFULLY!');
