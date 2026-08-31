'use client';

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, RefreshCw, X } from 'lucide-react';

export interface DegradedReason {
  target?: string;
  code?: string;
  message: string;
  ref?: string;
}

export interface DegradedBannerProps {
  title?: string;
  totalRequested?: number;
  successfulCount?: number;
  failedCount?: number;
  reasons?: DegradedReason[];
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function DegradedBanner({
  title = 'Partial Data Available',
  totalRequested,
  successfulCount,
  failedCount,
  reasons = [],
  onRetry,
  onDismiss,
  className = '',
}: DegradedBannerProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const summary =
    totalRequested !== undefined && successfulCount !== undefined
      ? `${successfulCount} of ${totalRequested} data sources loaded successfully. ${failedCount ?? (totalRequested - successfulCount)} source(s) encountered temporary issues.`
      : 'Some external sources could not be reached. Partial intelligence is displayed below.';

  return (
    <div
      role="status"
      className={`flex flex-col rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-xs shadow-sm transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-300 text-xs sm:text-sm">{title}</h4>
            <p className="text-amber-200/90 text-xs mt-0.5 leading-relaxed">{summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-medium transition-colors cursor-pointer text-xs border border-amber-500/30"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-amber-500/20">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300/80 hover:text-amber-200 cursor-pointer"
          >
            {detailsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span>{detailsOpen ? 'Hide degraded source details' : `View ${reasons.length} failed source(s)`}</span>
          </button>

          {detailsOpen && (
            <div className="mt-2 space-y-1.5 pl-4">
              {reasons.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-[11px] py-0.5">
                  <span className="font-mono font-medium text-amber-300">{r.target || 'Source'}:</span>
                  <span className="text-amber-200/80 truncate flex-1">{r.message}</span>
                  {r.ref && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/30 border border-amber-500/20 text-amber-400">
                      {r.ref}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
