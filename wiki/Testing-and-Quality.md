# Testing and Quality

The 1.6.0 release candidate uses layered gates so contributors can choose fast deterministic checks or the complete cross-browser suite without confusing the two.

## Validation tiers

### `npm run validate` and `npm run validate:ci`

The deterministic release gate covers static checks, generated-bundle parity, CSS linting, documentation and public contracts, the packed-package contract, a dry package inspection, and the npm audit. It does not install or launch browsers.

Use this tier for normal CI and before requesting review.

CI runs the full deterministic tier on Node.js 20 and Node.js 22. The Node.js 20 lane is the minimum supported npm and contributor runtime through `npm run validate:node20`; the Node.js 22 lane is the preferred release-validation runtime through `npm run validate:ci`. Official workflow actions are pinned to reviewed commit revisions.

### `npm run validate:browsers`

This runs the deterministic validation tier plus browser installation and the Chromium Playwright project. It is the focused rendered-behavior gate.

### `npm run validate:full`

This runs the deterministic validation tier plus the complete Playwright matrix in Chromium, Firefox, and WebKit. It is the final local release gate when all supported browser binaries are available.

The Playwright configuration uses a stable two-worker limit. Focused release proofs may reduce that to one worker for deterministic state sequencing.

## Focused commands

| Command                       | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `npm run check:no-hex-colors` | Reject disallowed hex color literals                                       |
| `npm run check:public`        | Verify committed public roots before generating ignored distribution files |
| `npm run check:generated`     | Verify public and distribution bundles after a build                       |
| `npm run lint:css`            | Run Stylelint over authored, generated, and demo CSS                       |
| `npm run test:contracts`      | Run deterministic public, build, and documentation contracts               |
| `npm run test:chromium`       | Run the selected Playwright tests in Chromium                              |
| `npm test`                    | Run the configured Chromium, Firefox, and WebKit projects                  |
| `npm run pack:dry`            | Inspect the npm tarball allowlist without publishing                       |
| `npm audit`                   | Check the dependency tree against the npm advisory database                |

The exact script graph is finalized as part of the 1.6.0 release candidate before publication. Browser downloads intentionally remain outside `prepublishOnly`.

## Contract coverage

Deterministic tests verify:

- preserved 1.x selectors, JavaScript entries, stylesheet paths, data hooks, ARIA hooks, and token families
- public transition property, duration, easing, and delay tokens
- absence of implicit UI-host lift compensation and cross-package importance
- resolvable `state-core.css`, `standalone-preset.css`, and compatibility bundles
- generated-root and distribution parity
- state-core ownership boundaries
- packed-package contents
- npm-safe README and wiki guidance
- exact README and embedded demo-fallback parity

## Rendered behavior coverage

Playwright verifies:

- fine-pointer hover and transient press
- exact default, public, active, legacy-fallback, and file-selector transition tuples
- keyboard focus visibility
- disabled > busy/loading > transient active > persistent > hover > base precedence
- pressed true and mixed, non-false current, selected, busy, loading, and established active states
- native, ARIA, and class-disabled precedence
- static state meaning under reduced motion
- forced-colors and higher-contrast affordances
- consumer transform composition
- coarse-pointer behavior
- standalone icon target sizing
- UI Style Kit integration in supported import orders
- demo responsiveness, semantic state workflows, dialog focus containment, and error reporting

## Documentation URL policy

Documentation tests validate URL shape locally and never fetch live pages. README wiki links use absolute GitHub Wiki URLs because npm renders the README outside the repository. Repository files excluded from the package use absolute GitHub blob URLs.

## Before publishing

Run:

```bash
npm run validate:full
```

Then review the packed-file list and any environment-specific browser skips. A green local gate does not publish, tag, or create a GitHub Release.
