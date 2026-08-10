'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import { cleanMessageContent } from '@/lib/utils/chat';
import { sseStream } from '@/lib/api';
import { Trash2, X, User } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

function formatEntityContext(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node !== 'object') return String(node);

  const lines: string[] = [];
  if (node.id) lines.push(`- ID: ${node.id}`);
  if (node.label || node.title || node.name) {
    lines.push(`- Name/Title: ${node.label || node.title || node.name}`);
  }
  if (node.type || node.category) lines.push(`- Type: ${node.type || node.category}`);
  if (node.domain) lines.push(`- Domain: ${node.domain}`);
  if (node.description || node.summary || node.desc) {
    lines.push(`- Summary: ${node.description || node.summary || node.desc}`);
  }

  const skipKeys = new Set([
    'id', 'label', 'title', 'name', 'type', 'category', 'domain',
    'description', 'summary', 'desc', 'x', 'y', 'vx', 'vy', 'fx', 'fy',
    'index', '__typename'
  ]);

  for (const [key, val] of Object.entries(node)) {
    if (skipKeys.has(key)) continue;
    if (val !== undefined && val !== null) {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        lines.push(`- ${key}: ${val}`);
      } else if (typeof val === 'object') {
        try {
          lines.push(`- ${key}: ${JSON.stringify(val)}`);
        } catch {
          // ignore circular references
        }
      }
    }
  }

  return lines.join('\n');
}

function extractTextFromSseEvent(event: any): string {
  if (!event) return '';
  if (event.type === 'tool_call' || event.type === 'tool_result' || event.type === 'conversation_id') {
    return '';
  }
  const data = event.data;
  if (!data) {
    return typeof event.raw === 'string' && event.raw !== '[DONE]' ? event.raw : '';
  }
  if (typeof data === 'string') {
    return data;
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, any>;
    if (typeof obj.content === 'string') return obj.content;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.delta === 'string') return obj.delta;
    if (typeof obj.chunk === 'string') return obj.chunk;
    if (typeof obj.message === 'string') return obj.message;
    if (obj.message && typeof obj.message === 'object' && typeof obj.message.content === 'string') {
      return obj.message.content;
    }
    if (obj.delta && typeof obj.delta === 'object' && typeof obj.delta.content === 'string') {
      return obj.delta.content;
    }
  }
  return '';
}



interface PromptFieldProps {
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  commandActive: boolean;
  setCommandActive: (active: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Auto-scroll chat body to bottom when messages or streaming content changes
  const scrollToBottom = useCallback(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isLoading, scrollToBottom]);

  // Auto-focus input when command bar opens
  useEffect(() => {
    if (commandActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandActive]);

  // ESC key closes the bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && commandActive) {
        closeAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandActive]);

  const closeAll = () => {
    setCommandActive(false);
    setSidebarCollapsed(true);
  };

  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (commandActive) {
      closeAll();
    } else {
      setCommandActive(true);
    }
  };

  const handleCloseChip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(null);
    setSidebarCollapsed(true);
  };

  const handleClearChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages([]);
    setConversationId(null);
    setStreamingText('');
  };

  const setThinkingActive = useCallback((active: boolean) => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('is-thinking-active', active);
    }
    if (onThinkingChange) {
      onThinkingChange(active);
    }
  }, [onThinkingChange]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const content = (textToSend ?? inputVal).trim();
      if (!content || isLoading) return;

      setCommandActive(true);
      setInputVal('');
      if (inputRef.current) inputRef.current.value = '';

      if (onSubmit) {
        onSubmit(content);
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setStreamingText('');
      setThinkingActive(true);

      // Build context payload if an entity/node is attached (invisible to user in chat bubble UI)
      let payloadContent = content;
      if (selectedNode) {
        const entityLabel = selectedNode.label || selectedNode.title || selectedNode.name || 'Attached Entity';
        const entityDetails = formatEntityContext(selectedNode);
        payloadContent = `[Attached Context - Entity: "${entityLabel}"]\n${entityDetails}\n\nUser Message: ${content}`;
      }

      try {
        const stream = sseStream('/v1/agent/chat', {
          content: payloadContent,
          ...(conversationId ? { conversation_id: conversationId } : {}),
        });

        let assistantAccumulator = '';
        let initialTokenReceived = false;
        const executedTools: string[] = [];

        for await (const event of stream) {
          if (event.type === 'conversation_id') {
            setConversationId(event.data as string);
            continue;
          }

          if (event.type === 'tool_call') {
            const toolName = (event.data as { tool?: string })?.tool || 'action';
            if (!executedTools.includes(toolName)) {
              executedTools.push(toolName);
            }
            if (!initialTokenReceived) {
              setThinkingActive(false);
            }
            // Display live tool execution status while agent works
            if (!assistantAccumulator) {
              setStreamingText(`⚙️ *Executing ${toolName}...*`);
            }
            continue;
          }

          if (event.type === 'tool_result') {
            continue;
          }

          if (event.type === 'error') {
            setThinkingActive(false);
            const d = event.data as Record<string, any>;
            const errContent =
              (typeof d === 'object' && (d?.content || d?.body || d?.statusText)) ||
              (typeof d === 'string' ? d : 'Agent error');
            if (!assistantAccumulator) {
              assistantAccumulator = `⚠️ **Error**: ${errContent}`;
              setStreamingText(assistantAccumulator);
            }
            continue;
          }

          const chunk = extractTextFromSseEvent(event);
          if (chunk) {
            if (!initialTokenReceived) {
              initialTokenReceived = true;
              setThinkingActive(false);
            }
            assistantAccumulator += chunk;
            const cleaned = cleanMessageContent(assistantAccumulator);
            setStreamingText(cleaned || assistantAccumulator);
          }
        }

        const finalCleaned = cleanMessageContent(assistantAccumulator);
        if (finalCleaned) {
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: finalCleaned,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else if (executedTools.length > 0) {
          const entityName = selectedNode?.label || selectedNode?.title || selectedNode?.name || '';
          const toolList = executedTools.join(', ');
          const summary = entityName
            ? `Successfully completed analysis and data updates for **${entityName}** (\`${toolList}\`).`
            : `Successfully completed agent actions (\`${toolList}\`).`;
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: summary,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else if (assistantAccumulator.trim()) {
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: assistantAccumulator.trim(),
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          const fallbackMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Successfully processed your request.',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, fallbackMsg]);
        }
      } catch (e) {
        setThinkingActive(false);
        const errMsg = e instanceof Error ? e.message : String(e);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Network Error: ${errMsg}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setStreamingText('');
        setThinkingActive(false);
      }
    },
    [inputVal, isLoading, conversationId, selectedNode, onSubmit, setCommandActive, setThinkingActive]
  );





  const handleSuggestionClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // const showChatWindow = commandActive || messages.length > 0;

  return (
    <>
      {/* Mascot Image */}
      <img
        src="/mascot.png"
        id="mascot-img"
        className={
          !commandActive
            ? 'mascot-idle'
            : selectedNode
              ? 'mascot-active has-chip'
              : 'mascot-active'
        }
        alt="PShift Mascot"
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
        {(messages.length > 0 || isLoading) && (
          <div
            className="chat-window"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="chat-header">
              <div className="chat-title-group">
                <img src="/mascot.png" alt="OShift Mascot" />
                <span>OShift Assistant</span>
              </div>
              <div className="chat-header-actions">
                {messages.length > 0 && (
                  <button
                    className="chat-header-btn"
                    onClick={handleClearChat}
                    title="Clear chat history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  className="chat-header-btn"
                  onClick={closeAll}
                  title="Close chat"
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

              {messages.length === 0 && !isLoading && (
                <div className="text-center py-6 px-4 text-xs text-[var(--text-secondary)] italic">
                  Ask OShift Assistant about your competitors, market insights, campaigns, or partnerships...
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message-wrapper ${msg.role}`}
                >
                  <div
                    className={`chat-avatar-icon ${
                      msg.role === 'assistant' ? 'assistant-avatar' : 'user-avatar'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <img src="/mascot.png" alt="Assistant" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div
                    className={`chat-bubble ${
                      msg.role === 'user'
                        ? 'user-bubble'
                        : msg.isError
                        ? 'error-bubble'
                        : 'assistant-bubble'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <span>{msg.content}</span>
                    ) : (
                      <ChatMarkdown content={msg.content} />
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming Assistant Response */}
              {isLoading && (
                <div className="chat-message-wrapper assistant">
                  <div className="chat-avatar-icon assistant-avatar">
                    <img src="/mascot.png" alt="Assistant" />
                  </div>
                  <div className="chat-bubble assistant-bubble">
                    {streamingText ? (
                      <ChatMarkdown content={streamingText} streaming />
                    ) : (
                      <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className={`suggestions ${commandActive && selectedNode ? 'visible' : ''}`}>
          <div className="sugg-btn-container">
            <button
              className="sugg-btn"
              onClick={() =>
                handleSuggestionClick('Discover and analyze all top competitors')
              }
            >
              Discover and analyze top competitors{' '}
              <span className="num">1</span>
            </button>
          </div>
          <div className="sugg-btn-container">
            <button
              className="sugg-btn"
              onClick={() =>
                handleSuggestionClick('Summarize competitor marketing strategy')
              }
            >
              Summarize competitor strategy{' '}
              <span className="num">2</span>
            </button>
          </div>
        </div>

        {/* Command Input Bar */}
        <div className="command-bar-container">
          <div className="glow-wrapper">
            <div className="glow-blob"></div>
          </div>
          <div className="command-bar">
            {/* Context chip — shown when a node is selected */}
            <div
              className="context-chip-row"
              style={{ display: selectedNode ? 'block' : 'none' }}
            >
              <div className="context-chip">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--accent)' }}
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>{selectedNode?.label ?? selectedNode?.title ?? 'Node'}</span>
                <button className="cc-close" onClick={handleCloseChip}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <input
              type="text"
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="What would you like to ask or create?"
              onFocus={() => setCommandActive(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            <div className="controls-row">
              <div className="left-controls">
                <button className="icon-btn-cb" type="button" title="Attach context">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              <div className="right-controls">
                <button className="icon-btn-cb" type="button" title="Voice input">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </button>
                <button
                  className="submit-btn-cb"
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputVal.trim()}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
