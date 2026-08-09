// oshift/src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAgentChat } from '@/hooks/use-agent-chat';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import {
  Plus,
  Send,
  Square,
  Search,
  AlertCircle,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="flex-1 w-full h-full flex bg-[var(--bg-main-alt)] overflow-hidden relative">
      
      {/* Main Chat Window (Center Area) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Floating Toggle Button when Right Sidebar is Collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] shadow-sm transition-all cursor-pointer"
            title="Expand Chat History"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        )}

        {/* Chat Feed or Gemini Center Landing */}
        {messages.length === 0 ? (
          /* Gemini-style Initial State: Centered Greeting & Prompt */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center relative">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-2xl flex flex-col items-center text-center space-y-8 my-auto"
            >
              {/* Unclipped Mascot Avatar Icon */}
              <div className="w-24 h-24 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 shadow-sm flex items-center justify-center">
                <img src="/mascot.png" alt="OShift Mascot" className="w-full h-full object-contain" />
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] font-sans">
                Ask away!
              </h2>

              {/* Centered Input Box */}
              <div className="w-full relative flex flex-col border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl shadow-sm focus-within:border-[var(--text-secondary)] transition-all">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask OShift agent anything about market signals, competitors, campaigns..."
                  className="w-full resize-none bg-transparent px-6 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
                />

                <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg-alt)] rounded-b-2xl">
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Press Enter to send</span>
                  <button
                    onClick={handleSend}
                    disabled={!inputVal.trim() || isStreaming}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <span>Ask</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                {[
                  'Who are our active competitors?',
                  'Analyze recent market signals',
                  'Find partnership opportunities',
                  'Summarize campaign strategies',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="border border-[var(--border-color)] bg-[var(--card-bg)] p-4 rounded-xl text-left text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-all shadow-sm cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Active Chat Thread View */
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-semibold tracking-wide">
                      {isUser ? (
                        <span>You</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-0.5 shrink-0 flex items-center justify-center">
                            <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain" />
                          </div>
                          <span>Agent</span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`w-full max-w-2xl p-5 text-sm leading-relaxed rounded-xl border ${
                        isUser
                          ? 'border-[var(--border-color)] bg-[var(--card-bg-alt)] text-[var(--text-primary)]'
                          : 'border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)]'
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

              {/* Thinking State */}
              {isThinking && (
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-semibold">
                    <div className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-0.5 shrink-0 flex items-center justify-center">
                      <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain" />
                    </div>
                    <span>Processing</span>
                  </div>
                  <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-4 rounded-xl text-xs flex items-center gap-3 text-[var(--text-secondary)]">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--text-primary)]" />
                    <span>Analyzing data streams...</span>
                  </div>
                </div>
              )}

              {/* Active Tool Badge (Clean border, no AI slop glow) */}
              {activeTool && (
                <div className="flex items-start gap-2">
                  <div className="border border-[var(--border-color)] bg-[var(--card-bg-alt)] px-3 py-1.5 rounded-md text-xs font-mono text-[var(--text-secondary)]">
                    Executing: <span className="text-[var(--text-primary)] font-semibold">{activeTool}</span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="border border-red-500/40 bg-[var(--card-bg)] p-4 rounded-lg text-xs flex items-center gap-3 text-[var(--text-primary)]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Bottom Floating Input Bar when conversation is active */}
        {messages.length > 0 && (
          <div className="p-4 md:p-6 bg-[var(--card-bg)] border-t border-[var(--border-color)] shrink-0">
            <div className="max-w-3xl mx-auto relative flex flex-col border border-[var(--border-color)] bg-[var(--bg-main-alt)] rounded-xl focus-within:border-[var(--text-secondary)] transition-all">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask follow-up question..."
                className="w-full resize-none bg-transparent px-5 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
              />

              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-color)] bg-[var(--card-bg-alt)] rounded-b-xl">
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">Press Enter to submit</span>
                {isStreaming ? (
                  <button
                    onClick={stop}
                    className="flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span>Halt</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputVal.trim()}
                    className="flex items-center gap-2 px-4 py-1 rounded-md bg-[var(--text-primary)] text-[var(--card-bg)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar (Collapsible Sessions Drawer) */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="h-full bg-[var(--card-bg)] border-l border-[var(--border-color)] flex flex-col shrink-0 overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-xs uppercase tracking-wider">
                <MessageSquare className="h-4 w-4 text-[var(--text-secondary)]" />
                <span>Chat History</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => createConversation()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--card-bg-alt)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
                  title="New Chat"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New</span>
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--item-hover)] transition-colors cursor-pointer"
                  title="Hide History"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-main-alt)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition focus:border-[var(--text-secondary)]"
                />
              </div>
            </div>

            {/* Conversation Session List */}
            <div className="flex-1 space-y-1 overflow-y-auto p-3 pt-1">
              {conversations.length === 0 && isLoading ? (
                <div className="flex items-center justify-center py-6 text-xs text-[var(--text-secondary)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  Loading sessions...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                  No chat history
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === currentConversationId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-all border ${
                        isActive
                          ? 'border-[var(--border-color)] bg-[var(--card-bg-alt)] text-[var(--text-primary)] font-semibold'
                          : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--item-hover)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="truncate">{conv.title || 'Untitled Session'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-[var(--bg-main-alt)]">
          <Loader2 className="w-7 h-7 animate-spin text-[var(--text-secondary)]" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}


