# Interactive Surface

Interactive Surface is a framework-agnostic CSS interaction primitive for buttons, cards, icon controls, and similar click targets.

It provides consistent hover, focus-visible, active, press, and disabled behavior with token-driven theming and accessibility guardrails.

## Documentation

Project docs live in this repository:

- [Wiki Home](./wiki/Home.md)
- [Getting Started](./wiki/Getting-Started.md)
- [Installation and Usage](./wiki/Installation-and-Usage.md)
- [API Reference](./wiki/API-Reference.md)
- [Token Reference](./wiki/Token-Reference.md)
- [Accessibility](./wiki/Accessibility.md)
- [Testing and Quality](./wiki/Testing-and-Quality.md)
- [Publishing and Releases](./wiki/Publishing-and-Releases.md)
- [FAQ](./wiki/FAQ.md)
- [Roadmap](./wiki/Roadmap.md)

Community and governance docs:

- [Contributing](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)

## Package

- Package name: `interactive-surface-css`
- Style entry: `interactive-surface.css`
- JS entry: `index.js` (imports CSS)

Install:

```bash
npm install interactive-surface-css
```

Import:

```js
import "interactive-surface-css";
```

Or import CSS directly:

```js
import "interactive-surface-css/interactive-surface.css";
```

Webpack:

1. Install loaders:

    ```bash
    npm install -D css-loader style-loader
    ```

2. Configure `webpack.config.js`:

    ```js
    module.exports = {
      module: {
        rules: [
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"]
          }
        ]
      }
    };
    ```

3. Import in your app entry:

    ```js
    import "interactive-surface-css";
    ```

CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/interactive-surface-css@1.0.2/interactive-surface.css" />
<link rel="stylesheet" href="https://unpkg.com/interactive-surface-css@1.0.2/interactive-surface.css" />
```

## Quick Start

```html
<button class="interactive-surface">Save</button>
```

```html
<button class="interactive-surface size-lg variant-primary">Continue</button>
```

```html
<button class="interactive-surface icon-only" aria-label="Settings">
  <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
</button>
```

Demo page: `example.html`

## Class API

Base:

- `.interactive-surface`

Size modifiers:

- `.size-sm`
- `.size-lg`
- medium is default when no size class is set

State helpers:

- `.is-active`
- `.is-disabled`

Semantic states:

- `[aria-pressed="true"]`
- `[aria-disabled="true"]`
- `:disabled`

Visual variants:

- `.variant-primary`
- `.variant-secondary`
- `.variant-accent`
- `.variant-subtle`
- `.variant-warning`
- `.variant-danger`

Icon pattern:

- `.icon-only`

## Token Contract

Preferred token namespace:

- `--interactive-surface-*`

The package also supports legacy fallback tokens and semantic fallback tokens. Full details and examples are in [Token Reference](./wiki/Token-Reference.md).

## Accessibility

Built-in support includes:

- `:focus-visible` behavior with fallback handling
- reduced-motion preference handling
- high-contrast and forced-colors handling
- ARIA pressed/disabled styling
- 44x44 minimum target size for `.icon-only`

See [Accessibility](./wiki/Accessibility.md) for implementation guidance.

## Testing

```bash
npm run lint:css
npm test
npm run test:chromium
npm run pack:dry
```

## Publishing

This repo is configured for release-driven npm publish through GitHub Actions at `.github/workflows/npm-publish.yml`.

Release checklist:

1. Add repository secret `NPM_TOKEN` (npm token with publish rights).
2. Bump `version` in `package.json`.
3. Update `CHANGELOG.md`.
4. Push to `main`.
5. Create and publish a GitHub Release tag (for example `v1.0.1`).
6. Verify the `Publish to npm` workflow succeeds.
7. Verify CDN availability:
   - `https://cdn.jsdelivr.net/npm/interactive-surface-css@1.0.2/interactive-surface.css`
   - `https://unpkg.com/interactive-surface-css@1.0.2/interactive-surface.css`

Manual fallback:

```bash
npm adduser
npm publish --access public
```

## Guardrail

`interactive-surface` should be the only transform-based motion owner on its host element.

Avoid applying additional `transform`, `translate`, `scale`, or `rotate` rules to the same node. If you need extra animation, apply it to a child element.
