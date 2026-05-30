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
- _Будет переписан под механику CORK: цели, челленджи._

## Схема БД

### Текущая

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
                                  public.reactions (achievement_id, user_id, kind: 'crown' | 'clown', cost)
                                    └─ бюджет: 10 голосов/неделю, сброс понедельник 00:00
                                    └─ корона = 1 голос, клоун = 2 голоса
                                    └─ мутации через RPC: toggle_reaction(), get_reaction_budget()

                                  view profile_scores (id, name, avatar, crowns, clowns)

   public.friends (user_id, friend_id, status: 'pending' | 'accepted')
```

Категории: `olympiad | academic | it | creative | sport | movies | games | other`.
Статус достижения: `pending | verified | rejected` (модерация админом).

### В разработке

```
profiles ─┬─── goals          (вишлист, 👑 и 🤡; при выполнении → achievement)
          └─── posts          (свободная арена, 👑 и 🤡, опц. challenge_id)

reactions ── расширение на target_type: 'goal' | 'post'
```

## Маршруты

| Путь                    | Кто видит       | Что внутри                                          |
|-------------------------|-----------------|-----------------------------------------------------|
| `/feed`                 | авторизованные  | Лента (Все / Друзья + фильтр категорий + сортировки) |
| `/profile/me`           | авторизованные  | Свой профиль: достижения, цели, посты, бейджи       |
| `/profile/:id`          | авторизованные  | Чужой профиль + кнопка дружбы                       |
| `/planner`              | авторизованные  | Планировщик задач и учебных сессий                  |
| `/timer`                | авторизованные  | Таймер pomodoro / учебных сессий                    |
| `/friends`              | авторизованные  | Друзья и входящие заявки                            |
| `/groups`               | авторизованные  | Список учебных групп                                |
| `/groups/:id`           | авторизованные  | Детальная страница группы                           |
| `/leaderboard`          | авторизованные  | Рейтинг пользователей                               |
| `/challenges`           | авторизованные  | Активные и архивные челленджи                       |
| `/challenges/:id`       | авторизованные  | Детали челленджа: сабмиты, лидерборд, форма         |
| `/search`               | авторизованные  | Поиск пользователей                                 |
| `/settings`             | авторизованные  | Настройки профиля                                   |
| `/admin`                | role=admin      | Модерация достижений и челленджей (создание/сабмиты)|
| `/login`, `/register`   | гости           | Auth-экраны                                         |

_Будущие маршруты: публичный профиль без логина._

## Запуск локально

### Быстро — одним кликом / одной командой

В корне проекта есть `start.ps1` (и обёртка `start.cmd` для двойного клика). Скрипт:
1. Проверяет/запускает Docker Desktop.
2. Поднимает локальный Supabase (если ещё не запущен).
3. Опционально применяет миграции + seed (`-Reset`).
4. Открывает `http://localhost:5173` в браузере.
5. Запускает Vite dev-server в текущем окне.

Supabase CLI лежит в репозитории по пути `./supabase/supabase.exe` — отдельная установка не нужна.

```powershell
.\start.ps1               # обычный запуск
.\start.ps1 -Reset        # + supabase db reset (после изменений схемы/seed)
.\start.ps1 -NoBrowser    # без открытия браузера
```

Двойной клик по `start.cmd` равнозначен `.\start.ps1` без флагов.

### Остановка стека

`Ctrl+C` в окне со start.ps1 завершает только Vite — контейнеры Supabase продолжат крутиться в Docker. Чтобы их погасить:

```powershell
.\stop.ps1                # supabase stop (DB volume сохраняется)
.\stop.ps1 -NoBackup      # без дампа БД перед остановкой
```

Двойной клик по `stop.cmd` равнозначен `.\stop.ps1`. Docker Desktop остаётся работать — закрывай его руками, если нужно.

### Вручную (если хочется по шагам)

#### 1. Установка зависимостей
```bash
npm install
```

#### 2. Локальный Supabase
Локальный `supabase.exe` уже лежит в `./supabase/supabase.exe`. Если хочешь использовать глобально установленный CLI ([инструкция](https://supabase.com/docs/guides/cli)) — просто замени путь ниже.

```powershell
./supabase/supabase.exe start          # поднимает Postgres + Auth + Storage в Docker
./supabase/supabase.exe db reset       # применяет migrations/ и seed.sql
./supabase/supabase.exe stop           # останавливает контейнеры
```

После старта CLI напечатает `API URL` и `anon key` — положи их в `.env.local`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<твой anon key>
```

#### 3. Dev-сервер
```bash
npm run dev
```

Открой `http://localhost:5173`. Тестовые пользователи — пароль `Test123456`, список email в `supabase/seed.sql`.

### Если supabase не стартует (Windows)

Скорее всего, Hyper-V/WSL зарезервировал порт 54322. Из админского PowerShell:
```powershell
net stop winnat
.\stop.ps1
net start winnat
.\start.ps1
```

## Скрипты

| Команда                  | Что делает                                  |
|--------------------------|---------------------------------------------|
| `npm run dev`            | Vite dev-server с HMR                       |
| `npm run build`          | `tsc -b` + `vite build`                     |
| `npm run preview`        | Превью production-сборки                    |
| `npm run lint`           | ESLint по `ts`/`tsx`                        |
| `npm run lint:fix`       | ESLint с автофиксами                        |
| `npm run format`         | Prettier по `src/**/*.{ts,tsx,css}`         |
| `npm test`               | Vitest run (юнит/интеграционные тесты)      |
| `npm run test:coverage`  | Те же тесты + отчёт по покрытию             |
| `npm run test:ui`        | Vitest UI в браузере (watch + детали)       |
| `npm run e2e`            | Playwright (E2E) headless                   |
| `npm run e2e:ui`         | Playwright (E2E) интерактивный UI          |

## Тестирование

### Стек
- **Vitest 4** + **@testing-library/react** + **jsdom** — unit / component / integration
- **MSW 2** — моки HTTP-запросов в тестах
- **Playwright** — E2E в headless / UI-режиме

```bash
npm test                  # Vitest (231 тестов, 43 файла)
npm run test:coverage     # + отчёт покрытия
npm run test:ui           # интерактивный UI Vitest
npm run e2e               # Playwright headless
npm run e2e:ui            # Playwright интерактивный UI
```

### Статус

**44 тестовых файла, 238 тестов, 100% pass**

| Тип | Описание | Файлы (примеры) |
|-----|----------|-----------------|
| **Схемы** (Zod) | Валидация форм регистрации, достижений, профиля, фида, челленджей | `shared/schemas/auth`, `achievement`, `profile`, `feed`, `challenge` |
| **Утилиты** | cn(), даты, permissions, debounce, toast, api, mockData, supabase client | `shared/lib/*` |
| **Сторы (unit)** | Логика Zustand-сторов: auth, profile, achievements, friends, feed, planner, reactions, theme, timer, group, dashboard, leaderboard, status, onboarding, challenges | `entities/*/store`, `entities/*/store.test` |
| **Компоненты** | Рендер UI-компонентов: Toast, Icon, AvatarUpload, ThemeApplier, ReactionBar, BudgetWidget, ProtectedRoute, PublicRoute, useModal, format | `shared/ui/*`, `features/*`, `app/router/*` |
| **Интеграционные (MSW)** | Сквозные сценарии против MSW-бэкенда: auth, routes, planner, dashboard, reactions, feed, challenges | `test/integration/*` |
| **E2E (Playwright)** | Smoke: login page, home→login redirect, challenges. Login flow: проверка отображения ошибки | `e2e/smoke`, `e2e/login`, `e2e/challenges` |

### CI/CD — GitHub Actions

Пять проверок на каждый push / PR в `.github/workflows/ci.yml`:

| Job | Команда | Зачем |
|-----|---------|-------|
| **lint** | `npm run lint` | ESLint + typescript-eslint |
| **typecheck** | `npx tsc -b --noEmit` | TypeScript strict mode |
| **test** | `npm test` | Vitest (unit + integration) |
| **build** | `npm run build` | tsc + vite build |
| **e2e** | `npm run e2e` | Playwright (требует `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в secrets) |

## Правила контрибуции

- TypeScript без `any` (ESLint выставлено в error).
- Абсолютные импорты через `@/`.
- Каждый слой/модуль экспортирует через свой `index.ts`.
- Моки только в `src/mocks/`.
- Ошибки наружу — явные (через `showToast` или `throw`).
- После изменений: `npm run build && npm run lint`.
