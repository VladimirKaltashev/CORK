# Profile / My Claims split v1

## 1. Files changed

- `src/app/App.tsx`
- `src/entities/claims/index.ts`
- `src/entities/claims/owner.ts`
- `src/entities/claims/owner.test.ts`
- `src/features/profile/AchievementCard.tsx`
- `src/features/reactions/ReactionBar.tsx`
- `src/features/reactions/ReactionBar.test.tsx`
- `src/pages/ChallengeDetailPage.tsx`
- `src/pages/FeedPage.tsx`
- `src/pages/MyClaimsPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/index.ts`
- `src/shared/constants/routes.ts`
- `src/test/integration/reactions.integration.test.tsx`
- `src/widgets/Layout/Header.tsx`

## 2. What changed

- Added a dedicated current-user page for own claims and verdict tracking.
- Split own profile from own claims archive: the profile now shows compact claim stats and a link to the dedicated page.
- Renamed public profile claims copy away from `Достижения`.
- Prevented self-voting in UI by showing a separate owner-facing state instead of reaction buttons.
- Added small claim-owner helpers and focused tests for the new filtering/stat logic and owner reaction state.

## 3. Route added

- Added route: `/me`
- Page title: `Моё`
- Subtitle clarifies that this page is where the current user watches their own claims, review state, and arena outcomes.

## 4. How own profile changed

- Removed the old achievements-style claims list from the current user profile.
- Added a compact summary section `Мои заявки`.
- Summary shows:
  - total claims
  - crowned count
  - clowned count
  - active/on arena count
- Added CTA link/button to the dedicated own-claims page: `Открыть Моё`.
- Kept `Новая заявка` entry point in the profile summary block.

## 5. How public profile copy changed

- Public profile no longer labels claims as `Достижения`.
- The section title is now `Заявки пользователя`.
- Empty state copy was updated to `Публичных заявок пока нет`.
- Public profile claim cards are rendered without owner-only moderation/status details.

## 6. How self-vote UI is prevented

- `ReactionBar` now supports an owner state.
- When the current user owns the claim:
  - crown/clown buttons are not rendered
  - the user sees the message `Это ваша заявка. Арена решит исход.`
  - verdict visualization remains visible
- Owner-state wiring was added in feed cards, profile claim cards, and challenge detail entries.

## 7. Tests/checks results

- `npx tsc --noEmit` — passed
- `npm run test` — passed (`52` test files, `362` tests)
- `npm run lint` — passed
- `npm run build` — passed

Build notes:

- Vite build completed successfully.
- Existing CSS warnings from `lightningcss` about unknown `@position-try` rules in Primer CSS were shown during build.
- Existing chunk-size warnings were also shown during build.

External review note:

- Attempted a brief external sanity review via the local model endpoint at `http://192.168.1.64:11434/api/generate`.
- The request failed twice with `curl: (56) Recv failure: Connection reset by peer`.
- No external review feedback was available from that endpoint in this run.

## 8. Risks/follow-ups

- Own-claims filters currently infer `Коронованы` and `Заклоунены` from the current verdict aggregate on verified claims. If product semantics for final outcomes become stricter later, this helper may need to point to a more explicit finalized status.
- `/me` was added with a lightweight nav exposure in the header menu and profile CTA. If broader IA/navigation changes are planned later, this route can be promoted more visibly.
- `git diff --stat` does not include untracked new files by default, so scope was additionally verified through `git status --short`.

## 9. Confirmation of non-goals

Confirmed:

- no DB changes
- no Supabase schema or migration changes
- no reaction storage model changes
- no XP/rank economy changes
- no mascot UI changes
- no large architecture rewrites
