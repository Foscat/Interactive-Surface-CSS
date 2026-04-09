# Interactive Surface CSS

Interactive Surface CSS is a framework-agnostic CSS library for building accessible, reusable interactive surfaces with consistent state behavior and token-driven theming.

It is intentionally small. The package focuses on one job: giving buttons, cards, icon controls, and similar click targets a consistent interaction model without forcing a framework, component runtime, or opinionated design system structure.

## What this package solves

Many projects end up duplicating the same interaction rules in multiple places:

- one set of hover styles for buttons
- another elevation treatment for cards
- separate pressed styles for toggles
- inconsistent focus rings and disabled states
- ad hoc motion rules that fight each other over time

Interactive Surface CSS centralizes that logic into a single reusable primitive: `.interactive-surface`.

## Core capabilities

- Accessible focus-visible behavior with fallback handling
- Consistent hover, active, pressed, and disabled states
- ARIA-aware toggled and disabled styling
- Token-driven theming with CSS custom properties
- Reduced-motion, high-contrast, and forced-colors support
- Touch-friendly icon-only target sizing
- Framework-agnostic usage across plain HTML, React, Vue, Svelte, and server-rendered applications

## Package details

- **Package name:** `interactive-surface-css`
- **Entry style file:** `interactive-surface.css`
- **JS entry:** `index.js` (imports the stylesheet)
- **Demo/customization page:** `index.html`
- **License:** MIT
- **Current version in repo:** `1.1.0`
- **Release tag:** `v1.1.0`

## Documentation map

- [Getting Started](Getting-Started)
- [Installation and Usage](Installation-and-Usage)
- [API Reference](API-Reference)
- [Token Reference](Token-Reference)
- [Accessibility](Accessibility)
- [Testing and Quality](Testing-and-Quality)
- [Publishing and Releases](Publishing-and-Releases)
- [Contributing](Contributing)
- [FAQ](FAQ)
- [Roadmap](Roadmap)

## Quick example

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

## Design philosophy

This library is not trying to be a full component system.

It is a lower-level interaction primitive intended to sit underneath a design system or application UI layer. That makes it useful when you want consistency and accessibility without taking on the API surface of a large framework-specific component library.
