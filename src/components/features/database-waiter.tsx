'use client';

import { useEffect, useMemo, useState } from 'react';
import { databaseRecoveryMode, type DatabaseStatus } from '@/lib/database-recovery';

export function DatabaseWaiter({ reset }: { reset?: () => void }) {
  const [status, setStatus] = useState<DatabaseStatus | undefined>();
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const response = await fetch('/api/system/database-status', { cache: 'no-store' });
        const data = (await response.json()) as DatabaseStatus;
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
    if (status?.state === 'unconfigured')
      return 'Автоматичний запуск бази не налаштований. Потрібно додати Supabase Management API токен у Render.';
    if (status?.state === 'error')
      return 'Не вдалося перевірити стан бази. Спробуйте оновити сторінку за кілька секунд.';
    if (status?.state === 'ready') return 'База доступна. Оновлюємо сторінку.';
    return 'Підключаємо дані StudentFlow. Якщо база була на паузі, запит на запуск уже надіслано.';
  }, [status]);

  return (
    <div className="database-wait-page">
      <section className="database-wait-card">
        <div className="database-loader" aria-hidden="true" />
        <p className="eyebrow">StudentFlow</p>
        <h1>База даних запускається</h1>
        <p>{copy}</p>
        <div className="database-wait-meta">
          <span>Перевірка кожні 10 секунд</span>
          <span>
            {status?.projectStatus
              ? `Статус: ${status.projectStatus}`
              : `Спроба: ${Math.max(checks, 1)}`}
          </span>
        </div>
        <div className="dialog-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={() => (reset ? reset() : window.location.reload())}
          >
            Перевірити зараз
          </button>
        </div>
      </section>
    </div>
  );
}

export function DatabaseErrorRecovery({ error, reset }: { error: Error; reset: () => void }) {
  const [status, setStatus] = useState<DatabaseStatus>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    void fetch('/api/system/database-status', { cache: 'no-store' })
      .then(async (response) => response.json() as Promise<DatabaseStatus>)
      .then((data) => {
        if (alive) setStatus(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setChecked(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const mode = databaseRecoveryMode(error, status);
  if (mode === 'database-starting') return <DatabaseWaiter reset={reset} />;

  if (!checked) {
    return (
      <div className="database-wait-page">
        <section className="database-wait-card">
          <div className="database-loader" aria-hidden="true" />
          <p className="eyebrow">StudentFlow</p>
          <h1>Перевіряємо доступність даних</h1>
          <p>Зачекайте кілька секунд.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="app-error-page">
      <section className="app-error-card">
        <p className="eyebrow">StudentFlow</p>
        <h1>Сторінку не вдалося завантажити</h1>
        <p>Оновіть сторінку або поверніться до попереднього розділу.</p>
        <div className="dialog-actions">
          <button className="button button-primary" type="button" onClick={reset}>
            Спробувати ще раз
          </button>
        </div>
      </section>
    </div>
  );
}
