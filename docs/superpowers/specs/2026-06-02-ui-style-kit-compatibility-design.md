# UI Style Kit Compatibility Design

## Goal

Refine `interactive-surface-css` so it remains fully standalone while working cleanly and complementarily with `ui-style-kit-css@1.2.1` in both supported import orders.

## Compatibility Contract

`interactive-surface-css` owns interaction behavior on `.interactive-surface`: hover, focus-visible, active, pressed, disabled, reduced-motion, target sizing, and host transform ownership.

`ui-style-kit-css` owns theme identity: active `data-ui`, `data-theme`, and `data-mode` token values, visual palettes, native HTML element defaults, and style-system-specific surface tokens.

The libraries must work separately. When used together, UI Style Kit may provide theme tokens through its bundled or per-style bridge, but `.interactive-surface` must continue to resolve those tokens through its own public token contract and state model.

## Supported Import Orders

The compatibility work must support the combined UI Style Kit build before Interactive Surface:

```js
import "ui-style-kit-css/dist/ui-style-kit.css";
import "interactive-surface-css/interactive-surface.css";
```

It must also support Interactive Surface before a per-style UI Style Kit file plus the bridge:

```js
import "interactive-surface-css/interactive-surface.css";
import "ui-style-kit-css/styles/minimal-saas.css";
import "ui-style-kit-css/interactive-surface-bridge";
```

These two orders reflect the current README guidance from both packages.

## Implementation Scope

Keep changes focused on cascade hardening. Do not move UI Style Kit token mappings into this package, do not add runtime JavaScript, and do not introduce a production dependency on `ui-style-kit-css`.

The expected production changes are limited to `interactive-surface.css` and documentation. Add test-only dependency or fixture support as needed so compatibility tests run against the actual `ui-style-kit-css@1.2.1` CSS.

## Cascade Risks

`ui-style-kit-css@1.2.1` styles native buttons under selectors such as `[data-ui="minimal-saas"] :where(button, input[type="button"], input[type="submit"], input[type="reset"])`. Those selectors can set background, foreground, border, radius, font weight, hover colors, disabled opacity, focus outline, and reduced-motion transition behavior.

`.interactive-surface` has higher class specificity for many properties, but import order and broad native selectors can still create regressions where the class no longer feels like the owner of the interactive primitive. The hardening should target only these direct conflict points.

## Test Coverage

Add Playwright compatibility coverage using the real `ui-style-kit-css@1.2.1` CSS.

The tests must cover:

- combined UI Style Kit build before Interactive Surface
- Interactive Surface before per-style CSS plus bridge
- representative systems: `minimal-saas`, `cyberpunk`, `brutalism`, and `retro-glass`
- representative modes: `light`, `dark`, and `contrast`
- base surface token adoption
- variant token adoption
- icon-only sizing and icon role colors
- focus-visible ownership
- hover/active transform and state behavior
- disabled ownership
- reduced-motion behavior

## Documentation

Update README and wiki usage guidance so both import orders are described as valid. The docs should make the separation clear: UI Style Kit supplies style-system tokens and Interactive Surface supplies interaction behavior.

## Out Of Scope

This work does not redesign the demo page, add UI Style Kit components, publish a release, or change the public class API.
