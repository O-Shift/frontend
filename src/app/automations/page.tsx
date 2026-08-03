// oshift/src/app/automations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAutomations } from '@/hooks/use-automations';
import {
  Clock,
  Plus,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Layers,
  Settings,
  Calendar,
  Sparkles,
  Sliders,
  Play,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Info,
} from 'lucide-react';

const WORKFLOW_TYPES = [
  {
    id: 'oshift-chained-master',
    name: 'Full Master Intelligence Pipeline (Chained)',
    desc: 'Runs the 3 pipelines sequentially (Crawlers → Analyzers → Reporters) to collect fresh signals, update scores, and export briefs.',
    icon: Sparkles,
    badge: 'Full Suite (Chained)',
  },
  {
    id: 'oshift/crawlers.run',
    name: 'Data Crawlers & Collectors',
    desc: 'Scrapes web content, social media posts, and video assets across tracked competitors.',
    icon: Zap,
    badge: 'Data Collection',
  },
  {
    id: 'oshift/analyzers.run',
    name: 'Analysis & Knowledge Graph',
    desc: 'Normalizes raw signals, computes threat scores, updates graph memory, and distills market signals.',
    icon: Layers,
    badge: 'Intelligence',
  },
  {
    id: 'oshift/reporters.run',
    name: 'Briefs & Export Distribution',
    desc: 'Generates executive briefs, triggers anomaly alerts, and exports to Slack and connected webhooks.',
    icon: Settings,
    badge: 'Reporting',
  },
];

const AVAILABLE_STEPS = [
  { id: 'web_collector', label: 'Web Scraper' },
  { id: 'social_collector', label: 'Social Media' },
  { id: 'video_collector', label: 'Video Asset' },
  { id: 'normalizer', label: 'Data Normalizer' },
  { id: 'scoring', label: 'Scoring Engine' },
  { id: 'graph_memory', label: 'Knowledge Graph' },
  { id: 'insights', label: 'Insights Engine' },
  { id: 'battlecard', label: 'Battlecards' },
  { id: 'brief_generator', label: 'Executive Brief' },
  { id: 'alerts', label: 'Alert Dispatcher' },
  { id: 'exports', label: 'Slack & Webhook' },
];

const DAYS_OF_WEEK = [
  { id: '1', label: 'Monday' },
  { id: '2', label: 'Tuesday' },
  { id: '3', label: 'Wednesday' },
  { id: '4', label: 'Thursday' },
  { id: '5', label: 'Friday' },
  { id: '6', label: 'Saturday' },
  { id: '0', label: 'Sunday' },
];

export function formatCronToHuman(cron: string | null | undefined): string {
  if (!cron) return 'Scheduled Task';
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 'Scheduled Task';

  const [minStr, hourStr, domStr, monStr, dowStr] = parts;

  const hourNum = parseInt(hourStr, 10);
  const minNum = parseInt(minStr, 10);

  const timeFormatted =
    isNaN(hourNum) || isNaN(minNum)
      ? '9:00 AM'
      : new Date(2026, 0, 1, hourNum, minNum).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

  if (dowStr === '1-5') return `Every Weekday at ${timeFormatted}`;
  if (dowStr === '1') return `Weekly on Mondays at ${timeFormatted}`;
  if (dowStr === '5') return `Weekly on Fridays at ${timeFormatted}`;
  if (dowStr === '0' || dowStr === '7') return `Weekly on Sundays at ${timeFormatted}`;
  if (domStr === '1') return `Monthly on the 1st at ${timeFormatted}`;
  if (dowStr === '*' && domStr === '*') return `Daily at ${timeFormatted}`;

  if (dowStr !== '*') {
    const dayMap: Record<string, string> = {
      '1': 'Mon',
      '2': 'Tue',
      '3': 'Wed',
      '4': 'Thu',
      '5': 'Fri',
      '6': 'Sat',
      '0': 'Sun',
      '7': 'Sun',
    };
    const days = dowStr.split(',').map((d) => dayMap[d] || d).join(', ');
    return `Weekly on ${days} at ${timeFormatted}`;
  }

  return `Daily at ${timeFormatted}`;
}

export default function AutomationsPage() {
  const {
    runs,
    schedules,
    selectedRunId,
    selectedRunSteps,
    isLoadingRuns,
    isLoadingSteps,
    isLoadingSchedules,
    isTriggering,
    error,
    triggerPipeline,
    fetchSteps,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshRuns,
    refreshSchedules,
  } = useAutomations();

  // User Local Timezone Detection
  const [userTimezone, setUserTimezone] = useState('');
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tz);
    } catch {
      setUserTimezone('Local Time');
    }
  }, []);

  // Modal & Schedule Creator State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleWorkflow, setScheduleWorkflow] = useState('oshift-chained-master');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekdays' | 'weekly' | 'monthly'>('daily');
  const [scheduleTime, setScheduleTime] = useState('18:00'); // Default 6:00 PM
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState('1'); // Default Monday

  // Manual Trigger Collapsible State
  const [showManualSection, setShowManualSection] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState('oshift-chained-master');
  const [selectedChain, setSelectedChain] = useState<string[]>([]);
  const [isVerbose, setIsVerbose] = useState(false);
  const [triggerSuccessToast, setTriggerSuccessToast] = useState<string | null>(null);

  const toggleStepChain = (stepId: string) => {
    setSelectedChain((prev) =>
      prev.includes(stepId) ? prev.filter((s) => s !== stepId) : [...prev, stepId]
    );
  };

  const handleTrigger = async () => {
    setTriggerSuccessToast(null);
    let targetWf = selectedWorkflow;
    let chainArr = selectedChain;

    if (selectedWorkflow === 'oshift-chained-master') {
      targetWf = 'oshift/crawlers.run';
      chainArr = ['oshift/analyzers.run', 'oshift/reporters.run'];
    }

    const res = await triggerPipeline({
      workflowType: targetWf,
      verbose: isVerbose,
      chain: chainArr,
    });
    if (res?.run_id) {
      setTriggerSuccessToast(`Chained Master Pipeline triggered! Run ID: ${res.run_id}`);
      setTimeout(() => setTriggerSuccessToast(null), 5000);
    }
  };

  const computeCronFromUserSelection = () => {
    const [h, m] = scheduleTime.split(':');
    const hourVal = parseInt(h, 10) || 0;
    const minVal = parseInt(m, 10) || 0;

    if (scheduleFrequency === 'daily') {
      return `${minVal} ${hourVal} * * *`;
    }
    if (scheduleFrequency === 'weekdays') {
      return `${minVal} ${hourVal} * * 1-5`;
    }
    if (scheduleFrequency === 'weekly') {
      return `${minVal} ${hourVal} * * ${selectedWeeklyDay}`;
    }
    if (scheduleFrequency === 'monthly') {
      return `${minVal} ${hourVal} 1 * *`;
    }
    return `${minVal} ${hourVal} * * *`;
  };

  const handleCreateSchedule = async () => {
    if (!scheduleName.trim()) return;
    const generatedCron = computeCronFromUserSelection();
    const targetWf = scheduleWorkflow === 'oshift-chained-master' ? 'oshift/crawlers.run' : scheduleWorkflow;
    const res = await createSchedule({
      name: scheduleName.trim(),
      cron_expr: generatedCron,
      workflow_type: targetWf,
      is_active: true,
    });
    if (res) {
      setShowScheduleModal(false);
      setScheduleName('');
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 text-[var(--text-primary)] font-sans max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Automated Schedules & Workflows</h1>
            {userTimezone && (
              <span className="rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                {userTimezone}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Schedule competitive intelligence sweeps to run automatically at your preferred local time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refreshRuns();
              refreshSchedules();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-medium hover:border-[var(--accent)] transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Automated Schedule</span>
          </button>
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {triggerSuccessToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{triggerSuccessToast}</span>
        </div>
      )}

      {/* HERO SECTION 1: Automated Schedules List */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <h2 className="font-bold text-sm">Active Automated Schedules</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Recurrent background tasks executed automatically on schedule.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="text-xs text-[var(--accent)] hover:underline font-bold"
          >
            + New Schedule
          </button>
        </div>

        {isLoadingSchedules && schedules.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-sm">No Active Schedules Configured</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Create a schedule to run competitive analysis every evening, weekday morning, or monthly automatically.
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule First Task</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((sched) => {
              const humanLabel = formatCronToHuman(sched.cron_expr);
              const targetWfObj = WORKFLOW_TYPES.find((w) => w.id === sched.workflow_type);
              return (
                <div
                  key={sched.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    sched.is_active
                      ? 'border-[var(--accent)]/40 bg-[var(--bg-main)] shadow-sm'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 opacity-70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-xs text-[var(--text-primary)]">{sched.name}</h3>
                        <p className="text-[11px] font-semibold text-[var(--accent)] mt-0.5">
                          {humanLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            updateSchedule(sched.id, { is_active: !sched.is_active })
                          }
                          className="hover:opacity-80 transition"
                          title={sched.is_active ? 'Pause Schedule' : 'Activate Schedule'}
                        >
                          {sched.is_active ? (
                            <ToggleRight className="h-6 w-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-zinc-500" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteSchedule(sched.id)}
                          className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition"
                          title="Delete Schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[var(--card-bg)] p-2.5 text-[11px] space-y-1 border border-[var(--border-color)]">
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span>Workflow:</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {targetWfObj ? targetWfObj.name : sched.workflow_type}
                        </span>
                      </div>
                      {sched.next_run_at && (
                        <div className="flex items-center justify-between text-[var(--text-secondary)]">
                          <span>Next Run:</span>
                          <span className="font-medium text-emerald-400">
                            {new Date(sched.next_run_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-[10px] text-[var(--text-secondary)]">
                    <span>
                      Status: {sched.is_active ? '🟢 Active' : '⚪ Paused'}
                    </span>
                    {sched.last_run_at && (
                      <span>
                        Last run: {new Date(sched.last_run_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Pipeline Execution History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="font-semibold text-sm">Execution History & Logs</h2>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">Auto-syncing every 5s</span>
          </div>

          {isLoadingRuns && runs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Fetching pipeline execution log...
            </div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              No executions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold">
                    <th className="py-2.5 px-3">Run ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Started At</th>
                    <th className="py-2.5 px-3">Completed At</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {runs.map((run) => {
                    const isSelected = selectedRunId === run.id;
                    const isRunning = run.status === 'running';
                    const isFailed = run.status === 'failed';
                    return (
                      <tr
                        key={run.id}
                        onClick={() => fetchSteps(run.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[var(--accent)]/10 font-medium' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-[var(--accent)]">
                          {run.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              isRunning
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : isFailed
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isRunning && <Loader2 className="h-3 w-3 animate-spin" />}
                            {run.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {new Date(run.started_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {run.completed_at
                            ? new Date(run.completed_at).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true,
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <ChevronRight className="h-4 w-4 inline opacity-60" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Step Timing Drawer Column */}
        <div>
          {selectedRunId ? (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                  Step Breakdown ({selectedRunId.slice(0, 8)})
                </h3>
                <button
                  onClick={() => fetchSteps(selectedRunId)}
                  className="text-[11px] text-[var(--accent)] hover:underline"
                >
                  Reload
                </button>
              </div>

              {isLoadingSteps ? (
                <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  Loading steps...
                </div>
              ) : selectedRunSteps.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                  No step results emitted yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {selectedRunSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--text-primary)]">{step.step_name}</span>
                        <span className="font-mono text-[10px] text-[var(--accent)]">
                          {step.duration_ms}ms
                        </span>
                      </div>
                      {step.error && (
                        <p className="text-[10px] text-red-400 bg-red-500/10 p-1.5 rounded font-mono break-all">
                          {step.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm text-center text-xs text-[var(--text-secondary)] py-12">
              Select any execution row on the left to view detailed step timing breakdowns.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Manual Instant Triggering (Collapsible Accordion) */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
        <button
          onClick={() => setShowManualSection(!showManualSection)}
          className="w-full flex items-center justify-between p-4 bg-[var(--bg-main)]/50 hover:bg-[var(--bg-main)] transition text-left"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[var(--text-secondary)]" />
            <div>
              <span className="font-semibold text-xs text-[var(--text-primary)]">
                Manual One-Off Trigger & Step Builder
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] ml-2">
                (Execute pipeline manually on demand)
              </span>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 transition-transform ${showManualSection ? 'rotate-90' : ''}`} />
        </button>

        {showManualSection && (
          <div className="p-5 border-t border-[var(--border-color)] space-y-5">
            {/* Task Type Cards */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-2.5 block">
                Select Workflow Task Type:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {WORKFLOW_TYPES.map((wf) => {
                  const Icon = wf.icon;
                  const isSelected = selectedWorkflow === wf.id;
                  return (
                    <div
                      key={wf.id}
                      onClick={() => setSelectedWorkflow(wf.id)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
                          <span className="font-semibold text-xs text-[var(--text-primary)]">{wf.name}</span>
                        </div>
                        <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                          {wf.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{wf.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Chaining */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Chain Specific Steps (Optional Filters):
                </label>
                {selectedChain.length > 0 && (
                  <button
                    onClick={() => setSelectedChain([])}
                    className="text-[11px] text-[var(--accent)] hover:underline"
                  >
                    Clear Filter ({selectedChain.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_STEPS.map((st) => {
                  const isChained = selectedChain.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      onClick={() => toggleStepChain(st.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                        isChained
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      {isChained ? `✓ ${st.label}` : `+ ${st.label}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVerbose}
                  onChange={(e) => setIsVerbose(e.target.checked)}
                  className="rounded border-[var(--border-color)] accent-[var(--accent)]"
                />
                <span>Verbose Execution Logging</span>
              </label>

              <button
                onClick={handleTrigger}
                disabled={isTriggering}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-50 shadow-md active:scale-95"
              >
                {isTriggering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Execute Instantly</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User-Friendly Schedule Creator Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="font-bold text-base">Schedule Automated Task</h2>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Schedule Name */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                Schedule Label:
              </label>
              <input
                type="text"
                placeholder="e.g. Daily Evening Intelligence Sweep"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Target Workflow Task */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                Target Intelligence Task:
              </label>
              <select
                value={scheduleWorkflow}
                onChange={(e) => setScheduleWorkflow(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                {WORKFLOW_TYPES.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-primary)] block">
                Frequency:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'daily', label: 'Daily' },
                  { id: 'weekdays', label: 'Weekdays' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'monthly', label: 'Monthly' },
                ].map((freq) => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => setScheduleFrequency(freq.id as any)}
                    className={`rounded-xl border py-2 px-3 text-xs font-semibold transition ${
                      scheduleFrequency === freq.id
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day of Week Selection (If Weekly) */}
            {scheduleFrequency === 'weekly' && (
              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                  Select Day of Week:
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedWeeklyDay(d.id)}
                      className={`rounded-lg border py-1.5 text-xs font-medium transition ${
                        selectedWeeklyDay === d.id
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {d.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Local Time Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Execution Time (Your Local Timezone):
                </label>
                {userTimezone && (
                  <span className="text-[10px] font-mono text-[var(--accent)]">
                    {userTimezone}
                  </span>
                )}
              </div>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            {/* Human Readable Summary Box */}
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3.5 flex items-center gap-2 text-xs">
              <Info className="h-4 w-4 text-[var(--accent)] shrink-0" />
              <span className="text-[var(--text-secondary)]">
                Will run:{' '}
                <strong className="text-[var(--accent)]">
                  {formatCronToHuman(computeCronFromUserSelection())}
                </strong>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-4">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-semibold hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSchedule}
                disabled={!scheduleName.trim()}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-40"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
