import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ToastRateLimiter } from "./toast-limiter.ts";

describe("Toast Rate Limiter & Anti-Storm Suite", () => {
  let limiter: ToastRateLimiter;

  beforeEach(() => {
    limiter = new ToastRateLimiter({ throttleMs: 2000, maxVisible: 3 });
  });

  it("allows first occurrence of an error toast", () => {
    const decision = limiter.shouldShow({
      code: "DATABASE_UNAVAILABLE",
      message: "Database connection failed",
      status: 503,
    });

    assert.equal(decision.show, true);
    assert.equal(decision.count, 1);
  });

  it("suppresses duplicate error toast within throttle window and increments count", () => {
    limiter.shouldShow({
      code: "DATABASE_UNAVAILABLE",
      message: "Database connection failed",
      status: 503,
    });

    // Second call within throttleMs
    const decision2 = limiter.shouldShow({
      code: "DATABASE_UNAVAILABLE",
      message: "Database connection failed",
      status: 503,
    });

    assert.equal(decision2.show, false);
    assert.equal(decision2.count, 2);

    // Third call within throttleMs
    const decision3 = limiter.shouldShow({
      code: "DATABASE_UNAVAILABLE",
      message: "Database connection failed",
      status: 503,
    });

    assert.equal(decision3.show, false);
    assert.equal(decision3.count, 3);
  });

  it("allows distinct error codes simultaneously up to maxVisible", () => {
    const d1 = limiter.shouldShow({ code: "DATABASE_UNAVAILABLE", message: "DB down", status: 503 });
    const d2 = limiter.shouldShow({ code: "RATE_LIMITED", message: "Too many reqs", status: 429 });
    const d3 = limiter.shouldShow({ code: "VALIDATION_FAILED", message: "Bad input", status: 422 });

    assert.equal(d1.show, true);
    assert.equal(d2.show, true);
    assert.equal(d3.show, true);

    // 4th distinct error exceeds maxVisible limit
    const d4 = limiter.shouldShow({ code: "AUTH_EXPIRED", message: "Relogin", status: 401 });
    assert.equal(d4.show, false);
  });

  it("resets count and allows toast again after throttle window expires", async () => {
    const fastLimiter = new ToastRateLimiter({ throttleMs: 50, maxVisible: 3 });

    const d1 = fastLimiter.shouldShow({ code: "DATABASE_UNAVAILABLE", message: "DB down", status: 503 });
    assert.equal(d1.show, true);

    // Wait for throttle window expiration
    await new Promise((resolve) => setTimeout(resolve, 80));

    const d2 = fastLimiter.shouldShow({ code: "DATABASE_UNAVAILABLE", message: "DB down", status: 503 });
    assert.equal(d2.show, true);
    assert.equal(d2.count, 1);
  });
});
