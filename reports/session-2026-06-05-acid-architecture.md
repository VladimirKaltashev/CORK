# Отчет по сессии — Acid Pop архитектура

## Дата
2026-06-05

## Что было сделано

### 1. Создана новая CSS-архитектура тем

**Файлы:**
- `src/styles/theme-tokens.css` — базовые CSS-переменные для всех тем
  - `--cork-bg`, `--cork-surface`, `--cork-surface-2`, `--cork-surface-3`
  - `--cork-text`, `--cork-text-dim`, `--cork-text-mute`
  - `--cork-brand`, `--cork-brand-hover`, `--cork-brand-2`
  - `--cork-king`, `--cork-clown`, `--cork-border`, `--cork-frame`
  - `--cork-radius-card`, `--cork-radius-btn`, `--cork-radius-pill`
  - `--cork-font-display`, `--cork-font-body`
  - `--cork-shadow`, `--cork-shadow-lg`, `--cork-glow`
  - Базовые значения для light, `.dark` overrides для тёмной темы

- `src/styles/theme-components.css` — универсальные `cork-*` классы
  - `.cork-page`, `.cork-shell`, `.cork-main`, `.cork-sidebar`
  - `.cork-card`, `.cork-panel`
  - `.cork-btn`, `.cork-btn-primary`, `.cork-btn-ghost`
  - `.cork-tabs`, `.cork-tab`
  - `.cork-user-row`, `.cork-user-card`, `.cork-stat`
  - `.cork-empty`, `.cork-verdict-bar`, `.cork-verdict-track`, `.cork-verdict-king`, `.cork-verdict-clown`
  - `.cork-header`, `.cork-header__inner`, `.cork-header__brand`, `.cork-header__nav`, `.cork-header__actions`, `.cork-header__mobile`
  - `.cork-nav-link`, `.cork-icon-btn`, `.cork-create-btn`
  - `.cork-avatar`, `.cork-section-title`, `.cork-head`, `.cork-title`, `.cork-desc`, `.cork-meta`, `.cork-link`
  - `.cork-tag`, `.cork-filter`, `.cork-dismiss`, `.cork-mobile-nav`
  - `.cork-card-foot`, `.cork-divider`, `.cork-skeleton`, `.cork-dropdown`
  - Глобальные стили: scrollbar, selection, focus ring

- `src/styles/themes/acid.css` — Acid Pop переопределения
  - Переопределяет все токены для Acid (зелёный `#c6ff3d`, тёмный `#070908`)
  - Добавляет декорации: grid background, scanlines, glow blobs
  - HUD-углы на `.cork-card` и `.cork-panel` (псевдоэлементы)
  - Notched buttons (clip-path)
  - Загружается через `data-theme="acid"` на `<html>`
  - **Агрессивные Tailwind overrides** — 80+ правил для всех `bg-*`, `text-*`, `border-*`, `dark:*`, `hover:*` классов, принудительно перезаписывающих Tailwind через `!important`

### 2. Обновлена инфраструктура тем

- `src/entities/theme/ThemeApplier.tsx` — при `theme === 'acid'` **не добавляет** `class="dark"` к `<html>`. Только `data-theme="acid"`.
- `src/entities/theme/ThemeApplier.test.tsx` — обновлён тест: ожидает `classList.contains('dark') === false` при Acid

### 3. Обновлены React-компоненты

- `src/app/App.tsx` — импортирует `theme-tokens.css`, `theme-components.css`, `themes/acid.css` (вместо старого `acid-pop.css`)
- `src/widgets/Layout/Layout.tsx` — убран `CreateAchievementFAB` (кнопка + теперь только в хедере), добавлен `cork-page` класс при Acid
- `src/widgets/Layout/Header.tsx` — **переписан полностью**:
  - Один универсальный хедер для всех тем
  - Убраны `HeaderAcid` и условный рендер
  - Brand слева, nav по центру, actions (поиск/+/профиль) справа
  - Hamburger только на мобильных
  - Навигация: Арена, Челленджи, Рейтинг, Профиль
  - Модерация — в дропдауне профиля
  - Кнопка `+` для всех авторизованных пользователей
- `src/pages/FeedPage.tsx` — убран `FeedPageAcid` (условный рендер удалён), остался один компонент
- `src/pages/SettingsPage.tsx` — адаптирован с `cork-panel` и `cork-head` классами

### 4. Tailwind overrides для Acid

Ключевая проблема: когда Acid не добавлял `dark` класс, компоненты с `dark:bg-gray-800` просто не применялись. Но компоненты с `bg-white` оставались белыми.

Решение: `themes/acid.css` содержит ~80+ правил `[data-theme="acid"] .bg-white`, `[data-theme="acid"] .bg-gray-800`, `[data-theme="acid"] .dark\:bg-gray-800`, `[data-theme="acid"] .hover\:bg-gray-700`, `[data-theme="acid"] .text-gray-900`, `[data-theme="acid"] .text-indigo-600` и т.д. — все с `!important`, принудительно перезаписывающие Tailwind.

### 5. Проверки

- ✅ `npm run lint` — 0 ошибок, 1 предупреждение (SubmissionForm, было раньше)
- ✅ `npx tsc -b --noEmit` — 0 ошибок
- ✅ `npm test` — 44 файла, 240 тестов, все пройдены
- ✅ `npm run build` — сборка проходит

## Архитектура: как это работает

1. При `theme === 'acid'` → `html` получает `data-theme="acid"`, без `class="dark"`
2. `theme-tokens.css` определяет переменные для light, `.dark` для тёмной
3. `themes/acid.css` переопределяет все переменные через `[data-theme="acid"]`
4. Все компоненты используют `cork-*` классы → автоматически подхватывают токены
5. Для legacy-компонентов с Tailwind — `acid.css` содержит overrides, перезаписывающие Tailwind
6. Создание новой темы: скопировать `acid.css` → `royal.css`, переопределить переменные → добавить импорт в App.tsx

## Осталось сделать

- Мигрировать оставшиеся `ap-*` классы (FeedPageAcid) на `cork-*`
- Переделать `FriendsPage` в универсальную страницу "Свои" (Crew)
- Проверить вручную в браузере: Light→Acid, Dark→Acid — результат должен быть одинаковым
- Проверить Header layout на desktop
- Проверить, что hamburger не дублирует профиль на desktop
- Проверить Create Achievement dialog в Acid

## Файлы, затронутые в этой сессии

- `src/styles/theme-tokens.css` — новый
- `src/styles/theme-components.css` — новый
- `src/styles/themes/acid.css` — новый
- `src/app/App.tsx` — обновлён
- `src/entities/theme/ThemeApplier.tsx` — обновлён
- `src/entities/theme/ThemeApplier.test.tsx` — обновлён
- `src/widgets/Layout/Layout.tsx` — обновлён
- `src/widgets/Layout/Header.tsx` — переписан
- `src/pages/FeedPage.tsx` — обновлён
- `src/pages/SettingsPage.tsx` — обновлён
