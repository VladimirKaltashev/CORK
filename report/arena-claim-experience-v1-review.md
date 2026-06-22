# Arena / Claim Experience v1 — Review

## 1. What was reviewed

| Area | Files |
|---|---|
| Visibility rules | `src/entities/claims/visibility.ts` |
| Arena/feed | `src/pages/FeedPage.tsx` |
| /me | `src/pages/MyClaimsPage.tsx` |
| Public profile | `src/pages/ProfilePage.tsx` |
| Challenge detail | `src/pages/ChallengeDetailPage.tsx` |
| Admin queue | `src/pages/AdminPage.tsx` |
| Achievement card | `src/features/profile/AchievementCard.tsx` |
| Owner helpers | `src/entities/claims/owner.ts`, `owner.test.ts` |
| Achievements store | `src/entities/achievements/store.ts` |
| Tests | `visibility.test.ts`, `owner.test.ts`, `AchievementCard.test.tsx` |

## 2. Issues found

**None.** The implementation is correct in all reviewed areas.

## 3. Review details

### `visibility.ts` — centralized and correct

All 6 helpers are simple predicates. Rules:

- `isClaimVisibleOnNormalSurface`: `pending` + `verified` = live; `rejected` = hidden
- `isClaimVisibleInArena`: normal surface AND `userId !== viewerId` (own claims excluded)
- `isClaimVisibleInOwnerView`: normal surface
- `isClaimVisibleInPublicProfile`: normal surface
- `isClaimVisibleInChallenge`: normal surface
- `isClaimVisibleInModerationQueue`: `pending` only

No duplicated or contradictory status checks remain in pages — all pages import from visibility.ts.

### Arena/feed — own claims correctly hidden

- DB query (FeedPage.tsx:105): `.in('status', ['pending', 'verified'])` — rejected excluded at DB level
- Client filter (FeedPage.tsx:133): `isClaimVisibleInArena({ status, userId }, viewerId)` — own claims removed
- `ReactionBar` at line 503 passes `isOwner` correctly
- Hot/controversial sorting operates only on already-filtered items — no risk of own claims affecting scores
- `hasMore` may over-report when the last page is full of the viewer's own claims (pre-existing pagination limitation, not introduced here)

### /me — correct filtering

- Own pending + verified shown (MyClaimsPage.tsx:33: `isClaimVisibleInOwnerView`)
- Own rejected hidden
- `buildOwnClaimsStats` receives only live claims (pre-filtered at line 33)
- No moderation actions — `AchievementCard` rendered without `showModerationActions` prop
- Owner reaction state preserved via internal `isOwner` check

### Public profile — no leaks

- Public achievements filtered at ProfilePage.tsx:79 with `isClaimVisibleInPublicProfile`
- `showModerationStatus={false}` at line 331
- Rejected hidden; pending and verified visible

### Challenge detail — correct entry visibility

- Entries with rejected linked claims are filtered out at ChallengeDetailPage.tsx:325-333 via `isClaimVisibleInChallenge`
- Entries without claimId (not yet moderated) are shown (conservative default)
- Owner reaction state passed correctly

### Admin — only pending in queue

- DB query (AdminPage.tsx:78): `.eq('status', 'pending')` already restricts the set
- Client filter (AdminPage.tsx:95): redundant `isClaimVisibleInModerationQueue` guard (safe double-check)
- Approve/reject correctly removes item from local pending list
- Moderation buttons are admin-page-native (not from AchievementCard component), correctly behind `showModerationActions` opt-in

### Tests — adequate coverage

| Test file | Coverage |
|---|---|
| `visibility.test.ts` | All 6 helpers, all status values, viewer-own interaction |
| `owner.test.ts` | Crowned/clowned detection, all 4 filter modes, stats builder, arena item filter |
| `AchievementCard.test.tsx` | Moderation actions opt-in, pending-is-live behavior |

**Missing (acceptable):**
- Arena `loadPage` integration test (requires real Supabase mock — heavy)
- Challenge detail entry-filtering test (integration-level)
- `buildOwnClaimsStats` with a rejected claim in the input (handled because /me pre-filters; low risk)

## 4. Fixes made

None — no code changes needed.

## 5. Remaining risks

- **`hasMore` over-reporting** in Arena pagination when the last DB page contains only the current user's own claims. Pre-existing, not introduced here. Low impact — user sees "Загрузить ещё" and the subsequent load returns fewer items.
- **`isOnArena` in `owner.ts`** returns `true` for `pending` claims. These are not yet publicly visible on the Arena (they're pending moderation), so the `/me` "На арене" counter includes pending claims. This is intentional — the owner considers their pending claim as "sent to arena."

## 6. Commit recommendation

**Approve for commit.** No code changes needed from this review.

## 7. Scope confirmation

- ✅ No mascot
- ✅ No economy/XP/rank changes
- ✅ No design changes
- ✅ No schema/migration changes
- ✅ No claim card redesign
- ✅ No broadened RLS policies
- ✅ No store API changes
