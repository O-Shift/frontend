'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';
import { cleanMessageContent } from '@/lib/utils/chat';

interface ChatMarkdownProps {
  content: string;
}

export default function ChatMarkdown({ content }: ChatMarkdownProps) {
  const cleanedContent = cleanMessageContent(content);

  if (!cleanedContent) {
    return null;
  }

  return (
    <div className="chat-markdown-container text-xs md:text-sm leading-relaxed overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-2.5 w-full overflow-x-auto rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-alt)] shadow-sm">
              <table className="w-full text-left border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5 border-b border-[var(--border-color)] font-semibold text-[var(--text-primary)]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--border-color)]/60">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/5 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold uppercase tracking-wider text-[var(--text-secondary)] whitespace-nowrap text-[11px]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top text-[var(--text-primary)] leading-relaxed">
              {children}
            </td>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed mb-2 last:mb-0 text-[var(--text-primary)]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 space-y-1 mb-2 last:mb-0 text-[var(--text-primary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 space-y-1 mb-2 last:mb-0 text-[var(--text-primary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0 text-[var(--text-primary)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold mt-2.5 mb-1 first:mt-0 text-[var(--text-primary)]">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[var(--accent)] pl-3 py-1 my-2 bg-[var(--accent)]/10 rounded-r-md italic text-[var(--text-primary)]">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-[var(--accent)] font-medium break-all"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-2.5 rounded-lg overflow-hidden border border-[var(--border-color)] bg-black/40">
                {match && (
                  <div className="px-3 py-1 bg-white/5 text-[var(--text-secondary)] text-[10px] font-mono border-b border-[var(--border-color)]">
                    {match[1]}
                  </div>
                )}
                <pre className="p-2.5 text-[var(--text-primary)] text-[11px] font-mono overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1 break-all"
            >
              <span>{children}</span>
              <ExternalLink className="h-3 w-3 inline shrink-0" />
            </a>
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
}
