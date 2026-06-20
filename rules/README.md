# CORK Rules

This folder is the canonical source of project rules for AI agents and human contributors.

Rules are operational, not decorative. They define how to work on CORK safely.

## Priority

These rules have the same priority as any existing project-level agent instructions.

If two rules conflict:

1. Safety and user instructions win.
2. Product model wins over implementation convenience.
3. Existing architecture wins over new abstractions.
4. Small safe changes win over broad refactors.
5. When uncertain, stop and ask the user.

## Required reading

For every non-trivial task, read:

1. `rules/README.md`
2. `rules/01-agent-execution.md`

Then read relevant task-specific files:

| Task type | Read additionally |
|---|---|
| Product/domain work | `02-product-model.md`, `03-domain-model.md` |
| Frontend/code architecture | `04-architecture.md` |
| UI/visual work | `05-ui-visual.md` |
| Database/Supabase work | `06-data-supabase.md` |
| Testing/reporting | `07-testing-reporting.md` |
| Git/commit/push | `08-git-workflow.md` |

## Rules vs reports

- `/rules` contains stable rules.
- `/report` contains historical task reports.
- Do not put temporary task reports in `/rules`.
- Do not put canonical rules only in `/report`.

## Updating rules

Rules may be changed only in a dedicated documentation/rules task.

A rules update must:

1. Avoid application code changes.
2. Explain what changed and why.
3. Create a report in `/report`.
4. Avoid duplicate rule sources.
