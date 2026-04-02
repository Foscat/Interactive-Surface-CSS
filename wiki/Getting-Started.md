# Getting Started

This page covers the fastest path to using Interactive Surface CSS in a real project.

## Install

```bash
npm install interactive-surface-css
```

## Import

### JavaScript or bundler import

```js
import "interactive-surface-css";
```

### Direct stylesheet import

```js
import "interactive-surface-css/interactive-surface.css";
```

### CSS import

```css
@import "interactive-surface-css/interactive-surface.css";
```

### CDN usage

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/interactive-surface-css@1.0.0/interactive-surface.css"
/>
```

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/interactive-surface-css@1.0.0/interactive-surface.css"
/>
```

## Minimal usage

```html
<button class="interactive-surface">Save</button>
```

That one class gives the element:

- base surface styling
- hover elevation on capable pointers
- keyboard-visible focus styles
- press feedback
- disabled handling
- token-based theming hooks

## Recommended first patterns

### Button

```html
<button class="interactive-surface variant-primary">Save changes</button>
```

### Larger primary action

```html
<button class="interactive-surface size-lg variant-primary">Continue</button>
```

### Icon-only control

```html
<button class="interactive-surface icon-only" aria-label="Open settings">
  <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
</button>
```

### Toggle-style control

```html
<button class="interactive-surface is-active" aria-pressed="true">Selected</button>
```

## First theme override

```css
:root {
  --interactive-surface-bg: #0f172a;
  --interactive-surface-fg: #e2e8f0;
  --interactive-surface-border-color: #334155;
  --interactive-surface-focus-ring-color: #38bdf8;
  --interactive-surface-radius: 12px;
}
```

## Best practice

Use native interactive elements whenever possible:

- `<button>` for actions
- `<a>` for navigation

The package will work with non-semantic elements, but semantics and keyboard behavior still need to be provided by your application code.
