# Зависимости проекта (Olympiad Tracker)

## Frontend (`package.json`)

### Основные зависимости
- **react**: ^18.2.0 (UI библиотека)
- **react-dom**: ^18.2.0 (Рендеринг)
- **react-router-dom**: ^6.x (Роутинг)
- **axios**: ^1.x (HTTP клиент для связи с бэком)
- **zustand**: ^4.x (Управление состоянием, легковесная альтернатива Redux)
- **react-hook-form**: ^7.x (Управление формами)
- **@hookform/resolvers**: ^3.x (Интеграция валидации с RHF)
- **zod**: ^3.x (Валидация схем данных)
- **react-calendar-heatmap**: ^1.x (GitHub-style календарь активности)
- **date-fns**: ^2.x или ^3.x (Работа с датами для календаря)
- **clsx**: ^2.x (Условные классы)
- **tailwind-merge**: ^2.x (Оптимизация Tailwind классов)

### Dev-зависимости
- **typescript**: ^5.x
- **vite**: ^5.x (Сборщик)
- **tailwindcss**: ^3.x (CSS фреймворк)
- **postcss**: ^8.x
- **autoprefixer**: ^10.x
- **eslint**: ^8.x (Линтер)
- **@typescript-eslint/parser**: ^6.x
- **@typescript-eslint/eslint-plugin**: ^6.x
- **prettier**: ^3.x (Форматирование)
- **vitest**: ^1.x (Unit тесты)
- **@testing-library/react**: ^14.x (Тестирование компонентов)
- **@playwright/test**: ^1.x (E2E тесты)

---

## Backend (`backend/requirements.txt`)

- **fastapi**: >=0.100.0 (Web фреймворк)
- **uvicorn**: >=0.20.0 (ASGI сервер)
- **pydantic**: >=2.0.0 (Валидация данных)
- **python-jose[cryptography]**: (Для JWT токенов, если будем внедрять реальную auth)
- **passlib[bcrypt]**: (Для хеширования паролей в будущем)

---

## Как установить

### Frontend
```bash
npm install
```
### Backend
cd backend
pip install -r requirements.txt
# Или вручную:
pip install fastapi uvicorn pydantic
