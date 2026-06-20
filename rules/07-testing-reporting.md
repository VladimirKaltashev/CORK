# 07. Testing and Reporting Rules

## Required checks

For meaningful code changes, run:

```sh
npm run test
npx tsc --noEmit
npm run lint
```

For UI/build-sensitive changes, also run:

```sh
npm run build
```

Do not claim checks passed unless command output confirms it.

## Tests

Add tests when:
- pure helpers are added
- domain logic changes
- mapper behavior changes
- filtering/parsing logic changes
- bugs are fixed in reusable logic

UI-only/copy-only changes may skip new tests if there is no existing lightweight UI test pattern.

If tests are not added, explain why in the report.

## Reports

Every meaningful session must create or update a report in `/report`.

Report file naming:

```
report/<feature-or-step>.md
```

Suggested structure:

1. What was done.
2. Files changed.
3. Decisions made.
4. What was intentionally not done.
5. Tests/checks and results.
6. Git diff summary.
7. External review status.
8. Risks/follow-ups.
9. Next recommended step.

## External review status

Every report for non-trivial changes must include one of:

> External review completed.

or:

> External review skipped: ask-ollama unavailable or timed out.

## Honesty

Do not write that tests, lint, build, review, commit, or push happened unless they actually happened.
