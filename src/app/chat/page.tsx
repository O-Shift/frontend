// oshift/src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAgentChat } from '@/hooks/use-agent-chat';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import {
  MessageSquare,
  Plus,
  Send,
  Square,
  Sparkles,
  Bot,
  User,
  Search,
  ChevronLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function ChatPage() {
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
    error,
    createConversation,
    loadConversation,
    sendMessage,
    stop,
  } = useAgentChat();

  const [inputVal, setInputVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoSentQuery, setAutoSentQuery] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of message list smoothly
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, isThinking, activeTool]);

  // Handle ?q= prompt parameter from URL
  useEffect(() => {
    if (initialQuery && !autoSentQuery && !isStreaming && !isLoading) {
      setAutoSentQuery(true);
      sendMessage(initialQuery);
    }
  }, [initialQuery, autoSentQuery, isStreaming, isLoading, sendMessage]);

  const handleSend = () => {
    if (!inputVal.trim() || isStreaming) return;
    const msg = inputVal;
    setInputVal('');
    sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || 'Untitled Conversation').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] font-sans shadow-lg">
      {/* Main Chat Window (Left Side) */}
      <div className="flex flex-1 flex-col bg-[var(--bg-main)]">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 shadow-sm">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Loading conversation messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
              <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4">
                <Bot className="h-10 w-10 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">OShift AI Intelligence Agent</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Ask me to analyze your competitors, scrape market signals, update partnership graphs, or generate briefs.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                {[
                  'Who are our active competitors?',
                  'Analyze recent market signals',
                  'Find partnership opportunities',
                  'Summarize campaign strategies',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 text-left text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition shadow-sm"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                      isUser
                        ? 'bg-[var(--accent)] text-white'
                        : 'border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--accent)]'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[var(--accent)] text-white font-medium rounded-tr-none shadow'
                        : 'border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] rounded-tl-none shadow-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ChatMarkdown content={msg.content} />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex items-center gap-3 max-w-3xl mr-auto pl-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--accent)] shadow-sm">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-xs text-[var(--text-secondary)] shadow-sm">
                <span className="font-medium text-[var(--accent)]">Thinking</span>
                <span className="flex space-x-1 items-center ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping delay-300" />
                </span>
              </div>
            </div>
          )}

          {/* User-Friendly Tool Status Badge */}
          {activeTool && (
            <div className="flex items-center gap-2 max-w-3xl mr-auto pl-11">
              <div className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3.5 py-1.5 text-xs text-[var(--accent)] font-medium shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{activeTool}</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 max-w-3xl mx-auto">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-[var(--border-color)] bg-[var(--card-bg)] p-3 md:p-4">
          <div className="relative flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] focus-within:border-[var(--accent)] transition">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the competitive intelligence agent..."
              className="w-full resize-none bg-transparent px-4 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
            />

            <div className="flex items-center gap-2 pr-3">
              {isStreaming ? (
                <button
                  onClick={stop}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                  title="Stop generating"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputVal.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white disabled:opacity-40 hover:opacity-90 transition active:scale-95"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversations History Sidebar (Right Side) */}
      <div className="flex w-72 flex-col border-l border-[var(--border-color)] bg-[var(--bg-sidebar)] p-3">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold text-sm">AI Conversations</h2>
          </div>
          <button
            onClick={() => createConversation()}
            className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
            title="Start new conversation"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {conversations.length === 0 && isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading history...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === currentConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-all ${
                    isActive
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold border border-[var(--accent)]/30 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--item-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{conv.title || 'Untitled Conversation'}</span>
                  </div>
                  <ChevronLeft className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
