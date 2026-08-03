// oshift/src/app/exports/page.tsx
'use client';

import { useState } from 'react';
import { useExports } from '@/hooks/use-exports';
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
  Globe,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Trash2,
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
    isTestingDest,
    error,
    createDestination,
    deleteDestination,
    testDestination,
    exportBriefToSlack,
  } = useExports();

  const [activeTab, setActiveTab] = useState<'destinations' | 'jobs' | 'logs'>('destinations');
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);

  // Clean Destination Form State (Zero raw JSON required!)
  const [destType, setDestType] = useState<'slack' | 'notion' | 'webhook'>('slack');
  const [destName, setDestName] = useState('Primary Slack Channel');

  // Fields for Slack
  const [slackChannel, setSlackChannel] = useState('#competitive-intel');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackBotToken, setSlackBotToken] = useState('');

  // Fields for Webhook
  const [webhookUrl, setWebhookUrl] = useState('https://api.mycompany.com/webhooks/oshift');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Fields for Notion
  const [notionDbId, setNotionDbId] = useState('');
  const [notionToken, setNotionToken] = useState('');

  const [destError, setDestError] = useState<string | null>(null);
  const [testResultMsg, setTestResultMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTestConnection = async () => {
    setDestError(null);
    setTestResultMsg(null);

    let configObj: Record<string, any> = {};
    if (destType === 'slack') {
      configObj = {
        channel: slackChannel.trim(),
        ...(slackWebhookUrl.trim() ? { webhook_url: slackWebhookUrl.trim() } : {}),
        ...(slackBotToken.trim() ? { bot_token: slackBotToken.trim() } : {}),
      };
    } else if (destType === 'webhook') {
      if (!webhookUrl.trim()) {
        setDestError('Webhook URL is required to test connection.');
        return;
      }
      configObj = {
        url: webhookUrl.trim(),
        ...(webhookSecret.trim() ? { secret: webhookSecret.trim() } : {}),
      };
    } else if (destType === 'notion') {
      configObj = { database_id: notionDbId.trim(), token: notionToken.trim() };
    }

    const res = await testDestination(destType, configObj);
    if (res) {
      setTestResultMsg({ ok: res.ok, msg: res.message });
    }
  };

  // Form for Slack export modal
  const [slackForm, setSlackForm] = useState({
    brief_id: '',
    destination_id: '',
  });
  const [slackError, setSlackError] = useState<string | null>(null);

  const onDestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDestError(null);

    if (!destName.trim()) {
      setDestError('Destination name is required.');
      return;
    }

    let configObj: Record<string, any> = {};

    if (destType === 'slack') {
      if (!slackChannel.trim()) {
        setDestError('Slack channel name is required (e.g. #intel-alerts).');
        return;
      }
      if (!slackWebhookUrl.trim() && !slackBotToken.trim()) {
        setDestError('Please provide a Slack Webhook URL or Bot Token.');
        return;
      }
      configObj = {
        channel: slackChannel.trim(),
        ...(slackWebhookUrl.trim() ? { webhook_url: slackWebhookUrl.trim() } : {}),
        ...(slackBotToken.trim() ? { bot_token: slackBotToken.trim() } : {}),
      };
    } else if (destType === 'webhook') {
      if (!webhookUrl.trim()) {
        setDestError('Webhook URL is required.');
        return;
      }
      configObj = {
        url: webhookUrl.trim(),
        ...(webhookSecret.trim() ? { secret: webhookSecret.trim() } : {}),
      };
    } else if (destType === 'notion') {
      if (!notionDbId.trim() || !notionToken.trim()) {
        setDestError('Both Notion Database ID and Integration Token are required.');
        return;
      }
      configObj = {
        database_id: notionDbId.trim(),
        token: notionToken.trim(),
      };
    }

    const res = await createDestination({
      destination_type: destType,
      name: destName.trim(),
      config: configObj,
    });

    if (res) {
      setIsDestModalOpen(false);
      setDestName('Primary Slack Channel');
      setSlackWebhookUrl('');
      setSlackBotToken('');
      setWebhookSecret('');
    }
  };

  const onSlackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlackError(null);

    if (!slackForm.brief_id.trim() || !slackForm.destination_id.trim()) {
      setSlackError('Please provide both Brief ID and select a Destination.');
      return;
    }

    const res = await exportBriefToSlack({
      brief_id: slackForm.brief_id.trim(),
      destination_id: slackForm.destination_id.trim(),
    });

    if (res) {
      setSlackForm({ brief_id: '', destination_id: '' });
      setIsSlackModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 text-[var(--text-primary)] font-sans max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Export Destinations & Delivery Jobs</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manage target distribution channels (Slack, Notion, Custom Webhooks) and monitor automated delivery logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSlackModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-semibold hover:border-[var(--accent)] transition"
          >
            <Send className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Export Brief to Slack</span>
          </button>
          <button
            onClick={() => setIsDestModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Destination</span>
          </button>
        </div>
      </div>

      {/* Linking Pipeline Explanation Card */}
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4 text-xs text-[var(--text-primary)] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[var(--accent)]">
          <Zap className="h-4 w-4" />
          <span>How Exports Link to Automated Pipeline Tasks</span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          When an automated task executes (such as the <strong>Full Master Pipeline</strong> or <strong>Briefs & Distribution Pipeline</strong>), step 12 automatically scans your active destinations below and delivers newly generated briefs and alert digests to Slack, Notion, or Webhooks without manual intervention.
        </p>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('destinations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'destinations'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Share2 className="h-4 w-4" />
          <span>Destinations ({destinations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'jobs'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Delivery Jobs ({jobs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Monthly Audit Logs ({logs.length})</span>
        </button>
      </div>

      {/* Tab Content: Destinations */}
      {activeTab === 'destinations' && (
        <div className="space-y-4">
          {isLoadingDestinations && destinations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Fetching export destinations...
            </div>
          ) : destinations.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-12 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">
                <Share2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm">No Export Destinations Configured</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Add a Slack channel, Notion database, or Custom Webhook URL to receive automated competitive briefs.
              </p>
              <button
                onClick={() => setIsDestModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Destination</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map((dest) => {
                const isSlack = dest.destination_type === 'slack';
                const isNotion = dest.destination_type === 'notion';
                const channelName = (dest.config as any)?.channel || '#general';
                const urlStr = (dest.config as any)?.url || (dest.config as any)?.webhook_url || '';

                return (
                  <div
                    key={dest.id}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 space-y-3 shadow-sm hover:border-[var(--accent)]/40 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSlack ? (
                            <Hash className="h-4 w-4 text-emerald-400" />
                          ) : isNotion ? (
                            <Database className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Globe className="h-4 w-4 text-purple-400" />
                          )}
                          <h3 className="font-bold text-xs text-[var(--text-primary)]">{dest.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase">
                            {dest.destination_type}
                          </span>
                          <button
                            onClick={() => deleteDestination(dest.id)}
                            className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition"
                            title="Delete Export Destination"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Simplified User View */}
                      <div className="rounded-lg bg-[var(--bg-main)] p-2.5 text-xs space-y-1 border border-[var(--border-color)] font-mono">
                        {isSlack && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--text-secondary)]">Target Channel:</span>
                            <span className="text-[var(--accent)] font-bold">{channelName}</span>
                          </div>
                        )}
                        {urlStr && (
                          <div className="flex items-center justify-between text-[11px] truncate">
                            <span className="text-[var(--text-secondary)]">Endpoint:</span>
                            <span className="text-[var(--text-primary)] truncate max-w-[150px]">{urlStr}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--text-secondary)]">Secrets Status:</span>
                          <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                            <ShieldCheck className="h-3 w-3 inline" /> Encrypted
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                      <span>ID: {dest.id.slice(0, 8)}...</span>
                      <span className="text-[var(--accent)]">Ready for Auto-Pipelines</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Jobs */}
      {activeTab === 'jobs' && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h2 className="font-semibold text-sm">Delivery Job Execution Queue</h2>
            <span className="text-xs text-[var(--text-secondary)]">Recent 100 jobs</span>
          </div>

          {isLoadingJobs && jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              No delivery jobs logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold">
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Attempts</th>
                    <th className="py-2.5 px-3">Started</th>
                    <th className="py-2.5 px-3">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--accent)]">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-3 font-medium">{job.job_type}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : job.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {job.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{job.attempts}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {job.started_at ? new Date(job.started_at).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Monthly Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h2 className="font-semibold text-sm">Monthly Audit Event Logs</h2>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-1 text-xs text-[var(--text-primary)] font-mono outline-none"
              />
            </div>
          </div>

          {isLoadingLogs && logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
              Loading audit log entries for {selectedMonth}...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              No audit logs recorded for {selectedMonth}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold">
                    <th className="py-2.5 px-3">Event ID</th>
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Event Name</th>
                    <th className="py-2.5 px-3">Error</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--text-secondary)]">
                        {log.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--accent)]">
                        {log.job_id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-3 font-semibold">{log.event}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {log.error ? (
                          <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-mono text-[10px]">
                            {log.error}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Simplified User-Friendly Modal for Destination Creation (NO RAW JSON) */}
      {isDestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="font-bold text-base">Add Export Destination</h2>
              </div>
              <button
                onClick={() => setIsDestModalOpen(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {destError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{destError}</span>
              </div>
            )}

            <form onSubmit={onDestSubmit} className="space-y-4">
              {/* Destination Type Pills */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
                  Select Channel Type:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'slack', label: 'Slack', icon: Hash },
                    { id: 'webhook', label: 'Webhook', icon: ExternalLink },
                    { id: 'notion', label: 'Notion', icon: Database },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSel = destType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setDestType(type.id as any);
                          if (type.id === 'slack') setDestName('Primary Slack Channel');
                          if (type.id === 'webhook') setDestName('Custom Alert Webhook');
                          if (type.id === 'notion') setDestName('Notion Intel Database');
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                          isSel
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm'
                            : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Destination Name */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                  Display Label:
                </label>
                <input
                  type="text"
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  placeholder="e.g. Executive Slack Channel"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Form Fields for SLACK */}
              {destType === 'slack' && (
                <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3.5">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                      Slack Channel Name:
                    </label>
                    <input
                      type="text"
                      value={slackChannel}
                      onChange={(e) => setSlackChannel(e.target.value)}
                      placeholder="#competitive-intel"
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                      Slack Incoming Webhook URL:
                    </label>
                    <input
                      type="url"
                      value={slackWebhookUrl}
                      onChange={(e) => setSlackWebhookUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                      Bot Token (Optional fallback):
                    </label>
                    <input
                      type="password"
                      value={slackBotToken}
                      onChange={(e) => setSlackBotToken(e.target.value)}
                      placeholder="xoxb-your-bot-token"
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields for WEBHOOK */}
              {destType === 'webhook' && (
                <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3.5">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                      Target Webhook URL:
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.mycompany.com/webhooks/oshift"
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                      Secret Signature Key (Optional):
                    </label>
                    <input
                      type="password"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder="whsec_..."
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields for NOTION */}
              {destType === 'notion' && (
                <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3.5">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                      Notion Database ID:
                    </label>
                    <input
                      type="text"
                      value={notionDbId}
                      onChange={(e) => setNotionDbId(e.target.value)}
                      placeholder="e.g. 3a8f9c2d1..."
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                      Notion Integration Token:
                    </label>
                    <input
                      type="password"
                      value={notionToken}
                      onChange={(e) => setNotionToken(e.target.value)}
                      placeholder="secret_..."
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {testResultMsg && (
                <div className={`rounded-xl border p-3 text-xs flex items-center gap-2 ${
                  testResultMsg.ok
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  {testResultMsg.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{testResultMsg.msg}</span>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingDest}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition disabled:opacity-50"
                >
                  {isTestingDest ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDestModalOpen(false)}
                    className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-semibold hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-md"
                  >
                    Save Destination
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Export Brief to Slack */}
      {isSlackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="font-bold text-base">Export Brief to Slack</h2>
              </div>
              <button
                onClick={() => setIsSlackModalOpen(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {slackError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{slackError}</span>
              </div>
            )}

            <form onSubmit={onSlackSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                  Target Brief UUID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={slackForm.brief_id}
                  onChange={(e) => setSlackForm({ ...slackForm, brief_id: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                  Select Export Destination:
                </label>
                <select
                  value={slackForm.destination_id}
                  onChange={(e) => setSlackForm({ ...slackForm, destination_id: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">-- Choose Destination --</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.destination_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsSlackModalOpen(false)}
                  className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-semibold hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExportingSlack}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-40 shadow-md"
                >
                  {isExportingSlack ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <span>Deliver to Slack</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
