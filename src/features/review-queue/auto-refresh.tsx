'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Server components don't re-fetch on their own; this keeps the queue live
 *  so email-detected contracts appear without a manual reload. */
export function AutoRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
