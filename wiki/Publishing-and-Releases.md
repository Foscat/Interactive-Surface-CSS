# Publishing and Releases

This page documents the release workflow for Interactive Surface CSS.

## Publish Path

Primary path: GitHub Release -> GitHub Actions -> npm publish.

Workflow file:

- `.github/workflows/npm-publish.yml`

## Required Repository Secret

Add this secret in GitHub repository settings:

- `NPM_TOKEN`: npm token with publish rights for the package

## Release Checklist

1. Update code and docs.
2. Bump `version` in `package.json`.
3. Update `CHANGELOG.md`.
4. Run local checks:

```bash
npm run check:no-hex-colors
npm run lint:css
npm test
npm run pack:dry
```

5. Push changes to `main`.
6. Create and publish a GitHub Release for that version tag (for example `v1.1.0`).
7. Confirm `Publish to npm` workflow succeeds.
8. Verify distribution:

- `https://registry.npmjs.org/interactive-surface-css`
- `https://cdn.jsdelivr.net/npm/interactive-surface-css@<version>/interactive-surface.css`
- `https://unpkg.com/interactive-surface-css@<version>/interactive-surface.css`

## Manual Fallback

If GitHub Actions is unavailable, publish from a trusted local machine:

```bash
npm adduser
npm publish --access public
```

## Versioning Guidance

Use semantic versioning:

- `x.y.z` patch for fixes
- minor for backward-compatible additions
- major for breaking behavior

## Release Notes

For each release, include:

- summary of changes
- API/token behavior changes
- accessibility notes
- migration notes for breaking changes
