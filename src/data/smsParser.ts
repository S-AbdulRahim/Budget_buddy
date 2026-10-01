import { CreditCard } from '../types';

// Single source of truth for Indian bank DLT transactional SMS sender headers
export const BANK_PATTERNS = [
  'HDFCBK', 'HDFCCC', 'HDFC',
  'SBINB', 'SBIINB', 'SBICRD', 'SBISMS', 'ATMSBI',
  'ICICIB', 'ICICIC', 'ICICI',
  'AXISBK', 'AXISCC', 'AXIS',
  'KOTAKB', 'KOTAKC', 'KOTAK',
  'INDUSB', 'INDBNK',
  'PNBSMS', 'PNBBNK',
  'BOBTXN', 'BARBOD',
  'SCBANK', 'SCISMS',
  'RBLBNK', 'RBLCRD',
  'CITIBK',
  'FEDBNK',
  'IDFCFB', 'IDFCBK',
  'AMEXIN',
  'ONECRD', 'FPLABS',
];

export interface ParsedSmsTransaction {
  amount: number;
  last4?: string;
  cardId?: string;
  merchant?: string;
  date: string; // YYYY-MM-DD
  rawSmsSnippet: string;
}

const DISQUALIFYING_KEYWORDS = [
  'otp',
  'one time password',
  'verification code',
  'secret code',
  'security code',
  'login alert',
  'statement generated',
  'bill generated',
  'credit limit',
  'credited to your account',
  'salary credited',
];

const SPEND_KEYWORDS = [
  'spent',
  'debited',
  'charged',
  'txn of',
  'transaction of',
  'purchase of',
  'used for',
  'swiped',
  'paid rs',
  'paid inr',
  'payment of rs',
  'payment of inr',
];

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Validates whether the SMS sender matches Indian bank transactional DLT formats
 */
export function isBankSender(sender: string): boolean {
  if (!sender) return false;
  const cleanSender = sender.trim().toUpperCase();

  // DLT formats are typically 2 alpha provider/circle codes followed by a hyphen and 6-char header
  // e.g., AD-HDFCBK, VK-SBINB, JM-ICICIB, AX-AXISBK, BP-KOTAKB
  const match = cleanSender.match(/^(?:[A-Z0-9]{2}-)?([A-Z0-9]+)$/);
  const header = match ? match[1] : cleanSender;

  return BANK_PATTERNS.some(bank => header.includes(bank));
}

/**
 * Extracts transaction amount from SMS body
 */
export function extractAmount(body: string): number | null {
  // Matches "Rs. 1,234.50", "Rs 1500", "INR 450.00", "₹2,500.50", "amount of Rs 99"
  const amountRegex = /(?:(?:rs\.?|inr|₹)\s*|amount(?:\s+of)?\s*(?:rs\.?|inr|₹)?\s*)([\d,]+(?:\.\d{1,2})?)/i;
  const match = body.match(amountRegex);
  if (!match) return null;

  const raw = match[1].replace(/,/g, '');
  const val = parseFloat(raw);
  return isNaN(val) || val <= 0 ? null : val;
}

/**
 * Extracts card last 4 digits from SMS body
 */
export function extractLast4(body: string): string | null {
  // Matches "card ending 1234", "Card no. ending XX1234", "Card XX1234", "...1234", "ending with 1234"
  const regex1 = /(?:card|ac|a\/c|no\.?)\s*(?:ending\s*(?:with|in)?\s*)?(?:[xX*.\s-]+)?(\d{4})\b/i;
  const match1 = body.match(regex1);
  if (match1 && match1[1]) {
    return match1[1];
  }

  const regex2 = /\b(?:ending\s*(?:with|in)?\s*)(\d{4})\b/i;
  const match2 = body.match(regex2);
  if (match2 && match2[1]) {
    return match2[1];
  }

  const regex3 = /(?:[xX]{2,}|[*]{2,}|\.{2,})(\d{4})\b/;
  const match3 = body.match(regex3);
  if (match3 && match3[1]) {
    return match3[1];
  }

  return null;
}

/**
 * Extracts merchant name from SMS body
 */
export function extractMerchant(body: string): string | undefined {
  // Matches "at AMAZON INDIA on", "to SWIGGY BANGALORE", "towards NETFLIX", "info: DMART"
  const merchantRegex = /(?:at|to|in info:?|towards)\s+([A-Za-z0-9&.\-_ ]+?)(?:\s+(?:on|using|via|avl|bal|avail|ref|limit|thru|\.|\n)|$)/i;
  const match = body.match(merchantRegex);
  if (!match || !match[1]) return undefined;

  let merchant = match[1].trim();
  // Filter out false positives like "your card" or "account"
  const lower = merchant.toLowerCase();
  if (
    lower.includes('card') ||
    lower.includes('account') ||
    lower.includes('credit') ||
    lower.includes('debit') ||
    lower.length < 2
  ) {
    return undefined;
  }

  // Capitalize nicely and truncate if too long
  if (merchant.length > 30) {
    merchant = merchant.substring(0, 30).trim();
  }
  return merchant;
}

/**
 * Extracts date from SMS body or falls back to message timestamp
 */
export function extractDate(body: string, timestamp?: number): string {
  // Format: 15-02-2025, 15/02/25, 15-FEB-25, 2025-02-15
  const dateRegex = /\b(\d{1,2})[-/]([A-Za-z]{3}|\d{1,2})[-/](\d{2,4})\b/;
  const match = body.match(dateRegex);

  if (match) {
    const day = match[1].padStart(2, '0');
    let month = match[2].toLowerCase();
    if (MONTH_MAP[month]) {
      month = MONTH_MAP[month];
    } else {
      month = month.padStart(2, '0');
    }
    let year = match[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    // Simple sanity check
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  if (timestamp && !isNaN(timestamp)) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parses an incoming SMS message. Returns structured transaction if valid and relevant, or null otherwise.
 */
export function parseTransactionSms(
  sender: string,
  body: string,
  knownCards: CreditCard[] = [],
  timestamp?: number
): ParsedSmsTransaction | null {
  if (!body) return null;

  // 1. Check sender allowlist (if sender provided)
  if (sender && !isBankSender(sender)) {
    return null;
  }

  const lowerBody = body.toLowerCase();

  // 2. Reject OTPs, statements, and security alerts
  if (DISQUALIFYING_KEYWORDS.some(kw => lowerBody.includes(kw))) {
    return null;
  }

  // 3. Must have a spend / debit indicator
  const hasSpendIndicator = SPEND_KEYWORDS.some(kw => lowerBody.includes(kw));
  if (!hasSpendIndicator) {
    return null;
  }

  // 4. Extract amount
  const amount = extractAmount(body);
  if (!amount) {
    return null;
  }

  // 5. Extract card last 4 digits
  const last4 = extractLast4(body);

  // 6. Match against knownCards
  let matchedCard: CreditCard | undefined;
  if (knownCards && knownCards.length > 0) {
    if (last4) {
      matchedCard = knownCards.find(c => c.last4 === last4);
    } else if (knownCards.length === 1) {
      // If user has only configured 1 card and SMS mentions card spend without last4
      matchedCard = knownCards[0];
    }

    // If card matching is configured but this SMS doesn't match any card,
    // or the matched card has SMS tracking disabled, ignore it
    if (!matchedCard || matchedCard.smsTrackingEnabled === false) {
      return null;
    }
  }

  // 7. Extract merchant & date
  const merchant = extractMerchant(body);
  const date = extractDate(body, timestamp);

  // 8. Ephemeral snippet: first 120 chars
  const rawSmsSnippet = body.length > 120 ? body.substring(0, 117) + '...' : body;

  return {
    amount,
    last4: last4 || matchedCard?.last4,
    cardId: matchedCard?.id,
    merchant,
    date,
    rawSmsSnippet,
  };
}
