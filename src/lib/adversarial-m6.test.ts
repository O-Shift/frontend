import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  apiFetch,
  apiFetchOrThrow,
  ApiError,
  parseProblemDetails,
  type ProblemDetails,
  type ApiFetchOptions,
} from "./api.ts";
import { generateClientErrorRef } from "./error-reference.ts";
import { ToastRateLimiter } from "./toast-limiter.ts";

describe("Milestone 6 Tier 5 Frontend Adversarial Coverage Hardening Suite", () => {
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
  // 1. Hostile / Corrupted Problem Details Responses
  // =========================================================================
  describe("Boundary 5.1: Malformed & Hostile Problem Details Payloads", () => {
    it("handles deeply nested cyclic or invalid object shapes gracefully in parseProblemDetails", () => {
      const raw = JSON.stringify({
        type: null,
        title: 12345, // invalid title type
        status: "500", // string status instead of int
        detail: { nested: { object: "instead of string" } },
        instance: ["array", "instance"],
        code: 999,
        ref: null,
        retryable: "yes", // string instead of bool
        retry_after_seconds: "invalid",
        errors: "not-an-array",
      });

      const headers = new Headers({
        "Content-Type": "application/problem+json",
        "X-Error-Ref": "ERR-99XYZ",
      });

      const problem = parseProblemDetails(500, "Internal Server Error", raw, "/v1/test", headers);
      assert.equal(problem.status, 500);
      assert.equal(typeof problem.detail, "string");
      assert.equal(problem.ref, "ERR-99XYZ");
    });

    it("handles HTTP 504 with raw HTML cloudflare timeout page", () => {
      const html504 = `
        <!DOCTYPE html>
        <html>
        <head><title>504 Gateway Time-out</title></head>
        <body>
          <center><h1>504 Gateway Time-out</h1></center>
          <hr><center>cloudflare / nginx 1.25.3</center>
          <!-- Internal debug: upstream proxy 10.0.4.15:8000 timed out after 60000ms -->
        </body>
        </html>
      `;

      const headers = new Headers({ "Content-Type": "text/html" });
      const problem = parseProblemDetails(504, "Gateway Timeout", html504, "/v1/query", headers);
      assert.equal(problem.status, 504);
      assert.equal(problem.code, "UPSTREAM_TIMEOUT");
      assert.equal(problem.retryable, true);
      assert.ok(!problem.detail.includes("<script>"));
      assert.ok(!problem.detail.includes("<!--"));
      assert.ok(!problem.detail.includes("10.0.4.15"));
    });

    it("handles zero-byte empty body on 500 response", () => {
      const headers = new Headers({ "Content-Type": "application/json" });
      const problem = parseProblemDetails(500, "Internal Server Error", "", "/v1/items", headers);
      assert.equal(problem.status, 500);
      assert.equal(problem.code, "UNEXPECTED_ERROR");
      assert.equal(problem.retryable, false);
      assert.ok(problem.detail.length > 0);
    });
  });

  // =========================================================================
  // 2. High-Concurrency Client Abort & Timeout Stress
  // =========================================================================
  describe("Boundary 5.2: Concurrency & AbortController Safety", () => {
    it("handles 50 concurrent requests with mixed timeouts, aborts, and successes", async () => {
      globalThis.fetch = async (input, init) => {
        const url = String(input);
        const signal = init?.signal;

        if (url.includes("/fast-success")) {
          return new Response(JSON.stringify({ status: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.includes("/slow-timeout")) {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              resolve(new Response(JSON.stringify({ status: "slow" }), { status: 200 }));
            }, 500);

            if (signal) {
              signal.addEventListener("abort", () => {
                clearTimeout(timer);
                reject(new DOMException("The operation was aborted.", "AbortError"));
              });
            }
          });
        }

        return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
      };

      const tasks: Promise<unknown>[] = [];

      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) {
          tasks.push(
            apiFetch("/fast-success", { skipAuth: true, timeoutMs: 100 }).then((res) => {
              assert.equal(res.status, 200);
              if (res.ok) {
                assert.deepEqual(res.data, { status: "ok" });
              } else {
                assert.fail("Expected ok to be true");
              }
            })
          );
        } else {
          tasks.push(
            apiFetch("/slow-timeout", { skipAuth: true, timeoutMs: 20 }).then((res) => {
              assert.equal(res.status, 504);
              if (!res.ok) {
                assert.equal(res.apiError?.code, "UPSTREAM_TIMEOUT");
              } else {
                assert.fail("Expected ok to be false");
              }
            })
          );
        }
      }

      await Promise.all(tasks);
    });

    it("caller-supplied AbortSignal abort cleanly translates to 499 REQUEST_ABORTED", async () => {
      const controller = new AbortController();

      globalThis.fetch = async (_input, init) => {
        const signal = init?.signal;
        return new Promise((_resolve, reject) => {
          if (signal) {
            signal.addEventListener("abort", () => {
              reject(new DOMException("The user aborted a request.", "AbortError"));
            });
          }
        });
      };

      const fetchPromise = apiFetch("/long-query", { skipAuth: true, signal: controller.signal });
      setTimeout(() => controller.abort(), 10);

      const result = await fetchPromise;
      assert.equal(result.status, 499);
      if (!result.ok) {
        assert.equal(result.apiError?.code, "REQUEST_ABORTED");
      } else {
        assert.fail("Expected ok to be false");
      }
    });
  });

  // =========================================================================
  // 3. Toast Limiter Flood & Storm Prevention
  // =========================================================================
  describe("Boundary 5.3: Toast Rate Limiter Flood Stress", () => {
    it("throttles 200 identical rapid error toasts into 1 toast with count 200", () => {
      const limiter = new ToastRateLimiter({
        throttleMs: 500,
        maxVisible: 3,
      });

      let showCount = 0;
      let suppressedCount = 0;
      let finalCount = 0;

      for (let i = 0; i < 200; i++) {
        const decision = limiter.shouldShow({
          code: "DATABASE_UNAVAILABLE",
          message: "Could not connect to database",
          status: 503,
        });

        if (decision.show) {
          showCount++;
        } else {
          suppressedCount++;
          finalCount = decision.count;
        }
      }

      assert.equal(showCount, 1, "Only first toast should be allowed to render");
      assert.equal(suppressedCount, 199, "Subsequent 199 toasts should be suppressed");
      assert.equal(finalCount, 200, "Final suppressed count should be exactly 200");
    });
  });

  // =========================================================================
  // 4. ApiError Ergonomics & Type Guards
  // =========================================================================
  describe("Boundary 5.4: ApiError Classification Invariants", () => {
    it("strictly differentiates client errors from transient retryable errors", () => {
      const authErr = new ApiError({
        message: "Please log in",
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
        retryable: false,
      });
      assert.equal(authErr.isAuthError, true);
      assert.equal(authErr.retryable, false);
      assert.equal(authErr.isClientError, true);
      assert.equal(authErr.isServerError, false);

      const dbErr = new ApiError({
        message: "DB busy",
        status: 503,
        code: "DATABASE_UNAVAILABLE",
        ref: "ERR-ABC12",
        retryable: true,
        retryAfterSeconds: 3,
      });
      assert.equal(dbErr.isAuthError, false);
      assert.equal(dbErr.retryable, true);
      assert.equal(dbErr.isServerError, true);
      assert.equal(dbErr.isClientError, false);
      assert.equal(dbErr.ref, "ERR-ABC12");
      assert.match(dbErr.ref ?? "", /^ERR-[0-9A-HJ-JKMNP-TV-Z]{5}$/);
    });
  });
});
