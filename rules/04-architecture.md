# 04. Architecture Rules

## Stack

Frontend:
- React
- TypeScript
- Vite

State:
- Zustand

Backend:
- Supabase

Styling:
- CSS variables
- theme tokens
- `cork-*` design system

## Project structure

CORK follows Feature-Sliced Design style layers:

```
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
```

Higher layers may import lower layers.

Lower layers must not import higher layers.

General direction:

- pages may import features/entities/shared
- features may import entities/shared
- entities may import shared
- shared must not import app/pages/features/entities

## Imports

Use absolute imports through `@/`.

Do not introduce relative import chains when an alias is appropriate.

## New code

Before adding a new component, store, hook, utility, or API layer:

1. Search for an existing pattern.
2. Reuse the existing pattern.
3. Keep the change small.

## Dependencies

Do not add new dependencies without explicit user approval.

Do not introduce:
- new state managers
- new UI libraries
- new styling systems
- new backend abstraction layers

unless explicitly requested.

## Domain adapters

When transitioning legacy models, prefer a safe adapter layer before large renames.

Example:
- storage may remain Achievement
- domain/UI may use Claim

Do not mass rename storage/domain names without a dedicated plan.

## UI components in entities

Entity-specific reusable UI may live under:

```
src/entities/<entity>/ui/
```

Only if it is dumb, reusable, and does not depend on feature/page layers.

Example:

```
src/entities/claims/ui/ClaimBadge.tsx
```
