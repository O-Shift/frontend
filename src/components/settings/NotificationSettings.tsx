// frontend/src/components/settings/NotificationSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAutomations } from '@/hooks/use-automations';
import { useExports } from '@/hooks/use-exports';
import {
  ScheduleFrequency,
  formatCronToHuman,
  computeCronFromUserSelection,
  parseCronToUserSelection,
} from '@/utils/cron';
import {
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  Info,
  Play,
  Globe,
  Bell,
  Sparkles,
  ShieldCheck,
  Plus,
  Mail,
} from 'lucide-react';
import { FaSlack, FaDiscord, FaTelegram } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';
import CustomDropdown, { DropdownOption } from '@/components/ui/CustomDropdown';
import CalendarGridDropdown from '@/components/ui/CalendarGridDropdown';

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

interface PlatformMeta {
  id: 'email' | 'slack' | 'discord' | 'telegram' | 'webhook';
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
}

const SUPPORTED_PLATFORMS: PlatformMeta[] = [
  {
    id: 'email',
    name: 'Email Digest',
    desc: 'Deliver executive briefs & critical alerts directly to your team (via agent@oshift.sheref.dev).',
    icon: Mail,
    color: '#10B981',
    bgLight: '#ecfdf5',
    bgDark: 'rgba(16, 185, 129, 0.1)',
    borderLight: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Send executive briefs and market alerts into your team channel.',
    icon: FaSlack,
    color: '#E01E5A',
    bgLight: '#fdf2f4',
    bgDark: 'rgba(224, 30, 90, 0.1)',
    borderLight: 'rgba(224, 30, 90, 0.25)',
  },
  {
    id: 'discord',
    name: 'Discord',
    desc: 'Deliver intelligence digests and competitor updates to your Discord server.',
    icon: FaDiscord,
    color: '#5865F2',
    bgLight: '#f0f2fe',
    bgDark: 'rgba(88, 101, 242, 0.1)',
    borderLight: 'rgba(88, 101, 242, 0.25)',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    desc: 'Receive mobile intelligence summaries in a Telegram group or channel.',
    icon: FaTelegram,
    color: '#229ED9',
    bgLight: '#eef8fc',
    bgDark: 'rgba(34, 158, 217, 0.1)',
    borderLight: 'rgba(34, 158, 217, 0.25)',
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    desc: 'Forward raw JSON intelligence payloads to any custom API endpoint.',
    icon: Globe,
    color: '#FF5A00',
    bgLight: '#fff5ed',
    bgDark: 'rgba(255, 90, 0, 0.1)',
    borderLight: 'rgba(255, 90, 0, 0.25)',
  },
];

export default function NotificationSettings() {
  const {
    schedules,
    runs,
    isLoadingSchedules,
    isTriggering,
    error: automationsError,
    triggerPipeline,
    createSchedule,
    updateSchedule,
    refreshSchedules,
    refreshRuns,
  } = useAutomations();

  const {
    destinations,
    isTestingDest,
    error: exportsError,
    createDestination,
    deleteDestination,
    testDestination,
    refreshDestinations,
  } = useExports();

  // Lazy-initialized timezone detection
  const [userTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'Local Time';
    }
  });

  // Primary Master Schedule State
  const primarySchedule =
    schedules.find(
      (s) =>
        s.workflow_type === 'oshift-chained-master' ||
        s.workflow_type === 'oshift/crawlers.run' ||
        s.workflow_type === 'oshift-pipeline-v1' ||
        s.workflow_type === 'pipeline'
    ) || schedules[0];

  const [frequency, setFrequency] = useState<ScheduleFrequency>('weekly');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('1');
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState('1');
  const [isScheduleActive, setIsScheduleActive] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  // Sync with loaded primary schedule
  useEffect(() => {
    if (primarySchedule) {
      const parsed = parseCronToUserSelection(primarySchedule.cron_expr);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFrequency(parsed.frequency);
      setScheduleTime(parsed.time);
      setSelectedDayOfWeek(parsed.dayOfWeek);
      setSelectedDayOfMonth(parsed.dayOfMonth);
      setIsScheduleActive(primarySchedule.is_active);
    }
  }, [primarySchedule]);

  // Integration Connection Modal State
  const [activePlatformModal, setActivePlatformModal] = useState<PlatformMeta | null>(null);
  const [destName, setDestName] = useState('');
  const [targetChannel, setTargetChannel] = useState('');
  const [targetWebhookUrl, setTargetWebhookUrl] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetSecret, setTargetSecret] = useState('');

  const [destModalError, setDestModalError] = useState<string | null>(null);
  const [testResultMsg, setTestResultMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testingDestId, setTestingDestId] = useState<string | null>(null);
  const [triggerToast, setTriggerToast] = useState<string | null>(null);

  // Workspace Members for 1-click email linking
  const [workspaceMembers, setWorkspaceMembers] = useState<{ user_id: string; email: string; role: string }[]>([]);

  useEffect(() => {
    async function loadMembers() {
      const res = await apiFetch<{ user_id: string; email: string; role: string }[]>('/exports/workspace-members');
      if (res.ok && res.data) {
        setWorkspaceMembers(res.data);
      }
    }
    loadMembers();
  }, []);

  // Helper to filter all instances of a platform
  const getPlatformDestinations = (platformId: string) => {
    return destinations.filter((d) => {
      const cfg = (d.config || {}) as Record<string, unknown>;
      if (cfg.platform === platformId) return true;
      if (platformId === 'slack' && d.destination_type === 'slack') return true;
      if (platformId === 'email' && d.destination_type === 'email') return true;
      if (platformId === 'webhook' && d.destination_type === 'webhook' && !cfg.platform) return true;
      return false;
    });
  };

  // Notification Event Preferences Toggles
  const [notifyBriefs, setNotifyBriefs] = useState(true);
  const [notifyCrises, setNotifyCrises] = useState(true);
  const [notifyDeals, setNotifyDeals] = useState(true);

  // Open modal for a specific platform
  const openConnectModal = (platform: PlatformMeta) => {
    setActivePlatformModal(platform);
    const existing = getPlatformDestinations(platform.id);
    setDestName(`${platform.name} Instance ${existing.length + 1}`);
    setTargetChannel(platform.id === 'slack' ? '#competitive-intel' : platform.id === 'discord' ? '#market-intel' : '@oshift_alerts');
    setTargetWebhookUrl('');
    setTargetEmail('');
    setTargetSecret('');
    setDestModalError(null);
    setTestResultMsg(null);
  };

  // Handle testing an existing connected destination
  const handleTestExistingDestination = async (destId: string, destType: string, config: Record<string, unknown>) => {
    setTestingDestId(destId);
    setTestResultMsg(null);
    const res = await testDestination(destType, config);
    if (res) {
      setTestResultMsg({ ok: res.ok, msg: res.message });
    }
    setTestingDestId(null);
  };

  // Handle Save / Update Pipeline Cadence
  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    setScheduleSuccessMsg(null);
    const cron = computeCronFromUserSelection(
      frequency,
      scheduleTime,
      selectedDayOfWeek,
      selectedDayOfMonth
    );

    try {
      if (primarySchedule) {
        await updateSchedule(primarySchedule.id, {
          cron_expr: cron,
          is_active: isScheduleActive,
        });
      } else {
        await createSchedule({
          name: 'Master Intelligence Pipeline',
          cron_expr: cron,
          workflow_type: 'oshift/crawlers.run',
          is_active: isScheduleActive,
        });
      }
      setScheduleSuccessMsg('Pipeline schedule updated successfully!');
      setTimeout(() => setScheduleSuccessMsg(null), 4000);
      refreshSchedules();
    } catch {
      // Error handled by hook
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Handle Manual Pipeline Trigger
  const handleRunNow = async () => {
    setTriggerToast(null);
    const res = await triggerPipeline({
      workflowType: 'oshift/crawlers.run',
      chain: ['oshift/analyzers.run', 'oshift/reporters.run'],
    });
    if (res?.run_id) {
      setTriggerToast(`Master intelligence pipeline started! Run ID: #${res.run_id.slice(0, 8)}`);
      setTimeout(() => setTriggerToast(null), 5000);
      refreshRuns();
    }
  };

  // Handle Test Connection in Modal
  const handleModalTestConnection = async () => {
    if (!activePlatformModal) return;
    setDestModalError(null);
    setTestResultMsg(null);

    if (activePlatformModal.id === 'email') {
      if (!targetEmail.trim()) {
        setDestModalError('Recipient email address is required.');
        return;
      }
      const res = await testDestination('email', { emails: targetEmail.trim() });
      if (res) {
        setTestResultMsg({ ok: res.ok, msg: res.message });
      }
      return;
    }

    if (!targetWebhookUrl.trim()) {
      setDestModalError('Webhook URL is required to test connection.');
      return;
    }

    const configObj: Record<string, unknown> = {
      channel: targetChannel.trim(),
      url: targetWebhookUrl.trim(),
      webhook_url: targetWebhookUrl.trim(),
      ...(targetSecret.trim() ? { secret: targetSecret.trim() } : {}),
    };

    // Backend test_destination expects 'slack', 'webhook', or 'notion'
    const backendDestType =
      activePlatformModal.id === 'slack'
        ? 'slack'
        : 'webhook';

    const res = await testDestination(backendDestType, configObj);
    if (res) {
      setTestResultMsg({ ok: res.ok, msg: res.message });
    }
  };

  // Handle Add Destination Submit
  const onDestinationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlatformModal) return;
    setDestModalError(null);

    if (!destName.trim()) {
      setDestModalError('Integration name is required.');
      return;
    }

    if (activePlatformModal.id === 'email') {
      if (!targetEmail.trim()) {
        setDestModalError('Recipient email address is required.');
        return;
      }
      const res = await createDestination({
        destination_type: 'email',
        name: destName.trim(),
        config: {
          emails: targetEmail.trim(),
          platform: 'email',
        },
      });
      if (res) {
        setActivePlatformModal(null);
        setTestResultMsg(null);
        refreshDestinations();
      }
      return;
    }

    if (!targetWebhookUrl.trim()) {
      setDestModalError('Webhook URL is required.');
      return;
    }

    const configObj: Record<string, unknown> = {
      channel: targetChannel.trim(),
      url: targetWebhookUrl.trim(),
      webhook_url: targetWebhookUrl.trim(),
      platform: activePlatformModal.id,
      ...(targetSecret.trim() ? { secret: targetSecret.trim() } : {}),
    };

    const backendDestType =
      activePlatformModal.id === 'slack'
        ? 'slack'
        : 'webhook';

    const res = await createDestination({
      destination_type: backendDestType,
      name: destName.trim(),
      config: configObj,
    });

    if (res) {
      setActivePlatformModal(null);
      setTestResultMsg(null);
      refreshDestinations();
    }
  };

  const computedCron = computeCronFromUserSelection(
    frequency,
    scheduleTime,
    selectedDayOfWeek,
    selectedDayOfMonth
  );
  const latestRun = runs[0];

  return (
    <div className="space-y-8 text-[var(--text-primary)]">
      {/* ── ALERTS / TOASTS ── */}
      {automationsError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{automationsError}</span>
        </div>
      )}

      {exportsError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{exportsError}</span>
        </div>
      )}

      {scheduleSuccessMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{scheduleSuccessMsg}</span>
        </div>
      )}

      {triggerToast && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-xs text-[var(--text-primary)]">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span>{triggerToast}</span>
        </div>
      )}

      {/* ── SECTION 1: PIPELINE SCHEDULE & CADENCE ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 px-1">
          Pipeline Schedule & Cadence
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mb-3 px-1">
          Choose how frequently OShift runs the full intelligence pipeline to analyze market activity and generate executive briefs.
        </p>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-6">
          {/* Master Switch Row */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--card-bg-alt)] border border-[var(--border-color)] flex items-center justify-center">
                <Clock className="h-5 w-5 text-[var(--text-primary)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Automatic Pipeline Runs</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Scheduled execution to extract competitor updates, score signals, and deliver intelligence.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScheduleActive(!isScheduleActive)}
              className="rounded-md shrink-0"
              style={{
                width: 48,
                height: 26,
                background: isScheduleActive ? 'var(--accent)' : 'var(--border-color)',
                position: 'relative',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
              }}
            >
              <motion.div
                layout
                initial={false}
                animate={{ x: isScheduleActive ? 24 : 2 }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: 'white',
                  position: 'absolute',
                  top: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {/* Frequency & Day/Date Dropdown Controls */}
          <div className={`space-y-5 transition-opacity ${!isScheduleActive ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Run Frequency Dropdown */}
              <CustomDropdown<ScheduleFrequency>
                label="Run Frequency"
                options={FREQUENCY_OPTIONS}
                value={frequency}
                onChange={(val) => setFrequency(val)}
              />

              {/* Day / Date Calendar Grid Dropdown */}
              {frequency === 'weekly' ? (
                <CalendarGridDropdown
                  mode="weekly"
                  label="Day of the Week"
                  value={selectedDayOfWeek}
                  onChange={(val) => setSelectedDayOfWeek(val)}
                />
              ) : (
                <CalendarGridDropdown
                  mode="monthly"
                  label="Day of the Month (Days 1–28)"
                  value={selectedDayOfMonth}
                  onChange={(val) => setSelectedDayOfMonth(val)}
                />
              )}
            </div>

            {/* Execution Time Picker with Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Pipeline Execution Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Timezone
                </label>
                <div className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)] flex items-center justify-between">
                  <span>{userTimezone || 'UTC'}</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)]">
                    Local Timezone
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Preview Banner */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] p-4 flex items-center gap-3 text-xs">
              <Info className="h-4 w-4 text-[var(--accent)] shrink-0" />
              <span className="text-[var(--text-secondary)]">
                Next scheduled pipeline run:{' '}
                <strong className="text-[var(--text-primary)] font-semibold">
                  {formatCronToHuman(computedCron)} ({userTimezone || 'Local'})
                </strong>
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={handleRunNow}
              disabled={isTriggering}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--item-hover)] disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isTriggering ? 'Executing Pipeline...' : 'Run Pipeline Now'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSchedule}
              disabled={isSavingSchedule || isLoadingSchedules}
              className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] px-5 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              {isSavingSchedule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>Save Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: CONNECTED INTEGRATIONS (CLEAN, LOGO-CENTRIC) ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 px-1">
          Delivery Integrations
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mb-3 px-1">
          Connect your team&apos;s favorite apps to automatically receive executive intelligence briefs and critical market alerts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUPPORTED_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const platformDests = getPlatformDestinations(platform.id);

            return (
              <div
                key={platform.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--text-secondary)] transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Prominent Platform Logo */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: platform.bgDark,
                        borderColor: platform.borderLight,
                      }}
                    >
                      <Icon className="h-6 w-6" style={{ color: platform.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                        {platform.name}
                        {platformDests.length > 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> {platformDests.length} {platformDests.length === 1 ? 'Connected' : 'Connected'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded-full">
                            Not connected
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                        {platform.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instance Label Chips (if any) */}
                {platformDests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {platformDests.map((inst) => (
                      <span
                        key={inst.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-main-alt)] border border-[var(--border-color)] text-[var(--text-primary)] font-medium truncate max-w-[200px]"
                        title={inst.name}
                      >
                        {inst.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Connection Status / Actions */}
                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {platformDests.length === 0
                      ? 'No active instances'
                      : `${platformDests.length} active ${platformDests.length === 1 ? 'instance' : 'instances'}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => openConnectModal(platform)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{platformDests.length > 0 ? `Manage & Add (${platformDests.length})` : `Connect ${platform.name}`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: ALERT TRIGGERS ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 px-1">
          Alert Triggers
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mb-3 px-1">
          Customize which strategic events and market updates prompt immediate notifications.
        </p>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-[var(--text-primary)]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Weekly Executive Intelligence Brief</h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Deliver executive summary on what happened, what matters, and recommended actions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyBriefs(!notifyBriefs)}
              className="rounded-md shrink-0"
              style={{
                width: 44,
                height: 24,
                background: notifyBriefs ? 'var(--accent)' : 'var(--border-color)',
                position: 'relative',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
              }}
            >
              <motion.div
                layout
                initial={false}
                animate={{ x: notifyBriefs ? 22 : 2 }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: 'white',
                  position: 'absolute',
                  top: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-[var(--text-primary)]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Critical Competitor Crises & Anomalies</h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Send immediate notifications when severe PR spikes or negative sentiment events are detected.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyCrises(!notifyCrises)}
              className="rounded-md shrink-0"
              style={{
                width: 44,
                height: 24,
                background: notifyCrises ? 'var(--accent)' : 'var(--border-color)',
                position: 'relative',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
              }}
            >
              <motion.div
                layout
                initial={false}
                animate={{ x: notifyCrises ? 22 : 2 }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: 'white',
                  position: 'absolute',
                  top: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--card-bg-alt)] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-[var(--text-primary)]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Strategic Pricing & Campaign Launches</h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Alert when competitors change pricing tiers, launch major ad blitzes, or announce partnerships.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyDeals(!notifyDeals)}
              className="rounded-md shrink-0"
              style={{
                width: 44,
                height: 24,
                background: notifyDeals ? 'var(--accent)' : 'var(--border-color)',
                position: 'relative',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
              }}
            >
              <motion.div
                layout
                initial={false}
                animate={{ x: notifyDeals ? 22 : 2 }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: 'white',
                  position: 'absolute',
                  top: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: RECENT EXECUTION HEALTH ── */}
      {latestRun && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">Last Pipeline Execution:</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {new Date(latestRun.started_at).toLocaleString()}
            </span>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                latestRun.status === 'completed'
                  ? 'border-emerald-500/30 text-emerald-400'
                  : latestRun.status === 'failed'
                  ? 'border-red-500/30 text-red-400'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {latestRun.status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span>Active Destinations:</span>
            <strong className="text-[var(--text-primary)]">{destinations.length} connected</strong>
          </div>
        </div>
      )}

      {/* ── MULTI-INSTANCE INTEGRATION MANAGEMENT MODAL ── */}
      <AnimatePresence>
        {activePlatformModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-5 max-h-[88vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
                    style={{
                      backgroundColor: activePlatformModal.bgDark,
                      borderColor: activePlatformModal.borderLight,
                    }}
                  >
                    <activePlatformModal.icon className="h-5 w-5" style={{ color: activePlatformModal.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {activePlatformModal.name} Destinations
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Manage connected instances or add new destinations
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePlatformModal(null)}
                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 1. List of Connected Instances */}
              {(() => {
                const activeDests = getPlatformDestinations(activePlatformModal.id);
                return activeDests.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        Connected Destinations ({activeDests.length})
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        Active &amp; receiving alerts
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeDests.map((dest) => {
                        const cfg = (dest.config || {}) as Record<string, unknown>;
                        const targetDisplay = (cfg.emails as string) || (cfg.channel as string) || (cfg.url as string) || 'Configured';
                        const isTestingThis = testingDestId === dest.id;

                        return (
                          <div
                            key={dest.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main-alt)] text-xs gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[var(--text-primary)] truncate">
                                {dest.name}
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
                                {targetDisplay}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleTestExistingDestination(dest.id, dest.destination_type, cfg)}
                                disabled={isTestingThis}
                                className="px-2.5 py-1 rounded-md border border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                              >
                                {isTestingThis ? 'Testing...' : 'Test'}
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteDestination(dest.id)}
                                className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Remove destination"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* 2. Add New Instance Form */}
              <div className="pt-2 border-t border-[var(--border-color)]">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another {activePlatformModal.name} Destination</span>
                </h4>

                <form onSubmit={onDestinationSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-medium mb-1.5">Destination Label</label>
                    <input
                      type="text"
                      placeholder={`e.g. ${activePlatformModal.name} Alerts`}
                      value={destName}
                      onChange={(e) => setDestName(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                    />
                  </div>

                  {activePlatformModal.id === 'email' ? (
                    <div>
                      {/* Quick Workspace Member Pills */}
                      {workspaceMembers.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] text-[var(--text-secondary)] block mb-1">
                            Quick add workspace member:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {workspaceMembers.map((m) => (
                              <button
                                key={m.user_id}
                                type="button"
                                onClick={() => {
                                  setTargetEmail((prev) => (prev ? `${prev}, ${m.email}` : m.email));
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--card-bg-alt)] hover:bg-[var(--item-hover)] text-[var(--text-primary)] transition-colors cursor-pointer"
                              >
                                + {m.email} <span className="opacity-60">({m.role})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <label className="block text-[var(--text-secondary)] font-medium mb-1.5">
                        Recipient Email Address(es)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. founder@company.com, team@company.com"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                      />
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">
                        Emails are delivered directly from <strong className="text-[var(--text-primary)]">agent@oshift.sheref.dev</strong>.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[var(--text-secondary)] font-medium mb-1.5">
                          {activePlatformModal.id === 'slack' || activePlatformModal.id === 'discord'
                            ? 'Channel Name'
                            : activePlatformModal.id === 'telegram'
                            ? 'Chat ID / Channel Handle'
                            : 'Channel / Destination Target'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            activePlatformModal.id === 'slack'
                              ? '#competitive-intel'
                              : activePlatformModal.id === 'discord'
                              ? '#market-intel'
                              : '@my_team_channel'
                          }
                          value={targetChannel}
                          onChange={(e) => setTargetChannel(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-[var(--text-secondary)] font-medium mb-1.5">
                          {activePlatformModal.name} Webhook URL
                        </label>
                        <input
                          type="url"
                          placeholder={
                            activePlatformModal.id === 'slack'
                              ? 'https://hooks.slack.com/services/...'
                              : activePlatformModal.id === 'discord'
                              ? 'https://discord.com/api/webhooks/...'
                              : 'https://api.telegram.org/bot.../sendMessage'
                          }
                          value={targetWebhookUrl}
                          onChange={(e) => setTargetWebhookUrl(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                        />
                      </div>
                    </>
                  )}

                  {activePlatformModal.id === 'webhook' && (
                    <div>
                      <label className="block text-[var(--text-secondary)] font-medium mb-1.5">
                        Secret Header (Optional)
                      </label>
                      <input
                        type="password"
                        placeholder="Optional signing secret"
                        value={targetSecret}
                        onChange={(e) => setTargetSecret(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main-alt)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
                      />
                    </div>
                  )}

                  {destModalError && <p className="text-xs text-red-400">{destModalError}</p>}
                  {testResultMsg && (
                    <p className={`text-xs ${testResultMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {testResultMsg.msg}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={handleModalTestConnection}
                      disabled={isTestingDest}
                      className="px-3.5 py-2 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      {isTestingDest ? 'Testing...' : 'Test Connection'}
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActivePlatformModal(null)}
                        className="px-4 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
                      >
                        Add Destination
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
