# Supabase та ImageKit

Поточна версія працює через Supabase Postgres. Локального JSON-сховища в runtime немає.

## Дані

Схема створюється міграцією `supabase/migrations/0001_studentflow_schema.sql`. Початкове наповнення виконує `scripts/supabase-seed.ts`: за замовчуванням seed пропускає непорожню базу, а `npm run db:seed:force` очищає і створює дані заново.

Seed створює:

- академічні групи для `ПК`, `ЕК`, `ОР`, `ДЗ`, `ДВ` з потоками `11`, `12`, `21`, `22`, `31`, `32`, `41`, `42`;
- користувачів ролей admin, teacher, student з хешованими паролями;
- 7 категорій маршрутів;
- 35 можливостей для маршруту;
- заявки, докази, фідбек, бали та відзнаки.

## Медіа

ImageKit синхронізується командою `npm run imagekit:seed`. Якщо ключі не задані, додаток використовує fallback URL з `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` або локальні seed-зображення.

## Запуск

```powershell
npm run setup
npm run dev
```
