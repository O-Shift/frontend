'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Network,
  Search,
  Sparkles,
  Loader2,
  AtSign,
  Lightbulb,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatContextItem, ChatContextKind } from '@/lib/utils/chat-context';

export interface MentionEntity {
  id: string;
  name: string;
  kind: 'competitor' | 'self';
  logo?: string;
  typeLabel: string;
  campaigns: ChatContextItem[];
  opportunities: ChatContextItem[];
  partnerships: ChatContextItem[];
}

export interface CompetitorRecord {
  id: string;
  name: string;
  website?: string;
  domain?: string;
}

export interface PartnershipResponse {
  nodes: Array<{ id: string; name: string; entity_type: string }>;
}

export function contextKey(item: ChatContextItem): string {
  return `${item.kind}:${item.id}`;
}

export function EntityLogo({
  name,
  logo,
  kind = 'competitor',
}: {
  name: string;
  logo?: string;
  kind?: 'competitor' | 'self' | ChatContextKind;
}) {
  const [error, setError] = useState(false);
  const isSelf = kind === 'self';

  if (logo && !error) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden p-1 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          className="h-full w-full object-contain rounded-lg"
          onError={() => setError(true)}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/60 shadow-sm">
      {isSelf ? (
        <Sparkles className="h-4.5 w-4.5 text-[var(--accent)]" strokeWidth={1.75} />
      ) : (
        <Building2 className="h-4.5 w-4.5 text-white/70" strokeWidth={1.75} />
      )}
    </span>
  );
}

export function SubItemIcon({ item }: { item: ChatContextItem }) {
  const [error, setError] = useState(false);

  if (item.logo && !error) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden p-0.5 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.logo}
          alt=""
          className="h-full w-full object-contain rounded-md"
          onError={() => setError(true)}
          loading="lazy"
        />
      </span>
    );
  }

  if (item.kind === 'campaign') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,90,0,0.22)] bg-[rgba(255,90,0,0.08)] text-[var(--accent)] shadow-sm">
        <Megaphone className="h-4 w-4" strokeWidth={1.75} />
      </span>
    );
  }

  if (item.kind === 'opportunity') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400 shadow-sm">
        <Lightbulb className="h-4 w-4" strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 shadow-sm">
      <Sparkles className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
    </span>
  );
}

export interface MentionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ChatContextItem) => void;
  query: string;
  onQueryChange: (query: string) => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  entities: MentionEntity[];
  loading: boolean;
  activeEntityId: string | null;
  onActiveEntityIdChange: (id: string | null) => void;
  className?: string;
}

export default function MentionPicker({
  isOpen,
  onClose,
  onSelect,
  query,
  onQueryChange,
  selectedIndex,
  onSelectedIndexChange,
  entities,
  loading,
  activeEntityId,
  onActiveEntityIdChange,
  className = '',
}: MentionPickerProps) {
  const activeEntity = useMemo(
    () => entities.find((e) => e.id === activeEntityId) || null,
    [entities, activeEntityId]
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Focus search input on open or view change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeEntityId]);

  // Root view: list of entities
  const filteredEntities = useMemo(() => {
    if (activeEntity) return [];
    const normal = query.trim().toLowerCase();
    if (!normal) return entities;
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(normal) ||
        e.typeLabel.toLowerCase().includes(normal) ||
        e.campaigns.some((c) => c.label.toLowerCase().includes(normal)) ||
        e.opportunities.some((o) => o.label.toLowerCase().includes(normal))
    );
  }, [entities, activeEntity, query]);

  // Sub-list items when drilled down into activeEntity
  const subListItems = useMemo<ChatContextItem[]>(() => {
    if (!activeEntity) return [];

    const items: ChatContextItem[] = [];
    const normal = query.trim().toLowerCase();

    // 1. Action to mention entire entity
    const entityContextItem: ChatContextItem = {
      id: activeEntity.id,
      kind: 'competitor',
      label: activeEntity.name,
      subtitle: activeEntity.typeLabel,
      logo: activeEntity.logo,
    };

    if (!normal || activeEntity.name.toLowerCase().includes(normal)) {
      items.push(entityContextItem);
    }

    // 2. Entity's campaigns
    for (const c of activeEntity.campaigns) {
      if (
        !normal ||
        c.label.toLowerCase().includes(normal) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(normal))
      ) {
        items.push(c);
      }
    }

    // 3. Entity's opportunities (only for self entity)
    for (const o of activeEntity.opportunities) {
      if (
        !normal ||
        o.label.toLowerCase().includes(normal) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(normal))
      ) {
        items.push(o);
      }
    }

    // 4. Entity's partnerships
    for (const p of activeEntity.partnerships) {
      if (!normal || p.label.toLowerCase().includes(normal)) {
        items.push(p);
      }
    }

    return items;
  }, [activeEntity, query]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!itemsContainerRef.current) return;
    const selectedEl = itemsContainerRef.current.querySelector(
      '.mention-picker-item.selected'
    ) as HTMLElement | null;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, activeEntityId]);

  const handleDrillDown = useCallback(
    (entity: MentionEntity, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      onActiveEntityIdChange(entity.id);
      onQueryChange('');
      onSelectedIndexChange(0);
    },
    [onActiveEntityIdChange, onQueryChange, onSelectedIndexChange]
  );

  const handleBackToRoot = useCallback(() => {
    const lastId = activeEntityId;
    onActiveEntityIdChange(null);
    onQueryChange('');
    const idx = entities.findIndex((e) => e.id === lastId);
    onSelectedIndexChange(idx >= 0 ? idx : 0);
  }, [activeEntityId, entities, onActiveEntityIdChange, onQueryChange, onSelectedIndexChange]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (activeEntity) {
      // SUB-LIST VIEW
      const count = subListItems.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (count > 0) onSelectedIndexChange((selectedIndex + 1) % count);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (count > 0) onSelectedIndexChange((selectedIndex - 1 + count) % count);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBackToRoot();
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const target = subListItems[selectedIndex];
        if (target) {
          onSelect(target);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBackToRoot();
        return;
      }
    } else {
      // ROOT ENTITIES VIEW
      const count = filteredEntities.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (count > 0) onSelectedIndexChange((selectedIndex + 1) % count);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (count > 0) onSelectedIndexChange((selectedIndex - 1 + count) % count);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const target = filteredEntities[selectedIndex];
        if (target) {
          handleDrillDown(target);
        }
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const target = filteredEntities[selectedIndex];
        if (target) {
          onSelect({
            id: target.id,
            kind: 'competitor',
            label: target.name,
            logo: target.logo,
            subtitle: target.typeLabel,
          });
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`mention-picker-popover ${className}`}
    >
      {/* Top Navigation Header for Drill-Down */}
      {activeEntity ? (
        <div className="mention-picker-header">
          <button
            type="button"
            title="Back to all entities (or press ←)"
            aria-label="Back to all entities"
            onClick={handleBackToRoot}
            className="mention-picker-back-btn"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1">
            <EntityLogo name={activeEntity.name} logo={activeEntity.logo} kind={activeEntity.kind} />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white/95 tracking-[-0.01em]">
                {activeEntity.name}
              </span>
              <span className="block truncate text-[11px] text-white/45">
                {activeEntity.typeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/45 uppercase tracking-wider">
              ← BACK
            </span>
          </div>
        </div>
      ) : null}

      {/* Search Input Bar */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3 bg-white/[0.01]">
        <Search className="h-4 w-4 text-white/40 shrink-0" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            onSelectedIndexChange(0);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={
            activeEntity
              ? `Search ${activeEntity.name} context…`
              : 'Search workspace entities… (press → to explore)'
          }
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white/90 outline-none placeholder:text-white/35 tracking-[-0.01em]"
        />
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">
          ESC
        </span>
      </div>

      {/* Main List Area */}
      <div
        ref={itemsContainerRef}
        className="mention-picker-scroll-area max-h-80 overflow-y-auto p-2"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-8 text-xs text-white/40">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            <span>Loading workspace entities…</span>
          </div>
        ) : activeEntity ? (
          /* DRILL-DOWN SUB-LIST VIEW */
          subListItems.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-white/40">
              No matching campaigns found for {activeEntity.name}.
            </div>
          ) : (
            <div className="space-y-1">
              {subListItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isEntireEntityAction =
                  item.id === activeEntity.id && item.kind === 'competitor';

                return (
                  <button
                    key={contextKey(item)}
                    type="button"
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onSelectedIndexChange(idx)}
                    className={`mention-picker-item group ${isSelected ? 'selected' : ''}`}
                  >
                    {isEntireEntityAction ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 shadow-sm">
                        <AtSign className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                    ) : (
                      <SubItemIcon item={item} />
                    )}

                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[13.5px] font-medium text-white/90 group-hover:text-white leading-snug">
                        {isEntireEntityAction ? `Mention @${activeEntity.name}` : item.label}
                      </div>
                      <div className="flex items-center gap-1.5 truncate text-[11px] text-white/45 mt-0.5">
                        {isEntireEntityAction ? (
                          <span>Reference entire {activeEntity.typeLabel.toLowerCase()}</span>
                        ) : (
                          <>
                            {item.kind === 'campaign' && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-[rgba(255,90,0,0.12)] text-[#FF8533] border border-[rgba(255,90,0,0.2)] uppercase tracking-wider">
                                Campaign
                              </span>
                            )}
                            {item.kind === 'opportunity' && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                Opportunity
                              </span>
                            )}
                            {item.subtitle && <span className="truncate">{item.subtitle}</span>}
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="rounded-md border border-white/[0.12] bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-white/70">
                        ↵
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* ROOT ENTITIES VIEW */
          filteredEntities.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-white/40">
              No matching entities found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredEntities.map((entity, idx) => {
                const isSelected = idx === selectedIndex;

                const metaSubtitle =
                  entity.kind === 'self'
                    ? [
                        entity.campaigns.length > 0
                          ? `${entity.campaigns.length} ${entity.campaigns.length === 1 ? 'campaign' : 'campaigns'}`
                          : null,
                        entity.opportunities.length > 0
                          ? `${entity.opportunities.length} ${entity.opportunities.length === 1 ? 'opportunity' : 'opportunities'}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : entity.campaigns.length > 0
                      ? `${entity.campaigns.length} ${entity.campaigns.length === 1 ? 'campaign' : 'campaigns'}`
                      : null;

                return (
                  <div
                    key={entity.id}
                    onClick={() =>
                      onSelect({
                        id: entity.id,
                        kind: 'competitor',
                        label: entity.name,
                        logo: entity.logo,
                        subtitle: entity.typeLabel,
                      })
                    }
                    onMouseEnter={() => onSelectedIndexChange(idx)}
                    className={`mention-picker-item group flex items-center justify-between cursor-pointer ${
                      isSelected ? 'selected' : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <EntityLogo name={entity.name} logo={entity.logo} kind={entity.kind} />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-[13.5px] font-semibold text-white/95 group-hover:text-white">
                          {entity.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-white/45 mt-0.5">
                          <span>{entity.typeLabel}</span>
                          {metaSubtitle && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="font-medium text-[#FF8533]">
                                {metaSubtitle}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Drill-down Chevron Button */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        title={`Explore ${entity.name} campaigns (or press →)`}
                        aria-label={`Explore ${entity.name}`}
                        onClick={(e) => handleDrillDown(entity, e)}
                        className="mention-picker-drill-btn"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Footer Hint */}
      <div className="border-t border-white/[0.06] px-4 py-2 bg-white/[0.01] flex items-center justify-between text-[11px] text-white/40">
        {activeEntity ? (
          <>
            <span>
              Press <kbd className="font-semibold text-white/70">←</kbd> to return to
              entities
            </span>
            <span>
              <kbd className="font-semibold text-white/70">↵</kbd> Select
            </span>
          </>
        ) : (
          <>
            <span>
              Press <kbd className="font-semibold text-white/70">→</kbd> to explore
              campaigns
            </span>
            <span>
              <kbd className="font-semibold text-white/70">↵</kbd> Mention
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
