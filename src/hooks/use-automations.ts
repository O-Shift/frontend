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
    const res = await apiFetch<AutomationRun[]>('/automation/runs?limit=100');
    if (res.ok) {
      setRuns(res.data);
    } else {
      setError(res.error);
    }
    setIsLoadingRuns(false);
  }, []);

  // Fetch automation schedules
  const fetchSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    const res = await apiFetch<AutomationSchedule[]>('/automation/schedules');
    if (res.ok) {
      setSchedules(res.data);
    } else {
      setError(res.error);
    }
    setIsLoadingSchedules(false);
  }, []);

  // Fetch step timing for a specific run
  const fetchSteps = useCallback(async (runId: string) => {
    setSelectedRunId(runId);
    setIsLoadingSteps(true);
    const res = await apiFetch<AutomationStep[]>(`/automation/runs/${runId}/steps`);
    if (res.ok) {
      setSelectedRunSteps(res.data);
    } else {
      setError(res.error);
    }
    setIsLoadingSteps(false);
  }, []);

  // Trigger manual 12-step pipeline
  const triggerPipeline = useCallback(async (workflowType = 'oshift-pipeline-v1') => {
    setIsTriggering(true);
    setError(null);
    const res = await apiFetch<TriggerResponse>('/automation/trigger', {
      method: 'POST',
      body: JSON.stringify({ workflow_type: workflowType }),
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
        setSchedules((prev) => [res.data, ...prev]);
        return res.data;
      } else {
        setError(res.error);
        return null;
      }
    },
    []
  );

  // Update schedule
  const updateSchedule = useCallback(
    async (id: string, payload: ScheduleUpdate) => {
      setError(null);
      const res = await apiFetch<AutomationSchedule>(`/automation/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSchedules((prev) => prev.map((s) => (s.id === id ? res.data : s)));
        return res.data;
      } else {
        setError(res.error);
        return null;
      }
    },
    []
  );

  // Auto-polling when any run is in 'running' state
  useEffect(() => {
    const hasRunning = runs.some((r) => r.status === 'running');
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
    refreshRuns: fetchRuns,
    refreshSchedules: fetchSchedules,
  };
}
