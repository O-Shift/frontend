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
