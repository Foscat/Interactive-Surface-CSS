# Interactive Surface CSS 1.4.0 Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a verified local `interactive-surface-css@1.4.0` release candidate with additive state-core and standalone-preset entry points, stronger accessible state behavior, an npm-first README/wiki, and a state-first demo linked to the Interface Systems Lab.

**Architecture:** Author interaction mechanics in `styles/state-core.css` and standalone paint/geometry in `styles/standalone-preset.css`. Generate three public root bundles from those modules, retain the existing complete bundle and JavaScript entries unchanged, and protect the contract with Node package/build tests plus rendered Playwright coverage. Keep the local demo standalone and use the external Interface Systems Lab as the canonical all-three integration proof.

**Tech Stack:** Standards-based CSS, Node.js 18+ ESM and `node:test`, npm package exports, CleanCSS, Stylelint, Playwright, static HTML, and browser-native JavaScript.

## Global Constraints

- Preserve every existing 1.x import path, selector, data hook, ARIA hook, token fallback, and JavaScript entry point.
- Add exactly `interactive-surface-css/state-core.css` and `interactive-surface-css/standalone-preset.css` as new public imports.
- Keep `interactive-surface-css`, `interactive-surface-css/interactive-surface.css`, `style`, `unpkg`, and `jsdelivr` on the complete compatibility bundle.
- `layout-style-css` owns structure and geometry; `ui-style-kit-css` owns paint/themes; `interactive-surface-css` owns interaction-state affordances.
- Keep comments concise, professional, and limited to non-obvious intent.
- Pass Stylelint and `git diff --check` without weakening lint rules.
- Use functional CSS colors; introduce no hexadecimal color literals.
- Set release version `1.4.0` and changelog date `2026-07-19`.
- Do not publish, tag, push, create a release, or trigger publishing.
- Do not modify, stage, package, or reference untracked `assets/` or `interactive-surface-css-1.3.0.tgz`.

---

### Task 1: Freeze The 1.x Contract And Generate Modular Bundles

**Files:**

- Create: `styles/state-core.css`
- Create: `styles/standalone-preset.css`
- Create: `state-core.css`
- Create: `standalone-preset.css`
- Create: `tests/public-contract.test.mjs`
- Create: `tests/build.test.mjs`
- Modify: `scripts/build.mjs`
- Modify: `scripts/check-no-hex-colors.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Regenerate: `interactive-surface.css`

**Interfaces:**

- Consumes: current `interactive-surface.css`, `index.js`, and `index.cjs`.
- Produces: authored core/preset modules; three public bundles; `node scripts/build.mjs` and non-writing `node scripts/build.mjs check`.

- [ ] **Step 1: Add a passing characterization contract before refactoring**

Create `tests/public-contract.test.mjs`. Read the compatibility CSS and package entries. Explicitly assert these public families remain: base, sizes, icon-only, six variants, active/disabled, surface variants/levels, icon roles, pressed/current/disabled ARIA, `--interactive-surface-*`, and legacy lift/shadow/motion/easing fallbacks.

```js
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
```

- [ ] **Step 2: Run the characterization test**

Run: `node --test tests/public-contract.test.mjs`

Expected: PASS against the current 1.3.0-compatible bundle.

- [ ] **Step 3: Add failing build-contract tests**

Create `tests/build.test.mjs`. Import `createBundleMap`, `buildBundles`, and `verifyBundles` from `scripts/build.mjs`. Assert the public keys are `state-core.css`, `standalone-preset.css`, and `interactive-surface.css`; matching normal/minified dist outputs exist; standalone and compatibility payloads are identical after headers; generated headers name source modules; and parity reports a named stale file. Exercise stale-file behavior in a temporary fixture directory passed to the helpers so tests never mutate committed root bundles or race other contract files.

- [ ] **Step 4: Verify the build tests fail**

Run: `node --test tests/build.test.mjs`

Expected: FAIL because the new helpers and source modules do not exist.

- [ ] **Step 5: Split authored CSS by ownership**

Move neutral paint, border/radius/font reset, surface levels, size defaults, icon geometry/colors, and six variants to `styles/standalone-preset.css`. Move state tokens, mechanical containment, state layer, focus, hover, active, persistent, disabled, motion, contrast, and forced-colors rules to `styles/state-core.css`.

The core may set `position` and `isolation` for its state layer, but must not assign consumer-facing background, foreground, border, radius, font, padding, display, width, or height.

- [ ] **Step 6: Implement deterministic bundle generation**

Export testable helpers from `scripts/build.mjs`. Compose complete bundles in preset-then-core order so disabled/accessibility rules keep final precedence.

```js
const sourcePaths = {
  core: "styles/state-core.css",
  preset: "styles/standalone-preset.css"
};

export async function createBundleMap() {
  const core = normalize(await readFile(sourcePaths.core, "utf8"));
  const preset = normalize(await readFile(sourcePaths.preset, "utf8"));
  const complete = preset.trim() + "\n\n" + core.trim() + "\n";

  return createNormalAndMinifiedMaps({
    "state-core.css": withGeneratedHeader("state-core.css", [sourcePaths.core], core),
    "standalone-preset.css": withGeneratedHeader(
      "standalone-preset.css",
      [sourcePaths.preset, sourcePaths.core],
      complete
    ),
    "interactive-surface.css": withGeneratedHeader(
      "interactive-surface.css",
      [sourcePaths.preset, sourcePaths.core],
      complete
    )
  });
}
```

Default mode writes root and dist files. `check` compares in-memory output without writing and names stale targets. Missing sources and minification errors must name the responsible file.

- [ ] **Step 7: Expand lint/color checks and package scripts**

Scan both authored modules and all three generated roots in `scripts/check-no-hex-colors.mjs`, reporting `file:line`. Set Stylelint to `stylelint "styles/**/*.css" "*.css" "demo/**/*.css"`. Add `check:generated`. Define `test:contracts` explicitly as the public, build, and documentation Node tests so the later tarball test remains an independently visible gate rather than running twice.

- [ ] **Step 8: Add version and entry-point metadata**

Set `package.json` and root lockfile metadata to `1.4.0`. Add `./state-core.css` and `./standalone-preset.css` exports/files. Preserve every legacy export and keep root JS/style/CDN metadata on `interactive-surface.css`.

- [ ] **Step 9: Generate and verify Task 1**

Run:

```powershell
node scripts/build.mjs
node --test tests/public-contract.test.mjs tests/build.test.mjs
node scripts/build.mjs check
npm.cmd run check:no-hex-colors
npm.cmd run lint:css
```

Expected: all pass and the compatibility bundle retains the full characterization contract.

- [ ] **Step 10: Commit**

```powershell
git add -- styles state-core.css standalone-preset.css interactive-surface.css scripts package.json package-lock.json tests/public-contract.test.mjs tests/build.test.mjs
git commit -m "feat: add layered interaction stylesheet entry points"
```

---

### Task 2: Harden State Semantics, Accessibility, And Motion Composition

**Files:**

- Create: `tests/entry-points.spec.ts`
- Create: `tests/state-core.spec.ts`
- Modify: `styles/state-core.css`
- Modify: `styles/standalone-preset.css`
- Modify: `tests/interactive-surface.spec.ts`
- Modify: `tests/ui-style-kit-compat.spec.ts`
- Regenerate: all three root bundles

**Interfaces:**

- Consumes: Task 1 generator and existing public selectors.
- Produces: mixed pressed, non-false current, selected, busy/loading, disabled precedence, preference-safe state meaning, and package-owned `translate` motion.

- [ ] **Step 1: Add failing ownership tests**

In `tests/entry-points.spec.ts`, inline each bundle separately. Prove `state-core.css` preserves consumer background, border, radius, padding, font, and display. Prove preset and compatibility bundles render equal default/variant/level/icon styles, including 44px icon targets.

- [ ] **Step 2: Add failing semantic and precedence tests**

In `tests/state-core.spec.ts`, fixture IDs must cover true/mixed pressed, page/step current, selected, active, busy, class loading, native disabled, ARIA disabled, class disabled, and a focusable custom-disabled control.

Assert persistent states produce non-zero state-layer feedback; every disabled form overrides persistent/loading/hover feedback; keyboard focus remains visible; and transient press differs from persistent state.

- [ ] **Step 3: Add failing user-preference tests**

Under reduced motion, assert transitions/animation/movement stop while selected/current/pressed state remains visually distinct. Under forced colors, assert system-color focus and persistent borders/outlines replace hidden overlays. Under greater contrast, assert focus and persistent distinctions strengthen.

- [ ] **Step 4: Add failing transform-composition tests**

Style `#composed` with `transform: skewX(10deg)`, `scale: 1.1`, and `rotate: 3deg`. Assert those values survive hover, focus, press, persistent, and disabled states. Assert only `translate` changes, core lift is neutral, and preset/compatibility lift remains familiar.

- [ ] **Step 5: Run focused tests and confirm RED**

Run: `npm.cmd run test:chromium -- tests/entry-points.spec.ts tests/state-core.spec.ts`

Expected: failures for missing semantic states, disabled leakage, erased preference feedback, and host transform resets.

- [ ] **Step 6: Implement enabled persistent/loading selectors**

Use one consistent disabled exclusion for `.is-active`, true/mixed pressed, non-false current, selected, busy, and loading.

```css
.interactive-surface:is(
    .is-active,
    [aria-pressed="true"],
    [aria-pressed="mixed"],
    [aria-current]:not([aria-current="false"]),
    [aria-selected="true"],
    [aria-busy="true"],
    .is-loading
  ):not(:is(.is-disabled, :disabled, [aria-disabled="true"])) {
  translate: 0 var(--_is-lift-active);
  box-shadow: var(--_is-shadow-active);
}
```

Apply the same enabled selector to state-layer opacity. Loading can animate opacity, but must retain a static visible state.

- [ ] **Step 7: Make disabled precedence final**

Place disabled selectors after enabled states. Reset only package-owned translate, shadow, state-layer opacity, animation, and transition. Preserve an explicit focus outline for focusable `aria-disabled` widgets and document that CSS does not suppress programmatic/keyboard activation.

- [ ] **Step 8: Replace destructive transforms**

Remove package-authored `transform`, `scale`, and `rotate` resets. Transition and update the individual `translate` property. Core fallbacks are neutral; preset fallbacks retain legacy lift/shadow tokens and familiar motion.

- [ ] **Step 9: Preserve preference state meaning**

Reduced motion disables transition/animation and sets neutral translate without zeroing persistent state opacity or focus. Forced colors uses `Highlight`, `ButtonText`, and `GrayText`. Greater contrast strengthens focus width and persistent outlines without theme paint.

- [ ] **Step 10: Update existing compatibility assertions**

Change movement assertions from shorthand transform to individual translate. Retain the real `ui-style-kit-css@2.0.1` matrix and add a focused check that the core does not override UI Kit paint in supported import orders.

- [ ] **Step 11: Regenerate, verify, and commit**

Run:

```powershell
node scripts/build.mjs
npm.cmd run test:chromium -- tests/entry-points.spec.ts tests/state-core.spec.ts tests/interactive-surface.spec.ts tests/ui-style-kit-compat.spec.ts
npm.cmd run test:contracts
npm.cmd run check:generated
npm.cmd run lint:css
```

Then commit:

```powershell
git add -- styles state-core.css standalone-preset.css interactive-surface.css tests
git commit -m "feat: harden accessible interaction state behavior"
```

---

### Task 3: Refine The Demo Into A State-First Interaction Lab

**Files:**

- Create: `demo/demo.css`
- Create: `demo/demo.js`
- Modify: `index.html`
- Modify: `tests/example.spec.ts`
- Modify: `package.json`

**Interfaces:**

- Consumes: Task 2 states and `standalone-preset.css`.
- Produces: ordered sections `ecosystem-ownership`, `state-lab`, `accessibility-guidance`, `entry-points`, `advanced-tools`, and `readme-reference` plus reliable dialog/state workflows.

- [ ] **Step 1: Make the test fixture inline linked demo assets**

Read and replace `standalone-preset.css`, `demo/demo.css`, and `demo/demo.js` tags before `page.setContent` so tests remain deterministic without a server.

- [ ] **Step 2: Add failing hierarchy and workflow tests**

Assert a prominent exact link to `https://foscat.github.io/interface-systems-lab/`, the required section order, and action/toggle/current/selected/loading/disabled/variant/level/icon examples. Click semantic examples and assert real `aria-pressed`, `aria-selected`, and `aria-busy` updates.

- [ ] **Step 3: Add failing dialog and responsive tests**

Assert open focuses the token value field and makes main inert; Tab/Shift+Tab remain in the dialog; Escape/Cancel close, clear inertness, and restore the exact opener. Stub file, clipboard, Blob URL, and download failures and assert actionable live-region messages.

Check widths 1440, 1024, 720, 390, and 320 for no horizontal overflow and in-viewport primary controls. Use 720 CSS pixels as the deterministic 200% reflow equivalent of 1440.

- [ ] **Step 4: Run the demo tests and confirm RED**

Run: `npm.cmd run test:chromium -- tests/example.spec.ts`

Expected: failures for the new link/hierarchy, state workflows, focus reliability, asset split, and responsive contract.

- [ ] **Step 5: Extract presentation and behavior**

Move inline presentation CSS to `demo/demo.css` and executable JavaScript to `demo/demo.js`, retaining professional section comments. Keep JSON-LD and embedded README fallback in HTML. Load `standalone-preset.css`, `demo/demo.css`, and deferred `demo/demo.js`.

Remove dangling favicon references to tracked `ISC logo.png` instead of adding the 1.2 MB image to the npm package. Do not use untracked assets.

- [ ] **Step 6: Reorder and refine the demo**

Create a concise hero, primary docs links, and the Interface Systems Lab CTA. Add the three ownership descriptions: “structure and geometry,” “visual paint and themes,” and “interaction states.” Put live state proof before accessibility/entry points, and move token editing/README rendering to advanced/reference sections.

- [ ] **Step 7: Implement semantic examples and reliable dialog behavior**

Use native controls. Toggle pressed/selected/busy attributes; do not fake pseudo-classes. Prefer native `dialog`, store opener, call `showModal()`, set main inert, trap focus deterministically, handle cancel, and restore opener. Guard file/clipboard/export operations with focused error messages in a shared polite live region.

- [ ] **Step 8: Package demo assets**

Add `demo/demo.css` and `demo/demo.js` to `package.json.files`. Keep `index.html` exported and CSS side effects covered.

- [ ] **Step 9: Verify and commit**

Run:

```powershell
npm.cmd run test:chromium -- tests/example.spec.ts
npm.cmd test -- tests/example.spec.ts
npm.cmd run lint:css
git diff --check
```

Then commit:

```powershell
git add -- index.html demo tests/example.spec.ts package.json
git commit -m "feat: turn the demo into an interaction state lab"
```

---

### Task 4: Replace The README And Align The Public Wiki

**Files:**

- Create: `tests/documentation.test.mjs`
- Modify: `README.md`
- Modify: `wiki/*.md`
- Modify: `package.json`
- Modify: embedded README fallback in `index.html`

**Interfaces:**

- Consumes: Tasks 2-3 public API, demo, and commands.
- Produces: npm-safe README/wiki whose links, examples, version, states, tokens, ownership, and validation guidance match the package.

- [ ] **Step 1: Add failing documentation contracts**

Assert the README includes absolute GitHub Wiki URLs, the Interface Systems Lab, all three entry points, and pinned `@1.4.0` CDN examples. Assert it has no relative wiki links, nonexistent `example.html`, demo-only `surface-card`, or obsolete sole-transform warning.

Assert API/token/accessibility wiki pages cover mixed pressed, non-false current, selected, busy/loading, all disabled forms, surface variants/levels, icon roles, and core-versus-preset defaults. Assert testing docs distinguish static/package/audit, Chromium, and full-browser gates.

- [ ] **Step 2: Run documentation tests and confirm RED**

Run: `node --test tests/documentation.test.mjs`

Expected: failures for stale links, missing entry points/states, incorrect validation descriptions, and old CDN examples.

- [ ] **Step 3: Rewrite README.md for npm users**

Order content as: value/links; ownership table; 60-second direct standalone-preset install; semantic recipes; entry-point table; compact class/data/ARIA API; small token example; accessibility responsibilities; one UI Kit bridge recipe; all-three order; browser/changelog/contributing/security/license links.

Use absolute GitHub wiki/blob links for files not shipped in the tarball. Move detailed Webpack/test/publish operations to the wiki. State that native disabled is preferred and consumers suppress activation for ARIA/class-disabled controls.

- [ ] **Step 4: Align the wiki**

Remove `example.html` and `surface-card` claims. Document every 1.4.0 state/token/entry point, pin CDN snippets to `1.4.0`, label `@latest` as opt-in, link Interface Systems Lab, preserve “use one / use two / use all three,” and use the established ecosystem import order:

```js
import "ui-style-kit-css/with-bridge.css";
import "interactive-surface-css/state-core.css";
import "layout-style-css/bridge.css";
import "layout-style-css";
```

Update Home, Getting Started, Installation, API, Tokens, Accessibility, Testing, Publishing, Roadmap, FAQ, Contributing, Sidebar, and Footer. Describe 1.4.0 as a release candidate until published.

- [ ] **Step 5: Correct quality guidance**

Document `validate`/`validate:ci` as static, package, and audit; `validate:browsers` as that plus Chromium; and `validate:full` as that plus Chromium, Firefox, and WebKit. Validate URL shape locally; add no flaky live network checks.

- [ ] **Step 6: Refresh the embedded README fallback**

Ensure the embedded markdown fallback in `index.html` matches the final README and add a static contract to prevent drift.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
node --test tests/documentation.test.mjs
npm.cmd run test:contracts
npm.cmd run test:chromium -- tests/example.spec.ts
git diff --check
```

Then commit:

```powershell
git add -- README.md wiki tests/documentation.test.mjs package.json index.html
git commit -m "docs: publish the 1.4.0 interaction guide"
```

---

### Task 5: Complete Release Metadata, Tarball Proof, And Workflow Guards

**Files:**

- Create: `tests/package-contract.test.mjs`
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/npm-publish.yml`
- Verify: `.github/workflows/ci.yaml`
- Verify: `.github/workflows/browser-tests.yml`

**Interfaces:**

- Consumes: final bundles, demo, docs, exports, and version.
- Produces: actual packed-tarball proof, final validation tiers, and tag/version/changelog drift protection.

- [ ] **Step 1: Add a failing actual-tarball contract**

Use `mkdtemp` and `spawnSync` to run `npm pack --json --ignore-scripts --pack-destination <temp> --cache ./.npm-cache`. Assert manifest `interactive-surface-css@1.4.0`; approved root JS/CSS/docs/demo files are present; every relative index `href`/`src` is packaged; specs/tests/caches/logo/untracked assets/tarball are absent; and a temporary consumer can resolve legacy and new exports without executing CSS-importing JavaScript.

- [ ] **Step 2: Run the package test and confirm RED**

Run: `node --test tests/package-contract.test.mjs`

Expected: failure until the final allowlist, demo assets, and scripts align.

- [ ] **Step 3: Add the 1.4.0 changelog**

Under Unreleased add `## 1.4.0 - 2026-07-19` with Added, Changed, Fixed, Accessibility, Documentation, and Testing coverage. Leave historical releases unchanged.

- [ ] **Step 4: Finalize scripts**

Add `test:package` and `audit`. Define:

- `validate:publish`: colors, Stylelint, build, parity, Node contracts, package contract, dry pack.
- `validate:ci` and `validate`: publish gate plus audit.
- `validate:browsers`: CI gate plus Chromium install/test.
- `validate:full`: CI gate plus Chromium/Firefox/WebKit install/test.
- `prepublishOnly`: browser-free publish gate.

Remove the misleading `directories.doc` field because it points at unpublished internal design documents rather than public package documentation.

- [ ] **Step 5: Harden publishing**

Remove unrestricted `workflow_dispatch` from npm publishing. On published releases, require release tag `v<package version>` and a matching changelog heading before validation. Retain provenance/public/ignore-scripts publishing. Do not trigger it.

- [ ] **Step 6: Verify package/release gates**

Run:

```powershell
npm.cmd install --package-lock-only --ignore-scripts --cache ./.npm-cache
npm.cmd run test:package
npm.cmd run validate:publish
npm.cmd audit
npm.cmd run pack:dry
```

Expected: package is 1.4.0, approved files only, and zero known vulnerabilities.

- [ ] **Step 7: Commit**

```powershell
git add -- CHANGELOG.md package.json package-lock.json .github/workflows/npm-publish.yml tests/package-contract.test.mjs
git commit -m "chore: prepare the 1.4.0 release candidate"
```

---

### Task 6: Full Functional, Rendered, And Completion Verification

**Files:**

- Verify all changed files; fix the smallest responsible source if a gate exposes a defect.

**Interfaces:**

- Consumes: Tasks 1-5.
- Produces: requirement-by-requirement evidence and a local-release-candidate handoff.

- [ ] **Step 1: Install from lockfile with repository-local temp/cache**

```powershell
$env:TEMP = Join-Path (Get-Location) ".tmp"
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
npm.cmd ci --cache ./.npm-cache
```

Expected: exact install without metadata drift.

- [ ] **Step 2: Run static/package/audit gates**

```powershell
npm.cmd run validate
npm.cmd run test:package
npm.cmd run pack:dry
npm.cmd audit
```

Expected: zero exits, 1.4.0 tarball, approved files only, zero vulnerabilities.

- [ ] **Step 3: Run Chromium and full-browser gates**

```powershell
npm.cmd run validate:browsers
npm.cmd run validate:full
```

Expected: Chromium, Firefox, and WebKit pass package, entry-point, state, compatibility, demo, focus, and responsive contracts.

- [ ] **Step 4: Perform rendered Playwright inspection**

Use the Playwright skill wrapper and a short-lived local server. Inspect 1440, 1024, 390, and 320 widths; both themes; keyboard navigation; hover/focus/pressed/current/selected/loading/disabled; reduced motion; dialog focus; sticky anchors; and the Interface Systems Lab link. Store screenshots only in `output/playwright/`.

Write a fidelity ledger covering hero/links, ownership hierarchy, state-lab prominence, typography/panel rhythm, state distinction, responsive overflow, dialog focus, and advanced-tool placement. Repair all fixable issues.

- [ ] **Step 5: Audit every specification acceptance criterion**

Use source, tests, packed tarball, and rendered evidence for all thirteen acceptance criteria in the approved spec. Missing or indirect evidence remains incomplete.

- [ ] **Step 6: Run repository hygiene checks**

```powershell
git diff --check
git status --short --branch
git log --oneline --decorate -8
```

Expected: intended commits on branch 1.4.0 and only the pre-existing untracked assets directory/tarball outside version control.

- [ ] **Step 7: Request two-stage review**

Dispatch a specification-compliance reviewer, then a code-quality reviewer. Fix validated findings and rerun affected tests, `npm.cmd run validate`, `npm.cmd run validate:browsers`, and `git diff --check`.

- [ ] **Step 8: Complete only after proof**

Do not publish, tag, push, or create a release. Report branch, commits, public artifacts, verification results, viewports, untouched untracked files, and the explicit publish boundary.
