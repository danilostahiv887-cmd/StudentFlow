'use client';

import { DatabaseWaiter } from '@/components/features/database-waiter';

function isDatabaseStarting(error: Error) {
  return error.name === 'DatabaseStartingError' || error.message.includes('STUDENTFLOW_DATABASE_STARTING');
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  if (!isDatabaseStarting(error)) {
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

  return <DatabaseWaiter reset={reset} />;
}
