import Link from 'next/link';
import IntegrationConnectedClient from './ConnectedClient';

const PLATFORMS = new Set(['slack', 'discord']);

function isPlatform(value: string): boolean {
  return PLATFORMS.has(value);
}

/**
 * Landing page for OAuth install callbacks. The backend redirects here after
 * exchanging the authorization code — it owns ok/reason; this page reports
 * the outcome to the opener tab and closes itself.
 */
export default async function IntegrationConnectedPage({
  params,
  searchParams,
}: {
  params: Promise<{ platform: string }>;
  searchParams: Promise<{ ok?: string; reason?: string }>;
}) {
  const { platform } = await params;
  const { ok, reason } = await searchParams;

  if (!isPlatform(platform)) {
    return (
      <main className="min-h-dvh grid place-items-center bg-[var(--bg-main)] p-6">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Unknown integration</h1>
          <Link href="/settings" className="text-xs text-[var(--text-secondary)] underline">
            Back to Settings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <IntegrationConnectedClient
      platform={platform}
      ok={ok === '1'}
      reason={reason}
    />
  );
}
