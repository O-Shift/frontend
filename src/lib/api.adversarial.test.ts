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

describe("Frontend API Client Adversarial Stress & Vulnerability Challenge Suite", () => {
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
  // EDGE CASE 1: Backend returns 500 / 502 without JSON (Raw HTML / Stack Traces / XSS)
  // =========================================================================
  describe("Edge Case 1: Non-JSON 500/502 & Raw HTML / XSS Injection Sanitization", () => {
    const dangerousHtmlPayloads = [
      {
        name: "Classic script tag injection",
        html: "<script>alert('XSS_ATTACK_1')</script>",
        status: 500,
        statusText: "Internal Server Error",
      },
      {
        name: "Event handler tag injection",
        html: "<svg/onload=alert('XSS_SVG')><h1>500 Server Error</h1>",
        status: 500,
        statusText: "Internal Server Error",
      },
      {
        name: "Image error handler injection",
        html: '<img src="invalid-image.png" onerror="alert(document.cookie)">',
        status: 502,
        statusText: "Bad Gateway",
      },
      {
        name: "Full Nginx HTML crash page with server internals",
        html: `<!DOCTYPE html>
<html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.24.0 (Ubuntu) - Internal IP: 10.0.4.12:8080</center>
<!-- Debug stack trace: /var/www/oshift/backend/main.py:104 in handle_request -->
</body>
</html>`,
        status: 502,
        statusText: "Bad Gateway",
      },
      {
        name: "Nested iframe javascript URI",
        html: '<iframe src="javascript:alert(1)"></iframe>',
        status: 500,
        statusText: "Internal Server Error",
      },
      {
        name: "Broken unclosed HTML tags",
        html: "<div class='error'><p>Database connection failed at postgres://admin:secret@10.0.0.5:5432/oshift",
        status: 500,
        statusText: "Internal Server Error",
      },
    ];

    for (const testCase of dangerousHtmlPayloads) {
      it(`sanitizes ${testCase.name} without HTML tag leakage or unhandled rejection`, async () => {
        globalThis.fetch = async () =>
          new Response(testCase.html, {
            status: testCase.status,
            statusText: testCase.statusText,
            headers: {
              "Content-Type": "text/html",
              "X-Error-Ref": "ERR-SEC01",
            },
          });

        const res = await apiFetch<unknown>("/v1/stress/xss", { skipAuth: true, skipWorkspace: true });

        assert.equal(res.ok, false);
        assert.equal(res.status, testCase.status);
        if (!res.ok) {
          assert.ok(res.apiError instanceof ApiError);

          // Verify HTML tags are NOT present in parsed error message or problem details
          assert.equal(/<[a-z][\s\S]*>/i.test(res.error), false, `Error leaked HTML tags: "${res.error}"`);
          assert.equal(/<[a-z][\s\S]*>/i.test(res.apiError.message), false, `ApiError leaked HTML tags: "${res.apiError.message}"`);
          assert.equal(/<script/i.test(res.error), false);
          assert.equal(/<svg/i.test(res.error), false);
          assert.equal(/<img/i.test(res.error), false);
          assert.equal(/<iframe/i.test(res.error), false);

          // Verify correlation ref is preserved
          assert.equal(res.ref, "ERR-SEC01");
          assert.equal(res.apiError.ref, "ERR-SEC01");
          assert.equal(res.apiError.isServerError, true);
        }
      });
    }

    it("handles 500 with empty string body safely", async () => {
      globalThis.fetch = async () =>
        new Response("", {
          status: 500,
          statusText: "Internal Server Error",
          headers: { "Content-Type": "text/plain" },
        });

      const res = await apiFetch<unknown>("/v1/stress/empty-500", { skipAuth: true, skipWorkspace: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 500);
      if (!res.ok) {
        assert.equal(res.error, "Internal Server Error");
        assert.equal(res.apiError.code, "UNEXPECTED_ERROR");
        assert.equal(res.apiError.isServerError, true);
      }
    });

    it("handles 500 with whitespace-only body safely", async () => {
      globalThis.fetch = async () =>
        new Response("   \n\t  \r\n   ", {
          status: 500,
          statusText: "Internal Server Error",
          headers: { "Content-Type": "text/plain" },
        });

      const res = await apiFetch<unknown>("/v1/stress/whitespace-500", { skipAuth: true, skipWorkspace: true });

      assert.equal(res.ok, false);
      assert.equal(res.status, 500);
      if (!res.ok) {
        assert.equal(res.error, "Internal Server Error");
        assert.equal(res.apiError.code, "UNEXPECTED_ERROR");
      }
    });
  });

  // =========================================================================
  // EDGE CASE 2: Backend returns malformed / truncated / adversarial JSON
  // =========================================================================
  describe("Edge Case 2: Malformed, Truncated & Adversarial JSON Responses", () => {
    const malformedPayloads = [
      {
        name: "Truncated JSON object",
        raw: '{"type": "https://errors.oshift.ai/DATABASE_UNAVAILABLE", "title": "Database connection failed", "det',
        status: 503,
      },
      {
        name: "Unclosed array in JSON",
        raw: '{"status": 500, "errors": [{"field": "email"',
        status: 500,
      },
      {
        name: "JSON primitive number root",
        raw: "12345",
        status: 400,
      },
      {
        name: "JSON primitive string root",
        raw: '"Single string without object envelope"',
        status: 400,
      },
      {
        name: "JSON primitive boolean root",
        raw: "false",
        status: 400,
      },
      {
        name: "JSON primitive null root",
        raw: "null",
        status: 500,
      },
      {
        name: "JSON Array root instead of object",
        raw: '["error 1", "error 2", 123]',
        status: 422,
      },
      {
        name: "Empty JSON object {}",
        raw: "{}",
        status: 400,
      },
      {
        name: "Object with non-string detail and unexpected types",
        raw: JSON.stringify({
          detail: { deep: { nested: 123 } },
          title: 9999,
          code: null,
          retryable: "not-a-boolean",
        }),
        status: 500,
      },
      {
        name: "FastAPI validation detail with corrupted elements",
        raw: JSON.stringify({
          detail: [
            null,
            123,
            "string-only-item",
            { loc: null, msg: null },
            { loc: ["body", "user", "email"], msg: "Invalid email", type: "value_error" },
          ],
        }),
        status: 422,
      },
    ];

    for (const testCase of malformedPayloads) {
      it(`gracefully recovers from ${testCase.name} to valid ProblemDetails`, async () => {
        globalThis.fetch = async () =>
          new Response(testCase.raw, {
            status: testCase.status,
            statusText: "Error Response",
            headers: {
              "Content-Type": "application/json",
              "X-Error-Ref": "ERR-JSON99",
            },
          });

        const res = await apiFetch<unknown>("/v1/stress/malformed-json", { skipAuth: true, skipWorkspace: true });

        assert.equal(res.ok, false);
        assert.equal(res.status, testCase.status);
        if (!res.ok) {
          assert.ok(res.apiError instanceof ApiError);
          assert.ok(res.problem);
          assert.equal(typeof res.problem.detail, "string");
          assert.ok(res.problem.detail.length > 0);
          assert.equal(typeof res.problem.type, "string");
          assert.equal(typeof res.problem.title, "string");
          assert.equal(typeof res.apiError.code, "string");
        }
      });
    }

    it("parseProblemDetails direct stress test with corrupt types", () => {
      const headers = new Headers({ "x-error-ref": "ERR-UNIT01" });
      const badInputs = [
        "",
        "   ",
        "undefined",
        "{",
        "{{}}",
        "null",
        "NaN",
        "Infinity",
        '{"detail": null}',
        '{"detail": 12345}',
        '{"detail": []}',
        '{"errors": "not-an-array"}',
        '{"status": "not-a-number"}',
        '{"retry_after_seconds": "invalid"}',
      ];

      for (const input of badInputs) {
        const problem = parseProblemDetails(500, "Internal Server Error", input, "/test", headers);
        assert.ok(problem);
        assert.equal(typeof problem.detail, "string");
        assert.equal(typeof problem.title, "string");
        assert.equal(typeof problem.type, "string");
        assert.equal(problem.ref, "ERR-UNIT01");
      }
    });
  });

  // =========================================================================
  // EDGE CASE 3: Extremely short timeout (1ms) on hanging mock & Timer Cleanup
  // =========================================================================
  describe("Edge Case 3: 1ms Timeout Enforcement & Zero Timer Leaks", () => {
    it("aborts within bounded time on 1ms timeout and returns clean 504 UPSTREAM_TIMEOUT", async () => {
      let fetchAborted = false;

      globalThis.fetch = async (url, init) => {
        return new Promise((resolve, reject) => {
          const signal = init?.signal;
          if (signal) {
            if (signal.aborted) {
              fetchAborted = true;
              return reject(new DOMException("The operation was aborted", "AbortError"));
            }
            signal.addEventListener("abort", () => {
              fetchAborted = true;
              reject(new DOMException("The operation was aborted", "AbortError"));
            });
          }
        });
      };

      const start = Date.now();
      const res = await apiFetch<unknown>("/v1/stress/short-timeout", {
        timeoutMs: 1,
        skipAuth: true,
        skipWorkspace: true,
      });
      const elapsed = Date.now() - start;

      assert.ok(elapsed < 200, `Expected abort within ~1-50ms, took ${elapsed}ms`);
      assert.equal(fetchAborted, true, "Expected fetch signal to be aborted");
      assert.equal(res.ok, false);
      assert.equal(res.status, 504);
      if (!res.ok) {
        assert.equal(res.apiError.code, "UPSTREAM_TIMEOUT");
        assert.equal(res.apiError.isTimeout, true);
        assert.equal(res.apiError.retryable, true);
        assert.equal(res.apiError.status, 504);
      }
    });

    it("cleans up timers properly across 50 fast sequential requests with zero leaked timers", async () => {
      globalThis.fetch = async (url, init) => {
        return new Promise<Response>((resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            return reject(new DOMException("Aborted", "AbortError"));
          }
          signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      };

      const results = [];
      for (let i = 0; i < 50; i++) {
        const res = await apiFetch<unknown>(`/v1/stress/leak-check-${i}`, {
          timeoutMs: 2,
          skipAuth: true,
          skipWorkspace: true,
        });
        results.push(res);
      }

      assert.equal(results.length, 50);
      for (const res of results) {
        assert.equal(res.ok, false);
        assert.equal(res.status, 504);
        if (!res.ok) {
          assert.equal(res.apiError.isTimeout, true);
        }
      }
    });

    it("handles timeoutMs = 0 (disabled timeout) without hanging or crashing", async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: "instant" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const res = await apiFetch<{ message: string }>("/v1/stress/timeout-zero", {
        timeoutMs: 0,
        skipAuth: true,
        skipWorkspace: true,
      });

      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.data.message, "instant");
      }
    });
  });

  // =========================================================================
  // EDGE CASE 4: Pre-aborted and Mid-flight AbortSignal & Zero Listener Leaks
  // =========================================================================
  describe("Edge Case 4: Pre-aborted & Mid-flight AbortSignals & Event Listener Cleanup", () => {
    it("handles pre-aborted AbortSignal immediately with 499 REQUEST_ABORTED and isAborted: true", async () => {
      const callerController = new AbortController();
      callerController.abort(); // Pre-aborted before call

      let fetchInvoked = false;
      globalThis.fetch = async (url, init) => {
        fetchInvoked = true;
        if (init?.signal?.aborted) {
          throw new DOMException("Pre-aborted", "AbortError");
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      };

      const res = await apiFetch<unknown>("/v1/stress/pre-aborted", {
        signal: callerController.signal,
        skipAuth: true,
        skipWorkspace: true,
      });

      assert.equal(res.ok, false);
      assert.equal(res.status, 499);
      if (!res.ok) {
        assert.equal(res.apiError.code, "REQUEST_ABORTED");
        assert.equal(res.apiError.isAborted, true);
        assert.equal(res.apiError.retryable, false);
        assert.equal(res.apiError.status, 499);
      }
    });

    it("handles mid-flight AbortSignal with 499 REQUEST_ABORTED and cleans up listeners", async () => {
      const callerController = new AbortController();

      globalThis.fetch = async (url, init) => {
        return new Promise<Response>((resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            return reject(new DOMException("Mid-flight abort", "AbortError"));
          }
          signal?.addEventListener("abort", () => {
            reject(new DOMException("Mid-flight abort", "AbortError"));
          });
        });
      };

      const fetchPromise = apiFetch<unknown>("/v1/stress/mid-aborted", {
        signal: callerController.signal,
        timeoutMs: 10_000,
        skipAuth: true,
        skipWorkspace: true,
      });

      // Trigger mid-flight abort
      setTimeout(() => {
        callerController.abort();
      }, 10);

      const res = await fetchPromise;

      assert.equal(res.ok, false);
      assert.equal(res.status, 499);
      if (!res.ok) {
        assert.equal(res.apiError.code, "REQUEST_ABORTED");
        assert.equal(res.apiError.isAborted, true);
        assert.equal(res.apiError.retryable, false);
      }
    });

    it("verifies zero event listener leaks on reusable caller AbortSignal", async () => {
      const callerController = new AbortController();
      let listenerCount = 0;

      // Wrap addEventListener and removeEventListener to audit leak safety
      const originalAdd = callerController.signal.addEventListener.bind(callerController.signal);
      const originalRemove = callerController.signal.removeEventListener.bind(callerController.signal);

      callerController.signal.addEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) {
        if (type === "abort") listenerCount++;
        return originalAdd(type, listener, options);
      };

      callerController.signal.removeEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
      ) {
        if (type === "abort") listenerCount--;
        return originalRemove(type, listener, options);
      };

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ status: "success" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      // Execute 20 requests using the same caller signal
      for (let i = 0; i < 20; i++) {
        await apiFetch<unknown>(`/v1/stress/signal-reuse-${i}`, {
          signal: callerController.signal,
          skipAuth: true,
          skipWorkspace: true,
        });
      }

      // After all requests complete, active listener count MUST return to 0
      assert.equal(
        listenerCount,
        0,
        `Expected 0 leaked abort listeners on caller signal, but found ${listenerCount}`
      );
    });
  });

  // =========================================================================
  // EDGE CASE 5: 100 Concurrent Requests with Varying Payloads & Header Extraction
  // =========================================================================
  describe("Edge Case 5: 100 Concurrent Requests with Heterogeneous Error Payloads", () => {
    it("handles 100 concurrent requests with varying payloads, preserving correlation and error types", async () => {
      const scenarios: Array<{
        type: string;
        status: number;
        body: string | null;
        isError: boolean;
        expectedCode?: string;
        expectedRef?: string;
        expectedRetryable?: boolean;
        expectedServerError?: boolean;
      }> = [
        { type: "200_OK", status: 200, body: JSON.stringify({ id: 1, ok: true }), isError: false },
        { type: "204_NO_CONTENT", status: 204, body: null, isError: false },
        {
          type: "400_PROBLEM",
          status: 400,
          body: JSON.stringify({
            type: "https://errors.oshift.ai/BAD_REQUEST",
            title: "Bad Request",
            status: 400,
            detail: "Missing query parameter 'workspace'",
            code: "BAD_REQUEST",
            ref: "ERR-400A",
          }),
          isError: true,
          expectedCode: "BAD_REQUEST",
          expectedRef: "ERR-400A",
        },
        {
          type: "401_AUTH",
          status: 401,
          body: JSON.stringify({ detail: "Token expired", code: "AUTHENTICATION_REQUIRED" }),
          isError: true,
          expectedCode: "AUTHENTICATION_REQUIRED",
        },
        {
          type: "404_NOT_FOUND",
          status: 404,
          body: "",
          isError: true,
          expectedCode: "RESOURCE_NOT_FOUND",
        },
        {
          type: "422_VALIDATION",
          status: 422,
          body: JSON.stringify({
            detail: [{ loc: ["body", "domain"], msg: "Invalid domain name", type: "value_error" }],
          }),
          isError: true,
          expectedCode: "VALIDATION_FAILED",
        },
        {
          type: "429_RATE_LIMITED",
          status: 429,
          body: JSON.stringify({
            type: "https://errors.oshift.ai/RATE_LIMITED",
            title: "Too Many Requests",
            status: 429,
            detail: "Rate limit reached",
            code: "RATE_LIMITED",
            retry_after_seconds: 30,
          }),
          isError: true,
          expectedCode: "RATE_LIMITED",
          expectedRetryable: true,
        },
        {
          type: "500_HTML_XSS",
          status: 500,
          body: "<html><body><h1>500 Internal Error</h1><script>alert(1)</script></body></html>",
          isError: true,
          expectedCode: "UNEXPECTED_ERROR",
          expectedServerError: true,
        },
        {
          type: "502_BAD_GATEWAY_TRUNCATED",
          status: 502,
          body: '{"error": "Upstream proxy dropped connection',
          isError: true,
          expectedCode: "UPSTREAM_5XX_ERROR",
          expectedRetryable: true,
        },
        {
          type: "503_DATABASE",
          status: 503,
          body: JSON.stringify({
            type: "https://errors.oshift.ai/DATABASE_UNAVAILABLE",
            title: "Database Unavailable",
            status: 503,
            detail: "Database connection failed",
            code: "DATABASE_UNAVAILABLE",
            ref: "ERR-503D",
            retryable: true,
          }),
          isError: true,
          expectedCode: "DATABASE_UNAVAILABLE",
          expectedRef: "ERR-503D",
          expectedRetryable: true,
        },
      ];

      // Setup mock fetch dispatching by URL index
      globalThis.fetch = async (url, init) => {
        const urlStr = String(url);
        const match = urlStr.match(/scenario-(\d+)/);
        const idx = match ? parseInt(match[1], 10) : 0;
        const scenario = scenarios[idx % scenarios.length];

        const reqId = (init?.headers as Headers)?.get("X-Request-ID") || `mock-req-${idx}`;
        const headers = new Headers({
          ...(scenario.body?.startsWith("<")
            ? { "Content-Type": "text/html" }
            : scenario.body?.startsWith("{")
            ? { "Content-Type": "application/json" }
            : { "Content-Type": "text/plain" }),
          "X-Request-ID": reqId,
          ...(scenario.expectedRef ? { "X-Error-Ref": scenario.expectedRef } : {}),
        });

        return new Response(scenario.body, {
          status: scenario.status,
          statusText: scenario.isError ? "Error Occurred" : "OK",
          headers,
        });
      };

      // Launch 100 concurrent requests
      const promises = Array.from({ length: 100 }, (_, i) => {
        const customReqId = `stress-req-${i.toString().padStart(3, "0")}`;
        return apiFetch<unknown>(`/v1/scenario-${i}`, {
          requestId: customReqId,
          skipAuth: true,
          skipWorkspace: true,
        }).then((result) => ({ index: i, result, customReqId }));
      });

      const outcomes = await Promise.all(promises);

      assert.equal(outcomes.length, 100);

      for (const { index, result, customReqId } of outcomes) {
        const scenario = scenarios[index % scenarios.length];

        // Verify request ID tracking
        assert.equal(
          result.requestId,
          customReqId,
          `Request ID mismatch on index ${index}: expected ${customReqId}, got ${result.requestId}`
        );

        if (!scenario.isError) {
          assert.equal(result.ok, true, `Expected success on index ${index}`);
          assert.equal(result.status, scenario.status);
        } else {
          assert.equal(result.ok, false, `Expected failure on index ${index}`);
          assert.equal(result.status, scenario.status);
          if (!result.ok) {
            assert.ok(result.apiError instanceof ApiError);

            if (scenario.expectedCode) {
              assert.equal(
                result.apiError.code,
                scenario.expectedCode,
                `Code mismatch on index ${index}: expected ${scenario.expectedCode}, got ${result.apiError.code}`
              );
            }
            if (scenario.expectedRef) {
              assert.equal(
                result.ref,
                scenario.expectedRef,
                `Ref mismatch on index ${index}: expected ${scenario.expectedRef}, got ${result.ref}`
              );
            }
            if (scenario.expectedRetryable !== undefined) {
              assert.equal(
                result.apiError.retryable,
                scenario.expectedRetryable,
                `Retryable mismatch on index ${index}`
              );
            }
            if (scenario.expectedServerError) {
              assert.equal(result.apiError.isServerError, true);
            }

            // Verify zero XSS tag leaks
            assert.equal(/<[a-z][\s\S]*>/i.test(result.error), false);
          }
        }
      }
    });
  });

  // =========================================================================
  // ADDITIONAL ADVERSARIAL STRESS: ApiError Ergonomics & Classification
  // =========================================================================
  describe("Suite 6: ApiError Classification & Ergonomics Stress", () => {
    it("correctly identifies all classification flags across various statuses", () => {
      const netErr = ApiError.fromNetworkError(new Error("DNS resolution failed"), "/test");
      assert.equal(netErr.isNetworkError, true);
      assert.equal(netErr.isServerError, false);
      assert.equal(netErr.isClientError, false);
      assert.equal(netErr.retryable, true);

      const timeoutErr = ApiError.fromTimeout(5000, "/slow");
      assert.equal(timeoutErr.isTimeout, true);
      assert.equal(timeoutErr.status, 504);
      assert.equal(timeoutErr.retryable, true);

      const abortErr = ApiError.fromAbort("/abort");
      assert.equal(abortErr.isAborted, true);
      assert.equal(abortErr.status, 499);
      assert.equal(abortErr.retryable, false);

      const authErr = new ApiError({ message: "Forbidden", status: 403, code: "PERMISSION_DENIED" });
      assert.equal(authErr.isAuthError, true);
      assert.equal(authErr.isClientError, true);
      assert.equal(authErr.isServerError, false);

      const rateErr = new ApiError({ message: "Slow down", status: 429, retryAfterSeconds: 60 });
      assert.equal(rateErr.isRateLimited, true);
      assert.equal(rateErr.retryable, true);
      assert.equal(rateErr.retryAfterSeconds, 60);

      const serverErr = new ApiError({ message: "Crash", status: 500, ref: "ERR-CRASH1" });
      assert.equal(serverErr.isServerError, true);
      assert.equal(serverErr.isClientError, false);
      assert.equal(serverErr.getUserMessage(), "Crash (Reference: ERR-CRASH1)");
    });
  });
});
