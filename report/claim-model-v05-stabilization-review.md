# Claim Model v0.5 — Stabilization Review

## 1. Executive Summary

**Status: ✅ Ready for commit, with one cleanup note.**

The Claim Model v0.5 sprint successfully introduces a domain transition layer from `Achievement` to `Claim` without DB migration. The composer writes claim intent into `Achievement.meta`, and all three read surfaces (Profile, Admin, Feed) display claim badges through a shared `ClaimBadge` component. No store API breakage, no global rename, no new dependencies. 338 tests pass, `tsc --noEmit` clean, `lint` clean.

**One pre-existing unrelated diff** (`CORK_AGENT_RULES.md`) should be excluded from the commit or committed separately.

**One scope creep** in AdminPage (copy changes "достижение" → "заявка") — minor but worth documenting.

## 2. Files Changed by Sprint

### Claim entity (new / modified)

| File | Change | Status |
|------|--------|--------|
| `src/entities/claims/types.ts` | Added `Claim`, `ClaimMeta`, `ClaimType`, `ClaimSubjectType`, `ClaimStatus` | No diff (committed) |
| `src/entities/claims/mapper.ts` | `achievementToClaim()`, `claimMetaFromAchievementMeta()` | No diff (committed) |
| `src/entities/claims/mapper.test.ts` | 16 tests | No diff (committed) |
| `src/entities/claims/helpers.ts` | `buildClaimMeta()`, `defaultSubjectTypeForClaimType()` | No diff (committed) |
| `src/entities/claims/helpers.test.ts` | 19 tests | No diff (committed) |
| `src/entities/claims/display.ts` | +`shouldShowClaimBadgeParts()`, `shouldShowClaimBadge` → wrapper | **Modified** |
| `src/entities/claims/display.test.ts` | +12 shouldShowClaimBadgeParts tests | **Modified** |
| `src/entities/claims/index.ts` | +`shouldShowClaimBadgeParts`, +`ClaimBadge` | **Modified** |
| `src/entities/claims/ui/ClaimBadge.tsx` | **New** — shared badge component | **New** |
| `src/entities/claims/ui/index.ts` | **New** — barrel | **New** |

### Touched surfaces

| File | Change | Status |
|------|--------|--------|
| `src/features/profile/AchievementCard.tsx` | Inline badge → `ClaimBadge` | **Modified** |
| `src/pages/AdminPage.tsx` | Inline badge → `ClaimBadge` + copy changes | **Modified** |
| `src/pages/FeedPage.tsx` | Inline badge → `ClaimBadge` + `meta` field | **Modified** |
| `src/features/profile/AddAchievementModal.tsx` | No change (already imported claims) | Clean |
| `src/pages/ProfilePage.tsx` | No change (uses AchievementCard) | Clean |

### Reports

| Report | Status |
|--------|--------|
| `report/claim-model-v05-step1.md` | **❌ MISSING** |
| `report/claim-model-v05-step2.md` | ✅ Present |
| `report/claim-model-v05-step3.md` | ✅ Present |
| `report/claim-model-v05-step4.md` | ✅ Present |
| `report/claim-model-v05-step5.md` | ✅ Present (but untracked) |
| `report/claim-model-v05-step6.md` | ✅ Present (but untracked) |
| `report/claim-model-v05-step7.md` | ✅ Present (but untracked) |

## 3. Pre-existing Unrelated Diffs

### CORK_AGENT_RULES.md (+132/-58)

This file has a large diff that is **not** part of Claim Model v0.5. It contains updates to AI agent execution rules (sections 18.8 External Review Policy, 18.10 Reports Are Mandatory, 18.11 Completion Checklist, 18.12 Git Diff Discipline). These are operational rules for the agent, not application code.

**Recommendation**: Exclude from commit or commit separately as `docs: update agent rules`. Do not bundle with claim model changes.

## 4. Architecture Assessment

### FSD Boundaries
- ✅ Claim entity exports to features/pages via `index.ts` — proper barrel.
- ✅ `AchievementCard` import from `@/entities/claims` — clean.
- ✅ `AdminPage` import from `@/entities/claims` — clean.
- ✅ `FeedPage` import from `@/entities/claims` — clean.
- ✅ `AddAchievementModal` import from `@/entities/claims` — already correct, no diff.
- ✅ No feature imports from other feature internals.
- ✅ No cycles.

### ClaimBadge Component API
- ✅ Accepts `{ type, subjectName?, thread?, className? }` — clean, no full `Claim` dependency.
- ✅ Uses `shouldShowClaimBadgeParts()` internally; consumers don't need visibility logic.
- ✅ `className` prop allows margin customization per surface (`mb-1` vs `mt-0.5`).

### Domain Safety
- ✅ `safeClaimType()` / `safeSubjectType()` with fallback to `self_achievement` / `self`.
- ✅ `readString()` returns `undefined` for non-string or empty values.
- ✅ `buildClaimMeta()` trims and validates before writing.
- ✅ `shouldShowClaimBadgeParts()` hides default `self_achievement` without subjectName/thread.

## 5. Product Assessment

### What changed for users
- **New**: Claim type badges visible on all achievements (Profile, Admin, Feed).
- **New**: Subject name ("о: ...") and thread ("# ...") shown when present.
- **New**: Default `👤 Моё` is hidden for achievements without subject/thread (noise reduction).
- **Copy change**: Admin panel now says "заявка" instead of "достижение" in 6 places.

### What did NOT change
- ✅ No DB schema change.
- ✅ No store API change.
- ✅ No global rename (Achievement still main entity in DB).
- ✅ No behavior change for existing achievements without meta.
- ✅ No layout-breaking changes.

### Scope Creep Detected

**AdminPage copy changes** (6 places):
- "Отклонить достижение" → "Отклонить заявку"
- "Не удалось загрузить достижения" → "Не удалось загрузить заявки"
- "Достижение подтверждено" → "Заявка подтверждена"
- "Достижение отклонено" → "Заявка отклонена"
- "Модерация достижений" → "Модерация заявок"
- "Нет достижений на проверке" → "Нет заявок на проверке"

These are UI copy changes that are not required by the Claim domain model. They are minor and arguably beneficial, but constitute scope creep from the original sprint plan. **Acceptable but documented.**

## 6. Test / Validation Results

| Check | Result |
|-------|--------|
| `npm run test` | ✅ 338 passed (50 test files) |
| `npx tsc --noEmit` | ✅ Clean |
| `npm run lint` | ✅ Clean |

### Test Coverage by Module

| Module | Tests | Coverage |
|--------|-------|----------|
| `mapper.test.ts` | 16 | old meta, null meta, invalid meta, all statuses, field mapping |
| `helpers.test.ts` | 19 | buildClaimMeta defaults, trimming, optional fields, eventDate |
| `display.test.ts` | 47 (35 old + 12 new) | all claim types, whitespace, shouldShowClaimBadgeParts |

### Edge Cases Covered
- ✅ Old achievements without meta → `self_achievement` / `self` defaults
- ✅ Null `meta` → handled via `?? {}`
- ✅ Invalid types in meta → safe fallback
- ✅ Empty strings → `undefined`
- ✅ Whitespace-only fields → stripped / treated as empty
- ✅ All 8 claim types tested in display
- ✅ All 7 subject types tested in display

### Missing Tests
- No UI tests for `ClaimBadge` component (decision documented — no existing pattern for entity UI component tests in project)
- No integration test for the full claim write → read cycle (end-to-end through Supabase)

## 7. External Review Status

**ask-ollama (gemma3:4b)**: Timed out (MCP error -32001). Manual review performed against the same checklist.

## 8. Known Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| New achievements written by old code without claim meta | Low | `safeClaimType` defaults to `self_achievement`; badge hidden by `shouldShowClaimBadgeParts` |
| Old code overwrites meta on edit | Low | No edit path in current code that touches `meta` |
| Admin copy change may confuse users who expect "достижение" | Low | "заявка" is more accurate; users already use this term in UI |
| Premature commit bundles CORK_AGENT_RULES.md unrelated | Low | Can `git add` selectively |

## 9. Recommended Immediate Cleanup

1. **Exclude `CORK_AGENT_RULES.md` from the claim model commit** — this diff is unrelated and should either be stashed or committed separately.
2. **Create `report/claim-model-v05-step1.md` if possible**, or add a retrospective note referencing that Step 1 established the entity foundation.
3. **Add reports step5–step7 to git tracking** (they're currently untracked).

## 10. Recommended Next Step

**Recommendation: Option C — Commit/merge first, then plan next feature.**

### Option A: claimType filter in Arena ⭐ (Recommended after commit)
Add `claimType` filter to the Arena feed. Users can filter by claim type (fail, flex, discovery, etc.). This builds directly on the ClaimBadge infrastructure and uses existing `claimMetaFromAchievementMeta` data.

### Option B: DB migration planning
Consider whether `claim_type`, `subject_type`, `subject_name`, `thread` should move from `meta` to dedicated columns. This enables DB-level filtering and indexing. **Recommended when claimType filter performance becomes a concern.**

### Option C: Commit/merge first (Recommended now)
The sprint is functionally complete, all tests pass, and there are no blocking issues. The remaining step is to:
1. `git add` selectively (exclude `CORK_AGENT_RULES.md`).
2. Commit with message describing all 7 steps.
3. Merge or review PR.

## 11. Clear Recommendation

**Commit the sprint now.** The Claim Model v0.5 is stable, tested, and risk-free. Exclude `CORK_AGENT_RULES.md` from the commit. Proceed to **Option A: claimType filter in Arena** as the next feature.
