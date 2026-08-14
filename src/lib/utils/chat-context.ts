export type ChatContextKind = 'competitor' | 'campaign' | 'opportunity' | 'partnership';

export interface ChatContextItem {
  id: string;
  kind: ChatContextKind;
  label: string;
  subtitle?: string;
  logo?: string;
}

const CONTEXT_OPEN = '<oshift_context>';
const CONTEXT_CLOSE = '</oshift_context>';

/**
 * The current agent endpoint only accepts a single `content` string. Keep the
 * context machine-readable for the agent, while the chat UI stores and renders
 * the human message separately. This can become a first-class request field
 * without changing the composer when the API adds one.
 */
export function serializeChatMessage(content: string, context: ChatContextItem[]): string {
  if (context.length === 0) return content.trim();

  const references = context.map(({ id, kind, label }) => ({ id, type: kind, label }));
  return `${content.trim()}\n\n${CONTEXT_OPEN}\n${JSON.stringify(references)}\n${CONTEXT_CLOSE}`;
}

export function parseStoredChatMessage(content: string): {
  content: string;
  context: ChatContextItem[];
} {
  const start = content.lastIndexOf(`\n\n${CONTEXT_OPEN}\n`);
  if (start === -1 || !content.endsWith(`\n${CONTEXT_CLOSE}`)) {
    return { content, context: [] };
  }

  const jsonStart = start + `\n\n${CONTEXT_OPEN}\n`.length;
  const jsonEnd = content.length - `\n${CONTEXT_CLOSE}`.length;

  try {
    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd)) as Array<{
      id: string;
      type: ChatContextKind;
      label: string;
    }>;
    return {
      content: content.slice(0, start),
      context: parsed.map((item) => ({ id: item.id, kind: item.type, label: item.label })),
    };
  } catch {
    return { content, context: [] };
  }
}

export interface MentionSegment {
  type: 'mention';
  raw: string;
  label: string;
  item?: ChatContextItem;
}

export interface TextSegment {
  type: 'text';
  text: string;
}

export type MessageSegment = MentionSegment | TextSegment;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits message text into plain text chunks and inline mention tokens.
 * Matches known context items first (handling multi-word entity names),
 * then falls back to generic `@tag` patterns while preserving punctuation.
 */
export function parseMessageSegments(
  content: string,
  context: ChatContextItem[] = []
): MessageSegment[] {
  if (!content) return [];

  // Context lookup map by lowercase label
  const contextByLabel = new Map<string, ChatContextItem>();
  for (const item of context) {
    contextByLabel.set(item.label.trim().toLowerCase(), item);
  }

  // Sort context labels by length descending so longer phrases match first
  const sortedLabels = [...context]
    .map((c) => c.label.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  // Build pattern for known context labels + bracketed mentions + standard @words
  const labelPatterns = sortedLabels.map((l) => escapeRegex(l));
  const patternParts = [
    '@\\[([^\\]]+)\\]', // @[Multi Word Entity]
    ...(labelPatterns.length > 0 ? [`@(${labelPatterns.join('|')})`] : []),
    '@([a-zA-Z0-9_\\-]+)', // Standard @word
  ];

  const mentionRegex = new RegExp(patternParts.join('|'), 'gi');
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(content)) !== null) {
    const matchStart = match.index;
    const matchEnd = mentionRegex.lastIndex;

    // Push text preceding the match if non-empty
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        text: content.slice(lastIndex, matchStart),
      });
    }

    // Extract raw match and matched label
    const rawMatch = match[0];
    let label = (match[1] || match[2] || match[3] || rawMatch.slice(1)).trim();

    // Check if trailing punctuation was captured in word matches
    let trailingPunct = '';
    const punctMatch = label.match(/([.,!?:;)]+)$/);
    if (punctMatch && !contextByLabel.has(label.toLowerCase())) {
      trailingPunct = punctMatch[1];
      label = label.slice(0, -trailingPunct.length);
    }

    const matchedItem = contextByLabel.get(label.toLowerCase());

    segments.push({
      type: 'mention',
      raw: `@${label}`,
      label: matchedItem ? matchedItem.label : label,
      item: matchedItem,
    });

    if (trailingPunct) {
      segments.push({
        type: 'text',
        text: trailingPunct,
      });
    }

    lastIndex = matchEnd;
  }

  // Push any remaining text after the last match
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      text: content.slice(lastIndex),
    });
  }

  return segments;
}
