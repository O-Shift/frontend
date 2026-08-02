// oshift/src/hooks/use-exports.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  DestinationOut,
  DestinationIn,
  ExportJob,
  ExportLogEntry,
  SlackExportIn,
  SlackExportOut,
} from '@/types/entities';

export function useExports(initialMonth?: string) {
  const currentYYYYMM = new Date().toISOString().slice(0, 7);

  const [destinations, setDestinations] = useState<DestinationOut[]>([]);
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [logs, setLogs] = useState<ExportLogEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth ?? currentYYYYMM);

  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isExportingSlack, setIsExportingSlack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch destinations
  const fetchDestinations = useCallback(async () => {
    setIsLoadingDestinations(true);
    const res = await apiFetch<DestinationOut[]>('/exports/destinations');
    if (res.ok) {
      setDestinations(res.data);
    } else {
      setError(res.error);
    }
    setIsLoadingDestinations(false);
  }, []);

  // Fetch export jobs
  const fetchJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    const res = await apiFetch<ExportJob[]>('/exports/jobs?limit=100');
    if (res.ok) {
      setJobs(res.data);
    } else {
      setError(res.error);
    }
    setIsLoadingJobs(false);
  }, []);

  // Fetch audit log entries by month (month is REQUIRED by backend endpoint)
  const fetchLogs = useCallback(async (month: string) => {
    setIsLoadingLogs(true);
    setError(null);
    const res = await apiFetch<ExportLogEntry[]>(`/exports/log?month=${month}`);
    if (res.ok) {
      setLogs(res.data);
    } else {
      setError(res.error);
    }
    setIsLoadingLogs(false);
  }, []);

  // Create export destination (admin)
  const createDestination = useCallback(async (payload: DestinationIn) => {
    setError(null);
    const res = await apiFetch<DestinationOut>('/exports/destinations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setDestinations((prev) => [res.data, ...prev]);
      return res.data;
    } else {
      setError(res.error);
      return null;
    }
  }, []);

  // Export brief to Slack
  const exportBriefToSlack = useCallback(
    async (payload: SlackExportIn) => {
      setIsExportingSlack(true);
      setError(null);
      const res = await apiFetch<SlackExportOut>('/exports/slack', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchJobs(); // Refresh jobs list
        setIsExportingSlack(false);
        return res.data;
      } else {
        setError(res.error);
        setIsExportingSlack(false);
        return null;
      }
    },
    [fetchJobs]
  );

  // Initial load
  useEffect(() => {
    fetchDestinations();
    fetchJobs();
    fetchLogs(selectedMonth);
  }, [fetchDestinations, fetchJobs, fetchLogs, selectedMonth]);

  return {
    destinations,
    jobs,
    logs,
    selectedMonth,
    setSelectedMonth: (month: string) => {
      setSelectedMonth(month);
      fetchLogs(month);
    },
    isLoadingDestinations,
    isLoadingJobs,
    isLoadingLogs,
    isExportingSlack,
    error,
    createDestination,
    exportBriefToSlack,
    refreshDestinations: fetchDestinations,
    refreshJobs: fetchJobs,
    refreshLogs: () => fetchLogs(selectedMonth),
  };
}
