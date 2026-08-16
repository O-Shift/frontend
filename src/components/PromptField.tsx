'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowUp,
  AtSign,
  Building2,
  Lightbulb,
  Loader2,
  Megaphone,
  Network,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  Square,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAgentChat } from '@/hooks/use-agent-chat';
import AgentProgress from '@/components/chat/AgentProgress';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import type { ChatContextItem, ChatContextKind } from '@/lib/utils/chat-context';
import { apiFetch, fetchCompany, fetchCampaigns, fetchGaps, fetchOpportunities, type Campaign } from '@/lib/api';
import { logoUrl } from '@/lib/logos';
import MentionPicker, { type MentionEntity } from '@/components/chat/MentionPicker';

interface CompetitorRecord {
  id: string;
  name: string;
  website?: string;
  domain?: string;
}

interface PartnershipResponse {
  nodes: Array<{ id: string; name: string; entity_type: string }>;
}

const contextIcons: Record<ChatContextKind, typeof Building2> = {
  competitor: Building2,
  campaign: Megaphone,
  opportunity: Sparkles,
  partnership: Network,
};

const kindMeta: Record<ChatContextKind, { label: string; icon: typeof Sparkles }> = {
  competitor: { label: 'Competitors', icon: Building2 },
  campaign: { label: 'Campaigns', icon: Megaphone },
  opportunity: { label: 'Opportunities', icon: Sparkles },
  partnership: { label: 'Partnerships', icon: Network },
};

function contextKey(item: ChatContextItem): string {
  return `${item.kind}:${item.id}`;
}

function nodeToContextItem(node: any): ChatContextItem | null {
  if (!node) return null;
  if (typeof node === 'string') {
    return {
      id: node,
      kind: 'competitor',
      label: node,
      logo: logoUrl(node) ?? undefined,
    };
  }

  const id = String(node.id || node.domain || node.name || 'node');
  const label = String(node.label || node.title || node.name || node.domain || 'Attached Context');
  const domainOrWeb = node.domain || node.website || (label.includes('.') ? label : undefined);

  let kind: ChatContextKind = 'competitor';
  if (node.entity_type || node.category === 'partnership' || node.type === 'partnership') {
    kind = 'partnership';
  } else if (node.impact || node.category === 'opportunity' || node.type === 'opportunity') {
    kind = 'opportunity';
  } else if (node.competitor_id || node.category === 'campaign' || node.type === 'campaign') {
    kind = 'campaign';
  }

  let subtitle: string | undefined = undefined;
  if (kind === 'opportunity' && node.impact) {
    subtitle = `${node.impact} impact · ${(node.status || '').replaceAll('_', ' ')}`;
  } else if (kind === 'partnership' && node.entity_type) {
    subtitle = String(node.entity_type).replaceAll('_', ' ');
  } else if (node.description || node.summary || node.desc) {
    subtitle = String(node.description || node.summary || node.desc).slice(0, 50);
  } else if (domainOrWeb) {
    subtitle = domainOrWeb;
  }

  const logo = (domainOrWeb ? logoUrl(domainOrWeb) : (kind === 'partnership' ? logoUrl(label) : undefined)) ?? undefined;

  return {
    id,
    kind,
    label,
    subtitle,
    logo,
  };
}

function ContextItemLogo({ item }: { item: ChatContextItem }) {
  const [error, setError] = useState(false);
  const Icon = kindMeta[item.kind]?.icon || Sparkles;

  if (item.logo && !error) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] overflow-hidden p-1">
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
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function MessageContextItem({ item }: { item: ChatContextItem }) {
  const [imgErr, setImgErr] = useState(false);
  const Icon = contextIcons[item.kind] || Sparkles;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--context-chip-border)] bg-[var(--context-chip-bg)] px-2.5 py-0.5 text-[11px] text-[var(--text-primary)]">
      {item.logo && !imgErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.logo}
          alt=""
          className="h-3 w-3 rounded object-contain shrink-0"
          onError={() => setImgErr(true)}
        />
      ) : (
        <Icon className="h-3 w-3 text-[var(--accent)] shrink-0" />
      )}
      <span className="max-w-44 truncate">{item.label}</span>
    </span>
  );
}

function MessageContext({ items }: { items: ChatContextItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <MessageContextItem key={contextKey(item)} item={item} />
      ))}
    </div>
  );
}

export interface PromptFieldProps {
  selectedNode?: any;
  setSelectedNode?: (node: any) => void;
  commandActive: boolean;
  setCommandActive: (active: boolean) => void;
  setSidebarCollapsed?: (collapsed: boolean) => void;
  onSubmit?: (prompt: string) => void;
  onThinkingChange?: (thinking: boolean) => void;
}

export default function PromptField({
  selectedNode,
  setSelectedNode,
  commandActive,
  setCommandActive,
  setSidebarCollapsed,
  onSubmit,
  onThinkingChange,
}: PromptFieldProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    isThinking,
    activeTool,
    toolSteps,
    turnStartedAt,
    error,
    createConversation,
    sendMessage,
    stop,
  } = useAgentChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [inputVal, setInputVal] = useState('');
  const [attachedContext, setAttachedContext] = useState<ChatContextItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [entities, setEntities] = useState<MentionEntity[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [availableContextItems, setAvailableContextItems] = useState<ChatContextItem[]>([]);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);

  // Sync selectedNode prop into attachedContext
  useEffect(() => {
    if (selectedNode) {
      const item = nodeToContextItem(selectedNode);
      if (item) {
        setAttachedContext((prev) => {
          if (prev.some((c) => contextKey(c) === contextKey(item))) return prev;
          return [...prev, item];
        });
      }
    } else {
      if (messages.length === 0) {
        setAttachedContext([]);
      }
    }
  }, [selectedNode, messages.length]);

  // Sync isThinking and isStreaming state to body class and parent callback
  useEffect(() => {
    const active = isThinking || isStreaming;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('is-thinking-active', active);
    }
    if (onThinkingChange) {
      onThinkingChange(active);
    }
  }, [isThinking, isStreaming, onThinkingChange]);

  // Auto-scroll chat body to bottom when messages or tool steps update
  const scrollToBottom = useCallback(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, isThinking, activeTool, toolSteps, scrollToBottom]);

  // Auto-focus input when command bar opens
  useEffect(() => {
    if (commandActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandActive]);

  // Global ESC & click-outside handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pickerOpen) {
          setPickerOpen(false);
          e.stopPropagation();
        } else if (commandActive) {
          closeAll();
        }
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (pickerOpen && pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [commandActive, pickerOpen]);

  const closeAll = () => {
    setCommandActive(false);
    if (setSidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (commandActive) {
      closeAll();
    } else {
      setCommandActive(true);
    }
  };

  const handleRemoveContext = (itemToRemove: ChatContextItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAttachedContext((prev) => prev.filter((item) => contextKey(item) !== contextKey(itemToRemove)));
    if (selectedNode) {
      const selectedItem = nodeToContextItem(selectedNode);
      if (selectedItem && contextKey(selectedItem) === contextKey(itemToRemove) && setSelectedNode) {
        setSelectedNode(null);
      }
    }
  };

  const handleClearChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    stop();
    createConversation();
    setInputVal('');
  };

  const loadWorkspaceContextItems = useCallback(async () => {
    if (contextLoaded || contextLoading) return;
    setContextLoading(true);

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
      const extractDomain = (url?: string | null) => {
        if (!url) return '';
        try {
          const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
          return parsed.hostname.replace(/^www\./, '').toLowerCase();
        } catch {
          return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        }
      };

      const selfNameNorm = normalizeStr(selfCompany?.name);
      const selfDomain = extractDomain(selfCompany?.website || selfCompany?.name);

      const isSelfCompetitor = (comp: { id: string; name: string; website?: string; domain?: string }) => {
        if (!selfCompany) return false;
        if (comp.id === selfCompany.id) return true;
        const cNameNorm = normalizeStr(comp.name);
        if (selfNameNorm && cNameNorm && (selfNameNorm === cNameNorm || cNameNorm.includes(selfNameNorm) || selfNameNorm.includes(cNameNorm))) {
          return true;
        }
        const cDomain = extractDomain(comp.website || comp.domain);
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
      setAvailableContextItems([
        ...(selfEntity ? [{ id: selfEntity.id, kind: 'competitor' as const, label: selfEntity.name, subtitle: 'Your Company', logo: selfEntity.logo }] : []),
        ...competitorEntities.map((c) => ({ id: c.id, kind: 'competitor' as const, label: c.name, subtitle: 'Competitor', logo: c.logo })),
      ]);
      setContextLoaded(true);
    } catch {
      // ignore fetch errors for picker
    } finally {
      setContextLoading(false);
    }
  }, [contextLoaded, contextLoading]);

  const openPicker = () => {
    setPickerOpen(true);
    void loadWorkspaceContextItems();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    const lastToken = val.slice(0, e.target.selectionStart ?? val.length).split(/\s/).at(-1);
    if (lastToken?.startsWith('@')) {
      setPickerQuery(lastToken.slice(1));
      openPicker();
    }
  };

  const handleSelectContextItem = (item: ChatContextItem) => {
    if (!attachedContext.some((current) => contextKey(current) === contextKey(item))) {
      setAttachedContext((prev) => [...prev, item]);
    }
    const cursor = inputRef.current?.selectionStart ?? inputVal.length;
    const before = inputVal.slice(0, cursor).replace(/@[^\s@]*$/, '');
    const after = inputVal.slice(cursor);
    setInputVal(`${before}${after}`.replace(/\s{2,}/g, ' '));
    setPickerOpen(false);
    setPickerQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const content = (textToSend ?? inputVal).trim();
      if (!content || isStreaming) return;

      setCommandActive(true);
      setInputVal('');
      setPickerOpen(false);

      if (onSubmit) {
        onSubmit(content);
      }

      const contextSnapshot = [...attachedContext];
      void sendMessage(content, contextSnapshot);
    },
    [inputVal, isStreaming, attachedContext, onSubmit, sendMessage, setCommandActive]
  );

  // Context-aware dynamic suggestions
  const activeEntityName = attachedContext.length > 0 ? attachedContext[0].label : null;
  const suggestions = useMemo(() => {
    if (activeEntityName) {
      return [
        {
          icon: Building2,
          label: `Analyze ${activeEntityName} competitor strategy`,
          prompt: `Analyze ${activeEntityName}'s marketing strategy, key strengths, and competitive threats.`,
        },
        {
          icon: Sparkles,
          label: `Find market opportunities vs ${activeEntityName}`,
          prompt: `Find the highest-impact opportunities and weaknesses to exploit against ${activeEntityName}.`,
        },
      ];
    }
    return [
      {
        icon: Building2,
        label: 'Discover and analyze top competitors',
        prompt: 'Discover and analyze our top market competitors and their recent positioning moves.',
      },
      {
        icon: Lightbulb,
        label: 'Scan highest-impact opportunities',
        prompt: 'Find the highest-impact market opportunities we should act on next.',
      },
      {
        icon: Megaphone,
        label: 'Compare recent messaging campaigns',
        prompt: 'Compare the messaging themes and angles across recent detected competitor campaigns.',
      },
    ];
  }, [activeEntityName]);

  const showFloatingChat = messages.length > 0 || isStreaming || isThinking || !!activeTool;

  return (
    <>
      {/* Mascot Image */}
      <img
        src="/mascot.png"
        id="mascot-img"
        className={
          !commandActive
            ? 'mascot-idle'
            : attachedContext.length > 0
              ? 'mascot-active has-chip'
              : 'mascot-active'
        }
        alt="OShift Mascot"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleMascotClick}
      />

      {/* Command Wrapper */}
      <div
        className={`command-wrapper ${commandActive ? 'show-wrapper active-input' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Chat Messages Panel */}
        {showFloatingChat && (
          <div
            className="chat-window"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="chat-header">
              <div className="chat-title-group">
                <img src="/mascot.png" alt="OShift Mascot" />
                <span>
                  {attachedContext.length > 0
                    ? `OShift Assistant · ${attachedContext[0].label}`
                    : 'OShift Assistant'}
                </span>
              </div>
              <div className="chat-header-actions">
                {messages.length > 0 && (
                  <button
                    className="chat-header-btn"
                    onClick={handleClearChat}
                    title="New conversation / Clear"
                    aria-label="New conversation"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  className="chat-header-btn"
                  onClick={closeAll}
                  title="Close assistant"
                  aria-label="Close assistant"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              className="chat-body"
              ref={chatBodyRef}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              {messages.length === 0 && !isLoading && !isStreaming && (
                <div className="text-center py-6 px-4 text-xs text-[var(--text-secondary)] italic">
                  Ask OShift Assistant about your competitors, market insights, campaigns, or partnerships...
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  const isLastAssistant = !isUser && index === messages.length - 1;
                  const messageSteps =
                    message.steps && message.steps.length > 0
                      ? message.steps
                      : isLastAssistant
                        ? toolSteps
                        : [];
                  const isLiveTurn =
                    isLastAssistant && (isStreaming || isThinking || !!activeTool);

                  return (
                    <motion.div
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      key={message.id}
                      className={`chat-message-wrapper ${isUser ? 'user' : 'assistant'}`}
                    >
                      <div
                        className={`chat-avatar-icon ${
                          isUser ? 'user-avatar' : 'assistant-avatar'
                        }`}
                      >
                        {isUser ? (
                          <User className="w-3.5 h-3.5" />
                        ) : (
                          <img src="/mascot.png" alt="Assistant" />
                        )}
                      </div>

                      <div
                        className={`chat-bubble ${
                          isUser
                            ? 'user-bubble'
                            : message.isError
                              ? 'error-bubble'
                              : 'assistant-bubble'
                        }`}
                      >
                        {isUser && <MessageContext items={message.context ?? []} />}

                        {/* Live Agent Tool Progress */}
                        {!isUser && (messageSteps.length > 0 || (isLiveTurn && (isThinking || !!activeTool))) && (
                          <AgentProgress
                            isThinking={isLiveTurn ? isThinking : false}
                            activeTool={isLiveTurn ? activeTool : null}
                            steps={messageSteps}
                            startedAt={isLiveTurn ? turnStartedAt : null}
                            isLive={isLiveTurn}
                          />
                        )}

                        {isUser ? (
                          <span className="whitespace-pre-wrap">{message.content}</span>
                        ) : message.content ? (
                          <ChatMarkdown content={message.content} streaming={message.isStreaming} />
                        ) : null}

                        {message.isQuestion && (
                          <p className="chat-message-note">Reply below to continue this analysis.</p>
                        )}
                        {message.isRetryable && (
                          <p className="chat-message-note">
                            Send <strong>continue</strong> to resume from where it stopped.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Initial Thinking / Processing Dot Loader */}
              {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="chat-message-wrapper assistant">
                  <div className="chat-avatar-icon assistant-avatar">
                    <img src="/mascot.png" alt="Assistant" />
                  </div>
                  <div className="chat-bubble assistant-bubble">
                    <AgentProgress
                      isThinking={isThinking}
                      activeTool={activeTool}
                      steps={toolSteps}
                      startedAt={turnStartedAt}
                      isLive={true}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className={`suggestions ${commandActive ? 'visible' : ''}`}>
          {suggestions.map(({ icon: Icon, label, prompt }, i) => (
            <div key={label} className="sugg-btn-container">
              <button
                type="button"
                className="sugg-btn"
                onClick={() => handleSendMessage(prompt)}
              >
                <Icon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span>{label}</span>
                <span className="num">{i + 1}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Context Picker Popover Modal */}
        <AnimatePresence>
          {pickerOpen && (
            <MentionPicker
              isOpen={pickerOpen}
              onClose={() => {
                setPickerOpen(false);
                setActiveEntityId(null);
              }}
              onSelect={handleSelectContextItem}
              query={pickerQuery}
              onQueryChange={setPickerQuery}
              selectedIndex={selectedIndex}
              onSelectedIndexChange={setSelectedIndex}
              entities={entities}
              loading={contextLoading}
              activeEntityId={activeEntityId}
              onActiveEntityIdChange={setActiveEntityId}
            />
          )}
        </AnimatePresence>

        {/* Command Input Bar */}
        <div className="command-bar-container">
          <div className="glow-wrapper">
            <div className="glow-blob"></div>
          </div>
          <div className="command-bar">
            {/* Context chips row — shown when entities are attached */}
            {attachedContext.length > 0 && (
              <div className="context-chip-row flex flex-wrap gap-1.5 pt-1">
                {attachedContext.map((item) => {
                  const Icon = kindMeta[item.kind]?.icon || Sparkles;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={contextKey(item)}
                      className="context-chip"
                    >
                      {item.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.logo}
                          alt=""
                          className="h-3 w-3 rounded object-contain shrink-0"
                        />
                      ) : (
                        <Icon className="h-3 w-3 text-[var(--accent)] shrink-0" />
                      )}
                      <span className="max-w-40 truncate">{item.label}</span>
                      <button
                        type="button"
                        className="cc-close"
                        onClick={(e) => handleRemoveContext(item, e)}
                        aria-label={`Remove ${item.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              ref={inputRef}
              value={inputVal}
              onChange={handleInputChange}
              placeholder="What would you like to ask or create? (Use @ to attach)"
              onFocus={() => setCommandActive(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !pickerOpen) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            <div className="controls-row">
              <div className="left-controls">
                <button
                  className="icon-btn-cb"
                  type="button"
                  onClick={openPicker}
                  title="Attach workspace context (@)"
                  aria-label="Attach workspace context"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  className="icon-btn-cb"
                  type="button"
                  onClick={openPicker}
                  title="Mention workspace entity"
                  aria-label="Mention workspace entity"
                >
                  <AtSign className="w-4 h-4" />
                </button>
              </div>

              <div className="right-controls">
                {isStreaming ? (
                  <button
                    className="submit-btn-cb streaming-stop"
                    type="button"
                    onClick={stop}
                    title="Stop generation"
                    aria-label="Stop generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current text-[var(--accent)]" />
                  </button>
                ) : (
                  <button
                    className="submit-btn-cb"
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputVal.trim()}
                    title="Send message"
                    aria-label="Send message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
