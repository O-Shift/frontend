// frontend/src/components/ui/CalendarGridDropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DAYS_OF_WEEK } from '@/utils/cron';

interface CalendarGridDropdownProps {
  mode: 'weekly' | 'monthly';
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

function getOrdinalSuffix(dayNum: number): string {
  if (dayNum === 1 || dayNum === 21) return 'st';
  if (dayNum === 2 || dayNum === 22) return 'nd';
  if (dayNum === 3 || dayNum === 23) return 'rd';
  return 'th';
}

export default function CalendarGridDropdown({
  mode,
  value,
  onChange,
  label,
  className = '',
}: CalendarGridDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Display label on trigger
  const selectedWeeklyDay = DAYS_OF_WEEK.find((d) => d.id === value);
  const dayNumVal = parseInt(value, 10) || 1;
  const triggerLabel =
    mode === 'weekly'
      ? selectedWeeklyDay
        ? `Every ${selectedWeeklyDay.label}`
        : 'Select Day'
      : `${value}${getOrdinalSuffix(dayNumVal)} day of the month`;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all text-left cursor-pointer outline-none ${
          isOpen
            ? 'border-[var(--text-primary)] bg-[var(--card-bg-alt)] text-[var(--text-primary)] shadow-sm'
            : 'border-[var(--border-color)] bg-[var(--bg-main-alt)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--card-bg-alt)]'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Calendar className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
          <span className="truncate">{triggerLabel}</span>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-[var(--text-secondary)] shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--text-primary)]' : ''
          }`}
        />
      </button>

      {/* Animated Popover with Custom Tiny Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 mt-1.5 w-full min-w-[280px] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-2xl backdrop-blur-md"
          >
            {mode === 'weekly' ? (
              /* Weekly Day Grid */
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Select Day of the Week
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">Recurring</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = value === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          onChange(d.id);
                          setIsOpen(false);
                        }}
                        className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--card-bg)] font-bold shadow-xs'
                            : 'border border-[var(--border-color)] bg-[var(--bg-main-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)]'
                        }`}
                        title={d.label}
                      >
                        {d.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Monthly 1-28 Tiny Calendar Grid */
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Select Day of the Month
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--card-bg-alt)] border border-[var(--border-color)] px-2 py-0.5 rounded">
                    {value}{getOrdinalSuffix(dayNumVal)} day
                  </span>
                </div>

                {/* 1-28 Number Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }, (_, i) => (i + 1).toString()).map((dayNum) => {
                    const isSelected = value === dayNum;
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => {
                          onChange(dayNum);
                          setIsOpen(false);
                        }}
                        className={`h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--card-bg)] font-bold shadow-xs'
                            : 'border border-[var(--border-color)] bg-[var(--bg-main-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--item-hover)]'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
