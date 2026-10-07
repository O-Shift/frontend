export const RETURNING_BROWSER_COOKIE = "oshift_returning_browser";
export const SURFACE_HEADER = "x-oshift-surface";

export function siteOrigins() {
  return {
    marketing: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.orangeshift.net",
    ),
    app: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "https://app.orangeshift.net",
    ),
  };
}

/** Only configured public hosts redirect off-origin; localhost/previews stay self-contained. */
export function hostDestination(
  requestUrl: URL,
  origins = siteOrigins(),
): URL | null {
  const isApp = requestUrl.host === origins.app.host;
  const marketingHosts = new Set([
    origins.marketing.host,
    origins.marketing.host.replace(/^www\./, ""),
  ]);
  if (isApp && requestUrl.pathname === "/landing")
    return new URL("/", origins.marketing);
  if (marketingHosts.has(requestUrl.host)) {
    if (
      requestUrl.pathname === "/robots.txt" ||
      requestUrl.pathname === "/sitemap.xml"
    )
      return null;
    if (requestUrl.pathname === "/" || requestUrl.pathname === "/landing") {
      if (
        requestUrl.host !== origins.marketing.host ||
        requestUrl.pathname === "/landing"
      ) {
        const target = new URL("/", origins.marketing);
        target.search = requestUrl.search;
        return target;
      }
      return null;
    }
    // The backend proxy and every auth/product path belong to the application origin.
    const target = new URL(origins.app.origin);
    target.pathname = requestUrl.pathname;
    target.search = requestUrl.search;
    return target;
  }
  return null;
}

export function isMarketingSurface(
  requestUrl: URL,
  origins = siteOrigins(),
): boolean {
  return (
    requestUrl.host !== origins.app.host &&
    ["/", "/landing", "/robots.txt", "/sitemap.xml"].includes(
      requestUrl.pathname,
    )
  );
}

/** The remembered flag influences navigation only. A verified session is required for app access. */
export function entryPath(
  signedIn: boolean,
  returningBrowser: boolean,
): string {
  return signedIn ? "/workspaces" : returningBrowser ? "/login" : "/signup";
}
