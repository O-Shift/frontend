// oshift/src/hooks/use-agent-chat.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch, sseStream } from '@/lib/api';
import { ConversationOut, ConversationHistory, MessageOut } from '@/types/entities';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  isError?: boolean;
  /** The agent paused on ask_user_question; answering resumes the same conversation. */
  isQuestion?: boolean;
  /** Backend marked the error resumable — the user can say "continue". */
  isRetryable?: boolean;
}

function toActiveVerb(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith('ing')) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  if (lower === 'get') return 'Getting';
  if (lower === 'run') return 'Running';
  if (lower === 'set') return 'Setting';
  if (lower.endsWith('e') && !lower.endsWith('ee')) {
    return word.slice(0, -1).charAt(0).toUpperCase() + word.slice(1, -1).toLowerCase() + 'ing';
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + 'ing';
}

export function formatToolName(rawTool: string): string {
  const map: Record<string, string> = {
    scrape_competitor: 'Scraping competitor website...',
    register_competitor: 'Registering competitor profile...',
    discover_competitors: 'Discovering market competitors...',
    search_web: 'Searching web intelligence sources...',
    collect_social_posts: 'Collecting social media posts...',
    generate_brief: 'Generating intelligence brief...',
    analyze_video: 'Analyzing video content...',
    query_graph: 'Searching graph memory...',
    run_insights: 'Running market insight engines...',
    trigger_pipeline: 'Triggering execution pipeline...',
    fetch_signals: 'Fetching market signals...',
    get_battlecard: 'Fetching competitor battlecard...',
    query_relationship_graph: 'Querying relationship graph...',
  };
  if (map[rawTool]) return map[rawTool];

  // Active verb fallback conversion (e.g. analyze_market_position -> Analyzing Market Position...)
  const parts = rawTool.split('_').filter(Boolean);
  if (parts.length > 0) {
    parts[0] = toActiveVerb(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase();
    }
  }
  return parts.join(' ') + '...';
}

function deriveTitle(prompt: string): string {
  const cleaned = prompt.trim().replace(/^[^a-zA-Z0-9]+/, '');
  if (!cleaned) return 'Market Query';
  const firstLine = cleaned.split('\n')[0];
  if (firstLine.length <= 35) return firstLine;
  return firstLine.slice(0, 35).trim() + '...';
}

export interface ToolStep {
  /** Backend tool_call id, so a fan-out of one tool doesn't collapse into a single row. */
  id: string;
  label: string;
  done: boolean;
}

export function useAgentChat(initialConversationId?: string | null) {
  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  /**
   * Completed work for the turn in progress, cleared on the next send.
   *
   * A spinner keeps spinning when a stream dies, so it cannot distinguish
   * "working" from "hung" — which is why a long turn read as broken. Finished
   * steps are evidence, and the backend already emits one per tool_result.
   */
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  /** When the current turn started, for the elapsed counter. null when idle. */
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationCacheRef = useRef<Map<string, ChatMessage[]>>(new Map());

  // Fetch conversations list in background
  const fetchConversations = useCallback(async () => {
    const res = await apiFetch<ConversationOut[]>('/agent/conversations');
    if (res.ok) {
      setConversations(res.data);
    }
  }, []);

  // Instant (0ms) local chat switching with background sync
  const loadConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id);
    setError(null);

    // Render from memory cache instantly
    if (conversationCacheRef.current.has(id)) {
      setMessages(conversationCacheRef.current.get(id)!);
    } else {
      setMessages([]);
    }

    setIsLoading(true);
    const res = await apiFetch<ConversationHistory>(`/agent/conversations/${id}`);
    if (res.ok) {
      const mappedMsgs: ChatMessage[] = res.data.messages.map((m: MessageOut) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: m.created_at,
      }));
      conversationCacheRef.current.set(id, mappedMsgs);
      setMessages(mappedMsgs);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, []);

  // Instant (0ms) new chat creation reset
  const createConversation = useCallback((customTitle?: string) => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // Stop active streaming
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsThinking(false);
    setActiveTool(null);
    setTurnStartedAt(null);
  }, []);

  // Send message: instant sidebar insertion, active highlighting, & zero-latency SSE token streaming
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      stop();

      const autoTitle = deriveTitle(trimmed);
      const userMsgId = `user-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      // Determine active or instant temporary conversation ID
      let targetConvId = currentConversationId;
      const isNewChat = !targetConvId;
      if (isNewChat) {
        targetConvId = `conv-${Date.now()}`;
        setCurrentConversationId(targetConvId);
      }

      // Immediately insert into client-side conversations history & highlight
      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === targetConvId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          if (updated[existingIdx].title === 'New Conversation' || updated[existingIdx].title === '[Agent]') {
            updated[existingIdx] = { ...updated[existingIdx], title: autoTitle };
          }
          return updated;
        }
        return [
          {
            id: targetConvId!,
            workspace_id: '',
            user_id: '',
            title: autoTitle,
            model: 'moonshotai/Kimi-K2.6',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ];
      });

      setMessages((prev) => {
        const next = isNewChat ? [userMsg] : [...prev, userMsg];
        if (targetConvId) {
          conversationCacheRef.current.set(targetConvId, next);
        }
        return next;
      });

      setIsStreaming(true);
      setIsThinking(true);
      setActiveTool(null);
      setToolSteps([]);
      setTurnStartedAt(Date.now());

      const assistantMsgId = `asst-${Date.now()}`;
      let fullResponseText = '';
      let activeRealConvId = targetConvId!;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Direct zero-latency SSE connection to Dahl stream
        const stream = sseStream(
          '/agent/chat',
          {
            content: trimmed,
            ...(isNewChat ? {} : { conversation_id: targetConvId }),
          },
          controller.signal
        );

        for await (const event of stream) {
          if (event.type === 'ping') {
            setIsThinking(true);
            continue;
          }

          if (event.type === 'conversation_id') {
            const cid = typeof event.data === 'string' ? event.data : String(event.data);
            const oldId = activeRealConvId;
            activeRealConvId = cid;

            setCurrentConversationId(cid);
            setConversations((prev) =>
              prev.map((c) => (c.id === oldId ? { ...c, id: cid } : c))
            );

            if (conversationCacheRef.current.has(oldId)) {
              const cached = conversationCacheRef.current.get(oldId)!;
              conversationCacheRef.current.delete(oldId);
              conversationCacheRef.current.set(cid, cached);
            }
            continue;
          }

          if (event.type === 'tool_call') {
            setIsThinking(false);
            const dataObj = event.data as Record<string, unknown>;
            const rawTool = (dataObj?.tool as string) || 'action';
            const formatted = formatToolName(rawTool);
            setActiveTool(formatted);
            // Key on the backend's tool_call id, not the name: the orchestrator
            // routinely fans one tool out across parallel calls, and pairing by
            // name would collapse or mis-resolve them.
            const callId = typeof dataObj?.id === 'string' ? dataObj.id : `${rawTool}-${Date.now()}`;
            setToolSteps((prev) =>
              prev.some((s) => s.id === callId)
                ? prev
                : [...prev, { id: callId, label: formatted.replace(/\.\.\.$/, ''), done: false }]
            );
            continue;
          }

          if (event.type === 'tool_result') {
            const dataObj = event.data as Record<string, unknown>;
            const toolExecuted = (dataObj?.tool as string) || '';
            if (typeof window !== 'undefined' && toolExecuted) {
              window.dispatchEvent(
                new CustomEvent('oshift:tool_executed', { detail: { tool: toolExecuted } })
              );
            }
            const doneId = typeof dataObj?.id === 'string' ? dataObj.id : '';
            if (doneId) {
              setToolSteps((prev) =>
                prev.map((s) => (s.id === doneId ? { ...s, done: true } : s))
              );
            }
            setActiveTool(null);
            // A finished tool hands straight back to the model, which then thinks
            // before its next token. Clearing the tool badge without restoring
            // this leaves the UI blank for that whole stretch — with a 50-call
            // budget that blank is most of a long turn, and it reads as a hang.
            setIsThinking(true);
            continue;
          }

          if (event.type === 'token') {
            setIsThinking(false);
            const dataObj = event.data as Record<string, unknown>;
            const tokenStr = typeof dataObj?.content === 'string' ? dataObj.content : '';
            if (tokenStr) {
              fullResponseText += tokenStr;

              // Direct real-time token rendering
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== assistantMsgId);
                const updated = [
                  ...filtered,
                  {
                    id: assistantMsgId,
                    role: 'assistant' as const,
                    content: fullResponseText,
                    timestamp: new Date().toISOString(),
                    isStreaming: true,
                  },
                ];
                if (activeRealConvId) {
                  conversationCacheRef.current.set(activeRealConvId, updated);
                }
                return updated;
              });
            }
            continue;
          }

          // ask_user_question pauses the loop and the backend returns right after
          // this event, having already persisted the question. Nothing handled it
          // before, so the agent asking anything looked like the stream dying
          // mid-turn. Render it as the assistant's turn; the next sendMessage
          // resumes the same conversation_id, which is how the backend expects
          // the answer to arrive.
          if (event.type === 'question') {
            setIsThinking(false);
            setActiveTool(null);
            const dataObj = event.data as Record<string, unknown>;
            const questionStr =
              typeof dataObj?.content === 'string' ? dataObj.content : 'Waiting for your input.';
            const questionId =
              typeof dataObj?.message_id === 'string' ? dataObj.message_id : `q-${assistantMsgId}`;
            setMessages((prev) => {
              // Keep whatever text already streamed this turn: the model often
              // explains itself and then asks, and dropping the explanation
              // leaves a bare question with no context.
              const updated = [
                ...prev.filter((m) => m.id !== assistantMsgId),
                ...(fullResponseText
                  ? [
                      {
                        id: assistantMsgId,
                        role: 'assistant' as const,
                        content: fullResponseText,
                        timestamp: new Date().toISOString(),
                      },
                    ]
                  : []),
                {
                  id: questionId,
                  role: 'assistant' as const,
                  content: questionStr,
                  timestamp: new Date().toISOString(),
                  isQuestion: true,
                },
              ];
              if (activeRealConvId) {
                conversationCacheRef.current.set(activeRealConvId, updated);
              }
              return updated;
            });
            break;
          }

          if (event.type === 'error') {
            setIsThinking(false);
            setActiveTool(null);
            const dataObj = event.data as Record<string, unknown>;
            const errStr = typeof dataObj?.content === 'string' ? dataObj.content : 'Streaming error';
            const retryable = dataObj?.retryable === true;
            setError(errStr);
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== assistantMsgId);
              const updated = [
                ...filtered,
                {
                  id: assistantMsgId,
                  role: 'assistant' as const,
                  content: fullResponseText ? `${fullResponseText}\n\n⚠️ *${errStr}*` : `⚠️ ${errStr}`,
                  timestamp: new Date().toISOString(),
                  isError: true,
                  isRetryable: retryable,
                },
              ];
              if (activeRealConvId) {
                conversationCacheRef.current.set(activeRealConvId, updated);
              }
              return updated;
            });
            break;
          }

          if (event.type === 'done') {
            setIsThinking(false);
            break;
          }

          if (event.type === 'raw' && typeof event.data === 'string' && event.data !== '[DONE]') {
            setIsThinking(false);
            fullResponseText += event.data;
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== assistantMsgId);
              const updated = [
                ...filtered,
                {
                  id: assistantMsgId,
                  role: 'assistant' as const,
                  content: fullResponseText,
                  timestamp: new Date().toISOString(),
                  isStreaming: true,
                },
              ];
              if (activeRealConvId) {
                conversationCacheRef.current.set(activeRealConvId, updated);
              }
              return updated;
            });
          }
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'Network error';
          setError(msg);
        }
      } finally {
        setIsStreaming(false);
        setIsThinking(false);
        setActiveTool(null);
        setTurnStartedAt(null);
        abortControllerRef.current = null;

        setMessages((prev) => {
          const finalized = prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false, isThinking: false } : m
          );
          if (activeRealConvId) {
            conversationCacheRef.current.set(activeRealConvId, finalized);
          }
          return finalized;
        });

        // Background non-blocking sync of conversations list
        fetchConversations();
      }
    },
    [currentConversationId, isStreaming, stop, fetchConversations]
  );

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
  }, [fetchConversations]);

  return {
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
    sendMessage,
    stop,
    refreshConversations: fetchConversations,
  };
}
