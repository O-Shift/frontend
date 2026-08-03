import { createClient } from "@/utils/supabase/client";
import { getApiBaseUrl } from "@/lib/auth/constants";
import { emitLog } from "@/components/LogPanel";

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
  const startTime = Date.now();
  const token = await getAccessToken();
  if (!token) {
    emitLog({
      type: "api",
      method: init?.method || "GET",
      path,
      status: 401,
      summary: `${init?.method || "GET"} ${path} - 401 Not signed in`,
    });
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
    const durationMs = Date.now() - startTime;
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as T;
      }
    }
    if (!res.ok) {
      let errMsg = res.statusText || `HTTP ${res.status} Error`;
      if (data && typeof data === "object" && "detail" in data) {
        const detail = (data as { detail: unknown }).detail;
        if (typeof detail === "string") {
          errMsg = detail;
        } else if (Array.isArray(detail)) {
          errMsg = detail.map((d) => (typeof d === "object" && d !== null ? (d.msg || JSON.stringify(d)) : String(d))).join(", ");
        } else if (typeof detail === "object" && detail !== null) {
          errMsg = (detail as any).msg || JSON.stringify(detail);
        } else {
          errMsg = String(detail);
        }
      }
      emitLog({
        type: "api",
        method: init?.method || "GET",
        path,
        status: res.status,
        durationMs,
        summary: `${init?.method || "GET"} ${path} (${res.status})`,
        details: { error: errMsg, response: data },
      });
      return { ok: false, error: errMsg, status: res.status };
    }
    emitLog({
      type: "api",
      method: init?.method || "GET",
      path,
      status: res.status,
      durationMs,
      summary: `${init?.method || "GET"} ${path} (${res.status})`,
      details: data,
    });
    return { ok: true, data: data as T, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    emitLog({
      type: "api",
      method: init?.method || "GET",
      path,
      status: 0,
      summary: `${init?.method || "GET"} ${path} (Network error)`,
      details: { error: msg },
    });
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

  emitLog({
    type: "sse",
    method: "POST",
    path,
    summary: `SSE connect ${path}`,
    details: body,
  });

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
    emitLog({
      type: "sse",
      method: "POST",
      path,
      status: res.status,
      summary: `SSE error ${path} (${res.status})`,
      details: text,
    });
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
          emitLog({
            type: "sse",
            method: "POST",
            path,
            summary: `SSE event: ${json.type || "message"}`,
            details: json,
          });
          yield { type: json.type || "message", data: json, raw: payload };
        } catch {
          yield { type: "raw", data: payload, raw: payload };
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emitLog({
      type: "sse",
      method: "POST",
      path,
      summary: `SSE network disconnect ${path}`,
      details: { error: msg },
    });
    yield {
      type: "error",
      data: { content: `Network connection error: ${msg}` },
      raw: msg,
    };
  }
}


