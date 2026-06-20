# 06. Data and Supabase Rules

Supabase is the source of truth.

## Migrations

Database migrations must be dedicated tasks.

Do not change schema as part of a UI-only task.

Do not add, remove, or rename columns without:

1. migration plan
2. compatibility plan
3. seed/update plan
4. RLS review
5. explicit user approval

## RLS and Auth

Do not change RLS/auth policies casually.

Any RLS/auth change requires explicit review and testing.

## Current Claim storage

At the current stage, claim data may be stored in `achievements.meta`.

Known fields:
- `claim_type`
- `subject_type`
- `subject_name`
- `thread`
- `event_date`

Dedicated columns may be added later, but only through a planned migration.

## Pending moderation

`pending` means waiting for moderation.

It is not publicly on trial yet.

UI must not imply pending items are already judged by the crowd.

## Seed data

Seed data may contain legacy values.

Do not rewrite seed data as part of UI cleanup unless explicitly requested.

## Backward compatibility

Old rows without claim metadata must render safely.

Invalid metadata must fall back safely.

Old `claim_angle` values may remain in DB but should not drive public UI semantics.
