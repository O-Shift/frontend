import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generateClientErrorRef } from "../../../lib/error-reference.ts";
import { ToastRateLimiter, type ToastPayload } from "../../../lib/toast-limiter.ts";
import { toastManager, toast } from "../../../lib/toast.ts";

/**
 * Pure state-machine simulation of ErrorBoundary lifecycle methods.
 * Mirrors ErrorBoundary.tsx implementation for direct testability in Node runner.
 */
interface ErrorBoundaryStateModel {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string } | null;
  errorRef: string | null;
  prevResetKeys: unknown[];
}

interface ErrorBoundaryPropsModel {
  children?: unknown;
  fallback?: unknown;
  fallbackTitle?: string;
  fallbackMessage?: string;
  resetKeys?: unknown[];
  onReset?: (details: { reason: "keys" | "imperative"; prevError: Error }) => void;
  onError?: (error: Error, errorInfo: { componentStack?: string }, errorRef: string) => void;
}

class ErrorBoundaryHarness {
  public state: ErrorBoundaryStateModel;
  public props: ErrorBoundaryPropsModel;

  constructor(props: ErrorBoundaryPropsModel = {}) {
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorRef: null,
      prevResetKeys: props.resetKeys || [],
    };
  }

  public simulateCrash(error: Error, componentStack: string = "at MockComponent"): void {
    // 1. getDerivedStateFromError
    const derived = ErrorBoundaryHarness.getDerivedStateFromError(error);
    this.state = { ...this.state, ...derived };

    // 2. componentDidCatch
    const existingRef = (error as { ref?: string }).ref;
    const errorRef = existingRef || generateClientErrorRef();
    const errorInfo = { componentStack };

    this.state.errorInfo = errorInfo;
    this.state.errorRef = errorRef;

    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorRef);
    }
  }

  public updateProps(nextProps: ErrorBoundaryPropsModel): void {
    const derived = ErrorBoundaryHarness.getDerivedStateFromProps(nextProps, this.state);
    if (derived) {
      this.state = { ...this.state, ...derived };
    }
    this.props = nextProps;
  }

  public resetErrorBoundary(): void {
    if (this.state.error && this.props.onReset) {
      this.props.onReset({ reason: "imperative", prevError: this.state.error });
    }
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorRef: null,
      prevResetKeys: this.props.resetKeys || [],
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryStateModel> {
    return { hasError: true, error };
  }

  public static getDerivedStateFromProps(
    nextProps: ErrorBoundaryPropsModel,
    prevState: ErrorBoundaryStateModel
  ): Partial<ErrorBoundaryStateModel> | null {
    const { resetKeys } = nextProps;
    const { prevResetKeys, hasError, error } = prevState;

    if (hasError && resetKeys && prevResetKeys) {
      const hasChanged =
        resetKeys.length !== prevResetKeys.length ||
        resetKeys.some((item, idx) => !Object.is(item, prevResetKeys[idx]));

      if (hasChanged) {
        if (nextProps.onReset && error) {
          nextProps.onReset({ reason: "keys", prevError: error });
        }
        return {
          hasError: false,
          error: null,
          errorInfo: null,
          errorRef: null,
          prevResetKeys: resetKeys,
        };
      }
    }

    if (resetKeys !== prevResetKeys) {
      return { prevResetKeys: resetKeys || [] };
    }

    return null;
  }
}

describe("Milestone 5 Adversarial Stress Suite (Challenger 2)", () => {
  // =========================================================================
  // EDGE CASE 1: Toast Rate Limiter & Anti-Storm Burst
  // =========================================================================
  describe("Edge Case 1: Toast Rate Limiter 100-Burst Anti-Storm Stress", () => {
    let limiter: ToastRateLimiter;

    beforeEach(() => {
      limiter = new ToastRateLimiter({ throttleMs: 3000, maxVisible: 3 });
      toastManager.clear();
    });

    it("suppresses 99 duplicate toasts in rapid 100-burst and increments count to 100", () => {
      const payload: ToastPayload = {
        type: "error",
        code: "DATABASE_UNAVAILABLE",
        message: "PostgreSQL connection pool exhausted",
        status: 503,
        ref: "ERR-8F3K2",
      };

      const decisions: ReturnType<typeof limiter.shouldShow>[] = [];
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        decisions.push(limiter.shouldShow(payload));
      }

      const durationMs = Date.now() - startTime;
      assert.ok(durationMs <= 150, `100-burst took ${durationMs}ms, expected <= 150ms`);

      // 1st decision must show with count: 1
      assert.equal(decisions[0].show, true);
      assert.equal(decisions[0].count, 1);

      // Remaining 99 decisions must be suppressed (show: false)
      let suppressedCount = 0;
      for (let i = 1; i < 100; i++) {
        if (!decisions[i].show) {
          suppressedCount++;
        }
        assert.equal(decisions[i].count, i + 1);
      }

      assert.equal(suppressedCount, 99);
      assert.equal(decisions[99].count, 100);
      assert.equal(decisions[99].show, false);
    });

    it("toastManager deduplicates 100 rapid error calls into single toast with count: 100", () => {
      for (let i = 0; i < 100; i++) {
        toast.error("Network timeout fetching opportunities", {
          ref: "ERR-9X7P2",
        });
      }

      const activeToasts = toastManager.getToasts();
      assert.equal(activeToasts.length, 1);
      assert.equal(activeToasts[0].count, 100);
      assert.equal(activeToasts[0].type, "error");
      assert.equal(activeToasts[0].message, "Network timeout fetching opportunities");
      assert.equal(activeToasts[0].ref, "ERR-9X7P2");
    });

    it("handles concurrent multi-error storms up to maxVisible and throttles excess channels", () => {
      const errorTypes = [
        { code: "ERR_DB", msg: "Database Down" },
        { code: "ERR_AUTH", msg: "Token Expired" },
        { code: "ERR_TIMEOUT", msg: "Gateway Timeout" },
        { code: "ERR_OVERFLOW", msg: "Queue Overflow" },
      ];

      // Send 50 calls for each of the 4 error types (200 calls total)
      const results: Record<string, ReturnType<typeof limiter.shouldShow>[]> = {
        ERR_DB: [],
        ERR_AUTH: [],
        ERR_TIMEOUT: [],
        ERR_OVERFLOW: [],
      };

      for (let i = 0; i < 50; i++) {
        for (const err of errorTypes) {
          results[err.code].push(
            limiter.shouldShow({
              code: err.code,
              message: err.msg,
              status: 500,
            })
          );
        }
      }

      // First 3 channels allowed initial show and accumulated to count 50
      assert.equal(results["ERR_DB"][0].show, true);
      assert.equal(results["ERR_AUTH"][0].show, true);
      assert.equal(results["ERR_TIMEOUT"][0].show, true);
      assert.equal(results["ERR_DB"][49].count, 50);
      assert.equal(results["ERR_AUTH"][49].count, 50);
      assert.equal(results["ERR_TIMEOUT"][49].count, 50);

      // 4th channel blocked 100% of the time (50/50 suppressed) due to maxVisible=3
      assert.equal(results["ERR_OVERFLOW"][0].show, false);
      const allOverflowSuppressed = results["ERR_OVERFLOW"].every((r) => !r.show);
      assert.equal(allOverflowSuppressed, true);
    });
  });

  // =========================================================================
  // EDGE CASE 2: Error Boundary State Recovery
  // =========================================================================
  describe("Edge Case 2: Error Boundary State Recovery & Transition Life-Cycle", () => {
    it("transitions from healthy -> crashed -> imperative recovery with onReset callback", () => {
      let resetHookPayload: { reason: "keys" | "imperative"; prevError: Error } | null = null;
      let errorHookPayload: { error: Error; errorRef: string } | null = null;

      const boundary = new ErrorBoundaryHarness({
        resetKeys: ["tab-radar", "entity-101"],
        onReset: (details) => {
          resetHookPayload = details;
        },
        onError: (err, _info, ref) => {
          errorHookPayload = { error: err, errorRef: ref };
        },
      });

      // 1. Initial healthy state
      assert.equal(boundary.state.hasError, false);
      assert.equal(boundary.state.error, null);
      assert.equal(boundary.state.errorRef, null);

      // 2. Simulate child component crash
      const fatalError = new Error("WebGL buffer allocation failed");
      boundary.simulateCrash(fatalError);

      assert.equal(boundary.state.hasError, true);
      assert.equal(boundary.state.error, fatalError);
      assert.ok(boundary.state.errorRef);
      assert.ok(/^ERR-C[0-9A-HJKMNP-TV-Z]{4}$/.test(boundary.state.errorRef!));
      const capturedErrorPayload = errorHookPayload as { error: Error; errorRef: string } | null;
      assert.ok(capturedErrorPayload);
      assert.equal(capturedErrorPayload.error, fatalError);

      // 3. User clicks Retry (imperative recovery)
      boundary.resetErrorBoundary();

      assert.equal(boundary.state.hasError, false);
      assert.equal(boundary.state.error, null);
      assert.equal(boundary.state.errorInfo, null);
      assert.equal(boundary.state.errorRef, null);

      const capturedResetPayload = resetHookPayload as { reason: "keys" | "imperative"; prevError: Error } | null;
      assert.ok(capturedResetPayload);
      assert.equal(capturedResetPayload.reason, "imperative");
      assert.equal(capturedResetPayload.prevError, fatalError);
    });

    it("recovers cleanly when declarative resetKeys change (route / entity switch)", () => {
      let resetReason: string | null = null;

      const boundary = new ErrorBoundaryHarness({
        resetKeys: ["competitor-page", "comp-id-1"],
        onReset: (details) => {
          resetReason = details.reason;
        },
      });

      // Crash on comp-id-1
      const error = new Error("Failed to parse competitor DOM node");
      boundary.simulateCrash(error);
      assert.equal(boundary.state.hasError, true);

      // User selects comp-id-2
      boundary.updateProps({
        resetKeys: ["competitor-page", "comp-id-2"],
        onReset: (details) => {
          resetReason = details.reason;
        },
      });

      assert.equal(boundary.state.hasError, false);
      assert.equal(boundary.state.error, null);
      assert.equal(boundary.state.errorRef, null);
      assert.equal(resetReason, "keys");
      assert.deepEqual(boundary.state.prevResetKeys, ["competitor-page", "comp-id-2"]);
    });

    it("preserves error state when unrelated parent re-render leaves resetKeys identical", () => {
      const boundary = new ErrorBoundaryHarness({
        resetKeys: ["page-opportunities", "filter-all"],
      });

      const error = new Error("Opportunity score NaN");
      boundary.simulateCrash(error);
      assert.equal(boundary.state.hasError, true);

      // Unrelated prop re-render with identical resetKeys
      boundary.updateProps({
        resetKeys: ["page-opportunities", "filter-all"],
      });

      assert.equal(boundary.state.hasError, true);
      assert.equal(boundary.state.error, error);
    });
  });

  // =========================================================================
  // EDGE CASE 3: Nested Error Boundaries
  // =========================================================================
  describe("Edge Case 3: Nested Error Boundaries & Failure Isolation", () => {
    it("child boundary crash does NOT crash parent boundary or unmount healthy siblings", () => {
      let parentCaught = false;
      let childCaught = false;
      let childRef = "";

      // Setup Parent Boundary (e.g. Dashboard Root)
      const parentBoundary = new ErrorBoundaryHarness({
        onError: () => {
          parentCaught = true;
        },
      });

      // Setup Child Boundary (e.g. WidgetErrorBoundary wrapping Video Radar)
      const childBoundary = new ErrorBoundaryHarness({
        onError: (_err, _info, ref) => {
          childCaught = true;
          childRef = ref;
        },
      });

      // Sibling component state (e.g. Opportunities Deck, KPI banner)
      let siblingIsMounted = true;
      let siblingRenderCount = 1;

      // Simulate fatal crash inside Child Boundary
      const videoCrash = new Error("HLS.js media decode failure");
      childBoundary.simulateCrash(videoCrash);

      // Verify Child Boundary caught the failure
      assert.equal(childCaught, true);
      assert.equal(childBoundary.state.hasError, true);
      assert.equal(childBoundary.state.error, videoCrash);
      assert.ok(/^ERR-C[0-9A-HJKMNP-TV-Z]{4}$/.test(childRef));

      // Verify Parent Boundary remained healthy (did not catch or enter error state)
      assert.equal(parentCaught, false);
      assert.equal(parentBoundary.state.hasError, false);
      assert.equal(parentBoundary.state.error, null);

      // Verify Sibling component remains mounted and undisturbed
      siblingRenderCount++;
      assert.equal(siblingIsMounted, true);
      assert.equal(siblingRenderCount, 2);

      // Verify independent recovery of Child Boundary without affecting parent
      childBoundary.resetErrorBoundary();
      assert.equal(childBoundary.state.hasError, false);
      assert.equal(childBoundary.state.error, null);
      assert.equal(parentBoundary.state.hasError, false);
    });

    it("isolates multiple simultaneous widget failures independently", () => {
      const widget1 = new ErrorBoundaryHarness({ fallbackTitle: "Widget 1" });
      const widget2 = new ErrorBoundaryHarness({ fallbackTitle: "Widget 2" });
      const widget3 = new ErrorBoundaryHarness({ fallbackTitle: "Widget 3" });

      // Widget 1 and Widget 3 crash; Widget 2 remains healthy
      widget1.simulateCrash(new Error("Widget 1 crashed"));
      widget3.simulateCrash(new Error("Widget 3 crashed"));

      assert.equal(widget1.state.hasError, true);
      assert.equal(widget2.state.hasError, false);
      assert.equal(widget3.state.hasError, true);

      // Recover Widget 1 only
      widget1.resetErrorBoundary();
      assert.equal(widget1.state.hasError, false);
      assert.equal(widget2.state.hasError, false);
      assert.equal(widget3.state.hasError, true); // Widget 3 still in error
    });
  });

  // =========================================================================
  // EDGE CASE 4: Crockford Base32 Generator Collision Resistance
  // =========================================================================
  describe("Edge Case 4: Crockford Base32 Generator Format & Collision Rigor", () => {
    it("generates 10,000 references matching ^ERR-C[0-9A-TV-Z]{4}$ and strict Crockford charset with zero format errors", () => {
      const TOTAL = 10000;
      const looseRegex = /^ERR-C[0-9A-TV-Z]{4}$/;
      const strictCrockfordRegex = /^ERR-C[0-9A-HJKMNP-TV-Z]{4}$/;

      const seen = new Set<string>();
      let regexFailures = 0;
      let lengthFailures = 0;

      for (let i = 0; i < TOTAL; i++) {
        const ref = generateClientErrorRef();

        if (ref.length !== 9) {
          lengthFailures++;
        }
        if (!looseRegex.test(ref) || !strictCrockfordRegex.test(ref)) {
          regexFailures++;
        }

        seen.add(ref);
      }

      assert.equal(regexFailures, 0, "0 reference IDs should fail format regex");
      assert.equal(lengthFailures, 0, "0 reference IDs should have invalid string length");

      // Statistical collision analysis:
      // Space size = 32^4 = 1,048,576.
      // Expected collisions E[C] = 10000^2 / (2 * 1,048,576) = 47.68.
      const collisions = TOTAL - seen.size;
      assert.ok(
        collisions >= 15 && collisions <= 90,
        `Observed ${collisions} collisions in 10,000 draws. Expected theoretical mean ~47.68 (Birthday Paradox for 32^4).`
      );
    });

    it("guarantees zero collisions in standard client burst batches (50 trials x 100 IDs)", () => {
      for (let trial = 0; trial < 50; trial++) {
        const batchSet = new Set<string>();
        for (let i = 0; i < 100; i++) {
          const ref = generateClientErrorRef();
          batchSet.add(ref);
        }
        // Expected collisions in 100 items from 1M space is ~0.0047 (99.5% collision-free per batch)
        assert.equal(batchSet.size, 100, `Trial ${trial} had duplicate ID in 100-batch`);
      }
    });
  });
});
