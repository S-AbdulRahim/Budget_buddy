# 📊 Budget Buddy (Family Budget Tracker)

**Budget Buddy** is a cross-platform mobile application built with **React Native** and **Expo**. It digitizes a personal finance Excel spreadsheet into a dynamic, highly interactive mobile application for tracking budgets, logging expenses, managing debt payoff, planning investments, and viewing annual projections.

---

## 🚀 Key Features

- **📊 Dynamic Dashboard**
  - Live budget vs. actual spent progress indicators with visual color-coded thresholds (Green = Safe, Amber = Warning, Red = Exceeded).
  - Quick-metric cards: Monthly Salary, Total Budget, Total Spent, Remaining Balance, and Savings Rate.
- **💸 Expense Log**
  - Add and track transactions with fields for Description, Category, Amount, Payment Mode (UPI/Bank Transfer), and Type (Need vs. Want).
  - Fully interactive log with delete actions and search/filter capability.
- **📉 Debt Payoff Tracker**
  - Tracks a ₹2,00,000 loan being cleared over a 12-month period (Jun '26 – May '27).
  - High-fidelity visual month-by-month debt reduction chart and payment schedule list.
- **🌱 Halal Investment Plan**
  - Post-debt SIP planning across 4 primary funds (Tata Ethical, Nippon ETF, Taurus, Umrah Reserve).
  - Automatic locking system: Displays post-debt SIP recommendations and locks them until the active debt payoff schedule is complete.
- **📅 Annual Overview**
  - Monthly and annual projection tables mapping out planned categories month-by-month over the next year.

---

## 🛠️ Technology Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 56) with [React Native](https://reactnative.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (v3 File-based routing)
- **Styling**: Native stylesheet engine with a premium dark-themed color system
- **Animations**: [React Native Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/) for transitions and progress bars
- **Storage**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for local, persistent storage of expenses and settings
- **Language**: TypeScript (fully typed interfaces for budget models, expense logs, and state)

---

## 📂 Project Structure

```text
Budget_buddy/
├── app/                  # Expo Router navigation configuration
│   ├── _layout.tsx       # Root entry layout & global Status Bar config
│   ├── index.tsx         # Initial index route redirecting to tabs
│   └── (tabs)/           # Tab navigator routes
│       ├── _layout.tsx   # Custom Tab Bar navigation UI
│       ├── index.tsx     # Dashboard Screen
│       ├── expenses.tsx  # Expenses Log Screen
│       ├── debt.tsx      # Debt Tracker Screen
│       ├── invest.tsx    # Halal Investment Screen
│       └── annual.tsx    # Annual Overview Screen
├── src/                  # Application source code
│   ├── components/       # Shared UI components
│   │   ├── AddExpenseModal.tsx  # Modal form to log new expenses
│   │   ├── ChartBar.tsx         # Customized bar component for debt payoff visualizer
│   │   ├── ExpenseItem.tsx      # Individual list item for logs
│   │   ├── ProgressBar.tsx      # Custom animated progress bar
│   │   └── StatCard.tsx         # Dashboard KPI metric cards
│   ├── data/             # Initial mock data and async storage management
│   │   ├── budgetData.ts # Raw budget categories, initial logs, and projections
│   │   └── storage.ts    # Helper methods for loading and saving to AsyncStorage
│   ├── theme/            # Global UI Theme (Colors, Spacing, Typography)
│   │   └── index.ts      # Colors, spacing values, and text styles
│   └── types/            # App-wide TypeScript definitions
│       └── index.ts      # Category, Expense, DebtPayment, and SIP interfaces
├── app.json              # Expo application configuration
├── package.json          # Node package manager scripts and dependencies
└── tsconfig.json         # TypeScript configuration
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or newer recommended)
- **npm** (comes with Node) or **yarn**
- **Expo Go** app installed on your physical mobile device (available on Google Play Store and iOS App Store)

### Installation Steps

1. **Clone or Open the Project Directory**:
   ```bash
   cd Budget_buddy
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

---

## 🏃 Run & Development Build Steps

You can run the project locally on your physical device, web browser, or simulator.

### Start the Development Server

To start the Expo development server:
```bash
npm run start
```
*Or, alternatively:*
```bash
npx expo start
```

Once the dev server starts, a QR code will be displayed in the terminal.

#### 1. Running on a Physical Device (iOS/Android)
1. Install the **Expo Go** app on your phone.
2. Open the Expo Go app.
   - **Android**: Scan the QR code displayed in your terminal using the app's scanner.
   - **iOS**: Scan the QR code using your system camera app and click the link to open in Expo Go.
3. Ensure both your computer and your phone are connected to the **same Wi-Fi network**.

#### 2. Running on Emulators/Simulators
- **Android Emulator**: Press `a` in the terminal after starting the dev server, or run:
  ```bash
  npm run android
  ```
- **iOS Simulator**: Press `i` in the terminal after starting the dev server, or run:
  ```bash
  npm run ios
  ```

#### 3. Running on Web Browser
- Press `w` in the terminal after starting the dev server, or run:
  ```bash
  npm run web
  ```

### Clear Cache

If you face any issues with bundle caching or hot-reload behavior, clear the Expo cache using:
```bash
npx expo start -c
```

---

## 📦 Building Standalone Binaries (EAS Build)

To package the application into standalone binaries (`.apk` or `.aab` for Android, and `.ipa` for iOS) for distribution:

1. **Install EAS CLI globally**:
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to your Expo Account**:
   ```bash
   eas login
   ```

3. **Configure Build Pipeline**:
   ```bash
   eas build:configure
   ```

4. **Run Build Command**:
   - For **Android**:
     ```bash
     eas build --platform android
     ```
   - For **iOS**:
     ```bash
     eas build --platform ios
     ```
   - For **Both**:
     ```bash
     eas build --platform all
     ```

---

## 🔒 License

This project is licensed under the MIT License - see the [LICENSE](file:///c:/Users/AbdulRahimSayyed/Office/personal_project/Budget_buddy/LICENSE) file for details.
