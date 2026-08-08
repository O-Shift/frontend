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

  const workspaceId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("oshift.workspace_id")
      : null;
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
  description: string | null;
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

/** Written by insights/campaigns.py as insights_gaps rows with layer='campaign'. */
export interface CampaignMetadata {
  post_count?: number;
  date_range?: string | { start?: string; end?: string } | null;
  themes?: string[];
  signal_ids?: string[];
  [key: string]: unknown;
}

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

export async function fetchCampaigns(params?: {
  owner_type?: "competitor" | "self";
  competitor_id?: string;
  limit?: number;
}): Promise<ApiResult<Campaign[]>> {
  const query = new URLSearchParams();
  if (params?.owner_type) query.set("owner_type", params.owner_type);
  if (params?.competitor_id) query.set("competitor_id", params.competitor_id);
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Campaign[]>(`/campaigns${queryString}`);
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
 * A row of company.companies — the workspace's OWN company, 1:1 with the
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

export type AnalyticsRange = "1m" | "3m" | "6m" | "1y";
export type AnalyticsGranularity = "day" | "week" | "month";

/**
 * One time bucket of company.analytics_snapshots. A metric is null when no
 * snapshot in the bucket recorded it — distinct from a real zero, so callers
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



