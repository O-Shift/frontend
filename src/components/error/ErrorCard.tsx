'use client';

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, ChevronDown, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export interface ErrorCardProps {
  error?: Error | null;
  errorRef?: string;
  title?: string;
  message?: string;
  variant?: 'widget' | 'panel' | 'page';
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorCard({
  error,
  errorRef,
  title,
  message,
  variant = 'panel',
  onRetry,
  showHomeButton = false,
}: ErrorCardProps) {
  const [copied, setCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const displayRef = errorRef || (error as { ref?: string })?.ref || 'ERR-UNKNOWN';
  const displayTitle = title || 'Unable to load content';
  const displayMessage = message || error?.message || 'A temporary issue prevented this content from loading.';

  const handleCopyRef = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(displayRef);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore if clipboard API unavailable
    }
  };

  if (variant === 'widget') {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center rounded-xl border border-red-500/20 bg-red-500/5 min-h-[140px] h-full w-full">
        <div className="flex items-center gap-2 mb-2 text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold">{displayTitle}</span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mb-3 line-clamp-2 max-w-[260px]">
          {displayMessage}
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {displayRef && displayRef !== 'ERR-UNKNOWN' && (
            <button
              type="button"
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/30 border border-red-500/20 text-red-300 hover:bg-black/50 transition-colors cursor-pointer"
              title="Copy error reference ID"
            >
              <span>{displayRef}</span>
              {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5 opacity-60" />}
            </button>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-red-500/20 bg-[var(--card-bg)] shadow-lg ${
        variant === 'page' ? 'max-w-xl mx-auto my-12 p-8' : 'w-full p-6'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
        {displayTitle}
      </h3>

      <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4 max-w-md leading-relaxed">
        {displayMessage}
      </p>

      {displayRef && displayRef !== 'ERR-UNKNOWN' && (
        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-lg bg-black/20 border border-[var(--border-color)]">
          <span className="text-[11px] text-[var(--text-secondary)]">Reference ID:</span>
          <span className="text-xs font-mono font-semibold text-red-400">{displayRef}</span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="p-1 rounded hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Copy Reference ID to clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        )}

        {showHomeButton && (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        )}
      </div>

      {error && process.env.NODE_ENV !== 'production' && (
        <div className="w-full mt-6 text-left border-t border-[var(--border-color)] pt-4">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            {detailsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span>Technical details (Development mode)</span>
          </button>

          {detailsOpen && (
            <div className="mt-2 p-3 rounded-lg bg-black/40 border border-[var(--border-color)] overflow-x-auto">
              <p className="text-[11px] font-mono text-red-400 font-semibold mb-1">
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="text-[10px] font-mono text-[var(--text-secondary)] whitespace-pre-wrap leading-tight">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
