# Profile / My Claims split v1 — Review & Polish

## 1. What was checked

| # | Check | Result |
|---|---|---|
| 1 | User-facing old achievement language (`Достижения`, `achievement`, `Achievement`) | **Found in 2 files** → fixed |
| 2 | Own profile should show compact stats + link to /me, not old claims list | ✅ Correct |
| 3 | `/me` page title, copy, filter honesty | ✅ Correct |
| 4 | Public profile should not call claims `Достижения`; owner-only details hidden | ✅ Correct |
| 5 | Self-vote hidden for own claims across all surfaces | ✅ Correct |
| 6 | Scope — no DB/schema/economy/mascot | ✅ Confirmed |

## 2. Files changed (review only)

| File | Change |
|---|---|
| `src/features/feed/FeedList.tsx:11` | `🏅 Достижения` → `⚖️ Заявки` (arena feed filter label) |
| `src/features/feed/CreateAchievementForm.tsx:28` | `достижения` → `заявки` (admin error message) |
| `src/features/feed/CreateAchievementForm.tsx:34` | `Достижение добавлено!` → `Заявка добавлена!` (toast) |
| `src/features/feed/CreateAchievementForm.tsx:70` | `Добавить достижение` → `Добавить заявку` (button text) |

## 3. Copy fixes made

Three user-facing strings still used old `Достижения` language:

1. **Arena filter label** (`FeedList.tsx`): `🏅 Достижения` → `⚖️ Заявки` — the feed filter for claims should say "Заявки" (claims), not "Достижения" (achievements). Emoji changed from medal to scales to match arena semantics.

2. **Admin form toast** (`CreateAchievementForm.tsx`): `Достижение добавлено!` → `Заявка добавлена!` — consistent with Claim Model.

3. **Admin form button** (`CreateAchievementForm.tsx`): `Добавить достижение` → `Добавить заявку` — same reasoning.

4. **Admin form error** (`CreateAchievementForm.tsx`): `достижения` → `заявки` — same.

The `CreateAchievementForm.tsx` is the old legacy admin-only feed achievement form. The internal API call still uses `/achievements`, types still use `FeedItem` / `achievement` — that's fine (preserved for backward compat). Only user-facing copy was changed.

## 4. Tests/checks results

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npm run test` | 52 files, 362 passed |
| `npm run lint` | Clean |
| `npm run build` | Success |

## 5. Remaining risks / follow-ups

- **No remaining user-facing `Достижения`** — after these fixes, the search found zero occurrences in `.tsx` files (only internal types/store/API references remain).
- **`CreateAchievementForm.tsx` is legacy dead code** — it's the old admin-only feed form. It still works but is not the main claim entry point. The new claim composer is `AddAchievementModal.tsx`. Consider removing `CreateAchievementForm.tsx` entirely in a future cleanup.
- **`FilterType` in feed store** still uses `'achievement'` as internal value — that's fine, not user-facing.
- **Self-vote wiring** was confirmed in all 3 surfaces:
  - Feed cards (`FeedPage.tsx:436`)
  - Profile cards (`AchievementCard.tsx:140`)
  - Challenge entries (`ChallengeDetailPage.tsx:184`)
- **Коронованы / Заклоунены** filter labels on `/me` page — these are based on live verdict aggregates, not final settlement. The report's risk note is still valid, but the current copy is acceptable because:
  - The `/me` subtitle honestly says "заявками, проверкой и исходами арены"
  - The "На арене" filter implies ongoing process
  - No words like `итоговые`, `финальные`, `завершённые` are used

## 6. Scope confirmation

Confirmed:

- ❌ no DB changes
- ❌ no Supabase schema or migration changes
- ❌ no reaction storage model changes
- ❌ no XP/rank economy changes
- ❌ no mascot UI changes
- ❌ no large architecture rewrites
- ❌ no boosted reactions
- ❌ no post-moderation
- ❌ no claim card redesign
- ❌ no icon assets added
- ✅ only user-facing copy fixed in 2 files
