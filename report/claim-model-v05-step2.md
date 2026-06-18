# Claim Model v0.5 — Step 2 Report

**Date:** 2026-06-18
**Author:** opencode
**Rule:** 18.10

---

## 1. Что сделано

Обновлён composer (AddAchievementModal.tsx) для создания Claim-intent без миграции БД.

### Файлы:

| Файл | Статус | Назначение |
|---|---|---|
| `src/entities/claims/helpers.ts` | **NEW** | `defaultSubjectTypeForClaimType()`, `buildClaimMeta()` |
| `src/entities/claims/helpers.test.ts` | **NEW** | 19 unit-тестов для helpers |
| `src/entities/claims/index.ts` | MODIFIED | Добавлен экспорт helpers |
| `src/features/profile/AddAchievementModal.tsx` | MODIFIED | ClaimType chips, SubjectType chips, subjectName input, thread selector, meta builder, обновлённый copy |

---

## 2. Что сделано в деталях

### Helper functions (pure, testable)

**`defaultSubjectTypeForClaimType(claimType)`** — маппинг ClaimType → дефолтный SubjectType:
- `self_achievement` → `self`, `other_achievement` → `person`, `fail` → `internet`, `flex` → `self`, `discovery` → `project`, `debate` → `unknown`, `absurd` → `internet`, `organization` → `organization`

**`buildClaimMeta(params)`** — собирает meta-объект для записи в таблицу achievements:
- `event_date` — сохраняется, если передан
- `claim_type` — всегда
- `subject_type` — всегда
- `subject_name` — только если non-empty после trim
- `thread` — только если non-empty после trim

### UI в AddAchievementModal.tsx

Новые секции (после claim angle chips, перед proof section):

1. **ClaimType chips** — 8 кнопок с эмодзи: Моё 👤, Нашёл 🔎, Фейл 💥, Flex ⚡, Находка 💎, Спорно ⚖️, Абсурд 🌀, Орга/проект 🏛️
2. **SubjectType chips** — 7 кнопок: Я, Человек, Организация, Проект, Событие, Интернет, Неясно
3. **SubjectName input** — показывается только если `subjectType !== 'self'`, с динамическим placeholder
4. **Thread chips** — 7 опций: Без ветки (default) + 5 предустановленных + Своя тема (с условным input)

### Логика поведения
- При смене ClaimType SubjectType автоматически сбрасывается на дефолтный, **если пользователь его вручную не менял** (через `subjectPristine` ref)
- При ручном выборе SubjectType `subjectPristine` устанавливается в `false`
- В `handleSubmit` meta собирается через `buildClaimMeta()`
- Пустые subjectName/thread не записываются
- `event_date` сохраняется вместе с новыми полями

### Copy
- Toast: `"Заявка отправлена на модерацию"` → `"Вынесено на суд"`
- Header остался `"На суд"` (уже хороший)
- Submit button: `"Вынести на суд"` (уже был)

---

## 3. Что НЕ сделано намеренно

1. **Нет rename** achievements → claims.
2. **Нет миграции** Supabase.
3. **Нет изменений** в `src/entities/achievements/store.ts`.
4. **Нет изменений** в `src/shared/types/index.ts`.
5. **Нет изменений** реакций/бюджета.
6. **Нет глобального** изменения UI-copy за пределами composer.
7. **Нет component-тестов** для модалки — только pure function тесты (как рекомендовано).
8. **CORK_AGENT_RULES.md** — изменения в этом файле предсуществующие, не из текущего шага.

---

## 4. Тесты (19 новых тестов)

Все тесты в `src/entities/claims/helpers.test.ts`:

| Тест | Статус |
|---|---|
| `defaultSubjectTypeForClaimType` — каждый claimType → subjectType | ✅ 8 parametrized |
| `buildClaimMeta` — claim_type и subject_type всегда | ✅ |
| `buildClaimMeta` — дефолтные значения для self_achievement/self | ✅ |
| `buildClaimMeta` — subject_name включается, если не пустой | ✅ |
| `buildClaimMeta` — subject_name НЕ включается, если пустой | ✅ |
| `buildClaimMeta` — subject_name НЕ включается, если только пробелы | ✅ |
| `buildClaimMeta` — event_date сохраняется вместе с claim fields | ✅ |
| `buildClaimMeta` — event_date НЕ включается, если null | ✅ |
| `buildClaimMeta` — thread включается, если не пустой | ✅ |
| `buildClaimMeta` — thread НЕ включается, если пустой | ✅ |
| `buildClaimMeta` — только claim_type + subject_type, если ничего больше нет | ✅ |
| `buildClaimMeta` — subject_name триммится | ✅ |

---

## 5. Команды и результаты

```bash
npx tsc --noEmit    # ✅ passed
npm run lint         # ✅ passed (0 errors)
npx vitest run       # ✅ 49 files, 291 tests passed (+19 новых)
```

---

## 6. git diff

```
 M CORK_AGENT_RULES.md      (pre-existing, not from this session)
 M src/features/profile/AddAchievementModal.tsx   (+189 lines)
?? src/entities/claims/      (new: helpers.ts, helpers.test.ts, index.ts modified)
```

---

## 7. Следующий шаг (предложение)

**Step 3 — использовать Claim mapper в UI-компонентах**:
- Заменить в фиде/профиле отображение "достижение" на Claim-осознанное отображение
- Использовать `achievementToClaim()` из Step 1 для чтения
- Показать claim type и subject в карточке
- Показать thread/tag

---

## 8. Риски/Сомнения

- `subjectPristine` ref: если пользователь меняет claimType после ручного выбора subjectType, subjectType не сбрасывается. Это ожидаемое поведение, но может сбить с толку, если пользователь не помнит, что вручную менял subjectType.
- Thread "Своя тема" — text input для customThread не очищается при переключении на другую ветку и обратно (minor UX).
- CORK_AGENT_RULES.md изменения не из этого шага — проверено через `git diff`.

---

## 9. Reviewer Findings

ask-ollama был недоступен. Выполнен manual review по чеклисту:
- `any` не используется ✅
- `claim_type` и `subject_type` всегда записываются ✅
- Пустые `subject_name`/`thread` не записываются ✅
- `event_date` сохраняется ✅
- FSD: feature → entity → shared, без циклических зависимостей ✅
- Scope не вырос: только claims entity + modal + helpers ✅
- Все 291 тест проходят ✅
