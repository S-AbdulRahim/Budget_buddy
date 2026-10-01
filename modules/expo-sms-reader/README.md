# expo-sms-reader

Custom in-repo Expo module built with Kotlin and `expo-modules-core` for Android SMS reading and real-time transaction detection.

## Features
- **Modern Architecture**: Built on Expo Modules API (Kotlin + TurboModule compatibility), zero legacy bridge dependencies.
- **Historical Inbox Query**: Queries Android's `Telephony.Sms.Inbox.CONTENT_URI` with SQL-level `sinceTimestamp` filtering and regex-based sender filtering.
- **Multi-Part SMS Concatenation**: Reliably joins all incoming PDU message fragments into a complete message body before emitting (fixes the truncation bug found in third-party libraries).
- **Structured JSON Bridges**: Returns real structured objects `{ sender, body, timestamp }` rather than stringified arrays.
- **Cross-Platform Safety**: Fully safe no-ops and typed empty returns on Web and iOS.
- **Auto-Manifest Injection**: Declares `READ_SMS` and `RECEIVE_SMS` permissions through the module manifest without manual `AndroidManifest.xml` edits.

## API

### Types
```typescript
interface SmsMessage {
  sender: string;
  body: string;
  timestamp: number;
}

interface ReadInboxOptions {
  sinceTimestamp?: number; // Milliseconds timestamp
  senderPattern?: string;  // Regex pattern matching bank senders
}

interface SmsPermissionsResult {
  readSms: boolean;
  receiveSms: boolean;
}
```

### Methods
- `checkPermissionsAsync(): Promise<SmsPermissionsResult>`
  Checks if `READ_SMS` and `RECEIVE_SMS` runtime permissions are currently granted.
- `requestPermissionsAsync(): Promise<SmsPermissionsResult>`
  Prompts the Android OS runtime permission dialog.
- `readInbox(options?: ReadInboxOptions): Promise<SmsMessage[]>`
  Queries historical inbox messages matching filters.
- `addSmsReceivedListener(listener: (sms: SmsMessage) => void): Subscription`
  Listens for live incoming SMS broadcasts. Call `.remove()` on the returned subscription to unsubscribe.
