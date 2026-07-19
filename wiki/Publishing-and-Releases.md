# Publishing and Releases

Interactive Surface CSS 1.4.0 is a release candidate until the package is published. Preparing this branch does not authorize an npm publish, Git tag, or GitHub Release.

## Release ownership

The repository's intended path is:

1. Merge an approved, fully verified release candidate.
2. Create the matching GitHub Release and version tag.
3. Let the npm publish workflow validate the release identity and publish with provenance.
4. Verify npm and pinned CDN distribution.

See the [npm publish workflow](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/.github/workflows/npm-publish.yml) for the executable release rules.

## 1.4.0 release-candidate checklist

1. Confirm `package.json` and `package-lock.json` identify `1.4.0`.
2. Confirm the 1.4.0 changelog entry describes entry points, state behavior, compatibility, accessibility, demo, and documentation.
3. Build public stylesheets and verify generated parity.
4. Run deterministic validation:

    ```bash
    npm run validate
    ```

5. Run the supported browser matrix:

    ```bash
    npm run validate:full
    ```

6. Inspect the actual packed tarball and confirm only intended public files are present.
7. Review the final branch diff and resolve every release-blocking finding.
8. Obtain explicit approval before publishing, tagging, or creating the GitHub Release.

## Validation tiers

- `validate` and `validate:ci`: deterministic static, generated, contract, package, and audit checks.
- `validate:browsers`: deterministic checks plus Chromium.
- `validate:full`: deterministic checks plus Chromium, Firefox, and WebKit.

The publish guard avoids downloading browser binaries. Browser verification must already be complete before the irreversible release step.

## Release identity

The tag, GitHub Release, package version, lockfile version, and changelog heading must agree. For this candidate, the expected tag is `v1.4.0`.

## Distribution verification

After an approved publish, verify:

- `https://registry.npmjs.org/interactive-surface-css`
- `https://cdn.jsdelivr.net/npm/interactive-surface-css@1.4.0/interactive-surface.css`
- `https://cdn.jsdelivr.net/npm/interactive-surface-css@1.4.0/state-core.css`
- `https://cdn.jsdelivr.net/npm/interactive-surface-css@1.4.0/standalone-preset.css`
- `https://unpkg.com/interactive-surface-css@1.4.0/interactive-surface.css`
- `https://unpkg.com/interactive-surface-css@1.4.0/state-core.css`
- `https://unpkg.com/interactive-surface-css@1.4.0/standalone-preset.css`

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

The 1.4.0 minor release adds focused entry points and semantic-state coverage while preserving the 1.x contract.
