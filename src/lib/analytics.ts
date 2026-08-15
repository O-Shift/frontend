import posthog from "posthog-js";

/**
 * Canonical event names.
 *
 * PostHog funnels match on the literal event name, so every call site has to
 * spell a step the same way or the funnel silently loses users. Adding a name
 * here (instead of inlining a string) keeps that guarantee.
 */
export const EVENTS = {
  // Auth funnel
  SIGNUP_SUBMITTED: "signup_submitted",
  SIGNUP_SUCCEEDED: "signup_succeeded",
  SIGNUP_FAILED: "signup_failed",
  LOGIN_SUBMITTED: "login_submitted",
  LOGIN_SUCCEEDED: "login_succeeded",
  LOGIN_FAILED: "login_failed",
  LOGGED_OUT: "logged_out",

  // Workspace funnel
  WORKSPACES_LOADED: "workspaces_loaded",
  WORKSPACE_SELECTED: "workspace_selected",
  WORKSPACE_CREATED: "workspace_created",
  WORKSPACE_CREATE_FAILED: "workspace_create_failed",

  // Onboarding funnel
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_VIEWED: "onboarding_step_viewed",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_STEP_BACK: "onboarding_step_back",
  ONBOARDING_WEBSITE_IMPORTED: "onboarding_website_imported",
  ONBOARDING_PROFILE_METHOD_CHOSEN: "onboarding_profile_method_chosen",
  ONBOARDING_COMPLETED: "onboarding_completed",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

type AnalyticsProperties = Record<string, unknown>;

/**
 * PostHog is initialised in `src/instrumentation-client.ts`, which only runs in
 * the browser and only when NEXT_PUBLIC_POSTHOG_KEY is set. Every helper below
 * no-ops otherwise, so call sites never need to guard.
 */
function isReady(): boolean {
  return typeof window !== "undefined" && Boolean(posthog.__loaded);
}

export function track(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): void {
  if (!isReady()) return;
  posthog.capture(event, properties);
}

/**
 * Binds the current person to the Supabase user id, which is what stitches the
 * pre-signup anonymous session onto the identified user so signup funnels stay
 * whole. Skipped when already identified, since auth emits SIGNED_IN /
 * TOKEN_REFRESHED repeatedly and each identify would be another $identify event.
 */
export function identifyUser(
  userId: string,
  properties?: AnalyticsProperties,
): void {
  if (!isReady() || posthog.get_distinct_id() === userId) return;
  posthog.identify(userId, properties);
}

/** Clears the person on sign-out so the next user on this browser is separate. */
export function resetIdentity(): void {
  if (!isReady()) return;
  posthog.reset();
}

/**
 * Attaches the active workspace to every subsequent event: as a group (for
 * per-workspace funnels) and as a super property (for plain breakdowns).
 */
export function setWorkspaceContext(workspaceId: string): void {
  if (!isReady()) return;
  posthog.register({ workspace_id: workspaceId });
  posthog.group("workspace", workspaceId);
}
