# CORK — Clown or King

**Соцсеть с приговором.** Каждый пост — ставка: ты король или клоун. Решает толпа.
👑 корона = 1 голос, 🤡 клоун = 2 голоса, бюджет 10 голосов в неделю.

Продуктовое описание, сценарии, концепция — в [`product.md`](./product.md).

## Стек

### Frontend
- **React 19** + **TypeScript** + **Vite 8** — UI, типы, dev-server / сборка
- **React Router 6** — клиентский роутинг
- **Zustand 5** — глобальное состояние (auth, profile, friends, achievements, onboarding и т.д.)
- **React Hook Form 7** + **Zod 4** — формы и валидация схем
- **Tailwind CSS 3** + **@primer/react** — стилизация и базовые UI-примитивы
- **date-fns** — относительное время (`5 минут назад`), локализация `ru`
- **clsx** + **tailwind-merge** — утилиты классов

### Backend
- **Supabase** (Postgres 17 + Auth + RLS) как BaaS:
  - `auth.users` — пользователи, JWT-сессии, регистрация по email/паролю
  - Доменные таблицы в `public.*` (см. схему ниже)
  - Триггер `on_auth_user_created` автоматически создаёт `profile` при регистрации
  - Локальный стек поднимается через `supabase` CLI (`supabase db reset` применяет миграции + seed)

### Тестирование
- **Vitest 4** + **@testing-library/react** — unit/component
- **Playwright** — e2e (`/e2e`)
- **MSW** — моки HTTP в dev/тестах

### Инструменты
- ESLint 10 + typescript-eslint, Prettier 3
- TypeScript strict, без `any` в нашем коде

## Архитектура — Feature-Sliced Design

Структура `src/` следует FSD-слоям (сверху вниз каждый слой может импортировать только нижние):

```
src/
├── app/         # инициализация: BrowserRouter, ThemeProvider, роуты, защита роутов
├── pages/       # экраны, привязанные к URL: FeedPage, ProfilePage, FriendsPage, ...
├── widgets/     # композитные блоки страниц: Layout, Header, виджеты планировщика
├── features/    # пользовательские сценарии: feed, profile (модалки/формы), onboarding, ...
├── entities/    # бизнес-сущности и их сторы: auth, profile, achievements, friends, ...
├── shared/      # переиспользуемое: ui-кит, hooks, lib (supabase, toast), constants, schemas, types
├── mocks/       # MSW handlers + mock data (dev/тесты)
└── test/        # setup для Vitest
```

Пути с алиасом `@/` указывают на `src/` (`vite.config.ts`).

### Поток данных
1. UI (страницы/widgets/features) вызывает действия Zustand-стора (`entities/*/store.ts`).
2. Стор обращается к Supabase через `shared/lib/supabase.ts`.
3. Postgres возвращает данные, проходящие через RLS (`auth.uid()` → политики на строках).
4. Ошибки показываются через `showToast` из `shared/lib/toast.ts`.

### Auth
- Регистрация: `supabase.auth.signUp` → триггер `handle_new_user` создаёт строку в `public.profiles` → `loadProfile` подтягивает её во фронт.
- Логин: `signInWithPassword` → токен в Zustand.
- Защита роутов: `ProtectedRoute` / `PublicRoute` (`src/app/router/`). Админка проверяет `user.role === 'admin'`.

### Онбординг
- `src/features/onboarding/` — coachmark-тур по UI: подсветка реальных элементов через `data-onboard="…"`.
- Автозапуск один раз после первого логина (флаг `onboarding_v1_completed` в `localStorage`).
- Повторный запуск — пункт «Подсказки» в выпадашке аватара.
- _Будет переписан под механику CORK: реакции с бюджетом, цели, челленджи._

## Схема БД

### Текущая (фундамент)

```
auth.users (Supabase Auth)
   └─[trigger: handle_new_user]──▶ public.profiles (id, name, email, bio, contacts, avatar, is_admin, registered_at)
                                            │
                                            ▼
                                  public.achievements (user_id, category, title, description, year,
                                                       proof_type, proof_value, status, rejection_reason,
                                                       meta, created_at)
                                            │
                                            ▼
                                  public.likes (achievement_id, user_id)

   public.friends (user_id, friend_id, status: 'pending' | 'accepted')
```

Категории: `olympiad | academic | it | creative | sport | movies | games | other`.
Статус достижения: `pending | verified | rejected` (модерация админом).

### Целевая (после миграции под концепцию CORK)

```
profiles ─┬──▶ achievements   (защищённое портфолио, только 👑)
          ├──▶ goals          (вишлист, 👑 и 🤡; при выполнении → achievement)
          └──▶ posts          (свободная арена, 👑 и 🤡, опц. challenge_id)

reactions (target_type, target_id, user_id, kind: 'crown' | 'clown', cost)
   ├─ target_type: 'achievement' | 'goal' | 'post'
   └─ кост: корона = 1, клоун = 2

reaction_budgets (user_id, week_start, spent)
   └─ 10 голосов в неделю, сброс понедельник 00:00

challenges (id, title, type: 'weekly' | 'monthly' | 'seasonal',
            category?, starts_at, ends_at)

badges (user_id, type: 'king_week' | 'clown_week' | 'king_month' | 'serial_king' | ...,
        label, awarded_at, challenge_id?)

friends (user_id, friend_id, status: 'pending' | 'accepted')
```

Дорожка миграции:
1. `reactions` заменяет `likes`, расширяет на goals и posts.
2. Появляются `goals` (вишлист) и `posts` (свободные посты).
3. `reaction_budgets` — учёт недельных голосов.
4. `challenges` + `badges` — недельный/месячный ритм и постоянные награды.

## Маршруты

| Путь                | Кто видит       | Что внутри                                          |
|---------------------|-----------------|-----------------------------------------------------|
| `/feed`             | авторизованные  | Лента (Все / Друзья + фильтр категорий + сортировки) |
| `/profile/me`       | авторизованные  | Свой профиль: достижения, цели, посты, бейджи       |
| `/profile/:id`      | авторизованные  | Чужой профиль + кнопка дружбы                       |
| `/friends`          | авторизованные  | Друзья и входящие заявки                            |
| `/search`           | авторизованные  | Поиск пользователей                                 |
| `/admin`            | role=admin      | Модерация достижений и конверсий целей              |
| `/login`,`/register`| гости           | Auth-экраны                                         |

_Будущие маршруты: `/challenges` (активные + история), публичный профиль без логина._

## Запуск локально

### 1. Установка зависимостей
```bash
npm install
```

### 2. Локальный Supabase
Нужен установленный Supabase CLI ([инструкция](https://supabase.com/docs/guides/cli)).

```bash
supabase start          # поднимает Postgres + Auth + Storage в Docker
supabase db reset       # применяет migrations/ и seed.sql
```

После старта CLI напечатает `API URL` и `anon key` — положи их в `.env.local`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<твой anon key>
```

### 3. Dev-сервер
```bash
npm run dev
```

Открой `http://localhost:5173`. Тестовые пользователи — пароль `Test123456`, список email в `supabase/seed.sql`.

## Скрипты

| Команда                  | Что делает                                  |
|--------------------------|---------------------------------------------|
| `npm run dev`            | Vite dev-server с HMR                       |
| `npm run build`          | `tsc -b` + `vite build`                     |
| `npm run preview`        | Превью production-сборки                    |
| `npm run lint`           | ESLint по `ts`/`tsx`                        |
| `npm run lint:fix`       | ESLint с автофиксами                        |
| `npm run format`         | Prettier по `src/**/*.{ts,tsx,css}`         |
| `npm test`               | Vitest run                                  |
| `npm run test:coverage`  | Покрытие                                    |
| `npm run e2e`            | Playwright                                  |

## Правила контрибуции

- TypeScript без `any` (ESLint выставлено в error).
- Абсолютные импорты через `@/`.
- Каждый слой/модуль экспортирует через свой `index.ts`.
- Моки только в `src/mocks/`.
- Ошибки наружу — явные (через `showToast` или `throw`).
- После изменений: `npm run build && npm run lint`.
