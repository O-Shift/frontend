'use client';

import React, { useEffect } from 'react';
import { ErrorCard } from '@/components/error/ErrorCard';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string; ref?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[RootError] Unhandled route error:', error);
    }
  }, [error]);

  const errorRef = error.ref || error.digest || 'ERR-ROUTE';

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
      <ErrorCard
        error={error}
        errorRef={errorRef}
        title="Page Rendering Error"
        message="A client-side error interrupted this view. You can retry rendering or return to the dashboard."
        variant="page"
        onRetry={reset}
        showHomeButton
      />
    </div>
  );
}
