# 03. Domain Model

This file defines current CORK domain concepts.

## Claim Model

Current claim types:

```ts
type ClaimType =
  | 'self_achievement'
  | 'other_achievement'
  | 'fail'
  | 'flex'
  | 'discovery'
  | 'debate'
  | 'absurd'
  | 'organization'
```

Current subject types:

```ts
type ClaimSubjectType =
  | 'self'
  | 'person'
  | 'organization'
  | 'project'
  | 'event'
  | 'internet'
  | 'unknown'
```

Current claim statuses:

```ts
type ClaimStatus =
  | 'unverified'
  | 'verified'
  | 'disputed'
  | 'hidden'
  | 'rejected'
```

## Legacy storage

At the current stage, the achievements table may remain the storage layer.

Claim fields may live in `achievements.meta`:

- claim_type
- subject_type
- subject_name
- thread
- event_date

Do not mass rename achievements to claims without a dedicated migration/refactor plan.

## Legacy claim_angle

`claim_angle` is a legacy/internal compatibility field.

Rules:

- it may remain in DB/store/types
- new writes may default to `'judge'` if schema requires it
- do not expose На корону / На клоуна / Рассудите as public UI meaning
- crowd verdict must come from reactions/verdict bar

## Moderation

Current moderation may still use:

- pending
- verified
- rejected

`pending` means the claim is sent to review.

Pending does not mean publicly judged.

## Verdict economy

Current reaction economy:

- crown = 1 vote cost
- clown = 2 vote cost
- weekly budget = 10
- crowd verdict comes from reaction totals

Do not change reaction cost, budget, or reset logic without explicit product approval.

## Scout economy

Scout mechanics are useful but should not be noisy.

Scout Score and scouting breakdowns may be useful on own dashboard, but they should not automatically appear as unexplained public profile noise.

## Threads

`thread` may exist as display metadata.

If thread filtering/navigation is not implemented, UI must not imply that it is functional.

Use honest copy such as:

> Пока только отображается на карточке. Фильтр по веткам появится позже.

## Challenges

A challenge is an arena with a theme, deadline, rules, submissions, and verdicts.

Avoid UI that makes featured challenges look like duplicated list cards.

Challenge cards should answer:

- what to bring
- how to win
- how much time remains
- what roles/rewards exist
