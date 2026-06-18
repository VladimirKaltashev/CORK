# Claim Model v0.5 — Step 3 Report

**Date:** 2026-06-18

---

## 1. Что сделано

Claim mapper (`achievementToClaim`) впервые использован в UI — в карточке заявки (`AchievementCard.tsx`).

### Изменения:

1. **Созданы display helpers** (`src/entities/claims/display.ts`) — pure functions для читаемых лейблов и эмодзи ClaimType/SubjectType.
2. **Добавлены тесты** (23 parametrized) для display helpers.
3. **Обновлён index.ts** — экспорт display helpers.
4. **Обновлён AchievementCard.tsx** — вызов `achievementToClaim(achievement)`, отображение компактного claim badge:
   - эмодзи + тип заявки (например, 💥 Фейл, 🔎 Нашёл, 💎 Находка);
   - если `subjectName` есть — `· о: <subjectName>`;
   - если `thread` есть — `# <thread>` tag.
5. **Copy cleanup** в ProfilePage.tsx — "Достижения" → "Заявки", "Нет достижений. Добавьте первое!" → "Нет заявок. Добавьте первую!", "Достижений пока нет" → "Заявок пока нет".

---

## 2. Выбранное место UI

**`src/features/profile/AchievementCard.tsx`** — единственный компонент, который:
- рендерит `Achievement` на странице профиля (и админа);
- не требует изменений feed-архитектуры;
- не требует изменений store-интерфейса;
- изолирован — diff минимален (+16 строк);
- уже используется в `ProfilePage.tsx` и `AdminPage.tsx`.

---

## 3. Файлы

| Файл | Статус | Назначение |
|---|---|---|
| `src/entities/claims/display.ts` | **NEW** | display helpers (claimTypeLabel, claimTypeEmoji, subjectTypeLabel) |
| `src/entities/claims/display.test.ts` | **NEW** | 23 unit-теста для helpers |
| `src/entities/claims/index.ts` | MODIFIED | Экспорт display helpers |
| `src/features/profile/AchievementCard.tsx` | MODIFIED | Claim badge рендеринг (+16 строк) |
| `src/pages/ProfilePage.tsx` | MODIFIED | Copy: Достижения → Заявки (+3 строки) |

---

## 4. Решения

1. **Только одно место** — AchievementCard. Не меняли FeedPage, AdminPage, InlineCreateCard.
2. **Локальный вызов mapper** — `const claim = achievementToClaim(achievement)` без изменений store API.
3. **Всегда показываем badge** — даже для старых achievements (покажет "👤 Моё"), что безопасно.
4. **Copy cleanup только в ProfilePage** — AchievementCard не содержит "достижение"; обновлён заголовок секции и empty state.
5. **Нет компонентных UI-тестов** — в проекте нет тестов для AchievementCard, добавление потребовало бы тест-инфраструктуру (моки стора, провайдеры). Unit-тесты display helpers покрывают логику отображения.
6. **gap-x-2 вместо margin** — flex gap для адаптивности на мобильных.

---

## 5. Что НЕ сделано намеренно

1. **Нет rename achievements → claims.**
2. **Нет Supabase migration.**
3. **Нет изменений в store API.**
4. **Нет изменений в feed архитектуре.**
5. **Нет изменений в реакциях/бюджете.**
6. **Нет изменений в auth/RLS.**
7. **Нет изменений в AddAchievementModal.tsx** (Step 2).
8. **Нет CORK_AGENT_RULES.md изменений** (pre-existing, не из этого шага).
9. **Не исправлены unrelated проблемы** (leaderboard store test stderr — pre-existing).

---

## 6. Тесты

| Тест | Статус |
|---|---|
| `claimTypeLabel` — все 8 типов | ✅ 8 parametrized |
| `claimTypeEmoji` — все 8 типов | ✅ 8 parametrized |
| `subjectTypeLabel` — все 7 типов | ✅ 7 parametrized |
| Все существующие тесты (314) | ✅ 50 files, 314 passed |

UI-тесты для AchievementCard не добавлены по причине:
- в проекте нет прецедента UI-тестов для feature/profile компонентов;
- для их добавления потребовались бы моки стора, провайдеры, обёртки;
- логика отображения покрыта unit-тестами display helpers (23 теста);
- условный рендеринг в JSX тривиален (3 простых `&&`).

---

## 7. Команды и результаты

```bash
npm run test         # ✅ 314 passed (50 files)
npx tsc --noEmit     # ✅ 0 errors
npm run lint         # ✅ 0 errors
```

---

## 8. git diff summary

```
 M src/features/profile/AchievementCard.tsx  | 16 +++
 M src/pages/ProfilePage.tsx                 |  6 +-
 M src/entities/claims/index.ts              |  5 +
?? src/entities/claims/display.ts            | 48 +++
?? src/entities/claims/display.test.ts       | 50 +++
```

Pre-existing (не из Step 3):
- `CORK_AGENT_RULES.md` — pre-existing
- `src/features/profile/AddAchievementModal.tsx` — Step 2

---

## 9. Риски/Сомнения

1. **"👤 Моё" для старых achievements** — может выглядеть как лишний шум на карточках без meta. Но это консистентно и безопасно. Если будет негатив — можно скрывать badge для `self_achievement` без subjectName.
2. **Только ProfilePage обновлён** — AdminPage тоже рендерит AchievementCard и теперь показывает claim badge, но заголовок секции не менялся (в админке нет заголовка "Достижения").
3. **External review** — ask-ollama review получен (gemma3:4b).

---

## 10. External Review (ask-ollama / gemma3:4b)

**Статус:** ✅ Review completed.

### Замечания ревьюера и ответы:

| Замечание | Ответ |
|---|---|
| **Missing tests** для `achievementToClaim`, `claimTypeLabel`, `claimTypeEmoji` | Тесты существуют: `mapper.test.ts` (16 тестов для `achievementToClaim`), `display.test.ts` (23 теста для `claimTypeLabel`/`claimTypeEmoji`/`subjectTypeLabel`). Ревьюер не увидел новые файлы. Покрытие есть. |
| **Edge case** — старые achievements без meta | Обработано: `achievementToClaim` дефолтит к `self_achievement`/`self`. UI не показывает `subjectName`/`thread` при undefined. Тесты в `mapper.test.ts` покрывают этот кейс. |
| **Layout on mobile** — `flex-wrap` должен работать | Подтверждаю: используется та же `flex flex-wrap` техника, что и в существующем badges row выше. |
| **String formatting safety** — `о: {}` конкатенация | React JSX auto-escapes; `subjectName` приходит из БД (meta колонка), не raw user input. Риска injection нет. |
| `any` не используется | ✅ |
| FSD boundaries respected | ✅ |
| Scope не вырос | ✅ |

### Вывод:
Ревьюер не нашёл реальных багов. Замечание о missing tests основано на неполном обзоре diff (не увидел новые файлы display.ts/display.test.ts). Все кейсы уже покрыты существующими тестами.

---

## 11. Reviewer Findings (manual review)

Чеклист проверен:

| Пункт | Статус |
|---|---|
| `any` не используется | ✅ |
| Старые achievements без meta безопасны (self_achievement) | ✅ |
| Claim badge не ломает layout (flex-wrap, text-xs) | ✅ |
| FSD: entity → feature → page, без циклических зависимостей | ✅ |
| Scope не вырос (только 1 поверхность) | ✅ |
| Нет изменений БД/реакций/бюджета | ✅ |
| Нет массового rename | ✅ |
| Отчёт создан | ✅ |
| External review через ask-ollama | ✅ |
