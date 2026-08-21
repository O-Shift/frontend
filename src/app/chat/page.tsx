'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import Image from 'next/image';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  History,
  Lightbulb,
  Loader2,
  Megaphone,
  MessageSquare,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAgentChat, deriveTitle } from '@/hooks/use-agent-chat';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import AgentProgress from '@/components/chat/AgentProgress';
import ChatComposer from '@/components/chat/ChatComposer';
import { parseMessageSegments, type ChatContextItem, type ChatContextKind } from '@/lib/utils/chat-context';
import { CHAT_HERO_HEADLINES, getRandomHeroHeadline } from '@/lib/constants/chat-headlines';

const quickPills = [
  { icon: Building2, label: 'Analyze Competitors', prompt: 'What changed across our competitors this week?' },
  { icon: Lightbulb, label: 'Scan Opportunities', prompt: 'Find the highest-impact opportunities we should act on next.' },
  { icon: Megaphone, label: 'Compare Campaigns', prompt: 'Compare the messaging themes in our latest detected campaigns.' },
];

const contextIcons: Record<ChatContextKind, typeof Building2> = {
  competitor: Building2,
  campaign: Megaphone,
  opportunity: Sparkles,
  partnership: Network,
};

function MessageContextItem({ item }: { item: ChatContextItem }) {
  const [imgErr, setImgErr] = useState(false);
  const Icon = contextIcons[item.kind] || Sparkles;

  return (
    <span className="chat-message-context flex items-center gap-1.5">
      {item.logo && !imgErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.logo}
          alt=""
          className="h-3.5 w-3.5 rounded object-contain shrink-0"
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
  if (items.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <MessageContextItem key={`${item.kind}:${item.id}`} item={item} />
      ))}
    </div>
  );
}


function InlineMentionBadge({ item, raw }: { item?: ChatContextItem; raw: string }) {
  const [imgErr, setImgErr] = useState(false);
  const Icon = item ? (contextIcons[item.kind] || Sparkles) : Sparkles;
  const label = item ? item.label : raw.replace(/^@/, '');

  return (
    <span className="chat-inline-mention-badge" title={item?.subtitle || label}>
      <span className="badge-icon">
        {item?.logo && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.logo}
            alt=""
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <Icon className="h-3 w-3 text-[var(--accent)]" />
        )}
      </span>
      <span className="badge-label">@{label}</span>
    </span>
  );
}

function UserChatMessageContent({
  content,
  context,
}: {
  content: string;
  context: ChatContextItem[];
}) {
  const segments = useMemo(() => parseMessageSegments(content, context), [content, context]);

  const mentionedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const seg of segments) {
      if (seg.type === 'mention' && seg.item) {
        ids.add(`${seg.item.kind}:${seg.item.id}`);
      }
    }
    return ids;
  }, [segments]);

  const unmentionedContext = useMemo(() => {
    return context.filter((c) => !mentionedIds.has(`${c.kind}:${c.id}`));
  }, [context, mentionedIds]);

  return (
    <div>
      {unmentionedContext.length > 0 && <MessageContext items={unmentionedContext} />}
      <p className="whitespace-pre-wrap leading-relaxed">
        {segments.map((seg, idx) => {
          if (seg.type === 'text') {
            return <span key={idx}>{seg.text}</span>;
          }
          return <InlineMentionBadge key={idx} item={seg.item} raw={seg.raw} />;
        })}
      </p>
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    isStreaming,
    isThinking,
    activeTool,
    toolSteps,
    turnStartedAt,
    error,
    createConversation,
    loadConversation,
    removeConversation,
    sendMessage,
    stop,
  } = useAgentChat();

  const [input, setInput] = useState('');
  const [attachedContext, setAttachedContext] = useState<ChatContextItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteNotification, setDeleteNotification] = useState<string | null>(null);
  const [heroHeadline] = useState<string>(() => getRandomHeroHeadline(CHAT_HERO_HEADLINES));
  const mounted = useMounted();

  const endRef = useRef<HTMLDivElement>(null);
  const autoSentQueryRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming, isThinking, activeTool, toolSteps]);

  useEffect(() => {
    if (initialQuery && !autoSentQueryRef.current && !isStreaming && !isLoading) {
      autoSentQueryRef.current = true;
      void sendMessage(initialQuery);
    }
  }, [initialQuery, isStreaming, isLoading, sendMessage]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const message = input;
    const context = attachedContext;
    setInput('');
    setAttachedContext([]);
    void sendMessage(message, context);
  };

  const startNewChat = () => {
    createConversation();
    setInput('');
    setAttachedContext([]);
    setHistoryOpen(false);
  };

  /**
   * DELETE CHAT HANDLER
   * Calls DELETE /agent/conversations/{id} with optimistic UI.
   * The conversation is removed instantly; any API error triggers a toast.
   */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;

    // Dismiss the confirmation modal immediately.
    setDeleteTarget(null);

    // If this was the active conversation, clear the view instantly.
    if (currentConversationId === id) {
      createConversation();
    }

    const result = await removeConversation(id);

    if (!result.ok) {
      setDeleteNotification(`Failed to delete "${title}": ${result.error ?? 'Unknown error'}`);
    } else {
      setDeleteNotification(`"${title}" deleted.`);
    }
    setTimeout(() => {
      setDeleteNotification(null);
    }, 4500);
  };

  const activeConversation = conversations.find((c) => c.id === currentConversationId);
  const currentTitle =
    activeConversation?.title ||
    (messages.length > 0 ? deriveTitle(messages[0].content, messages[0].context) : 'New conversation');

  const filteredConversations = conversations.filter((conversation) =>
    (conversation.title || 'Untitled chat').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const composer = (
    <ChatComposer
      value={input}
      onChange={setInput}
      onSend={handleSend}
      onStop={stop}
      isStreaming={isStreaming}
      context={attachedContext}
      onContextChange={setAttachedContext}
      autoFocus={messages.length === 0}
    />
  );

  return (
    <div className="chat-page">
      <div className="chat-ambient" aria-hidden="true"><span /><span /></div>

      {/* Delete Feedback Toast */}
      <AnimatePresence>
        {deleteNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-2xl text-xs text-[var(--text-primary)]"
          >
            <Check className="h-4 w-4 text-[var(--color-success)] shrink-0" />
            <span>{deleteNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="chat-topbar">
        <div className="flex min-w-0 items-center gap-2.5">
          <MessageSquare className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
          <h1 className="truncate text-sm md:text-[15px] font-medium text-[var(--text-primary)]">
            {currentTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
            className="chat-topbar-icon"
            aria-label="Toggle chat history"
            title="Chat history"
          >
            {historyOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <section className="relative flex min-w-0 flex-1 flex-col">
          {messages.length === 0 ? (
            <div className="chat-empty-scroll">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="chat-empty"
              >
                <div>
                  <h2 className="chat-hero-title">{heroHeadline}</h2>
                </div>

                {/* Quick action pills directly ABOVE the chat box (no emojis, crisp outline icons) */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl w-full">
                  {quickPills.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="chat-pill-btn"
                    >
                      <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="w-full max-w-3xl text-left">{composer}</div>
              </motion.div>
            </div>
          ) : (
            <>
              <div className="chat-feed">
                <div className="mx-auto w-full max-w-4xl px-5 pb-12 pt-8 md:px-10">
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
                        <motion.article
                          layout="position"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          key={message.id}
                          className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}
                        >
                          {!isUser && (
                            <div className="chat-message-avatar">
                              <Image src="/mascot.png" alt="" width={28} height={32} />
                            </div>
                          )}
                          <div className={`min-w-0 ${isUser ? 'max-w-[80%]' : 'max-w-[780px] flex-1'}`}>
                            <div className="mb-1.5 text-xs font-medium text-[var(--text-secondary)]">
                              {isUser ? 'You' : 'OShift'}
                            </div>
                            <div
                              className={
                                isUser
                                  ? 'chat-user-bubble'
                                  : `chat-assistant-copy ${message.isQuestion ? 'question' : ''}`
                              }
                            >
                              {/* Seamless agent activity BEFORE response */}
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
                                <UserChatMessageContent content={message.content} context={message.context ?? []} />
                              ) : message.content ? (
                                <>
                                  <MessageContext items={message.context ?? []} />
                                  <ChatMarkdown content={message.content} streaming={message.isStreaming} />
                                </>
                              ) : null}

                              {message.isQuestion && (
                                <p className="chat-message-note">Reply below to continue this analysis.</p>
                              )}
                              {message.isRetryable && (
                                <p className="chat-message-note">Send <strong>continue</strong> to resume from where it stopped.</p>
                              )}
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>

                  {error && (
                    <div className="chat-error">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>
              <div className="chat-dock">
                <div className="mx-auto w-full max-w-4xl px-5 md:px-10">{composer}</div>
              </div>
            </>
          )}
        </section>

        {/* Coherent Chat History Sidebar (Harmonized with Left App Sidebar) */}
        <AnimatePresence initial={false}>
          {historyOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="chat-history"
            >
              <div className="w-[300px] flex flex-col h-full">
                <div className="sidebar-header" style={{ padding: '16px 16px 12px' }}>
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--text-primary)]">
                    <History className="h-4 w-4 text-[var(--accent)]" />
                    <span>Chat History</span>
                  </div>
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="collapse-btn"
                    title="Start new conversation"
                    aria-label="Start new conversation"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-3 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search chats…"
                      className="chat-history-search"
                    />
                  </div>
                </div>

                <div className="nav-label" style={{ margin: '0 0 6px 4px' }}>
                  RECENT CONVERSATIONS
                </div>

                <div className="sidebar-scroll-area flex-1 py-1 space-y-1">
                  {conversations.length === 0 && isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-[var(--text-secondary)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />Loading…
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[var(--text-secondary)]">
                      No conversations found.
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const isActive = conversation.id === currentConversationId;
                      return (
                        <div
                          key={conversation.id}
                          className={`nav-item group relative flex items-center justify-between ${
                            isActive ? 'active' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              void loadConversation(conversation.id);
                              setHistoryOpen(false);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus:outline-none"
                          >
                            <MessageSquare className="nav-icon shrink-0" />
                            <span className="truncate pr-2">{conversation.title || 'Untitled chat'}</span>
                          </button>

                          {/* Delete Chat Button (triggers confirm popup) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({
                                id: conversation.id,
                                title: conversation.title || 'Untitled chat',
                              });
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/20 text-[var(--text-secondary)] hover:text-red-400 focus:outline-none"
                            title="Delete chat"
                            aria-label={`Delete chat ${conversation.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Confirmation Modal: "Are you sure?" Popup (PORTALED TO BODY) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {deleteTarget && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">Delete Chat?</h3>
                      <p className="text-xs text-[var(--text-secondary)]">This action cannot be undone.</p>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                    Are you sure you want to delete <strong className="text-[var(--text-primary)] font-medium">&quot;{deleteTarget.title}&quot;</strong>?
                  </p>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(null)}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteConfirm()}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/90 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-500/20"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
