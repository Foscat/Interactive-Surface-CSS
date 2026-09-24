import assert from "node:assert/strict";
import test from "node:test";

import { withFixtureCleanup } from "./fixtures/fixture-cleanup.mjs";

test("preserves assertion and cleanup failures in one AggregateError", async () => {
  const assertionFailure = new Error("assertion failed");
  const cleanupFailure = new Error("cleanup failed");

  await assert.rejects(
    withFixtureCleanup(
      {
        cleanup() {
          throw cleanupFailure;
        },
      },
      async () => {
        throw assertionFailure;
      },
    ),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.deepEqual(error.errors, [assertionFailure, cleanupFailure]);
      return true;
    },
  );
});

test("reports a cleanup failure when the test body succeeds", async () => {
  const cleanupFailure = new Error("cleanup failed");

  await assert.rejects(
    withFixtureCleanup(
      {
        cleanup() {
          throw cleanupFailure;
        },
      },
      async () => "result",
    ),
    cleanupFailure,
  );
});
