# Claim Model v0.5 — Step 6 Report

**Date:** 2026-06-19

---

## 1. Что сделано

Claim-aware display внедрён в feed/arena поверхность (`FeedPage.tsx`):

1. **meta добавлено в FeedItem** — поле `meta: Record<string, unknown>` теперь доступно (ранее запрашивалось из БД, но не маппилось в интерфейс).
2. **Claim badge** — показывается в карточке фида, если есть осмысленная claim-информация (не `self_achievement`, или есть `subjectName`, или есть `thread`).
3. **Copy cleanup не потребовался** — FeedPage уже использовал "заявка"/"заявку" в пустых состояниях (строки 365, 366, 471).

---

## 2. Выбранная surface

`src/pages/FeedPage.tsx` — главная страница "Арена". Это единственная feed/arena поверхность, где рендерятся заявки. Компонент рендерит карточки inline (не использует `AchievementCard`).

Альтернативы рассмотрены:
- `features/feed/AchievementCard.tsx` — legacy, не используется
- `InlineCreateCard` — только кнопка создания
- Copy уже корректна, изменений не требовалось

---

## 3. Файлы

| Файл | Статус | Изменение |
|---|---|---|
| `src/pages/FeedPage.tsx` | MODIFIED | +meta в FeedItem, +экстракция meta, +claim badge (+30 строк) |

---

## 4. Copy

Не менялось — FeedPage уже использует "заявка" язык:
- `'У вас пока нет друзей с заявками'` (line 368)
- `'Заявок пока нет'` (line 369)
- `'Принеси первую заявку на суд.'` (line 471)

---

## 5. Использование achievementToClaim

Не использован. FeedItem не является Achievement, поэтому использован прямой вызов `claimMetaFromAchievementMeta(item.meta)`, который является частью того же mapper-слоя и возвращает `ClaimMeta` с теми же полями. Это чище, чем создавать искусственный Achievement объект.

Условие показа badge повторяет логику `shouldShowClaimBadge`, но напрямую на `ClaimMeta`:

```typescript
const showBadge = claimMeta.claimType !== 'self_achievement' || !!claimMeta.subjectName?.trim() || !!claimMeta.thread?.trim()
```

---

## 6. Тесты

Новые тесты не добавлены:
- FeedPage тестов в проекте нет (только route guard / integration tests)
- `claimMetaFromAchievementMeta` покрыт 16 тестами в `mapper.test.ts` (Step 1)
- `claimTypeEmoji`/`claimTypeLabel` покрыты 23 тестами в `display.test.ts` (Step 3)
- `shouldShowClaimBadge` логика покрыта 12 тестами в `display.test.ts` (Step 4)
- UI-тесты для FeedPage потребовали бы mocking Supabase, стора, реакций — нет существующего паттерна

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
 M src/pages/FeedPage.tsx   | 30 +++++++++++++++++++++++++++---
```

Только один файл. Diff ~30 строк.

---

## 9. Что НЕ сделано намеренно

1. **Не использован `achievementToClaim()`** — FeedItem не Achievement, прямой вызов `claimMetaFromAchievementMeta` чище.
2. **Не создан общий ClaimBadgeComponent** — третий дубликат badge JSX (после AchievementCard, AdminPage). Это осознанное решение: выделение компонента — отдельный шаг.
3. **Не меняли AchievementCard, AdminPage, ProfilePage, store, БД.**
4. **Не трогали CORK_AGENT_RULES.md.**
5. **Не исправляли unrelated проблемы.**

---

## 10. Риски/Сомнения

1. **Третий дубликат badge JSX** — если потребуется изменить отображение badge, придётся править 3 места (AchievementCard, AdminPage, FeedPage). Рекомендую следующий шаг: вынести `ClaimBadge` как маленький shared UI компонент.
2. **`claimMeta.claimType!`** — non-null assertion безопасна, т.к. `claimMetaFromAchievementMeta` всегда возвращает `claimType` (дефолт `'self_achievement'`).
3. **`(row.meta as Record<string, unknown> | null) ?? {}`** — тот же паттерн, что используется выше для `getEventDate(row.meta as ...)`. Существующий код.

---

## 11. External Review (ask-ollama / gemma3:4b)

**Статус:** ✅ Review completed.

### Замечания ревьюера и ответы:

| Замечание | Ответ |
|---|---|
| **Type safety** type assertion в loadPage | Тот же паттерн, что на строке выше для `getEventDate`. Существующий код, не из этого шага. |
| **Потенциальные ошибки** `claimTypeEmoji`/`claimTypeLabel` с unexpected inputs | `claimMetaFromAchievementMeta` использует `safeClaimType` — всегда возвращает валидный `ClaimType`. |
| **Missing tests** для type assertion | Тесты для mapper (16 тестов) покрывают `claimMetaFromAchievementMeta`. FeedPage UI тестов в проекте нет. |
| **Missing tests** для badge rendering | Логика `showBadge` идентична `shouldShowClaimBadge` (12 тестов). UI тесты потребовали бы mocking окружения. |
| **Old achievements without meta** | `(row.meta ?? {})` обрабатывает null. `claimMetaFromAchievementMeta({})` дефолтит к self_achievement. `showBadge` = false. Безопасно. |
| Feed behavior unchanged | ✅ |
| No any / no rename / no migration | ✅ |
| Scope did not grow | ✅ (1 файл) |

---

## 12. Reviewer Findings (manual review)

| Пункт | Статус |
|---|---|
| `any` не используется | ✅ |
| Нет global rename | ✅ |
| Нет Supabase migration | ✅ |
| Feed behavior unchanged | ✅ |
| Old achievements без meta безопасны | ✅ |
| Claim metadata показывается корректно | ✅ |
| Copy уже корректна ("заявка") | ✅ |
| FSD: page → entity | ✅ |
| Scope не вырос (1 файл) | ✅ |
| External review получен | ✅ |
| Отчёт создан | ✅ |
