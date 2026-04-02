# Contributing

Thank you for contributing to Interactive Surface.

This project is intentionally narrow in scope: a small, framework-agnostic CSS interaction primitive with strong accessibility behavior.

## Project Goals

Contributions should improve one or more of the following:

- accessibility
- interaction consistency
- token-driven theming ergonomics
- browser reliability
- documentation clarity
- test coverage for real behavior

## Good Fit vs Poor Fit

Good fit:

- bug fixes in interactive states
- accessibility and cross-browser fixes
- token contract improvements
- documentation and example improvements
- tests for behavior regressions

Poor fit:

- framework-specific wrappers in the core package
- unrelated utility classes
- broad visual redesigns in core styles
- API growth without repeatable use cases

## Local Setup

```bash
npm install
```

Run checks:

```bash
npm run lint:css
npm test
npm run pack:dry
```

## Workflow Expectations

For significant changes, open an issue first with:

- the problem
- proposed solution
- whether behavior is breaking
- accessibility impact

For pull requests:

- keep scope focused
- explain what changed and why
- call out token/class/API impacts
- update docs when behavior changes
- add or update tests for behavior changes

## Coding Expectations

- Keep selectors readable and intentional.
- Avoid brittle specificity escalations.
- Preserve reduced-motion and forced-colors behavior.
- Preserve keyboard-visible focus behavior.
- Prefer token-driven extensions over one-off variants.

## Release-Impacting Changes

If your change affects public usage, also update:

- `README.md`
- relevant pages in `wiki/`
- `CHANGELOG.md`

## Commit Guidance

Conventional-style commits are recommended:

- `fix: correct focus ring fallback behavior`
- `docs: clarify token override examples`
- `test: add coverage for aria-disabled state`
- `chore: prepare release metadata`

## Reporting Bugs and Proposals

Use issue templates for:

- bug reports
- feature requests
- documentation improvements

## Conduct

By participating, you agree to follow [Code of Conduct](./CODE_OF_CONDUCT.md).
