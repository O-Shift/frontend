'use client';

import { useEffect, useState } from 'react';
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ToolStep } from '@/hooks/use-agent-chat';

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return <span className="tabular-nums font-mono text-[11px] opacity-75">{seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`}</span>;
}

export default function AgentProgress({
  isThinking = false,
  activeTool = null,
  steps = [],
  startedAt = null,
  isLive = false,
}: {
  isThinking?: boolean;
  activeTool?: string | null;
  steps?: ToolStep[];
  startedAt?: number | null;
  isLive?: boolean;
}) {
  // Default to expanded during live turn so user sees progress. When complete, allow collapse/expand.
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
  const expanded = userExpanded ?? isLive;

  if (!isThinking && !activeTool && steps.length === 0) return null;

  const doneCount = steps.filter((step) => step.done).length;
  const isRunning = isLive || isThinking || !!activeTool;

  const currentLabel = activeTool
    ? activeTool.replace(/\.\.\.$/, '')
    : isThinking
      ? 'Reasoning over market signals...'
      : `${doneCount} action${doneCount === 1 ? '' : 's'} completed`;

  return (
    <div className="agent-activity-inline my-2.5">
      {/* Seamless collapsible trigger */}
      <button
        type="button"
        onClick={() => setUserExpanded(!expanded)}
        className="group flex items-center gap-2 py-1 text-left text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus:outline-none"
        aria-expanded={expanded}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
          ) : (
            <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
          )}
        </span>

        <span className="font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
          {currentLabel}
        </span>

        {startedAt !== null && isRunning && (
          <span className="ml-1 text-[var(--text-secondary)]">
            · <Elapsed since={startedAt} />
          </span>
        )}

        <span className="ml-1 text-[var(--text-secondary)] opacity-70 group-hover:opacity-100">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
      </button>

      {/* Seamless expandable details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="relative ml-2 mt-1.5 space-y-1.5 border-l border-[var(--border-color)] pl-3.5 py-1">
              {steps.map((step, index) => (
                <div
                  key={step.id || index}
                  className="flex items-center gap-2 text-[12.5px] leading-tight text-[var(--text-secondary)]"
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    {step.done ? (
                      <Check className="h-3 w-3 text-[var(--color-success)]" />
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin text-[var(--accent)]" />
                    )}
                  </span>
                  <span className={step.done ? 'text-[var(--text-secondary)]' : 'font-medium text-[var(--text-primary)]'}>
                    {step.label}
                  </span>
                </div>
              ))}

              {isThinking && !activeTool && (
                <div className="flex items-center gap-2 text-[12.5px] leading-tight text-[var(--text-primary)]">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--accent)]" />
                  </span>
                  <Brain className="h-3 w-3 text-[var(--text-secondary)]" />
                  <span>Synthesizing findings into response</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
