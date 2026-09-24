import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const standalone = read("styles", "standalone-preset.css");
const stateCore = read("styles", "state-core.css");
const manifest = JSON.parse(read("manifest.json"));
const readme = read("README.md");
const installation = read("wiki", "Installation-and-Usage.md");
const tokenReference = read("wiki", "Token-Reference.md");
const changelog = read("CHANGELOG.md");

const semanticTokens = [
  "--ui-color-surface",
  "--ui-color-text",
  "--ui-color-muted",
  "--ui-color-primary",
  "--ui-color-on-primary",
  "--ui-color-border",
  "--ui-radius-control",
  "--ui-shadow-control",
  "--ui-focus-color",
  "--ui-motion-duration",
  "--ui-motion-easing",
];

function compact(value) {
  return value.replaceAll(/\s+/g, "");
}

test("standalone paint and geometry use semantic tokens between package and legacy fallbacks", () => {
  const source = compact(standalone);

  [
    "var(--interactive-surface-bg,var(--ui-color-surface,var(--surface-bg,var(--bg-surface,rgb(248250252)))))",
    "var(--interactive-surface-fg,var(--ui-color-text,var(--surface-fg,var(--text-primary,rgb(172439)))))",
    "var(--interactive-surface-border-color,var(--ui-color-border,var(--surface-border,var(--border-color,rgba(15,23,42,0.2)))))",
    "var(--interactive-surface-radius,var(--ui-radius-control,0.75rem))",
    "var(--ui-shadow-control,var(--shadow-base,000rgb(000/0)))",
  ].forEach((chain) =>
    assert.ok(
      source.includes(chain),
      `Missing semantic fallback chain: ${chain}`,
    ),
  );
});

test("primary and subtle variants preserve package-specific precedence", () => {
  const source = compact(standalone);

  [
    "var(--interactive-surface-variant-primary-bg,var(--ui-color-primary,var(--variant-primary-bg,rgb(1579127))))",
    "var(--interactive-surface-variant-primary-fg,var(--ui-color-on-primary,var(--variant-primary-fg,rgb(244251255))))",
    "var(--interactive-surface-variant-primary-border-color,var(--ui-color-primary,var(--variant-primary-border,var(--interactive-surface-bg))))",
    "var(--interactive-surface-variant-subtle-fg,var(--ui-color-muted,var(--variant-subtle-fg,rgb(265275))))",
  ].forEach((chain) =>
    assert.ok(
      source.includes(chain),
      `Missing variant fallback chain: ${chain}`,
    ),
  );
});

test("state mechanics consume only shared focus and default-motion semantics", () => {
  const source = compact(stateCore);

  [
    "var(--interactive-surface-motion-default,var(--ui-motion-duration,var(--motion-default,140ms)))",
    "var(--interactive-surface-ease-standard,var(--ui-motion-easing,var(--ease-standard,cubic-bezier(0.2,0,0.2,1))))",
    "var(--interactive-surface-focus-ring-color,var(--ui-focus-color,var(--focus-ring,rgb(1199246))))",
  ].forEach((chain) =>
    assert.ok(
      source.includes(chain),
      `Missing mechanics fallback chain: ${chain}`,
    ),
  );

  assert.doesNotMatch(
    stateCore,
    /--ui-(?:color-(?:surface|text|muted|primary|on-primary|border)|radius-control|shadow-control)/,
    "State core must not consume shared paint or component-geometry tokens.",
  );
});

test("manifest inventories every optional shared semantic fallback", () => {
  assert.deepEqual(
    manifest.tokens.sharedSemanticFallbacks.map(({ name }) => name),
    semanticTokens,
  );

  for (const token of manifest.tokens.sharedSemanticFallbacks) {
    assert.equal(token.precedence, "after-package-specific-before-legacy");
    assert.equal(
      token.standaloneExpectation,
      "optional-with-existing-fallbacks",
    );
  }
});

test("release-facing docs explain third-party semantic theming and precedence", () => {
  for (const name of semanticTokens) {
    assert.ok(
      tokenReference.includes(name),
      `Token reference is missing ${name}`,
    );
  }

  [readme, installation, tokenReference].forEach((document) => {
    assert.match(document, /third-party (?:theme|design system)/i);
    assert.match(
      document,
      /package-specific[\s\S]*shared semantic[\s\S]*legacy/i,
    );
  });

  assert.ok(
    readme.includes('import "interactive-surface-css/standalone-preset.css";'),
  );
  assert.match(changelog, /shared semantic fallback/i);
});
