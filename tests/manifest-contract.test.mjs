import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const tokenReference = readFileSync(
  join(root, "wiki", "Token-Reference.md"),
  "utf8",
);
const apiReference = readFileSync(
  join(root, "wiki", "API-Reference.md"),
  "utf8",
);

const entrypoints = {
  stateCore: "./state-core.css",
  standalonePreset: "./standalone-preset.css",
  compatibility: "./interactive-surface.css",
};
const variants = [
  "primary",
  "secondary",
  "accent",
  "subtle",
  "warning",
  "danger",
];
const attributeSelector = (name, value) => `[${name}='${value}']`;
const stableSelectors = [
  ".interactive-surface",
  ".size-sm",
  ".size-lg",
  ".icon-only",
  ".variant-primary",
  ".variant-secondary",
  ".variant-accent",
  ".variant-subtle",
  ".variant-warning",
  ".variant-danger",
  ".light-icon",
  ".dark-icon",
  ".accessibility-icon",
];
const dataHooks = [
  {
    name: "data-surface-variant",
    selectors: variants.map((variant) =>
      attributeSelector("data-surface-variant", variant),
    ),
  },
  {
    name: "data-surface-level",
    selectors: [
      attributeSelector("data-surface-level", "1"),
      attributeSelector("data-surface-level", "2"),
      attributeSelector("data-surface-level", "3"),
    ],
  },
  {
    name: "data-icon-role",
    selectors: [
      attributeSelector("data-icon-role", "light"),
      attributeSelector("data-icon-role", "dark"),
      attributeSelector("data-icon-role", "accessibility"),
    ],
  },
];
const documentedDataHooks = [
  'data-surface-variant="primary"',
  'data-surface-variant="secondary"',
  'data-surface-variant="accent"',
  'data-surface-variant="subtle"',
  'data-surface-variant="warning"',
  'data-surface-variant="danger"',
  'data-surface-level="1|2|3"',
  'data-icon-role="light"',
  'data-icon-role="dark"',
  'data-icon-role="accessibility"',
];
// A literal inventory prevents the public CSS, documentation, and ecosystem manifest from drifting independently.
const publicTokens = [
  "--interactive-surface-accessibility-icon-color",
  "--interactive-surface-accessibility-icon-color-dark",
  "--interactive-surface-bg",
  "--interactive-surface-border-color",
  "--interactive-surface-border-width",
  "--interactive-surface-darken-active",
  "--interactive-surface-darken-hover",
  "--interactive-surface-dark-icon-color",
  "--interactive-surface-dark-icon-color-dark",
  "--interactive-surface-disabled-opacity",
  "--interactive-surface-ease-press",
  "--interactive-surface-ease-standard",
  "--interactive-surface-fg",
  "--interactive-surface-focus-ring-color",
  "--interactive-surface-focus-ring-offset",
  "--interactive-surface-focus-ring-width",
  "--interactive-surface-level-1-active-opacity",
  "--interactive-surface-level-1-bg",
  "--interactive-surface-level-1-border-color",
  "--interactive-surface-level-1-focus-opacity",
  "--interactive-surface-level-1-hover-opacity",
  "--interactive-surface-level-1-shadow",
  "--interactive-surface-level-2-active-opacity",
  "--interactive-surface-level-2-bg",
  "--interactive-surface-level-2-border-color",
  "--interactive-surface-level-2-focus-opacity",
  "--interactive-surface-level-2-hover-opacity",
  "--interactive-surface-level-2-shadow",
  "--interactive-surface-level-3-active-opacity",
  "--interactive-surface-level-3-bg",
  "--interactive-surface-level-3-border-color",
  "--interactive-surface-level-3-focus-opacity",
  "--interactive-surface-level-3-hover-opacity",
  "--interactive-surface-level-3-shadow",
  "--interactive-surface-level-bg",
  "--interactive-surface-level-border-color",
  "--interactive-surface-level-shadow",
  "--interactive-surface-lift-active",
  "--interactive-surface-lift-base",
  "--interactive-surface-lift-hover",
  "--interactive-surface-light-icon-color",
  "--interactive-surface-light-icon-color-dark",
  "--interactive-surface-motion-default",
  "--interactive-surface-motion-press",
  "--interactive-surface-radius",
  "--interactive-surface-shadow-active",
  "--interactive-surface-shadow-base",
  "--interactive-surface-shadow-hover",
  "--interactive-surface-state-layer-active-opacity",
  "--interactive-surface-state-layer-color",
  "--interactive-surface-state-layer-focus-opacity",
  "--interactive-surface-state-layer-hover-opacity",
  "--interactive-surface-state-layer-opacity",
  "--interactive-surface-state-layer-opacity-active",
  "--interactive-surface-state-layer-opacity-focus",
  "--interactive-surface-state-layer-opacity-hover",
  "--interactive-surface-tap-highlight-color",
  "--interactive-surface-transition-property",
  "--interactive-surface-transition-duration",
  "--interactive-surface-transition-easing",
  "--interactive-surface-transition-delay",
  "--interactive-surface-variant-accent-bg",
  "--interactive-surface-variant-accent-border-color",
  "--interactive-surface-variant-accent-fg",
  "--interactive-surface-variant-danger-bg",
  "--interactive-surface-variant-danger-border-color",
  "--interactive-surface-variant-danger-fg",
  "--interactive-surface-variant-primary-bg",
  "--interactive-surface-variant-primary-border-color",
  "--interactive-surface-variant-primary-fg",
  "--interactive-surface-variant-secondary-bg",
  "--interactive-surface-variant-secondary-border-color",
  "--interactive-surface-variant-secondary-fg",
  "--interactive-surface-variant-subtle-bg",
  "--interactive-surface-variant-subtle-border-color",
  "--interactive-surface-variant-subtle-fg",
  "--interactive-surface-variant-warning-bg",
  "--interactive-surface-variant-warning-border-color",
  "--interactive-surface-variant-warning-fg",
];

test("ecosystem manifest publishes the interactive surface API and package export", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.name, packageJson.name);
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.schemaPolicy.compatibility, "additive-within-major");
  assert.equal(
    manifest.schemaPolicy.breakingChange,
    "increment-schemaVersion-before-removing-or-renaming-fields",
  );
  assert.deepEqual(manifest.entrypoints, entrypoints);

  for (const entrypoint of Object.values(entrypoints)) {
    assert.equal(
      packageJson.exports[entrypoint],
      entrypoint,
      `${entrypoint} must resolve through package exports`,
    );
  }
  assert.equal(packageJson.exports["./manifest.json"], "./manifest.json");
  assert(packageJson.files.includes("manifest.json"));
});

test("ecosystem manifest describes real interactive state and token contracts", () => {
  assert.deepEqual(manifest.selectors.stable, stableSelectors);
  assert.deepEqual(manifest.selectors.stateClasses, [
    ".is-active",
    ".is-loading",
    ".is-disabled",
  ]);
  assert.deepEqual(manifest.selectors.dataHooks, dataHooks);
  assert.deepEqual(manifest.selectors.deprecated, []);
  assert.deepEqual(manifest.selectors.plannedRemoval, []);
  assert.deepEqual(manifest.states.sizes, ["sm", "md", "lg"]);
  assert.deepEqual(manifest.states.variants, variants);
  assert.deepEqual(manifest.states.levels, ["1", "2", "3"]);
  assert.deepEqual(manifest.states.precedence, [
    "disabled",
    "busy-loading",
    "active",
    "persistent",
    "hover",
    "base",
  ]);
  assert.deepEqual(manifest.states.ariaHooks, [
    "aria-pressed=true",
    "aria-pressed=mixed",
    "aria-current!=false",
    "aria-selected=true",
    "aria-busy=true",
    "aria-disabled=true",
  ]);
  assert.deepEqual(manifest.tokens.public, publicTokens);
  assert.deepEqual(manifest.tokens.fallbacks, [
    "--interactive-surface-motion-*",
    "--interactive-surface-ease-*",
    "--motion-*",
    "--ease-*",
  ]);
  assert.deepEqual(manifest.companions, {
    "ui-style-kit-css": ">=2.1.0 <3.0.0",
    "layout-style-css": ">=3.0.0 <4.0.0",
  });

  const css = Object.values(entrypoints)
    .map((entrypoint) => readFileSync(join(root, entrypoint), "utf8"))
    .join("\n");
  for (const selector of manifest.selectors.stable) {
    assert(css.includes(selector), `${selector} must remain in public CSS`);
  }
  for (const selector of manifest.selectors.stateClasses) {
    assert(css.includes(selector), `${selector} must remain in public CSS`);
  }
  for (const hook of manifest.selectors.dataHooks) {
    for (const selector of hook.selectors) {
      const sourceSelector = selector.replaceAll("'", String.fromCharCode(34));
      assert(
        css.includes(sourceSelector),
        `${selector} must remain a public ${hook.name} hook`,
      );
    }
  }
  for (const variant of manifest.states.variants) {
    assert(
      css.includes(`variant-${variant}`),
      `${variant} must remain in public CSS`,
    );
    assert(
      css.includes(`data-surface-variant=\"${variant}\"`),
      `${variant} attribute hook must remain public`,
    );
  }
  for (const token of manifest.tokens.public) {
    assert(css.includes(token), `${token} must remain in public CSS`);
  }
});

test("manifest inventories the documented and implemented public contract bidirectionally", () => {
  const authoredCss = ["styles/state-core.css", "styles/standalone-preset.css"]
    .map((file) => readFileSync(join(root, file), "utf8"))
    .join("\n");
  const implementedTokens = [
    ...new Set(authoredCss.match(/--interactive-surface-[a-z0-9-]+/g) ?? []),
  ].sort();

  assert.deepEqual([...manifest.tokens.public].sort(), implementedTokens);
  for (const token of manifest.tokens.public) {
    assert(
      tokenReference.includes(`\`${token}\``),
      `${token} must remain documented`,
    );
  }
  for (const selector of stableSelectors) {
    assert(
      authoredCss.includes(selector),
      `${selector} must remain implemented`,
    );
    assert(
      apiReference.includes(`\`${selector}\``),
      `${selector} must remain documented`,
    );
  }
  for (const hook of dataHooks) {
    for (const selector of hook.selectors) {
      const sourceSelector = selector.replaceAll("'", String.fromCharCode(34));
      assert(
        authoredCss.includes(sourceSelector),
        `${selector} must remain implemented`,
      );
    }
  }
  for (const hook of documentedDataHooks) {
    assert(apiReference.includes(hook), `${hook} must remain documented`);
  }
});
