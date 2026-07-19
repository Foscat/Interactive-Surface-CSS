import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync("interactive-surface.css", "utf8");
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
    "data-surface-variant",
    "data-surface-level",
    "data-icon-role",
    "aria-pressed",
    "aria-current",
    "aria-disabled"
  ].forEach((value) => assert.ok(css.includes(value), "Missing public contract: " + value));

  ["--interactive-surface-", "--lift-", "--shadow-", "--motion-", "--ease-"].forEach((value) =>
    assert.ok(css.includes(value), "Missing token family: " + value)
  );

  assert.equal(manifest.exports["./interactive-surface.css"], "./interactive-surface.css");
  assert.match(fs.readFileSync("index.js", "utf8"), /interactive-surface\.css/);
  assert.match(fs.readFileSync("index.cjs", "utf8"), /interactive-surface\.css/);
});
