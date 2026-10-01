import { EventEmitter, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface Subscription {
  remove: () => void;
}

export interface SmsMessage {
  sender: string;
  body: string;
  timestamp: number;
}

export interface ReadInboxOptions {
  sinceTimestamp?: number;
  senderPattern?: string;
}

export interface SmsPermissionsResult {
  readSms: boolean;
  receiveSms: boolean;
}

// Safely obtain native module reference on Android
let NativeModule: any = null;
try {
  if (Platform.OS === 'android') {
    NativeModule = requireNativeModule('ExpoSmsReader');
  }
} catch {
  NativeModule = null;
}

const emitter: any = NativeModule ? new EventEmitter(NativeModule) : null;

let watcherCount = 0;

/**
 * Checks current status of READ_SMS and RECEIVE_SMS permissions on Android.
 * Always resolves cleanly to `{ readSms: false, receiveSms: false }` on non-Android platforms.
 */
export async function checkPermissionsAsync(): Promise<SmsPermissionsResult> {
  if (Platform.OS !== 'android' || !NativeModule) {
    return { readSms: false, receiveSms: false };
  }
  try {
    return await NativeModule.checkPermissionsAsync();
  } catch (error) {
    console.warn('[expo-sms-reader] checkPermissionsAsync failed:', error);
    return { readSms: false, receiveSms: false };
  }
}

/**
 * Prompts user for READ_SMS and RECEIVE_SMS permissions on Android.
 * Always resolves cleanly to `{ readSms: false, receiveSms: false }` on non-Android platforms.
 */
export async function requestPermissionsAsync(): Promise<SmsPermissionsResult> {
  if (Platform.OS !== 'android' || !NativeModule) {
    return { readSms: false, receiveSms: false };
  }
  try {
    return await NativeModule.requestPermissionsAsync();
  } catch (error) {
    console.warn('[expo-sms-reader] requestPermissionsAsync failed:', error);
    return { readSms: false, receiveSms: false };
  }
}

/**
 * Queries the device's SMS Inbox (Telephony.Sms.Inbox.CONTENT_URI).
 * Supports SQL-level timestamp filtering and regex pattern filtering.
 * Always returns an empty array on non-Android platforms.
 */
export async function readInbox(options: ReadInboxOptions = {}): Promise<SmsMessage[]> {
  if (Platform.OS !== 'android' || !NativeModule) {
    return [];
  }
  try {
    return await NativeModule.readInbox(options);
  } catch (error) {
    console.warn('[expo-sms-reader] readInbox failed:', error);
    return [];
  }
}

/**
 * Subscribes to live incoming SMS messages.
 * Automatically starts the broadcast receiver on the first listener and stops it when all listeners detach.
 * Always returns a no-op subscription on non-Android platforms.
 */
export function addSmsReceivedListener(listener: (sms: SmsMessage) => void): Subscription {
  if (Platform.OS !== 'android' || !NativeModule || !emitter) {
    return { remove: () => {} };
  }

  if (watcherCount === 0) {
    try {
      NativeModule.startWatchingSms();
    } catch (e) {
      console.warn('[expo-sms-reader] startWatchingSms failed:', e);
    }
  }
  watcherCount++;

  const sub = emitter.addListener('onSmsReceived', listener);

  return {
    remove: () => {
      sub.remove();
      watcherCount = Math.max(0, watcherCount - 1);
      if (watcherCount === 0) {
        try {
          NativeModule.stopWatchingSms();
        } catch (e) {
          console.warn('[expo-sms-reader] stopWatchingSms failed:', e);
        }
      }
    },
  };
}

export default {
  checkPermissionsAsync,
  requestPermissionsAsync,
  readInbox,
  addSmsReceivedListener,
};
