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

Avoid reducing focus visibility below practical usability.
