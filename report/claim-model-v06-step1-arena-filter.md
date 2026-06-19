# Claim Model v0.6 — Step 1: Arena claimType Filter

## 1. What Was Done

Added a client-side claimType filter to the Arena feed (FeedPage). Users can now filter feed items by claim type (Моё, Нашёл, Фейл, Flex, Находка, Спорно, Абсурд, Орга/проект) in addition to the existing category filter.

## 2. Files Changed

| File | Change | Status |
|------|--------|--------|
| `src/entities/claims/filter.ts` | **New** — `ClaimTypeFilter` type, `CLAIM_TYPE_FILTER_OPTIONS` constant, `matchesClaimTypeFilter()` function | Untracked |
| `src/entities/claims/filter.test.ts` | **New** — 10 tests for `matchesClaimTypeFilter` | Untracked |
| `src/entities/claims/index.ts` | +3 lines — export filter types/helpers | Modified |
| `src/pages/FeedPage.tsx` | +68/-26 — filter state, derived visibleItems, filter UI chips, filtered empty state | Modified |

## 3. Why Client-Side

The filter operates over already-loaded feed items using `item.meta` and `claimMetaFromAchievementMeta()`. No Supabase query change, no server-side filtering. This is intentional for v0.6 Step 1:
- No DB schema change needed (claim type lives in `Meta`)
- Instant filter switching (no reload)
- Pagination is not broken — filter works within the current page
- Future: server-side filtering can be added when claim_type becomes a dedicated column

## 4. How Filter Works With Old Achievements Without Meta

`matchesClaimTypeFilter()` calls `claimMetaFromAchievementMeta(meta)` which safely defaults to `self_achievement` for empty/missing meta. This means:
- Old achievements without meta always match the "Моё" (`self_achievement`) filter
- Old achievements do NOT match any other claim type filter
- This is consistent with the existing ClaimBadge behavior (old achievements show no badge but exist as `self_achievement` internally)

## 5. Tests Added

**10 tests** in `src/entities/claims/filter.test.ts`:

| Test | Verifies |
|------|----------|
| `all matches everything` | `all` filter returns true for any meta |
| `all matches empty meta` | `all` filter works with empty objects |
| `fail matches fail meta` | Exact match works |
| `fail does not match flex meta` | Different types are excluded |
| `old empty meta matches self_achievement filter` | Old achievements default to Моё |
| `old empty meta does not match fail filter` | Old achievements excluded from other filters |
| `invalid claim_type still matches self_achievement` | Invalid meta defaults to Моё |
| `invalid claim_type does not match other filters` | Invalid meta excluded from other filters |
| `empty meta falls back to self_achievement filter` | Edge case: empty meta |
| `empty meta does not match fail` | Edge case: empty meta excluded |

## 6. What Was NOT Done (Intentionally)

- No Supabase query change
- No server-side filtering
- No DB migration
- No store API change
- No reactions/budget changes
- No AdminPage/ProfilePage/AchievementCard changes
- No global rename
- No new UI library
- No route name changes
- No CORK_AGENT_RULES.md file in working tree (stashed)

## 7. Validation Results

| Command | Result |
|---------|--------|
| `npm run test` | ✅ 348 passed (51 files) |
| `npx tsc --noEmit` | ✅ Clean |
| `npm run lint` | ✅ Clean |
| `npm run build` | ✅ Built (830ms) |

## 8. Git Diff Summary

```
 src/entities/claims/index.ts |  3 ++
 src/pages/FeedPage.tsx       | 91 ++++++++++++++++++++++++----------
 2 files modified, 2 new files (filter.ts + filter.test.ts)
```

## 9. Risks / Concerns

None significant. The filter is purely client-side and doesn't affect data loading, pagination, or other features. The filter chips only appear when items are loaded (`items.length > 0`), preventing empty UI state confusion.

One minor note: the filter uses `ClaimTypeFilterOption` emoji/label from a static constant defined at module level. This means the constants are initialized at import time rather than lazily. This is acceptable since all dependencies are pure functions without side effects.

## 10. External Review Status

**ask-ollama**: Unavailable (Ollama server not reachable). Manual review performed.

### Manual Review Checklist

- ✅ No `any` in the code
- ✅ No Supabase migration
- ✅ No store API change
- ✅ Old achievements without meta safely map to `self_achievement`
- ✅ Filter does not mutate `items` (creates new array via `filter()`)
- ✅ Pagination/loading behavior not broken (filter is derived state)
- ✅ Mobile UI not broken (uses same chip pattern as existing filters)
- ✅ Scope did not grow (only claimType filter added)
- ✅ Report exists in `/report`

## 11. Next Recommended Step

**Step 2: server-side claimType filtering** — or proceed to another v0.6 feature. The current implementation is intentionally client-side; server-side can be added when `claim_type` becomes a queryable column or when feed data volume requires it.
