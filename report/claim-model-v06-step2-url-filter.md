# Claim Model v0.6 — Step 2: URL-persisted claimType Filter

## Goal

Persist the Arena claimType filter via URL query param (`?claim=fail|success|all`), replacing the local `useState` with `useSearchParams` from React Router.

## Changes

### `src/entities/claims/filter.ts`
- Added `parseClaimTypeFilter(raw: string | null): ClaimTypeFilter` — validates against `ALL_CLAIM_TYPES` set, returns `'all'` for null/invalid values
- Uses the existing `ALL_CLAIM_TYPES` constant for O(1) lookup

### `src/entities/claims/filter.test.ts`
- 8 tests for `parseClaimTypeFilter`: null, undefined, valid values, invalid, edge cases

### `src/entities/claims/index.ts`
- Exports `parseClaimTypeFilter`

### `src/pages/FeedPage.tsx`
- Imports `useSearchParams` from `react-router-dom`
- Imports `parseClaimTypeFilter` from entities/claims
- Removed `claimTypeFilter` useState; derived from `searchParams.get('claim')` via `parseClaimTypeFilter`
- Added `handleClaimTypeFilterChange` — uses functional `setSearchParams` (preserves other params), deletes `claim` param when filter is `all`
- Chip `onClick` now calls `handleClaimTypeFilterChange(opt.value)` instead of `setClaimTypeFilter`

## Design Decisions

| Decision | Choice |
|---|---|
| Param name | `claim` — short, unambiguous: `/feed?claim=fail` |
| Validation | `parseClaimTypeFilter` in `filter.ts` — pure, tested, uses `ALL_CLAIM_TYPES` set |
| Invalid URL | Falls back to `'all'` display; URL stays dirty (no auto-rewrite) |
| Param removal | `all` filter deletes `claim` param for clean URLs |
| Other params preserved | Yes — functional `setSearchParams` merges with `URLSearchParams(prev)` |

## Result

- All 51 test files pass (356 tests total: 348 existing + 8 new)
- `tsc --noEmit` — clean
- `npm run lint` — clean
- `npm run build` — successful

## Verification

| Check | Result |
|---|---|
| `npm run test` | 356 passed |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | No errors |
| `npm run build` | Built in 714ms |
| ask-ollama review | Unavailable (server unreachable) |
