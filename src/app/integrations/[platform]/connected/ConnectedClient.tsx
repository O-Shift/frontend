'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const PLATFORMS: Record<string, { name: string; color: string }> = {
  slack: { name: 'Slack', color: '#E01E5A' },
  discord: { name: 'Discord', color: '#5865F2' },
};

/**
 * Client half of the OAuth landing page. Reports the outcome to the opener
 * (the Settings tab) via postMessage, then closes itself — the auth tab
 * should never linger.
 */
export default function IntegrationConnectedClient({
  platform,
  ok,
  reason,
}: {
  platform: string;
  ok: boolean;
  reason?: string;
}) {
  const meta = PLATFORMS[platform] ?? { name: platform, color: '#888' };

  useEffect(() => {
    try {
      window.opener?.postMessage(
        { source: 'oshift-integrations', platform, ok, reason },
        window.location.origin
      );
    } catch {
      /* opener gone or cross-origin — nothing to hand off */
    }
    // Give the user a beat to see the result, then close. window.close()
    // only works on script-opened tabs — exactly how this tab was created.
    const t = setTimeout(() => window.close(), 1200);
    return () => clearTimeout(t);
  }, [platform, ok, reason]);

  return (
    <main className="min-h-dvh grid place-items-center bg-[var(--bg-main)] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center space-y-4">
        <div
          className="mx-auto grid size-12 place-items-center rounded-full text-2xl"
          style={{ backgroundColor: `${meta.color}22` }}
          aria-hidden
        >
          {ok ? '✅' : '⚠️'}
        </div>

        <div className="space-y-1.5">
          <h1 className="text-base font-semibold text-[var(--text-primary)]">
            {ok ? `${meta.name} connected` : `${meta.name} connection failed`}
          </h1>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {ok
              ? `Weekly competitive briefs will now be delivered to the ${meta.name} target you selected.`
              : (reason?.replace(/_/g, ' ') ?? 'Something went wrong.')}
          </p>
          {!ok && (
            <p className="text-[11px] text-[var(--text-secondary)]">
              You can close this tab and retry from Settings.
            </p>
          )}
        </div>

        {/* Fallback when the tab wasn't script-opened (e.g. direct visit). */}
        <Link
          href="/settings"
          onClick={() => {
            try {
              window.close();
            } catch {
              /* ignore */
            }
          }}
          className="inline-block px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 transition-all"
        >
          Back to Settings
        </Link>
      </div>
    </main>
  );
}
