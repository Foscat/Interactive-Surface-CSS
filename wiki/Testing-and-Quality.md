# Testing and Quality

The repository includes both CSS linting and Playwright-based behavioral tests.

## Available scripts

```bash
npm run check:no-hex-colors
npm run lint:css
npm run test:install
npm test
npm run test:chromium
npm run pack:dry
npm run validate
```

## What each script does

### `npm run check:no-hex-colors`

Runs a guard script that fails if hex color literals are present in `interactive-surface.css`.

### `npm run lint:css`

Runs Stylelint against `interactive-surface.css`.

### `npm run test:install`

Installs the Chromium, Firefox, and WebKit browser binaries (and their OS-level dependencies) required by the Playwright projects. Run this before the browser tests on a fresh machine or CI environment.

### `npm test`

Runs the Playwright suite using the project config.

### `npm run test:chromium`

Runs the Playwright suite in Chromium only. Useful for quick local verification.

### `npm run pack:dry`

Runs `npm pack --dry-run` using the local npm cache folder so the final published package contents can be inspected before release.

### `npm run validate`

Runs the full release validation sequence: color guard, CSS linting, Playwright browser installation, Playwright tests, and the dry package check.

## Behavioral test coverage in the repo

Current Playwright tests validate:

- standalone fallback style resolution
- keyboard focus visibility
- `aria-pressed` active styling
- `aria-disabled` non-interactivity
- reduced-motion transform removal
- icon-only minimum target size
- index demo page rendering and control count

## Relevant test files

- `tests/interactive-surface.spec.ts`
- `tests/example.spec.ts`

## Why Playwright is used here

This library is visual and state-driven. Browser-level validation is more useful than unit-testing implementation details because the value of the package is expressed through computed styles and real browser interaction behavior.

## Recommended local release check

Run this sequence before publishing:

```bash
npm run validate
```

## Package contents check

Review the dry-run output and confirm that only intended public files are included:

- `index.js`
- `interactive-surface.css`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `index.html`
