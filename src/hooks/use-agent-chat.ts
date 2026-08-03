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
            setActiveTool(null);
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

          if (event.type === 'error') {
            setIsThinking(false);
            const dataObj = event.data as Record<string, unknown>;
            const errStr = typeof dataObj?.content === 'string' ? dataObj.content : 'Streaming error';
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
    error,
    createConversation,
    loadConversation,
    sendMessage,
    stop,
    refreshConversations: fetchConversations,
  };
}
