import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  auditOwnership,
  validateAllowlist,
} from "../scripts/check-css-ownership.mjs";

const reviewedAt = new Date("2026-08-08T12:00:00Z");

function exception(overrides = {}) {
  return {
    selector: ".interactive-surface",
    property: "--_is-focus-ring-color",
    reason:
      "Preserves a visible accessible focus fallback when no companion theme provides one.",
    owner: "interactive-surface-css",
    reviewDate: "2026-08-08",
    ...overrides,
  };
}

test("state core rejects branded paint literals outside an exact reviewed fallback", () => {
  const css = `
    .interactive-surface { --_is-focus-ring-color: rgb(11 99 246); }
    .interactive-surface { background: #ff00aa; }
  `;
  const result = auditOwnership({
    css,
    allowlist: [exception()],
    now: reviewedAt,
  });

  assert.deepEqual(result.violations, [
    {
      target: "state-core",
      selector: ".interactive-surface",
      property: "background",
      line: 3,
      rule: "interactive-branded-paint",
    },
  ]);
  assert.equal(result.matchedAllowlistCount, 1);
});

test("state core rejects page topology but permits internal state positioning", () => {
  const css = `
    .interactive-surface::before { position: absolute; inset: 0; }
    .page-shell { grid-template-columns: 1fr 2fr; }
  `;
  const result = auditOwnership({ css, allowlist: [], now: reviewedAt });

  assert.deepEqual(result.violations, [
    {
      target: "state-core",
      selector: ".page-shell",
      property: "grid-template-columns",
      line: 3,
      rule: "interactive-page-topology",
    },
  ]);
});

test("allowlist rejects invalid metadata and declarations that no longer need exceptions", () => {
  assert.throws(
    () =>
      validateAllowlist({
        entries: [exception({ owner: "ui-style-kit-css" })],
        now: reviewedAt,
      }),
    /owner must be interactive-surface-css/,
  );
  assert.throws(
    () =>
      auditOwnership({
        css: ".interactive-surface { color: var(--interactive-surface-fg); }",
        allowlist: [exception()],
        now: reviewedAt,
      }),
    /does not match a forbidden declaration/,
  );
});

test("reviewed built state core satisfies its ownership contract", () => {
  const allowlist = JSON.parse(
    fs.readFileSync(
      new URL("../ownership-allowlist.json", import.meta.url),
      "utf8",
    ),
  );
  const result = auditOwnership({
    css: fs.readFileSync(new URL("../state-core.css", import.meta.url), "utf8"),
    allowlist: allowlist["state-core"],
    now: reviewedAt,
  });

  assert.deepEqual(result.violations, []);
  assert.equal(result.matchedAllowlistCount, 2);
});
