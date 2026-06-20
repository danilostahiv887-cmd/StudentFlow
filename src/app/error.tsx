'use client';

import { DatabaseWaiter } from '@/components/features/database-waiter';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DatabaseWaiter reset={reset} />;
}
