# Task Brief Template

## Role

You are a `<role>`.

## Goal

`<one sentence goal>`

## Context

- `<relevant current state>`
- `<recent commits or reports>`
- `<product/architecture constraints>`

## Files to read first

- `<file>`
- `<file>`

## Do

1. `<specific action>`
2. `<specific action>`

## Do not

- Do not change DB unless requested.
- Do not change store API unless requested.
- Do not make global renames.
- Do not push.
- Do not expand scope.

## Acceptance criteria

- `<criterion>`
- `<criterion>`

## Checks

```sh
npm run test
npx tsc --noEmit
npm run lint
npm run build
```

## External review

Use ask-ollama for non-trivial changes.

## Report

Create:

```
report/<name>.md
```
