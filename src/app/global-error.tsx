'use client';

import React, { useEffect } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; ref?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[GlobalError] Root layout failure:', error);
    }
  }, [error]);

  const errorRef = error.ref || error.digest || 'ERR-GLOBAL';

  return (
    <html lang="en" data-theme="dark">
      <body className={`${inter.className} bg-[#0d0d11] text-white min-h-screen flex items-center justify-center p-6`}>
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#17171c] border border-red-500/30 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Application Error</h2>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            An unexpected error occurred in the application shell.
          </p>
          <div className="inline-block font-mono text-xs text-red-400 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800 mb-6">
            Reference: {errorRef}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg bg-[#FF5A00] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reload View
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
