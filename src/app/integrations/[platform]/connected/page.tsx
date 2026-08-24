import Link from 'next/link';

const PLATFORMS = {
  slack: { name: 'Slack', color: '#E01E5A' },
  discord: { name: 'Discord', color: '#5865F2' },
} as const;

type PlatformId = keyof typeof PLATFORMS;

function isPlatform(value: string): value is PlatformId {
  return value in PLATFORMS;
}

/**
 * Landing page for OAuth install callbacks. The backend redirects here after
 * exchanging the authorization code — it owns ok/reason; this page only
 * reports the outcome and routes back to Settings.
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
  const meta = isPlatform(platform) ? PLATFORMS[platform] : null;

  if (!meta) {
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

  const success = ok === '1';
  const friendlyReason =
    reason === 'oauth_denied:access_denied'
      ? 'Authorization was cancelled.'
      : (reason?.replace(/_/g, ' ') ?? 'Something went wrong.');

  return (
    <main className="min-h-dvh grid place-items-center bg-[var(--bg-main)] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center space-y-4">
        <div
          className="mx-auto grid size-12 place-items-center rounded-full text-2xl"
          style={{ backgroundColor: `${meta.color}22` }}
          aria-hidden
        >
          {success ? '✅' : '⚠️'}
        </div>

        <div className="space-y-1.5">
          <h1 className="text-base font-semibold text-[var(--text-primary)]">
            {success ? `${meta.name} connected` : `${meta.name} connection failed`}
          </h1>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {success
              ? `Weekly competitive briefs will now be delivered to the ${meta.name} target you selected.`
              : friendlyReason}
          </p>
        </div>

        <Link
          href="/settings"
          className="inline-block px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 transition-all"
        >
          Back to Settings
        </Link>
      </div>
    </main>
  );
}
