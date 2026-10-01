// Test script for smsParser
const {
  isBankSender,
  extractAmount,
  extractLast4,
  extractMerchant,
  extractDate,
  parseTransactionSms,
} = require('../src/data/smsParser');

const mockCards = [
  { id: 'c1', nickname: 'HDFC Millennia', last4: '4321', bank: 'HDFC', color: '#0F9B8E', smsTrackingEnabled: true },
  { id: 'c2', nickname: 'SBI Cashback', last4: '9876', bank: 'SBI', color: '#1D4ED8', smsTrackingEnabled: true },
  { id: 'c3', nickname: 'ICICI Amazon Pay', last4: '5544', bank: 'ICICI', color: '#D97757', smsTrackingEnabled: false }, // tracking disabled!
];

console.log('--- Running SMS Parser Unit Tests ---');

// Test 1: Sender allowlist
console.log('\n[Test 1] Sender Allowlist:');
const senders = [
  { sender: 'AD-HDFCBK', expected: true },
  { sender: 'VK-SBINB', expected: true },
  { sender: 'JM-ICICIB', expected: true },
  { sender: 'AX-AXISBK', expected: true },
  { sender: 'BP-KOTAKB', expected: true },
  { sender: '+919876543210', expected: false },
  { sender: 'SWIGGY', expected: false },
  { sender: 'VM-SPAM01', expected: false },
];
let passed = true;
senders.forEach(({ sender, expected }) => {
  const result = isBankSender(sender);
  const ok = result === expected;
  if (!ok) passed = false;
  console.log(`  ${sender}: ${result} (expected: ${expected}) ${ok ? '✓' : '✗'}`);
});

// Test 2: HDFC Bank SMS
console.log('\n[Test 2] HDFC Bank Transaction:');
const hdfcSms = 'Alert: Rs. 1,450.00 spent on your HDFC Bank Card ending 4321 at SWIGGY BANGALORE on 15-02-2025. Avl lmt: INR 1,50,000.';
const hdfcParsed = parseTransactionSms('AD-HDFCBK', hdfcSms, mockCards);
console.log('  Result:', hdfcParsed);
if (
  hdfcParsed &&
  hdfcParsed.amount === 1450 &&
  hdfcParsed.last4 === '4321' &&
  hdfcParsed.cardId === 'c1' &&
  hdfcParsed.merchant?.includes('SWIGGY') &&
  hdfcParsed.date === '2025-02-15'
) {
  console.log('  HDFC parsing passed! ✓');
} else {
  console.log('  HDFC parsing failed! ✗');
  passed = false;
}

// Test 3: SBI Card SMS
console.log('\n[Test 3] SBI Card Transaction:');
const sbiSms = 'INR 2,890.00 debited from Credit Card ending 9876 at AMAZON INDIA on 10-02-2025. Avl Bal: INR 45,000.';
const sbiParsed = parseTransactionSms('VK-SBINB', sbiSms, mockCards);
console.log('  Result:', sbiParsed);
if (
  sbiParsed &&
  sbiParsed.amount === 2890 &&
  sbiParsed.last4 === '9876' &&
  sbiParsed.cardId === 'c2' &&
  sbiParsed.merchant?.includes('AMAZON') &&
  sbiParsed.date === '2025-02-10'
) {
  console.log('  SBI parsing passed! ✓');
} else {
  console.log('  SBI parsing failed! ✗');
  passed = false;
}

// Test 4: Card with smsTrackingEnabled = false
console.log('\n[Test 4] Disabled Tracking Card (ICICI):');
const iciciSms = 'Dear Customer, your ICICI Bank Credit Card XX5544 was used for a txn of INR 350.00 at STARBUCKS on 12-FEB-25.';
const iciciParsed = parseTransactionSms('JM-ICICIB', iciciSms, mockCards);
console.log('  Result:', iciciParsed);
if (iciciParsed === null) {
  console.log('  Disabled card ignored as expected! ✓');
} else {
  console.log('  Disabled card should have been ignored! ✗');
  passed = false;
}

// Test 5: Unknown card last4
console.log('\n[Test 5] Unknown Card Last4:');
const unknownCardSms = 'Alert: Rs 5,000 spent on Card ending 0000 at DMART on 01-01-2025.';
const unknownParsed = parseTransactionSms('AD-HDFCBK', unknownCardSms, mockCards);
console.log('  Result:', unknownParsed);
if (unknownParsed === null) {
  console.log('  Unknown card ignored as expected! ✓');
} else {
  console.log('  Unknown card should have returned null! ✗');
  passed = false;
}

// Test 6: OTP Message
console.log('\n[Test 6] OTP Message Discard:');
const otpSms = 'Your OTP for transaction of Rs 1,450.00 on HDFC Bank Card ending 4321 is 123456. Do not share your OTP with anyone.';
const otpParsed = parseTransactionSms('AD-HDFCBK', otpSms, mockCards);
console.log('  Result:', otpParsed);
if (otpParsed === null) {
  console.log('  OTP message ignored as expected! ✓');
} else {
  console.log('  OTP message was NOT ignored! ✗');
  passed = false;
}

// Test 7: Non-bank Sender
console.log('\n[Test 7] Non-bank Sender Discard:');
const spamSms = 'Special offer! Rs. 500 spent gives you 100 bonus points on card 4321!';
const spamParsed = parseTransactionSms('+919876543210', spamSms, mockCards);
console.log('  Result:', spamParsed);
if (spamParsed === null) {
  console.log('  Non-bank sender ignored as expected! ✓');
} else {
  console.log('  Non-bank sender was NOT ignored! ✗');
  passed = false;
}

console.log('\n--- Overall Result: ' + (passed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗') + ' ---');
process.exit(passed ? 0 : 1);
