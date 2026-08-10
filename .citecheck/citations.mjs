/**
 * Inline citations.
 *
 * The agent emits `[[cite:<url>|<label>]]` next to the specific claim a tool
 * result supports (see AGENT_V4 in the backend prompt). Rendering that raw is
 * unreadable, so this rewrites each marker into an ordinary markdown link and
 * moves the citation signal into the link *title*:
 *
 *     [[cite:https://a.com/x|Acme blog]]  ->  [Acme blog](<https://a.com/x> "cite:1")
 *
 * The title is the carrier because it is real markdown -- no sentinel strings
 * in visible text that a stray character could break, and no remark plugin to
 * maintain. `ChatMarkdown` looks for the `cite:` prefix and renders a compact
 * chip instead of a full link.
 *
 * Numbering follows first appearance and is per-message, so the same source
 * cited three times stays [1] all three times.
 */
const CITE_MARKER = /\[\[cite:\s*([^|\]]+?)\s*(?:\|\s*([^\]]*?)\s*)?\]\]/g;
/** A citation marker that is still arriving, token by token. */
const PARTIAL_CITE = /\[\[(?:c(?:i(?:t(?:e(?::[^\]]*)?)?)?)?)?$/;
export const CITE_TITLE_PREFIX = 'cite:';
/** Only http(s). A model-supplied `javascript:` URL must never reach an href. */
function isSafeHttpUrl(raw) {
    try {
        const { protocol } = new URL(raw);
        return protocol === 'http:' || protocol === 'https:';
    }
    catch {
        return false;
    }
}
/** Best-effort readable source name when the model omits the label. */
export function hostLabel(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    }
    catch {
        return url;
    }
}
function escapeLinkText(text) {
    return text.replace(/([[\]\\])/g, '\\$1');
}
/**
 * Rewrite citation markers into titled markdown links.
 *
 * `streaming` drops a trailing half-arrived marker so the reader never sees
 * `[[cite:htt` flicker past mid-answer.
 */
export function transformCitations(text, { streaming = false } = {}) {
    if (!text)
        return { content: '', citations: [] };
    let source = String(text);
    if (streaming) {
        source = source.replace(PARTIAL_CITE, '');
    }
    const citations = [];
    const indexByUrl = new Map();
    const content = source.replace(CITE_MARKER, (whole, rawUrl, rawLabel) => {
        const url = String(rawUrl).trim();
        if (!isSafeHttpUrl(url)) {
            // Keep the label as plain text rather than dropping the claim's
            // attribution entirely, but never link to it.
            const fallback = (rawLabel || '').trim();
            return fallback || '';
        }
        let index = indexByUrl.get(url);
        if (index === undefined) {
            index = citations.length + 1;
            indexByUrl.set(url, index);
            citations.push({ index, url, label: (rawLabel || '').trim() || hostLabel(url) });
        }
        const label = citations[index - 1].label;
        return `[${escapeLinkText(label)}](<${url}> "${CITE_TITLE_PREFIX}${index}")`;
    });
    return { content, citations };
}
/** Parse the `cite:N` link title back out. Returns null for ordinary links. */
export function citationIndexFromTitle(title) {
    if (!title || !title.startsWith(CITE_TITLE_PREFIX))
        return null;
    const n = Number.parseInt(title.slice(CITE_TITLE_PREFIX.length), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
}
