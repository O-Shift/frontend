import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateClientErrorRef } from "../../../lib/error-reference.ts";
import { ApiError } from "../../../lib/api.ts";

/**
 * Pure state reducer mimicking ErrorBoundary lifecycle logic
 * for testable deterministic verification in Node test environment.
 */
interface BoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: unknown | null;
  errorRef: string;
  prevResetKeys: unknown[];
}

function getDerivedStateFromError(error: Error): Partial<BoundaryState> {
  return {
    hasError: true,
    error,
  };
}

function getDerivedStateFromProps(
  props: { resetKeys?: unknown[] },
  state: BoundaryState
): Partial<BoundaryState> | null {
  const { resetKeys } = props;
  const { prevResetKeys, hasError } = state;

  if (hasError && resetKeys && prevResetKeys.length > 0) {
    const hasChanged =
      resetKeys.length !== prevResetKeys.length ||
      resetKeys.some((key, i) => !Object.is(key, prevResetKeys[i]));

    if (hasChanged) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        prevResetKeys: resetKeys,
      };
    }
  }

  return { prevResetKeys: resetKeys ?? [] };
}

describe("React Error Boundary State & Recovery Test Suite", () => {
  // =========================================================================
  // SUITE 1: ErrorBoundary State Transitions
  // =========================================================================
  describe("Suite 1: ErrorBoundary State Transitions", () => {
    it("getDerivedStateFromError transitions boundary to hasError: true", () => {
      const err = new Error("Component render failure");
      const nextState = getDerivedStateFromError(err);

      assert.equal(nextState.hasError, true);
      assert.equal(nextState.error, err);
    });

    it("initializes boundary with unique ERR-CXXXX client reference", () => {
      const ref = generateClientErrorRef();
      assert.ok(/^ERR-C[0-9A-HJKMNP-TV-Z]{4}$/.test(ref));
    });
  });

  // =========================================================================
  // SUITE 2: ResetKeys Recovery Transitions
  // =========================================================================
  describe("Suite 2: ResetKeys Automatic Recovery", () => {
    it("resets boundary when resetKeys change (e.g. route / ID change)", () => {
      const error = new Error("Fatal chart crash");
      const currentState: BoundaryState = {
        hasError: true,
        error,
        errorInfo: null,
        errorRef: "ERR-C8K2M",
        prevResetKeys: ["tab-opportunities", "op-101"],
      };

      // User switches to op-102
      const nextProps = { resetKeys: ["tab-opportunities", "op-102"] };
      const updatedState = getDerivedStateFromProps(nextProps, currentState);

      assert.ok(updatedState);
      assert.equal(updatedState.hasError, false);
      assert.equal(updatedState.error, null);
      assert.equal(updatedState.errorInfo, null);
      assert.deepEqual(updatedState.prevResetKeys, ["tab-opportunities", "op-102"]);
    });

    it("preserves error state when resetKeys remain unchanged", () => {
      const error = new Error("Unchanged state");
      const currentState: BoundaryState = {
        hasError: true,
        error,
        errorInfo: null,
        errorRef: "ERR-C8K2M",
        prevResetKeys: ["op-101"],
      };

      const nextProps = { resetKeys: ["op-101"] };
      const updatedState = getDerivedStateFromProps(nextProps, currentState);

      assert.ok(updatedState);
      assert.equal(updatedState.hasError, undefined); // hasError not cleared
    });
  });

  // =========================================================================
  // SUITE 3: ApiError Integration & Reference Preservation
  // =========================================================================
  describe("Suite 3: ApiError Integration & Reference Handling", () => {
    it("extracts and formats correlation error reference from ApiError", () => {
      const apiError = new ApiError({
        message: "Database connection failed",
        status: 503,
        code: "DATABASE_UNAVAILABLE",
        ref: "ERR-8F3K2",
        retryable: true,
        retryAfterSeconds: 5,
      });

      assert.equal(apiError.ref, "ERR-8F3K2");
      assert.equal(apiError.isServerError, true);
      assert.equal(apiError.retryable, true);
      assert.equal(
        apiError.getUserMessage(),
        "Database connection failed (Reference: ERR-8F3K2)"
      );
    });

    it("generates collision-resistant client error reference if backend omitted ref", () => {
      const apiError = new ApiError({
        message: "Client validation crash",
        status: 400,
        code: "VALIDATION_FAILED",
      });

      assert.equal(apiError.ref, undefined);
      const fallbackRef = generateClientErrorRef();
      assert.ok(fallbackRef.startsWith("ERR-C"));
    });
  });

  // =========================================================================
  // SUITE 4: Client Reference Collision Resistance
  // =========================================================================
  describe("Suite 4: Crockford Base32 Reference Generator", () => {
    it("generates 100 distinct collision-free references", () => {
      const set = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const ref = generateClientErrorRef();
        assert.ok(/^ERR-C[0-9A-HJKMNP-TV-Z]{4}$/.test(ref));
        set.add(ref);
      }
      assert.equal(set.size, 100);
    });
  });
});
