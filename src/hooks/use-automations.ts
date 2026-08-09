// oshift/src/hooks/use-automations.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import {
  AutomationRun,
  AutomationStep,
  AutomationSchedule,
  TriggerResponse,
  ScheduleCreate,
  ScheduleUpdate,
} from '@/types/entities';

export interface TriggerPipelineOptions {
  workflowType?: string;
  verbose?: boolean;
  chain?: string[];
}

export function useAutomations() {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);
  const [selectedRunSteps, setSelectedRunSteps] = useState<AutomationStep[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch automation runs
  const fetchRuns = useCallback(async () => {
    setIsLoadingRuns(true);
    const res = await apiFetch<AutomationRun[] | { runs: AutomationRun[] }>('/automation/runs?limit=100');
    if (res.ok) {
      const runList = Array.isArray(res.data) ? res.data : res.data?.runs || [];
      setRuns(runList);
    } else {
      setError(res.error);
    }
    setIsLoadingRuns(false);
  }, []);

  // Fetch automation schedules
  const fetchSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    const res = await apiFetch<AutomationSchedule[] | { schedules: AutomationSchedule[] }>('/automation/schedules');
    if (res.ok) {
      const scheduleList = Array.isArray(res.data) ? res.data : res.data?.schedules || [];
      setSchedules(scheduleList);
    } else {
      setError(res.error);
    }
    setIsLoadingSchedules(false);
  }, []);

  // Fetch step timing for a specific run
  const fetchSteps = useCallback(async (runId: string) => {
    setSelectedRunId(runId);
    setIsLoadingSteps(true);
    const res = await apiFetch<AutomationStep[] | { run_id: string; steps: AutomationStep[] }>(`/automation/runs/${runId}/steps`);
    if (res.ok) {
      const stepList = Array.isArray(res.data) ? res.data : res.data?.steps || [];
      setSelectedRunSteps(stepList);
    } else {
      setError(res.error);
    }
    setIsLoadingSteps(false);
  }, []);

  // Trigger manual pipeline
  const triggerPipeline = useCallback(async (options: TriggerPipelineOptions = {}) => {
    const { workflowType = 'oshift-pipeline-v1', verbose = false, chain = [] } = options;
    setIsTriggering(true);
    setError(null);
    const res = await apiFetch<TriggerResponse>('/automation/trigger', {
      method: 'POST',
      body: JSON.stringify({
        workflow_type: workflowType,
        verbose: verbose,
        chain: chain,
      }),
    });

    if (res.ok) {
      await fetchRuns(); // Refresh runs list immediately
      setIsTriggering(false);
      return res.data;
    } else {
      setError(res.error);
      setIsTriggering(false);
      return null;
    }
  }, [fetchRuns]);

  // Create a new cron schedule
  const createSchedule = useCallback(
    async (payload: ScheduleCreate) => {
      setError(null);
      const res = await apiFetch<AutomationSchedule>('/automation/schedules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSchedules();
        return res.data;
      } else {
        setError(res.error);
        return null;
      }
    },
    [fetchSchedules]
  );

  // Update schedule (Optimistic Hopeful Toggle)
  const updateSchedule = useCallback(
    async (id: string, payload: ScheduleUpdate) => {
      setError(null);
      // Instantly reflect state change in UI
      setSchedules((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          return {
            ...s,
            name: payload.name ?? s.name,
            cron_expr: payload.cron_expr ?? s.cron_expr,
            is_active: payload.is_active ?? s.is_active,
          };
        })
      );
      const res = await apiFetch<AutomationSchedule>(`/automation/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSchedules();
        return res.data;
      } else {
        setError(res.error);
        await fetchSchedules(); // Revert on error
        return null;
      }
    },
    [fetchSchedules]
  );

  // Delete schedule (Optimistic Delete)
  const deleteSchedule = useCallback(
    async (id: string) => {
      setError(null);
      // Instantly remove from UI
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      const res = await apiFetch(`/automation/schedules/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setError(res.error);
        await fetchSchedules(); // Revert on error
      }
    },
    [fetchSchedules]
  );

  // Auto-polling when any run is in 'running' state
  useEffect(() => {
    const hasRunning = Array.isArray(runs) && runs.some((r) => r.status === 'running');
    if (hasRunning) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => {
          fetchRuns();
          if (selectedRunId) {
            fetchSteps(selectedRunId);
          }
        }, 5000);
      }
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [runs, selectedRunId, fetchRuns, fetchSteps]);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRuns();
    fetchSchedules();
  }, [fetchRuns, fetchSchedules]);

  return {
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
    refreshRuns: fetchRuns,
    refreshSchedules: fetchSchedules,
  };
}
