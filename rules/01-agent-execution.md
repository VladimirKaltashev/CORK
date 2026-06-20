# 01. Agent Execution Rules

These rules define how AI agents must work in this repository.

## 1. Reality First

Never claim an action was completed unless it was actually completed using tools.

Do not write:
- "tests passed"
- "lint passed"
- "build succeeded"
- "file exists"
- "migration applied"
- "commit created"
- "push completed"

unless this was actually verified.

Always rely on real command output, file contents, git diff, and tool results.

## 2. Read Before Write

Before changing code:

1. Find the existing implementation.
2. Read related files.
3. Understand the existing pattern.
4. Only then write code.

Do not create new architecture without studying current architecture.

## 3. Reuse Before Create

Prefer changing an existing component over creating a new component.

Prefer extending an existing model over creating a new entity.

Prefer simple code over abstraction for abstraction's sake.

If a task can be solved by modifying an existing file, that is preferred.

## 4. Product Before Code

If a user request conflicts with the CORK product model:

1. Explain the conflict.
2. Suggest an alternative.
3. Get confirmation.

Do not implement a mechanic only because it is technically easy.

Architecture serves the product.

## 5. Smallest Safe Change

By default, make the smallest change that solves the task.

Do not do these unless explicitly requested:
- large refactors
- mass renames
- project structure changes
- database changes
- product economy changes

## 6. Existing Patterns Rule

Before creating a new:
- page
- component
- store
- hook
- utility
- API layer
- migration
- test pattern

check whether an analogous pattern already exists.

If it exists, use it.

## 7. External Review Policy

For non-trivial changes, attempt second opinion review through ask-ollama before finishing.

Non-trivial changes include:
- database changes
- architecture changes
- large refactors
- changes over roughly 100 lines
- state management changes
- product economy changes
- auth/RLS/security changes
- CI/CD changes
- test infrastructure changes
- shared/domain type changes
- changes touching multiple feature/entity layers

Process:

1. Check availability:
   ```
   use ask-ollama to say OK
   ```
2. If ask-ollama responds:
   - send current git diff for review
   - request:
     - bugs
     - regressions
     - missing tests
     - edge cases
3. If ask-ollama is unavailable or times out:
   - continue without blocking
   - write in the report:

     External review skipped: ask-ollama unavailable or timed out.

Lack of ask-ollama must not block task completion.

If ask-ollama gives feedback:

1. Fix only real issues.
2. Do not expand scope unnecessarily.
3. Record in the report:
   - findings received
   - what was fixed
   - what was rejected and why

## 8. Do Not Trust Yourself

Before finishing meaningful changes, ask:

- What can break?
- Which scenarios are not covered?
- Which components use this code?
- Is backward compatibility preserved?
- Are tests needed?
- Did scope grow?
- Are CORK verdict/scout rules respected?
- Did duplicate logic appear?

## 9. Reports Are Mandatory

After any meaningful session, create or update a report in `/report`.

A report is required even if code was not changed.

A report must include:

1. What was done.
2. Files changed.
3. Decisions made.
4. What was intentionally not done.
5. Commands/checks run.
6. Results.
7. Risks/follow-ups.
8. External review status.
9. Recommended next step.

Never say checks were run if they were not run.

## 10. Final Validation Checklist

Before finishing:

- [ ] product model respected
- [ ] existing code read before modification
- [ ] no duplicate components introduced
- [ ] FSD structure not violated
- [ ] design system not violated
- [ ] verdict economy not violated
- [ ] scout economy not violated
- [ ] no unnecessary dependencies added
- [ ] no unrelated formatting
- [ ] docs updated if needed
- [ ] report created or updated
- [ ] ask-ollama attempted for non-trivial changes
- [ ] current git diff checked

Only then is a task considered complete.

## 11. Git Diff Discipline

Before final response, inspect current git diff.

Check:

- only expected files changed
- no accidental changes
- no unrelated formatting
- no secrets/tokens
- no temporary files
- no debug/log garbage
- no scope creep

If diff contains unexpected changes, stop and describe the issue.
