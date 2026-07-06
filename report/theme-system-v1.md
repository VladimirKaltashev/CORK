# Theme System v1 — Implementation Report

## 1. Current theme architecture found

Before this task, the theme architecture consisted of:

- **4 theme options**: `light`, `dark`, `system`, `acid`
- **Store**: Zustand persist middleware, key `cork_theme`, default `system`
- **ThemeApplier**: Applied `.dark` class (for `dark`/`system`) or `data-theme="acid"` attribute
- **CSS**:
  - `theme-tokens.css`: `:root` = light values, `.dark` = dark overrides
  - `themes/acid.css`: `[data-theme="acid"]` overrides with Acid Pop tokens
- **SettingsPage**: 4 theme cards labeled in Russian (Светлая, Тёмная, Системная, Acid Pop)
- **Primer ThemeProvider**: mapped light→day, dark/acid→night, system→auto

## 2. Files changed

| File | Action | Summary |
|---|---|---|
| `src/entities/theme/registry.ts` | **Created** | Theme registry with metadata, resolve/migration functions |
| `src/entities/theme/registry.test.ts` | **Created** | 21 tests for registry, legacy mapping, selectability |
| `src/entities/theme/store.ts` | **Modified** | New `Theme` type, default to `obsidian`, v1 migration |
| `src/entities/theme/store.test.ts` | **Modified** | Updated for obsidian default, removed legacy-system tests |
| `src/entities/theme/ThemeApplier.tsx` | **Modified** | Simplified to set `data-theme` attr for all themes |
| `src/entities/theme/ThemeApplier.test.tsx` | **Modified** | Updated for obsidian default theme |
| `src/entities/theme/index.ts` | **Modified** | Re-exports registry utilities |
| `src/styles/theme-tokens.css` | **Modified** | Obsidian as baseline, legacy `.dark` alias |
| `src/styles/themes/obsidian.css` | **Created** | Obsidian Blood token overrides |
| `src/pages/SettingsPage.tsx` | **Modified** | "CORK Worlds" selector, planned themes section |
| `src/app/App.tsx` | **Modified** | Import obsidian.css, simplified `themeToColorMode` |

## 3. New theme IDs and user-facing names

| ID | User-facing name | Status |
|---|---|---|
| `obsidian` | Obsidian Blood | Default |
| `acid` | Acid Pop | Available |
| `blueprint` | Blueprint | Planned |
| `bubblegum` | Bubblegum | Planned |
| `tribunal-paper` | Tribunal Paper | Planned |

## 4. Default theme behavior

- New users get `obsidian` (Obsidian Blood) as default
- `:root` CSS now uses Obsidian Blood tokens as baseline
- `ThemeApplier` sets `data-theme="obsidian"` on `<html>` for the default theme
- Primer ThemeProvider receives `night` color mode for obsidian and acid

## 5. Legacy light/dark migration behavior

| Old stored value | Resolved to | Mechanism |
|---|---|---|
| `"dark"` | `obsidian` | `LEGACY_THEME_MAP` + `resolveTheme()` |
| `"light"` | `obsidian` | `LEGACY_THEME_MAP` + `resolveTheme()` |
| `"system"` | `obsidian` | `LEGACY_THEME_MAP` + `resolveTheme()` |
| `null`/empty | `obsidian` | `DEFAULT_THEME` |
| Unknown string | `obsidian` | `resolveTheme()` fallback |

- Store version bumped to `1` with `migrate` function that calls `resolveTheme` on the persisted state
- No localStorage data is lost — users seamlessly transition to obsidian

## 6. Theme registry structure

Located at `src/entities/theme/registry.ts`. Each theme entry:

```ts
interface ThemeMetadata {
  id: Theme               // 'obsidian' | 'acid' | 'blueprint' | 'bubblegum' | 'tribunal-paper'
  name: string            // e.g. "Obsidian Blood"
  description: string     // world description
  status: ThemeStatus     // 'default' | 'available' | 'planned'
  designTraits?: string[] // optional design trait keywords
}
```

Utility functions:
- `getThemeMetadata(id)` — lookup by ID
- `getSelectableThemes()` — only default + available
- `isThemeSelectable(id)` — guard for UI
- `resolveTheme(input)` — migration-safe resolution with legacy mapping

## 7. What is implemented now vs planned

### Implemented (working themes)
- **Obsidian Blood** — full implementation with CSS tokens:
  - Dark surfaces (`#0a0a0c` base)
  - Blood red brand (`#c23939`)
  - Gold king accent (`#d4a94e`)
  - Compact radii (2px/4px)
  - Strong shadows, low glow
- **Acid Pop** — unchanged, already existed

### Planned (in registry, not selectable, no CSS)
- **Blueprint** — light technical paper world
- **Bubblegum** — soft pastel expressive world
- **Tribunal Paper** — paper/court/archive world

### Deprecated (mapped to obsidian, not shown in UI)
- `light`, `dark`, `system`

## 8. Checks results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npm run test` | 58 files, 402 tests, all pass |
| `npm run lint` | Pass, 0 errors |
| `npm run build` | Pass |

### Test additions
- `registry.test.ts` — 21 tests: registry integrity, default theme, legacy mapping, selectable filtering, resolveTheme with edge cases
- `store.test.ts` — 3 tests: default, setTheme, persist
- `ThemeApplier.test.tsx` — 4 tests: obsidian/acid application, switching, null render

## 9. Risks / follow-ups

- **Primer ThemeProvider color mode**: Currently returns `night` for all implemented themes. Blueprint/Bubblegum in the future will need `day`. This is prepared in `themeToColorMode`.
- **Visual regression on light**: Users previously on `light` will now see Obsidian Blood (dark). This is intentional per the Theme Worlds direction — CORK no longer ships a light theme as a first-class option.
- **`system` option removed**: Users who relied on OS preference to switch light/dark will now always get obsidian. A future iteration could re-add a `system` concept that maps to two valid theme worlds.
- **Auth pages**: Login/Register pages may have been styled with light-theme assumptions. Now they'll render with Obsidian Blood tokens. No known regressions.
- **Theme token completeness**: Obsidian Blood covers all existing `--cork-*` variables. New structural tokens (density hooks, border strength variables) are not yet defined — this is scoped for a follow-up token architecture task.

## 10. Non-goals confirmation

The following were NOT changed:
- No claim logic changes
- No Arena/Profile/Challenge changes
- No mascot work
- No icon redesign
- No full implementation of all 5 theme worlds
- No major component redesigns
- No CSS art experiments
- Only Obsidian Blood and existing Acid Pop are implemented; Blueprint/Bubblegum/Tribunal Paper are registry-only with `planned` status