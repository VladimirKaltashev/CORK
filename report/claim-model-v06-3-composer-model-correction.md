# Claim Model v0.6.3 — Composer Model Correction

## 1. What user reported

1. Composer still shows old verdict-angle chips (👑 На корону / 🤡 На клоуна / ⚖️ Рассудите) — author should not pre-select verdict direction.
2. Category chips in the form look like a competing taxonomy layer vs claim types.
3. Placeholder text still references old "достижение / понт" framing.

## 2. Actual save payload (before)

AddAchievementModal → `addAchievement()` passes to store:

```ts
{
  userId,         // user.id
  category,       // 'other' (default), from category chips
  title,          // trimmed text
  description,    // full text
  year,           // from date picker
  proofType,      // 'none' | 'photo' | 'url'
  proofValue,     // optional
  claimAngle,     // 'judge' (default), from removed angle chips
  meta,           // { claim_type, subject_type, subject_name?, thread?, event_date? }
}
```

Store `addAchievement()` → Supabase `achievements` table insert:

| Column | Source | Value |
|---|---|---|
| `user_id` | `data.userId` | user.id |
| `category` | `data.category` | 'other' (default) |
| `title` | `data.title` | truncated text |
| `description` | `data.description` | full text |
| `year` | `data.year` | from date picker |
| `proof_type` | `data.proofType` | 'none'/'photo'/'url' |
| `proof_value` | `data.proofValue` | optional |
| `claim_angle` | `data.claimAngle` | default 'judge' |
| `status` | **hardcoded** | `'pending'` |
| `meta` | `data.meta` | JSON blob |

The `meta` JSON blob contains the Claim Model fields: `claim_type`, `subject_type`, `subject_name`, `thread`, `event_date`.

## 3. What fields are still saved and why

| Field | Saved? | Reason |
|---|---|---|
| `claim_angle` | Yes, as `'judge'` | DB column exists; kept as backward-compatible default |
| `claim_type` | Yes, in `meta.claim_type` | Core Claim Model field |
| `subject_type` | Yes, in `meta.subject_type` | Core Claim Model field |
| `subject_name` | Yes, in `meta.subject_name` | Optional contextual info |
| `thread` | Yes, in `meta.thread` | Display-only for now |
| `category` | Yes, as `achievements.category` | Required by Supabase schema; legacy achievement feed |
| `status` | Yes, as `'pending'` | Moderation flow requires this |

## 4. What changed in composer UI

| Element | Before | After |
|---|---|---|
| ANGLES constant | `[{ king, clown, judge }]` | Removed entirely |
| Claim angle chips section | 👑🤡⚖️ visible row | Removed entirely |
| `claimAngle` state | `useState<ClaimAngle>('judge')` | Removed (state variable deleted) |
| Submit payload | `claimAngle` (from state) | `claimAngle: 'judge'` (hardcoded) |
| Category section label | *(none)* | `Раздел архива` with helper text |
| Placeholder text | "Что выносим? Достижение, фейл, понт, находку — что угодно." | "Что выносим? Фейл, flex, находку, спорный кейс или проект." |

## 5. What happened to claimAngle

- UI chips removed entirely.
- State variable removed (no more `useState<ClaimAngle>('judge')`).
- Submit payload hardcodes `claimAngle: 'judge'` for backward DB compatibility.
- `ClaimAngle` import removed from `AddAchievementModal.tsx` (no longer needed).

## 6. What happened to `status: 'pending'`

**Nothing changed.** The `status: 'pending'` is hardcoded in `achievements/store.ts` line 75 and is correct — the claim is sent to moderation, not to the arena. The UI copy from v0.6.2 ("Отправить на проверку") already reflects this honestly.

## 7. What happened to category chips

- Category chips **remain** (Supabase schema requires `category` column).
- Added label: **Раздел архива**
- Added helper: *Для старой ленты и совместимости. Главный смысл задаётся типом заявки выше.*
- The `Тип заявки` section above remains the primary semantic field.

## 8. What was intentionally NOT done

- **claim_angle DB column removal** — not touched. Column remains for backward compatibility.
- **Category column removal from schema** — not touched. Required for legacy feed.
- **Claim-type-based category auto-setting** — not implemented. Future work.
- **Store API change** — `addAchievement` signature unchanged.
- **No DB migration, Supabase schema change, RLS/auth, reactions/budget, global rename, or new UI library.**

## 9. Tests/checks and results

| Command | Result |
|---|---|
| `npm run test` | 51 files, 356 passed |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | Clean |
| `npm run build` | Success |

No new tests added — changes are UI/copy-only in AddAchievementModal. Existing tests unchanged.

## 10. git diff summary (v0.6.3 only — AddAchievementModal)

```
 src/features/profile/AddAchievementModal.tsx | 54 +++++----------------
 1 file changed, 11 insertions(+), 43 deletions(-)
```

Combined diff (v0.6.2 + v0.6.3 uncommitted):

```
 src/features/profile/AddAchievementModal.tsx  | 54 +++++----------------
 src/features/profile/CreateAchievementFAB.tsx |  4 +-
 src/pages/ChallengesPage.tsx                  | 68 +++++++--------------------
 src/pages/FeedPage.tsx                        | 34 ++------------
 4 files changed, 32 insertions(+), 128 deletions(-)
```

No Supabase migration, no store API change, no reaction/budget file touched.

## 11. External review status

ask-ollama unavailable (server not reachable). Manual review performed — all items on checklist pass.

## 12. Risks / follow-ups

- **claimAngle default safe:** `'judge'` hardcoded in submit payload matches old default. No regression possible.
- **Pending status preserved:** Moderation flow unchanged. Copy already honest.
- **Category remains:** Label + helper explain legacy role. No confusion with claim type.
- **Claim Model fields in meta:** Still stored correctly via `buildClaimMeta()`. No payload regression.
