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
