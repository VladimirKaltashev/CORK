# Claim Model v0.6.5 — Profile/Card Public-UI Noise Cleanup

## 1. What was done

Cleaned up profile and card UI so that owner-only statuses, progress, and decorative icons are hidden from public profile viewers.

| Change | File | What |
|---|---|---|
| **B. Green checkmark hidden** | `AchievementCard.tsx` + `ProfilePage.tsx` | Added optional `showModerationStatus` prop (default `true`). ProfilePage passes `showModerationStatus={isOwn}`. Verified/pending/rejected badges hidden on other profiles. |
| **C. Scout Score hidden** | `ProfilePage.tsx` | Scout Score section wrapped in `{isOwn && ...}`. |
| **D. Progress-to-Silver hidden** | `ProfilePage.tsx` | Rank card footer (progress text, vote power, proposal text) wrapped in `{isOwn && ...}`. Rank icon, name, total reactions, and progress bar remain visible. |
| **E. 👑/🤡 icons removed from verdict bar** | `ReactionBar.tsx` | Removed CrownIcon/ClownIcon `<span>`s from inside the colored bar segments. Bar shows only color proportion + center label. Icons remain in the reaction buttons below and compact counts row. |

## 2. Why

- **Green checkmark** (`StatusBadge`) — shows "verified"/"pending"/"rejected" on every profile card; irrelevant noise on other people's profiles.
- **Scout Score** — personal scouting stats; meaningless clutter on a public profile.
- **Progress-to-Silver** — personal rank progress ("До Silver: X") and vote power; doesn't belong on someone else's profile.
- **Verdict bar icons** — small 👑/🤡 inside the bar are decorative duplicates of the reaction buttons below. Bar color + center label already convey the verdict.

## 3. What was NOT changed

- **Database, Supabase schema, RLS, auth** — no backend changes.
- **AdminPage** — uses `AchievementCard` without `showModerationStatus` (defaults to `true`), so admin still sees full moderation badges.
- **Compact mode** (`compact` prop on `ReactionBar`) — the emoji counts `👑 X  🤡 Y` remain above the thin bar.
- **Reaction buttons** — CrownIcon/ClownIcon in the vote buttons are untouched.
- **ScoreBlock** (profile crown/clown totals) — visible to everyone (public info).
- **Rank card header** (icon, name, total reactions, progress bar) — visible to everyone.

## 4. Key design decisions

- `showModerationStatus` defaults to `true` so existing callers (AdminPage) work unchanged.
- Rank card footer is hidden entirely on other profiles rather than showing a simplified version — no meaningful public info to show there.
- Bar icon removal keeps the segments (CSS `cork-verdict-king` / `cork-verdict-clown`) for color proportion; only the inner icon spans are removed.

## 5. Tests/checks

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npm run test` | 51 files, 356 passed |
| `npm run lint` | Clean |
| `npm run build` | Success |

## 6. git diff summary

```
 src/features/profile/AchievementCard.tsx |  6 +++---
 src/features/reactions/ReactionBar.tsx   | 20 ++------------------
 src/pages/ProfilePage.tsx                | 21 ++++++++++++---------
 3 files changed, 14 insertions(+), 33 deletions(-)
```

## 7. Combined diff (v0.6.2–v0.6.5 uncommitted)

```
 src/features/profile/AchievementCard.tsx       | 26 +++++----------
 src/features/profile/AddAchievementModal.tsx   | 54 +++++++--------------------
 src/features/profile/CreateAchievementFAB.tsx  |  4 +--
 src/features/reactions/ReactionBar.tsx         | 20 ++------------
 src/pages/ChallengesPage.tsx                   | 68 ++++++++---------------------------
 src/pages/FeedPage.tsx                         | 59 ++++---------------------------
 src/pages/ProfilePage.tsx                      | 21 ++++++++-------
 7 files changed, 62 insertions(+), 190 deletions(-)
```

## 8. External review

ask-ollama unavailable (server not reachable). Manual review performed.

## 9. Risks / follow-ups

- **No DB changes** — claim_angle, scout score, expert rank data all still stored; just not rendered publicly.
- **AdminPage unaffected** — AchievementCard's `showModerationStatus` defaults `true`; AdminPage doesn't pass the prop.
- **Pending/rejected badges hidden on public profiles** — a public visitor won't see that a claim is pending moderation. Acceptable — moderation is an internal process.
- **Still uncommitted** — v0.6.2 through v0.6.5 are all uncommitted on top of `d3ec85e` (which is itself unpushed).
