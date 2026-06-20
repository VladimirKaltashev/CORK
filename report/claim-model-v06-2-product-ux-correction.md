# Claim Model v0.6.2 — Product UX Correction

## 1. What user reported

1. **/challenges:** hero spotlight "висит не там" — feels like an ordinary card misplaced above filters, even after dedupe fix.
2. **/feed:** three filter rows (sort, categories, claimType) look like visual chaos.
3. **Composer:** "вынесено на суд" is dishonest — pending moderation ≠ on trial.
4. **Thread/tag:** "# Самый неуклюжий" looks like a functional filter but does nothing beyond display.

## 2. What changed in ChallengesPage

Removed `ChallengeSpotlight` hero block entirely (lines 238–240 in v0.6.1).

| Removal | Reason |
|---|---|
| `const featured = activeChallenges[0] ...` | No longer needed |
| `const withoutFeatured = (list) => ...` | Deduplication no longer needed |
| `<ChallengeSpotlight challenge={featured} .../>` render | Removed |
| `ChallengeSpotlight` component definition | Removed |
| `visible` useMemo dedupe logic | Reverted to simple switch |

All section renders reverted to use raw `activeChallenges`/`upcomingChallenges`/`completedChallenges` arrays (no dedupe). Tabs/counts remain unchanged.

## 3. What changed in FeedPage

| Change | Detail |
|---|---|
| Category chips row removed | `<div className="flex flex-wrap gap-2 mb-3">` + all `FILTERS.map(...)` removed |
| `FILTERS` constant removed | UI data no longer needed; kept in git history |
| `handleFilterChange` kept | `void handleFilterChange` suppresses tsc; preserved for future restore |
| ClaimType label changed | "Тип заявки" → "Фильтр по типу" |
| Count indicator preserved | Still shows `· n из m` when filter is active |

Feed data loading (`loadPage`, `category` state, Supabase query) untouched. Category defaults to `'all'` — existing rows with any category still load.

## 4. What changed in composer copy

### `src/features/profile/AddAchievementModal.tsx`

| Element | Before | After |
|---|---|---|
| Modal header | `На суд` | `Новая заявка` |
| Submit button | `Вынести на суд` | `Отправить на проверку` |
| Submitting button | `Отправка...` | (unchanged) |
| Success toast | `Вынесено на суд` | `Заявка отправлена на проверку` |
| Error toast | `Не удалось вынести на суд` | `Не удалось отправить заявку` |

### `src/features/profile/CreateAchievementFAB.tsx`

| Element | Before | After |
|---|---|---|
| Tooltip / aria-label | `Вынести на суд` | `Новая заявка` |

## 5. What changed for thread/tag honesty

### `src/features/profile/AddAchievementModal.tsx`

| Element | Before | After |
|---|---|---|
| Section label | `Ветка` | `Ветка карточки` |
| Helper text | *(none)* | `Пока только отображается на карточке. Фильтр по веткам появится позже.` |

## 6. What was intentionally NOT done

- **Category filter removal from store/query:** `category` state, `handleFilterChange`, `loadPage`'s category param, and Supabase `.eq('category', ...)` all preserved. Only the UI row was hidden.
- **Thread filtering:** Not implemented. Only label + disclaimer added.
- **Moderation flow change:** Store status, moderation pipeline, DB schema untouched.
- **Server-side claimType filtering:** Not added. Client-side only.
- **No DB migration, store API change, reaction/budget, auth/RLS, global rename, or new UI library.**

## 7. Tests/checks and results

| Command | Result |
|---|---|
| `npm run test` | 51 files, 356 passed |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | Clean |
| `npm run build` | Success |

No new tests added — all changes are JSX/copy-only in page components and modal. Existing test suites pass unchanged.

## 8. git diff summary

```
 src/features/profile/AddAchievementModal.tsx  | 11 +++--
 src/features/profile/CreateAchievementFAB.tsx |  4 +-
 src/pages/ChallengesPage.tsx                  | 68 +++++++--------------------
 src/pages/FeedPage.tsx                        | 34 ++------------
 4 files changed, 27 insertions(+), 90 deletions(-)
```

No Supabase migration, no store API change, no reaction/budget file touched.

## 9. External review status

ask-ollama unavailable (server not reachable). Manual review performed — all items on checklist pass.

## 10. Risks / follow-ups

- **Category filter hidden but query preserved:** The `category` query param still filters `arena_items` in Supabase. UI shows all categories. If data grows, restoring the category row is a single revert.
- **`handleFilterChange` kept via `void`:** Tiny maintenance footprint. A future cleanup commit can remove it.
- **Composer copy is now honest:** Users will no longer expect their pending submission to appear immediately in the arena.
- **Thread disclaimer:** Sets expectation that filtering is future work.
