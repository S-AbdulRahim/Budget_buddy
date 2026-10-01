import { Platform } from 'react-native';
import * as SmsReader from 'expo-sms-reader';
import { parseTransactionSms } from './smsParser';
import { loadData, addCardTransactions } from './storage';
import { CreditCard, CardTransaction } from '../types';

export async function checkSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const res = await SmsReader.checkPermissionsAsync();
    return !!(res.readSms && res.receiveSms);
  } catch (e) {
    console.warn('Error checking SMS permissions:', e);
    return false;
  }
}

export async function requestSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const res = await SmsReader.requestPermissionsAsync();
    return !!(res.readSms && res.receiveSms);
  } catch (e) {
    console.warn('Error requesting SMS permissions:', e);
    return false;
  }
}

/**
 * Scans the Android SMS inbox for the last 90 days, parses bank alerts matching registered cards,
 * and saves new transactions with status 'pending'.
 */
export async function syncHistoricalSms(explicitCards?: CreditCard[]): Promise<number> {
  if (Platform.OS !== 'android') return 0;

  const hasPerm = await checkSmsPermissions();
  if (!hasPerm) return 0;

  const data = await loadData();
  const cards = explicitCards || data.creditCards || [];
  const activeCards = cards.filter(c => c.smsTrackingEnabled !== false);
  if (activeCards.length === 0) return 0;

  try {
    // 90 days lookback window
    const sinceTimestamp = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const messages = await SmsReader.readInbox({ sinceTimestamp });

    const newTransactions: Omit<CardTransaction, 'id'>[] = [];

    for (const msg of messages) {
      const parsed = parseTransactionSms(msg.sender, msg.body, activeCards, msg.timestamp);
      if (parsed && parsed.cardId) {
        newTransactions.push({
          cardId: parsed.cardId,
          amount: parsed.amount,
          merchant: parsed.merchant,
          date: parsed.date,
          status: 'pending',
          source: 'sms',
          rawSmsSnippet: parsed.rawSmsSnippet,
        });
      }
    }

    if (newTransactions.length > 0) {
      const updated = await addCardTransactions(newTransactions);
      const pendingCount = (updated.cardTransactions || []).filter(t => t.status === 'pending').length;
      return newTransactions.length;
    }

    return 0;
  } catch (error) {
    console.error('Error syncing historical SMS:', error);
    return 0;
  }
}

/**
 * Attaches a real-time listener for incoming bank transaction SMS messages.
 */
export function setupLiveSmsListener(
  onNewTransaction?: (tx: Omit<CardTransaction, 'id'>) => void
): () => void {
  if (Platform.OS !== 'android') {
    return () => {};
  }

  const subscription = SmsReader.addSmsReceivedListener(async message => {
    try {
      const data = await loadData();
      const activeCards = (data.creditCards || []).filter(c => c.smsTrackingEnabled !== false);
      if (activeCards.length === 0) return;

      const parsed = parseTransactionSms(message.sender, message.body, activeCards, message.timestamp);
      if (parsed && parsed.cardId) {
        const newTx: Omit<CardTransaction, 'id'> = {
          cardId: parsed.cardId,
          amount: parsed.amount,
          merchant: parsed.merchant,
          date: parsed.date,
          status: 'pending',
          source: 'sms',
          rawSmsSnippet: parsed.rawSmsSnippet,
        };

        await addCardTransactions([newTx]);
        if (onNewTransaction) {
          onNewTransaction(newTx);
        }
      }
    } catch (e) {
      console.error('Error handling live SMS:', e);
    }
  });

  return () => {
    subscription.remove();
  };
}
