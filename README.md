# Interactive Surface

Interactive Surface is a framework-agnostic CSS library for building accessible, reusable interactive surfaces with consistent hover, focus, active, press, and disabled states.

It is built for design-system authors and product teams who want one small, importable interaction primitive they can reuse across buttons, cards, toggles, and icon controls.

## Why this package exists

Most UI projects eventually repeat the same interaction logic in multiple places: one button style, another card treatment, a separate icon button pattern, then custom fixes for focus rings, disabled states, and motion behavior.

`interactive-surface.css` centralizes that behavior into a single primitive so interactive elements feel consistent, remain accessible, and stay easy to theme with CSS custom properties.

## Release positioning

**A framework-agnostic, accessible CSS interaction primitive for buttons, cards, and icon controls with token-driven theming.**

---

## Package

Package name:

- `interactive-surface-css`

Install:

```bash
npm install interactive-surface-css
```

Import:

```js
import "interactive-surface-css";
```

Or import the stylesheet directly:

```js
import "interactive-surface-css/interactive-surface.css";
```

CDN (no build step):

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

---

## What it provides

State model:

- Base
- Hover
- Focus-visible
- Active/toggled (`.is-active` or `[aria-pressed="true"]`)
- Press (`:active`)
- Disabled (`.is-disabled`, `:disabled`, `[aria-disabled="true"]`)

Core behavior:

- Elevation and shadow hierarchy (hover > active > base)
- Tactile press feedback
- Keyboard-visible focus ring
- Reduced-motion support
- High-contrast and forced-colors support
- Touch-friendly defaults (`touch-action: manipulation`, 44x44 icon target)

---

## Quick start

```html
<button class="interactive-surface">Save</button>
```

```html
<button class="interactive-surface size-lg variant-primary">
  Continue
</button>
```

```html
<button class="interactive-surface icon-only" aria-label="Settings">
  <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
</button>
```

Demo page:

- `example.html`

---

## Import

```css
@import "interactive-surface-css/interactive-surface.css";
```

Or with JS bundlers:

```js
import "interactive-surface-css/interactive-surface.css";
```

---

## Class API

Base:

- `.interactive-surface`

Size variants:

- `.size-sm`
- `.size-lg`
- `.size-md` is implicit default (no class needed)

State helpers:

- `.is-active`
- `.is-disabled`

Visual variants (brightness tuning only):

- `.variant-primary`
- `.variant-secondary`
- `.variant-accent`
- `.variant-subtle`
- `.variant-warning`
- `.variant-danger`

Icon micro pattern:

- `.icon-only`

---

## Token contract

Preferred tokens:

- `--interactive-surface-lift-base`
- `--interactive-surface-lift-hover`
- `--interactive-surface-lift-active`
- `--interactive-surface-shadow-base`
- `--interactive-surface-shadow-hover`
- `--interactive-surface-shadow-active`
- `--interactive-surface-darken-hover`
- `--interactive-surface-darken-active`
- `--interactive-surface-motion-default`
- `--interactive-surface-motion-press`
- `--interactive-surface-ease-standard`
- `--interactive-surface-ease-press`
- `--interactive-surface-bg`
- `--interactive-surface-fg`
- `--interactive-surface-border-color`
- `--interactive-surface-border-width`
- `--interactive-surface-radius`
- `--interactive-surface-focus-ring-color`
- `--interactive-surface-focus-ring-width`
- `--interactive-surface-focus-ring-offset`
- `--interactive-surface-disabled-opacity`

Legacy fallback tokens (still supported):

- `--lift-base`, `--lift-hover`, `--lift-active`
- `--shadow-base`, `--shadow-hover`, `--shadow-active`
- `--surface-darken-hover`, `--surface-darken-active`
- `--motion-default`, `--motion-press`
- `--ease-standard`, `--ease-press`

Also recognized as semantic color fallbacks:

- `--surface-bg`, `--bg-surface`
- `--surface-fg`, `--text-primary`
- `--surface-border`, `--border-color`
- `--focus-ring`

Important:

- The file does not define global `:root` token defaults.
- Defaults are resolved inline with fallback chains, so it can work standalone while still being easy to override.

---

## Theming examples

Global theme values:

```css
:root {
  --interactive-surface-bg: #0f172a;
  --interactive-surface-fg: #e2e8f0;
  --interactive-surface-border-color: #334155;
  --interactive-surface-focus-ring-color: #38bdf8;
  --interactive-surface-radius: 12px;
}
```

Per-component override:

```css
.product-card .interactive-surface {
  --interactive-surface-lift-hover: -6px;
  --interactive-surface-shadow-hover: 0 14px 30px rgb(0 0 0 / 32%);
}
```

---

## Accessibility behavior

- Uses `:focus-visible` with `:focus` fallback for browsers without `:focus-visible`
- Honors `prefers-reduced-motion: reduce`
- Supports `prefers-contrast: more`
- Supports `forced-colors: active` with system colors
- Supports semantic state attributes:
  - `[aria-pressed="true"]` -> active style
  - `[aria-disabled="true"]` -> disabled style
- `icon-only` enforces a minimum 44px target size

Note for semantics:

- Prefer native interactive elements (`<button>`, `<a>`) whenever possible.
- If using non-semantic elements (`<div>`), provide proper roles and keyboard handling in your component code.

---

## Browser confidence

Validated via Playwright cross-browser spec:

- Chromium
- Firefox
- WebKit

Validation includes hover/focus/active/disabled states and reduced-motion behavior.

Spec files (package-local):

- `tests/interactive-surface.spec.ts`
- `tests/example.spec.ts`

---

## Testing

From the package root (`Interactive-Surface-CSS`):

```bash
npm run lint:css
npm test
npm run test:chromium
npm run pack:dry
```

Publish checklist:

1. Bump version in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run lint:css` and `npm test`
4. Run `npm run pack:dry` and verify package contents
5. Authenticate once on this machine: `npm adduser`
6. Publish with `npm publish --access public`
7. Verify CDN availability:
   - `https://cdn.jsdelivr.net/npm/interactive-surface-css@<version>/interactive-surface.css`
   - `https://unpkg.com/interactive-surface-css@<version>/interactive-surface.css`

---

## Guardrail

`interactive-surface` should be the single source of motion on that element.

Avoid applying additional `transform`, `translate`, `scale`, or `rotate` rules directly to the same node.

If additional motion is needed, apply it to a child element instead to prevent conflicts with the built-in press feedback.
