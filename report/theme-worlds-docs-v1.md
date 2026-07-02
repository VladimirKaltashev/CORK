# Theme Worlds Documentation v1

## 1. Files inspected

- `rules/README.md`
- `rules/02-product-model.md`
- `rules/03-domain-model.md`
- `rules/04-architecture.md`
- `rules/05-ui-visual.md`
- `rules/08-git-workflow.md`
- `product.md`
- `docs/CASE_UX_CONCEPT.md`
- `src/entities/theme/store.ts`
- `src/entities/theme/ThemeApplier.tsx`
- `src/entities/theme/index.ts`
- `src/styles/theme-tokens.css`
- `src/styles/theme-components.css`
- `src/styles/themes/acid.css`
- `New styles/README (2).md`

No source code changes were made. Existing theme files were inspected only for naming and current framing.

## 2. Files changed

- `rules/05-ui-visual.md`
  - Added a "Theme Worlds" section.
  - Clarified that the opening "dark arena of verdicts" description matches the default Obsidian Blood world.
  - Preserved the product sentence: `Каждая тема меняет не цвет приложения, а жанр приложения.`
- `rules/09-theme-worlds.md`
  - New canonical rules file for Theme Worlds v1.
- `rules/README.md`
  - Added `Theme / world work` row pointing to `09-theme-worlds.md`.
- `product.md`
  - Updated Phase 0 roadmap item from `Acid/Light/Dark` to `Theme Worlds v1 (Obsidian Blood, Blueprint, Bubblegum, Acid Pop, Tribunal Paper)`.
- `report/theme-worlds-docs-v1.md`
  - This report.

## 3. Where Theme Worlds are documented

Primary documentation:

- `rules/09-theme-worlds.md` — canonical definition of Theme Worlds v1, including:
  - core idea and positioning
  - Obsidian Blood, Blueprint, Bubblegum, Acid Pop, Tribunal Paper
  - deprecated `light`/`dark` framing
  - non-goals
  - open questions for implementation

Secondary references:

- `rules/05-ui-visual.md` — links to `09-theme-worlds.md` and notes that the default Obsidian Blood world matches the existing dark-arena tone.
- `rules/README.md` — lists `09-theme-worlds.md` in the required-reading table.
- `product.md` — roadmap item references Theme Worlds v1 by name.

## 4. How old light/dark framing is deprecated

- Generic `light` and `dark` themes are now deprecated as product-facing concepts.
- Future implementation may map legacy values:
  - `dark` → Obsidian Blood
  - `light` → Blueprint or Obsidian Blood, depending on the migration choice
- No migration mapping was implemented in this task.
- Existing code (`Theme` type with `'light' | 'dark' | 'system' | 'acid'`, `ThemeApplier`, etc.) was left untouched.

## 5. Open questions for implementation

- Exact `data-theme` attribute names for each world.
- Whether to keep a `system` option and which world it resolves to.
- How many structural tokens each world needs beyond the current `cork-*` variables.
- Migration path for users currently on `light`, `dark`, or `system`.
- Whether Bubblegum and Tribunal Paper need their own font families or can reuse system fonts initially.
- How theme switching UI should present worlds (names, previews, order).

## 6. Non-goals confirmation

This task explicitly did not include:

- CSS rewrite
- theme switcher implementation
- claim logic changes
- Arena / Profile / Challenge changes
- mascot work
- icon redesign
- broad UI redesign

Only documentation and concept files were changed.

## 7. Checks

- `git status --short` was run before and after changes.
- No build or test run was required because this was a docs-only change.
- No markdown/lint script targets `.md` files in this repository.

## 8. Git summary

See final message for commit hash, branch, and status.
