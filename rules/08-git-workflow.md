# 08. Git Workflow Rules

## Before work

Always check:

```sh
git status --short
git log -1 --oneline
git branch --show-current
```

If the working tree is dirty, identify whether changes are expected.

Do not mix unrelated changes.

## Staging

Stage exact files.

Avoid broad `git add .` unless the diff has been fully inspected and is intentionally scoped.

Before commit:

```sh
git diff --cached --stat
git status --short
```

## Commits

Use scoped commit messages:

- `feat(claims): ...`
- `fix(ui): ...`
- `refactor(ui): ...`
- `chore(rules): ...`
- `docs(rules): ...`

Do not commit unless the user approves.

Do not amend unless the user approves.

## Push

Never push without explicit user approval.

Before push:

```sh
git status --short
git log -1 --oneline
git branch --show-current
```

After push:

```sh
git status --short
git status -sb
git log -1 --oneline
```

## Unrelated dirty files

If an unrelated dirty file exists:

1. Do not stage it.
2. Ask user or stash only that file.
3. Record what happened.

Example:

```sh
git stash push -m "wip: unrelated rules update" -- CORK_AGENT_RULES.md
```

## Reports and commits

Reports belong in the same commit as the work they document, unless the user says otherwise.

## No secrets

Before commit, check that no secrets, tokens, private URLs, generated assets, or temporary files are staged.
