# External Review Prompt Template

Review this CORK git diff.

Context:

`<short context>`

Show me:

1. bugs
2. regressions
3. missing tests
4. edge cases

Also check:

- no `any`
- no unrelated scope creep
- no DB migration unless requested
- no store API change unless requested
- product model respected
- architecture/FSD boundaries respected
- report exists in `/report`

If you find issues, distinguish between:

- blocking bug
- non-blocking improvement
- out-of-scope suggestion
