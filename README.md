# StudentFlow

StudentFlow — україномовний вебзастосунок для персональних студентських маршрутів: навігатор можливостей, докази результатів, бали, відзнаки, менторський фідбек та адміністративний контур.

## Стек

- Next.js 15, React, TypeScript, App Router;
- Supabase Postgres через service-role серверний шар;
- ImageKit для медіа активностей;
- bcrypt-хешування паролів;
- Zod для серверної валідації;
- Tailwind CSS і власна адаптивна UI-система маршрутів.

## ImageKit

Для України та європейської аудиторії обирайте регіон:

```text
Frankfurt (Europe) / eu1
```

Потрібні ключі беруться в ImageKit Dashboard:

1. Відкрийте ImageKit Dashboard.
2. Перейдіть у `Developer options` / `API keys`.
3. Скопіюйте `URL Endpoint`, `Public Key`, `Private Key`.
4. Додайте їх у `.env` або в Render Environment:

```env
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_FOLDER=/studentflow
```

`IMAGEKIT_PRIVATE_KEY` не можна додавати у клієнтський код або публічний репозиторій.

## Запуск у Windows

1. Скопіюйте `.env.example` у `.env`.
2. Заповніть Supabase та ImageKit змінні.
3. Запустіть [start-local.bat](start-local.bat).

Скрипт встановлює залежності, застосовує Supabase-міграції, наповнює порожню базу початковими даними, синхронізує ImageKit за наявності ключів, запускає сайт і відкриває браузер.

Для `SUPABASE_DB_URL` краще брати `Session pooler` connection string у Supabase `Connect`, якщо direct URI не підключається локально. Direct host `db.<project-ref>.supabase.co` часто доступний тільки через IPv6, а pooler працює через IPv4.

Ручний запуск:

```powershell
npm install
npm run setup
npm run dev
```

Відкрити: `http://localhost:3000`.

## Початкові акаунти

| Роль | Пошта | Пароль |
| --- | --- | --- |
| Адміністратор | `danylo.stakhiv@studentflow.edu.ua` | `DmtfkAdmin-2026!` |
| Викладач | `olena.levchenko@studentflow.edu.ua` | `MentorRoute-2026!` |
| Студент | `ivan.bondar@studentflow.edu.ua` | `StudentRoute-2026!` |

## Основні команди

```powershell
npm run db:migrate      # створити/оновити схему Supabase
npm run db:seed         # наповнити Supabase, якщо база порожня
npm run db:seed:force   # очистити й заново наповнити Supabase
npm run imagekit:seed   # завантажити seed-медіа в ImageKit, якщо задані ключі
npm run typecheck       # перевірити TypeScript без запуску тестів
```

## GitHub

Для нового репозиторію:

```powershell
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/danilostahiv887-cmd/StudentFlow.git
git push -u origin main
```

`.env`, `node_modules`, `.next` і логи не потрапляють у git через `.gitignore`.

## Render production deploy

На Render створюйте `Web Service`, не `Static Site`, бо застосунок використовує серверні маршрути, cookies, Supabase service-role і динамічні сторінки.

Налаштування:

```text
Runtime: Node
Build Command: npm ci && npm run build
Start Command: npm run start
```

У Environment додайте:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-render-service.onrender.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
SUPABASE_PROJECT_REF=wkjvchswentqsixduewf
SUPABASE_ACCESS_TOKEN=
SUPABASE_WAKE_ENABLED=true
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_FOLDER=/studentflow
```

`npm run build` компілює production-збірку Next.js. `npm run start` запускає її в production-режимі. Логотип/індикатор Next.js зліва знизу з’являється тільки в dev-режимі; для локального dev він додатково вимкнений у `next.config.ts`.

Перед першим деплоєм або після зміни seed-даних виконайте локально з заповненим `.env`:

```powershell
npm run setup
```

Це створить схему в Supabase, наповнить порожню базу і синхронізує ImageKit.

### Автоматичний запуск paused Supabase

На Free Plan Supabase може ставити проєкт на паузу після низької активності або після ручного `Pause project`. Щоб перший відвідувач сайту на Render автоматично запускав БД, додайте в Render Environment:

```env
SUPABASE_PROJECT_REF=wkjvchswentqsixduewf
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_WAKE_ENABLED=true
```

`SUPABASE_ACCESS_TOKEN` створюється в Supabase Dashboard → Account → Access Tokens. Токен має залишатися тільки на сервері Render, без префікса `NEXT_PUBLIC_`.

Як це працює:

- якщо Supabase відповідає як paused/unavailable, сервер надсилає `POST /v1/projects/{ref}/restore` через Supabase Management API;
- навіть якщо гість відкрив сторінку без читання таблиць, layout робить легку server-side перевірку статусу не частіше ніж раз на 60 секунд;
- повторний restore-запит обмежений інтервалом 10 секунд;
- поки база запускається, сайт показує екран очікування й перевіряє `/api/system/database-status` кожні 10 секунд;
- коли Supabase стає доступною, сторінка автоматично оновлюється.

## Структура

- `src/app` — публічна, студентська, викладацька та адміністративна зони;
- `src/components` — UI, діалоги, форми й навігація;
- `src/server` — Supabase repository/service/action шар;
- `scripts` — міграції, seed-дані та ImageKit-синхронізація;
- `supabase/migrations` — схема бази;
- `public/seed-images` — локальні seed-зображення для fallback;
- `render.yaml` — production-конфігурація Render.
