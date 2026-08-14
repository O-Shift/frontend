import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Runs in the browser before React hydrates, so autocapture and the first
// pageview are in place before the user can interact with anything.
if (posthogKey) {
  try {
    posthog.init(posthogKey, {
      // Ingestion goes through our own origin (see the /ingest rewrites in
      // next.config.ts) so ad blockers cannot quietly drop funnel data.
      api_host: "/ingest",
      // With a proxied api_host, PostHog needs the real app URL to build
      // correct links back to itself (toolbar, replays).
      ui_host: posthogHost?.replace(".i.posthog.com", ".posthog.com"),
      // Opts into current defaults, notably capture_pageview: 'history_change',
      // which is what makes App Router client-side navigations count as
      // pageviews instead of only the first hard load.
      defaults: "2026-06-25",
      person_profiles: "identified_only",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });

    // Lets you exclude local sessions from production dashboards.
    posthog.register({ app_environment: process.env.NODE_ENV });
  } catch (error) {
    console.error("PostHog init failed", error);
  }
}
