# 09. Theme Worlds

This file defines the CORK Theme Worlds product direction.

It is a rules/concept document, not an implementation plan. No theme code should be written based on this file without a separate implementation task.

---

## Core idea

CORK themes are not ordinary light/dark skins.

Each theme is a different **verdict world**: it changes the emotional genre of the app, not just background and accent colors.

Product sentence to preserve:

> Каждая тема меняет не цвет приложения, а жанр приложения.

## Positioning

- Do not frame themes as light mode / dark mode.
- Frame them as branded CORK worlds.
- A theme may change:
  - color palette
  - typography
  - border style
  - radius system
  - density
  - surface treatment
  - shadows
  - decorative language
  - overall emotional tone
- Theme switching should feel like changing the visual interpretation of the product.

## Theme Worlds v1

### 1. Obsidian Blood

Default CORK world.

**Mood:**

- black / graphite / matte
- blood red accent
- brutal but not neon
- underground verdict board
- tribunal / arena / status wall
- serious, sharp, not cute SaaS

**Design traits:**

- dark surfaces
- hard or medium-hard borders
- low glow or no glow
- compact density
- strong verdict accents
- crown/clown should feel like social judgment, not casino icons

### 2. Blueprint

Light theme, but not generic light mode.

**Mood:**

- white / off-white technical paper
- blueprint blue
- proof, schemes, public evidence
- engineering drawing / court diagram / reputation blueprint

**Design traits:**

- thin blue lines
- grid / measurement marks
- technical cards
- precise borders
- airy layout
- stamped controls
- clean but not corporate SaaS

### 3. Bubblegum

Soft expressive theme.

**Mood:**

- gum / candy / soft youth culture
- playful, but not childish
- warm social app energy
- soft verdict arena

**Design traits:**

- pastel pink / blue / lavender / cream
- large radii
- soft shadows
- pill controls
- friendly cards
- must keep enough contrast and structure
- avoid becoming toy-like or random candy UI

### 4. Acid Pop

Expressive high-energy theme.

**Mood:**

- acid poster / rave / internet board
- sharp, loud, young
- not necessarily pure hacker terminal
- can borrow HUD/sticker energy

**Design traits:**

- acid green / pink / harsh contrast
- sharp forms
- segmented controls
- poster-like highlights
- possible grid/bracket language
- energetic but still usable

### 5. Tribunal Paper

Paper/court/archive world.

**Mood:**

- public judgment
- record, archive, verdict sheet
- official stamp energy
- not luxury royal

**Design traits:**

- paper-like surfaces
- black typography
- red stamps or marks
- thin rules
- table/archive structure
- serious editorial feeling

## Deprecated framing

The old generic `light` and `dark` themes are deprecated as product-facing concepts.

Implementation may later map:

- `dark` → Obsidian Blood
- `light` → Blueprint or Obsidian Blood, depending on the migration choice

Do not implement this mapping without a dedicated theme-migration task.

## Non-goals

This document does not authorize:

- a CSS rewrite
- a theme switcher implementation
- claim logic changes
- Arena / Profile / Challenge changes
- mascot work
- icon redesign
- a broad UI redesign

## Relationship to other rules

- `05-ui-visual.md` describes the default Obsidian Blood energy.
- Future theme implementation tasks must respect the project structure and token system defined in `04-architecture.md`.

## Open questions for implementation

- Exact token naming for each world (e.g., `data-theme="obsidian"`, `data-theme="blueprint"`).
- Whether to keep a `system` option and how it maps to a world.
- How many structural tokens each world needs beyond the existing `cork-*` variables.
- Migration path for users currently on `light`, `dark`, or `system`.
- Whether Bubblegum and Tribunal Paper need their own font families or can reuse system fonts initially.
