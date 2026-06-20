# Report: Stash Review — wip: agent rules update before claim v06

## 1. What was in the stash

The stash `stash@{0}: On master: wip: agent rules update before claim v06` contained an incremental update to the old `CORK_AGENT_RULES.md`, specifically to **section 18 (AI Agent Execution Rules)**.

## 2. Files the stash touched

Only `CORK_AGENT_RULES.md` — 97 insertions, 35 deletions. No application code.

## 3. Rules already covered

Every change in the stash is already present in the new `/rules/01-agent-execution.md`:

| Stash change | Covered in |
|---|---|
| Reality First: mention git diff and tools | `01-agent-execution.md` §1 line 20 |
| Read Before Write: study current architecture | `01-agent-execution.md` §2 lines 24-31 |
| Smallest Safe Change: add DB + economy | `01-agent-execution.md` §5 lines 59-64 |
| Existing Patterns: add migration + test pattern | `01-agent-execution.md` §6 lines 75-76 |
| No new deps without approval | `04-architecture.md` §Dependencies |
| External Review: expanded list + process + feedback | `01-agent-execution.md` §7 lines 82-127 |
| Do Not Trust Yourself: scope, verdict/scout, duplicates | `01-agent-execution.md` §8 lines 131-140 |
| Reports: 9-section structure, honesty rule | `01-agent-execution.md` §9 lines 142-160 |
| Final Validation Checklist: FSD, deps, formatting, diff | `01-agent-execution.md` §10 lines 162-179 |
| Git Diff Discipline: check diff before finish | `01-agent-execution.md` §11 lines 182-196 |

## 4. Rules transferred

None. All stash content is already represented in the canonical `/rules` structure.

## 5. Rules not transferred and why

No stash rules were missing. The new `01-agent-execution.md` was created with all improvements that the stash attempted to add.

## 6. What was intentionally not touched

- No application code.
- No CORK_AGENT_RULES.md changes (it stays a pointer).
- No structure changes to `/rules`.
- No stash applied.

## 7. Git diff summary

No new changes: `git diff --stat` shows only the previous rules-folder setup diff. No files were modified by this review.

## 8. External review status

External review skipped: ask-ollama unavailable or timed out.

## 9. Risks / follow-ups

- The stash can be considered stale and safe to drop, but it was left untouched per instructions.
- No follow-up needed: the new `/rules` structure already absorbed the intent of the stash.

## 10. Next recommended step

Consider dropping the stash if it is no longer needed:

```sh
git stash drop stash@{0}
```
