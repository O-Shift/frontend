// oshift/src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAgentChat } from '@/hooks/use-agent-chat';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import {
  MessageSquare,
  Plus,
  Send,
  Square,
  Bot,
  User,
  Search,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Terminal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, isThinking, activeTool]);

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
    (c.title || 'Untitled Session').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 w-full flex flex-col md:flex-row bg-[var(--bg-main-alt)] p-4 md:p-6 gap-6 h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className="flex w-full md:w-72 flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shrink-0">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-sm">
            <Terminal className="h-4 w-4 text-[var(--text-primary)]" />
            <h2>Sessions</h2>
          </div>
          <button
            onClick={() => createConversation()}
            className="flex items-center justify-center h-8 w-8 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition hover:bg-[var(--item-hover)]"
            title="Start new conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Filter sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-main-alt)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition focus:border-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 space-y-1 overflow-y-auto p-4 pt-2">
          {conversations.length === 0 && isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs font-semibold text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-xs font-semibold text-[var(--text-secondary)]">
              No sessions
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === currentConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-all border ${
                    isActive
                      ? 'border-[var(--border-color)] bg-[var(--item-hover)] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-main-alt)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate font-medium">{conv.title || 'Untitled Session'}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex flex-1 flex-col bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden relative shadow-sm">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
              <p className="text-sm text-[var(--text-secondary)] font-medium">Initializing connection...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto space-y-8">
              <div className="border border-[var(--border-color)] bg-[var(--bg-main-alt)] p-8 rounded-lg shadow-sm">
                <div className="w-12 h-12 rounded border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center mx-auto mb-4">
                    <Terminal className="h-6 w-6 text-[var(--text-primary)]" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">Intelligence Agent Ready</h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                  Await instructions. Analyze competitors, scrape market signals, update partnership graphs, or generate briefs.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
                {[
                  'Who are our active competitors?',
                  'Analyze recent market signals',
                  'Find partnership opportunities',
                  'Summarize campaign strategies',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="border border-[var(--border-color)] bg-[var(--card-bg)] p-4 rounded text-left text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-semibold tracking-wide">
                      {isUser ? (
                        <><span>You</span><User className="h-3.5 w-3.5" /></>
                      ) : (
                        <><div className="w-5 h-5 rounded border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center"><Bot className="h-3 w-3 text-[var(--text-primary)]" /></div><span>Agent</span></>
                      )}
                    </div>

                    <div
                      className={`relative w-full max-w-3xl p-5 text-sm leading-relaxed rounded-lg shadow-sm border ${
                        isUser
                          ? 'border-[var(--border-color)] bg-[var(--bg-main-alt)] text-[var(--text-primary)] rounded-tr-sm'
                          : 'border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] rounded-tl-sm'
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
              })}
            </div>
          )}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="max-w-4xl mx-auto w-full flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-semibold tracking-wide">
                <div className="w-5 h-5 rounded border border-[var(--border-color)] bg-[var(--card-bg-alt)] flex items-center justify-center"><Bot className="h-3 w-3 text-[var(--text-primary)]" /></div><span>System Processing</span>
              </div>
              <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-4 rounded-lg rounded-tl-sm text-sm flex items-center gap-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-secondary)]" />
                <span className="text-[var(--text-secondary)] font-medium">Analyzing data streams...</span>
              </div>
            </div>
          )}

          {/* Active Tool Badge */}
          {activeTool && (
            <div className="max-w-4xl mx-auto w-full flex flex-col items-start gap-2 mt-4">
              <div className="border border-[var(--border-color)] bg-[var(--card-bg-alt)] px-4 py-2 rounded text-xs font-medium flex items-center gap-2 shadow-sm">
                <Terminal className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                <span className="text-[var(--text-secondary)]">Executing: <span className="text-[var(--text-primary)]">{activeTool}</span></span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="max-w-4xl mx-auto w-full">
              <div className="border border-red-500/30 bg-[var(--card-bg)] p-4 rounded-md text-sm flex items-center gap-3 text-[var(--text-primary)]">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-6 pt-0 bg-[var(--card-bg)]">
          <div className="max-w-4xl mx-auto relative flex flex-col border border-[var(--border-color)] bg-[var(--bg-main-alt)] rounded-xl focus-within:border-[var(--text-secondary)] transition shadow-sm">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the intelligence agent..."
              className="w-full resize-none bg-transparent px-5 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
            />

            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
              <div className="text-xs font-medium text-[var(--text-secondary)]">
                Press Enter to submit
              </div>
              {isStreaming ? (
                <button
                  onClick={stop}
                  className="flex items-center gap-2 px-4 py-1.5 rounded bg-[var(--card-bg-alt)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Halt</span>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputVal.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 rounded bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:bg-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-main-alt)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
