# Claim Model v0.6.1 — Arena Filter UX + Challenges Duplicate Fix

## 1. What was checked

### Part A — Arena claimType filter (`/feed`)
- Filter logic: `claimTypeFilter` derived from `useSearchParams` via `parseClaimTypeFilter`
- Render: `visibleItems` used in `.map()`, not raw `items`
- Empty state: `visibleItems.length === 0` triggers dedicated message
- URL update: `handleClaimTypeFilterChange` correctly sets/deletes `claim` param, preserves other params
- Old items without `meta.claim_type`: fallback to `self_achievement` via `safeClaimType()`, correctly hidden in `fail`/`flex`/etc. filters
- Chip styling: active chip has brand color border + background

**Verdict: Logic is correct. No bug.** The filter was already working. The user's perception was a UX issue — no visible count indicator and generic empty state.

### Part B — Challenges duplicate (`/challenges`)
- `ChallengeSpotlight` renders `activeChallenges[0]` (line 230)
- `activeChallenges.map()` in "Все" tab renders ALL active challenges including the same first item
- Confirmed: the first active challenge appears twice (spotlight + list)

**Verdict: Bug confirmed.** First active challenge (Мемный батл) duplicated in spotlight AND list.

## 2. Bug in Arena filter?
**No.** The filter logic, URL binding, visibleItems usage, and empty state were all correct. The filter worked but looked non-functional because:
- No count feedback when filter narrowed results
- Generic empty state did not mention the active filter name

## 3. What changed in FeedPage (`src/pages/FeedPage.tsx`)

Two minimal UX changes:

| Line | Change |
|---|---|
| 361 | Added count: `Тип заявки · {visibleItems.length} из {items.length}` (only when `claimTypeFilter !== 'all'`) |
| 419 | Improved empty state: `Нет заявок типа «{label}» среди загруженных.` |

## 4. Why filter appeared non-functional

1. No numeric feedback — user clicked a chip, same item count was visible (no counter)
2. Active chip styling was subtle — brand border + surface-2 background may blend in some themes
3. Empty state was generic — "Нет заявок этого типа" didn't confirm which filter was active

## 5. What changed in ChallengesPage (`src/pages/ChallengesPage.tsx`)

| Line | Change |
|---|---|
| 201–203 | Moved `featured` + `withoutFeatured` helper before `visible` computation |
| 205–207 | `withoutFeatured` filters out `featured.id` from any list |
| 209–220 | `visible` useMemo dedupes featured from the raw list |
| 300 | Active section: uses `withoutFeatured(activeChallenges)` for condition, count, and map |
| 311 | Upcoming section: same treatment |
| 322 | Completed section: same treatment |

## 6. How duplicate was removed

Added a `withoutFeatured` helper:
```tsx
const withoutFeatured = (list: Challenge[]) => {
  if (!featured) return list
  return list.filter((c) => c.id !== featured.id)
}
```

Applied in:
- `visible` useMemo (affects Все/Активные/Предстоящие/Завершённые tabs)
- Three section renders in "Все" tab (active/upcoming/completed)
- Section counts

When only one active challenge exists: spotlight shows it, list shows 0 (section hidden).

## 7. Tests added / not added

**No new tests added.** Reason:
- FeedPage changes are JSX-only (count label + empty state text) — no new logic, no existing test file for FeedPage component
- ChallengesPage change is deduplication logic embedded in component — no existing test file for ChallengesPage component
- Existing filter tests (filter.test.ts, 18 tests) remain unchanged and pass
- No test harness exists for page components; adding one would exceed scope

## 8. Commands and results

| Command | Result |
|---|---|
| `npm run test` | 51 files, 356 passed |
| `npx tsc --noEmit` | Clean (no errors) |
| `npm run lint` | Clean (no errors) |
| `npm run build` | Success (775ms) |

## 9. git diff summary

```
 src/pages/ChallengesPage.tsx | 44 +++++++++++++++---------------
 src/pages/FeedPage.tsx       | 11 ++++++---
 2 files changed, 35 insertions(+), 20 deletions(-)
```

No Supabase migration, no store API changes, no reactions/budget changes.

## 10. External review status

ask-ollama unavailable (server not reachable). Manual review performed using the same checklist — all items pass.

## 11. Risks / follow-ups

- **Client-side only:** Filter only works on loaded items. If a large page is loaded and filtered, the "Загрузить ещё" button loads unfiltered items. This is the designed behavior — no server-side filtering.
- **Count may fluctuate:** When user loads more items via "Загрузить ещё", the count updates dynamically. This is correct but could confuse users who expect server-side filtering.
- **Pagination vs filter mismatch:** `hasMore` is based on unfiltered data. User may see 0 matching items but still have a "Загрузить ещё" button. This is a product decision — future improvement could disable it when filtered list is smaller than page size.
- **No commit/push:** Changes are unstaged. User can review and commit.
