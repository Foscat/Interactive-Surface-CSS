# Token Reference

Interactive Surface CSS uses CSS custom properties for theming.

## Preferred token namespace

These are the primary public tokens:

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
- `--interactive-surface-tap-highlight-color`

## Legacy fallback tokens

The stylesheet still recognizes legacy token names:

- `--lift-base`
- `--lift-hover`
- `--lift-active`
- `--shadow-base`
- `--shadow-hover`
- `--shadow-active`
- `--surface-darken-hover`
- `--surface-darken-active`
- `--motion-default`
- `--motion-press`
- `--ease-standard`
- `--ease-press`

## Semantic color fallbacks

The stylesheet also recognizes these semantic fallbacks:

- `--surface-bg`
- `--bg-surface`
- `--surface-fg`
- `--text-primary`
- `--surface-border`
- `--border-color`
- `--focus-ring`

## UI Style Kit CSS bridge

When used with `ui-style-kit-css` 2.x, the UI Style Kit bridge maps active `data-ui`, `data-theme`, and `data-mode` roles into this package's public `--interactive-surface-*` contract.

Interactive Surface does not depend on UI Style Kit token names directly. It continues to resolve values through its own token contract, so the package remains usable without UI Style Kit.

The bridge can also provide state-layer aliases for visible hover, focus, and active feedback:

- `--interactive-surface-state-layer-opacity-hover`
- `--interactive-surface-state-layer-opacity-focus`
- `--interactive-surface-state-layer-opacity-active`

When a surface includes `data-surface-level`, Interactive Surface reads these optional depth tokens:

- `--interactive-surface-level-bg`
- `--interactive-surface-level-border-color`
- `--interactive-surface-level-shadow`

The package also exposes per-level defaults that bridge styles or app themes can override:

- `--interactive-surface-level-1-bg`
- `--interactive-surface-level-1-border-color`
- `--interactive-surface-level-1-shadow`
- `--interactive-surface-level-2-bg`
- `--interactive-surface-level-2-border-color`
- `--interactive-surface-level-2-shadow`
- `--interactive-surface-level-3-bg`
- `--interactive-surface-level-3-border-color`
- `--interactive-surface-level-3-shadow`

The matching state-opacity hooks are `--interactive-surface-level-<n>-hover-opacity`, `--interactive-surface-level-<n>-active-opacity`, and `--interactive-surface-level-<n>-focus-opacity`.

## Important implementation detail

The package does **not** define global `:root` tokens.

Instead, values are resolved inline through fallback chains. That makes the stylesheet safer to drop into an existing app without unexpectedly redefining the global token layer.

## Color notation standard

Use functional color notation for token values:

- `rgb(255 255 255)`
- `rgb(15 23 42 / 80%)`
- `hsl(200deg 100% 50%)`

Avoid hex literals in examples and production token files so palette updates are easier to audit and automate.

## Starter theme example

```css
:root {
  --interactive-surface-bg: rgb(255 255 255);
  --interactive-surface-fg: rgb(16 42 67);
  --interactive-surface-border-color: rgb(213 223 232);
  --interactive-surface-radius: 14px;
  --interactive-surface-focus-ring-color: rgb(0 126 138);

  --interactive-surface-lift-hover: -4px;
  --interactive-surface-lift-active: -2px;
  --interactive-surface-shadow-hover: 0 10px 28px rgb(0 0 0 / 0.35);
  --interactive-surface-shadow-active: 0 6px 18px rgb(0 0 0 / 0.3);
}
```

## Component-scoped override example

```css
.product-card .interactive-surface {
  --interactive-surface-lift-hover: -6px;
  --interactive-surface-shadow-hover: 0 14px 30px rgb(0 0 0 / 32%);
}
```

## Token intent guidance

### Appearance tokens

Use these to match brand or theme:

- background
- foreground
- border color
- radius
- focus ring color

### Motion and depth tokens

Use these to tune tactile behavior:

- lift values
- shadow values
- motion duration
- easing curves
- hover and active brightness modifiers

### Accessibility-related tokens

Use these carefully:

- focus ring width
- focus ring offset
- disabled opacity
- tap highlight color

Avoid reducing focus visibility below practical usability.

`--interactive-surface-tap-highlight-color` controls the native mobile tap flash color applied via `-webkit-tap-highlight-color`. The default is a semi-transparent blue (`rgb(11 99 246 / 0.18)`). Set to `transparent` to suppress the flash entirely (not recommended for touch-only contexts), or set to a brand color to align tap feedback with your theme.
