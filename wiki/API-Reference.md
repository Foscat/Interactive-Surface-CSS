# API Reference

Interactive Surface CSS exposes a class-based API. The package is intentionally small and does not ship JavaScript behavior beyond importing the stylesheet.

## Core class

### `.interactive-surface`

Base interaction primitive. Apply this class to any interactive host element that should receive the package's shared state behavior.

Provides:

- base surface appearance
- hover elevation
- focus-visible ring
- pressed feedback
- active/toggled styling
- disabled handling

## Size modifiers

### `.size-sm`

Reduces hover and active lift values and uses a smaller shadow profile.

### `.size-lg`

Increases hover and active lift values and uses a larger shadow profile.

### Default medium size

There is no `.size-md` class requirement. Medium behavior is the base default when no size modifier is applied.

## State helpers

### `.is-active`

Applies the active/toggled state styling.

### `.is-disabled`

Applies disabled styling and disables interaction by setting `pointer-events: none`.

## Semantic state attributes

### `[aria-pressed="true"]`

Receives the same active styling as `.is-active`.

### `[aria-disabled="true"]`

Receives the same visual disabled styling as `.is-disabled` (reduced opacity, no transform or shadow, `cursor: not-allowed`, `pointer-events: none`). Unlike native `:disabled` controls, `[aria-disabled="true"]` elements can still receive keyboard focus, so the focus ring remains visible when the element is focused via Tab.

### `:disabled`

Native disabled controls also receive disabled styling.

## Visual variants

These classes only tune brightness behavior. They do not define complete color themes by themselves.

- `.variant-primary`
- `.variant-secondary`
- `.variant-accent`
- `.variant-subtle`
- `.variant-warning`
- `.variant-danger`

These are best understood as behavioral modifiers layered on top of your own theme tokens.

## Icon micro pattern

### `.icon-only`

Optimizes the host element for icon-only controls.

Behavior includes:

- 44px minimum width
- 44px minimum height
- centered inline-flex layout
- adjusted lift and shadow profile
- tighter radius profile

## State model summary

The CSS state model is:

- base
- hover / focus-visible
- active / toggled
- press
- disabled

## Exported package entry points

- `interactive-surface-css`
- `interactive-surface-css/interactive-surface.css`
- `interactive-surface-css/package.json`
- `interactive-surface-css/index.html` (primary demo/customization app)
- `interactive-surface-css/example.html` (backward-compatible alias to `index.html`)

## Non-goals

This package does not provide:

- JavaScript state management
- component rendering helpers
- framework bindings
- layout utilities
- global design tokens
