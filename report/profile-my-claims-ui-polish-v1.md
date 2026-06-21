# Profile / My Claims UI polish v1

## 1. Files changed

- `src/entities/claims/index.ts`
- `src/entities/claims/owner.ts`
- `src/entities/claims/owner.test.ts`
- `src/entities/profile/store.ts`
- `src/entities/profile/store.test.ts`
- `src/features/profile/AchievementCard.tsx`
- `src/features/profile/AchievementCard.test.tsx`
- `src/features/profile/EditProfileModal.tsx`
- `src/features/reactions/ReactionBar.tsx`
- `src/features/reactions/ReactionBar.test.tsx`
- `src/pages/FeedPage.tsx`
- `src/pages/MyClaimsPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/test/integration/reactions.integration.test.tsx`
- `src/widgets/Layout/Header.tsx`

## Critical fix: moderation actions hidden outside admin surfaces

### What caused the bug

- `src/features/profile/AchievementCard.tsx` rendered moderation action buttons based on `isAdmin && achievement.status === 'pending'`.
- That card is reused on normal claim-viewing surfaces such as `/me` and profile pages.
- As a result, admin/moderator identity leaked moderation controls into ordinary product surfaces instead of keeping them inside explicit moderation context.

### What changed

- Added explicit prop `showModerationActions?: boolean` to `AchievementCard`.
- Safe default is now `false`.
- Approve/reject buttons and reject form render only when both are true:
  - the user is admin
  - `showModerationActions` is explicitly enabled
- Passive moderation status remains visible on normal surfaces through existing status copy/badge such as `На модерации`.

### Where moderation actions are now allowed

- Dedicated admin/moderation surface only.
- In the current codebase, moderation actions remain available on `src/pages/AdminPage.tsx`.
- `AchievementCard` can support moderation actions in future only through explicit opt-in.

### Where moderation actions are now hidden

- `/me`
- own profile
- public profile
- arena/feed cards
- challenge detail
- any other normal claim-viewing surface using `AchievementCard` without explicit admin mode

### Behavior preserved

- Owner claims still do not show crown/clown vote buttons.
- Owner state copy remains:
  - `Это ваша заявка`
  - `Вы не можете голосовать за своё. Арена решит исход.`
- Previous UI polish remains intact:
  - `Моё` in the main header nav
  - `/me` as a dedicated own-claims surface
  - live verdict wording (`Корона ведёт`, `Клоун ведёт`, `Ровно 50/50`, `Нет голосов`)

## Repair pass: arena/profile/me surface cleanup

### 1. How own claims are hidden from Arena

- Arena/feed now excludes the current user’s own claims at load time.
- `src/pages/FeedPage.tsx` now passes the current viewer id into the arena data loader.
- The Supabase arena query excludes rows where `user_id === auth user id`.
- A small adapter helper `filterArenaItemsForViewer(...)` was added as a second safety layer.
- `/me` still loads the current user’s own claims unchanged.
- Public profile pages were not changed by this rule.

### 2. How /me was simplified

- Removed the large hero card and the page-level self-vote lecture.
- Removed the redundant `Профиль` button.
- Removed the duplicate `Новая заявка` CTA from `/me`.
- Changed page title from `Моё` to `Мои заявки`.
- Kept only:
  - title
  - stats
  - filters
  - own claim cards
- The self-vote explanation now lives only inside owner claim cards through `ReactionBar`.

### 3. How own profile was simplified

- Removed the large own-claims stat tile block from the own profile.
- Removed the duplicate claim creation CTA from the own profile.
- Hid `Scout Score` from the own profile in this pass to reduce dashboard noise.
- Kept the own profile focused on:
  - profile hero
  - reputation
  - CORK rank
  - bio / about
  - a small CTA link to `/me`
- Public profiles still show reputation and public claims as before.

### 4. Root cause of profile bio save failure

- The frontend error handling was too optimistic before this pass:
  - the edit modal closed immediately after submit
  - the original Supabase error was swallowed behind a generic toast
- The actual backend cause in the repository setup is a permissions mismatch on `public.profiles`:
  - `supabase/migrations/20260614000000_profiles_grants.sql` grants `SELECT` on `public.profiles` to `authenticated`
  - but it does not grant `UPDATE` on `public.profiles` to `authenticated`
  - at the same time, the RLS policy `profiles_update_own` exists
- Result:
  - the policy allows owner updates
  - but SQL table privileges still block the update request before it can succeed
- Client-side repairs made in this pass:
  - `updateProfile(...)` now returns success/failure
  - the modal stays open when save fails
  - the toast now surfaces the exact backend error text
- Important honesty note:
  - no DB/schema/migration changes were made in this task
  - therefore the repository-side runtime fix for the missing `UPDATE` grant was not applied here
  - the exact backend cause is now identified and surfaced instead of being hidden

### 5. Confirmation that moderation leak fix remains intact

- `showModerationActions` explicit opt-in remains in `AchievementCard`.
- Safe default remains `false`.
- Moderation controls remain hidden on:
  - `/me`
  - own profile
  - public profile
  - arena/feed cards
  - challenge detail
- Admin moderation controls remain confined to the dedicated admin surface.

## 2. Main nav change

- Added `Моё` to the main header navigation, not only to the avatar dropdown.
- Main nav order is now:
  - `Арена`
  - `Моё`
  - `Челленджи`
  - `Рейтинг`
  - `Профиль`
- Updated the mobile nav to the same order.
- Active nav state for `/me` continues to work through `NavLink`.

## 3. Own profile UI/copy changes

- Kept the existing profile page structure and data sources.
- Polished the reputation block so it reads as a profile summary rather than a bare score strip:
  - added `Репутация` label
  - added explanatory copy about crowns/clowns coming from arena verdicts
  - kept crown/clown counts and ratio
  - the block now still renders with zero values instead of disappearing
- Kept the rank block in place as a compact layer below reputation.
- Updated the `Мои заявки` summary block copy to clearly send the user to `Моё`:
  - `Профиль показывает репутацию. За своими заявками и исходами следите в разделе «Моё».`
- Updated own-claims stat labels in profile to live wording:
  - `Всего`
  - `На арене`
  - `Корона ведёт`
  - `Клоун ведёт`
- Kept own claims out of the profile archive.
- Moved `Scout Score` below the claims summary and made its heading visually quieter so it competes less with the core profile structure.
- Kept `О себе` below the summary blocks so the page reads closer to:
  - profile hero
  - reputation summary
  - rank
  - my claims summary
  - about/bio

## 4. /me UI/copy changes

- Kept `/me` as the dedicated current-user claims page.
- Reworked the hero copy so the page feels like an owner-facing arena outcomes section:
  - title: `Моё`
  - copy: `Вы не голосуете за свои заявки. Арена решает, кем вы выглядите: королём или клоуном.`
- Kept the existing buttons:
  - `Новая заявка`
  - `Профиль`
- Updated stats labels to live wording:
  - `Всего`
  - `На арене`
  - `Корона ведёт`
  - `Клоун ведёт`
- Updated filter tabs to the same live wording:
  - `Все`
  - `На арене`
  - `Корона ведёт`
  - `Клоун ведёт`

## 5. Self-owned reaction state changes

- Kept self-vote prevention intact: crown/clown buttons are still not rendered for own claims.
- Polished the owner-facing reaction state copy into a two-line structure:
  - `Это ваша заявка`
  - `Вы не можете голосовать за своё. Арена решит исход.`
- Normal voting behavior for other users’ claims was not changed.

## 6. Verdict wording changes

- Updated `ReactionBar` verdict labels to safer live wording without changing verdict logic:
  - `НЕТ ВЕРДИКТА` → `Нет голосов`
  - `КОРОЛЬ X%` → `Корона ведёт X%`
  - `ШУТ X%` → `Клоун ведёт X%`
  - `СПОРНО A/B` → `Ровно 50/50` when votes are equal
- This is a copy-level/UI-level wording cleanup only.
- No settlement logic or reaction aggregation logic was changed.

## 7. Checks results

- `npx tsc --noEmit` — passed
- `npm run test` — passed (`53` files, `367` tests)
- `npm run lint` — passed
- `npm run build` — passed

Build notes:

- Build succeeded.
- Existing `lightningcss` warnings about unknown `@position-try` rules in Primer CSS were shown.
- Existing chunk-size warnings were shown by Vite after build.

## 8. Risks/follow-ups

- `Корона ведёт` / `Клоун ведёт` intentionally describe the current live balance, not a final settled outcome. If explicit settlement states appear later, this wording should stay limited to live verdict surfaces.
- `Ровно 50/50` now replaces the old generic disputed wording only when votes are exactly equal. If product later wants a broader “contested but not tied” label, that would need a separate copy pass.
- The profile still uses the existing rank and scout blocks. They are quieter now, but a future dedicated profile IA pass could align those blocks even more tightly with the product structure.

## 9. Confirmation of non-goals

Confirmed:

- no DB changes
- no schema or migration changes
- no reaction storage model changes
- no XP/rank economy changes
- no mascot UI changes
- no post-moderation changes
- no boosted reactions
- no claim-card redesign
- no large layout rewrite

## External review status

External review skipped: ask-ollama unavailable or timed out.

Availability check result:

- `ask-ollama 'OK'` → `zsh:1: command not found: ask-ollama`
