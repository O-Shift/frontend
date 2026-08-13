'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowUp,
  AtSign,
  Building2,
  Megaphone,
  Network,
  Paperclip,
  Search,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch, fetchCampaigns, fetchOpportunities, type Campaign } from '@/lib/api';
import { logoUrl } from '@/lib/logos';
import type { ChatContextItem, ChatContextKind } from '@/lib/utils/chat-context';

interface CompetitorRecord {
  id: string;
  name: string;
  website?: string;
}

interface PartnershipResponse {
  nodes: Array<{ id: string; name: string; entity_type: string }>;
}

const kindMeta: Record<ChatContextKind, { label: string; icon: typeof Sparkles }> = {
  competitor: { label: 'Competitors', icon: Building2 },
  campaign: { label: 'Campaigns', icon: Megaphone },
  opportunity: { label: 'Opportunities', icon: Sparkles },
  partnership: { label: 'Partnerships', icon: Network },
};

function contextKey(item: ChatContextItem) {
  return `${item.kind}:${item.id}`;
}

function ContextItemLogo({ item }: { item: ChatContextItem }) {
  const [error, setError] = useState(false);
  const Icon = kindMeta[item.kind]?.icon || Sparkles;

  if (item.logo && !error) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] overflow-hidden p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.logo}
          alt=""
          className="h-full w-full object-contain rounded"
          onError={() => setError(true)}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
      <Icon className="h-4 w-4" />
    </span>
  );
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  context,
  onContextChange,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  context: ChatContextItem[];
  onContextChange: (items: ChatContextItem[]) => void;
  autoFocus?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ChatContextItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadItems = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    const [competitors, campaigns, opportunities, partnerships] = await Promise.all([
      apiFetch<CompetitorRecord[]>('/competitors'),
      fetchCampaigns({ limit: 100 }),
      fetchOpportunities({ limit: 100 }),
      apiFetch<PartnershipResponse>('/graph/partnerships'),
    ]);

    const competitorMap = new Map<string, string>();
    const next: ChatContextItem[] = [];

    if (competitors.ok) {
      for (const comp of competitors.data) {
        if (comp.id && comp.website) {
          competitorMap.set(comp.id, comp.website);
        }
      }
      next.push(
        ...competitors.data.map((item) => ({
          id: item.id,
          kind: 'competitor' as const,
          label: item.name,
          subtitle: item.website,
          logo: logoUrl(item.website) ?? undefined,
        }))
      );
    }

    if (campaigns.ok) {
      next.push(
        ...campaigns.data.map((item: Campaign) => {
          const compWebsite = item.competitor_id ? competitorMap.get(item.competitor_id) : undefined;
          return {
            id: item.id,
            kind: 'campaign' as const,
            label: item.title,
            subtitle: item.description || 'Detected campaign',
            logo: (compWebsite ? logoUrl(compWebsite) : undefined) ?? undefined,
          };
        })
      );
    }

    if (opportunities.ok) {
      next.push(
        ...opportunities.data.items.map((item) => ({
          id: item.id,
          kind: 'opportunity' as const,
          label: item.title,
          subtitle: `${item.impact} impact · ${item.status.replaceAll('_', ' ')}`,
        }))
      );
    }

    if (partnerships.ok) {
      next.push(
        ...partnerships.data.nodes.map((item) => ({
          id: item.id,
          kind: 'partnership' as const,
          label: item.name,
          subtitle: item.entity_type.replaceAll('_', ' '),
          logo: logoUrl(item.name) ?? undefined,
        }))
      );
    }

    setItems(next);
    setLoaded(true);
    setLoading(false);
  }, [loaded, loading]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const openPicker = () => {
    setPickerOpen(true);
    void loadItems();
  };

  const handleValueChange = (next: string) => {
    onChange(next);
    const lastToken = next.slice(0, textareaRef.current?.selectionStart ?? next.length).split(/\s/).at(-1);
    if (lastToken?.startsWith('@')) {
      setQuery(lastToken.slice(1));
      openPicker();
    }
  };

  const addContext = (item: ChatContextItem) => {
    if (!context.some((current) => contextKey(current) === contextKey(item))) {
      onContextChange([...context, item]);
    }
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor).replace(/@[^\s@]*$/, '');
    const after = value.slice(cursor);
    onChange(`${before}${after}`.replace(/\s{2,}/g, ' '));
    setPickerOpen(false);
    setQuery('');
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const selectedKeys = useMemo(() => new Set(context.map(contextKey)), [context]);
  const filtered = useMemo(() => {
    const normal = query.trim().toLowerCase();
    return items
      .filter((item) => !selectedKeys.has(contextKey(item)))
      .filter((item) => !normal || `${item.label} ${item.subtitle ?? ''} ${item.kind}`.toLowerCase().includes(normal))
      .slice(0, 16);
  }, [items, query, selectedKeys]);

  return (
    <div ref={rootRef} className="relative w-full">
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[calc(100%+12px)] left-0 z-40 w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[color:var(--dropdown-bg)] shadow-2xl shadow-black/35"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-3">
              <Search className="h-4 w-4 text-[var(--text-secondary)]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search workspace context…"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
              />
              <span className="rounded-md border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">ESC</span>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {loading ? (
                <div className="px-3 py-8 text-center text-xs text-[var(--text-secondary)]">Loading workspace context…</div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-[var(--text-secondary)]">No matching context found.</div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={contextKey(item)}
                    type="button"
                    onClick={() => addContext(item)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--item-hover)]"
                  >
                    <ContextItemLogo item={item} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                      <span className="block truncate text-[11px] capitalize text-[var(--text-secondary)]">
                        {kindMeta[item.kind].label.slice(0, -1)}{item.subtitle ? ` · ${item.subtitle}` : ''}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chat-composer-shell">
        {context.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3.5 pt-3">
            {context.map((item) => {
              const Icon = kindMeta[item.kind].icon;
              return (
                <motion.span
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={contextKey(item)}
                  className="flex max-w-[260px] items-center gap-1.5 rounded-full border border-[var(--context-chip-border)] bg-[var(--context-chip-bg)] px-3 py-1 text-xs text-[var(--text-primary)]"
                >
                  {item.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logo} alt="" className="h-3.5 w-3.5 rounded object-contain shrink-0" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                  )}
                  <span className="truncate">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => onContextChange(context.filter((current) => contextKey(current) !== contextKey(item)))}
                    className="ml-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    aria-label={`Remove ${item.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.span>
              );
            })}
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => handleValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setPickerOpen(false);
            if (event.key === 'Enter' && !event.shiftKey && !pickerOpen) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask about your market…"
          className="max-h-52 min-h-16 w-full resize-none bg-transparent px-4.5 pb-2.5 pt-4 text-[16px] leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
          style={{ fieldSizing: 'content' } as CSSProperties}
        />

        <div className="flex items-center justify-between px-3.5 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openPicker}
              className="chat-composer-inline-btn"
              aria-label="Attach workspace context"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attach Context</span>
            </button>
            <button
              type="button"
              onClick={openPicker}
              className="chat-composer-inline-btn"
              aria-label="Mention workspace entity"
            >
              <AtSign className="h-3.5 w-3.5" />
              <span>Mention</span>
            </button>
          </div>
          {isStreaming ? (
            <button type="button" onClick={onStop} className="chat-send-button" aria-label="Stop response">
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!value.trim()}
              className="chat-send-button"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">
        Use <span className="font-medium text-[var(--text-primary)]">@</span> to reference workspace entities · Enter to send
      </p>
    </div>
  );
}
