# Отчёт — исправление точечных визуальных багов

## Дата
2026-06-06

## Коммит
`52b2c06` — `fix: verdict bar full-width, Acid brand-ink specificity, verified check green, leaderboard active tab ink, ProfilePage button`

## CI
- ✅ lint — 0 errors, 1 pre-existing warning
- ✅ typecheck — 0 errors
- ✅ test — 44 файла, 240 тестов
- ✅ build — production

---

## 1. Verdict bar — полноширинный, под контентом

### Проблема
- Verdict bar был в правом верхнем углу карточки (`flex-shrink-0`) и выглядел как маленький индикатор
- При 0/0 голосов bar исчезал полностью (условный рендеринг `crowns > 0` и `clowns > 0`)

### Исправлено
- **FeedPage.tsx** — ReactionBar перенесён из правого верхнего угла в основную область карточки, под контент (title, description, proof), с отступом `mt-3`
- **ReactionBar.tsx** — bar теперь рендерится всегда, даже при 0/0. King и clown сегменты всегда присутствуют с `width: 50%` при 0/0. Добавлен `display: flex` inline.
- Высота: 28px (sm) / 36px (md) — внутри `cork-verdict-track` с `height`

```tsx
<div className="cork-verdict-track" style={{ height: barHeight }}>
  <div className="cork-verdict-king" style={{ width: `${kingPct}%`, display: 'flex' }}>
    <span className="flex items-center gap-1">
      <CrownIcon /> {crowns}
    </span>
  </div>
  <div className="cork-verdict-clown" style={{ width: `${clownPct}%`, display: 'flex', marginLeft: 'auto' }}>
    <span className="flex items-center gap-1">
      {clowns} <ClownIcon />
    </span>
  </div>
</div>
```

### Кнопки
- Кнопки 👑/🤡 остаются под bar, маленькие, как раньше

---

## 2. Acid — brand-ink цвет через CSS specificity

### Проблема
- `cork-btn-primary` в `theme-components.css` использовал `color: var(--cork-brand-ink)`
- Но в `themes/acid.css` для `cork-btn-primary` добавлялся `box-shadow` без `color`, и `.cork-btn` из `theme-components.css` задавал `color: var(--cork-text)`
- Specificity: `.cork-btn` и `.cork-btn-primary` — одинаковая (0,1,0). Порядок в CSS: `.cork-btn` шёл раньше, `.cork-btn-primary` позже → `color: var(--cork-brand-ink)` должен был работать.
- **Но**: `cork-create-btn` имел жёсткий `color: #fff` в `theme-components.css`! Это override ломал Acid.
- А Leaderboard active tabs имели inline `style={{ color: '#fff' }}` — это ломало Acid.

### Исправлено
1. **themes/acid.css** — добавлены явные Acid-specific overrides с `!important`:
```css
[data-theme="acid"] .cork-btn-primary,
[data-theme="acid"] .cork-create-btn {
  color: var(--cork-brand-ink) !important;
}

[data-theme="acid"] .cork-tab.active,
[data-theme="acid"] .cork-tabs .active {
  color: var(--cork-brand-ink) !important;
}
```
2. **LeaderboardPage.tsx** — inline `style` для активных табов изменён с `color: '#fff'` на `color: 'var(--cork-brand-ink)'`
3. **FeedPage.tsx** — active category tags уже использовали `var(--cork-brand-ink)` (ок)

### Почему не применялся brand-ink к Header + кнопке
- `cork-create-btn` в `theme-components.css` имел `color: #fff` жёстко
- В Acid `color: #fff` оставался белым, а `var(--cork-brand-ink)` для Acid = `#071005` (почти чёрный)
- Теперь `[data-theme="acid"] .cork-create-btn` с `!important` переопределяет

---

## 3. ProfilePage — кнопка "+ Добавить"

### Проблема
- `className="cork-btn-primary"` — без `cork-btn`, поэтому не получал padding, flex, uppercase transform
- Текст "+ Добавить" с `text-transform: uppercase` выглядел как `+ ДОБАВИТЬ`

### Исправлено
```tsx
<button className="cork-btn cork-btn-primary" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
  + Добавить
</button>
```
- Теперь кнопка получает все `.cork-btn` стили (padding, flex, transition) + `.cork-btn-primary` (фон, цвет)
- `textTransform: 'none'` отменяет uppercase, `+ Добавить` выглядит нормально

---

## 4. Verified check — оранжевый вместо зелёного

### Проблема
- `AchievementCard.tsx` — `StatusBadge` для `verified` использовал `color: 'var(--cork-king)'`
- `--cork-king` в light = `#d97706` (оранжевый), в dark = `#fbbf24` (жёлтый)
- Должен быть зелёный

### Исправлено
1. Добавлен токен `--cork-success`:
   - Light: `#22c55e` (green-500)
   - Dark: `#22c55e`
   - Acid: `var(--cork-brand)` (кислотный лайм)
2. **AchievementCard.tsx** — `CheckIcon` для verified теперь использует `color: 'var(--cork-success)'`

---

## 5. Leaderboard active tab

### Проблема
- Активный таб "Короли" имел `style={{ color: '#fff' }}` — белый текст
- В Acid: белый на лаймовом = плохо читается

### Исправлено
- `color: 'var(--cork-brand-ink)'` вместо `color: '#fff'` для обоих активных табов
- Acid: `#071005` (чёрный) на лаймовом = читается отлично
- Light/Dark: `#ffffff` на brand-цвете = читается

### Clown tab
- Использует тот же `var(--cork-brand-ink)` — для розового/красного фона `#fff` работает, а `#071005` тоже читается (контраст с `#ff2d78` достаточный)

---

## Что не трогали
- Crew/Friends — не делали
- Челленджи — не трогали
- Новые темы — не добавляли
- Не создавали *Acid компоненты
- FeedPageAcid — не возвращали

---

## Проверить в браузере
1. **FeedPage** — verdict bar шириной 100% под каждой карточкой, даже при 0/0 голосов
2. **Acid** — Header + кнопка (чёрный текст), Leaderboard активные табы (чёрный текст), ProfilePage + Добавить (чёрный текст)
3. **Light/Dark** — verified check зелёный, не оранжевый
4. **ProfilePage** — кнопка "+ Добавить" выровнена с заголовком, нормальный padding
