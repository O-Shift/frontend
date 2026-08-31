'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, Copy, Check } from 'lucide-react';
import { useToast, type ToastItem } from '@/lib/toast';
import { useMounted } from '@/hooks/use-mounted';

function ToastCard({ toastItem }: { toastItem: ToastItem }) {
  const { dismiss } = useToast();
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || toastItem.duration <= 0) return;
    const timer = setTimeout(() => {
      dismiss(toastItem.id);
    }, toastItem.duration);
    return () => clearTimeout(timer);
  }, [toastItem.id, toastItem.duration, toastItem.timestamp, isPaused, dismiss]);

  const handleCopyRef = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!toastItem.ref) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(toastItem.ref);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const getIcon = () => {
    switch (toastItem.type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = () => {
    switch (toastItem.type) {
      case 'error':
        return 'border-red-500/30 bg-[#1a1215] text-red-100';
      case 'warning':
        return 'border-amber-500/30 bg-[#1c1812] text-amber-100';
      case 'success':
        return 'border-emerald-500/30 bg-[#121c15] text-emerald-100';
      case 'info':
      default:
        return 'border-blue-500/30 bg-[#12161c] text-blue-100';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md max-w-sm w-full pointer-events-auto ${getBorderColor()}`}
    >
      {getIcon()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {toastItem.title && (
            <h5 className="text-xs font-semibold">{toastItem.title}</h5>
          )}
          {toastItem.count > 1 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white">
              {toastItem.count}x
            </span>
          )}
        </div>

        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed break-words">
          {toastItem.message}
        </p>

        {toastItem.ref && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 border border-white/10 hover:bg-black/60 transition-colors cursor-pointer"
              title="Copy reference ID"
            >
              <span>{toastItem.ref}</span>
              {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5 opacity-60" />}
            </button>
          </div>
        )}

        {toastItem.action && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                toastItem.action?.onClick();
                dismiss(toastItem.id);
              }}
              className="text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              {toastItem.action.label}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => dismiss(toastItem.id)}
        className="text-zinc-400 hover:text-white transition-colors p-0.5 rounded cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastProvider() {
  const { toasts } = useToast();
  const mounted = useMounted();

  if (!mounted) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} toastItem={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
