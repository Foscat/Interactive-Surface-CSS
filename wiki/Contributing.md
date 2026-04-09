# Contributing

Contributions should preserve the package goal: a small, stable, framework-agnostic interaction primitive.

For the full policy and expectations, see:

- [Contributing Guide](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/CONTRIBUTING.md)

## Quick Rules

- keep API growth intentional and minimal
- preserve accessibility behavior
- prefer token-driven extensions over one-off classes
- use functional color notation (`rgb(...)`, `hsl(...)`) instead of hex literals
- update docs and tests when behavior changes

## Local Validation

```bash
npm run check:no-hex-colors
npm run lint:css
npm test
npm run pack:dry
```

## Related Governance Docs

- [Code of Conduct](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/CODE_OF_CONDUCT.md)
- [Security Policy](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/SECURITY.md)
