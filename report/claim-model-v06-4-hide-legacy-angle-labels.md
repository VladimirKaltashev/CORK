# Claim Model v0.6.4 — Hide Legacy claimAngle Labels from Public UI

## 1. What user reported

After v0.6.3 (removed verdict-angle chips from composer), the old angle labels 👑 На корону / 🤡 На клоуна / ⚖️ Рассудите still appear publicly on feed cards and profile cards. New claims default to `judge`, showing "Рассудите" on every card — conflicting with Claim Model semantics.

## 2. Where public claimAngle labels were found

| File | What | Lines (pre-fix) |
|---|---|---|
| `src/pages/FeedPage.tsx` | `ANGLE_META` constant + `ClaimAngleBadge` component + render | 75–91, 403–404 |
| `src/features/profile/AchievementCard.tsx` | `ANGLE_META` constant + `ClaimAngleBadge` component + render | 27–41, 104–105 |

AdminPage.tsx was already clean — no `ClaimAngleBadge` usage.

## 3. What was changed

### `src/pages/FeedPage.tsx`
- Removed `ANGLE_META` constant (👑🤡⚖️ labels/emoji/colors)
- Removed `ClaimAngleBadge` component (inlined in this file)
- Removed `claimAngle` from `FeedItem` interface
- Removed `claim_angle` from Supabase `.select()` call
- Removed `claimAngle: row.claim_angle` from `loadPage` data mapping
- Removed `<ClaimAngleBadge>` + `·` separator from feed card JSX

### `src/features/profile/AchievementCard.tsx`
- Removed `ANGLE_META` constant
- Removed `ClaimAngleBadge` component
- Removed `ClaimAngle` from type import
- Removed `<ClaimAngleBadge>` + `·` separator from card JSX

## 4. What remains for DB compatibility

All internal/non-public references preserved:

| Location | Reference | Purpose |
|---|---|---|
| `shared/types/index.ts:107` | `claimAngle?: ClaimAngle` | Type definition |
| `achievements/store.ts:14` | `claimAngle?: ClaimAngle` | `NewAchievementData` interface |
| `achievements/store.ts:50` | `claimAngle: row.claim_angle ?? 'king'` | Read from Supabase |
| `achievements/store.ts:74` | `claim_angle: data.claimAngle ?? 'judge'` | Write to Supabase |
| `achievements/store.ts:91` | `claimAngle: inserted.claim_angle ?? 'judge'` | Local store mapping |
| `challenges/store.ts:296` | `claim_angle: 'judge'` | Challenge entry write |
| `claims/types.ts:48` | `claimAngle?: string` | Claim type definition |
| `claims/mapper.ts:90` | `claimAngle: achievement.claimAngle` | Achievement→Claim mapping |
| `AddAchievementModal.tsx:175` | `claimAngle: 'judge'` | Submit payload (hardcoded default) |

## 5. What was intentionally NOT done

- **claim_angle DB column dropped** — not touched. Column remains with data.
- **seed data changed** — not touched. Old entries still have claim_angle values.
- **store API changed** — `addAchievement` / `NewAchievementData` / Achievement type unchanged.
- **reactions/verdict bar** — not touched. Verdict UI (👑/🤡 via `ReactionBar`) remains as crowd verdict.
- **No DB migration, Supabase schema change, RLS/auth, reactions/budget, global rename, or new UI library.**

## 6. Tests/checks and results

| Command | Result |
|---|---|
| `npm run test` | 51 files, 356 passed |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | Clean |
| `npm run build` | Success |

No new tests — changes are JSX/constant removal only. Existing mapper tests still pass (claimAngle mapped internally).

## 7. git diff summary

v0.6.4-only changes:
```
 src/features/profile/AchievementCard.tsx | 20 +-------
 src/pages/FeedPage.tsx                   | 59 ++---------------------
 2 files changed, 5 insertions(+), 74 deletions(-)
```

Combined (v0.6.2 + v0.6.3 + v0.6.4 uncommitted):
```
 src/features/profile/AchievementCard.tsx      | 20 +-------
 src/features/profile/AddAchievementModal.tsx  | 54 +++++----------------
 src/features/profile/CreateAchievementFAB.tsx |  4 +-
 src/pages/ChallengesPage.tsx                  | 68 +++++++--------------------
 src/pages/FeedPage.tsx                        | 59 ++---------------------
 5 files changed, 34 insertions(+), 171 deletions(-)
```

## 8. External review status

ask-ollama unavailable (server not reachable). Manual review performed.

## 9. Risks / follow-ups

- **claim_angle still stored per row** — old data has `king`/`clown`/`judge` values. Not used in public UI anymore. Could be cleaned in future DB migration.
- **Verdict bar remains** — crowd verdict via `ReactionBar` (crown/clown reactions) still works. This is correct per Claim Model (crowd decides).
- **No visual regression** — feed cards show category/year/metadata without the extra "Рассудите" line. Profile cards show category badge + date.
- **Internal compat fine** — all store/types/backend paths remain functional.
- **V0.6.2 and v0.6.3 changes uncommitted** — all 3 sprints will be committed together.
