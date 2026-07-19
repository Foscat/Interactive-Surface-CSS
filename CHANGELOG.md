<!-- markdownlint-configure-file {"MD024": {"siblings_only": true}} -->

# Changelog

All notable changes to this package are documented in this file.

## Unreleased

## 1.4.0 - 2026-07-19

### Added

- Added the state-only `state-core.css` entry point for consumers whose design system already owns paint and geometry.
- Added the complete `standalone-preset.css` entry point while preserving every established 1.x root, CSS, CommonJS, and ESM import.
- Added a state-first interaction lab with live action, toggle, navigation, selection, loading, disabled, variant, level, and icon-control examples.

### Changed

- Raised the npm engine contract and release validation matrix to Node.js 20+ with explicit Node.js 20 and Node.js 22 CI lanes.
- Split authored CSS into focused state-core and standalone-preset modules, then generate all public and distribution bundles from those sources.
- Made interaction lift composable with consumer and companion-library transforms by using token-driven individual translation.
- Reorganized the npm README, demo, and wiki around entry-point choice, semantic state recipes, and clear ecosystem ownership.

### Fixed

- Fixed native file input selector-button styling by mapping `input[type="file"].interactive-surface::file-selector-button` into the same token, hover, focus, active, and disabled state contract as the host surface.
- Fixed disabled-state precedence so native, ARIA, and class-based disabled surfaces cannot retain active, persistent, or loading feedback.
- Fixed UI Style Kit motion composition across supported bridge modifiers and stylesheet import orders.
- Fixed token-dialog focus containment, focus restoration, and stale status feedback between editing sessions.

### Accessibility

- Added semantic coverage for mixed pressed, non-false current, selected, busy, and loading states.
- Preserved static state meaning with reduced motion and strengthened focus and persistent-state affordances in forced-colors and greater-contrast modes.
- Kept hover feedback gated to hover-capable pointers while retaining press, focus, and persistent feedback for coarse-pointer users.

### Documentation

- Rebuilt the README as an npm-first guide with durable wiki links, pinned 1.4.0 examples, accessibility responsibilities, and migration-free compatibility guidance.
- Updated the wiki API, tokens, installation, testing, publishing, roadmap, FAQ, and contribution guidance to match the 1.4.0 package contract.
- Linked the Interface Systems Lab as the canonical integrated proof with `ui-style-kit-css` and `layout-style-css`.

### Testing

- Added generated-bundle, documentation, public-selector, state-core, and entry-point contract coverage.
- Expanded rendered browser coverage for semantic states, motion preferences, forced colors, pointer capabilities, companion-library integration, and the responsive demo.
- Added actual packed-tarball inspection and temporary-consumer resolution checks for every legacy and new public export.

## 1.3.0 - 2026-07-08

### Added

- Added first-class `data-surface-variant` support for `primary`, `secondary`, `accent`, `subtle`, `warning`, and `danger` so runtime-assigned surface hooks match the existing `.variant-*` class API.
- Added standalone `data-surface-level="1"`, `"2"`, and `"3"` depth defaults with matching hover, active, and focus state-opacity hooks.
- Added Playwright coverage for data-variant parity and data-level depth defaults.

### Changed

- Updated README, wiki, and demo guidance to document standalone interaction hooks, UI Style Kit 2.x bridge usage, and the ecosystem boundary between layout, visual paint, and interaction states.
- Updated embedded demo docs to avoid stale version-pinned CDN examples.

## 1.2.4 - 2026-06-22

### Added

- Added Playwright compatibility coverage for `ui-style-kit-css@2.0.1`, including the opt-in `with-bridge` bundle, standalone bridge imports, surface-level tokens, state-layer aliases, and `aria-current="page"` selected state behavior.

### Changed

- Updated the UI Style Kit dev fixture to `ui-style-kit-css@2.0.1`.
- Refined bridge token resolution so Interactive Surface can consume UI Style Kit 2.0.1 state-layer and surface-level aliases without changing the existing class API.
- Updated README and wiki guidance to clarify that UI Style Kit 2.0.1 keeps the bridge opt-in through `ui-style-kit-css/with-bridge.css` or `ui-style-kit-css/interactive-surface-bridge`.

## 1.2.3 - 2026-06-03

### Fixed

- Replaced the broken shell-based build pipeline with a cross-platform Node build script that copies `interactive-surface.css` into `dist/` and minifies it reliably in deployment environments.
- Added `dist/` to source control ignore rules so generated build artifacts do not dirty the working tree.

### Changed

- Bumped the package release metadata to `1.2.3`.

## 1.2.2 - 2026-06-03

### Changed

- Separated full Playwright validation from the `prepublishOnly` publish guard so manual npm publishes do not block on fresh or unavailable browser caches.
- Added explicit Playwright browser installation and release validation scripts for local and CI release checks.
- Updated release, testing, contributing, and pull request docs to include the new Playwright browser installation step.

## 1.2.1 - 2026-06-02

### Added

- Added Playwright compatibility coverage for `ui-style-kit-css@1.2.1` bridge behavior across representative UI systems and modes.

### Changed

- Hardened cascade behavior and documentation for complementary use with `ui-style-kit-css@1.2.1` in both combined-build and per-style bridge import orders.

## 1.2.0 - 2026-06-01

### Added

- Added integration docs for using this package with `ui-style-kit-css` and its `interactive-surface-bridge` export.

### Changed

- Expanded dark theme icon-role selectors to also match `data-mode="dark"` and `data-mode="contrast"` containers for broader cross-library theming compatibility.
- Removed `forced-color-adjust` from forced-colors styles to improve compatibility and avoid consumer integration warnings.

## 1.1.5 - 2026-05-18

### Changed

- Republished the release under `1.1.5` after npm rejected the already-published `1.1.4` version.

## 1.1.4 - 2026-05-18

### Fixed

- Corrected reduced-motion behavior so hover/focus/active lift transforms are fully disabled when `prefers-reduced-motion: reduce` is active.

### Changed

- Bumped package release metadata and docs references to `1.1.4` after the previous publish attempt issues.

## 1.1.3 - 2026-05-17

### Changed

- Superseded the failed `1.1.2` release with `1.1.3`.
- Updated version references across package metadata and release docs to `1.1.3`.
- Aligned package metadata with the published `1.1.3` release.
- Refined the changelog entries for the `1.1.3` release.
- Corrected the recorded release version to `1.1.3`.

## 1.1.2 - 2026-05-17

### Added

- Added robust markdown rendering for embedded docs in `index.html` using `marked` (browser UMD) with graceful fallback to the local parser.
- Added copy-to-clipboard controls for rendered README code blocks in the demo docs panel.
- Added expanded SEO and social metadata to the demo page head, including canonical URL, Open Graph, Twitter cards, crawler directives, and JSON-LD structured data.

### Changed

- Moved demo variant color mapping ownership from inline demo CSS into `interactive-surface.css`, so `.variant-*` classes rely on core library token contracts.
- Updated demo theme token wiring so editable core tokens drive variant palettes more consistently across library examples.
- Updated icon-role color token flow to prefer `--interactive-surface-*` icon tokens while retaining legacy alias compatibility.
- Updated demo theme initialization to default to the browser color-scheme preference (`prefers-color-scheme`) when no explicit theme is selected.

### Fixed

- Fixed embedded README rendering for indented fenced code blocks (for example, code fences nested in numbered lists).
- Fixed docs rendering polish by ensuring generated markdown links are sanitized and external links get safe target/rel attributes.

## 1.1.1 - 2026-04-24

### Improved

- Refined interaction-state rendering to improve accessibility across varied site themes and token sets
- Replaced whole-element filter-based state styling with safer state-layer treatment
- Improved disabled-state behavior to better support real-world semantics and integration patterns
- Strengthened high-contrast handling for `prefers-contrast: more`

### Changed

- Touch feedback now uses a tokenized tap highlight instead of fully removing native tap indication
- Native disabled controls (`:disabled`) and `.is-disabled` now use stricter non-interactive behavior
- `[aria-disabled="true"]` receives the same visual disabled appearance and sets `pointer-events: none`; keyboard focus is still reachable so the focus ring remains visible

### Fixed

- Fixed a bug where certain state combinations could cause unintended visual results with specific token sets
- Reduced the risk of contrast loss caused by whole-element brightness and contrast filters
- Reduced the chance of child text and icons being unintentionally affected by state styling
- Softened disabled-state degradation to avoid overly washed-out presentation

## 1.1.0 - 2026-04-09

- Standardized color usage to functional notation by converting remaining hex fallbacks in `interactive-surface.css` to `rgb(...)`.
- Added a color-format guard script (`npm run check:no-hex-colors`) to fail builds when hex literals are introduced in `interactive-surface.css`.
- Integrated the color-format guard into `prepublishOnly` so release builds validate RGB/HSL notation before publish.
- Promoted `index.html` as the primary demo/customization app, with `example.html` retained as a backward-compatible export alias.
- Updated docs and wiki guidance for the new color standard, release checklist updates, and demo customization workflow.
- Updated the README demo section to better highlight the live demo and customization workflow.

## 1.0.2 - 2026-04-02

- Added webpack compatibility via a CommonJS entrypoint (`index.cjs`) and `exports.require` mapping.
- Updated package metadata for dual ESM/CommonJS consumption (`main`, `files`, and `sideEffects` updates).
- Expanded install docs with webpack setup guidance in `README.md` and `wiki/Installation-and-Usage.md`.
- Added GitHub community health docs: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- Added and corrected GitHub templates: issue templates under `.github/ISSUE_TEMPLATE/` and PR template.
- Added and aligned comprehensive wiki pages for API, tokens, accessibility, testing, publishing, FAQ, and roadmap.
- Reworked README structure for clearer usage, publishing, and documentation navigation.

## 1.0.0 - 2026-04-01

- Initial public package release for `interactive-surface.css`
- Added standalone demo page (`example.html`)
- Added package-local Playwright coverage for:
  - state behavior and accessibility media features
  - demo rendering and keyboard focus checks
- Added package metadata (`package.json`, exports, scripts, license)
