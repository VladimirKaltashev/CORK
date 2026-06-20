# Report: Rules Folder Setup

## 1. What was done

Created canonical `/rules` documentation folder and replaced `CORK_AGENT_RULES.md` with a short pointer file.

## 2. Files created

```
rules/README.md
rules/01-agent-execution.md
rules/02-product-model.md
rules/03-domain-model.md
rules/04-architecture.md
rules/05-ui-visual.md
rules/06-data-supabase.md
rules/07-testing-reporting.md
rules/08-git-workflow.md
rules/templates/task-brief.md
rules/templates/report.md
rules/templates/external-review.md
report/rules-folder-setup.md
```

## 3. CORK_AGENT_RULES.md changes

The old file (858 lines, ~24 KB) was replaced with a short pointer file pointing to `/rules`. The old content is still available via git history.

## 4. Stash

Found stash `stash@{0}: On master: wip: agent rules update before claim v06`. Not applied. No action taken.

## 5. What was intentionally not touched

- No application code (src/, supabase/, package files, tests, routes, UI).
- No database migrations.
- No existing report files in `/report` or `/reports`.
- No docs/ folder contents.
- No git commits or pushes.
- No stash applied.

## 6. Checks

- `git status --short`: clean working tree before start.
- No markdown linter configured in package.json — skipped.

## 7. Git diff summary

```
CORK_AGENT_RULES.md                       | 17 +-
rules/01-agent-execution.md                | 160 ++++++++
rules/02-product-model.md                  |  96 +++++
rules/03-domain-model.md                   | 109 ++++++
rules/04-architecture.md                   |  79 ++++
rules/05-ui-visual.md                      | 132 +++++++
rules/06-data-supabase.md                  |  54 +++
rules/07-testing-reporting.md              |  56 +++
rules/08-git-workflow.md                   |  64 +++
rules/README.md                            |  53 +++
rules/templates/external-review.md         |  30 ++
rules/templates/report.md                  |  20 ++
rules/templates/task-brief.md              |  43 +++
report/rules-folder-setup.md               |  69 +++
```

Only documentation files changed. No application code.

## 8. External review status

External review skipped: ask-ollama unavailable or timed out.

## 9. Risks / follow-ups

- Old rules content (858 lines) may still be referenced by agents expecting CORK_AGENT_RULES.md to contain full rules. The pointer file guides them to `/rules`.
- The stash `wip: agent rules update before claim v06` may contain relevant updates that should be reviewed and merged into the new structure.
- Markdown lint is not configured — consider adding a markdown lint job.
- Old `reports/` folder (different from `/report`) may cause confusion — consider consolidation later.

## 10. Next recommended step

Review the existing stash `wip: agent rules update before claim v06` and merge any relevant updates into `/rules`. Then consider configuring a markdown linter.
