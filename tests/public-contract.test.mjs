import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync("interactive-surface.css", "utf8");
const stateCoreSource = fs.readFileSync("styles/state-core.css", "utf8");
const standalonePresetSource = fs.readFileSync(
  "styles/standalone-preset.css",
  "utf8",
);
const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("the complete bundle retains the 1.x public contract", () => {
  [
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
    ".is-active",
    ".is-disabled",
    "::file-selector-button",
    "data-surface-variant",
    "data-surface-level",
    "data-icon-role",
    "aria-pressed",
    "aria-current",
    "aria-disabled",
  ].forEach((value) =>
    assert.ok(css.includes(value), "Missing public contract: " + value),
  );

  [
    "--interactive-surface-",
    "--lift-",
    "--shadow-",
    "--motion-",
    "--ease-",
  ].forEach((value) =>
    assert.ok(css.includes(value), "Missing token family: " + value),
  );

  assert.equal(
    manifest.exports["./interactive-surface.css"],
    "./interactive-surface.css",
  );
  assert.match(fs.readFileSync("index.js", "utf8"), /interactive-surface\.css/);
  assert.match(
    fs.readFileSync("index.cjs", "utf8"),
    /interactive-surface\.css/,
  );
});

test("the state core exposes the public transition tuple with legacy fallbacks", () => {
  [
    "--interactive-surface-transition-property",
    "--interactive-surface-transition-duration",
    "--interactive-surface-transition-easing",
    "--interactive-surface-transition-delay",
  ].forEach((token) =>
    assert.ok(
      stateCoreSource.includes(token),
      `Missing public transition token: ${token}`,
    ),
  );

  assert.match(
    stateCoreSource,
    /--interactive-surface-transition-duration[\s\S]*--interactive-surface-motion-default[\s\S]*--motion-default/,
  );
  assert.match(
    stateCoreSource,
    /--interactive-surface-transition-easing[\s\S]*--interactive-surface-ease-standard[\s\S]*--ease-standard/,
  );
  assert.match(
    stateCoreSource,
    /transition-property:\s*var\(--_is-transition-property\)/,
  );
  assert.match(
    stateCoreSource,
    /transition-duration:\s*var\(--_is-transition-duration\)/,
  );
  assert.match(
    stateCoreSource,
    /transition-timing-function:\s*var\(--_is-transition-easing\)/,
  );
  assert.match(
    stateCoreSource,
    /transition-delay:\s*var\(--_is-transition-delay\)/,
  );
});

test("the standalone preset has no UI-host hover compensation or transition override", () => {
  assert.doesNotMatch(standalonePresetSource, /_is-preset-hover-lift-offset/);
  assert.doesNotMatch(
    standalonePresetSource,
    /\[data-ui\]\[data-theme\]\[data-mode\][\s\S]*transition-(?:property|duration|timing-function|delay)/,
  );
  assert.doesNotMatch(standalonePresetSource, /!important/);
});

test("legacy complete and companion entry points remain exported", () => {
  assert.equal(
    manifest.exports["./interactive-surface.css"],
    "./interactive-surface.css",
  );
  assert.equal(manifest.exports["./state-core.css"], "./state-core.css");
  assert.equal(
    manifest.exports["./standalone-preset.css"],
    "./standalone-preset.css",
  );
  assert.equal(manifest.main, "./index.cjs");
  assert.equal(manifest.module, "./index.js");
});

test("UI Style Kit remains an optional development-only compatibility fixture", () => {
  assert.equal(manifest.dependencies?.["ui-style-kit-css"], undefined);
  assert.equal(manifest.optionalDependencies?.["ui-style-kit-css"], undefined);
  assert.equal(manifest.peerDependencies?.["ui-style-kit-css"], undefined);
});
