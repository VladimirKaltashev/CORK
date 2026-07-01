# Challenge Claims v1

## Current challenge model found

- Challenges are themed arenas stored in `public.challenges`.
- Submissions live in `public.challenge_entries`.
  - Key fields: `challenge_id`, `user_id`, `claim_id`, `title`, `description`, `version`, `is_current`.
  - `loadDetail()` queries only `is_current = true` entries.
- Verdicts are produced by crowd reactions stored against `public.achievements`.
- Challenge UI previously treated entries as “decorative” containers:
  - `ChallengeDetailPage` showed a custom `EntryCard` list.
  - It rendered `ReactionBar` directly for `entry.claimId`.
  - It did not use the shared claim UI (`AchievementCard`) for the “Заявки” tab.
- Claim→challenge linkage already existed at write time:
  - When a challenge entry is submitted, a claim is inserted into `public.achievements` with `achievements.meta.challenge_id = <challengeId>`.
  - The created claim id is then written into `challenge_entries.claim_id`.

## How claim → challenge linking works

For challenge submissions we now rely on two existing, already-compatible links:

1. **Meta link (source of truth for claim labeling)**
   - `achievements.meta.challenge_id = <challengeId>`
   - `achievements.meta.source = 'challenge_entry'`
2. **DB link (source of truth for “which claims belong to this challenge”)**
   - `challenge_entries.claim_id` points at the claim.
   - `challenge_entries` is filtered by `(challenge_id, is_current=true)` so the challenge detail shows only current challenge-linked claims.

The minimal helper for claim labeling / linking is implemented in:
- `src/entities/challenges/claimLinking.ts`

## Files changed

- `src/features/profile/AddAchievementModal.tsx`
- `src/entities/achievements/store.ts`
- `src/entities/achievements/store.test.ts`
- `src/features/profile/AchievementCard.tsx`
- `src/pages/ChallengeDetailPage.tsx`
- `src/entities/claims/visibility.test.ts`
- `src/entities/challenges/claimLinking.ts` (new)
- `src/entities/challenges/claimLinking.test.ts` (new)
- `src/features/profile/AchievementCard.ownerVoteProps.test.tsx` (new)

## Submit-to-challenge flow

### UI trigger

- On `ChallengeDetailPage` the submit action is now **claim-based**:
  - Button text: **“Добавить заявку в челлендж”**
  - It opens the existing claim composer `AddAchievementModal`.
- This applies to:
  - hero CTA
  - sidebar CTA (My status)
  - challenge empty state CTA

### Composer behavior (no extra composer)

- `AddAchievementModal` is invoked with `challengeId` and `challengeTitle`.
- It pre-fills claim context:
  - `meta.thread` becomes the challenge label (challenge title when available)
  - `meta.challenge_id = challengeId`
  - `meta.source = 'challenge_entry'`
- On submit:
  1. A pending claim is created via `useAchievementsStore.addAchievement()`.
  2. The composer links the created claim into `challenge_entries`:
     - updates existing `challenge_entries` row for `(challenge_id, user_id, is_current=true)`
     - or inserts a new row
     - increments `version` when rotating the current claim
  3. Calls `onSubmitted`, so the page reloads the challenge detail.

## Challenge detail behavior

### “Заявки” tab

`ChallengeDetailPage` now renders **shared claim cards**:

- Uses `AchievementCard` for each live challenge claim.
- Visibility:
  - shows only `pending` + `verified`
  - hides `rejected`
  - does not hide pending claims
- Voting behavior preserved:
  - `AchievementCard` passes `reactionBarCompact={false}` in challenge context, enabling the same vote controls behavior as the old `EntryCard` list.
  - owner voting is still prevented because `AchievementCard` derives `isOwner` from `achievement.userId`.

### Stats on the hero

Added lightweight stats computed from currently visible live claims:

- total live claims
- crown-leading count
- clown-leading count
- total comments

### Empty state

If the challenge has no live (pending+verified) linked claims, the “Заявки” tab shows a compact empty state and points to the submit CTA.

## Visibility rules

The challenge “live claim” rule is:

- **Visible:** `pending`, `verified`
- **Hidden:** `rejected`

Implemented via:
- `isClaimVisibleInChallenge({ status })` from `src/entities/claims/visibility.ts`

Owner-vote prevention remains the existing behavior:
- `AchievementCard` uses `achievement.userId === authUser.id` to set `isOwner` for `ReactionBar`.

Moderation actions stay admin-only:
- `AchievementCard` uses `showModerationActions` default `false`.

## Arena / /me compatibility

- Arena visibility is unchanged:
  - based on `achievement.status` and viewer ownership.
  - `meta.challenge_id` does not participate in `isClaimVisibleInArena`.
- `/me` shows my challenge claims as normal own claims:
  - it already shows pending + verified own claims.
  - cards display a challenge/thread label using the existing `ClaimBadge` `thread` value.

## Tests / checks

### Added/updated tests

- `src/entities/challenges/claimLinking.test.ts`
  - claim→challenge linking helper
  - live visibility pending/verified vs rejected
- `src/features/profile/AchievementCard.ownerVoteProps.test.tsx`
  - verifies `AchievementCard` passes `isOwner` + `compact=false` to `ReactionBar`
- `src/entities/claims/visibility.test.ts`
  - adds a guard that challenge meta does not affect arena visibility
- `src/entities/achievements/store.test.ts`
  - updated to reflect `addAchievement()` now returns the created `Achievement`

### Checks run (green)

- `npx tsc --noEmit`
- `npm run test`
- `npm run lint`
- `npm run build`

## Risks / follow-ups

1. **Rotation vs historical submissions**
   - When a user submits again to the same challenge, the current `challenge_entries` row is updated to point to the newly created claim.
   - Previously created claims remain visible in `/me` and potentially in Arena as normal live claims (since status is still live).
   - This is currently consistent with the “live claim container” goal, but if the product later wants only the current claim version to be visible anywhere, we’d need additional cleanup rules.

2. **Award mini-tags in the “Заявки” list**
   - The old `EntryCard` list showed some challenge award tags next to users.
   - Switching to `AchievementCard` removed those tags from the “Заявки” tab.

3. **Legacy entries without `claim_id`**
   - Challenge detail currently filters out entries without a `claimId` from the visible lists.
   - If legacy data needs compatibility, we can render a minimal placeholder next to the claim card list.

## Non-goals confirmation

- No mascot
- No boosted reactions
- No XP/rank economy changes
- No claim-card redesign
- No settlement rewards
- No notification system
- No DB/schema rewrite
- No duplicate composer implementation
