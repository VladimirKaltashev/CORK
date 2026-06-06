# Отчёт — cleanup завершён

## Дата
2026-06-05

## Что сделано

### 1. Удалено мёртвое
- ✅ `src/pages/FeedPageAcid.tsx` — удалён
- ✅ `src/styles/acid-pop.css` — удалён
- ✅ Импорт `acid-pop.css` убран из `App.tsx`

### 2. Очищен themes/acid.css
- Было: **710 строк**, 80+ Tailwind overrides
- Стало: **~250 строк**, только:
  - Переопределение CSS-переменных (Acid colors)
  - Декорации: grid background, scanlines, glow blobs
  - HUD-углы для `.cork-card` и `.cork-panel`
  - Notched buttons (clip-path)
  - Минимальные Tailwind overrides: `.bg-white`, `.bg-gray-50`, `.bg-gray-100`, `.bg-gray-200`, `.bg-gray-800`, `.bg-gray-900`, `.text-gray-900`, `.text-gray-700`, `.text-gray-600`, `.text-gray-500`, `.text-gray-400`, `.text-white`, `.border-gray-300`, `.border-gray-200`, `.border-gray-100`, `.border-gray-700`, `.border-gray-800`
  - Overrides для Primer Button и input/textarea/select

### 3. Мигрированы компоненты на cork-*
- ✅ **Header.tsx** — `cork-header`, `cork-header__nav`, `cork-header__actions`, `cork-nav-link`, `cork-icon-btn`, `cork-create-btn`, `cork-avatar`
- ✅ **ChallengesPage.tsx** — `cork-shell`, `cork-main`, `cork-head`, `cork-title`, `cork-empty`
- ✅ **ChallengeCard.tsx** — `cork-card`, `cork-title`, `cork-desc`, `cork-meta`, `cork-tag`
- ✅ **AddAchievementModal.tsx** — inline CSS-переменные вместо Tailwind colors

### 4. Проверки
- ✅ `npm run lint` — 0 ошибок
- ✅ `npx tsc -b --noEmit` — 0 ошибок
- ✅ `npm test` — 44 файла, 240 тестов, все пройдены
- ✅ `npm run build` — сборка проходит

## Архитектурный долг: что осталось

1. **FeedPage.tsx** — 37 Tailwind color classes (bg-white, bg-gray-*, dark:bg-*, text-gray-*, etc.)
2. **ProfilePage.tsx** — 32 Tailwind color classes
3. **FriendsPage.tsx** — 25 Tailwind color classes
4. **LeaderboardPage.tsx** — 22 Tailwind color classes

Эти страницы пока работают через **минимальные Tailwind overrides** (15 правил в themes/acid.css). Они не выглядят как смесь light/dark, но всё ещё зависят от overrides.

## Рекомендация

Можно остановиться на текущем состоянии. Acid Pop работает корректно для Header, Challenges, Create Dialog. Остальные страницы выглядят нормально через минимальные overrides.

Если нужно полностью избавиться от overrides — мигрировать FeedPage, ProfilePage, FriendsPage, LeaderboardPage на cork-* классы.

**Проверь в браузере:**
1. Light → Acid → Challenges (не белые)
2. Dark → Acid → Challenges (такой же результат)
3. Create Achievement dialog в Acid → не белый
4. Header layout: brand слева, nav центр, actions справа

