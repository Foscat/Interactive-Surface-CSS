# Installation and Usage

These instructions target the Interactive Surface CSS 1.5.0 release candidate. Existing 1.x imports remain supported.

The npm package targets Node.js 20+ for installation and local validation. CI also proves the preferred Node.js 22 release lane.

## Install from npm

```bash
npm install interactive-surface-css
```

## Choose an entry point

### Complete standalone preset

```js
import "interactive-surface-css/standalone-preset.css";
```

Use this for a new standalone integration. It includes state behavior, neutral paint, variants, levels, icon defaults, and component geometry.

### State-only core

```js
import "interactive-surface-css/state-core.css";
```

Use this when an application or design system already owns component paint and geometry.

### Preserved compatibility imports

```js
import "interactive-surface-css/interactive-surface.css";
import "interactive-surface-css";
```

Both preserve the complete 1.x experience. The package-root JavaScript import requires a bundler configured to consume CSS imports.

### CSS-level imports

```css
@import "interactive-surface-css/standalone-preset.css";
/* Or use state-core.css when your design system owns presentation. */
```

## CDN usage

Pin the release in reproducible pages:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/interactive-surface-css@1.5.0/standalone-preset.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/interactive-surface-css@1.5.0/standalone-preset.css"
/>
```

The `interactive-surface.css` compatibility path is also available from both CDNs. Use `https://cdn.jsdelivr.net/npm/interactive-surface-css@latest/standalone-preset.css` — unpinned opt-in — only when following future releases automatically is acceptable.

## Bundler configuration

Vite, Next.js, Parcel, and similar toolchains normally consume direct CSS imports without extra configuration. For Webpack, configure a CSS rule when the project does not already provide one:

```js
export default {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

The direct stylesheet entry points are the most portable option because they do not rely on the package-root JavaScript side effect.

## Common markup

```html
<button class="interactive-surface" type="button">Submit</button>

<button class="interactive-surface variant-accent size-lg" type="button">
  Continue
</button>

<button
  class="interactive-surface"
  type="button"
  data-surface-variant="accent"
  data-surface-level="2"
>
  Continue
</button>

<button class="interactive-surface icon-only" type="button" aria-label="Search">
  <svg aria-hidden="true" data-icon-role="dark" viewBox="0 0 24 24">…</svg>
</button>
```

The library does not require a card-specific class. Consumers own their markup and content layout; Interactive Surface owns the state behavior applied to the host.

## Use one, use two, or use all three

Use one library, use two compatible libraries, or use all three according to the ownership layers you need.

### Interactive Surface alone

```js
import "interactive-surface-css/standalone-preset.css";
```

### With UI Style Kit CSS

```js
import "ui-style-kit-css/with-bridge.css";
import "interactive-surface-css/state-core.css";
```

UI Style Kit owns paint and theme modes; Interactive Surface owns interaction states.

### With all three libraries

```js
import "ui-style-kit-css/with-bridge.css";
import "interactive-surface-css/state-core.css";
import "layout-style-css/bridge.css";
import "layout-style-css";
```

Layout Style CSS owns structure and geometry. The [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/) demonstrates the complete composition.

## State and activation responsibilities

CSS provides visible state but no runtime state machine. Applications must update `aria-pressed`, `aria-current`, `aria-selected`, and `aria-busy`. Prefer native `disabled`; consumers must suppress activation for `aria-disabled="true"` and `.is-disabled` controls.

Interaction lift uses the individual `translate` property and composes with consumer-owned `transform`, `scale`, and `rotate`.

## Next references

- [API Reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/API-Reference)
- [Token Reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Token-Reference)
- [Accessibility](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Accessibility)
