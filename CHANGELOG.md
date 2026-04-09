# Changelog

All notable changes to this package are documented in this file.

## 1.1.0 - 2026-04-09

- Standardized color usage to functional notation by converting remaining hex fallbacks in `interactive-surface.css` to `rgb(...)`.
- Added a color-format guard script (`npm run check:no-hex-colors`) to fail builds when hex literals are introduced in `interactive-surface.css`.
- Integrated the color-format guard into `prepublishOnly` so release builds validate RGB/HSL notation before publish.
- Promoted `index.html` as the primary demo/customization app, with `example.html` retained as a backward-compatible export alias.
- Updated docs and wiki guidance for the new color standard, release checklist updates, and demo customization workflow.

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
