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
      // Ignore resolution error
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

// ---------------------------------------------------------------------------
// Competitors Domain Types & Helper APIs
// ---------------------------------------------------------------------------

export interface Competitor {
  id: string;
  workspace_id: string;
  name: string;
  website: string;
  description?: string | null;
  founding_year?: number | null;
  market_valuation_usd?: number | null;
  industry?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface CompetitorCreatePayload {
  name: string;
  website: string;
  description?: string | null;
  founding_year?: number | null;
  market_valuation_usd?: number | null;
  industry?: string | null;
  seed_pages?: string[];
  metadata?: Record<string, any> | null;
}

export interface CompetitorBatchResponse {
  created: Competitor[];
  skipped: string[];
}

export interface AggregatedMetricPoint {
  timestamp: string;
  value: number;
}

export interface AggregatedMetricsResponse {
  competitor_id: string;
  metric: string;
  range: string;
  granularity: string;
  points: AggregatedMetricPoint[];
}

export interface InsightGapSource {
  id: string;
  title?: string | null;
  url?: string | null;
  source?: string | null;
  captured_at?: string | null;
}

export interface InsightGap {
  id: string;
  competitor_id?: string | null;
  layer?: string | null;
  title: string;
  body?: string | null;
  confidence?: number | null;
  detected_at?: string | null;
  signal_ids?: string[];
  sources?: InsightGapSource[];
}

export interface CampaignPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  source: string;
  url?: string | null;
  captured_at?: string | null;
}

export interface Campaign {
  id: string;
  competitor_id?: string | null;
  title: string;
  description?: string | null;
  confidence?: number | null;
  detected_at?: string | null;
  metadata?: Record<string, any> | null;
  posts: CampaignPost[];
}

export interface SenseReview {
  id: string;
  workspace_id: string;
  competitor_id: string;
  platform: string;
  review_id?: string | null;
  rating?: number | null;
  title?: string | null;
  body?: string | null;
  sentiment?: string | null;
  url?: string | null;
  reviewed_at?: string | null;
  captured_at?: string | null;
  metadata?: Record<string, any> | null;
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

export async function createCompetitorsBatch(
  items: CompetitorCreatePayload[]
): Promise<ApiResult<CompetitorBatchResponse>> {
  return apiFetch<CompetitorBatchResponse>("/competitors/batch", {
    method: "POST",
    body: JSON.stringify({ items }),
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

export async function getInsightsGaps(
  competitorId?: string
): Promise<ApiResult<InsightGap[]>> {
  const q = competitorId ? `?competitor_id=${competitorId}` : "";
  return apiFetch<InsightGap[]>(`/insights/gaps${q}`);
}

export async function getCompetitorCampaigns(
  competitorId?: string
): Promise<ApiResult<Campaign[]>> {
  const q = competitorId ? `&competitor_id=${competitorId}` : "";
  return apiFetch<Campaign[]>(`/campaigns?owner_type=competitor${q}`);
}

export async function getSenseReviews(
  competitorId?: string
): Promise<ApiResult<SenseReview[]>> {
  const q = competitorId ? `?competitor_id=${competitorId}` : "";
  return apiFetch<SenseReview[]>(`/sense/reviews${q}`);
}

export async function triggerCompetitorScrape(
  id: string
): Promise<ApiResult<ScrapeTriggerResponse>> {
  return apiFetch<ScrapeTriggerResponse>(`/competitors/${id}/scrape`, {
    method: "POST",
  });
}

export async function deleteCompetitor(id: string): Promise<ApiResult<void>> {
  return apiFetch<void>(`/competitors/${id}`, {
    method: "DELETE",
  });
}


