# Arena data layer v1

## 1. Current arena data model found

- The original server-side Arena source was the `public.arena_items` view.
- That view already exposed the right UI fields and score columns:
  - claim fields
  - reaction counts
  - comment counts
  - `hot_score`
  - `controversy_score`
- But the view still had `WHERE a.status = 'verified'`, so it excluded live `pending` claims.
- Because of that mismatch, the current `FeedPage.tsx` had fallen back to:
  - loading `achievements` directly
  - filtering live claims in app code
  - computing `hot` / `controversial` ordering in app code after page load
- That workaround made product visibility correct, but global ordering before pagination was no longer guaranteed.

## 2. Migration/view changes

- Added new migration:
  - `supabase/migrations/20260622000000_arena_live_claims_view.sql`
- The migration replaces `public.arena_items` without editing old migrations.
- Updated view behavior:
  - includes `pending`
  - includes `verified`
  - excludes `rejected`
- Preserved existing columns expected by UI and sorting:
  - `id`
  - `user_id`
  - `category`
  - `title`
  - `description`
  - `year`
  - `proof_type`
  - `proof_value`
  - `status`
  - `claim_angle`
  - `rejection_reason`
  - `meta`
  - `created_at`
  - `crowns`
  - `clowns`
  - `comments`
  - `hot_score`
  - `controversy_score`

## 3. Files changed

- `report/arena-data-layer-v1.md`
- `src/entities/claims/arena.ts`
- `src/entities/claims/arena.test.ts`
- `src/entities/claims/index.ts`
- `src/entities/claims/visibility.ts`
- `src/pages/FeedPage.tsx`
- `supabase/migrations/20260622000000_arena_live_claims_view.sql`

## 4. How pending + verified are now included server-side

- The `arena_items` view now selects claims where:
  - `a.status IN ('pending', 'verified')`
- `FeedPage.tsx` now queries `arena_items` again instead of rebuilding Arena ranking in app code.
- That means live-claim inclusion happens in the data layer before sorting and pagination.

## 5. How rejected is excluded

- `rejected` is excluded in the view itself:
  - only `pending` and `verified` are selected
- `FeedPage.tsx` no longer has to decide that at the ranking stage.

## 6. How own claims are excluded

- Own claims are excluded at query time in `FeedPage.tsx` with:
  - `.neq('user_id', viewerId)`
- This happens before pagination.
- The app no longer loads own claims and filters them after page slicing.

## 7. How hot/controversial/latest sorting works after the change

- Added small helper:
  - `src/entities/claims/arena.ts`
- It maps Arena sort modes to server-side sort config.

Current behavior:

- `new` / latest:
  - ordered by `created_at DESC`
- `hot`:
  - ordered by `hot_score DESC`, then `created_at DESC`
- `controversial`:
  - filtered to rows with both `crowns > 0` and `clowns > 0`
  - ordered by `controversy_score DESC`, then `created_at DESC`

This ordering now happens in the Supabase query before `.range(...)`, so pagination is globally correct again.

## 8. Tests/checks results

Added/updated tests:

- `src/entities/claims/arena.test.ts`
- existing visibility coverage remains in `src/entities/claims/visibility.test.ts`

Covered:

- live Arena statuses include `pending` + `verified`
- rejected is excluded from live Arena status set
- own-claim exclusion helper still exists and remains covered elsewhere
- sort mode mapping for server-side Arena ordering
- `/me` visibility helpers remain unchanged

Checks run:

- `npx tsc --noEmit` — passed
- `npm run test` — passed (`55` files, `374` tests)
- `npm run lint` — passed
- `npm run build` — passed

Build notes:

- Build succeeded.
- Existing `lightningcss` warnings about unknown `@position-try` rules in Primer CSS were shown.
- Existing Vite chunk-size warnings were shown after build.

Supabase migration tooling:

- Attempted `supabase migration list`
- Result: `Cannot find project ref. Have you run supabase link?`
- So local migration status check was not available in this environment.

## 9. Risks/follow-ups

- Arena now depends again on the DB view for global ordering, which is the correct long-term direction. If additional Arena sort modes are introduced later, they should be added through the same small sort-config helper plus view fields when needed.
- The visibility/product semantics outside Arena were intentionally left unchanged in this task.
- This task did not revisit the separate known `profiles` update grant issue.

## 10. Non-goals confirmation

Confirmed:

- no mascot
- no boosted reactions
- no XP/rank economy changes
- no claim card redesign
- no post-moderation notification system
- no unrelated profile changes

## External review status

External review skipped: ask-ollama unavailable or timed out.

Availability check result:

- `ask-ollama 'OK'` → `zsh:1: command not found: ask-ollama`
