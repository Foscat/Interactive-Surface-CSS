# Contributing

Contributions should preserve the package's narrow purpose: a stable, framework-agnostic interaction-state layer that works alone and remains complementary to theme and layout libraries.

Read the repository policies before starting:

- [Contributing Guide](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/CODE_OF_CONDUCT.md)
- [Security Policy](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/SECURITY.md)
- [Documentation Home](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Home)

## Contribution rules

- Preserve every documented 1.x import, selector, data hook, ARIA hook, and token fallback unless a future major release explicitly removes it.
- Keep `state-core.css` free of standalone paint and consumer-facing geometry.
- Keep preset and compatibility bundles generated from the same authored modules.
- Prefer semantic HTML and ARIA state over demo-only helper selectors.
- Preserve visible state under reduced motion, higher contrast, and forced colors.
- Keep interaction motion composable with consumer transforms.
- Use functional color notation such as `rgb(...)` and `hsl(...)`.
- Add deterministic contracts before changing public behavior.
- Update the README, wiki, demo fallback, and release notes when public guidance changes.

## Local workflow

```bash
npm ci
npm run validate
npm run validate:browsers
```

Use `npm run validate:full` before release review when Chromium, Firefox, and WebKit are available.

The validation tiers are documented in [Testing and Quality](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Testing-and-Quality).

## Pull-request checklist

- public contract tests are green
- generated bundle parity is green
- CSS lint and color guard are green
- package contents match the allowlist
- documentation links are npm-safe
- rendered state behavior is verified in proportion to the change
- no publish, tag, or GitHub Release is performed as part of ordinary contribution work

## Scope decisions

Proposals that add layout utilities, global theme systems, component runtimes, or framework wrappers should normally live in another package. Interaction-state improvements should remain semantic, token-driven, and independently useful.
