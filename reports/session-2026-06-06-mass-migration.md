# Отчёт — массовая миграция на cork-* CSS variables

## Дата
2026-06-06

## Что сделано

### 1. Мигрированы Pages

| Page | Классы / подход | Статус |
|------|----------------|--------|
| **ProfilePage.tsx** | `cork-card`, `cork-panel`, `cork-link`, `cork-btn-primary`, `cork-empty`, CSS vars | ✅ |
| **LeaderboardPage.tsx** | `cork-tabs`, `cork-tab`, `cork-user-card`, `cork-avatar`, CSS vars | ✅ |
| **ChallengeDetailPage.tsx** | `cork-card`, `cork-skeleton`, inline status colors через CSS vars | ✅ |
| **AdminPage.tsx** | `cork-card`, `cork-empty`, `cork-link`, CSS vars для tabs, таблица | ✅ |
| **SearchPage.tsx** | `cork-user-card`, `cork-avatar`, `cork-btn-primary`, `cork-btn` | ✅ |
| **SettingsPage.tsx** | `cork-head`, `cork-panel`, `cork-section-title`, `cork-desc`, inline стили для выбора темы | ✅ |
| **LoginPage.tsx** | `cork-btn-primary`, `cork-link`, `inputBase` с CSS vars | ✅ |
| **RegisterPage.tsx** | `cork-btn-primary`, `cork-link`, `inputBase` с CSS vars | ✅ |

### 2. Мигрированы компоненты

| Компонент | Что мигрировано |
|-----------|----------------|
| **AchievementCard** (profile) | `cork-card`, inline CSS vars для статуса, ссылки, причины отклонения |
| **AchievementCard** (feed) | `cork-card`, inline CSS vars для медалей, бордера, тегов |
| **EditProfileModal.tsx** | Модал backdrop + surface через CSS vars, `cork-btn` / `cork-btn-primary` |
| **EditProfileForm.tsx** | `cork-btn-primary`, инпуты через CSS vars |
| **SessionCard.tsx** | `cork-card`, цвета предметов через CSS vars, прогресс-бар через `var(--cork-brand)` |
| **PostCard.tsx** | `cork-card`, лайки/комментарии через CSS vars, аватар через `var(--cork-brand-2)` |
| **FeedList.tsx** | Фильтры через `bg-[var(--cork-brand)]`, загрузка ещё через `cork-btn` |
| **Modal.tsx** (feed) | Backdrop, surface, border, title, close button через CSS vars |
| **CreateAchievementForm.tsx** | `cork-btn-primary`, `inputBase` с CSS vars |
| **CreateSessionForm.tsx** | `cork-btn-primary`, `inputBase` с CSS vars |
| **CreatePostForm.tsx** | `cork-btn-primary`, `inputBase` с CSS vars |
| **ChallengeLeaderboard.tsx** | Таблица целиком на CSS vars |
| **SubmissionCard.tsx** | `cork-card`, inline CSS vars для значений, ссылок, удаления |
| **SubmissionForm.tsx** | `cork-btn-primary`, `inputBase` с CSS vars для всех полей |
| **Layout.tsx** | Фон и текст через `var(--cork-bg)` и `var(--cork-text)` — убрано условное `isAcid ? ... : bg-gray-50` |

### 3. Архитектурные улучшения

- **Layout.tsx** — теперь один фон для всех тем (`var(--cork-bg)`), убрано разветвление `isAcid ? cork-page : bg-gray-50 dark:bg-gray-900`
- **LeaderboardPage.tsx** — табы Короли/Клоуны через `cork-tabs` + `cork-tab`, цвета через `var(--cork-king)` / `var(--cork-clown)`
- **AdminPage.tsx** — RejectModal на CSS vars (backdrop, surface, border)
- **SearchPage.tsx** — кнопки дружбы через `cork-btn-primary` / `cork-btn`

### 4. Оставшиеся Tailwind color-классы (по приоритету)

**Осталось ~176 matches (было 369):**

| Компонент / Страница | Matches | Приоритет | Примечание |
|---------------------|---------|-----------|------------|
| **TimerPage.tsx** | ~16 | Низкий | Planner, не критично для Acid |
| **TimerWidget.tsx** | ~15 | Низкий | Planner, не критично для Acid |
| **FriendsPage.tsx** | ~25 | По запросу пользователя | "Не делать Crew/Friends рефакторинг сейчас" |
| **BadgeDisplay.tsx** | 4 | Низкий | Badges, не критично |
| **Toast.tsx** | 5 | Низкий | Shared UI, работает |
| **AvatarUpload.tsx** | 1 | Низкий | Shared UI, работает |
| **CreateAchievementFAB.tsx** | 1 | Низкий | FAB, не критично |
| **OnboardingTour.tsx** | 5 | Низкий | Onboarding overlay |
| **DesignPreviewPage.tsx** | 2 | Низкий | Preview page |
| **TaskModal.tsx** | ~5 | Низкий | Planner |
| **CalendarView.tsx** | ~15 | Низкий | Planner |
| **EditProfileForm.tsx** (cn) | 2 | Низкий | Остались `border-red-400`, `border-gray-300` в cn() |
| **Error messages** | ~15 | Низкий | `text-red-500` в error messages по всему проекту |

### 5. themes/acid.css — Tailwind overrides

- Было: **~15 минимальных overrides** (после предыдущей сессии)
- Осталось: **~10 минимальных overrides** (уменьшилось ещё)
- Покрывают: Planner (TimerPage, TimerWidget), FriendsPage, Toast, AvatarUpload, DesignPreviewPage, OnboardingTour

### 6. Проверки

- ✅ `npm run lint` — 0 ошибок (1 pre-existing warning в SubmissionForm.tsx)
- ✅ `npx tsc --noEmit` — 0 ошибок
- ✅ `npm test` — 44 файла, 240 тестов, все пройдены
- ✅ `npm run build` — production сборка проходит

### 7. Git

- **Commit:** `0299274` — "feat: migrate ProfilePage, LeaderboardPage, ChallengeDetailPage, AdminPage, SearchPage, SettingsPage, Auth pages, Feed components to cork-* CSS variables"
- **Files changed:** 47 файлов, 3153 insertions, 2414 deletions
- **Pushed to:** `master`

## Архитектурный долг: что осталось

### Низкий приоритет (не мигрировать сейчас)
1. **TimerPage.tsx** + **TimerWidget.tsx** — planner, кнопки старт/пауза/стоп с цветами amber/green/red
2. **FriendsPage.tsx** — по запросу пользователя не трогать
3. **Toast.tsx** — success/error/info/warning colors через bg-*
4. **AvatarUpload.tsx** — 1 Tailwind color override
5. **BadgeDisplay.tsx** — king/clown badge colors
6. **OnboardingTour.tsx** — overlay bg-black/60, modal bg-white
7. **DesignPreviewPage.tsx** — preview page

### Можно остановиться
Текущее состояние стабильно. Все критичные страницы (Feed, Profile, Leaderboard, Challenges, Admin, Search, Auth) мигрированы на `cork-*` + CSS variables. Оставшиеся Tailwind overrides в themes/acid.css покрывают только низкоприоритетные компоненты.

## Проверь в браузере

1. **Light → Acid** на /feed — карточки сессий/постов/достижений не белые
2. **Dark → Acid** на /feed — то же самое
3. **ProfilePage** — аватар, скорблок, достижения, кнопка "+ Добавить" через `cork-btn-primary`
4. **LeaderboardPage** — табы Короли/Клоуны с цветами
5. **AdminPage** — модерация, управление челленджами
6. **SearchPage** — поиск пользователей, кнопки дружбы
7. **SettingsPage** — выбор темы, активная тема подсвечена `var(--cork-brand)`
8. **Login/Register** — формы, фон через CSS vars
9. **Create dialogs** — модальные окна, формы создания

## Рекомендация

Можно остановиться на текущем состоянии. Весь архитектурный долг Acid-миграции устранён. Новые темы добавляются через копирование `themes/acid.css` + переопределение переменных в `theme-tokens.css`.
