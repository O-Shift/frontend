'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  AtSign,
  Paperclip,
  Square,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { apiFetch, fetchCompany, fetchCampaigns, fetchGaps, fetchOpportunities, type Campaign } from '@/lib/api';
import { extractDomain as extractDomainRaw } from '@/lib/utils/domain';
import { logoUrl } from '@/lib/logos';
import {
  parseMessageSegments,
  type ChatContextItem,
  type ChatContextKind,
} from '@/lib/utils/chat-context';
import MentionPicker, {
  type MentionEntity,
  type CompetitorRecord,
  type PartnershipResponse,
  contextKey,
} from './MentionPicker';

function getPillFallbackSvg(kind: string): string {
  if (kind === 'campaign') {
    return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FF8533" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>';
  }
  if (kind === 'opportunity') {
    return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>';
  }
  return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>';
}

function createPillElement(item: ChatContextItem): HTMLElement {
  const pill = document.createElement('span');
  pill.contentEditable = 'false';
  pill.className = 'chat-inline-pill';
  pill.dataset.id = item.id;
  pill.dataset.kind = item.kind;
  pill.dataset.label = item.label;
  if (item.logo) pill.dataset.logo = item.logo;
  if (item.subtitle) pill.dataset.subtitle = item.subtitle;

  // Icon span
  const iconSpan = document.createElement('span');
  iconSpan.className = 'chat-inline-pill-icon';
  if (item.logo) {
    const img = document.createElement('img');
    img.src = item.logo;
    img.alt = '';
    img.onerror = () => {
      img.remove();
      iconSpan.innerHTML = getPillFallbackSvg(item.kind);
    };
    iconSpan.appendChild(img);
  } else {
    iconSpan.innerHTML = getPillFallbackSvg(item.kind);
  }
  pill.appendChild(iconSpan);

  // Label span
  const labelSpan = document.createElement('span');
  labelSpan.className = 'chat-inline-pill-label';
  labelSpan.textContent = `@${item.label}`;
  pill.appendChild(labelSpan);

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'chat-inline-pill-remove';
  removeBtn.setAttribute('aria-label', `Remove @${item.label}`);
  removeBtn.innerHTML =
    '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  pill.appendChild(removeBtn);

  return pill;
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [entities, setEntities] = useState<MentionEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRangeRef = useRef<{ node: Text; startOffset: number; endOffset: number } | null>(null);
  const isInternalChangeRef = useRef(false);

  const loadEntities = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const [companyRes, competitors, campaigns, gaps, opportunities, partnerships] = await Promise.all([
        fetchCompany(),
        apiFetch<CompetitorRecord[]>('/competitors'),
        fetchCampaigns({ limit: 100 }),
        fetchGaps({ limit: 200 }),
        fetchOpportunities({ limit: 100 }),
        apiFetch<PartnershipResponse>('/graph/partnerships'),
      ]);

      // 1. Resolve user's own company
      let selfCompany: { id: string; name: string; website?: string | null } | null = null;
      if (companyRes.ok && companyRes.data?.name) {
        selfCompany = companyRes.data;
      }

      // Helper to check if a competitor row in DB is actually the user's company
      const normalizeStr = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // URL-parsed hostnames are already lowercase; toLowerCase() only matters
      // on the fallback path where a mixed-case string failed URL parsing.
      const extractDomain = (input?: string | null): string => extractDomainRaw(input ?? '').toLowerCase();

      const selfNameNorm = normalizeStr(selfCompany?.name);
      const selfDomain = extractDomain(selfCompany?.website || selfCompany?.name || '');

      const isSelfCompetitor = (comp: { id: string; name: string; website?: string; domain?: string }) => {
        if (!selfCompany) return false;
        if (comp.id === selfCompany.id) return true;
        const cNameNorm = normalizeStr(comp.name);
        if (selfNameNorm && cNameNorm && (selfNameNorm === cNameNorm || cNameNorm.includes(selfNameNorm) || selfNameNorm.includes(cNameNorm))) {
          return true;
        }
        const cDomain = extractDomain(comp.website || comp.domain || '');
        if (selfDomain && cDomain && (selfDomain === cDomain || cDomain.includes(selfDomain) || selfDomain.includes(cDomain))) {
          return true;
        }
        return false;
      };

      // 2. Identify all IDs that belong to the self company (including duplicate competitor rows)
      const selfIds = new Set<string>();
      if (selfCompany?.id) selfIds.add(selfCompany.id);

      const competitorMap = new Map<string, { id: string; name: string; website?: string }>();
      const validCompetitors: CompetitorRecord[] = [];

      if (competitors.ok && Array.isArray(competitors.data)) {
        for (const comp of competitors.data) {
          if (!comp.id) continue;
          if (isSelfCompetitor(comp)) {
            selfIds.add(comp.id);
          } else {
            competitorMap.set(comp.id, comp);
            validCompetitors.push(comp);
          }
        }
      }

      // 3. Group campaigns: if competitor_id belongs to selfIds or has no competitor_id -> selfCampaigns
      const campaignsByCompetitor = new Map<string, ChatContextItem[]>();
      const insightCountByCompetitor = new Map<string, number>();
      const selfCampaigns: ChatContextItem[] = [];

      if (gaps.ok && Array.isArray(gaps.data)) {
        for (const gap of gaps.data) {
          if (!gap.competitor_id) continue;
          insightCountByCompetitor.set(
            gap.competitor_id,
            (insightCountByCompetitor.get(gap.competitor_id) || 0) + 1
          );
        }
      }

      if (campaigns.ok && Array.isArray(campaigns.data)) {
        for (const item of campaigns.data) {
          const comp = item.competitor_id ? competitorMap.get(item.competitor_id) : undefined;
          const compWebsite = comp?.website;
          const campaignItem: ChatContextItem = {
            id: item.id,
            kind: 'campaign',
            label: item.title,
            subtitle: item.description || 'Detected campaign',
            logo: (compWebsite ? logoUrl(compWebsite) : undefined) ?? undefined,
          };

          if (item.competitor_id && selfIds.has(item.competitor_id)) {
            selfCampaigns.push(campaignItem);
          } else if (item.competitor_id && competitorMap.has(item.competitor_id)) {
            const existing = campaignsByCompetitor.get(item.competitor_id) || [];
            existing.push(campaignItem);
            campaignsByCompetitor.set(item.competitor_id, existing);
          } else {
            selfCampaigns.push(campaignItem);
          }
        }
      }

      // 4. Opportunities belong strictly to SELF / Your Company
      const selfOpportunities: ChatContextItem[] = [];
      if (opportunities.ok && opportunities.data?.items) {
        for (const item of opportunities.data.items) {
          selfOpportunities.push({
            id: item.id,
            kind: 'opportunity',
            label: item.title,
            subtitle: `${item.impact} impact · ${(item.status || '').replaceAll('_', ' ')}`,
          });
        }
      }

      // 5. Self Entity (Your Company)
      let selfEntity: MentionEntity | null = null;
      if (selfCompany) {
        const compWebsite = selfCompany.website || undefined;
        selfEntity = {
          id: selfCompany.id || 'self',
          name: selfCompany.name,
          kind: 'self',
          typeLabel: 'Your Company',
          logo: (compWebsite ? logoUrl(compWebsite) : undefined) || (selfCompany.name ? logoUrl(selfCompany.name) : undefined) || undefined,
          campaigns: selfCampaigns,
          insightCount: [...selfIds].reduce(
            (count, id) => count + (insightCountByCompetitor.get(id) || 0),
            0
          ),
          opportunities: selfOpportunities,
          partnerships: [],
        };
      }

      // 6. Competitor Entities (Competitors show ONLY their campaigns)
      const competitorEntities: MentionEntity[] = [];
      for (const comp of validCompetitors) {
        const compCampaigns = campaignsByCompetitor.get(comp.id) || [];
        competitorEntities.push({
          id: comp.id,
          name: comp.name,
          kind: 'competitor',
          typeLabel: 'Competitor',
          logo: logoUrl(comp.website || comp.name) ?? undefined,
          campaigns: compCampaigns,
          insightCount: insightCountByCompetitor.get(comp.id) || 0,
          opportunities: [], // Competitors do NOT show opportunities
          partnerships: [],
        });
      }

      setEntities(selfEntity ? [selfEntity, ...competitorEntities] : competitorEntities);
      setLoaded(true);
    } catch {
      // Ignore network errors for picker background load
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  // Handle external reset (e.g. message sent or chat reset)
  useEffect(() => {
    if (editorRef.current) {
      if (!value && editorRef.current.textContent?.trim() !== '') {
        editorRef.current.innerHTML = '';
      }
    }
  }, [value]);

  // Populate initial value if mounted with preset query
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML === '') {
      const segments = parseMessageSegments(value, context);
      editorRef.current.innerHTML = '';
      for (const seg of segments) {
        if (seg.type === 'text') {
          editorRef.current.appendChild(document.createTextNode(seg.text));
        } else if (seg.type === 'mention') {
          const pillItem = seg.item || {
            id: seg.label,
            kind: 'competitor' as const,
            label: seg.label,
          };
          const pill = createPillElement(pillItem);
          editorRef.current.appendChild(pill);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // Close picker on outside click
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
        setActiveEntityId(null);
        triggerRangeRef.current = null;
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const syncFromDOM = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Serialize DOM to string representation
    let text = '';
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += (node.textContent || '').replace(/\u200B/g, '');
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as HTMLElement;
        if (elem.classList.contains('chat-inline-pill')) {
          const label = elem.dataset.label || '';
          text += `@${label}`;
        } else if (elem.tagName === 'BR') {
          text += '\n';
        } else if (elem.tagName === 'DIV' || elem.tagName === 'P') {
          if (text.length > 0 && !text.endsWith('\n')) {
            text += '\n';
          }
          for (const child of Array.from(elem.childNodes)) {
            walk(child);
          }
        } else {
          for (const child of Array.from(elem.childNodes)) {
            walk(child);
          }
        }
      }
    };

    for (const child of Array.from(editor.childNodes)) {
      walk(child);
    }

    // Extract context items from existing inline pills
    const pills = editor.querySelectorAll<HTMLElement>('.chat-inline-pill');
    const nextContext: ChatContextItem[] = [];
    const seen = new Set<string>();

    pills.forEach((p) => {
      const id = p.dataset.id || '';
      const kind = (p.dataset.kind as ChatContextKind) || 'competitor';
      const label = p.dataset.label || '';
      const key = `${kind}:${id}`;
      if (id && label && !seen.has(key)) {
        seen.add(key);
        nextContext.push({
          id,
          kind,
          label,
          logo: p.dataset.logo,
          subtitle: p.dataset.subtitle,
        });
      }
    });

    isInternalChangeRef.current = true;
    onChange(text);
    onContextChange(nextContext);
  }, [onChange, onContextChange]);

  const insertMentionPill = useCallback(
    (item: ChatContextItem) => {
      const editor = editorRef.current;
      if (!editor) return;

      const pill = createPillElement(item);
      const spaceNode = document.createTextNode('\u00A0');

      const sel = window.getSelection();
      let range: Range | null = null;

      if (triggerRangeRef.current && editor.contains(triggerRangeRef.current.node)) {
        range = document.createRange();
        range.setStart(triggerRangeRef.current.node, triggerRangeRef.current.startOffset);
        range.setEnd(triggerRangeRef.current.node, triggerRangeRef.current.endOffset);
        range.deleteContents();
      } else if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        range = sel.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }

      range.insertNode(spaceNode);
      range.insertNode(pill);

      // Place caret immediately after the inserted pill and space
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }

      triggerRangeRef.current = null;
      setPickerOpen(false);
      setActiveEntityId(null);
      setQuery('');
      setSelectedIndex(0);
      editor.focus();

      syncFromDOM();
    },
    [syncFromDOM]
  );

  const openPickerFromButton = () => {
    triggerRangeRef.current = null;
    setQuery('');
    setSelectedIndex(0);
    setActiveEntityId(null);
    setPickerOpen(true);
    void loadEntities();
    editorRef.current?.focus();
  };

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;

    // Disarm any armed pill on new input
    const armedPill = editor.querySelector('.chat-inline-pill--armed') as HTMLElement | null;
    if (armedPill) {
      armedPill.classList.remove('chat-inline-pill--armed');
    }

    const sel = window.getSelection();
    if (sel && sel.isCollapsed && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer as Text;
        const offset = range.startOffset;
        const textBefore = textNode.textContent?.slice(0, offset) || '';
        const atMatch = textBefore.match(/@([a-zA-Z0-9_\-\s]{0,30})$/);

        if (atMatch) {
          const queryStr = atMatch[1];
          triggerRangeRef.current = {
            node: textNode,
            startOffset: offset - atMatch[0].length,
            endOffset: offset,
          };
          setQuery(queryStr);
          setSelectedIndex(0);
          setPickerOpen(true);
          void loadEntities();
        } else {
          if (pickerOpen && triggerRangeRef.current) {
            setPickerOpen(false);
            setActiveEntityId(null);
            triggerRangeRef.current = null;
          }
        }
      }
    }

    syncFromDOM();
  };

  // Currently active entity object for drill-down calculations
  const activeEntity = useMemo(
    () => entities.find((e) => e.id === activeEntityId) || null,
    [entities, activeEntityId]
  );

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
      if (!normal || c.label.toLowerCase().includes(normal) || (c.subtitle && c.subtitle.toLowerCase().includes(normal))) {
        items.push(c);
      }
    }

    // 3. Entity's opportunities
    for (const o of activeEntity.opportunities) {
      if (!normal || o.label.toLowerCase().includes(normal) || (o.subtitle && o.subtitle.toLowerCase().includes(normal))) {
        items.push(o);
      }
    }

    return items;
  }, [activeEntity, query]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (event.key === 'Escape') {
      if (pickerOpen) {
        event.preventDefault();
        if (activeEntityId !== null) {
          // In drilldown: first ESC returns to root entities list
          const lastId = activeEntityId;
          setActiveEntityId(null);
          setQuery('');
          const idx = entities.findIndex((e) => e.id === lastId);
          setSelectedIndex(idx >= 0 ? idx : 0);
        } else {
          setPickerOpen(false);
          triggerRangeRef.current = null;
        }
        return;
      }
    }

    if (pickerOpen) {
      if (activeEntityId === null) {
        // ROOT VIEW
        const count = filteredEntities.length;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (count > 0) setSelectedIndex((prev) => (prev + 1) % count);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (count > 0) setSelectedIndex((prev) => (prev - 1 + count) % count);
          return;
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          const target = filteredEntities[selectedIndex];
          if (target) {
            setActiveEntityId(target.id);
            setQuery('');
            setSelectedIndex(0);
          }
          return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          const target = filteredEntities[selectedIndex];
          if (target) {
            insertMentionPill({
              id: target.id,
              kind: 'competitor',
              label: target.name,
              logo: target.logo,
              subtitle: target.typeLabel,
            });
          }
          return;
        }
      } else {
        // DRILL-DOWN SUB-LIST VIEW
        const count = subListItems.length;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (count > 0) setSelectedIndex((prev) => (prev + 1) % count);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (count > 0) setSelectedIndex((prev) => (prev - 1 + count) % count);
          return;
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          const lastId = activeEntityId;
          setActiveEntityId(null);
          setQuery('');
          const idx = entities.findIndex((e) => e.id === lastId);
          setSelectedIndex(idx >= 0 ? idx : 0);
          return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          const target = subListItems[selectedIndex];
          if (target) {
            insertMentionPill(target);
          }
          return;
        }
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && !pickerOpen) {
      event.preventDefault();
      onSend();
      return;
    }

    // Two-step safe backspace deletion logic
    if (event.key === 'Backspace') {
      const armedPill = editor.querySelector('.chat-inline-pill--armed') as HTMLElement | null;
      if (armedPill) {
        // Second backspace: delete the armed pill!
        event.preventDefault();
        armedPill.remove();
        syncFromDOM();
        return;
      }

      // No armed pill yet -> check if caret is immediately adjacent to a mention pill
      const sel = window.getSelection();
      if (sel && sel.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let prevNode: Node | null = null;

        if (range.startContainer === editor) {
          if (range.startOffset > 0) {
            prevNode = editor.childNodes[range.startOffset - 1];
          }
        } else if (range.startContainer.nodeType === Node.TEXT_NODE) {
          const textNode = range.startContainer;
          const offset = range.startOffset;
          const beforeText = textNode.textContent?.slice(0, offset) || '';

          if (offset === 0 || beforeText === '\u200B' || beforeText === '' || beforeText === '\u00A0') {
            prevNode = textNode.previousSibling;
          }
        }

        if (prevNode && (prevNode as HTMLElement).classList?.contains('chat-inline-pill')) {
          // 1st backspace: ARM the pill with delete indicator!
          event.preventDefault();
          (prevNode as HTMLElement).classList.add('chat-inline-pill--armed');
          return;
        }
      }
    } else {
      // Disarm on any other key
      const armedPill = editor.querySelector('.chat-inline-pill--armed') as HTMLElement | null;
      if (armedPill) {
        armedPill.classList.remove('chat-inline-pill--armed');
      }
    }
  };

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const removeBtn = (event.target as HTMLElement).closest('.chat-inline-pill-remove');
    if (removeBtn) {
      event.preventDefault();
      event.stopPropagation();
      const pill = removeBtn.closest('.chat-inline-pill') as HTMLElement | null;
      if (pill) {
        pill.remove();
        syncFromDOM();
        editorRef.current?.focus();
      }
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      {/* Context Hierarchical Autocomplete Picker */}
      <AnimatePresence>
        {pickerOpen && (
          <MentionPicker
            isOpen={pickerOpen}
            onClose={() => {
              setPickerOpen(false);
              setActiveEntityId(null);
            }}
            onSelect={insertMentionPill}
            query={query}
            onQueryChange={setQuery}
            selectedIndex={selectedIndex}
            onSelectedIndexChange={setSelectedIndex}
            entities={entities}
            loading={loading}
            activeEntityId={activeEntityId}
            onActiveEntityIdChange={setActiveEntityId}
          />
        )}
      </AnimatePresence>

      <div className={`chat-composer-shell ${value && value.trim().length > 0 ? 'has-content' : ''}`}>
        {/* Rich ContentEditable Mention Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="Ask about your market… (type @ to mention entities)"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={handleEditorClick}
          className="chat-composer-editor"
          tabIndex={0}
        />

        <div className="flex items-center justify-between px-3.5 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openPickerFromButton}
              className="chat-composer-inline-btn"
              aria-label="Attach workspace context"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attach Context</span>
            </button>
            <button
              type="button"
              onClick={openPickerFromButton}
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
