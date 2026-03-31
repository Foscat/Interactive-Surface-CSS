# Interactive Surface — Interactive Motion Primitive

## `interactive-surface.css`

`interactive-surface.css` provides a **design-system–grade interaction primitive** for clickable UI surfaces such as buttons, icon buttons, and glassmorphic tiles.

It implements a **physically consistent elevation model** with hover lift, active selection, and tactile press feedback—without JavaScript and without layout shifts.

### Design goals

- Smooth, reversible hover animations
- Clear elevation hierarchy (hover > active > base)
- Tactile press feedback (bounce impulse)
- Glassmorphism-safe (no opacity hacks)
- Accessible (reduced motion support)
- Framework-agnostic (React, RSuite, plain HTML)

---

## Interaction Model

| State                 | Behavior                                  |
| --------------------- | ----------------------------------------- |
| **Base**              | Resting position, no elevation            |
| **Hover / Focus**     | Lifts upward, shadow grows proportionally |
| **Active (selected)** | Medium elevation below hover              |
| **Press (mousedown)** | Brief drop to base with shadow removal    |
| **Disabled**          | No motion, muted appearance               |

All transitions are GPU-accelerated using `transform` and `box-shadow` only.

---

## Base Usage

Apply the base class to any clickable surface:

```jsx
<Button className="interactive-surface">
  Submit
</Button>
```

```html
<div class="interactive-surface">
  Clickable Tile
</div>
```

### Guardrail Rule

If an element has `interactive-surface`, do not add other `transform`, `scale`, `translate`, or `rotate` rules on that same element in component CSS.

`interactive-surface` is the single motion source for clickable controls so interaction behavior and accessibility stay consistent across the app.

---

## Size Variants

Control motion scale using size modifiers:

```html
<button class="interactive-surface size-sm">Small</button>
<button class="interactive-surface size-md">Medium</button>
<button class="interactive-surface size-lg">Large</button>
```

| Size      | Intended Use               |
| --------- | -------------------------- |
| `size-sm` | Dense UI, utility buttons  |
| `size-md` | Default buttons, cards     |
| `size-lg` | Primary CTAs, hero actions |

---

## Icon-Only Buttons

Use the `icon-only` variant for toolbar icons and compact actions:

```jsx
<div
  className="interactive-surface icon-only"
  aria-label="Settings"
>
  <SettingsIcon />
</div>
```

This variant uses reduced lift distance and faster motion timing to avoid floatiness in dense layouts.

---

## Active / Selected State

Use `.is-active` to indicate a selected or toggled state:

```jsx
<Button className="interactive-surface is-active">
  Selected
</Button>
```

The active state maintains elevation but remains visually subordinate to hover.

---

## Disabled State

Disable interaction using either `.is-disabled` or the native `disabled` attribute:

```jsx
<Button
  className="interactive-surface"
  disabled
>
  Disabled
</Button>
```

Disabled surfaces:

- Do not animate
- Ignore pointer events
- Appear visually muted

---

## Visual Variants

Visual variants adjust **color modulation only**.
They do **not** change motion or elevation behavior.

```html
<button class="interactive-surface variant-primary">Primary</button>
<button class="interactive-surface variant-secondary">Secondary</button>
<button class="interactive-surface variant-accent">Accent</button>
<button class="interactive-surface variant-subtle">Subtle</button>
<button class="interactive-surface variant-warning">Warning</button>
<button class="interactive-surface variant-danger">Danger</button>
```

---

## Variant → UI Token Mapping

These variants are designed to map cleanly onto a **token-based UI system** such as Midnight Gold / Frosted UI.

Below is the **recommended semantic mapping**.

### Background tokens

| Variant             | Suggested Background Token |
| ------------------- | -------------------------- |
| `variant-primary`   | `--bg-primary`             |
| `variant-secondary` | `--bg-secondary`           |
| `variant-accent`    | `--bg-accent-gold`         |
| `variant-subtle`    | `--bg-surface-muted`       |
| `variant-warning`   | `--bg-warning`             |
| `variant-danger`    | `--bg-danger`              |

### Text / icon tokens

| Variant             | Suggested Text Token  |
| ------------------- | --------------------- |
| `variant-primary`   | `--text-on-primary`   |
| `variant-secondary` | `--text-on-secondary` |
| `variant-accent`    | `--text-on-accent`    |
| `variant-subtle`    | `--text-primary`      |
| `variant-warning`   | `--text-on-warning`   |
| `variant-danger`    | `--text-on-danger`    |

### Example integration

```css
.variant-primary {
  background: var(--bg-primary);
  color: var(--text-on-primary);
}

.variant-accent {
  background: var(--bg-accent-gold);
  color: var(--text-on-accent);
}
```

> `click-animate.css` intentionally **does not define colors directly**.
> It only modulates brightness using tokens, ensuring compatibility with:
>
> - Glassmorphism
> - Dark mode
> - Theme switching
> - Brand reskins

---

## Accessibility

- Honors `prefers-reduced-motion`
- Focus-visible supported
- No reliance on opacity for state changes
- Motion removed cleanly without breaking layout

---

## Why this belongs in the template

- Single, reusable primitive
- Token-driven customization
- Zero JS dependency
- Works across frontend stacks
- Easy to document and enforce

This file is intended to be **foundational**, not decorative.

---

### Next logical hardening steps (optional)

- Add TypeScript enums for `Size` and `Variant`
- Add Stylelint rules enforcing transform-only motion
- Add snapshot tests for interaction states
- Document this in your design system site
