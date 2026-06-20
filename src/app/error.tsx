'use client';

import { DatabaseErrorRecovery } from '@/components/features/database-waiter';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DatabaseErrorRecovery error={error} reset={reset} />;
}
