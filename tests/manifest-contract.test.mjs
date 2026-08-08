import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));

const entrypoints = {
  stateCore: "./state-core.css",
  standalonePreset: "./standalone-preset.css",
  compatibility: "./interactive-surface.css"
};
const variants = ["primary", "secondary", "accent", "subtle", "warning", "danger"];
const publicTokens = [
  "--interactive-surface-bg",
  "--interactive-surface-fg",
  "--interactive-surface-focus-ring-color",
  "--interactive-surface-transition-property",
  "--interactive-surface-transition-duration",
  "--interactive-surface-transition-easing",
  "--interactive-surface-transition-delay"
];

test("ecosystem manifest publishes the interactive surface API and package export", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.name, packageJson.name);
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.schemaPolicy.compatibility, "additive-within-major");
  assert.equal(
    manifest.schemaPolicy.breakingChange,
    "increment-schemaVersion-before-removing-or-renaming-fields"
  );
  assert.deepEqual(manifest.entrypoints, entrypoints);

  for (const entrypoint of Object.values(entrypoints)) {
    assert.equal(
      packageJson.exports[entrypoint],
      entrypoint,
      `${entrypoint} must resolve through package exports`
    );
  }
  assert.equal(packageJson.exports["./manifest.json"], "./manifest.json");
  assert(packageJson.files.includes("manifest.json"));
});

test("ecosystem manifest describes real interactive state and token contracts", () => {
  assert.deepEqual(manifest.selectors.stable, [
    ".interactive-surface",
    ".size-sm",
    ".size-lg",
    ".icon-only"
  ]);
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
    "base"
  ]);
  assert.deepEqual(manifest.states.ariaHooks, [
    "aria-pressed=true",
    "aria-pressed=mixed",
    "aria-current!=false",
    "aria-selected=true",
    "aria-busy=true",
    "aria-disabled=true"
  ]);
  // The core tuple is required for state-only consumers; standalone tokens may extend it.
  for (const token of publicTokens) {
    assert(manifest.tokens.public.includes(token), `${token} must remain public`);
  }
  assert.deepEqual(manifest.tokens.fallbacks, [
    "--interactive-surface-motion-*",
    "--interactive-surface-ease-*",
    "--motion-*",
    "--ease-*"
  ]);
  assert.deepEqual(manifest.companions, {
    "ui-style-kit-css": ">=2.1.0 <3.0.0",
    "layout-style-css": ">=3.0.0 <4.0.0"
  });

  const css = Object.values(entrypoints)
    .map((entrypoint) => readFileSync(join(root, entrypoint), "utf8"))
    .join("\n");
  for (const selector of manifest.selectors.stable) {
    assert(css.includes(selector), `${selector} must remain in public CSS`);
  }
  for (const variant of manifest.states.variants) {
    assert(css.includes(`variant-${variant}`), `${variant} must remain in public CSS`);
    assert(css.includes(`data-surface-variant=\"${variant}\"`), `${variant} attribute hook must remain public`);
  }
  for (const token of manifest.tokens.public) {
    assert(css.includes(token), `${token} must remain in public CSS`);
  }
});
