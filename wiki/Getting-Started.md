# Getting Started

This is the shortest reliable path to the Interactive Surface CSS 1.4.0 release candidate.

## Install

```bash
npm install interactive-surface-css
```

## Import the standalone preset

```js
import "interactive-surface-css/standalone-preset.css";
```

The preset combines the interaction state core with neutral paint, variants, surface levels, icon roles, and useful standalone geometry.

## Add a native control

```html
<button class="interactive-surface variant-primary" type="button">
  Save changes
</button>
```

Use `<button>` for actions and `<a href>` for navigation. Native elements already provide keyboard and activation behavior that CSS cannot create.

## Add persistent state

```html
<button class="interactive-surface" type="button" aria-pressed="true">
  Pinned
</button>

<a class="interactive-surface" href="/account" aria-current="page">Account</a>

<button class="interactive-surface" role="tab" aria-selected="true">
  Details
</button>

<button class="interactive-surface" type="button" aria-busy="true">
  Saving…
</button>
```

Update the ARIA value whenever application state changes. For an indeterminate toggle, `aria-pressed="mixed"` is also supported.

## Disable controls correctly

```html
<button class="interactive-surface" type="button" disabled>Unavailable</button>
```

Native `disabled` is preferred. If a custom widget must remain focusable and uses `aria-disabled="true"` or `.is-disabled`, application code must suppress pointer, keyboard, and programmatic activation.

## No-build setup

Pin the release candidate version:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/interactive-surface-css@1.4.0/standalone-preset.css"
/>
```

The unpkg equivalent is `https://unpkg.com/interactive-surface-css@1.4.0/standalone-preset.css`. Use `https://cdn.jsdelivr.net/npm/interactive-surface-css@latest/standalone-preset.css` — unpinned opt-in — only when automatically following future releases is intentional.

## Already have a design system?

Import only the interaction layer:

```js
import "interactive-surface-css/state-core.css";
```

The core does not provide standalone colors, borders, spacing, radii, variants, level paint, or icon geometry. Supply those through your own CSS or a companion bridge.

## See it working

- [Standalone state lab](https://foscat.github.io/Interactive-Surface-CSS/)
- [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/)
- [Complete installation options](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Installation-and-Usage)
- [Semantic API](https://github.com/Foscat/Interactive-Surface-CSS/wiki/API-Reference)
- [Accessibility responsibilities](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Accessibility)
