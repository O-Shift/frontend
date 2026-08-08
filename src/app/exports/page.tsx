// oshift/src/app/exports/page.tsx
'use client';

import { useState } from 'react';
import { useExports } from '@/hooks/use-exports';
import {
  Share2, Plus, Send, Loader2, Calendar, Database, Globe, Hash, CheckCircle2, AlertCircle, Zap, ExternalLink, ShieldCheck, Trash2, X, Activity, Server, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExportsPage() {
  const {
    destinations, jobs, logs, selectedMonth, setSelectedMonth,
    isLoadingDestinations, isLoadingJobs, isLoadingLogs, isExportingSlack, isTestingDest,
    error, createDestination, deleteDestination, testDestination, exportBriefToSlack,
  } = useExports();

  const [activeTab, setActiveTab] = useState<'destinations' | 'jobs' | 'logs'>('destinations');
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);

  // Form State
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

  const [slackForm, setSlackForm] = useState({ brief_id: '', destination_id: '' });
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

  const tabClass = (tab: string) => `pb-3 text-sm font-semibold transition-colors relative ${activeTab === tab ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`;

  return (
    <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-6 md:p-10 pb-24 flex flex-col items-center justify-start relative bg-[var(--bg-main-alt)]">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* Header */}
        <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2"
        >
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Exports & Integrations</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage destinations, pipelines, and delivery logs.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSlackModalOpen(true)}
              className="flex items-center gap-2 bg-[var(--card-bg-alt)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] text-xs font-semibold py-1.5 px-3 rounded transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
              Manual Export
            </button>
            <button
              onClick={() => setIsDestModalOpen(true)}
              className="flex items-center gap-2 bg-[var(--text-primary)] text-[var(--card-bg)] hover:bg-[var(--text-secondary)] text-xs font-semibold py-1.5 px-3 rounded transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Destination
            </button>
          </div>
        </motion.div>

        {/* Pipeline Info */}
        <motion.div 
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
            className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 rounded-lg shadow-sm flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-[var(--text-primary)]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-[var(--text-primary)]">Automated Pipeline Integration</span>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Active destinations automatically receive payloads from the master distribution pipeline. No manual intervention required once configured.
            </p>
          </div>
        </motion.div>

        {error && (
          <div className="border border-red-500/20 bg-red-500/10 p-4 rounded-xl text-sm flex items-center gap-3 text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="flex gap-8 border-b border-[var(--border-color)] mt-2">
          <button onClick={() => setActiveTab('destinations')} className={tabClass('destinations')}>
            Destinations <span className="ml-1.5 text-xs bg-[var(--card-bg-alt)] border border-[var(--border-color)] px-1.5 py-0.5 rounded-md">{destinations.length}</span>
            {activeTab === 'destinations' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--text-primary)] rounded-t-full" />}
          </button>
          <button onClick={() => setActiveTab('jobs')} className={tabClass('jobs')}>
            Jobs <span className="ml-1.5 text-xs bg-[var(--card-bg-alt)] border border-[var(--border-color)] px-1.5 py-0.5 rounded-md">{jobs.length}</span>
            {activeTab === 'jobs' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--text-primary)] rounded-t-full" />}
          </button>
          <button onClick={() => setActiveTab('logs')} className={tabClass('logs')}>
            Logs <span className="ml-1.5 text-xs bg-[var(--card-bg-alt)] border border-[var(--border-color)] px-1.5 py-0.5 rounded-md">{logs.length}</span>
            {activeTab === 'logs' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--text-primary)] rounded-t-full" />}
          </button>
        </motion.div>

        {/* Content: Destinations */}
        {activeTab === 'destinations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
            {isLoadingDestinations && destinations.length === 0 ? (
              <div className="py-16 text-center text-sm font-medium text-[var(--text-secondary)] flex justify-center items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Fetching destinations...
              </div>
            ) : destinations.length === 0 ? (
              <div className="border border-dashed border-[var(--border-color)] rounded-xl py-20 text-center flex flex-col items-center justify-center space-y-4 bg-[var(--card-bg)]">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-main-alt)] flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-[var(--text-secondary)]" />
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">No destinations found</p>
                    <p className="text-xs text-[var(--text-secondary)]">Create a destination to start exporting data.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {destinations.map((dest) => {
                  const isSlack = dest.destination_type === 'slack';
                  const isNotion = dest.destination_type === 'notion';
                  const channelName = (dest.config as any)?.channel || '#general';
                  const urlStr = (dest.config as any)?.url || (dest.config as any)?.webhook_url || '';

                  return (
                    <div
                      key={dest.id}
                      className="group border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--item-hover)] hover:border-[var(--text-secondary)] transition-all rounded-xl p-6 flex flex-col justify-between shadow-sm min-h-[180px]"
                    >
                      <div className="space-y-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-[var(--border-color)] bg-[var(--bg-main-alt)] flex items-center justify-center">
                                {isSlack ? <Hash className="h-4 w-4 text-[var(--text-secondary)]" /> : isNotion ? <Database className="h-4 w-4 text-[var(--text-secondary)]" /> : <Globe className="h-4 w-4 text-[var(--text-secondary)]" />}
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="font-semibold text-sm text-[var(--text-primary)]">{dest.name}</h3>
                                <p className="text-xs font-medium text-[var(--text-secondary)] capitalize">{dest.destination_type}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteDestination(dest.id)}
                            className="text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          {isSlack && (
                            <div className="flex justify-between items-center">
                              <span className="text-[var(--text-secondary)] font-medium">Channel</span>
                              <span className="text-[var(--text-primary)] font-medium">{channelName}</span>
                            </div>
                          )}
                          {urlStr && (
                            <div className="flex justify-between items-center">
                              <span className="text-[var(--text-secondary)] font-medium">Endpoint</span>
                              <span className="text-[var(--text-primary)] font-medium truncate max-w-[140px]" title={urlStr}>{urlStr}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)] font-medium">Security</span>
                            <span className="text-emerald-500 flex items-center gap-1 font-medium"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex justify-between items-center text-xs font-medium">
                        <span className="text-[var(--text-secondary)]">ID: {dest.id.slice(0, 8)}</span>
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Ready</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Content: Jobs */}
        {activeTab === 'jobs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl overflow-hidden shadow-sm mt-2">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main-alt)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Server className="w-4 h-4 text-[var(--text-secondary)]"/> Active Queue</h2>
            </div>
            {isLoadingJobs && jobs.length === 0 ? (
               <div className="py-16 text-center text-sm font-medium text-[var(--text-secondary)]">Loading jobs...</div>
            ) : jobs.length === 0 ? (
               <div className="py-16 text-center text-sm font-medium text-[var(--text-secondary)]">No active jobs</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[var(--text-secondary)] bg-[var(--card-bg)] font-medium text-xs border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-3.5 px-5">ID</th>
                      <th className="py-3.5 px-5">Type</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Attempts</th>
                      <th className="py-3.5 px-5">Started</th>
                      <th className="py-3.5 px-5">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] bg-[var(--card-bg)]">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[var(--item-hover)] transition-colors">
                        <td className="py-3 px-5 text-[var(--text-secondary)] font-mono text-xs">{job.id.slice(0, 8)}</td>
                        <td className="py-3 px-5 font-medium">{job.job_type}</td>
                        <td className="py-3 px-5">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                            job.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                            job.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-[var(--text-secondary)]">{job.attempts}</td>
                        <td className="py-3 px-5 text-[var(--text-secondary)]">{job.started_at ? new Date(job.started_at).toLocaleTimeString() : '-'}</td>
                        <td className="py-3 px-5 text-[var(--text-secondary)]">{job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Content: Logs */}
        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl overflow-hidden shadow-sm mt-2">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main-alt)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Activity className="w-4 h-4 text-[var(--text-secondary)]"/> System Audit</h2>
              <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--border-color)] px-3 py-1.5 rounded-md">
                <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>
            {isLoadingLogs && logs.length === 0 ? (
               <div className="py-16 text-center text-sm font-medium text-[var(--text-secondary)]">Loading logs...</div>
            ) : logs.length === 0 ? (
               <div className="py-16 text-center text-sm font-medium text-[var(--text-secondary)]">No logs for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[var(--text-secondary)] bg-[var(--card-bg)] font-medium text-xs border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-3.5 px-5">Event ID</th>
                      <th className="py-3.5 px-5">Job ID</th>
                      <th className="py-3.5 px-5">Event</th>
                      <th className="py-3.5 px-5">Error</th>
                      <th className="py-3.5 px-5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] bg-[var(--card-bg)]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--item-hover)] transition-colors">
                        <td className="py-3 px-5 text-[var(--text-secondary)] font-mono text-xs">{log.id.slice(0, 8)}</td>
                        <td className="py-3 px-5 text-[var(--text-secondary)] font-mono text-xs">{log.job_id.slice(0, 8)}</td>
                        <td className="py-3 px-5 font-medium">{log.event}</td>
                        <td className="py-3 px-5">{log.error ? <span className="text-red-500 font-medium">{log.error}</span> : <span className="text-[var(--text-secondary)]">-</span>}</td>
                        <td className="py-3 px-5 text-[var(--text-secondary)]">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {isDestModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
                  <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[var(--text-primary)]" /> Add Destination
                  </h2>
                  <button onClick={() => setIsDestModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] p-1.5 rounded transition-colors"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                  {destError && (
                    <div className="mb-6 border border-red-500/20 bg-red-500/10 p-4 rounded-lg text-sm font-medium text-red-500 flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {destError}
                    </div>
                  )}

                  <form onSubmit={onDestSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Integration Type</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'slack', label: 'Slack', icon: Hash },
                          { id: 'webhook', label: 'Webhook', icon: ExternalLink },
                          { id: 'notion', label: 'Notion', icon: Database },
                        ].map((type) => {
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
                              className={`flex flex-col items-center justify-center gap-2 p-4 rounded border text-sm font-semibold transition-colors ${
                                isSel ? 'border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--card-bg)] shadow-sm' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:bg-[var(--card-bg)]'
                              }`}
                            >
                              <type.icon className="h-5 w-5" />
                              {type.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Destination Name</label>
                      <input
                        type="text"
                        value={destName}
                        onChange={(e) => setDestName(e.target.value)}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition-colors shadow-sm"
                      />
                    </div>

                    {destType === 'slack' && (
                      <div className="space-y-4 border border-[var(--border-color)] p-5 rounded bg-[var(--card-bg)] shadow-sm">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Channel Name</label>
                          <input type="text" value={slackChannel} onChange={(e) => setSlackChannel(e.target.value)} className="w-full bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Webhook URL (Optional)</label>
                          <input type="url" value={slackWebhookUrl} onChange={(e) => setSlackWebhookUrl(e.target.value)} className="w-full bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Bot Token (Optional)</label>
                          <input type="password" value={slackBotToken} onChange={(e) => setSlackBotToken(e.target.value)} className="w-full bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" />
                        </div>
                      </div>
                    )}

                    {destType === 'webhook' && (
                      <div className="space-y-4 border border-[var(--border-color)] p-5 rounded bg-[var(--card-bg)] shadow-sm">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Endpoint URL</label>
                          <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Secret Key (Optional)</label>
                          <input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} className="w-full bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" />
                        </div>
                      </div>
                    )}

                    {destType === 'notion' && (
                      <div className="space-y-4 border border-[var(--border-color)] p-5 rounded bg-[var(--card-bg)] shadow-sm">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Database ID</label>
                          <input type="text" value={notionDbId} onChange={(e) => setNotionDbId(e.target.value)} className="w-full bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Integration Token</label>
                          <input type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} className="w-full bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" />
                        </div>
                      </div>
                    )}

                    {testResultMsg && (
                      <div className={`p-4 rounded text-sm font-medium border flex items-center gap-3 ${testResultMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        {testResultMsg.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        {testResultMsg.msg}
                      </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4 border-t border-[var(--border-color)] mt-6">
                      <button type="button" onClick={handleTestConnection} disabled={isTestingDest} className="w-full sm:w-auto text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-2 py-2 px-4 rounded border border-transparent hover:border-[var(--border-color)] transition-colors">
                        {isTestingDest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        {isTestingDest ? 'Testing...' : 'Test Connection'}
                      </button>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button type="button" onClick={() => setIsDestModalOpen(false)} className="flex-1 sm:flex-none px-4 py-2.5 rounded text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--item-hover)] transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 sm:flex-none bg-[var(--text-primary)] text-[var(--card-bg)] px-6 py-2.5 rounded text-sm font-semibold hover:bg-[var(--text-secondary)] transition-colors shadow-sm">
                          Save Destination
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isSlackModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[var(--bg-main-alt)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
                  <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Send className="h-5 w-5 text-[var(--text-primary)]" /> Manual Export
                  </h2>
                  <button onClick={() => setIsSlackModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] p-1.5 rounded transition-colors"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-6">
                  {slackError && (
                    <div className="mb-6 border border-red-500/20 bg-red-500/10 p-4 rounded-lg text-sm font-medium text-red-500 flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {slackError}
                    </div>
                  )}

                  <form onSubmit={onSlackSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Brief ID</label>
                      <input
                        type="text"
                        value={slackForm.brief_id}
                        onChange={(e) => setSlackForm({ ...slackForm, brief_id: e.target.value })}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition-colors shadow-sm"
                        placeholder="Enter Brief ID..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Target Destination</label>
                      <select
                        value={slackForm.destination_id}
                        onChange={(e) => setSlackForm({ ...slackForm, destination_id: e.target.value })}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition-colors shadow-sm appearance-none"
                      >
                        <option value="">Select a destination...</option>
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.destination_type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-color)] mt-2">
                      <button type="button" onClick={() => setIsSlackModalOpen(false)} className="px-4 py-2.5 rounded text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--item-hover)] transition-colors">Cancel</button>
                      <button
                        type="submit"
                        disabled={isExportingSlack}
                        className="flex items-center gap-2 bg-[var(--text-primary)] text-[var(--card-bg)] px-6 py-2.5 rounded text-sm font-semibold hover:bg-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {isExportingSlack ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Execute
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
