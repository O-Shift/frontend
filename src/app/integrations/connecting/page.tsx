/**
 * Transient same-origin page shown in the auth tab between "Connect" and the
 * provider redirect. It exists so the parent can open the tab synchronously
 * (dodging popup blockers) before the install endpoint responds — this page
 * is then replaced by the OAuth authorize URL.
 */
export default function IntegrationConnectingPage() {
  return (
    <main className="min-h-dvh grid place-items-center bg-[var(--bg-main)] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center space-y-3">
        <div className="mx-auto size-8 rounded-full border-2 border-[var(--border-color)] border-t-[var(--text-primary)] animate-spin" />
        <h1 className="text-base font-semibold text-[var(--text-primary)]">
          Opening authorization…
        </h1>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Finish in this tab — it closes by itself when done.
        </p>
      </div>
    </main>
  );
}
