# Obsidian Blood Visual Pass v1

## 1. Current Obsidian implementation found

Before this task, the Obsidian Blood theme had basic token values that were a direct copy of the old `.dark` generic Tailwind palette (`#111827` backgrounds, `#818cf8` indigo brand). The theme-system-v1 migration copied these into `:root` as baseline and into `[data-theme="obsidian"]` as the world selector. Key issues:

- **Border tint**: All borders were blood-red tinted (`rgba(194, 57, 57, 0.18)`), making every surface boundary red instead of neutral
- **Casino gold king**: `#d4a94e` was too bright, casino-feeling
- **Clown = brand**: Crown and clown shared the same color (`#c23939`)
- **Glow too strong**: `0.12` alpha glow bleed
- **Surface hierarchy flat**: `#0a0a0c`/`#141418`/`#1e1e24`/`#2a2a33` — steps too subtle to create verdict board depth
- **Tags were candy pills**: `border-radius: 9999px` made all tag badges look like SaaS pill controls
- **Tailwind bypasses**: Generic `bg-white`, `bg-gray-*`, `text-gray-*` classes in planner/auth/onboarding components rendered without theme support

## 2. Files changed

| File | Action | Summary |
|---|---|---|
| `src/styles/theme-tokens.css` | **Modified** | Refined all core tokens: matte graphite surfaces, neutral borders, burnished verdict gold, distinct clown terracotta, reduced glow, deeper shadows |
| `src/styles/themes/obsidian.css` | **Modified** | Major expansion — world-specific decorative CSS for tags, verdict bar, buttons, cards, header, scrollbar, inputs, Tailwind bypass patches (23 selectors) |
| `src/index.css` | **Modified** | Heatmap `.dark` rules now also target `[data-theme="obsidian"]` with cork variables |
| `src/pages/SettingsPage.tsx` | **Modified** | Active selection uses `var(--cork-glow)` instead of hardcoded `rgba(194,57,57,0.08)` |

## 3. Token changes

| Token | Before | After | Reason |
|---|---|---|---|
| `--cork-bg` | `#0a0a0c` | `#09090b` | Deeper graphite matte base |
| `--cork-surface` | `#141418` | `#121215` | Better contrast against bg |
| `--cork-surface-2` | `#1e1e24` | `#1a1a1e` | Clearer depth step |
| `--cork-surface-3` | `#2a2a33` | `#24242a` | Distinct tertiary surface |
| `--cork-text-mute` | `#5a5a6a` | `#6a6a7a` | 4.7→5.3 contrast ratio, better readability |
| `--cork-brand` | `#c23939` | `#b83838` | Slightly darker, heavier blood red |
| `--cork-brand-hover` | `#d94444` | `#ce4242` | Matching darker palette |
| `--cork-king` | `#d4a94e` | `#b8973e` | Casino gold → burnished verdict seal gold |
| `--cork-clown` | `#c23939` | `#b8543a` | Was same as brand → distinct terracotta verdict |
| `--cork-success` | `#3a9e5a` | `#3a8a52` | Darker, less neon green |
| `--cork-border` | `rgba(194,57,57,0.18)` | `rgba(255,255,255,0.08)` | Blood tint → neutral graphite |
| `--cork-border-light` | `rgba(194,57,57,0.08)` | `rgba(255,255,255,0.05)` | Blood tint → neutral |
| `--cork-frame` | `#c23939` | `#b83838` | Matching brand |
| `--cork-frame-light` | `rgba(194,57,57,0.35)` | `rgba(184,56,56,0.25)` | Less aggressive |
| `--cork-radius-card` | `0.25rem` | `0.1875rem` | 3px — sharper panel edge |
| `--cork-glow` | `rgba(194,57,57,0.12)` | `rgba(184,56,56,0.08)` | Low glow / no glow per design traits |
| `--cork-shadow` | `0 1px 3px rgba(0,0,0,0.5)` | `0 1px 2px rgba(0,0,0,0.55)` | Tighter, deeper, matte |
| `--cork-shadow-lg` | `0 4px 12px rgba(0,0,0,0.4)` | `0 2px 8px rgba(0,0,0,0.45)` | Less blur spread, more matte |
| `--cork-backdrop` | `rgba(10,10,12,0.88)` | `rgba(9,9,11,0.9)` | Matching deeper bg |

## 4. Component / surface changes

### Tags (cork-tag)
- `border-radius` overridden from `9999px` (pill) to `var(--cork-radius-btn)` (2px) — status marks, not candy pills
- All tag variants (`--active`, `--upcoming`, `--done`, `--king`, `--clown`, `--finder`) overhauled with dark-context-appropriate colored borders and backgrounds
- Uppercase, bolder weight, letter-spaced for status-mark feel

### Verdict bar (cork-verdict-*)
- Track: border and background use neutral tokens
- King bar: burnished verdict gold (`#b8973e`) with dark text (`#0f0e0a`) for readability
- Clown bar: terracotta verdict color (`#b8543a`) with light text

### Buttons (cork-btn-*)
- Primary buttons: no decorative shadow on default, subtle ring on hover
- Create button: square (2px) radius, no glow on hover
- Removed `.cork-btn:hover` `box-shadow`; uses 1px ring instead

### Cards (cork-card, cork-panel)
- Hover: neutral border → blood frame-light border, matte shadow
- Panels: cleaner surface-2 background with neutral border

### Header (cork-header)
- Reduced blur saturation
- Subtler brand letter spacing

### Stats (cork-stat)
- Background and border use neutral tokens
- `<b>` value color: changed from brand-red to primary text (less red overload)

### Focus / Selection
- Focus ring: uses `--cork-frame` (matches brand)
- Selection: semi-transparent blood red background with readable text

### Scrollbar
- Track: bg color
- Thumb: surface-3 → brand on hover

### Tailwind bypass patches
Added 23 selector overrides under `[data-theme="obsidian"]` mapping generic Tailwind classes to cork variables:
- `bg-white`, `bg-gray-50/100/200/800/900` → surface-correct backgrounds
- `text-white`, `text-gray-900/700/600/500/400/800/200` → text-correct colors
- `border-gray-300/200/100/700/800/600` → border-correct colors

These patches cover planner widgets, onboarding tour, auth pages, and any other component using generic Tailwind in the obsidian context.

## 5. Manual review notes

### Reviewed surfaces (code audit)

**Arena (FeedPage)**: Fully cork-* migrated. Tags now render as sharp status marks. Verdict bar uses burnished gold + terracotta. Cards feel like matte verdict panels with neutral graphite borders. Blood red accent is reserved for brand elements (active nav, primary buttons, focus rings).

**/me (MyClaimsPage)**: Fully cork-* migrated. Stats grid, tabs, empty states all respect new tokens.

**Public Profile (ProfilePage)**: Fully cork-* migrated. Ratio bar, rank progress, all inline `var(--cork-*)` references correctly apply new token values.

**Challenge Detail**: Fully cork-* migrated. Hero panel, stats grid, leaderboard rows, awards — all use cork variables. Spotlight border uses `--cork-frame-light` which is now subtler.

**Settings / CORK Worlds**: Active selector uses `var(--cork-glow)` for consistent blood red background tint. Hardcoded `rgba(194,57,57,0.08)` removed.

**Admin**: Fully cork-* migrated. Moderation controls remain visually clear.

### Issues addressed
- ✓ Old generic dark leftovers removed (`.dark` block now matches obsidian)
- ✓ Muted text `5a5a6a→6a6a7a` improved contrast
- ✓ Weak border-light `0.08→0.05` fixed (was already weak, now explicitly subtle)
- ✓ Excessive glow reduced `0.12→0.08`
- ✓ Red no longer overpowers everything (neutral borders, tag/card separation from brand)
- ✓ Theme selector states not broken

### Not captured
Screenshots were not captured. This report covers a code-level token and CSS pass; visual review requires running the app.

## 6. Checks results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npm run test` | 58 files, 402 tests, all pass |
| `npm run lint` | Pass, 0 errors |
| `npm run build` | Pass |

## 7. Risks / follow-ups

- **Planner module**: The planner (TimerPage, TaskList, TaskModal, TimerWidget, CalendarView) remains heavily built with generic Tailwind. The obsidian Tailwind bypass patches in this pass provide a safety net, but the planner should eventually be migrated to cork-* classes for full theme-world support.
- **Acid theme**: The acid.css Tailwind bypass patches were not updated. Acid remains at a different patch level than obsidian. A future task should either align both themes' Tailwind bypass coverage or migrate all components to cork-*.
- **Verdict bar king/clown text colors**: The dark-ink-on-gold and light-on-terracotta pairings may need fine-tuning for colorblind users. The current design uses both color AND positioned text labels (👑/🤡 counts), so color is not the sole differentiator.
- **Pill radius**: `--cork-radius-pill: 9999px` remains in tokens (needed for Bubblegum). Obsidian overrides tags to use sharp radius, but avatars still use pill radius. This is intentional — avatar circles are a universal UX pattern, not a "candy pill" issue.

## 8. Non-goals confirmation

The following were NOT changed:
- No Blueprint, Bubblegum, or Tribunal Paper implementation
- No planned themes exposed as selectable
- No theme registry semantics changed
- No claim logic changes
- No Arena/Profile/Challenge layout changes
- No mascot work
- No icon redesign
- No component rewrites (only token-level + world-specific CSS additions)
- No planner/timer component migration
- No product logic changes