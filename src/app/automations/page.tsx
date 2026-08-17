// oshift/src/app/automations/page.tsx
'use client';

import { useState } from 'react';
import { useAutomations } from '@/hooks/use-automations';
import {
  ScheduleFrequency,
  formatCronToHuman,
  computeCronFromUserSelection,
} from '@/utils/cron';
import {
  Clock,
  Plus,
  Zap,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Activity,
  Check,
  Play,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomDropdown, { DropdownOption } from '@/components/ui/CustomDropdown';
import CalendarGridDropdown from '@/components/ui/CalendarGridDropdown';

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
    name: 'LLM Analyzers & Scoring Engine',
    desc: 'Extracts strategic themes, computes vulnerability indices, and identifies momentum shifts.',
    icon: Sparkles,
    badge: 'Intelligence AI',
  },
  {
    id: 'oshift/reporters.run',
    name: 'Brief Synthesizers & Exporters',
    desc: 'Generates structured executive reports and delivers them to connected channels.',
    icon: Layers,
    badge: 'Reporting',
  },
];

const WORKFLOW_DROPDOWN_OPTIONS: DropdownOption[] = WORKFLOW_TYPES.map((wf) => ({
  value: wf.id,
  label: wf.name,
  description: wf.desc,
  icon: wf.icon,
}));

const FREQUENCY_OPTIONS: DropdownOption<ScheduleFrequency>[] = [
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Execute pipeline on a recurring day of the week',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Execute pipeline on a fixed day of the month (Days 1–28)',
  },
];

export default function AutomationsPage() {
  const {
    runs,
    schedules,
    isLoadingSchedules,
    isTriggering,
    error,
    triggerPipeline,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshRuns,
    refreshSchedules,
  } = useAutomations();

  const [userTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'Local Time';
    }
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleWorkflow, setScheduleWorkflow] = useState('oshift-chained-master');
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>('weekly');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState('1');
  const [selectedMonthlyDay, setSelectedMonthlyDay] = useState('1');

  const [selectedWorkflow, setSelectedWorkflow] = useState('oshift-chained-master');
  const [isVerbose, setIsVerbose] = useState(false);
  const [triggerSuccessToast, setTriggerSuccessToast] = useState<string | null>(null);

  const handleTrigger = async (workflowTypeOverride?: string) => {
    const wf = workflowTypeOverride || selectedWorkflow;
    const isMaster = wf === 'oshift-chained-master';

    const payload = isMaster
      ? {
          workflowType: 'oshift/crawlers.run',
          chain: ['oshift/analyzers.run', 'oshift/reporters.run'],
          isVerbose,
        }
      : {
          workflowType: wf,
          isVerbose,
        };

    const res = await triggerPipeline(payload);
    if (res?.run_id) {
      setTriggerSuccessToast(`Pipeline triggered! Run ID: ${res.run_id.slice(0, 8)}`);
      setTimeout(() => setTriggerSuccessToast(null), 5000);
      refreshRuns();
    }
  };

  const getCronFromSelection = () => {
    return computeCronFromUserSelection(
      scheduleFrequency,
      scheduleTime,
      selectedWeeklyDay,
      selectedMonthlyDay
    );
  };

  const handleCreateSchedule = async () => {
    if (!scheduleName.trim()) return;
    const generatedCron = getCronFromSelection();
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
  const totalRunsCount = runs.length;

  return (
    <div className="main-content" style={{ overflowY: 'auto', padding: '40px 60px' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Automations & Workflows</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage scheduled pipelines, orchestrate crawler and reporter workflows, and review execution logs.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Active Schedules</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{activeSchedulesCount}</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
              <Clock className="h-5 w-5 text-[var(--text-primary)]" />
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Automated Executions</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalRunsCount}</p>
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

        {/* Main 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Active Automated Schedules */}
          <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-6">
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
                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Set up weekly or monthly schedules to automate competitor signal collection.</p>
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

          {/* One-Click Manual Trigger */}
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
                    placeholder="e.g. Weekly Intelligence Pipeline"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                  />
                </div>

                <CustomDropdown
                  label="Workflow Target"
                  options={WORKFLOW_DROPDOWN_OPTIONS}
                  value={scheduleWorkflow}
                  onChange={(val) => setScheduleWorkflow(val)}
                />

                <CustomDropdown<ScheduleFrequency>
                  label="Frequency"
                  options={FREQUENCY_OPTIONS}
                  value={scheduleFrequency}
                  onChange={(val) => setScheduleFrequency(val)}
                />

                {scheduleFrequency === 'weekly' ? (
                  <CalendarGridDropdown
                    mode="weekly"
                    label="Day of the Week"
                    value={selectedWeeklyDay}
                    onChange={(val) => setSelectedWeeklyDay(val)}
                  />
                ) : (
                  <CalendarGridDropdown
                    mode="monthly"
                    label="Date of the Month (Days 1–28)"
                    value={selectedMonthlyDay}
                    onChange={(val) => setSelectedMonthlyDay(val)}
                  />
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
                      {formatCronToHuman(getCronFromSelection())}
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
