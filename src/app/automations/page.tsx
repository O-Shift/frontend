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
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Activity,
  Check,
  Play,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WORKFLOW_TYPES = [
  {
    id: 'oshift-chained-master',
    name: 'Full Master Intelligence Pipeline',
    desc: 'Sequentially executes Crawlers → Analyzers → Reporters to collect fresh signals, update scores, and export briefs.',
    icon: Sparkles,
    badge: 'Full Suite',
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

  const [userTimezone, setUserTimezone] = useState('');
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tz);
    } catch {
      setUserTimezone('Local Time');
    }
  }, []);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleWorkflow, setScheduleWorkflow] = useState('oshift-chained-master');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekdays' | 'weekly' | 'monthly'>('daily');
  const [scheduleTime, setScheduleTime] = useState('18:00');
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState('1');

  const [selectedWorkflow, setSelectedWorkflow] = useState('oshift-chained-master');
  const [isVerbose, setIsVerbose] = useState(false);
  const [triggerSuccessToast, setTriggerSuccessToast] = useState<string | null>(null);

  const handleTrigger = async (wfOverride?: string) => {
    setTriggerSuccessToast(null);
    const targetWf = wfOverride || selectedWorkflow;
    let finalWf = targetWf;
    let chainArr: string[] = [];

    if (targetWf === 'oshift-chained-master') {
      finalWf = 'oshift/crawlers.run';
      chainArr = ['oshift/analyzers.run', 'oshift/reporters.run'];
    }

    const res = await triggerPipeline({
      workflowType: finalWf,
      verbose: isVerbose,
      chain: chainArr,
    });
    if (res?.run_id) {
      setTriggerSuccessToast(`Pipeline triggered! Run ID: ${res.run_id.slice(0, 8)}`);
      setTimeout(() => setTriggerSuccessToast(null), 5000);
      refreshRuns();
    }
  };

  const computeCronFromUserSelection = () => {
    const [h, m] = scheduleTime.split(':');
    const hourVal = parseInt(h, 10) || 0;
    const minVal = parseInt(m, 10) || 0;

    if (scheduleFrequency === 'daily') return `${minVal} ${hourVal} * * *`;
    if (scheduleFrequency === 'weekdays') return `${minVal} ${hourVal} * * 1-5`;
    if (scheduleFrequency === 'weekly') return `${minVal} ${hourVal} * * ${selectedWeeklyDay}`;
    if (scheduleFrequency === 'monthly') return `${minVal} ${hourVal} 1 * *`;
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
      refreshSchedules();
    }
  };

  const activeSchedulesCount = schedules.filter((s) => s.is_active).length;
  const completedRunsCount = runs.filter((r) => r.status === 'completed').length;

  return (
    <div className="flex-1 w-full overflow-y-auto p-6 md:p-10 pb-24 bg-[var(--bg-main-alt)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Automations & Schedules</h1>
              {userTimezone && (
                <span className="rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {userTimezone}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Set up automated background sweeps, monitor pipeline execution runs, and trigger workflows on demand.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                refreshRuns();
                refreshSchedules();
              }}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync</span>
            </button>

            <button
              onClick={() => handleTrigger('oshift-chained-master')}
              disabled={isTriggering}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              <Zap className="h-4 w-4" />
              <span>{isTriggering ? 'Triggering...' : 'Run Master Pipeline'}</span>
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Schedule</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Active Schedules</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{activeSchedulesCount} / {schedules.length}</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
              <Clock className="h-5 w-5 text-[var(--text-primary)]" />
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">24h Pipeline Executions</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{runs.length} <span className="text-xs font-normal text-[var(--text-secondary)]">({completedRunsCount} completed)</span></p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
              <Activity className="h-5 w-5 text-[var(--text-primary)]" />
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Pipeline Engine</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{isTriggering ? 'Executing' : 'Idle / Ready'}</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
              <Sparkles className="h-5 w-5 text-[var(--text-primary)]" />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {triggerSuccessToast && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{triggerSuccessToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[var(--text-primary)]" />
                  <div>
                    <h2 className="font-semibold text-base text-[var(--text-primary)]">Active Automated Schedules</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Recurring background tasks executed automatically.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Schedule</span>
                </button>
              </div>

              {isLoadingSchedules ? (
                <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading schedules...</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[var(--border-color)] rounded-xl p-6">
                  <p className="text-sm font-medium text-[var(--text-primary)]">No schedules created yet</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Set up daily or weekly sweeps to automate competitor signal collection.</p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Schedule</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="border border-[var(--border-color)] bg-[var(--card-bg-alt)] rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-[var(--text-secondary)] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{schedule.name}</h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">{formatCronToHuman(schedule.cron_expr)}</p>
                        </div>
                        <button
                          onClick={() => updateSchedule(schedule.id, { is_active: !schedule.is_active })}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          title={schedule.is_active ? 'Disable schedule' : 'Enable schedule'}
                        >
                          {schedule.is_active ? (
                            <ToggleRight className="h-6 w-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                        <span className="font-mono text-[11px] truncate max-w-[140px]">{schedule.workflow_type}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTrigger(schedule.workflow_type)}
                            className="px-2.5 py-1 rounded bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--item-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-[11px] font-medium"
                          >
                            Run Now
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-1 rounded text-[var(--text-secondary)] hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Schedule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-[var(--text-primary)]" />
                  <div>
                    <h2 className="font-semibold text-base text-[var(--text-primary)]">Pipeline Execution Stream</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Click any execution to inspect detailed step logs.</p>
                  </div>
                </div>
                <button
                  onClick={refreshRuns}
                  className="p-1.5 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
                  title="Refresh runs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {isLoadingRuns ? (
                <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading executions...</span>
                </div>
              ) : runs.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
                  No pipeline executions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {runs.map((run) => {
                    const isSelected = run.id === selectedRunId;
                    return (
                      <div
                        key={run.id}
                        onClick={() => fetchSteps(run.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--text-primary)] bg-[var(--card-bg-alt)]'
                            : 'border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {run.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : run.status === 'failed' ? (
                            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-secondary)] shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[var(--text-primary)]">Pipeline Run</span>
                              <span className="text-[10px] font-mono text-[var(--text-secondary)]">#{run.id.slice(0, 8)}</span>
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                              Started {new Date(run.started_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">
                            {run.status}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Run Step Inspector</h3>
                {selectedRunId && (
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">#{selectedRunId.slice(0, 8)}</span>
                )}
              </div>

              {!selectedRunId ? (
                <div className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  Select any execution run from the left panel to inspect step progress.
                </div>
              ) : isLoadingSteps ? (
                <div className="flex items-center justify-center py-10 text-xs text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Fetching step metrics...</span>
                </div>
              ) : selectedRunSteps.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
                  No step details logged for this run.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedRunSteps.map((step, i) => (
                    <div key={i} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)]">{step.step_name || `Step ${i + 1}`}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{step.status}</span>
                      </div>
                      {step.duration_ms && (
                        <p className="text-[11px] text-[var(--text-secondary)]">Duration: {(step.duration_ms / 1000).toFixed(1)}s</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
                One-Click Manual Trigger
              </h3>

              <div className="space-y-3">
                <label className="text-xs font-medium text-[var(--text-secondary)] block">Target Workflow</label>
                <div className="space-y-2">
                  {WORKFLOW_TYPES.map((wf) => (
                    <button
                      key={wf.id}
                      onClick={() => setSelectedWorkflow(wf.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs cursor-pointer ${
                        selectedWorkflow === wf.id
                          ? 'border-[var(--text-primary)] bg-[var(--card-bg-alt)] text-[var(--text-primary)] font-semibold'
                          : 'border-[var(--border-color)] bg-[var(--bg-main-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{wf.name}</span>
                        {selectedWorkflow === wf.id && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 text-xs text-[var(--text-secondary)]">
                  <span>Verbose Logging</span>
                  <button
                    onClick={() => setIsVerbose(!isVerbose)}
                    className="cursor-pointer"
                  >
                    {isVerbose ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                </div>

                <button
                  onClick={() => handleTrigger()}
                  disabled={isTriggering}
                  className="w-full mt-2 py-2.5 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isTriggering ? 'Triggering...' : 'Launch Workflow'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── CREATE SCHEDULE MODAL ── */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Create Automated Schedule</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Schedule Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Daily Evening Competitor Sweep"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Workflow Target</label>
                  <select
                    value={scheduleWorkflow}
                    onChange={(e) => setScheduleWorkflow(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                  >
                    {WORKFLOW_TYPES.map((wf) => (
                      <option key={wf.id} value={wf.id}>{wf.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['daily', 'weekdays', 'weekly', 'monthly'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setScheduleFrequency(freq)}
                        className={`py-2 rounded-lg border text-center capitalize transition-all cursor-pointer ${
                          scheduleFrequency === freq
                            ? 'border-[var(--text-primary)] bg-[var(--card-bg-alt)] text-[var(--text-primary)] font-semibold'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {scheduleFrequency === 'weekly' && (
                  <div>
                    <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Day of Week</label>
                    <select
                      value={selectedWeeklyDay}
                      onChange={(e) => setSelectedWeeklyDay(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Execution Time ({userTimezone || 'Local'})</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] p-3 flex items-center gap-2 text-xs">
                  <Info className="h-4 w-4 text-[var(--text-primary)] shrink-0" />
                  <span className="text-[var(--text-secondary)]">
                    Will run:{' '}
                    <strong className="text-[var(--text-primary)]">
                      {formatCronToHuman(computeCronFromUserSelection())}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchedule}
                  disabled={!scheduleName.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
