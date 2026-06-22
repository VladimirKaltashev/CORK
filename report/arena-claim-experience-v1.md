# Arena / Claim Experience v1

## Current model found

- Arena/feed was effectively using `verified` as the only live claim status through the `arena_items` view and a page-level `.eq('status', 'verified')`.
- `/me` loaded all current-user claims, then treated only `verified` claims as “На арене” for filters/stats/reactions.
- Public profile pages showed only `verified` claims.
- Challenge detail showed entries with linked `claimId`, but did not filter out rejected claims.
- Admin/moderation already used an explicit separate surface and showed only `pending` claims.
- Claim card moderation buttons were already protected by explicit `showModerationActions` opt-in with safe default `false`.
- Owner voting prevention was already implemented in `ReactionBar`.

## Files changed

- `src/entities/achievements/store.ts`
- `src/entities/claims/index.ts`
- `src/entities/claims/owner.test.ts`
- `src/entities/claims/owner.ts`
- `src/entities/claims/visibility.test.ts`
- `src/entities/claims/visibility.ts`
- `src/features/profile/AchievementCard.test.tsx`
- `src/features/profile/AchievementCard.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/ChallengeDetailPage.tsx`
- `src/pages/FeedPage.tsx`
- `src/pages/MyClaimsPage.tsx`
- `src/pages/ProfilePage.tsx`

## Visibility rules implemented

Shared visibility helpers were added in `src/entities/claims/visibility.ts`.

Rules now implemented:

- `pending`:
  - visible on normal user/public surfaces
  - visible in `/me`
  - visible in public profile
  - visible in challenge detail
  - visible in moderation queue
- `verified`:
  - visible on normal user/public surfaces
  - visible in `/me`
  - visible in public profile
  - visible in challenge detail
  - hidden from moderation queue
- `rejected`:
  - hidden from Arena
  - hidden from `/me`
  - hidden from public profile
  - hidden from challenge detail
  - hidden from moderation queue after rejection

Surface-specific outcomes:

- Arena now shows only other users’ live claims (`pending` + `verified`), never the current user’s own claims.
- `/me` now shows only the current user’s live claims (`pending` + `verified`), with rejected claims hidden.
- Public profile now shows live public claims (`pending` + `verified`) instead of only `verified`.
- Challenge detail now filters out entries whose linked claims are rejected.

## Admin moderation behavior

- Admin queue still loads only moderation-needed claims (`pending`).
- Approve/reject still removes the item from the queue immediately in UI.
- Moderation actions remain confined to explicit admin/moderation context.
- `AchievementCard` still requires explicit `showModerationActions` opt-in; admin identity alone is not enough.

## Tests/checks

Added/updated tests:

- `src/entities/claims/visibility.test.ts`
- `src/entities/claims/owner.test.ts`
- `src/features/profile/AchievementCard.test.tsx`

Coverage added/adjusted for:

- pending visible on normal surfaces and in moderation queue
- verified visible on normal surfaces and absent from moderation queue
- rejected hidden from normal surfaces and `/me`
- own claims excluded from Arena
- moderation buttons only with explicit opt-in

Checks run:

- `npx tsc --noEmit` — passed
- `npm run test` — passed (`54` files, `372` tests)
- `npm run lint` — passed
- `npm run build` — passed

Build notes:

- Build succeeded.
- Existing `lightningcss` warnings about unknown `@position-try` rules in Primer CSS were shown.
- Existing Vite chunk-size warnings were shown after build.

## Risks / follow-ups

- Arena hot/controversial ordering is now computed in app code for the currently loaded page of live claims, because the existing `arena_items` DB view is still hardcoded to `verified` only. This keeps product semantics correct without DB changes, but global ranking accuracy for deeper pagination is less strict than the old server-side view.
- Challenge detail now filters rejected linked claims in the page layer. If challenge visibility rules grow further, this may deserve a dedicated challenge-entry visibility helper later.
- Profile bio save permissions mismatch remains a separate known backend issue from earlier work (`profiles` update grant missing in DB migrations). This task did not change DB/schema.

## Explicit non-goals confirmation

Confirmed:

- no mascot UI
- no boosted reactions
- no XP/rank economy changes
- no new visual redesign
- no notification system
- no settlement rewards
- no DB/schema/migration changes
- no unrelated architecture rewrite

## External review status

External review skipped: ask-ollama unavailable or timed out.

Availability check result:

- `ask-ollama 'OK'` → `zsh:1: command not found: ask-ollama`
