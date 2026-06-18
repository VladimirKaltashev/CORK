# Claim Model v0.5 — Step 4 Report

**Date:** 2026-06-18

---

## 1. Что сделано

Добавлен noise reduction для claim badge — старые/default achievements без meta больше не показывают 👤 Моё.

### Изменения:

1. **Создан `shouldShowClaimBadge(claim)`** в `display.ts` — pure helper, который решает, показывать ли badge:
   - `true` если claim.type !== 'self_achievement' (все осмысленные типы);
   - `true` если есть subjectName или thread с контентом;
   - `false` для старых/default self_achievement без subjectName/thread.
2. **Тесты** — 12 кейсов для `shouldShowClaimBadge`.
3. **Обновлён `AchievementCard.tsx`** — badge обёрнут в `{shouldShowClaimBadge(claim) && (...)}`.
4. **Обновлён `index.ts`** — экспорт `shouldShowClaimBadge`.

---

## 2. Файлы

| Файл | Статус | Изменение |
|---|---|---|
| `src/entities/claims/display.ts` | MODIFIED | + `shouldShowClaimBadge()` |
| `src/entities/claims/display.test.ts` | MODIFIED | + 12 тестов |
| `src/entities/claims/index.ts` | MODIFIED | + экспорт `shouldShowClaimBadge` |
| `src/features/profile/AchievementCard.tsx` | MODIFIED | badge conditional |

---

## 3. Почему нужен `shouldShowClaimBadge`

Step 3 показал 👤 Моё для ВСЕХ achievements, включая старые без meta. Это безопасно, но создаёт визуальный шум. Пользователь не получает пользы от badge "Моё" на каждом старом достижении — это дефолтное значение, не несущее информации.

---

## 4. Решения

1. **Helper pure + resilient** — `subjectName?.trim()` и `thread?.trim()` защищают от whitespace, хотя mapper уже фильтрует их.
2. **Минимальный diff** — только обёртка существующего JSX в conditional, без переписывания layout.
3. **Никаких изменений** composer/feed/admin/store/БД.
4. **12 тестов** — все required кейсы покрыты.

---

## 5. Что НЕ сделано намеренно

1. **Не меняли composer** (AddAchievementModal).
2. **Не меняли ProfilePage/Feed/AdminPage**.
3. **Не меняли store API**.
4. **Не делали rename** achievements → claims.
5. **Не трогали реакции/бюджет**.
6. **Не трогали auth/RLS**.
7. **Не исправляли unrelated проблемы** (leaderboard store test stderr — pre-existing).
8. **CORK_AGENT_RULES.md** — не трогали.

---

## 6. Тесты

| Кейс | Результат |
|---|---|
| self_achievement без subjectName/thread | `false` ✅ |
| self_achievement с subjectName | `true` ✅ |
| self_achievement с thread | `true` ✅ |
| other_achievement | `true` ✅ |
| fail | `true` ✅ |
| flex | `true` ✅ |
| discovery | `true` ✅ |
| debate | `true` ✅ |
| absurd | `true` ✅ |
| organization | `true` ✅ |
| whitespace subjectName | `false` ✅ |
| whitespace thread | `false` ✅ |

Всего: 35 тестов в `display.test.ts` (+12 новых). Все существующие тесты: 326 passed (50 files).

---

## 7. Команды и результаты

```bash
npm run test         # ✅ 326 passed (50 files)
npx tsc --noEmit     # ✅ 0 errors
npm run lint         # ✅ 0 errors
```

---

## 8. git diff summary

```
 M src/features/profile/AchievementCard.tsx   | 20 +++-
 M src/entities/claims/index.ts               |  2 +-
 M src/entities/claims/display.ts             | 12 +++
 M src/entities/claims/display.test.ts        | 66 +++++++++++++++++++
```

Изменения Step 3 (предсуществующие):
- AchievementCard.tsx: +import achievementToClaim + badge JSX
- display.ts: claimTypeLabel/claimTypeEmoji/subjectTypeLabel
- index.ts: экспорт display helpers

Изменения Step 4 (текущие):
- display.ts: +shouldShowClaimBadge (12 строк)
- display.test.ts: +12 тестов (66 строк)
- index.ts: +shouldShowClaimBadge в экспорте
- AchievementCard.tsx: +shouldShowClaimBadge import + conditional wrapper

---

## 9. Риски/Сомнения

1. **"👤 Моё" больше не показывается** — это intentional. Если позже понадобится показывать self_achievement в каких-то кейсах (например, для отладки), можно будет уточнить правило.
2. **Whitespace subjectName/thread** — обработаны через `.trim()`. Через mapper они не могут прийти (readString фильтрует), но helper защищён на уровне UI.
3. **External review** — ask-ollama был доступен при ping, но timeout при отправке diff. Выполнен manual review.

---

## 10. Reviewer Findings (manual review)

Чеклист проверен:

| Пункт | Статус |
|---|---|
| `any` не используется | ✅ |
| Старые achievements без meta не показывают badge | ✅ |
| Не-self claim types (fail/flex/discovery/...) показывают badge | ✅ |
| subjectName/thread показывают badge | ✅ |
| whitespace subjectName/thread безопасны | ✅ (.trim()) |
| Layout не сломан (просто conditional) | ✅ |
| FSD: entity → feature, без циклов | ✅ |
| Scope не вырос | ✅ |
| Нет изменений БД/реакций/бюджета | ✅ |
| Нет rename | ✅ |
| Отчёт создан | ✅ |

---

## 11. External Review Status

- ask-ollama ping: ✅ OK
- ask-ollama review: ❌ timeout при отправке diff
- Manual review по чеклисту: ✅
