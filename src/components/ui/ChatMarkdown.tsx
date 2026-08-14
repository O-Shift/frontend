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
    <div className="chat-markdown-container text-[15.5px] md:text-[16px] leading-[1.75] overflow-x-auto text-[var(--text-primary)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-4 w-full overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
              <table className="w-full text-left border-collapse text-sm md:text-[15px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-[var(--border-color)] font-semibold text-[var(--text-primary)] bg-[var(--card-bg-alt)]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-[var(--border-color)]">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2.5 font-semibold whitespace-nowrap text-[var(--text-secondary)]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 align-top text-[var(--text-primary)] leading-relaxed">{children}</td>
          ),
          p: ({ children }) => (
            <p className="leading-[1.75] mb-4 last:mb-0 text-[var(--text-primary)]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-6 space-y-1.5 mb-4 last:mb-0 text-[var(--text-primary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-6 space-y-1.5 mb-4 last:mb-0 text-[var(--text-primary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-[1.75] pl-1">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-xl md:text-2xl font-bold mt-6 mb-3 first:mt-0 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg md:text-xl font-semibold mt-5 mb-2.5 first:mt-0 text-[var(--text-primary)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base md:text-lg font-semibold mt-4 mb-2 first:mt-0 text-[var(--text-primary)]">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--accent)] pl-4 py-1.5 my-4 italic text-[var(--text-secondary)] text-[15px] md:text-[15.5px]">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-[var(--card-bg-alt)] font-mono text-[13.5px] text-[var(--accent)] break-all border border-[var(--border-color)]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4 rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg-alt)]">
                {match ? (
                  <div className="px-4 py-1.5 text-[var(--text-secondary)] text-xs font-mono border-b border-[var(--border-color)] bg-black/20">
                    {match[1]}
                  </div>
                ) : null}
                <pre className="p-4 text-[var(--text-primary)] text-xs md:text-sm font-mono overflow-x-auto leading-relaxed">
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
                <ExternalLink className="h-3.5 w-3.5 inline shrink-0" />
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
