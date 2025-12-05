# Upstream Telegram Feedback Bot

GrammY + Drizzle (Neon Postgres) + AWS S3 бот для збору ідей/відгуків і адміністрування статусів у Telegram.

## Швидкий старт

1) Скопіюй `.env.example` → `.env` і заповни:
```
TELEGRAM_BOT_TOKEN=...
ADMIN_CHAT_ID=...            # id адмін-групи
DATABASE_URL=...             # Neon postgres URL
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
S3_REGION=...
WEBHOOK_URL=...              # опційно, якщо ставиш вебхук
PORT=3000                    # для вебхуку
```

2) Проганяємо міграції:
```
npm run drizzle:generate   # згенерувати SQL з schema.ts
npm run drizzle:push       # залити в БД
```

3) Запуск у дев-режимі (long polling):
```
npm run dev
```

В проді можна навісити `WEBHOOK_URL` (тоді бот сам поставить вебхук) або залишити long polling.

## Що вже є
- Стейт-машина: `/start`/`/idea` → вибір ідентифікації → ім’я/зв’язок/контакт → тип → текст → збір вкладень → відправка.
- S3 аплоад фоток/доків, посилання в БД.
- Запис у Postgres через Drizzle (`users`, `feedback`, `attachments`, `sessions`).
- Адмін-картка в ADMIN_CHAT_ID з inline-кнопками статусів; апдейти статусу змінюють БД і редагують повідомлення.
- Команди адмінів `/stats_today` та `/stats_week`.

## Основні команди
- `/start`, `/idea` — початок флоу.
- `/cancel` — скинути поточний процес.
- `/stats_today`, `/stats_week` — тільки в адмін-чаті.

## Структура
- `src/bot.ts` — запуск бота.
- `src/config.ts` — env і константи кнопок.
- `src/state.ts` — типи стейтів/сесії.
- `src/session.ts` — session storage на Drizzle.
- `src/db/` — Drizzle schema + ініціалізація.
- `src/handlers/` — user/admin флоу.
- `src/services/` — S3, Telegram helper-и, робота з БД.

## TODO (із запиту)
- Налаштувати @BotFather + ADMIN_CHAT_ID.
- Заповнити продові креденшли в `.env`.
- Зібрати політику модерації/ескалації та розписати ролі в адмін-чаті.
