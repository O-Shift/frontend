import { createClient } from "@/utils/supabase/client";
import { getApiBaseUrl } from "@/lib/auth/constants";

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function signInWithGoogle(nextPath: string = "/workspaces") {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      : undefined;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number };

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { skipWorkspace?: boolean },
): Promise<ApiResult<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: "Not signed in", status: 401 };
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = normalized.startsWith("/v1/")
    ? `${base}${normalized}`
    : `${base}/v1${normalized}`;

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  let workspaceId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("oshift.workspace_id")
      : null;

  if (!workspaceId && !init?.skipWorkspace && !normalized.includes("/workspaces")) {
    try {
      const wsRes = await apiFetch<Array<{ id: string }>>("/workspaces", { skipWorkspace: true });
      if (wsRes.ok && Array.isArray(wsRes.data) && wsRes.data.length > 0) {
        workspaceId = wsRes.data[0].id;
        sessionStorage.setItem("oshift.workspace_id", workspaceId);
      }
    } catch {
      // ignore
    }
  }

  if (workspaceId && !init?.skipWorkspace) {
    headers.set("X-Workspace-ID", workspaceId);
  }

  try {
    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as T;
      }
    }
    if (!res.ok) {
      const errMsg =
        data && typeof data === "object" && "detail" in data
          ? String((data as { detail: unknown }).detail)
          : res.statusText;
      return { ok: false, error: errMsg, status: res.status };
    }
    return { ok: true, data: data as T, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg, status: 0 };
  }
}

export interface SseEvent {
  type: string;
  data: unknown;
  raw: string;
}

export async function* sseStream(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<SseEvent, void, void> {
  const token = await getAccessToken();
  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = normalized.startsWith("/v1/")
    ? `${base}${normalized}`
    : `${base}/v1${normalized}`;
  const workspaceId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("oshift.workspace_id")
      : null;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workspaceId ? { "X-Workspace-ID": workspaceId } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  const convId = res.headers.get("X-Conversation-Id");
  if (convId) {
    yield {
      type: "conversation_id",
      data: convId,
      raw: convId,
    };
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    yield {
      type: "error",
      data: { status: res.status, statusText: res.statusText, body: text },
      raw: `HTTP ${res.status} ${res.statusText}`,
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          yield { type: json.type || "message", data: json, raw: payload };
        } catch {
          yield { type: "raw", data: payload, raw: payload };
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    yield {
      type: "error",
      data: { content: `Network connection error: ${msg}` },
      raw: msg,
    };
  }
}

export interface OpportunityHighlight {
  text: string;
  citations: string[];
}

export interface OpportunityGapBullet {
  text: string;
  citations: string[];
  companies: string[];
}

export interface OpportunityAnalysisFields {
  topComplaint?: string;
  rootCause?: string;
  gapIdentified?: string;
  opportunityText?: string;
  earlyWarning?: string;
  quickWin?: string;
  highlights?: OpportunityHighlight[];
  gapBullets?: OpportunityGapBullet[];
  [key: string]: unknown;
}

export interface Opportunity {
  id: string;
  workspace_id: string;
  company_id?: string | null;
  competitor_id?: string | null;
  title: string;
  description: string;
  opportunity_type:
    | "market_expansion"
    | "product_innovation"
    | "partnership"
    | "content"
    | "pricing"
    | "positioning"
    | "other";
  effort: "low" | "medium" | "high" | "Low" | "Medium" | "High";
  impact: "low" | "medium" | "high" | "Low" | "Medium" | "High";
  priority_score?: number | string | null;
  priority_reasoning?: string | null;
  analysis_fields?: OpportunityAnalysisFields;
  related_gap_ids?: string[];
  status: "new" | "reviewing" | "approved" | "in_progress" | "completed" | "rejected";
  expires_at?: string | null;
  detected_at: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  total: number;
}

export async function fetchOpportunities(params?: {
  competitor_id?: string;
  status?: string;
  opportunity_type?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResult<OpportunityListResponse>> {
  const query = new URLSearchParams();
  if (params?.competitor_id) query.set("competitor_id", params.competitor_id);
  if (params?.status) query.set("status", params.status);
  if (params?.opportunity_type) query.set("opportunity_type", params.opportunity_type);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<OpportunityListResponse>(`/opportunities${queryString}`);
}

export async function generateOpportunities(): Promise<ApiResult<Opportunity[]>> {
  return apiFetch<Opportunity[]>("/opportunities/generate", {
    method: "POST",
  });
}

export async function updateOpportunityStatus(
  id: string,
  status: Opportunity["status"]
): Promise<ApiResult<Opportunity>> {
  return apiFetch<Opportunity>(`/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteOpportunity(id: string): Promise<ApiResult<void>> {
  return apiFetch<void>(`/opportunities/${id}`, {
    method: "DELETE",
  });
}

export async function triggerPipeline(): Promise<ApiResult<{ run_id: string; status: string }>> {
  return apiFetch<{ run_id: string; status: string }>("/automation/trigger", {
    method: "POST",
    body: JSON.stringify({ workflow_type: "oshift/crawlers.run" }),
  });
}

export interface InsightSource {
  id: string;
  title: string | null;
  url: string | null;
  source: string | null;
  captured_at: string | null;
}

/** A row from insights.insights_gaps, layer in ('gap','act_now','alarm_for_us'). */
export interface InsightGap {
  id: string;
  competitor_id: string | null;
  layer: "gap" | "act_now" | "alarm_for_us";
  title: string;
  /**
   * The gap narrative. The column is `description`, but the endpoint selects it
   * as `description AS body` (app/insights/router.py), so `description` never
   * arrives over the wire â€” reading it yields blank cards.
   */
  body: string | null;
  confidence: number | null;
  detected_at: string | null;
  signal_ids: string[];
  sources: InsightSource[];
}

export async function fetchGaps(params?: {
  competitor_id?: string;
  layer?: string;
  limit?: number;
}): Promise<ApiResult<InsightGap[]>> {
  const query = new URLSearchParams();
  if (params?.competitor_id) query.set("competitor_id", params.competitor_id);
  if (params?.layer) query.set("layer", params.layer);
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<InsightGap[]>(`/insights/gaps${queryString}`);
}

/** A row from sense.sense_reviews. No author or reply state is stored. */
export interface SenseReview {
  id: string;
  workspace_id: string;
  competitor_id: string | null;
  platform: string | null;
  review_id: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  sentiment: string | null;
  url: string | null;
  reviewed_at: string | null;
  captured_at: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function fetchReviews(params?: {
  competitor_id?: string;
  platform?: string;
  limit?: number;
}): Promise<ApiResult<SenseReview[]>> {
  const query = new URLSearchParams();
  if (params?.competitor_id) query.set("competitor_id", params.competitor_id);
  if (params?.platform) query.set("platform", params.platform);
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<SenseReview[]>(`/sense/reviews${queryString}`);
}

export interface CampaignPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  source: string;
  url: string;
  captured_at: string | null;
}

/** Free-form jsonb on a campaign row. */
export interface CampaignMetadata {
  post_count?: number;
  date_range?: string | { start?: string; end?: string } | null;
  themes?: string[];
  signal_ids?: string[];
  [key: string]: unknown;
}

/**
 * A campaign as `/v1/campaigns` actually returns it.
 *
 * Despite the name, this is not a row of `campaigns.campaigns`: the clustering
 * engine writes campaigns into `insights.insights_gaps` with `layer='campaign'`,
 * and both campaign routes read from there (app/campaigns/router.py). These
 * eight fields are the whole contract â€” an earlier version of this interface
 * declared budget_usd, roi, status, cluster, platforms, themes and start/end
 * dates, none of which exist on the wire, so everything derived from them
 * rendered blank.
 *
 * Themes and the date range live under `metadata`; platforms are derivable from
 * `posts`. Use the helpers below rather than reaching for a top-level field.
 */
export interface Campaign {
  id: string;
  competitor_id: string | null;
  title: string;
  description: string | null;
  confidence: number;
  detected_at: string | null;
  metadata: CampaignMetadata;
  posts: CampaignPost[];
}

/** Themes recorded by the clustering engine, or [] when it recorded none. */
export function campaignThemes(campaign: Campaign): string[] {
  const raw = campaign.metadata?.themes;
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
}

/** Distinct platforms across the campaign's posts, in first-seen order. */
export function campaignPlatforms(campaign: Campaign): string[] {
  const seen = new Set<string>();
  for (const post of campaign.posts ?? []) {
    const p = post.platform?.trim();
    if (p) seen.add(p);
  }
  return [...seen];
}

/** `{start, end}` from metadata.date_range, tolerating the string form. */
export function campaignDateRange(campaign: Campaign): { start: string | null; end: string | null } {
  const raw = campaign.metadata?.date_range;
  if (raw && typeof raw === "object") {
    return { start: raw.start ?? null, end: raw.end ?? null };
  }
  if (typeof raw === "string" && raw.trim()) return { start: raw, end: null };
  return { start: null, end: null };
}

export async function fetchCampaigns(params?: {
  owner_type?: "competitor" | "self";
  competitor_id?: string;
  status?: string;
  limit?: number;
}): Promise<ApiResult<Campaign[]>> {
  const query = new URLSearchParams();
  if (params?.owner_type) query.set("owner_type", params.owner_type);
  if (params?.competitor_id) query.set("competitor_id", params.competitor_id);
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Campaign[]>(`/campaigns${queryString}`);
}

export async function fetchCampaign(id: string): Promise<ApiResult<Campaign>> {
  return apiFetch<Campaign>(`/campaigns/${id}`);
}

export interface Workspace {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  plan: string;
  created_by: string | null;
  created_at: string;
}

export async function fetchWorkspaces(): Promise<ApiResult<Workspace[]>> {
  return apiFetch<Workspace[]>("/core/workspaces");
}

/**
 * A row of company.companies â€” the workspace's OWN company, 1:1 with the
 * workspace. GET /company answers 404 when the row does not exist, which means
 * onboarding has not run: an empty state, not a failure.
 */
export interface Company {
  id: string;
  workspace_id: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  founding_year: number | null;
  market_valuation_usd: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
}

export async function fetchCompany(): Promise<ApiResult<Company>> {
  return apiFetch<Company>("/company");
}

/** What PUT /company accepts. `website` must be an absolute URL â€” the backend
 * validates it as one so the crawlers get a resolvable seed. */
export interface CompanyUpsert {
  name: string;
  website: string;
  description?: string | null;
  industry?: string | null;
  founding_year?: number | null;
  metadata?: Record<string, unknown>;
}

/**
 * Create or replace the workspace's own company profile. Upserts on
 * workspace_id, so calling it twice updates one row rather than making two.
 */
export async function upsertCompany(
  body: CompanyUpsert,
): Promise<ApiResult<Company>> {
  return apiFetch<Company>("/company", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/** What POST /competitors and /competitors/batch accept. */
export interface CompetitorCreate {
  name: string;
  website: string;
  description?: string | null;
  industry?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * `skipped` carries the names the backend rejected as duplicates (409). A
 * partial success is the normal case when onboarding is re-run, so callers
 * should report it rather than treat it as a failure.
 */
export interface CompetitorBatchResult {
  created: { id: string; name: string; website: string | null }[];
  skipped: string[];
}

export async function createCompetitorsBatch(
  items: CompetitorCreate[],
): Promise<ApiResult<CompetitorBatchResult>> {
  return apiFetch<CompetitorBatchResult>("/competitors/batch", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export type AnalyticsRange = "1m" | "3m" | "6m" | "1y";
export type AnalyticsGranularity = "day" | "week" | "month";

/**
 * One time bucket of company.analytics_snapshots. A metric is null when no
 * snapshot in the bucket recorded it â€” distinct from a real zero, so callers
 * must not coalesce it.
 */
export interface CompanyAnalyticsPoint {
  timestamp: string;
  followers: number | null;
  views: number | null;
  engagement_rate: number | null;
}

/** `points` is empty (not an error) when the workspace has no snapshots. */
export interface CompanyAnalytics {
  range: AnalyticsRange;
  granularity: AnalyticsGranularity;
  platform: string | null;
  points: CompanyAnalyticsPoint[];
}

export async function fetchCompanyAnalytics(params?: {
  range?: AnalyticsRange;
  granularity?: AnalyticsGranularity;
  platform?: string;
}): Promise<ApiResult<CompanyAnalytics>> {
  const query = new URLSearchParams();
  if (params?.range) query.set("range", params.range);
  if (params?.granularity) query.set("granularity", params.granularity);
  if (params?.platform) query.set("platform", params.platform);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<CompanyAnalytics>(`/company/analytics${queryString}`);
}

/**
 * A row of competitors.watchlists â€” the workspace's pinned-competitor sets.
 * `item_count` is computed per request, not a stored column.
 */
export interface Watchlist {
  id: string;
  workspace_id: string;
  name: string | null;
  description: string | null;
  item_count: number;
  created_at: string;
}

/** One pinned competitor. `competitor_id` is the key every other endpoint takes. */
export interface WatchlistItem {
  competitor_id: string;
  name: string | null;
  website: string | null;
  created_at: string;
}

/** A watchlist with its members expanded. */
export interface WatchlistDetail {
  id: string;
  workspace_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  items: WatchlistItem[];
}

/**
 * Answers `[]` for a workspace that has never created a watchlist. That is the
 * normal first-run state, not a failure â€” callers must not treat it as one.
 * Ordered by created_at, so the first entry is the oldest.
 */
export async function fetchWatchlists(): Promise<ApiResult<Watchlist[]>> {
  return apiFetch<Watchlist[]>("/competitors/watchlists");
}

export async function createWatchlist(
  name: string,
  description?: string | null,
): Promise<ApiResult<Watchlist>> {
  return apiFetch<Watchlist>("/competitors/watchlists", {
    method: "POST",
    body: JSON.stringify({ name, description: description ?? null }),
  });
}

/** Answers 404 when the id belongs to another workspace. */
export async function fetchWatchlist(
  watchlistId: string,
): Promise<ApiResult<WatchlistDetail>> {
  return apiFetch<WatchlistDetail>(`/competitors/watchlists/${watchlistId}`);
}

/**
 * Idempotent: pinning a competitor that is already on the watchlist answers 200
 * with the existing row rather than an error.
 */
export async function addWatchlistItem(
  watchlistId: string,
  competitorId: string,
): Promise<ApiResult<WatchlistItem>> {
  return apiFetch<WatchlistItem>(
    `/competitors/watchlists/${watchlistId}/items`,
    {
      method: "POST",
      body: JSON.stringify({ competitor_id: competitorId }),
    },
  );
}

/**
 * Answers 204 with an empty body, which apiFetch surfaces as `ok` with `data`
 * left null â€” callers must key off `ok`, never off `data`. A 404 means the
 * competitor was not pinned to this watchlist, so the caller's desired end
 * state already holds.
 */
export async function removeWatchlistItem(
  watchlistId: string,
  competitorId: string,
): Promise<ApiResult<void>> {
  return apiFetch<void>(
    `/competitors/watchlists/${watchlistId}/items/${competitorId}`,
    { method: "DELETE" },
  );
}



// --- Extra Competitor & Analysis Helpers (from HEAD) ---

export interface Competitor {
  id: string;
  workspace_id?: string;
  name: string;
  website: string;
  description?: string | null;
  industry?: string | null;
  founding_year?: number | null;
  market_valuation_usd?: number | null;
  market_share_percent?: number | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
}

export interface CompetitorCreatePayload {
  name: string;
  website: string;
  description?: string;
  industry?: string;
}

export interface CompetitorBatchResponse {
  created: Competitor[];
  skipped: string[];
}

export interface AggregatedMetricPoint {
  date: string;
  score: number;
}

export interface AggregatedMetricsResponse {
  competitor_id: string;
  metric: string;
  range: string;
  granularity: string;
  points: AggregatedMetricPoint[];
}

export interface ScrapeTriggerResponse {
  run: {
    id: string;
    workspace_id: string;
    competitor_id: string;
    status: string;
    started_at?: string | null;
    completed_at?: string | null;
    pages_total: number;
    pages_ok: number;
    pages_failed: number;
  };
  counts: Record<string, any>;
}

export async function getCompetitors(): Promise<ApiResult<Competitor[]>> {
  return apiFetch<Competitor[]>("/competitors");
}

export async function getCompetitor(id: string): Promise<ApiResult<Competitor>> {
  return apiFetch<Competitor>(`/competitors/${id}`);
}

export async function deleteCompetitor(id: string): Promise<ApiResult<void>> {
  return apiFetch<void>(`/competitors/${id}`, {
    method: "DELETE",
  });
}

export async function getCompetitorAggregatedMetrics(
  id: string,
  metric: "market_share" | "score" | "volume" | "engagement" | "sentiment" | string = "score",
  range: "1m" | "3m" | "6m" | "1y" = "6m",
  granularity: "day" | "week" | "month" = "month"
): Promise<ApiResult<AggregatedMetricsResponse>> {
  return apiFetch<AggregatedMetricsResponse>(
    `/competitors/${id}/signals/aggregated?metric=${metric}&range=${range}&granularity=${granularity}`
  );
}

export async function triggerCompetitorScrape(id: string): Promise<ApiResult<ScrapeTriggerResponse>> {
  return apiFetch<ScrapeTriggerResponse>(`/competitors/${id}/scrape`, {
    method: "POST",
  });
}

export async function getInsightsGaps(id: string) {
  return apiFetch(`/insights/gaps?competitor_id=${id}`);
}

export async function getSenseReviews(id: string) {
  return apiFetch(`/sense/reviews?competitor_id=${id}`);
}

export async function getCompetitorCampaigns(id: string) {
  return apiFetch(`/campaigns?owner_type=competitor&competitor_id=${id}`);
}
