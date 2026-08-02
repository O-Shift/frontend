// oshift/src/app/exports/page.tsx
'use client';

import { useState } from 'react';
import { useExports } from '@/hooks/use-exports';
import { destinationCreateSchema, slackExportSchema } from '@/types/schemas';
import {
  Share2,
  Plus,
  Send,
  Loader2,
  Calendar,
  Layers,
  FileText,
  X,
  AlertCircle,
  Hash,
  Database,
} from 'lucide-react';

export default function ExportsPage() {
  const {
    destinations,
    jobs,
    logs,
    selectedMonth,
    setSelectedMonth,
    isLoadingDestinations,
    isLoadingJobs,
    isLoadingLogs,
    isExportingSlack,
    error,
    createDestination,
    exportBriefToSlack,
  } = useExports();

  const [activeTab, setActiveTab] = useState<'destinations' | 'jobs' | 'logs'>('destinations');
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);

  // Form for destination creation
  const [destForm, setDestForm] = useState({
    destination_type: 'slack' as 'slack' | 'notion' | 'webhook',
    name: 'Primary Slack Channel',
    config_json: '{\n  "webhook_url": "https://hooks.slack.com/services/..."\n}',
  });
  const [destError, setDestError] = useState<string | null>(null);

  // Form for Slack export modal
  const [slackForm, setSlackForm] = useState({
    brief_id: '',
    destination_id: '',
  });
  const [slackError, setSlackError] = useState<string | null>(null);

  const onDestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDestError(null);

    const parseRes = destinationCreateSchema.safeParse(destForm);
    if (!parseRes.success) {
      setDestError(parseRes.error.issues[0]?.message || 'Invalid destination form');
      return;
    }

    try {
      const configObj = JSON.parse(parseRes.data.config_json);
      const res = await createDestination({
        destination_type: parseRes.data.destination_type,
        name: parseRes.data.name,
        config: configObj,
      });

      if (res) {
        setDestForm({
          destination_type: 'slack',
          name: 'Primary Slack Channel',
          config_json: '{\n  "webhook_url": "https://hooks.slack.com/services/..."\n}',
        });
        setIsDestModalOpen(false);
      }
    } catch {
      setDestError('Invalid Config JSON');
    }
  };

  const onSlackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlackError(null);

    const parseRes = slackExportSchema.safeParse(slackForm);
    if (!parseRes.success) {
      setSlackError(parseRes.error.issues[0]?.message || 'Invalid export inputs');
      return;
    }

    const res = await exportBriefToSlack(parseRes.data);
    if (res) {
      setSlackForm({ brief_id: '', destination_id: '' });
      setIsSlackModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto font-sans text-[var(--text-primary)]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-6 w-6 text-[var(--accent)]" />
            <h1 className="text-xl font-bold">Exports & Integrations</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manage external delivery destinations (Slack, Notion, Webhooks), track jobs, and view audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSlackModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" /> Export Brief to Slack
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab('destinations')}
          className={`flex items-center gap-2 border-b-2 px-3 py-1.5 transition ${
            activeTab === 'destinations'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Database className="h-4 w-4" /> Destinations ({destinations.length})
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 border-b-2 px-3 py-1.5 transition ${
            activeTab === 'jobs'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers className="h-4 w-4" /> Export Jobs ({jobs.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 border-b-2 px-3 py-1.5 transition ${
            activeTab === 'logs'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="h-4 w-4" /> Monthly Audit Logs
        </button>
      </div>

      {/* Destinations Tab */}
      {activeTab === 'destinations' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Configured Export Targets</h2>
            <button
              onClick={() => setIsDestModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Add Destination
            </button>
          </div>

          {isLoadingDestinations && destinations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading destinations...
            </div>
          ) : destinations.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              No export destinations configured yet. Click "Add Destination" to configure Slack, Notion, or Webhooks.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map((dest) => (
                <div
                  key={dest.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{dest.name}</span>
                    <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--accent)] uppercase">
                      {dest.destination_type}
                    </span>
                  </div>

                  <pre className="rounded bg-[var(--bg-card)] p-2 text-[10px] font-mono text-[var(--text-secondary)] overflow-x-auto">
                    {JSON.stringify(dest.config, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Export Jobs Log</h2>
          {isLoadingJobs && jobs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              No export jobs executed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="pb-3 font-medium">Job ID</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Attempts</th>
                    <th className="pb-3 font-medium">Started</th>
                    <th className="pb-3 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[var(--bg-main)] transition">
                      <td className="py-3 font-mono text-[var(--accent)]">{job.id.slice(0, 8)}...</td>
                      <td className="py-3 font-medium">{job.job_type}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : job.status === 'failed'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono">{job.attempts}</td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Monthly Audit Log Viewer</h2>

            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-1.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
          </div>

          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              No audit events logged for month <span className="font-mono text-[var(--accent)]">{selectedMonth}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-[var(--accent)]" />
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">{log.event}</span>
                      <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                        Job: {log.job_id}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Destination Modal */}
      {isDestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Add Export Destination</h3>
              <button onClick={() => setIsDestModalOpen(false)}>
                <X className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {destError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{destError}</span>
              </div>
            )}

            <form onSubmit={onDestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Target Name</label>
                <input
                  type="text"
                  value={destForm.name}
                  onChange={(e) => setDestForm({ ...destForm, name: e.target.value })}
                  placeholder="e.g. Executive Slack Alerts"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Destination Type</label>
                <select
                  value={destForm.destination_type}
                  onChange={(e) =>
                    setDestForm({ ...destForm, destination_type: e.target.value as 'slack' | 'notion' | 'webhook' })
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="slack">Slack Webhook</option>
                  <option value="notion">Notion Database</option>
                  <option value="webhook">Custom Webhook</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Config JSON</label>
                <textarea
                  rows={4}
                  value={destForm.config_json}
                  onChange={(e) => setDestForm({ ...destForm, config_json: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] font-mono text-[11px] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDestModalOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2 text-[var(--text-secondary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2 font-semibold text-white shadow"
                >
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export to Slack Modal */}
      {isSlackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Export Brief to Slack</h3>
              <button onClick={() => setIsSlackModalOpen(false)}>
                <X className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {slackError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{slackError}</span>
              </div>
            )}

            <form onSubmit={onSlackSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Brief ID (UUID)</label>
                <input
                  type="text"
                  value={slackForm.brief_id}
                  onChange={(e) => setSlackForm({ ...slackForm, brief_id: e.target.value })}
                  placeholder="Enter brief UUID"
                  className="w-full font-mono rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Slack Destination</label>
                <select
                  value={slackForm.destination_id}
                  onChange={(e) => setSlackForm({ ...slackForm, destination_id: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">Select destination...</option>
                  {destinations
                    .filter((d) => d.destination_type === 'slack')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSlackModalOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2 text-[var(--text-secondary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExportingSlack}
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2 font-semibold text-white shadow disabled:opacity-50"
                >
                  {isExportingSlack ? 'Enqueuing...' : 'Trigger Export'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
