'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';
import { cleanMessageContent } from '@/lib/utils/chat';
import { citationIndexFromTitle, transformCitations } from '@/lib/utils/citations';
import CitationChip from './CitationChip';

interface ChatMarkdownProps {
  content: string;
  /** While tokens are still arriving, so a half-typed citation marker is hidden. */
  streaming?: boolean;
}

export default function ChatMarkdown({ content, streaming = false }: ChatMarkdownProps) {
  const cleanedContent = cleanMessageContent(content);

  if (!cleanedContent) {
    return null;
  }

  // Citation markers become titled links here, then the `a` renderer below
  // turns those back into chips. Going through markdown rather than splitting
  // the string ourselves means a citation inside a table cell, a list item or
  // a bold run still lands in the right place.
  const { content: markdown, citations } = transformCitations(cleanedContent, { streaming });

  return (
    <div className="chat-markdown-container text-sm leading-relaxed overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-3 w-full overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
              <table className="w-full text-left border-collapse text-xs md:text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-[var(--border-color)] font-semibold text-[var(--text-primary)]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-[var(--border-color)]">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold whitespace-nowrap text-[var(--text-secondary)]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top text-[var(--text-primary)] leading-relaxed">{children}</td>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed mb-3 last:mb-0 text-[var(--text-primary)]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-1 mb-3 last:mb-0 text-[var(--text-primary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1 mb-3 last:mb-0 text-[var(--text-primary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0 text-[var(--text-primary)]">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0 text-[var(--text-primary)]">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--accent)] pl-3 py-1 my-3 italic text-[var(--text-secondary)]">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-[var(--card-bg-alt)] font-mono text-xs text-[var(--accent)] break-all"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-3 rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
                {match ? (
                  <div className="px-3 py-1 text-[var(--text-secondary)] text-[11px] font-mono border-b border-[var(--border-color)]">
                    {match[1]}
                  </div>
                ) : null}
                <pre className="p-3 text-[var(--text-primary)] text-xs font-mono overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          a: ({ href, title, children }) => {
            const citeIndex = citationIndexFromTitle(title);
            if (citeIndex !== null && href) {
              const cite = citations[citeIndex - 1];
              return (
                <CitationChip
                  index={citeIndex}
                  url={href}
                  label={cite?.label ?? String(children)}
                />
              );
            }
            return (
              <a
                href={href}
                title={title}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1 break-all"
              >
                <span>{children}</span>
                <ExternalLink className="h-3 w-3 inline shrink-0" />
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
