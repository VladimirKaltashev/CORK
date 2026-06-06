# Отчёт — исправление регрессий после массовой миграции

## Дата
2026-06-06

## CI
- ✅ `npm run lint` — 0 ошибок (1 pre-existing warning)
- ✅ `npx tsc --noEmit` — 0 ошибок
- ✅ `npm test` — 44 файла, 240 тестов
- ✅ `npm run build` — production сборка

## Коммит
`01798ca` — `fix: restore verdict bar, fix FeedPage text duplication, fix sidebar layout, fix Acid button text color, fix avatar fallback, fix friends requests`

---

## 1. Восстановлен verdict bar (tug-of-war) под достижениями

### Где был реализован
- **ReactionBar.tsx** — добавлен вердикт-бар над кнопками реакций
- **theme-components.css** — классы `.cork-verdict-bar`, `.cork-verdict-track`, `.cork-verdict-king`, `.cork-verdict-clown` уже существовали
- **themes/acid.css** — `.cork-verdict-track` и `.cork-verdict-king` уже имели acid-стили

### Почему пропал
При миграции FeedPageAcid → FeedPage (общий) verdict bar был частью FeedPageAcid, а не ReactionBar. Когда FeedPageAcid был удалён, verdict bar исчез. ReactionBar показывал только маленькие кнопки со счётчиками.

### Как исправлено
- ReactionBar теперь рендерит **flex-колонку** с двумя секциями:
  1. **Verdict bar** — полоса `cork-verdict-track` высотой 28px (sm) или 36px (md), разделённая на `cork-verdict-king` (слева) и `cork-verdict-clown` (справа). Ширина сегментов пропорциональна количеству голосов. Анимирует width через `transition: width 0.6s`.
  2. **Buttons** — остаются прежние кнопки с иконками и счётчиками.
- Нет ReactionBarAcid — один общий компонент.
- Acid-specific segmented/HUD вид через CSS-переменные в `themes/acid.css`.

### Код
```tsx
const total = crowns + clowns
const kingPct = total === 0 ? 50 : (crowns / total) * 100
const clownPct = total === 0 ? 50 : (clowns / total) * 100

<div className="cork-verdict-bar">
  <div className="cork-verdict-track" style={{ height: isSm ? '28px' : '36px' }}>
    {crowns > 0 && (
      <div className="cork-verdict-king" style={{ width: `${kingPct}%` }}>
        <span className="flex items-center gap-1">
          <CrownIcon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} /> {crowns}
        </span>
      </div>
    )}
    {clowns > 0 && (
      <div className="cork-verdict-clown" style={{ width: `${clownPct}%` }}>
        <span className="flex items-center gap-1">
          {clowns} <ClownIcon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
        </span>
      </div>
    )}
  </div>
</div>
```

---

## 2. Исправлено дублирование текста в FeedPage

### Проблема
Если `title === description` или `description` пустое — под заголовком показывалась та же строка.

### Как исправлено
- Добавлена функция `shouldShowDescription(title, description)`:
  - Возвращает `false` если description пустой
  - Возвращает `false` если description === title (case-insensitive, trim)
  - Возвращает `false` если description < 5 символов
  - Возвращает `false` если title содержит description или наоборот
- В FeedPage описание рендерится условно:
```tsx
{shouldShowDescription(item.title, item.description) && (
  <p className="cork-desc">{item.description}</p>
)}
```

---

## 3. Перераспределена sidebar FeedPage

### Что было
- Фильтры категорий занимали sidebar
- Блок "Чем поделишься?" имел кнопку с текстом "Поделиться"
- Sidebar перегружена

### Что стало
- **Фильтры** перенесены в main content — над лентой, под табами "Все / Друзья", в виде ряда `cork-tag` кнопок
- **InlineCreateCard** перенесён в main content — компактный блок с иконкой + и аватаром
- **Sidebar** теперь содержит:
  - Бюджет (BudgetWidget)
  - Топ королей (заглушка "Рейтинг скоро появится здесь")
  - Challenge banner

### InlineCreateCard
- Убран текст "Поделиться" — осталась только иконка `+` в квадратной кнопке
- Размер аватарки уменьшен с 40px до 32px
- Кнопка использует `var(--cork-brand-ink)` для текста

---

## 4. Исправлен цвет текста на кислотных кнопках

### Проблема
На Acid теме кнопки `cork-btn-primary` имеют `background: #c6ff3d` (яркий лайм) и `color: #fff` (белый). Белый на ярком лайме плохо читается.

### Решение
- Добавлен токен `--cork-brand-ink`:
  - Light: `#ffffff`
  - Dark: `#ffffff`
  - Acid: `#071005` (почти чёрный)
- В `theme-components.css` `.cork-btn-primary` теперь использует `color: var(--cork-brand-ink)` вместо `#fff`
- В `theme-tokens.css` добавлен `--cork-brand-ink` для light и dark
- В `themes/acid.css` добавлен `--cork-brand-ink: #071005`

### Затронутые кнопки
- Кнопка `+` в Header (cork-create-btn)
- Кнопка "Войти" на LoginPage
- Кнопка "Зарегистрироваться" на RegisterPage
- Кнопка "+ Добавить" в ProfilePage
- Активные табы в LeaderboardPage
- Все `cork-btn-primary` в Acid

---

## 5. Исправлен fallback avatar в Acid

### Проблема
Если у пользователя нет фото, fallback аватар имел `background: var(--cork-brand)` (лайм) и `color: #fff` (белый). На кислотном фоне белый текст на лаймовом фоне плохо читается.

### Решение
В `themes/acid.css`:
```css
[data-theme="acid"] .cork-avatar {
  background: var(--cork-surface-2) !important;
  color: var(--cork-brand) !important;
  border: 1px solid var(--cork-frame);
}
```
- Фото-аватары не тронуты

---

## 6. Исправлены заявки в друзья

### Почему не работали
Причина: **currentUserId === null** в `useFriendsStore`.

`sendRequest` в store проверял `get().currentUserId`:
```ts
const myId = get().currentUserId
if (!myId) return  // ← silently returned!
```

Но `currentUserId` устанавливается только при вызове `loadFriendships()`. На **SearchPage** `loadFriendships()` никогда не вызывался, поэтому `currentUserId` был null, и `sendRequest` молча возвращалась без ошибки и без запроса к Supabase.

### Как исправлено
- `sendRequest`, `acceptRequest`, `removeRecord` теперь используют fallback:
```ts
const myId = get().currentUserId ?? useAuthStore.getState().user?.id
```
- Если `currentUserId` null (дружба не загружена), берётся ID из auth store.
- Добавлено информативное сообщение об ошибке: "Не удалось отправить запрос — войдите в систему"

### Проверка
- `sendRequest` теперь не зависит от предварительного вызова `loadFriendships()`
- RLS не виноват — запрос даже не уходил на сервер
- Не блокировалось из-за guest/auth state — теперь используется auth store напрямую

---

## 7. Челленджи

- Проверены: нет явных ошибок после миграции
- Глубокий рефактор челленджей отложен по запросу

---

## Оставшиеся баги

1. **Text-red-500 в error messages** — осталось ~15 matches в формах (не критично для Acid, красный универсален)
2. **TimerPage / TimerWidget** — остались Tailwind colors, не критично для Acid
3. **FriendsPage** — не трогали по запросу
4. **OnboardingTour** — overlay bg-black/60, modal bg-white — остались не мигрированными
5. **Toast** — success/error/info/warning colors через bg-* — остались
6. **Mini leaderboard в sidebar** — заглушка, нужно будет подключить реальные данные позже
