# Claim Model v0.5 — Step 7: Extract shared ClaimBadge component

## What was done

Extracted 3 duplicated badge JSX blocks into a shared `ClaimBadge` component at `src/entities/claims/ui/ClaimBadge.tsx`. The component accepts `{ type, subjectName?, thread?, className? }` instead of a full `Claim` object, avoiding the need for FeedPage to construct fake `Claim` instances.

## Files changed

| File | Change |
|------|--------|
| `src/entities/claims/display.ts` | Added `shouldShowClaimBadgeParts(type, subjectName?, thread?)`; `shouldShowClaimBadge` is now a thin wrapper |
| `src/entities/claims/display.test.ts` | +12 tests for new helper (47 total, was 35) |
| `src/entities/claims/ui/ClaimBadge.tsx` | **new** — shared dumb component |
| `src/entities/claims/ui/index.ts` | **new** — barrel export |
| `src/entities/claims/index.ts` | Export `ClaimBadge` + `shouldShowClaimBadgeParts` |
| `src/features/profile/AchievementCard.tsx` | Replace inline badge with `<ClaimBadge>` |
| `src/pages/AdminPage.tsx` | Replace inline badge with `<ClaimBadge>` |
| `src/pages/FeedPage.tsx` | Replace inline badge + remove `showBadge` variable |

## Design decisions

- **No full `Claim` in API**: `ClaimBadge` accepts primitives only. FeedPage passes `claimMeta.claimType!`, `claimMeta.subjectName`, `claimMeta.thread` without constructing a fake `Claim`.
- **Helper split**: `shouldShowClaimBadgeParts()` is the pure logic; `shouldShowClaimBadge()` is a thin wrapper for backwards compat.
- **No ui barrel in entity index**: `ClaimBadge` is exported through `ui/index.ts` and re-exported in the entity `index.ts`, following the same pattern as other entity exports.

## What was intentionally NOT done

- No UI tests for `ClaimBadge` component (no existing pattern for entity UI component tests in project).
- No barrel re-export of `*/ui/ClaimBadge` through a ui-specific barrel — kept flat through entity `index.ts`.

## Verification

| Check | Result |
|-------|--------|
| `npm run test` | 338 passed (326 + 12 new) |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | Clean |

## External review

**ask-ollama (gemma3:4b)**: Review completed. Feedback was general (type definitions, edge cases). All concerns were already addressed:
- Prop types are defined via `ClaimBadgeProps` interface using `ClaimType` from `types.ts`
- Edge cases (whitespace, all claim types, null/undefined) are covered by the 12 new tests
- Barrel export pattern matches project conventions

## Risks

None. Refactor-only change with no behavior or copy diff. All badges render identically.

## Next recommended step

Step 8: Add `claimType` filter to feed filter UI (feature/feed filter by claim type badge).
