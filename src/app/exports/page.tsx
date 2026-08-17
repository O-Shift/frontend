// oshift/src/app/exports/page.tsx
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useExports } from '@/hooks/use-exports';
import { useMounted } from '@/hooks/use-mounted';
import {
  Share2,
  Plus,
  Send,
  Loader2,
  Database,
  Globe,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
  X,
  Activity,
  Server,
  Search,
} from 'lucide-react';
import { FaSlack } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExportsPage() {
  const {
    destinations,
    jobs,
    isLoadingDestinations,
    isLoadingJobs,
    isExportingSlack,
    isTestingDest,
    error,
    createDestination,
    deleteDestination,
    testDestination,
    exportBriefToSlack,
  } = useExports();

  const [platformFilter, setPlatformFilter] = useState<'all' | 'slack' | 'webhook' | 'notion'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const mounted = useMounted();

  // Destination Creator Form State
  const [destType, setDestType] = useState<'slack' | 'notion' | 'webhook'>('slack');
  const [destName, setDestName] = useState('Primary Slack Channel');

  const [slackChannel, setSlackChannel] = useState('#competitive-intel');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackBotToken, setSlackBotToken] = useState('');

  const [webhookUrl, setWebhookUrl] = useState('https://api.mycompany.com/webhooks/oshift');
  const [webhookSecret, setWebhookSecret] = useState('');

  const [notionDbId, setNotionDbId] = useState('');
  const [notionToken, setNotionToken] = useState('');

  const [destError, setDestError] = useState<string | null>(null);
  const [testResultMsg, setTestResultMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  // Quick Dispatch Panel Form
  const [quickBriefId, setQuickBriefId] = useState('');
  const [quickDestId, setQuickDestId] = useState('');
  const [quickExportSuccess, setQuickExportSuccess] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setDestError(null);
    setTestResultMsg(null);

    let configObj: Record<string, unknown> = {};
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

  const onDestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDestError(null);

    if (!destName.trim()) {
      setDestError('Destination name is required.');
      return;
    }

    let configObj: Record<string, unknown> = {};

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

  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickExportSuccess(null);
    if (!quickBriefId.trim() || !quickDestId.trim()) return;

    const res = await exportBriefToSlack({
      brief_id: quickBriefId.trim(),
      destination_id: quickDestId.trim(),
    });

    if (res) {
      setQuickExportSuccess(`Export job queued! Job ID: ${res.job_id.slice(0, 8)}`);
      setQuickBriefId('');
      setIsSlackModalOpen(false);
      setTimeout(() => setQuickExportSuccess(null), 5000);
    }
  };

  // Filtered Destinations
  const filteredDestinations = destinations.filter((dest) => {
    const matchesPlatform = platformFilter === 'all' || dest.destination_type === platformFilter;
    const matchesQuery = !searchQuery.trim() || dest.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesQuery;
  });

  return (
    <div className="flex-1 w-full overflow-y-auto p-6 md:p-10 pb-24 bg-[var(--bg-main-alt)] text-[var(--text-primary)] font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ── HEADER BAR ── */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Share2 className="h-6 w-6 text-[var(--text-primary)]" />
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Integrations & Export Hub</h1>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Connect Slack, Webhooks, and Notion to dispatch executive intelligence briefs, alerts, and market signals.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSlackModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] px-4 py-2.5 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              <Send className="h-4 w-4" />
              <span>Dispatch Brief</span>
            </button>

            <button
              onClick={() => setIsDestModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Connect Integration</span>
            </button>
          </div>
        </div>

        {/* ── ALERT BANNERS ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
            <span>{error}</span>
          </div>
        )}

        {quickExportSuccess && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />
            <span>{quickExportSuccess}</span>
          </div>
        )}

        {/* ── FILTER & SEARCH TOOLBAR (FIRST!) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Destinations' },
                { id: 'slack', label: 'Slack Channels' },
                { id: 'webhook', label: 'Webhooks' },
                { id: 'notion', label: 'Notion DBs' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setPlatformFilter(filter.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  platformFilter === filter.id
                    ? 'bg-[var(--text-primary)] text-[var(--card-bg)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-alt)]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
            />
          </div>
        </div>

        {/* ── COMPACT STATS STRIP ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-secondary)]">Connected:</span>
              <strong className="font-bold text-[var(--text-primary)]">{destinations.length} destinations</strong>
            </div>

            <div className="h-3 w-px bg-[var(--border-color)] hidden sm:block" />

            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-secondary)]">24h Jobs:</span>
              <strong className="font-bold text-[var(--text-primary)]">{jobs.length}</strong>
              <span className="text-[11px] text-[var(--text-secondary)]">({jobs.filter((j) => j.status === 'completed').length} completed)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">Status:</span>
            <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--text-primary)] bg-[var(--card-bg-alt)] text-[11px]">
              <ShieldCheck className="h-3 w-3" />
              {isExportingSlack || isTestingDest ? 'Exporting' : 'Active / Ready'}
            </span>
          </div>
        </div>

        {/* ── INTEGRATION CARDS GRID ── */}
        <div>
          {isLoadingDestinations ? (
            <div className="flex items-center justify-center py-16 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Fetching connected destinations...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Connect New Integration Card */}
              <button
                onClick={() => setIsDestModalOpen(true)}
                className="group border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-bg-alt)] hover:border-[var(--text-primary)] transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border border-[var(--border-color)] bg-[var(--bg-main-alt)] group-hover:scale-105 transition-transform flex items-center justify-center">
                  <Plus className="h-6 w-6 text-[var(--text-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">Connect New Destination</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[200px]">Add Slack, Webhook endpoint, or Notion workspace.</p>
                </div>
              </button>

              {filteredDestinations.map((dest) => {
                const isSlack = dest.destination_type === 'slack';
                const isWebhook = dest.destination_type === 'webhook';
                const destConf = (dest.config ?? {}) as Record<string, unknown>;
                const channel = typeof destConf.channel === 'string' ? destConf.channel : undefined;
                const endpoint = typeof destConf.url === 'string' ? destConf.url : undefined;
                const notionDb = typeof destConf.database_id === 'string' ? destConf.database_id : undefined;

                return (
                  <div
                    key={dest.id}
                    className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-[var(--text-secondary)] transition-all shadow-xs"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0">
                            {isSlack ? (
                              <FaSlack className="h-5 w-5 text-[var(--text-primary)]" />
                            ) : isWebhook ? (
                              <Globe className="h-5 w-5 text-[var(--text-primary)]" />
                            ) : (
                              <Database className="h-5 w-5 text-[var(--text-primary)]" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-[var(--text-primary)]">{dest.name}</h3>
                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                              {dest.destination_type}
                            </span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      </div>

                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] p-3 text-xs space-y-1">
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium">Configured Target:</p>
                        {isSlack && <p className="font-semibold text-[var(--text-primary)]">{channel || '#general'}</p>}
                        {isWebhook && <p className="font-mono text-[11px] text-[var(--text-primary)] truncate">{endpoint || 'https://api.mycompany.com'}</p>}
                        {!isSlack && !isWebhook && <p className="font-mono text-[11px] text-[var(--text-primary)] truncate">{notionDb || 'Notion Database'}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs">
                      <button
                        onClick={() => testDestination(dest.destination_type, dest.config)}
                        disabled={isTestingDest}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition-colors cursor-pointer"
                      >
                        {isTestingDest ? 'Testing...' : 'Test Connection'}
                      </button>

                      <button
                        onClick={() => deleteDestination(dest.id)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove Destination"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── DELIVERY HISTORY STREAM TABLE ── */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Dispatch & Delivery History</h2>
              <p className="text-xs text-[var(--text-secondary)]">Recent payload executions across connected Slack channels and webhooks.</p>
            </div>
          </div>

          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Loading delivery logs...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-xs text-[var(--text-secondary)]">
              No export dispatches logged yet. Use &quot;Dispatch Brief&quot; to send executive summaries.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase text-[10px]">
                    <th className="pb-3">Job ID</th>
                    <th className="pb-3">Job Type</th>
                    <th className="pb-3">Destination</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Attempts</th>
                    <th className="pb-3">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[var(--card-bg-alt)] transition-colors">
                      <td className="py-3 font-mono text-[11px] text-[var(--text-secondary)]">#{job.id.slice(0, 8)}</td>
                      <td className="py-3 font-semibold text-[var(--text-primary)]">{job.job_type || 'Executive Brief'}</td>
                      <td className="py-3 text-[var(--text-secondary)] font-mono">
                        {destinations.find((d) => d.id === job.destination_id)?.name || job.destination_id.slice(0, 8)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          job.status === 'completed'
                            ? 'border-emerald-500/30 text-emerald-400'
                            : job.status === 'failed'
                            ? 'border-red-500/30 text-red-400'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">{job.attempts || 1}</td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── CREATE DESTINATION MODAL (PORTALED TO BODY) ── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isDestModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Connect Destination</h3>
                    <button
                      onClick={() => setIsDestModalOpen(false)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={onDestSubmit} className="space-y-4 text-xs">
                    {/* Platform Selector Tabs */}
                    <div>
                      <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Platform Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['slack', 'webhook', 'notion'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setDestType(t)}
                            className={`py-2 rounded-lg border text-center capitalize transition-all cursor-pointer ${
                              destType === t
                                ? 'border-[var(--text-primary)] bg-[var(--card-bg-alt)] text-[var(--text-primary)] font-semibold'
                                : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Destination Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Primary Slack Channel"
                        value={destName}
                        onChange={(e) => setDestName(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                      />
                    </div>

                    {destType === 'slack' && (
                      <>
                        <div>
                          <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Slack Channel</label>
                          <input
                            type="text"
                            placeholder="#competitive-intel"
                            value={slackChannel}
                            onChange={(e) => setSlackChannel(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Slack Webhook URL</label>
                          <input
                            type="text"
                            placeholder="https://hooks.slack.com/services/..."
                            value={slackWebhookUrl}
                            onChange={(e) => setSlackWebhookUrl(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
                          />
                        </div>
                      </>
                    )}

                    {destType === 'webhook' && (
                      <div>
                        <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Webhook Target Endpoint URL</label>
                        <input
                          type="url"
                          placeholder="https://api.company.com/webhooks"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    )}

                    {destType === 'notion' && (
                      <>
                        <div>
                          <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Notion Database ID</label>
                          <input
                            type="text"
                            placeholder="Database UUID"
                            value={notionDbId}
                            onChange={(e) => setNotionDbId(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Notion API Integration Token</label>
                          <input
                            type="password"
                            placeholder="secret_..."
                            value={notionToken}
                            onChange={(e) => setNotionToken(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
                          />
                        </div>
                      </>
                    )}

                    {destError && (
                      <p className="text-xs text-red-400">{destError}</p>
                    )}

                    {testResultMsg && (
                      <p className={`text-xs ${testResultMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {testResultMsg.msg}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingDest}
                        className="px-3.5 py-2 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        {isTestingDest ? 'Testing...' : 'Test Connection'}
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsDestModalOpen(false)}
                          className="px-4 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
                        >
                          Save Destination
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ── EXPORT BRIEF MODAL (PORTALED TO BODY) ── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isSlackModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Dispatch Brief</h3>
                    <button
                      onClick={() => setIsSlackModalOpen(false)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleQuickDispatch} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Executive Brief ID</label>
                      <input
                        type="text"
                        placeholder="Enter brief ID"
                        value={quickBriefId}
                        onChange={(e) => setQuickBriefId(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Select Destination</label>
                      <select
                        value={quickDestId}
                        onChange={(e) => setQuickDestId(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                      >
                        <option value="">Select a connected destination...</option>
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.destination_type})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                      <button
                        type="button"
                        onClick={() => setIsSlackModalOpen(false)}
                        className="px-4 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isExportingSlack || !quickBriefId.trim() || !quickDestId.trim()}
                        className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        Dispatch Now
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

    </div>
  );
}
