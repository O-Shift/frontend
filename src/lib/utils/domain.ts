/**
 * Reduce a stored competitor website to a bare hostname.
 *
 * The /company/[domain] route resolves a competitor by substring-matching the
 * segment against competitor.website, so the segment must be a bare hostname.
 * Answers '' when there is no website to derive one from — callers decide what
 * an empty domain means rather than getting a made-up placeholder.
 */
export function extractDomain(website: string): string {
  if (!website) return '';
  try {
    const urlStr = website.startsWith('http://') || website.startsWith('https://')
      ? website
      : `https://${website}`;
    return new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}
