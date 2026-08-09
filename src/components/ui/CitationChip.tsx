'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { hostLabel } from '@/lib/utils/citations';

interface CitationChipProps {
  index: number;
  url: string;
  label: string;
}

/**
 * A citation rendered as a small superscript marker rather than inline prose.
 *
 * The claim stays readable at a glance and the source is one hover or click
 * away. Hover shows where it goes before the user commits to leaving the page;
 * the anchor stays a real link so middle-click, copy-link and keyboard focus
 * all behave normally.
 */
export default function CitationChip({ index, url, label }: CitationChipProps) {
  const [open, setOpen] = useState(false);
  const host = hostLabel(url);

  return (
    <span
      className="relative inline-block align-super"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Source ${index}: ${label} (${host})`}
        className="mx-0.5 inline-flex min-w-[1.1em] items-center justify-center rounded-[4px] border border-[var(--border-color)] bg-[var(--card-bg-alt)] px-1 text-[10px] font-medium leading-[1.4] text-[var(--text-secondary)] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        {index}
      </a>

      {open ? (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[min(20rem,70vw)] -translate-x-1/2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-2.5 py-1.5 text-left align-baseline shadow-lg"
        >
          <span className="block text-[11px] font-medium leading-snug text-[var(--text-primary)]">
            {label}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[10px] leading-snug text-[var(--text-secondary)]">
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
            {/* The host, not the full URL: it is what tells the user whether
                the claim is sourced from the competitor or from a third party,
                and a long path would push the tooltip off-screen. */}
            <span className="truncate">{host}</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
