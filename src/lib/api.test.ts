import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  apiFetch,
  apiFetchOrThrow,
  ApiError,
  parseProblemDetails,
  type ProblemDetails,
} from "./api.ts";

describe("Frontend API Client Hardening & RFC 9457 Test Suite", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    if (typeof globalThis.sessionStorage === "undefined") {
      const store = new Map<string, string>();
      globalThis.sessionStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        length: store.size,
      } as Storage;
    }
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // =========================================================================
  // SUITE 1: RFC 9457 Problem Details Parsing
  // =========================================================================
  describe("Suite 1: RFC 9457 Problem Details Parsing", () => {
    it("parses 503 DATABASE_UNAVAILABLE with ref, retryable, and retry_after", async () => {
      const payload: ProblemDetails = {
        type: "https://errors.oshift.ai/DATABASE_UNAVAILABLE",
        title: "Service Unavailable",
        status: 503,
        detail: "Database connection pool exhausted. Please retry shortly.",
        instance: "/v1/opportunities",
        code: "DATABASE_UNAVAILABLE",
        ref: "ERR-8F3K2",
        retryable: true,
        retry_after_seconds: 5.0,
        timestamp: "2026-08-28T09:30:00Z",
        errors: [],
      };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(payload), {
          status: 503,
          statusText: "Service Unavailable",
          headers: {
            "Content-Type": "application/problem+json",
            "X-Error-Ref": "ERR-8F3K2",
            "Retry-After": "5",
            "X-Request-Id": "req-test-123",
          },
        });

      const res = await apiFetch<unknown>("/opportunities", { skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 503);
      assert.equal(res.error, "Database connection pool exhausted. Please retry shortly.");
      assert.equal(res.ref, "ERR-8F3K2");
      assert.equal(res.requestId, "req-test-123");

      assert.ok(res.apiError instanceof ApiError);
      assert.equal(res.apiError.code, "DATABASE_UNAVAILABLE");
      assert.equal(res.apiError.ref, "ERR-8F3K2");
      assert.equal(res.apiError.retryable, true);
      assert.equal(res.apiError.retryAfterSeconds, 5.0);
      assert.equal(res.apiError.isServerError, true);
      assert.equal(res.apiError.isRateLimited, false);
      assert.equal(
        res.apiError.getUserMessage(),
        "Database connection pool exhausted. Please retry shortly. (Reference: ERR-8F3K2)"
      );
    });

    it("parses 429 RATE_LIMITED with retryable and backoff seconds", async () => {
      const payload: ProblemDetails = {
        type: "https://errors.oshift.ai/RATE_LIMITED",
        title: "Too Many Requests",
        status: 429,
        detail: "Rate limit exceeded. Maximum 10 requests per minute.",
        instance: "/v1/competitors",
        code: "RATE_LIMITED",
        ref: "ERR-9X2M1",
        retryable: true,
        retry_after_seconds: 12.0,
        timestamp: "2026-08-28T09:35:00Z",
        errors: [],
      };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(payload), {
          status: 429,
          headers: {
            "Content-Type": "application/problem+json",
            "X-Error-Ref": "ERR-9X2M1",
            "Retry-After": "12",
          },
        });

      const res = await apiFetch<unknown>("/competitors", { skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 429);
      assert.equal(res.apiError.code, "RATE_LIMITED");
      assert.equal(res.apiError.isRateLimited, true);
      assert.equal(res.apiError.retryable, true);
      assert.equal(res.apiError.retryAfterSeconds, 12.0);
    });
  });

  // =========================================================================
  // SUITE 2: RFC 9457 Validation Errors List Extraction
  // =========================================================================
  describe("Suite 2: RFC 9457 Validation Errors List Extraction", () => {
    it("parses granular validation errors and supports getFieldErrors()", async () => {
      const payload: ProblemDetails = {
        type: "https://errors.oshift.ai/VALIDATION_FAILED",
        title: "Validation Error",
        status: 422,
        detail: "Validation failed for competitor creation",
        instance: "/v1/competitors",
        code: "VALIDATION_FAILED",
        retryable: false,
        timestamp: "2026-08-28T09:40:00Z",
        errors: [
          { field: "name", message: "Company name is required", code: "missing" },
          { field: "website", message: "Invalid URL format", code: "invalid_url" },
        ],
      };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(payload), {
          status: 422,
          headers: { "Content-Type": "application/problem+json" },
        });

      const res = await apiFetch<unknown>("/competitors", { method: "POST", skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 422);
      assert.equal(res.apiError.code, "VALIDATION_FAILED");
      assert.equal(res.apiError.errors.length, 2);

      const fieldMap = res.apiError.getFieldErrors();
      assert.equal(fieldMap["name"], "Company name is required");
      assert.equal(fieldMap["website"], "Invalid URL format");
    });
  });

  // =========================================================================
  // SUITE 3: Legacy FastAPI 422 Detail Array Handling
  // =========================================================================
  describe("Suite 3: Legacy FastAPI 422 Format Handling", () => {
    it("extracts field paths and messages from raw FastAPI detail array", async () => {
      const legacyPayload = {
        detail: [
          {
            loc: ["body", "items", 0, "website"],
            msg: "Input should be a valid URL, relative URL without a base",
            type: "url_parsing",
          },
          {
            loc: ["body", "industry"],
            msg: "Field required",
            type: "missing",
          },
        ],
      };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(legacyPayload), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });

      const res = await apiFetch<unknown>("/company", { method: "PUT", skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 422);
      assert.ok(res.error.includes("items.0.website: Input should be a valid URL"));
      assert.ok(res.error.includes("industry: Field required"));
      assert.equal(res.apiError.code, "VALIDATION_FAILED");

      const fieldMap = res.apiError.getFieldErrors();
      assert.equal(fieldMap["items.0.website"], "Input should be a valid URL, relative URL without a base");
      assert.equal(fieldMap["industry"], "Field required");
    });
  });

  // =========================================================================
  // SUITE 4: Fallback Parsing for HTML Gateway Responses
  // =========================================================================
  describe("Suite 4: Fallback Parsing for HTML & Bad Gateway", () => {
    it("sanitizes Cloudflare / Nginx 502 HTML without leaking HTML tags into error", async () => {
      const rawHtml = "<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1><hr>cloudflare</body></html>";

      globalThis.fetch = async () =>
        new Response(rawHtml, {
          status: 502,
          statusText: "Bad Gateway",
          headers: { "Content-Type": "text/html", "X-Error-Ref": "ERR-GAT01" },
        });

      const res = await apiFetch<unknown>("/health", { skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 502);
      // Ensure raw HTML tags are NOT in error string
      assert.equal(res.error.includes("<html"), false);
      assert.equal(res.error.includes("<h1>"), false);
      assert.equal(res.ref, "ERR-GAT01");
      assert.equal(res.apiError.retryable, true);
    });
  });

  // =========================================================================
  // SUITE 5: Plaintext & Empty Error Responses
  // =========================================================================
  describe("Suite 5: Plaintext & Empty Error Responses", () => {
    it("parses raw plaintext 500 error", async () => {
      globalThis.fetch = async () =>
        new Response("Internal Server Error: pool connection timeout", {
          status: 500,
          statusText: "Internal Server Error",
          headers: { "Content-Type": "text/plain" },
        });

      const res = await apiFetch<unknown>("/test", { skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 500);
      assert.equal(res.error, "Internal Server Error: pool connection timeout");
      assert.equal(res.apiError.isServerError, true);
    });

    it("handles empty 404 response body without crashing", async () => {
      globalThis.fetch = async () =>
        new Response("", {
          status: 404,
          statusText: "Not Found",
        });

      const res = await apiFetch<unknown>("/missing", { skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 404);
      assert.equal(res.error, "Not Found");
      assert.equal(res.apiError.code, "RESOURCE_NOT_FOUND");
    });
  });

  // =========================================================================
  // SUITE 6: Bounded Timeout Enforcement (504 UPSTREAM_TIMEOUT)
  // =========================================================================
  describe("Suite 6: Bounded Timeout Aborts", () => {
    it("aborts hung request after timeoutMs and produces 504 UPSTREAM_TIMEOUT", async () => {
      globalThis.fetch = async (url, init) => {
        return new Promise((resolve, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted", "AbortError"));
            });
          }
        });
      };

      const start = Date.now();
      const res = await apiFetch<unknown>("/slow", { timeoutMs: 50, skipAuth: true });
      const elapsed = Date.now() - start;

      assert.ok(elapsed < 500, `Expected abort within ~50ms, took ${elapsed}ms`);
      assert.equal(res.ok, false);
      assert.equal(res.status, 504);
      assert.equal(res.apiError.code, "UPSTREAM_TIMEOUT");
      assert.equal(res.apiError.isTimeout, true);
      assert.equal(res.apiError.retryable, true);
    });
  });

  // =========================================================================
  // SUITE 7: User Cancellation Safety (499 REQUEST_ABORTED)
  // =========================================================================
  describe("Suite 7: User AbortSignal Cancellation", () => {
    it("produces 499 REQUEST_ABORTED when caller signal aborts", async () => {
      const ac = new AbortController();

      globalThis.fetch = async (url, init) => {
        return new Promise((resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            return reject(new DOMException("User navigation", "AbortError"));
          }
          if (signal) {
            signal.addEventListener("abort", () => {
              reject(new DOMException("User navigation", "AbortError"));
            });
          }
        });
      };

      const fetchPromise = apiFetch<unknown>("/cancel", { signal: ac.signal, timeoutMs: 5000, skipAuth: true });
      // Trigger user cancellation
      ac.abort();

      const res = await fetchPromise;

      assert.equal(res.ok, false);
      assert.equal(res.status, 499);
      assert.equal(res.apiError.code, "REQUEST_ABORTED");
      assert.equal(res.apiError.isAborted, true);
      assert.equal(res.apiError.retryable, false); // Never retry user aborts!
    });
  });

  // =========================================================================
  // SUITE 8: Network Failure Handling (0 NETWORK_CONNECTION_FAILED)
  // =========================================================================
  describe("Suite 8: Network Connection Failure", () => {
    it("maps TypeError fetch failure to status 0 and NETWORK_CONNECTION_FAILED", async () => {
      globalThis.fetch = async () => {
        throw new TypeError("Failed to fetch");
      };

      const res = await apiFetch<unknown>("/network-fail", { skipAuth: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 0);
      assert.equal(res.error, "Failed to fetch");
      assert.equal(res.apiError.code, "NETWORK_CONNECTION_FAILED");
      assert.equal(res.apiError.isNetworkError, true);
      assert.equal(res.apiError.retryable, true);
    });
  });

  // =========================================================================
  // SUITE 9: Correlation Header Propagation
  // =========================================================================
  describe("Suite 9: Correlation Header Propagation", () => {
    it("generates X-Request-ID and binds inbound X-Error-Ref from header", async () => {
      let capturedHeaders: Headers | null = null;

      globalThis.fetch = async (url, init) => {
        capturedHeaders = new Headers(init?.headers);
        return new Response(JSON.stringify({ error: "Failed" }), {
          status: 500,
          headers: {
            "X-Error-Ref": "ERR-K7L9P",
            "X-Request-Id": capturedHeaders.get("X-Request-ID") || "generated-id",
          },
        });
      };

      const res = await apiFetch<unknown>("/test-headers", { skipAuth: true });

      assert.ok(capturedHeaders);
      assert.ok((capturedHeaders as Headers).has("X-Request-ID"));
      assert.ok(/^req-/.test((capturedHeaders as Headers).get("X-Request-ID")!));
      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.ref, "ERR-K7L9P");
        assert.equal(res.apiError.ref, "ERR-K7L9P");
      }
    });
  });

  // =========================================================================
  // SUITE 10: Backward Compatibility & apiFetchOrThrow
  // =========================================================================
  describe("Suite 10: Backward Compatibility & apiFetchOrThrow", () => {
    it("returns typed data on 200 OK", async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ items: [1, 2, 3] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const res = await apiFetch<{ items: number[] }>("/items", { skipAuth: true });

      assert.equal(res.ok, true);
      assert.deepEqual(res.data, { items: [1, 2, 3] });
      assert.equal(res.status, 200);
    });

    it("apiFetchOrThrow throws ApiError on failure", async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ detail: "Not found", code: "RESOURCE_NOT_FOUND" }), {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        });

      await assert.rejects(
        async () => {
          await apiFetchOrThrow("/item/404", { skipAuth: true });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal((err as ApiError).status, 404);
          assert.equal((err as ApiError).code, "RESOURCE_NOT_FOUND");
          return true;
        }
      );
    });
  });
});
