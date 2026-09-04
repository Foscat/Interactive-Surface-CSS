# Publishing and Releases

Interactive Surface CSS 1.7.0 is a release candidate until the package is published. Preparing this branch does not authorize an npm publish, Git tag, or GitHub Release.

## Release ownership

The repository's intended path is:

1. Merge an approved, fully verified release candidate.
2. Create the matching GitHub Release and version tag.
3. Let the npm publish workflow validate the release identity and publish with provenance.
4. Verify npm and pinned CDN distribution.

See the [npm publish workflow](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/.github/workflows/npm-publish.yml) for the executable release rules.

## 1.7.0 release-candidate checklist

1. Confirm `package.json` and `package-lock.json` identify `1.7.0`.
2. Confirm the 1.7.0 changelog entry describes the three feedback hooks, seven feedback tokens, preference behavior, manifest parity, package validation, and full-browser coverage.
3. Confirm `data-surface-feedback="error|success|attention"` works in `state-core.css`, `standalone-preset.css`, and `interactive-surface.css`.
4. Confirm reduced motion, higher contrast, forced colors, busy/loading suppression, disabled suppression, and focus priority remain covered.
5. Confirm manifest, README, embedded README, wiki, changelog, and generated bundles agree on the candidate contract.
6. Build public stylesheets and verify generated parity.
7. Run deterministic validation:

   ```bash
   npm run validate
   ```

   Then run the read-only ecosystem release preflight:

   ```bash
   npm run release:preflight
   ```

   The preflight uses the immutable UI fixture in `ecosystem-release-fixture.json`, overrides Interactive Surface with the candidate tarball, queries npm for every exact documented minimum/current version, resolves all packed exports, validates current documentation, and runs the reviewed clean-install matrices. Pull requests execute this same gate without enabling publish, tag, release, or deployment mutations.

8. Run the supported browser matrix:

   ```bash
   npm run validate:full
   ```

9. Inspect the actual packed tarball and confirm only intended public files are present.
10. Review the final branch diff and resolve every release-blocking finding.
11. Obtain explicit approval before publishing, tagging, or creating the GitHub Release.

## Validation tiers

- `validate` and `validate:ci`: deterministic static, generated, contract, package, and audit checks.
- `validate:browsers`: deterministic checks plus Chromium.
- `validate:full`: deterministic checks plus Chromium, Firefox, and WebKit.

The deterministic publish guard avoids downloading browser binaries. The separate ecosystem release preflight installs Chromium in CI and must pass before the irreversible release step.

## Coordinated U-I bootstrap sequence

The U-I bootstrap gives the Interactive Surface CSS 1.7.0 candidate an immutable UI compatibility fixture after Layout Style CSS 3.0.1 has been published. The cross-repository pins require this exact remote sequence:

1. Push a stable UI bootstrap ref containing `3869ca49c11d8cc085affa25115e8e80546f7a3c`.
2. Use merge commits: push and merge Interactive Surface CSS so its reviewed candidate commit SHA remains reachable.
3. Update and verify the final UI companion pins against the merged Interactive Surface commit and the published Layout Style commit.
4. Push the final UI branch, rerun its ecosystem preflight, and merge UI with a merge commit.
5. Do not squash, rebase, or delete the only remote refs until every pinned commit is reachable through merged ancestry.

The U-I bootstrap SHA is deliberately stable: the Interactive Surface candidate workflow uses it to load the reviewed preflight implementation before the final UI commit can reference the merged Interactive Surface head.

## Release identity

The tag, GitHub Release, package version, lockfile version, and changelog heading must agree. For this candidate, the expected tag is `v1.7.0`.

## Distribution verification

After an approved publish, verify:

- `https://registry.npmjs.org/interactive-surface-css`
- `https://cdn.jsdelivr.net/npm/interactive-surface-css@1.7.0/interactive-surface.css`
- `https://cdn.jsdelivr.net/npm/interactive-surface-css@1.7.0/state-core.css`
- `https://cdn.jsdelivr.net/npm/interactive-surface-css@1.7.0/standalone-preset.css`
- `https://unpkg.com/interactive-surface-css@1.7.0/interactive-surface.css`
- `https://unpkg.com/interactive-surface-css@1.7.0/state-core.css`
- `https://unpkg.com/interactive-surface-css@1.7.0/standalone-preset.css`

Do not treat a local pack or a successful workflow validation as proof that these live URLs are available.

## Manual fallback

If the automated release path is unavailable, publishing from a trusted local machine still requires the same verification and explicit approval:

```bash
npm adduser
npm publish --access public
```

## Versioning

- Patch: backward-compatible fixes.
- Minor: backward-compatible capabilities or entry points.
- Major: intentional breaking changes.

The 1.7.0 minor release adds CSS-only semantic feedback outcomes while preserving the focused entry points, complete 1.x contract, and compatibility ranges. The 1.6.0 U-I bootstrap revision remains the immutable fixture history for coordinated ecosystem release validation.
