// oshift/src/components/LogPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, ChevronDown, ChevronRight, Terminal, Activity } from 'lucide-react';

export interface LogEntry {
  id: string;
  type: 'api' | 'sse' | 'system';
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  timestamp: string;
  summary: string;
  details?: unknown;
}

// Global log bus listener for apiFetch and sseStream
type LogListener = (entry: LogEntry) => void;
const listeners = new Set<LogListener>();

export function emitLog(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
  const fullEntry: LogEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toLocaleTimeString(),
  };
  listeners.forEach((fn) => fn(fullEntry));
}

export default function LogPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'api' | 'sse'>('all');

  // Toggle with Cmd+L or Ctrl+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for emitted log events
  useEffect(() => {
    const listener: LogListener = (entry) => {
      setLogs((prev) => [entry, ...prev.slice(0, 199)]); // Keep last 200 logs
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const filteredLogs = logs.filter((log) => filterType === 'all' || log.type === filterType);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-lg transition hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
        title="Toggle Activity Log Panel (Cmd+L / Ctrl+L)"
      >
        <Terminal className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span>Log Panel</span>
        <kbd className="rounded border border-[var(--border)] bg-[var(--bg-main)] px-1 py-0.5 text-[10px] text-[var(--text-secondary)]">
          ⌘L
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--bg-main)] shadow-2xl transition-all font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-semibold text-sm text-[var(--text-primary)]">System Activity Log</span>
          <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
            {filteredLogs.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogs([])}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]"
            title="Clear Log"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]"
            title="Close Panel (Cmd+L)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-[#border] border-b border-[var(--border)] bg-[var(--bg-main-alt)] px-4 py-1.5 gap-2 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`rounded px-2.5 py-1 font-medium ${
            filterType === 'all'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All ({logs.length})
        </button>
        <button
          onClick={() => setFilterType('api')}
          className={`rounded px-2.5 py-1 font-medium ${
            filterType === 'api'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          API ({logs.filter((l) => l.type === 'api').length})
        </button>
        <button
          onClick={() => setFilterType('sse')}
          className={`rounded px-2.5 py-1 font-medium ${
            filterType === 'sse'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          SSE ({logs.filter((l) => l.type === 'sse').length})
        </button>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
            <Terminal className="h-8 w-8 stroke-1 mb-2 opacity-40" />
            <p>No activity logged yet</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isError = log.status ? log.status >= 400 : log.summary.includes('error');
            return (
              <div
                key={log.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2.5 transition"
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="flex cursor-pointer items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {log.details ? (
                      isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
                      )
                    ) : (
                      <span className="w-3.5" />
                    )}

                    {log.method && (
                      <span className="font-mono font-bold uppercase text-[var(--accent)]">
                        {log.method}
                      </span>
                    )}

                    <span className="truncate font-mono text-[var(--text-primary)]" title={log.summary}>
                      {log.summary}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {log.status && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                          isError
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-secondary)]">{log.timestamp}</span>
                  </div>
                </div>

                {isExpanded && Boolean(log.details) && (
                  <div className="mt-2 rounded bg-[var(--bg-main)] p-2 border border-[var(--border)] overflow-x-auto">
                    <pre className="text-[10px] font-mono text-[var(--text-secondary)] whitespace-pre-wrap">
                      {typeof log.details === 'string'
                        ? log.details
                        : JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
