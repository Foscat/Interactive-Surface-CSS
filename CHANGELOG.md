# Changelog

All notable changes to this package are documented in this file.

## Unreleased

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
