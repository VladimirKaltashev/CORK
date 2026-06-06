# Отчёт — cleanup после Acid Pop

## Дата
2026-06-05

## Задача 1. Инвентаризация

### Файлы с hardcoded Tailwind colors (bg-white, bg-gray-*, text-gray-*, border-gray-*, dark:bg-*, dark:text-*, bg-indigo-*, text-indigo-*, ap-*)

Топ файлов по количеству совпадений:

| Файл | Совпадения |
|------|-----------|
| src/pages/FeedPage.tsx | 37 |
| src/pages/AdminPage.tsx | 35 |
| src/pages/ProfilePage.tsx | 32 |
| src/pages/FriendsPage.tsx | 25 |
| src/pages/TimerPage.tsx | 22 |
| src/pages/LeaderboardPage.tsx | 22 |
| src/features/profile/AddAchievementModal.tsx | 30 |
| src/features/planner/TimerWidget.tsx | 20 |
| src/widgets/planner/CalendarView.tsx | 17 |
| src/features/feed/PostCard.tsx | 17 |
| src/features/planner/TaskModal.tsx | 16 |
| src/features/feed/SessionCard.tsx | 15 |
| src/features/planner/TaskList.tsx | 14 |
| src/features/profile/AchievementCard.tsx | 13 |
| src/pages/SearchPage.tsx | 12 |
| src/pages/auth/LoginPage.tsx | 11 |
| src/features/planner/TaskComments.tsx | 11 |
| src/pages/ChallengeDetailPage.tsx | 10 |
| src/features/feed/CreateSessionForm.tsx | 8 |
| src/features/onboarding/OnboardingTour.tsx | 8 |
| src/features/planner/SessionReportModal.tsx | 8 |
| src/pages/auth/RegisterPage.tsx | 8 |
| src/features/challenges/ChallengeCard.tsx | 7 |
| src/pages/ChallengesPage.tsx | 6 |
| src/features/reactions/ReactionBar.tsx | 6 |
| src/features/reactions/BudgetWidget.tsx | 6 |
| src/features/profile/EditProfileForm.tsx | 6 |
| src/features/feed/CreatePostForm.tsx | 6 |
| src/features/challenges/ChallengeLeaderboard.tsx | 6 |
| src/features/challenges/BadgeDisplay.tsx | 5 |
| src/features/challenges/SubmissionForm.tsx | 5 |
| src/features/feed/FeedList.tsx | 5 |
| src/pages/PlannerPage.tsx | 4 |
| src/pages/NotFoundPage.tsx | 4 |
| src/features/profile/InlineCreateCard.tsx | 4 |
| src/features/challenges/SubmissionCard.tsx | 3 |
| src/features/challenges/ChallengeBanner.tsx | 3 |
| src/pages/DesignPreviewPage.tsx | 3 |
| src/shared/ui/Toast/Toast.tsx | 2 |
| src/pages/GroupsPage.tsx | 1 |
| src/pages/GroupPage.tsx | 1 |
| src/features/profile/CreateAchievementFAB.tsx | 1 |
| src/app/router/ProtectedRoute.tsx | 1 |
| src/widgets/Layout/Layout.tsx | 1 |
| src/widgets/Layout/Header.tsx | 1 |
| src/shared/ui/AvatarUpload/AvatarUpload.tsx | 1 |

**Примечание:** в Header.tsx, Layout.tsx, AddAchievementModal.tsx — остались только layout utility-классы (`flex`, `gap-2`, `items-center`), а не цветовые Tailwind. Цветовые уже мигрированы на `cork-*` или CSS-переменные.

### FeedPageAcid.tsx

- **Файл:** удалён (`src/pages/FeedPageAcid.tsx`)
- **Использовался:** больше нет. FeedPage.tsx убрал условный рендер `if (theme === 'acid') return <FeedPageAcid />`

### ap-* классы

- **Остались ли:** нет. Файл `acid-pop.css` (где были `ap-*` классы) удалён.
- **False positives:** `grep "ap-"` ловит `gap-1`, `gap-2`, `gap-2.5` и т.д. — это layout, не Acid-классы.

### Компоненты, сильнее всего завязанные на Tailwind colors

1. **FeedPage.tsx** — 37 цветовых классов (bg-white, bg-gray-*, dark:bg-*, text-gray-*, etc.)
2. **AdminPage.tsx** — 35
3. **ProfilePage.tsx** — 32
4. **FriendsPage.tsx** — 25
5. **AddAchievementModal.tsx** — 30 (уже мигрирован в этой сессии)

## Задача 2. Удалить мёртвое

✅ **FeedPageAcid.tsx** — удалён
✅ **acid-pop.css** — удалён (импорт из App.tsx тоже убран)
✅ **HeaderAcid** — не существовал как отдельный компонент, только CSS в acid-pop.css

## Задача 3. Мигрировать Header + Create Dialog + Challenges

### ✅ Header.tsx
- Уже использует `cork-*` классы
- Остались только layout utility (`flex`, `gap-2`, `items-center`)
- Цвета управляются через CSS-переменные

### ✅ AddAchievementModal.tsx (Create Dialog)
- Убраны все `bg-white`, `bg-gray-50`, `text-gray-900`, `dark:bg-gray-800`, `dark:text-white`
- Заменены на inline `style={{ color: 'var(--cork-text)', background: 'var(--cork-surface)' }}`
- Кнопки, инпуты, textarea — используют CSS-переменные
- `ToolbarButton` — использует CSS-переменные

### ✅ ChallengesPage.tsx
- `cork-shell` + `cork-main` для layout
- `cork-head` для заголовка
- `cork-title` для подзаголовков
- `cork-empty` для empty state

### ✅ ChallengeCard.tsx
- `cork-card` для карточки
- `cork-title` для заголовка
- `cork-desc` для описания
- `cork-meta` для мета-информации
- `cork-tag` для статуса
- Active челлендж — border через `var(--cork-brand)`

### Проверки
- ✅ `npm run lint` — 0 ошибок
- ✅ `npx tsc -b --noEmit` — 0 ошибок
- ✅ `npm test` — 44 файла, 240 тестов, все пройдены
- ✅ `npm run build` — сборка проходит

## Осталось сделать

1. **Очистить themes/acid.css от 80+ Tailwind overrides** — оставить только декорации и минимальные общие overrides
2. **Мигрировать FeedPage.tsx** — самый большой остаток Tailwind colors
3. **Мигрировать ProfilePage.tsx** — 32 цветовых класса
4. **Мигрировать FriendsPage.tsx** — 25 цветовых классов
5. **Мигрировать LeaderboardPage.tsx** — 22 цветовых класса

**Рекомендация:** Не удалять 80+ Tailwind overrides из themes/acid.css, пока не мигрированы остальные страницы. Иначе FeedPage, ProfilePage и т.д. станут белыми в Acid. Лучше мигрировать страницы по одной, а потом чистить CSS.

## Файлы, затронутые в этой сессии

- `src/pages/FeedPageAcid.tsx` — удалён
- `src/styles/acid-pop.css` — удалён
- `src/app/App.tsx` — убран импорт acid-pop.css
- `src/widgets/Layout/Header.tsx` — очищен от Tailwind colors
- `src/pages/ChallengesPage.tsx` — мигрирован на cork-*
- `src/features/challenges/ChallengeCard.tsx` — мигрирован на cork-*
- `src/features/profile/AddAchievementModal.tsx` — мигрирован на CSS-переменные
