// oshift/src/app/automations/page.tsx
'use client';

import { useState } from 'react';
import { useAutomations } from '@/hooks/use-automations';
import { scheduleCreateSchema } from '@/types/schemas';
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Plus,
  RefreshCw,
  ChevronRight,
  X,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';

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
    refreshRuns,
  } = useAutomations();

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'runs' | 'schedules'>('runs');

  const [scheduleForm, setScheduleForm] = useState({
    name: 'Daily Pipeline Run',
    cron_expr: '0 0 * * *',
    workflow_type: 'oshift-pipeline-v1',
    is_active: true,
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const onScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);

    const parseRes = scheduleCreateSchema.safeParse(scheduleForm);
    if (!parseRes.success) {
      setScheduleError(parseRes.error.issues[0]?.message || 'Invalid schedule form');
      return;
    }

    setIsSubmittingSchedule(true);
    const res = await createSchedule(parseRes.data);
    setIsSubmittingSchedule(false);

    if (res) {
      setScheduleForm({
        name: 'Daily Pipeline Run',
        cron_expr: '0 0 * * *',
        workflow_type: 'oshift-pipeline-v1',
        is_active: true,
      });
      setIsScheduleModalOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Running
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-400 border border-gray-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto font-sans text-[var(--text-primary)]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-[var(--accent)]" />
            <h1 className="text-xl font-bold">Pipeline Automations</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Trigger, monitor, and schedule the 12-step OShift competitive intelligence pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshRuns()}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>

          <button
            onClick={() => triggerPipeline()}
            disabled={isTriggering}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-50"
          >
            {isTriggering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            <span>Trigger Pipeline</span>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab('runs')}
          className={`flex items-center gap-2 border-b-2 px-3 py-1.5 transition ${
            activeTab === 'runs'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Clock className="h-4 w-4" /> Pipeline Runs ({runs.length})
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 border-b-2 px-3 py-1.5 transition ${
            activeTab === 'schedules'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Calendar className="h-4 w-4" /> Cron Schedules ({schedules.length})
        </button>
      </div>

      {/* Runs Tab */}
      {activeTab === 'runs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Runs Table */}
          <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-4">Execution History</h2>
            {isLoadingRuns && runs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading pipeline runs...
              </div>
            ) : runs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
                No pipeline runs executed yet. Click "Trigger Pipeline" to start.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                      <th className="pb-3 font-medium">Run ID</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Started At</th>
                      <th className="pb-3 font-medium">Completed At</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {runs.map((run) => {
                      const isSelected = run.id === selectedRunId;
                      return (
                        <tr
                          key={run.id}
                          onClick={() => fetchSteps(run.id)}
                          className={`cursor-pointer transition hover:bg-[var(--bg-main)] ${
                            isSelected ? 'bg-[var(--accent)]/10 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 font-mono text-[var(--accent)]">
                            {run.id.slice(0, 8)}...
                          </td>
                          <td className="py-3">{getStatusBadge(run.status)}</td>
                          <td className="py-3 text-[var(--text-secondary)]">
                            {new Date(run.started_at).toLocaleString()}
                          </td>
                          <td className="py-3 text-[var(--text-secondary)]">
                            {run.completed_at ? new Date(run.completed_at).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 text-right">
                            <ChevronRight className="h-4 w-4 text-[var(--text-secondary)] inline" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Steps Detail Drawer / Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold">12-Step Execution Timing</h2>
              </div>
            </div>

            {!selectedRunId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-[var(--text-secondary)]">
                <Clock className="h-8 w-8 opacity-40 mb-2 stroke-1" />
                Select a run from the history table to view step details
              </div>
            ) : isLoadingSteps ? (
              <div className="flex items-center justify-center py-16 text-xs text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading step details...
              </div>
            ) : selectedRunSteps.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-secondary)]">
                No steps recorded for run <span className="font-mono">{selectedRunId.slice(0, 8)}</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedRunSteps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span>{step.step_name}</span>
                      {getStatusBadge(step.status)}
                    </div>
                    {step.duration_ms !== undefined && step.duration_ms !== null && (
                      <div className="mt-2 text-[10px] text-[var(--text-secondary)] flex justify-between">
                        <span>Duration:</span>
                        <span className="font-mono text-[var(--accent)]">{step.duration_ms} ms</span>
                      </div>
                    )}
                    {step.error && (
                      <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 p-1.5 rounded">
                        {step.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Scheduled Automations</h2>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Add Schedule
            </button>
          </div>

          {isLoadingSchedules && schedules.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading schedules...
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              No cron schedules configured. Click "Add Schedule" to create your first automated run.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-4 text-xs gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{schedule.name}</span>
                    <button
                      onClick={() => updateSchedule(schedule.id, { is_active: !schedule.is_active })}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                        schedule.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}
                    >
                      {schedule.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="space-y-1 font-mono text-[var(--text-secondary)] text-[11px]">
                    <div>Cron: <span className="text-[var(--accent)]">{schedule.cron_expr}</span></div>
                    <div>Workflow: {schedule.workflow_type}</div>
                    {schedule.next_run_at && (
                      <div>Next Run: {new Date(schedule.next_run_at).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Create Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Create Cron Schedule</h3>
              <button onClick={() => setIsScheduleModalOpen(false)}>
                <X className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {scheduleError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={onScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  placeholder="e.g. Daily Market Scrape"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Cron Expression (5 fields)</label>
                <input
                  type="text"
                  value={scheduleForm.cron_expr}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, cron_expr: e.target.value })}
                  placeholder="0 0 * * *"
                  className="w-full font-mono rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2 text-[var(--text-secondary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2 font-semibold text-white shadow disabled:opacity-50"
                >
                  {isSubmittingSchedule ? 'Creating...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
