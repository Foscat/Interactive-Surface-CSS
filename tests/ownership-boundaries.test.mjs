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

test("state core rejects literal paint across every color property family", () => {
  const literals = [
    ["accent-color", "#ff0066"],
    ["caret-color", "red"],
    ["column-rule-color", "blue"],
    ["color", "red"],
    ["color-scheme", "dark"],
    ["fill", "red"],
    ["stroke", "blue"],
    ["flood-color", "red"],
    ["lighting-color", "blue"],
    ["stop-color", "red"],
    ["scrollbar-color", "red blue"],
  ];

  for (const [property, value] of literals) {
    const result = auditOwnership({
      css: `.literal-paint { ${property}: ${value}; }`,
      allowlist: [],
      now: reviewedAt,
    });
    assert.equal(result.violations.length, 1, property);
    assert.equal(
      result.violations[0].rule,
      "interactive-branded-paint",
      property,
    );
  }

  const tokenResult = auditOwnership({
    css: ".token-paint { accent-color: var(--accent); color-scheme: var(--scheme); fill: var(--fill); scrollbar-color: var(--thumb) var(--track); }",
    allowlist: [],
    now: reviewedAt,
  });
  assert.deepEqual(tokenResult.violations, []);
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

test("shared state probe recognizes exact and boundary-delimited common class vocabulary", () => {
  const stateVocabulary = [
    "active",
    "any-link",
    "busy",
    "busy-loading",
    "checked",
    "current",
    "disabled",
    "enabled",
    "expanded",
    "focus",
    "focus-visible",
    "focus-within",
    "hidden",
    "hover",
    "indeterminate",
    "invalid",
    "loading",
    "open",
    "optional",
    "persistent",
    "placeholder-shown",
    "popover-open",
    "pressed",
    "read-only",
    "read-write",
    "readonly",
    "required",
    "selected",
    "target",
    "user-invalid",
    "valid",
    "visited",
  ];
  const selectors = stateVocabulary.flatMap((state) => [
    `.${state}`,
    `.navigation-${state}`,
    `.navigation_${state}`,
  ]);

  assert.deepEqual(
    selectors.map((selector) => [selector, matchesStateSelector(selector)]),
    selectors.map((selector) => [selector, true]),
  );
});

test("shared state probe recognizes manifest classes at exact and boundary-delimited forms", () => {
  const manifest = { selectors: { stateClasses: [".custom-state"] } };
  const selectors = [
    ".custom-state",
    ".navigation-custom-state",
    ".navigation_custom-state",
  ];

  assert.deepEqual(
    selectors.map((selector) => [
      selector,
      matchesStateSelector(selector, manifest),
    ]),
    selectors.map((selector) => [selector, true]),
  );
});

test("shared state probe preserves boundary controls and state-core mechanics ownership", () => {
  for (const selector of [
    ".card-static",
    ".proactive",
    ".undisabled",
    ".selectedness",
  ]) {
    assert.equal(matchesStateSelector(selector), false, selector);
  }

  const result = auditOwnership({
    css: ".active { transform: scale(.98); } .navigation_active { animation: pulse 1s; } .custom-state { transition: opacity 100ms; }",
    manifest: { selectors: { stateClasses: [".custom-state"] } },
    allowlist: [],
    now: reviewedAt,
  });
  assert.deepEqual(result.violations, []);
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

test("state core rejects structural flex topology while preserving component subjects", () => {
  const cases = [
    ["html", "flex", "1"],
    ["body", "flex-flow", "row wrap"],
    ["#app", "flex-direction", "column"],
    ["#root", "flex-wrap", "wrap"],
    [".page-shell", "gap", "2rem"],
    [".page", "row-gap", "1rem"],
    ["main", "column-gap", "3rem"],
    ["[data-layout]", "align-content", "start"],
    ["[data-page]", "align-items", "center"],
    ["[data-shell]", "align-self", "stretch"],
    ["[role=main]", "justify-content", "space-between"],
    [".main", "justify-items", "center"],
    ["section", "justify-self", "stretch"],
  ];

  for (const [selector, property, value] of cases) {
    const result = auditOwnership({
      css: `${selector} { ${property}: ${value}; }`,
      allowlist: [],
      now: reviewedAt,
    });
    assert.equal(result.violations.length, 1, `${selector} ${property}`);
    assert.equal(result.violations[0].rule, "interactive-page-topology");
  }

  const componentResult = auditOwnership({
    css: ".page .interactive-surface { flex-flow: column wrap; gap: 1rem; } .page-shell-component { flex-direction: column; align-items: center; }",
    manifest: {
      selectors: { stable: [".interactive-surface", ".page-shell-component"] },
    },
    allowlist: [],
    now: reviewedAt,
  });
  assert.deepEqual(componentResult.violations, []);
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
