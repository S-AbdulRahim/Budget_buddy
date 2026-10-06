# FinCompass — Project Context & Handoff

Paste this into a new chat (along with RULES.md, already in the repo) so
nothing from prior work gets lost. This describes the project, the decisions
already made and why, and exactly where things stand.

## What this is

A personal finance app for the Indian market, built with Expo/React Native,
targeting the Google Play Store. Originally called "Budget Buddy," renamed to
**FinCompass** partway through because the scope grew well past budgeting
into debt payoff, SIP/investment goal tracking, and automated card-spend
detection. Repo: `S-AbdulRahim/Budget_buddy` on GitHub (repo name itself
hasn't been renamed, only the in-app branding).

## Who it's for (shapes real product decisions, not just copy)

The original developer is in India, carries an **interest-free loan
(~₹3 lakh)**, and invests in **Shariah-compliant mutual funds and stocks**.
This directly drove two real decisions, not just flavor text:
- Investing is **not** locked while debt is being paid off, when that debt
  carries 0% interest — there's no opportunity-cost argument for blocking it
  in that case. The lock only applies when `debtInterestRate > 0`, and even
  then the user can override it.
- Budgeting rules (50/30/20 etc.) are optional, not mandatory — a dedicated
  onboarding step lets the user pick a rule, pick a different one, or pick
  "No rule — I'll set my own limits" with zero numeric targets shown anywhere
  downstream.

## Tech stack

- Expo SDK 56, React Native 0.85, Expo Router (file-based routes under `app/`)
- TypeScript throughout
- **AsyncStorage only** — no backend, no network calls, everything local to
  the device. This is a real privacy/positioning feature, stated in-app
  ("Your data stays on your device. No account needed.") — don't casually
  introduce a server dependency without flagging that this breaks a stated
  promise.
- Ionicons (`@expo/vector-icons`) exclusively — no emoji, no mixed icon sets
- Fonts: Poppins (headings/display) + Inter (body/numbers, tabular-nums for
  currency alignment)
- Dark mode only, by deliberate choice — no light theme exists or is planned
  without a real architecture decision first (see RULES.md)

## Architecture rules already established

**RULES.md, in the repo root, is binding — read it before doing anything.**
It covers iconography, theme tokens, coding standards, and a running log of
real platform-specific bugs already found (see below). Every prompt handed to
a coding agent for this project should open by telling it to follow
RULES.md strictly. The headline rules:
- `src/data/storage.ts` is the ONLY place that touches AsyncStorage. Every
  mutation goes through a named function there.
- Derived totals (category `spent`, etc.) are recomputed from source data,
  never incremented/decremented — drift was a real bug class here.
- `Alert.alert` does not reliably work on the web build — use the custom
  `ConfirmModal` component for anything destructive or critical, not
  `Alert.alert`.
- All color/spacing/typography/radius comes from `src/theme/index.ts` tokens
  — no hardcoded hex or pixel values in components.
- This app ships on **web and native/Android** — every feature must be
  manually verified on both, not assumed to "just work everywhere."

## Known platform gotchas (don't rediscover these)

- `Alert.alert` on `react-native-web` doesn't reliably render or fire
  callbacks — see above.
- `shadow*` style props are deprecated on web (harmless warning for now, not
  yet migrated to `boxShadow`).
- Console errors reading `"A listener indicated an asynchronous response..."`
  are **browser extension noise**, not app bugs — ignore them when debugging.
- `autoFocus` on a `TextInput` doesn't reliably refire across
  conditionally-rendered steps in a multi-step form on web — needs an
  explicit `ref` + `useEffect` keyed to the step index.
- Before any release build, run `npx expo install --check` — several real
  bugs here traced back to Expo/package version drift, not application logic.

## What exists today (high level)

- **Onboarding**: Welcome carousel (3 cards, one visible at a time) → Income
  step → Budgeting Rule step (50/30/20, 70/20/10, 80/20, custom, or none) →
  Categories step (grouped into Needs/Wants/Savings when a rule is chosen;
  flat list with a per-row group pill when "none" is chosen) → Debt step →
  Goals step (monthly-contribution framing, optional target amount + ETA) →
  Completion screen with a computed summary. Category budgets auto-distribute
  proportionally from income based on the chosen rule
  (`CATEGORY_DEFAULT_WEIGHTS` / `distributeGroupBudget` in `budgetData.ts`),
  but never overwrite a value the user has manually edited
  (`touchedCategoryIds` tracking).
- **Plan tab** (merged from what used to be separate Debt and Invest tabs, to
  keep the bottom tab bar from getting overcrowded): a segmented control
  switches between Debt (EMI schedule, mark-month-paid toggle,
  `debtCleared` logic) and Invest (SIP/goal tracking, lock banner tied to
  `debtCleared && hasInterestDebt && !overrideDebtLock`).
- **Accounts tab** (being renamed/expanded from "Cards"): segmented into
  Credit Cards / Debit Cards / Account (bank account). Credit/debit cards
  share one data model (`CreditCard` with a `cardType` field) and one set of
  UI/logic, filtered by segment. Bank accounts are a separate, simpler entity
  (`BankAccount`) with manual transaction entry only — **SMS parsing for bank
  accounts is explicitly deferred, not an oversight**, since bank
  debit/credit alert SMS use different wording than card-spend alerts and the
  existing parser was only built/tested against card formats.
- **Automated card-spend detection (Android only)**: reads SMS from an
  allowlist of known bank sender IDs (SBI, HDFC, ICICI, Axis, Kotak), parses
  amount/merchant/last-4 via per-bank regex (`src/data/smsParser.ts`), and
  queues matches as a **pending review** (never auto-committed). Confirming a
  pending item creates a real `Expense` with a "Credit Card" payment-mode
  badge — it already shows up correctly in the Expenses tab, just wasn't
  discoverable from the Accounts screen itself (a fix for that is in
  progress — see below). Built as a **custom local Expo module**
  (`modules/expo-sms-reader`, Kotlin, `expo-modules-core`) after a feasibility
  spike found the obvious third-party library
  (`@maniac-tech/react-native-expo-read-sms`) was broken — it corrupted
  multi-part SMS and couldn't read historical inbox messages at all. The
  custom module supports both live incoming SMS and a 90-day historical
  import on first consent.
- **Settings**: editable salary, categories (with the same rule-aware
  grouping as onboarding), debt terms, investment goals, budgeting rule
  (reuses the same `BudgetingRulePicker` component as onboarding, not a
  duplicate), and "Reset Application Data" (uses `ConfirmModal`, correctly
  returns to onboarding).
- **Branding**: FinCompass wordmark ("Fin" + "Compass" in two colors,
  `BrandMark.tsx`), wallet+coin logomark. Full icon/favicon/splash/Play Store
  asset set was generated and delivered as a zip, including a real fix: the
  original logo's gold coin accent broke Android's adaptive-icon safe zone
  and would've clipped under circular launcher masks — corrected and verified
  with a simulated mask render before delivery.

## Decisions already made and settled (don't re-litigate these)

- No light theme without a deliberate decision — dark-only is intentional.
- "No rule" in budgeting must never show a number, a target badge, or a
  three-way grouped layout — flat list, no implied framework.
- Investing lock only applies to interest-bearing debt, with a user override.
- Any "motivational insight" copy must be either computed from the user's own
  real numbers, or a single already-verified general fact (CIBIL payment
  history ≈ 35% of score) — **never a fabricated statistic** like "X% of
  people do Y." This rule exists on purpose; don't let a future session
  invent survey-sounding numbers to fill a template.
- Credit card numbers: only ever the last 4 digits + a nickname are stored,
  never a full card number — there's no legitimate reason to ask for one,
  since bank SMS never contain a full number either.
- 6 bottom tabs is the ceiling for this app on mobile — Debt+Invest were
  merged into one "Plan" tab specifically to make room for Accounts without
  exceeding that.

## Play Store readiness — status

Not yet submitted. Checklist items identified so far:
- [ ] Android package name still needs confirming it's not the Expo
      placeholder (`com.anonymous.*`) — this locks permanently on first
      upload, fix before that happens, not after.
- [ ] Privacy policy needs updating to disclose SMS content access
      specifically (purpose, on-device-only processing, no upload) now that
      the card-tracking feature exists.
- [ ] Google Play's **Permissions Declaration Form** needs completing for the
      "SMS-based money management" permitted-use category before any build
      with SMS tracking enabled goes out, even to internal testing.
- [ ] Signing/EAS submit credentials not yet set up.
- [ ] Hasn't yet been tested as an actual signed release build on a real
      device — only dev/Expo Go so far.
- [ ] Store listing assets (hi-res icon, feature graphic) were generated, but
      the feature graphic has the OLD "Budget Buddy" wordmark baked into it
      as flattened pixels — needs regenerating with "FinCompass" before use.

## In-flight right now (not yet confirmed done as of this writing)

A prompt has just been handed off covering all of the following — next
session should check whether it landed before doing anything else:
1. Annual tab's monthly breakdown table: freezing the Category column so it
   doesn't scroll away horizontally with the month columns.
2. Accounts screen: adding the Credit Cards / Debit Cards / Account segmented
   control, fixing a cramped action-button row on narrow screens, and moving
   the "On-Device Financial Privacy" note to the bottom of the screen.
3. A real (indeterminate) progress indicator while SMS is being read, for
   both the manual sync button and the automatic post-consent sync.
4. A "Recent Transactions" section on the Accounts screen so confirmed card
   spends are visibly discoverable there, not just in the Expenses tab.

## How this project has been worked on (useful to know)

- The repo is cloned locally for inspection (`git pull` before investigating
  anything) — actual code gets read before any fix is proposed, not guessed
  at from descriptions or screenshots alone.
- The actual coding is done by a separate coding agent (referenced paths
  suggest Google Antigravity/Gemini) — work here has mostly taken the form of
  large, explicit, structured prompts (in fenced code blocks) handed off for
  that agent to execute, followed by reviewing the resulting diff/screenshots
  afterward. If continuing this pattern, prompts should keep opening with
  "follow RULES.md strictly" and end with a concrete acceptance checklist.
- Several real bugs were only caught by actually reading the code rather than
  trusting a "this is fixed" claim — notably a debt/investment-unlock logic
  bug that survived two rounds of claimed fixes before being properly
  resolved with an actual regression test
  (`scripts/test-unlock-and-budget.js`). Worth re-verifying claimed fixes
  against the real diff, not just taking a status update at face value.
