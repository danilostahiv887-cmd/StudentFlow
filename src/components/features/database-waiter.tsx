'use client';

import { useEffect, useMemo, useState } from 'react';

type DatabaseStatus = {
  state: 'ready' | 'starting' | 'paused' | 'unconfigured' | 'error';
  projectStatus?: string;
  message: string;
  restoreRequested?: boolean;
};

export function DatabaseWaiter({ reset }: { reset?: () => void }) {
  const [status, setStatus] = useState<DatabaseStatus | undefined>();
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const response = await fetch('/api/system/database-status', { cache: 'no-store' });
        const data = await response.json() as DatabaseStatus;
        if (!alive) return;
        setStatus(data);
        setChecks((value) => value + 1);
        if (data.state === 'ready') {
          if (reset) reset();
          else window.location.reload();
          return;
        }
      } catch {
        if (alive) setChecks((value) => value + 1);
      }

      if (alive) timer = setTimeout(check, 10_000);
    };

    check();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [reset]);

  const copy = useMemo(() => {
    if (status?.state === 'unconfigured') return 'Автоматичний запуск бази не налаштований. Потрібно додати Supabase Management API токен у Render.';
    if (status?.state === 'error') return 'Не вдалося перевірити стан бази. Спробуйте оновити сторінку за кілька секунд.';
    if (status?.state === 'ready') return 'База доступна. Оновлюємо сторінку.';
    return 'Підключаємо дані StudentFlow. Якщо база була на паузі, запит на запуск уже надіслано.';
  }, [status]);

  return (
    <main className="database-wait-page">
      <section className="database-wait-card">
        <div className="database-loader" aria-hidden="true" />
        <p className="eyebrow">StudentFlow</p>
        <h1>База даних запускається</h1>
        <p>{copy}</p>
        <div className="database-wait-meta">
          <span>Перевірка кожні 10 секунд</span>
          <span>{status?.projectStatus ? `Статус: ${status.projectStatus}` : `Спроба: ${Math.max(checks, 1)}`}</span>
        </div>
        <div className="dialog-actions">
          <button className="button button-primary" type="button" onClick={() => reset ? reset() : window.location.reload()}>
            Перевірити зараз
          </button>
        </div>
      </section>
    </main>
  );
}
