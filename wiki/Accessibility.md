# Accessibility

Interactive Surface CSS supplies visible state affordances. Applications remain responsible for semantics, activation behavior, state updates, accessible names, and composite-widget keyboard models.

## Prefer native elements

Use `<button>` for actions and `<a href>` for navigation. Native elements bring keyboard and activation behavior that CSS cannot add to a generic element.

## Focus visibility

The package uses an outline-based `:focus` fallback and limits the modern treatment to `:focus-visible` where supported. The `:focus-visible` ring is orthogonal to interaction paint and mechanics, so it stays visible without replacing hover, pressed, selected, current, busy, or loading feedback. Relevant tokens are:

- `--interactive-surface-focus-ring-color`
- `--interactive-surface-focus-ring-width`
- `--interactive-surface-focus-ring-offset`

Custom disabled widgets that remain in the Tab order keep a visible focus ring. Focus does not restore active, pressed, selected, current, or loading feedback to a disabled-looking control.

## Semantic states

```html
<button class="interactive-surface" type="button" aria-pressed="true">
  Pinned
</button>
<button class="interactive-surface" type="button" aria-pressed="mixed">
  Partly selected
</button>
<a class="interactive-surface" href="/account" aria-current="page">Account</a>
<button class="interactive-surface" role="tab" aria-selected="true">
  Details
</button>
<button class="interactive-surface" type="button" aria-busy="true">
  Saving…
</button>
```

Any non-false `aria-current` value receives current-state styling. `aria-selected` is intended for selectable composite widgets, while `aria-pressed` is intended for toggle buttons. `aria-busy` and `.is-loading` communicate the library's visual loading state.

Applications must update each ARIA value when state changes and provide accessible status text where a loading label alone is insufficient.

## Disabled controls

Native `disabled` is preferred because the browser suppresses focus and activation.

```html
<button class="interactive-surface" type="button" disabled>Unavailable</button>
```

`aria-disabled="true"` and `.is-disabled` provide visual state for custom situations, but CSS cannot cancel keyboard handlers or programmatic calls. Consumers must suppress activation for those controls:

```js
function activateControl(event) {
  const control = event.currentTarget;
  const isDisabled =
    control.matches(".is-disabled") ||
    control.getAttribute("aria-disabled") === "true";

  if (isDisabled) {
    event.preventDefault();
    return;
  }

  // Perform the application action only for an enabled control.
}
```

Disabled > busy/loading > transient `:active` > pressed/selected/current > `:hover` > base. This order prevents hover from erasing persistent meaning, prevents a transient press from erasing busy feedback, and makes every disabled form authoritative.

## Reduced motion

Under `prefers-reduced-motion: reduce`, transitions and movement stop, but state-layer opacity, outlines, and static shadows continue to distinguish meaningful pressed, selected, current, busy, and loading state. Reduced motion never removes state meaning.

## Higher contrast

Under `prefers-contrast: more`, the focus ring becomes wider and persistent states receive an explicit current-color outline. The package does not rely on brightness alone.

## Forced colors

Under `forced-colors: active`, the state layer is replaced with system-color outlines:

- `Highlight` for focus
- `ButtonText` for enabled persistent, busy, and loading state
- `GrayText` for disabled state

The standalone preset additionally uses `ButtonFace`, `ButtonText`, and `GrayText` for component paint.

## Pointer and touch behavior

Hover feedback is gated to hover-capable fine pointers. Touch and coarse-pointer users still receive press, focus, selected, current, loading, and disabled feedback without sticky-hover assumptions.

## Icon-only controls

The standalone preset and compatibility bundle give `.icon-only` a 44 × 44px minimum target. The state core does not own geometry, so core-only consumers must provide an adequate target size.

Every icon-only control needs an accessible name, and decorative SVG content should be hidden:

```html
<button
  class="interactive-surface icon-only"
  type="button"
  aria-label="Open settings"
>
  <svg aria-hidden="true" data-icon-role="dark" viewBox="0 0 24 24">…</svg>
</button>
```

## Scope boundary

The package does not create semantics, live announcements, keyboard navigation, focus management, or application state. It gives those states a consistent visual surface once the application expresses them correctly.
