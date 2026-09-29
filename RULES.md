# Budget Buddy — Project Rules

These are binding conventions for this codebase, not suggestions. If a change
would violate one of these, either fix it to comply or explicitly flag why
an exception is needed — don't silently drift from them.

---

## 1. Iconography

**No emoji in the UI, ever.** Not in section headers, not in buttons, not in
placeholder copy. Emoji render inconsistently across OS/browser font stacks,
can't be recolored to match theme state, and don't scale cleanly with
`Typography` tokens. Every icon in this app comes from `@expo/vector-icons`.

- **Icon set:** `Ionicons`, exclusively. Don't mix in `MaterialIcons`,
  `FontAwesome`, etc. — one icon family keeps the visual language consistent.
  Import as `import { Ionicons } from '@expo/vector-icons';`.
- **Prefer the `-outline` variant** for static/inactive UI (section headers,
  inactive tab icons, list rows) and the filled variant only for emphasis or
  active/selected state (e.g. the active tab icon). Don't mix filled and
  outline icons within the same visual group unless that's deliberately
  signaling state.
- **Size** must come from a fixed, small set of values tied to context —
  don't pick arbitrary pixel sizes per-screen:
  - Section header icon: `20`
  - List row / stat card icon: `24`
  - Empty-state / large centered icon: `48`
  - Tab bar icon: `24` (matches existing `_layout.tsx` usage)
- **Color** always comes from `Colors` in `src/theme/index.ts` — never a raw
  hex value passed directly to an icon. Default to `Colors.textPrimary` or
  `Colors.primary`; use `Colors.danger` only for destructive/warning
  contexts, never decoratively.
- **Icon + label pairing:** icon precedes the text, separated by
  `Spacing.sm` (8px), both vertically centered in a `flexDirection: 'row'`
  container. Don't bake the icon into the string (no `"⚠️ System
  Operations"` as one `Text` node) — render icon and text as siblings so
  each can be styled and colored independently.

### Reference mapping (extend this table, don't fork it)

| Context                  | Icon name                 |
|---------------------------|----------------------------|
| Monthly income            | `cash-outline`             |
| Budgets & categories      | `pie-chart-outline`        |
| Debt / payoff             | `trending-down-outline`    |
| Halal / SIP / investing   | `leaf-outline`             |
| Settings / system ops     | `settings-outline`         |
| Destructive action        | `warning-outline`          |
| Success / cleared         | `checkmark-circle`         |
| Add / create              | `add-circle-outline`       |
| Delete                    | `trash-outline`            |
| Welcome / wallet overview | `wallet-outline`           |
| Growth & milestones       | `rocket-outline`           |
| Local data trust & privacy| `shield-checkmark-outline` |
| Helpful tips & hints      | `bulb-outline`             |
| Savings goals & targets   | `flag-outline`             |
| Budgeting framework / rule| `compass-outline`          |
| Quick override / flash    | `flash-outline`            |

If a new section needs an icon not listed here, add it to this table in the
same commit — this table is the single source of truth for icon choices,
not individual screens improvising.

---

## 2. Theme

All visual styling is sourced from `src/theme/index.ts`. **No hardcoded hex
colors, pixel margins, font sizes, or border radii in component files.**
If you catch yourself typing `#` followed by a hex code, or a bare number
for `padding`/`margin`/`borderRadius`/`fontSize` in a `StyleSheet`, stop and
pull the equivalent token instead. If no suitable token exists yet, add one
to the theme file rather than inlining a one-off value.

- **Colors** — use the semantic name, not the underlying hex, and respect
  its meaning:
  - `primary` / `primaryLight` / `primaryDark` — brand identity, used for
    primary CTAs and the app's default accent. Not a status color.
  - `accent` — secondary highlight (badges, non-critical emphasis).
  - `success` / `warning` / `danger` (and their `accentGreen` /
    `accentAmber` / `accentRed` equivalents) — reserved strictly for status
    meaning: cleared/on-track, caution/upcoming, overspent/destructive.
    Never reuse these for decorative purposes just because the hue looks
    nice somewhere.
  - `category*` colors — for the expense-breakdown chart and category tags
    only. These exist purely to keep categories visually distinguishable;
    don't repurpose them as status indicators.
  - `groupNeeds` / `groupWants` / `groupSavings` — budget group indicators.
  - `onPrimary` (`#FFFFFF`) — for any text or icons rendered on top of
    primary buttons, colored badges, or gradients. **Never write `#fff` or
    `#ffffff` directly in components.**
  - `primaryButton` (`#0A766C`) — used exclusively for primary CTAs (Submit,
    Next, Save, Add Expense) to achieve ≥4.75:1 WCAG AA contrast against white text.
  - `textMuted` (`#858CA3`) — secondary muted text color providing ≥4.5:1 WCAG AA
    contrast against the dark background (`#0A0E1A`).
  - `onSuccess` (`#0A0E1A`) — dark ink color for checkmarks and text placed on
    solid `Colors.accentGreen` backgrounds to guarantee high contrast.
  - **Color opacity & alpha:** Never use string concatenation to append hex
    alpha channels (e.g. `Colors.primary + '20'`). Always use `withAlpha(color, alpha)`
    from `src/theme/index.ts` (accepts numeric `0.0`–`1.0` or hex string `'20'`).
    This produces valid `rgba(...)` strings that work reliably on both native
    and web, avoiding string concatenation bugs.
  - Never rely on color alone to convey status — pair it with an icon or
    label, both for accessibility and because category/status colors can
    sit close in hue.
  - **Accessibility & Contrast:**
    - All text and interactive icons must maintain at least 4.5:1 contrast
      against their immediate background (WCAG AA).
    - Every icon-only button (`TouchableOpacity` with only an `Ionicons` glyph)
      must specify `accessibilityRole="button"` and a concise, descriptive
      `accessibilityLabel` (e.g. `accessibilityLabel="Delete Groceries"`).
- **Spacing** — always `Spacing.xs|sm|md|lg|xl|xxl|xxxl|huge`. Don't write
  `marginTop: 14` when `Spacing.md` (12) or `Spacing.lg` (16) is the
  intended rhythm — pick the nearest token rather than splitting the
  difference with a magic number.
- **Typography** — Two-font design system:
  - **Poppins** for display and headings (`Poppins_600SemiBold`,
    `Poppins_700Bold`).
  - **Inter** for body text, labels, and all numbers (`Inter_400Regular`,
    `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`).
  - **Android per-weight fontFamily rule:** On Android, React Native ignores
    `fontWeight` for custom fonts. Therefore, **each weight must be its own
    `fontFamily` string** and `fontWeight` must **never** be used on custom fonts.
  - Named scale:
    - `hero` (`Poppins_700Bold`, 32px)
    - `title` (`Poppins_700Bold`, 24px)
    - `subtitle` (`Poppins_600SemiBold`, 18px)
    - `body` (`Inter_400Regular`, 15px)
    - `bodyBold` (`Inter_600SemiBold`, 15px)
    - `caption` (`Inter_500Medium`, 13px)
    - `small` (`Inter_500Medium`, 11px)
    - `badge` (`Inter_600SemiBold`, 10px)
    - `number` (`Inter_700Bold`, 28px, tabular-nums)
  - Always spread tokens via `...Typography.body` rather than setting ad-hoc
    `fontSize` or `fontWeight`.
  - **Tabular numbers:** All currency and numeric displays must use
    `...TabularNums` (`fontVariant: ['tabular-nums']`) so amounts align
    properly in columns.
  - **Currency glyphs:** The Indian Rupee glyph (`₹`) is verified present
    across all weights of Poppins and Inter.
- **BorderRadius** — `sm|md|lg|xl|xxl|full`, same rule: nearest token, not a
  bespoke number.
- **Shadows** — use `Shadows.card|elevated|subtle`. Known issue: these are
  defined with the legacy `shadow*` RN props, which react-native-web flags
  as deprecated in favor of `boxShadow`. Don't add new shadow styling
  outside this token set — when this gets migrated, it should happen once
  in `theme/index.ts`, not piecemeal across components.
- **Dark mode only, for now.** There is no light theme. If one is ever
  added, it must be done by making `Colors` a function of a theme mode
  (e.g. a `getColors(mode)` or context-driven token set), not by adding
  `if (isDark)` branches inside individual components. Keep components
  theme-agnostic — they should only ever reference `Colors.x`, never know
  whether "x" currently resolves to a light or dark value.
- **Currency formatting** — always through `formatCurrency` (lakh-shortened,
  for compact UI like stat cards) or `formatCurrencyFull` (full
  `₹1,23,456` form, for precise figures) from `src/theme/index.ts`. Never
  hand-roll `₹` string concatenation or `.toFixed()` calls elsewhere.

---

## 3. Coding standards

### Data flow
- `src/data/storage.ts` is the **only** place that talks to `AsyncStorage`.
  No screen or component calls `AsyncStorage.getItem`/`setItem` directly —
  go through a named function there (`loadData`, `saveData`, `addExpense`,
  `updateExpense`, `deleteExpense`, `updateSettings`, `toggleDebtPayment`,
  `resetData`). If a new kind of mutation is needed, add a function here
  rather than reaching into storage from a screen.
- **Recompute derived totals from source data, don't increment/decrement
  them.** e.g. a category's `spent` total should be recalculated by summing
  that category's expenses, not adjusted by `+= amount` / `-= amount` on
  each add/delete — incremental adjustment drifts from the true total over
  time as edge cases accumulate. This applies to any other running total
  added later (yearly totals, investment totals, etc.).
- Screens fetch their own data in a `useFocusEffect` (see `index.tsx`,
  `expenses.tsx` for the pattern) so switching tabs always reflects the
  latest storage state. Don't cache `AppData` in a context or pass it down
  as a prop chain — reload from storage on focus, consistently.

### Types
- All shared shapes live in `src/types/index.ts`. Extend or compose from
  these rather than declaring a parallel inline type/interface for the same
  concept in a component file.
- New optional fields on `AppData` (like `isSetupCompleted`) must have a
  sensible default in both `INITIAL_EMPTY_DATA` and `DEFAULT_DATA` in
  `src/data/budgetData.ts` — don't add a field that's only handled in one of
  the two seed objects, since that produces different fresh-install vs.
  demo-data behavior.

### Forms & input
- Every numeric input goes through the existing `text.replace(/[^0-9]/g,
  '')` sanitization pattern already used in `AddExpenseModal` and
  `settings.tsx` — copy that pattern exactly for new numeric fields rather
  than inventing a different sanitizer.
- Validate before saving, and surface validation failures the same way
  every time — don't mix silent no-ops, `console.error`, and `Alert.alert`
  for the same class of problem across different screens.
- **On a multi-step form (onboarding, wizards), don't rely on `autoFocus`
  alone across step transitions.** Since the component tree doesn't always
  remount between steps, pair a `ref` with a `useEffect` keyed on the
  current step index to explicitly call `.focus()` when a new step becomes
  active.

### Cross-platform (this app ships on web *and* native — verify both)
- **`Alert.alert` is unreliable on the web build** — multi-button and
  `destructive`-style configurations don't reliably render or fire
  callbacks in react-native-web. Any confirmation flow that must work
  identically on web and native (deletions, resets, anything destructive)
  should use a custom in-app modal component, not `Alert.alert`. Reserve
  `Alert.alert` for native-only, non-critical messaging if used at all.
- Any new native dependency (especially ones touching gestures, worklets,
  or animation — e.g. `react-native-reanimated`) must be manually verified
  on `npm run web` before being considered done, not just on Expo Go.
  React Native "works everywhere" is not a safe assumption for this
  project's target platforms.
- Before every release build, run `npx expo install --check` and resolve
  any flagged mismatches — several bugs in this app traced back to
  out-of-sync package versions against the installed Expo SDK, not actual
  application logic.

### Style
- Functional components with hooks only — no class components.
- Component files are PascalCase and default-export a single component
  matching the file name (`StatCard.tsx` exports `StatCard`).
- Keep `StyleSheet.create` blocks at the bottom of the file, one style
  object per component, named to match the element it styles.
- Don't introduce a new state-management library (Redux, Zustand, Jotai,
  etc.) for this app's current scope — local component state plus the
  `storage.ts` persistence layer is the deliberate architecture. Revisit
  only if a genuine cross-screen real-time sync need emerges.

### Budget architecture & framework rules
- All budget split frameworks are defined in `BUDGETING_RULES` in
  `src/data/budgetData.ts`. This array is the single source of truth:
  - `none`: No percentage targets (freeform budgeting).
  - `50-30-20`: Balanced 50% Needs, 30% Wants, 20% Savings.
  - `70-20-10`: High-obligation 70% Needs, 20% Wants, 10% Savings.
  - `80-20`: Simplified Pareto 60% Needs, 20% Wants, 20% Savings.
  - `custom`: User-specified split summing exactly to 100%.
- **Never hardcode 50/30/20 targets anywhere in components or screens.** All target
  percentages must be dynamically read from `budgetingRule.targets`.
  When `budgetingRule.targets` is `null` (`none`), hide target badges and guide ticks.
- Users can switch their budgeting framework anytime in Settings without resetting
  categories, spending history, or category limits.
- Onboarding is an orchestrated 5-step wizard (`OnboardingWizard.tsx`):
  1. Welcome Carousel
  2. Step 1: Net Income (`StepIncome.tsx`)
  3. Step 2: Budgeting Rule (`StepBudgetingRule.tsx`)
  4. Step 3: Categories & Budgets (`StepCategories.tsx`)
  5. Step 4: Debt Payoff (`StepDebt.tsx`)
  6. Step 5: Savings & Investments (`StepGoals.tsx`)
  7. Completion Screen (`Completion.tsx`)
- Categories are classified into three `CategoryGroup` values: `'Needs'`, `'Wants'`,
  or `'Savings'`.
- When creating an expense in `AddExpenseModal`, the expense type (`Need` vs
  `Want`) automatically defaults according to the selected category's group
  (`Needs` -> `Need`, `Wants` -> `Want`).

### Investment lock & debt policy
- **0% interest debt (or 0 total debt) NEVER locks investing.** There is no financial
  penalty for concurrent investing when debt charges no interest.
- **>0% interest debt pauses investing** with clear copy explaining the mathematics:
  guaranteed interest charges on debt outpace probabilistic investment returns.
- **User override:** Users with interest-bearing debt can explicitly unpause investing
  via "Start investing anyway" in Settings (with an explanatory `ConfirmModal`), or revert
  at any time.
- **Schedule payoff check:** Debt payoff is verified via
  `data.debtTotal === 0 || data.debtPayments.length === 0 || data.debtPayments.every(p => p.isPaid)`.
  Never check `remainingBalance === 0` across `.every()`, because in declining schedules
  `remainingBalance` is 0 only on the final row.

### Haptics & feedback
- `expo-haptics` is used for tactile feedback on key user actions:
  - Debt payment toggled to paid (`Haptics.ImpactFeedbackStyle.Light`).
  - Expense deletion confirmed (`Haptics.ImpactFeedbackStyle.Light`).
  - Onboarding completion landing (`Haptics.ImpactFeedbackStyle.Light`).
- **All calls to `Haptics.*` MUST be wrapped in `try/catch` blocks** because web builds
  and devices without haptic actuators will throw unhandled rejections if unwrapped.

### Brand system (`BrandMark`)
- Use `<BrandMark />` (`src/components/BrandMark.tsx`) for the official app
  logo and wordmark across onboarding, splash, headers, and completion screens.
- **Visual anatomy:**
  - Container: Rounded square with diagonal linear gradient (`Colors.primaryLight`
    to `Colors.primaryDark`).
  - Glyph: Pure white wallet icon (`wallet-outline`) in `Colors.onPrimary`.
  - Coin accent: Gold metallic dot (`Colors.accentGold`) anchored at the
    top-right of the icon container.
  - Wordmark: Dual-tone Poppins bold (`"Budget"` in `Colors.textPrimary`,
    `"Buddy"` in `Colors.primaryLight`).
- Brand SVG master files are stored in `assets/brand/` (`logo.svg` and
  `logo-with-wordmark.svg`).

---

## 4. Known platform gotchas (keep this list updated)

Living log of RN-web-specific issues found in this project, so they don't
get silently reintroduced by a future change:

- `Alert.alert` does not reliably work on `react-native-web` — see Section
  3, Cross-platform.
- `shadow*` style props (`shadowColor`, `shadowOffset`, etc.) are flagged
  deprecated on web in favor of `boxShadow` — currently harmless (warning
  only), but don't add new components using the legacy props once the
  `Shadows` token set is migrated.
- Errors in the browser console reading `"A listener indicated an
  asynchronous response..."` are **not** app bugs — they come from browser
  extensions (ad blockers, password managers, etc.) and can be ignored when
  debugging.
- `autoFocus` on a `TextInput` is not guaranteed to refire across
  conditionally-rendered steps in a multi-step form on web — see Section 3,
  Forms & input.
- **Horizontal ScrollView width on Web:** A horizontal `ScrollView` inside a
  flex container with `alignItems: 'center'` will expand indefinitely to the
  total width of all child cards on `react-native-web`, causing carousel cards
  to show side-by-side instead of paginating. To fix: clamp the card width
  explicitly (`Math.max(280, Math.min(width - Spacing.xl * 2, 420))`), set
  `style={{ width: cardWidth, flexGrow: 0 }}` directly on the `ScrollView`,
  and apply `overflow: 'hidden'` on the outer wrapper.
- **Carousel keyboard navigation:** On web, desktop users expect `ArrowLeft`
  and `ArrowRight` arrow keys to page through horizontal slides. Always attach
  a `window.addEventListener('keydown', ...)` listener on web carousels.
- **Android custom font `fontWeight`:** Android's font manager completely
  ignores `fontWeight` when a custom `fontFamily` (like Poppins or Inter) is
  specified. Each weight must be imported as a standalone `fontFamily` name,
  and `fontWeight` must **never** be used on custom fonts.
