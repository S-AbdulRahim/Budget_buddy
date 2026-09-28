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

| Context                  | Icon name              |
|---------------------------|-------------------------|
| Monthly income             | `cash-outline`          |
| Budgets & categories       | `pie-chart-outline`     |
| Debt / payoff              | `trending-down-outline` |
| Halal / SIP / investing    | `leaf-outline`          |
| Settings / system ops      | `settings-outline`      |
| Destructive action         | `warning-outline`       |
| Success / cleared          | `checkmark-circle`      |
| Add / create               | `add-circle-outline`    |
| Delete                     | `trash-outline`         |

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
  - Never rely on color alone to convey status — pair it with an icon or
    label, both for accessibility and because category/status colors can
    sit close in hue.
- **Spacing** — always `Spacing.xs|sm|md|lg|xl|xxl|xxxl|huge`. Don't write
  `marginTop: 14` when `Spacing.md` (12) or `Spacing.lg` (16) is the
  intended rhythm — pick the nearest token rather than splitting the
  difference with a magic number.
- **Typography** — use the named scale (`hero`, `title`, `subtitle`,
  `body`, `bodyBold`, `caption`, `small`, `number`) via
  `...Typography.body` spread into a style object, rather than setting
  `fontSize`/`fontWeight` ad hoc.
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
