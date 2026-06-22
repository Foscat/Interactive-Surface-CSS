# Installation and Usage

## Installation

```bash
npm install interactive-surface-css
```

## Supported import styles

### Bundler entry

```js
import "interactive-surface-css";
```

This works because the package entry file imports `interactive-surface.css`.

### Direct CSS file import

```js
import "interactive-surface-css/interactive-surface.css";
```

### CSS-level import

```css
@import "interactive-surface-css/interactive-surface.css";
```

### No-build CDN usage

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/interactive-surface-css@latest/interactive-surface.css"
/>
```

## Webpack setup

Install CSS loaders:

```bash
npm install -D css-loader style-loader
```

Example `webpack.config.js` rule:

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

Then import in your app entry:

```js
import "interactive-surface-css";
```

## Common usage patterns

### Standard action button

```html
<button class="interactive-surface">Submit</button>
```

### Variant-adjusted button

```html
<button class="interactive-surface variant-accent">Learn more</button>
```

### Large surface card

```html
<button class="interactive-surface size-lg surface-card">
  <strong>Reusable elevation</strong>
  <span>Keep interaction behavior consistent across surfaces.</span>
</button>
```

### Icon-only micro control

```html
<button class="interactive-surface icon-only" aria-label="Search">
  <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
</button>
```

### ARIA pressed state

```html
<button class="interactive-surface" aria-pressed="true">Pinned</button>
```

### Disabled state

```html
<button class="interactive-surface" disabled>Unavailable</button>
```

or

```html
<button class="interactive-surface is-disabled" aria-disabled="true">Unavailable</button>
```

## Framework examples

### React

```jsx
import "interactive-surface-css";

export function SaveButton() {
  return <button className="interactive-surface variant-primary">Save</button>;
}
```

### Vue

```vue
<script setup>
import "interactive-surface-css";
</script>

<template>
  <button class="interactive-surface variant-primary">Save</button>
</template>
```

### Svelte

```svelte
<script>
  import "interactive-surface-css";
</script>

<button class="interactive-surface variant-primary">Save</button>
```

## Using with UI Style Kit CSS

`interactive-surface-css` and `ui-style-kit-css` can be used independently or together.

UI Style Kit owns visual theme tokens. Interactive Surface owns interaction behavior on `.interactive-surface`.

With `ui-style-kit-css@2.0.1`, the default full bundle does not include the bridge. Use the opt-in bridge bundle when you want runtime UI switching and Interactive Surface token mapping in one import:

```js
import "ui-style-kit-css/with-bridge.css";
import "interactive-surface-css/interactive-surface.css";
```

With per-style UI Style Kit imports, include the bridge:

```js
import "ui-style-kit-css/styles/minimal-saas.css";
import "ui-style-kit-css/interactive-surface-bridge";
import "interactive-surface-css/interactive-surface.css";
```

This order is also supported:

```js
import "interactive-surface-css/interactive-surface.css";
import "ui-style-kit-css/styles/minimal-saas.css";
import "ui-style-kit-css/interactive-surface-bridge";
```

The bridge maps UI Style Kit theme roles into Interactive Surface tokens. UI Style Kit owns those visual token values; Interactive Surface owns the hover, focus, pressed, selected, disabled, and reduced-motion behavior on `.interactive-surface`.

## Motion guardrail

`interactive-surface` owns transform-based motion on the host element.

Avoid applying additional `transform`, `translate`, `scale`, or `rotate` rules directly to the same node. If you need extra animation, put it on a child element instead.
