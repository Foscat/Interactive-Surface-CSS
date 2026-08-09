import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  auditOwnership,
  matchesStateSelector,
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
    .interactive-surface { --_is-focus-ring-color: var(--focus-ring, rgb(11 99 246)); }
    .interactive-surface { background: #ff00aa; }
    .interactive-surface { --Arbitrary-Paint: red; }
    .interactive-surface { --Modern-Paint: oklch(62% .22 24); }
    .interactive-surface { background-image: url("brand-texture.svg"); }
    .interactive-surface { border-top: 1px solid red; }
    .interactive-surface { filter: drop-shadow(0 2px 4px red); }
    .interactive-surface { --Neutral-State-Layer: rgb(0 0 0 / .12); }
    .interactive-surface { --Neutral-Fallback: var(--neutral-layer, #fff); }
    :is(a:any-link, details[open], input[checked], input[required], option[selected], textarea[readonly], [hidden], [aria-hidden="true"]) {
      background: var(--interactive-surface-bg);
      box-shadow: var(--interactive-surface-shadow-hover);
      transform: translateY(var(--interactive-surface-lift-hover));
    }
    .token-only {
      background: var(--surface-bg);
      box-shadow: var(--surface-shadow);
      border: var(--surface-border);
      color: env(surface-color);
    }
    .fallback-paint { background: var(--bg, #fff); }
    .fallback-paint { box-shadow: var(--shadow, 0 2px 4px #0008); }
    .fallback-paint { border: var(--border-color, red); }
    .fallback-paint { color: env(surface-color, red); }
    .x { border: 1px solid #777; }
    .x { background: #fff; }
    .x { box-shadow: 0 2px 4px #0008; }
  `;
  const result = auditOwnership({
    css,
    manifest: {
      presets: [{ id: "minimal-saas", prefix: "saas" }],
      classApi: {
        universalVisualSuffixes: ["disabled"],
        presetExtras: { "minimal-saas": [] },
      },
    },
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
    {
      target: "state-core",
      selector: ".interactive-surface",
      property: "--Arbitrary-Paint",
      line: 4,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".interactive-surface",
      property: "--Modern-Paint",
      line: 5,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".interactive-surface",
      property: "background-image",
      line: 6,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".interactive-surface",
      property: "border-top",
      line: 7,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".interactive-surface",
      property: "filter",
      line: 8,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".fallback-paint",
      property: "background",
      line: 22,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".fallback-paint",
      property: "box-shadow",
      line: 23,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".fallback-paint",
      property: "border",
      line: 24,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".fallback-paint",
      property: "color",
      line: 25,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".x",
      property: "border",
      line: 26,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".x",
      property: "background",
      line: 27,
      rule: "interactive-branded-paint",
    },
    {
      target: "state-core",
      selector: ".x",
      property: "box-shadow",
      line: 28,
      rule: "interactive-branded-paint",
    },
  ]);
  assert.equal(result.matchedAllowlistCount, 1);
});

test("state core permits token value supply across shared reflected ARIA states", () => {
  const ariaStates = [
    "busy",
    "checked",
    "current",
    "disabled",
    "expanded",
    "hidden",
    "invalid",
    "pressed",
    "selected",
  ];

  for (const state of ariaStates) {
    const selector = `:is(.interactive-surface,[aria-${state}="true"])`;
    assert.equal(matchesStateSelector(selector), true, selector);
    const result = auditOwnership({
      css: `${selector} { --State-Opacity: .8; background: var(--surface-bg); transform: scale(.98); }`,
      allowlist: [],
      now: reviewedAt,
    });
    assert.deepEqual(result.violations, [], selector);
  }
});

test("state core rejects page topology but permits internal state positioning", () => {
  const css = `
    .interactive-surface::before { position: absolute; inset: 0; }
    .state-grid { grid-column: 1 / 3; }
    .page-shell { max-width: 72rem; }
    #app { width: 100%; }
  `;
  const result = auditOwnership({ css, allowlist: [], now: reviewedAt });

  assert.deepEqual(result.violations, [
    {
      target: "state-core",
      selector: ".state-grid",
      property: "grid-column",
      line: 3,
      rule: "interactive-page-topology",
    },
    {
      target: "state-core",
      selector: ".page-shell",
      property: "max-width",
      line: 4,
      rule: "interactive-page-topology",
    },
    {
      target: "state-core",
      selector: "#app",
      property: "width",
      line: 5,
      rule: "interactive-page-topology",
    },
  ]);
});

test("allowlist rejects every malformed, stale, broad, duplicate, and unmatched mutation", () => {
  const missingReason = exception();
  delete missingReason.reason;
  const cases = [
    {
      name: "stale",
      entries: [exception({ reviewDate: "2025-01-01" })],
      message: /stale reviewDate/,
    },
    {
      name: "future",
      entries: [exception({ reviewDate: "2026-08-09" })],
      message: /stale reviewDate/,
    },
    {
      name: "invalid date",
      entries: [exception({ reviewDate: "2026-02-30" })],
      message: /ISO date/,
    },
    {
      name: "duplicate",
      entries: [exception(), exception()],
      message: /duplicate selector and property/,
    },
    {
      name: "selector wildcard",
      entries: [exception({ selector: ".interactive-*" })],
      message: /must not contain wildcards/,
    },
    {
      name: "property wildcard",
      entries: [exception({ property: "--_is-*" })],
      message: /must not contain wildcards/,
    },
    {
      name: "unexplained",
      entries: [exception({ reason: "Needed." })],
      message: /professional reason/,
    },
    {
      name: "wrong owner",
      entries: [exception({ owner: "ui-style-kit-css" })],
      message: /owner must be interactive-surface-css/,
    },
    {
      name: "missing field",
      entries: [missingReason],
      message: /contain exactly/,
    },
    {
      name: "extra field",
      entries: [exception({ ticket: "IS-42" })],
      message: /contain exactly/,
    },
    {
      name: "non-string field",
      entries: [exception({ reason: null })],
      message: /string fields/,
    },
  ];

  for (const fixture of cases) {
    assert.throws(
      () => validateAllowlist({ entries: fixture.entries, now: reviewedAt }),
      fixture.message,
      fixture.name,
    );
  }

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
