# Accessibility

Accessibility is a core part of the package behavior, not an afterthought.

## Included accessibility behavior

Interactive Surface CSS includes support for:

- `:focus-visible` keyboard focus behavior
- `:focus` fallback handling for browsers without `:focus-visible`
- reduced-motion preferences
- higher-contrast preferences
- forced-colors mode
- ARIA-pressed active states
- ARIA-disabled disabled states
- 44x44 icon-only target sizing

## Focus behavior

The package uses an outline-based focus ring. In browsers that support `:focus-visible`, mouse focus is suppressed while keyboard focus remains visible.

Relevant tokens:

- `--interactive-surface-focus-ring-color`
- `--interactive-surface-focus-ring-width`
- `--interactive-surface-focus-ring-offset`

## Reduced motion

When `prefers-reduced-motion: reduce` is active, the package removes transform-driven movement and transitions from the interactive surface.

That means users who prefer reduced motion do not get hover lift, press movement, or animated state transitions.

## Higher contrast

When `prefers-contrast: more` is active, brightness modifications are neutralized and the focus ring width is increased.

## Forced colors

When `forced-colors: active` is enabled, system colors are used:

- `ButtonFace`
- `ButtonText`
- `Highlight`
- `GrayText`

This keeps the primitive compatible with operating-system-managed high contrast modes.

## ARIA state support

### Pressed / toggled controls

```html
<button class="interactive-surface" aria-pressed="true">Pinned</button>
```

### Disabled custom control

```html
<button class="interactive-surface" aria-disabled="true">Unavailable</button>
```

## Semantic guidance

Prefer native interactive elements whenever possible.

Good:

- `<button>`
- `<a href="...">`

Use non-semantic elements only when your application adds the missing semantics and keyboard support.

## Important limitation

This package styles interaction states. It does not create semantics or keyboard behavior on non-native elements for you.
