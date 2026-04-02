# Changelog

All notable changes to this package are documented in this file.

## 1.0.0 - 2026-04-01

- Initial public package release for `interactive-surface.css`
- Added standalone demo page (`example.html`)
- Added package-local Playwright coverage for:
  - state behavior and accessibility media features
  - demo rendering and keyboard focus checks
- Added package metadata (`package.json`, exports, scripts, license)

## 1.0.2 - 2026-05-01

- Added webpack compatibility via a CommonJS entrypoint (`index.cjs`) and `exports.require` mapping.
- Updated package metadata for dual ESM/CommonJS consumption (`main`, `files`, and `sideEffects` updates).
- Expanded install docs with webpack setup guidance in `README.md` and `wiki/Installation-and-Usage.md`.
- Added GitHub community health docs: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- Added and corrected GitHub templates: issue templates under `.github/ISSUE_TEMPLATE/` and PR template.
- Added and aligned comprehensive wiki pages for API, tokens, accessibility, testing, publishing, FAQ, and roadmap.
- Reworked README structure for clearer usage, publishing, and documentation navigation.
