/**
 * Company logo URLs.
 *
 * Every logo in the app used to be fetched from `logo.clearbit.com`, which
 * HubSpot shut down — the host no longer resolves, so each logo cost a failed
 * DNS lookup and a console error before falling back. Google's favicon service
 * is the one that answers, so it is the only one we ask.
 */

/** Strip a scheme, path, and any stray whitespace off a stored website value. */
export function hostFromWebsite(website: string | null | undefined): string | null {
    const raw = website?.trim().replace(/\s+/g, '');
    if (!raw) return null;
    try {
        const host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname;
        return host.replace(/^www\./, '') || null;
    } catch {
        return null;
    }
}

/**
 * A logo for a domain, or null when we have no domain to ask about — callers
 * render a monogram in that case rather than a broken image.
 */
export function logoUrl(domain: string | null | undefined, size = 128): string | null {
    const host = hostFromWebsite(domain);
    if (!host) return null;
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=${size}`;
}

/**
 * A stable hue for a workspace, derived from its id.
 * Pushed away from the 20–45° band so no sigil competes with the product's orange accent.
 */
export function sigilHue(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 300;
    return hue >= 20 ? hue + 45 : hue;
}

export function sigilStyle(id: string): React.CSSProperties {
    const h = sigilHue(id);
    return {
        background: `linear-gradient(145deg, hsl(${h} 62% 52%), hsl(${(h + 34) % 360} 58% 40%))`,
    };
}

/** Up to two letters, skipping common noise words that pad workspace/company names. */
export function sigilInitials(name: string): string {
    const words = name
        .trim()
        .split(/[\s\-_]+/)
        .filter((w) => w.length > 0 && !/^(the|a|an|of|and)$/i.test(w));
    if (words.length === 0) return name.trim().slice(0, 2).toUpperCase() || '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}
