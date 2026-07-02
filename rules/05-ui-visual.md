# 05. UI and Visual Rules

CORK UI should feel like a dark arena of verdicts.

That description captures the default CORK world, **Obsidian Blood**. Other theme worlds change the visual genre of the product. See [`09-theme-worlds.md`](09-theme-worlds.md) for the full Theme Worlds model.

Not:
- glossy SaaS
- generic social network
- emoji-first app
- childish gaming UI
- school dashboard

More like:
- dark verdict board
- brutal flat interface
- underground scoreboard
- sharp public arena

## Theme Worlds

CORK themes are not ordinary light/dark skins.
Each theme is a different verdict world: it changes the emotional genre of the app, not just background and accent colors.

> Каждая тема меняет не цвет приложения, а жанр приложения.

A theme may change:

- color palette
- typography
- border style
- radius system
- density
- surface treatment
- shadows
- decorative language
- overall emotional tone

The canonical list of Theme Worlds, plus the deprecation of the old `light`/`dark` framing, lives in `09-theme-worlds.md`.

## Core UI principle

One screen = one main meaning.

If an element does not help the user understand the screen faster, remove it, mute it, or move it to details.

## Screen meanings

Arena/feed:

> What is being judged and what verdict does it have?

Profile:

> Who is this person and what claims are connected to them?

Own profile:

> My dashboard, progress, moderation status, and personal stats.

Admin:

> Moderation.

Composer:

> Quickly create a claim and send it to review.

## Public profile vs own profile

Public profile = reputation.

Own profile = dashboard.

Do not show owner-only details on public profiles:

- moderation checkmarks/statuses
- progress to next rank
- vote power explanation
- internal proposal counters
- unexplained Scout Score breakdowns

These may be shown on own profile if useful.

## Claim card hierarchy

Preferred claim card order:

1. author/time
2. claim type badge and optional thread tag
3. title
4. short description/proof hint
5. verdict bar
6. actions/reactions/comments

Legacy category/year should be muted secondary metadata, not the primary meaning.

## Verdict bar

The verdict bar should be clean.

It may show:
- color proportion
- central label
- compact ratio

It should not contain decorative crown/clown icons inside the bar segments.

Crown/clown icons belong in reaction buttons or compact counts, not inside the bar.

## Filters

Avoid filter chaos.

Maximum visible filter rows on the Arena should usually be:

1. sort/mode row
2. claim type row

Legacy category filters must not visually compete with claim type filters.

## Composer

Composer should not feel like a long form.

Primary visible inputs:

1. text
2. claim type
3. submit

Secondary inputs may be optional/collapsible:
- subject
- proof
- date
- thread
- legacy archive category

Use honest copy:

- "Новая заявка"
- "Отправить на проверку"
- "Заявка отправлена на проверку"

Do not say "Вынесено на суд" for pending claims.

## Icons

Core CORK icons should be flat SVG components.

Rules:
- no emoji as core UI icons
- no gradients
- no glossy highlights
- no soft shadows
- no 3D
- 24x24 viewBox
- readable at 16px
- use currentColor when possible
- consistent stroke/fill language

Core icons needed:
- crown
- clown
- judge/verdict
- scout
- claim

Crown should be a simple status symbol, not a shiny casino reward.

Clown should be an ironic mark of clownery, not a cheerful children's clown.

## Visual noise

Avoid:
- duplicated stats near each other
- unexplained scores
- too many badges
- decorative icons that do not add meaning
- multiple competing taxonomies on one card
- bright elements with equal visual weight everywhere
