// frontend/src/components/ui/CustomDropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomDropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomDropdown<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside or Escape
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
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all text-left cursor-pointer outline-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-[var(--border-color)] bg-[var(--bg-main-alt)]'
            : isOpen
            ? 'border-[var(--text-primary)] bg-[var(--card-bg-alt)] text-[var(--text-primary)] shadow-sm'
            : 'border-[var(--border-color)] bg-[var(--bg-main-alt)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--card-bg-alt)]'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-[var(--text-secondary)] shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--text-primary)]' : ''
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5 shadow-2xl backdrop-blur-md"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[var(--card-bg-alt)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />}
                    <div>
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block text-[10px] text-[var(--text-secondary)] font-normal truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--text-primary)] ml-2" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
