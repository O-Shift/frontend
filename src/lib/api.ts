import { createClient } from "../utils/supabase/client.ts";
import { getApiBaseUrl } from "./auth/constants.ts";
import type {
  VideoAsset,
  VideoCollectRequest,
  VideoCollectResult,
  VideoDownloadRequest,
  VideoDownloadResponse,
  VideoLookupResponse,
} from "../types/entities.ts";

export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
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

export interface ErrorFieldDetail {
  /** The path or name of the field that caused the error (e.g. 'name', 'website', 'items.0.url') */
  field?: string;
  /** Human-readable explanation of the validation error */
  message: string;
  /** Granular error code for the specific field validation failure */
  code?: string;
}

export interface ProblemDetails {
  /** RFC 9457 URI reference identifying the error type (e.g. 'https://errors.oshift.ai/DATABASE_UNAVAILABLE') */
  type: string;
  /** RFC 9457 short human-readable summary (e.g. 'Service Unavailable') */
  title: string;
  /** HTTP status code (e.g. 503) */
  status: number;
  /** Human-readable explanation of this occurrence */
  detail: string;
  /** URI identifying specific occurrence (e.g. '/v1/opportunities') */
  instance?: string;
  /** Stable domain error code from taxonomy (e.g. 'DATABASE_UNAVAILABLE', 'VALIDATION_FAILED', 'RATE_LIMITED') */
  code?: string;
  /** High-entropy Crockford Base32 correlation reference ID (e.g. 'ERR-8F3K2') */
  ref?: string;
  /** Whether the error is transient/retryable */
  retryable?: boolean;
  /** Recommended backoff in seconds before retrying */
  retry_after_seconds?: number;
  /** UTC timestamp in ISO 8601 format */
  timestamp?: string;
  /** Granular field validation or sub-item errors */
  errors?: ErrorFieldDetail[];
  /** Open index signature for RFC 9457 extensions */
  [key: string]: unknown;
}

function statusToErrorCode(status: number): string {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "AUTHENTICATION_REQUIRED";
    case 403: return "PERMISSION_DENIED";
    case 404: return "RESOURCE_NOT_FOUND";
    case 409: return "RESOURCE_CONFLICT";
    case 422: return "VALIDATION_FAILED";
    case 429: return "RATE_LIMITED";
    case 499: return "REQUEST_ABORTED";
    case 500: return "UNEXPECTED_ERROR";
    case 502: return "UPSTREAM_5XX_ERROR";
    case 503: return "SERVICE_UNAVAILABLE";
    case 504: return "UPSTREAM_TIMEOUT";
    default:
      if (status >= 400 && status < 500) return "CLIENT_ERROR";
      if (status >= 500) return "INTERNAL_ERROR";
      return "UNKNOWN_ERROR";
  }
}

function statusToTitle(status: number): string {
  switch (status) {
    case 400: return "Bad Request";
    case 401: return "Unauthorized";
    case 403: return "Forbidden";
    case 404: return "Not Found";
    case 409: return "Conflict";
    case 422: return "Validation Error";
    case 429: return "Too Many Requests";
    case 499: return "Request Cancelled";
    case 500: return "Internal Server Error";
    case 502: return "Bad Gateway";
    case 503: return "Service Unavailable";
    case 504: return "Gateway Timeout";
    default:
      if (status >= 400 && status < 500) return "Client Error";
      if (status >= 500) return "Server Error";
      return "Error";
  }
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly ref?: string;
  public readonly requestId?: string;
  public readonly instance?: string;
  public readonly retryable: boolean;
  public readonly retryAfterSeconds?: number;
  public readonly errors: ErrorFieldDetail[];
  public readonly problem?: ProblemDetails;
  public readonly headers?: Headers;

  // Ergonomic classification flags
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly isAborted: boolean;
  public readonly isRateLimited: boolean;
  public readonly isAuthError: boolean;
  public readonly isClientError: boolean;
  public readonly isServerError: boolean;

  constructor(params: {
    message: string;
    status: number;
    code?: string;
    ref?: string;
    requestId?: string;
    instance?: string;
    retryable?: boolean;
    retryAfterSeconds?: number;
    errors?: ErrorFieldDetail[];
    problem?: ProblemDetails;
    headers?: Headers;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code || statusToErrorCode(params.status);
    this.ref = params.ref;
    this.requestId = params.requestId;
    this.instance = params.instance;
    this.retryable = params.retryable ?? (params.status === 429 || params.status === 502 || params.status === 503 || params.status === 504);
    this.retryAfterSeconds = params.retryAfterSeconds;
    this.errors = params.errors || [];
    this.problem = params.problem;
    this.headers = params.headers;
    if (params.cause) {
      this.cause = params.cause;
    }

    this.isNetworkError = this.status === 0 || this.code === "NETWORK_CONNECTION_FAILED";
    this.isTimeout = this.code === "UPSTREAM_TIMEOUT" || this.code === "REQUEST_TIMEOUT" || this.status === 504;
    this.isAborted = this.code === "REQUEST_ABORTED" || this.status === 499;
    this.isRateLimited = this.status === 429 || this.code === "RATE_LIMITED";
    this.isAuthError = this.status === 401 || this.status === 403 || this.code === "AUTHENTICATION_REQUIRED" || this.code === "PERMISSION_DENIED";
    this.isClientError = this.status >= 400 && this.status < 500;
    this.isServerError = this.status >= 500 && this.status < 600;
  }

  /** Formats a safe, actionable user-facing message with correlation reference if available */
  public getUserMessage(): string {
    if (this.ref) {
      return `${this.message} (Reference: ${this.ref})`;
    }
    return this.message;
  }

  /** Returns field-keyed validation messages for easy form binding */
  public getFieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const err of this.errors) {
      if (err.field && err.message) {
        result[err.field] = err.message;
      }
    }
    return result;
  }

  /** Factory from parsed RFC 9457 ProblemDetails object */
  public static fromProblem(
    problem: ProblemDetails,
    headers?: Headers,
    requestId?: string
  ): ApiError {
    const ref = problem.ref || headers?.get("x-error-ref") || undefined;
    const retryAfterHeader = headers?.get("retry-after");
    const parsedRetryAfter = retryAfterHeader ? parseFloat(retryAfterHeader) : undefined;
    const retryAfterSeconds = problem.retry_after_seconds ?? (Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : undefined);

    return new ApiError({
      message: problem.detail || problem.title || "An error occurred",
      status: problem.status,
      code: problem.code,
      ref,
      requestId: requestId || headers?.get("x-request-id") || undefined,
      instance: problem.instance,
      retryable: problem.retryable,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
      errors: problem.errors,
      problem,
      headers,
    });
  }

  /** Factory for network drop / DNS / CORS / offline errors */
  public static fromNetworkError(
    err: unknown,
    url?: string,
    requestId?: string
  ): ApiError {
    const msg = err instanceof Error ? err.message : "Network connection failed";
    const problem: ProblemDetails = {
      type: "https://errors.oshift.ai/NETWORK_CONNECTION_FAILED",
      title: "Network Connection Failed",
      status: 0,
      detail: msg,
      code: "NETWORK_CONNECTION_FAILED",
      instance: url,
      retryable: true,
      timestamp: new Date().toISOString(),
      errors: [],
    };
    return new ApiError({
      message: msg,
      status: 0,
      code: "NETWORK_CONNECTION_FAILED",
      instance: url,
      requestId,
      retryable: true,
      problem,
      cause: err,
    });
  }

  /** Factory for client-side timeout bounds */
  public static fromTimeout(
    timeoutMs: number,
    url?: string,
    requestId?: string
  ): ApiError {
    const msg = `Request timed out after ${Math.round(timeoutMs / 1000)}s`;
    const problem: ProblemDetails = {
      type: "https://errors.oshift.ai/UPSTREAM_TIMEOUT",
      title: "Gateway Timeout",
      status: 504,
      detail: msg,
      code: "UPSTREAM_TIMEOUT",
      instance: url,
      retryable: true,
      timestamp: new Date().toISOString(),
      errors: [],
    };
    return new ApiError({
      message: msg,
      status: 504,
      code: "UPSTREAM_TIMEOUT",
      instance: url,
      requestId,
      retryable: true,
      problem,
    });
  }

  /** Factory for deliberate user cancellation / navigation aborts */
  public static fromAbort(url?: string, requestId?: string): ApiError {
    const msg = "Request was cancelled";
    const problem: ProblemDetails = {
      type: "https://errors.oshift.ai/REQUEST_ABORTED",
      title: "Request Cancelled",
      status: 499,
      detail: msg,
      code: "REQUEST_ABORTED",
      instance: url,
      retryable: false,
      timestamp: new Date().toISOString(),
      errors: [],
    };
    return new ApiError({
      message: msg,
      status: 499,
      code: "REQUEST_ABORTED",
      instance: url,
      requestId,
      retryable: false,
      problem,
    });
  }
}

export interface ApiFetchOptions extends RequestInit {
  skipWorkspace?: boolean;
  /** Skip authentication check (useful for unauthenticated public endpoints and unit tests) */
  skipAuth?: boolean;
  /** Timeout in milliseconds (default: 30,000ms / 30s). Set to 0 or Infinity to disable. */
  timeoutMs?: number;
  /** Explicit request ID for tracing. If omitted, a unique client request ID is generated. */
  requestId?: string;
}

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
      status: number;
      headers?: Headers;
      requestId?: string;
    }
  | {
      ok: false;
      error: string;
      status: number;
      problem?: ProblemDetails;
      apiError: ApiError;
      ref?: string;
      requestId?: string;
    };

const WORKSPACE_STORAGE_KEY = "oshift.workspace_id";

let inFlightWorkspaceId: Promise<string | null> | null = null;

function readStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(WORKSPACE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setActiveWorkspaceId(id: string): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(WORKSPACE_STORAGE_KEY, id);
    } catch {
      // Ignore private mode storage restrictions
    }
    window.dispatchEvent(
      new CustomEvent("oshift:workspace-changed", { detail: { workspaceId: id } }),
    );
  }
}

export function getActiveWorkspaceId(): string | null {
  return readStoredWorkspaceId();
}

export function clearActiveWorkspaceId(): void {
  inFlightWorkspaceId = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch {
      // Ignore
    }
    window.dispatchEvent(
      new CustomEvent("oshift:workspace-changed", { detail: { workspaceId: null } }),
    );
  }
}

export async function resolveWorkspaceId(): Promise<string | null> {
  const stored = readStoredWorkspaceId();
  if (stored) return stored;
  if (inFlightWorkspaceId) return inFlightWorkspaceId;

  inFlightWorkspaceId = (async () => {
    try {
      const res = await apiFetch<Array<{ id: string }>>("/core/workspaces", {
        skipWorkspace: true,
      });
      if (res.ok && Array.isArray(res.data) && res.data.length === 1) {
        setActiveWorkspaceId(res.data[0].id);
        return res.data[0].id;
      }
    } catch {
      // Falls through to null
    } finally {
      inFlightWorkspaceId = null;
    }
    return null;
  })();

  return inFlightWorkspaceId;
}

export interface ValidationDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;

function createTimeoutController(
  callerSignal?: AbortSignal | null,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): {
  controller: AbortController;
  cleanup: () => void;
  isTimeout: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const onCallerAbort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }
  }

  if (timeoutMs > 0 && timeoutMs !== Infinity) {
    timer = setTimeout(() => {
      timedOut = true;
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, timeoutMs);
  }

  const cleanup = () => {
    if (timer) clearTimeout(timer);
    if (callerSignal) {
      callerSignal.removeEventListener("abort", onCallerAbort);
    }
  };

  return {
    controller,
    cleanup,
    isTimeout: () => timedOut,
  };
}

export function parseProblemDetails(
  status: number,
  statusText: string,
  rawText: string,
  url: string,
  headers: Headers
): ProblemDetails {
  const defaultCode = statusToErrorCode(status);
  const defaultTitle = statusToTitle(status);
  const refHeader = headers.get("x-error-ref") || undefined;
  const retryAfterHeader = headers.get("retry-after");
  const parsedRetryAfter = retryAfterHeader ? parseFloat(retryAfterHeader) : undefined;
  const retryAfterSeconds = Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : undefined;

  let parsed: unknown = null;
  if (rawText && rawText.trim()) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;

    // Case 1: Standard RFC 9457 ProblemDetails
    if ("type" in obj && "title" in obj && "status" in obj) {
      const fieldErrors: ErrorFieldDetail[] = Array.isArray(obj.errors)
        ? (obj.errors as ErrorFieldDetail[])
        : [];
      return {
        type: String(obj.type || `https://errors.oshift.ai/${defaultCode}`),
        title: String(obj.title || defaultTitle),
        status: typeof obj.status === "number" ? obj.status : status,
        detail: String(obj.detail || obj.title || statusText),
        instance: typeof obj.instance === "string" ? obj.instance : url,
        code: typeof obj.code === "string" ? obj.code : defaultCode,
        ref: typeof obj.ref === "string" ? obj.ref : refHeader,
        retryable: typeof obj.retryable === "boolean" ? obj.retryable : (status === 429 || status >= 502),
        retry_after_seconds: typeof obj.retry_after_seconds === "number" ? obj.retry_after_seconds : retryAfterSeconds,
        timestamp: typeof obj.timestamp === "string" ? obj.timestamp : new Date().toISOString(),
        errors: fieldErrors,
      };
    }

    // Case 2: FastAPI legacy 422 validation ({ detail: [ { loc, msg, type } ] })
    if (Array.isArray(obj.detail)) {
      const fieldErrors: ErrorFieldDetail[] = obj.detail.map((d: unknown) => {
        if (d && typeof d === "object" && "msg" in d) {
          const item = d as { loc?: unknown[]; msg: unknown; type?: unknown };
          const locParts = Array.isArray(item.loc)
            ? item.loc.filter((p) => p !== "body").map(String)
            : [];
          return {
            field: locParts.join(".") || "request",
            message: String(item.msg),
            code: typeof item.type === "string" ? item.type : "INVALID_FIELD",
          };
        }
        return { message: JSON.stringify(d) };
      });
      const summaryMsg = fieldErrors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join("; ");
      return {
        type: "https://errors.oshift.ai/VALIDATION_FAILED",
        title: "Validation Error",
        status: status === 200 ? 422 : status,
        detail: summaryMsg || "Request validation failed",
        instance: url,
        code: "VALIDATION_FAILED",
        ref: refHeader,
        retryable: false,
        timestamp: new Date().toISOString(),
        errors: fieldErrors,
      };
    }

    // Case 3: Simple JSON error ({ error: "..." } or { detail: "..." } or { message: "..." })
    const msg = typeof obj.detail === "string" ? obj.detail : (typeof obj.error === "string" ? obj.error : (typeof obj.message === "string" ? obj.message : null));
    if (msg) {
      return {
        type: `https://errors.oshift.ai/${defaultCode}`,
        title: defaultTitle,
        status,
        detail: msg,
        instance: url,
        code: typeof obj.code === "string" ? obj.code : defaultCode,
        ref: typeof obj.ref === "string" ? obj.ref : refHeader,
        retryable: typeof obj.retryable === "boolean" ? obj.retryable : (status === 429 || status >= 502),
        retry_after_seconds: retryAfterSeconds,
        timestamp: new Date().toISOString(),
        errors: [],
      };
    }
  }

  // Case 4: Plaintext / HTML (Sanitize to avoid leaking raw HTML tags into UI)
  const isHtml = /<[a-z][\s\S]*>/i.test(rawText);
  const safeDetail = isHtml
    ? (statusText || `HTTP ${status} error`)
    : (rawText.slice(0, 300).trim() || statusText || `HTTP ${status} error`);

  return {
    type: `https://errors.oshift.ai/${defaultCode}`,
    title: defaultTitle,
    status,
    detail: safeDetail,
    instance: url,
    code: defaultCode,
    ref: refHeader,
    retryable: status === 429 || status >= 502,
    retry_after_seconds: retryAfterSeconds,
    timestamp: new Date().toISOString(),
    errors: [],
  };
}

export async function apiFetch<T>(
  path: string,
  init?: ApiFetchOptions,
): Promise<ApiResult<T>> {
  const token = init?.skipAuth ? null : await getAccessToken();
  const requestId = init?.requestId || `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const hasExplicitAuth = init?.headers && new Headers(init.headers).has("Authorization");
  if (!token && !init?.skipAuth && !hasExplicitAuth) {
    const authError = new ApiError({
      message: "Not signed in",
      status: 401,
      code: "AUTHENTICATION_REQUIRED",
      requestId,
      retryable: false,
    });
    return {
      ok: false,
      error: "Not signed in",
      status: 401,
      apiError: authError,
      requestId,
    };
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = normalized.startsWith("/v1/")
    ? `${base}${normalized}`
    : `${base}/v1${normalized}`;

  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("X-Request-ID", requestId);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!init?.skipWorkspace) {
    const workspaceId = normalized.includes("/workspaces")
      ? readStoredWorkspaceId()
      : await resolveWorkspaceId();
    if (workspaceId) {
      headers.set("X-Workspace-ID", workspaceId);
    }
  }

  const timeoutMs = init?.timeoutMs !== undefined ? init.timeoutMs : DEFAULT_TIMEOUT_MS;
  const { controller, cleanup, isTimeout } = createTimeoutController(init?.signal, timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });

    const responseHeaders = res.headers;
    const effectiveRequestId = responseHeaders?.get("x-request-id") || requestId;
    const ref = responseHeaders?.get("x-error-ref") || undefined;
    const text = await res.text();

    if (!res.ok) {
      const problem = parseProblemDetails(res.status, res.statusText, text, url, responseHeaders || new Headers());
      const apiError = ApiError.fromProblem(problem, responseHeaders, effectiveRequestId);
      return {
        ok: false,
        error: problem.detail || problem.title || res.statusText,
        status: res.status,
        problem,
        apiError,
        ref: problem.ref || ref,
        requestId: effectiveRequestId,
      };
    }

    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as unknown as T;
      }
    } else if (res.status === 204) {
      data = null as unknown as T;
    }

    return {
      ok: true,
      data: data as T,
      status: res.status,
      headers: responseHeaders,
      requestId: effectiveRequestId,
    };
  } catch (err: unknown) {
    if (isTimeout()) {
      const apiError = ApiError.fromTimeout(timeoutMs, url, requestId);
      return {
        ok: false,
        error: apiError.message,
        status: 504,
        problem: apiError.problem,
        apiError,
        requestId,
      };
    }

    if (init?.signal?.aborted) {
      const apiError = ApiError.fromAbort(url, requestId);
      return {
        ok: false,
        error: apiError.message,
        status: 499,
        problem: apiError.problem,
        apiError,
        requestId,
      };
    }

    const apiError = ApiError.fromNetworkError(err, url, requestId);
    return {
      ok: false,
      error: apiError.message,
      status: 0,
      problem: apiError.problem,
      apiError,
      requestId,
    };
  } finally {
    cleanup();
  }
}

export async function apiFetchOrThrow<T>(
  path: string,
  init?: ApiFetchOptions
): Promise<T> {
  const res = await apiFetch<T>(path, init);
  if (!res.ok) {
    throw res.apiError;
  }
  return res.data;
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
  const workspaceId = await resolveWorkspaceId();

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
    const problem = parseProblemDetails(res.status, res.statusText, text, url, res.headers);
    yield {
      type: "error",
      data: {
        status: res.status,
        statusText: res.statusText,
        body: text,
        problem,
        code: problem.code,
        ref: problem.ref || res.headers.get("x-error-ref"),
        retryable: problem.retryable,
      },
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

export type OpportunityGenerationStatus =
  | "generated"
  | "no_opportunities"
  | "insufficient_evidence"
  | "synthesis_failed";

export interface OpportunityGenerateResponse {
  status: OpportunityGenerationStatus;
  reason: string;
  items: Opportunity[];
  created: number;
  gaps_considered: number;
  signals_considered: number;
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

export async function generateOpportunities(): Promise<ApiResult<OpportunityGenerateResponse>> {
  return apiFetch<OpportunityGenerateResponse>("/opportunities/generate", {
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
    body: JSON.stringify({
      workflow_type: "oshift/crawlers.run",
      chain: ["oshift/analyzers.run", "oshift/reporters.run"],
    }),
  });
}

export interface InsightSource {
  id: string;
  title: string | null;
  url: string | null;
  source: string | null;
  captured_at: string | null;
}

export interface InsightGap {
  id: string;
  competitor_id: string | null;
  layer: "gap" | "act_now" | "alarm_for_us";
  title: string;
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
  thumbnail_url?: string | null;
  media_urls?: string[];
  captured_at: string | null;
}

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

export function campaignThemes(campaign: Campaign): string[] {
  const raw = campaign.metadata?.themes;
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
}

export function campaignPlatforms(campaign: Campaign): string[] {
  const seen = new Set<string>();
  for (const post of campaign.posts ?? []) {
    const p = post.platform?.trim();
    if (p) seen.add(p);
  }
  return [...seen];
}

export function campaignThumbnails(campaign: Campaign): string[] {
  const urls: string[] = [];
  for (const post of campaign.posts ?? []) {
    if (post.thumbnail_url?.trim()) {
      urls.push(post.thumbnail_url.trim());
    }
    if (Array.isArray(post.media_urls)) {
      for (const m of post.media_urls) {
        if (m && typeof m === "string" && m.trim() && !urls.includes(m.trim())) {
          urls.push(m.trim());
        }
      }
    }
  }
  return urls;
}

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

export interface CompanyUpsert {
  name: string;
  website: string;
  description?: string | null;
  industry?: string | null;
  founding_year?: number | null;
  metadata?: Record<string, unknown>;
}

export async function upsertCompany(
  body: CompanyUpsert,
): Promise<ApiResult<Company>> {
  return apiFetch<Company>("/company", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export interface CompetitorCreate {
  name: string;
  website: string;
  description?: string | null;
  industry?: string | null;
  metadata?: Record<string, unknown>;
}

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

export interface CompanyAnalyticsPoint {
  timestamp: string;
  followers: number | null;
  views: number | null;
  engagement_rate: number | null;
}

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

export interface Watchlist {
  id: string;
  workspace_id: string;
  name: string | null;
  description: string | null;
  item_count: number;
  created_at: string;
}

export interface WatchlistItem {
  competitor_id: string;
  name: string | null;
  website: string | null;
  created_at: string;
}

export interface WatchlistDetail {
  id: string;
  workspace_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  items: WatchlistItem[];
}

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

export async function fetchWatchlist(
  watchlistId: string,
): Promise<ApiResult<WatchlistDetail>> {
  return apiFetch<WatchlistDetail>(`/competitors/watchlists/${watchlistId}`);
}

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

export async function removeWatchlistItem(
  watchlistId: string,
  competitorId: string,
): Promise<ApiResult<void>> {
  return apiFetch<void>(
    `/competitors/watchlists/${watchlistId}/items/${competitorId}`,
    { method: "DELETE" },
  );
}

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
  metadata?: Record<string, unknown> | null;
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
  counts: Record<string, number>;
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

export async function getVideoAssets(competitorId?: string): Promise<ApiResult<VideoAsset[]>> {
  const query = competitorId ? `?competitor_id=${encodeURIComponent(competitorId)}` : "";
  return apiFetch<VideoAsset[]>(`/video/assets${query}`);
}

export async function getVideoAsset(id: string): Promise<ApiResult<VideoAsset>> {
  return apiFetch<VideoAsset>(`/video/assets/${id}`);
}

export async function lookupVideo(videoUrl: string): Promise<ApiResult<VideoLookupResponse>> {
  const query = `?video_url=${encodeURIComponent(videoUrl)}`;
  return apiFetch<VideoLookupResponse>(`/video/lookup${query}`);
}

export async function collectVideo(body: VideoCollectRequest): Promise<ApiResult<VideoCollectResult>> {
  return apiFetch<VideoCollectResult>("/video/collect", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function downloadVideo(body: VideoDownloadRequest): Promise<ApiResult<VideoDownloadResponse>> {
  return apiFetch<VideoDownloadResponse>("/video/download", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function analyzeVideoPath(body: {
  competitor_id?: string | null;
  file_path?: string;
  video_url?: string;
  api_key?: string;
}): Promise<ApiResult<VideoCollectResult>> {
  return apiFetch<VideoCollectResult>("/video/analyze-path", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
