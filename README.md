# Interactive Surface CSS

[![npm version](https://img.shields.io/npm/v/interactive-surface-css.svg)](https://www.npmjs.com/package/interactive-surface-css)
[![license](https://img.shields.io/npm/l/interactive-surface-css.svg)](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/LICENSE)

Framework-agnostic CSS for reliable hover, focus, press, selected, current, loading, disabled, and motion affordances on interactive controls. Use it alone or as the interaction layer beside your existing layout and theme system.

Version 1.4.0 is a release candidate in this repository until its npm release is published. Existing 1.x imports, selectors, data hooks, ARIA hooks, and tokens remain supported.

The package targets Node.js 20+ for npm installs and local validation. CI proves the minimum Node 20 lane and the preferred Node 22 lane before release.

## Start here

- [Live standalone demo](https://foscat.github.io/Interactive-Surface-CSS/)
- [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/) — integrated proof with all three CSS libraries
- [GitHub Wiki](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Home)
- [Installation guide](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Installation-and-Usage)
- [API reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/API-Reference)
- [Token reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Token-Reference)
- [Accessibility guide](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Accessibility)

## Ownership

Each package remains independently useful. Use one library, use two compatible libraries, or use all three according to the layers your application needs.

| Library                   | Owns                                                                           | Does not own                        |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| `interactive-surface-css` | Interaction states, focus visibility, state precedence, and interaction motion | Page layout or an application theme |
| `ui-style-kit-css`        | Theme paint, modes, component appearance, and visual tokens                    | Page layout or interaction behavior |
| `layout-style-css`        | Page structure, layout recipes, and geometry                                   | Theme paint or interaction behavior |

## 60-second standalone setup

Install the package:

```bash
npm install interactive-surface-css
```

Import the portable, direct CSS preset. It includes the neutral standalone presentation and the complete state layer:

```js
import "interactive-surface-css/standalone-preset.css";
```

Add the base class to a native control:

```html
<button class="interactive-surface variant-primary" type="button">
  Save changes
</button>
```

For a no-build page, pin the release:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/interactive-surface-css@1.4.0/standalone-preset.css"
/>
```

The equivalent unpkg URL is `https://unpkg.com/interactive-surface-css@1.4.0/standalone-preset.css`. To follow future releases deliberately, use `https://cdn.jsdelivr.net/npm/interactive-surface-css@latest/standalone-preset.css` — unpinned opt-in.

## Semantic recipes

Prefer native elements, then reflect persistent application state through ARIA:

```html
<!-- Action -->
<button class="interactive-surface variant-primary" type="button">
  Publish
</button>

<!-- Toggle: update aria-pressed when the value changes -->
<button class="interactive-surface" type="button" aria-pressed="true">
  Pinned
</button>

<!-- Current navigation item: any non-false aria-current value is supported -->
<a class="interactive-surface" href="/account" aria-current="page">Account</a>

<!-- Selected item in a composite widget -->
<button class="interactive-surface" role="tab" aria-selected="true">
  Details
</button>

<!-- Loading: update the accessible label or nearby status text as needed -->
<button class="interactive-surface" type="button" aria-busy="true">
  Saving…
</button>

<!-- Prefer native disabled when the control cannot activate -->
<button class="interactive-surface" type="button" disabled>Unavailable</button>

<!-- Native file inputs opt in on the host; the selector button follows the same tokens -->
<input class="interactive-surface variant-subtle" type="file" />

<!-- Variant and level hooks are safe for renderers and companion bridges -->
<button
  class="interactive-surface"
  type="button"
  data-surface-variant="accent"
  data-surface-level="2"
>
  Continue
</button>

<!-- Icon-only controls need an accessible name; the icon itself is decorative -->
<button
  class="interactive-surface icon-only"
  type="button"
  aria-label="Open settings"
>
  <svg aria-hidden="true" data-icon-role="dark" viewBox="0 0 24 24">…</svg>
</button>
```

Native `disabled` is preferred because the browser suppresses focus and activation. CSS can only communicate disabled-looking state: consumers must suppress activation for `aria-disabled="true"` and `.is-disabled` controls in their event handling.

## Entry points

| Import                                                      | Presentation                                                                            | Best for                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `import "interactive-surface-css/standalone-preset.css";`   | State core plus neutral paint, variants, levels, icon sizing, and preset token defaults | New standalone integrations                                 |
| `import "interactive-surface-css/state-core.css";`          | Interaction mechanics and neutral core token fallbacks only                             | Existing design systems that already own paint and geometry |
| `import "interactive-surface-css/interactive-surface.css";` | Complete standalone compatibility bundle                                                | Existing direct-CSS 1.x consumers                           |
| `import "interactive-surface-css";`                         | JavaScript entry that imports the complete compatibility bundle                         | Existing bundlers configured for CSS imports                |

`standalone-preset.css` and `interactive-surface.css` are generated from the same authored modules and are behaviorally equivalent in 1.4.0. The compatibility paths remain stable; no 1.x migration is required.

The package `main` and `module` fields preserve the CommonJS and ESM entries; both load `interactive-surface.css`. The `style`, `unpkg`, and `jsdelivr` fields also resolve to that complete compatibility bundle.

## Compact API

| Kind              | Public hooks                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base              | `.interactive-surface`                                                                                                                                           |
| Size              | `.size-sm`, default medium, `.size-lg`                                                                                                                           |
| Transient         | pointer `:hover`, keyboard `:focus-visible`, `:active`                                                                                                           |
| Persistent        | `.is-active`, `aria-pressed="true"`, `aria-pressed="mixed"`, any non-false `aria-current`, `aria-selected="true"`                                                |
| Loading           | `aria-busy="true"`, `.is-loading`                                                                                                                                |
| Disabled          | native `:disabled`, `aria-disabled="true"`, `.is-disabled`                                                                                                       |
| Variant           | `.variant-primary`, `.variant-secondary`, `.variant-accent`, `.variant-subtle`, `.variant-warning`, `.variant-danger`, or matching `data-surface-variant` values |
| Level             | `data-surface-level="1"`, `"2"`, or `"3"`                                                                                                                   |
| Icon              | `.icon-only`; child `data-icon-role="light"`, `"dark"`, `"accessibility"`, or the legacy role classes                                                      |
| Native subcontrol | `input[type="file"].interactive-surface::file-selector-button` inherits surface paint and hover/active feedback                                                  |

Disabled state has highest visual precedence. The state layer preserves static meaning under reduced motion and uses system-color affordances in forced-colors mode. Interaction lift uses the individual `translate` property, so consumer-owned `transform`, `scale`, and `rotate` declarations can coexist.

For selector details and responsibilities, see the [complete API reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/API-Reference).

## Customize tokens

`state-core.css` provides neutral defaults for state-layer color and opacity, focus rings, motion, persistent states, disabled state, and loading state. `standalone-preset.css` additionally supplies base paint, lift and shadows, variants, surface levels, icon roles, and the 44 × 44px icon-control geometry.

```css
.save-action {
  --interactive-surface-focus-ring-color: rgb(0 95 115);
  --interactive-surface-state-layer-color: rgb(0 45 55);
  --interactive-surface-state-layer-hover-opacity: 0.1;
  --interactive-surface-motion-default: 120ms;
}
```

All public custom properties use the `--interactive-surface-*` namespace. Established legacy and semantic fallback tokens remain supported. See the [token ownership tables and full reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Token-Reference).

## Accessibility responsibilities

The CSS package provides visible keyboard focus, persistent-state treatment, disabled precedence, reduced-motion behavior, higher-contrast behavior, forced-colors affordances, hover gating for capable pointers, and standalone icon target sizing.

Applications still own semantics and behavior:

- Use `<button>` for actions and `<a href>` for navigation.
- Update `aria-pressed`, `aria-current`, `aria-selected`, and `aria-busy` when application state changes.
- Prefer native `disabled`. If a custom control uses `aria-disabled="true"` or `.is-disabled`, suppress pointer, keyboard, and programmatic activation.
- Give icon-only controls an accessible name, normally with `aria-label`, and hide decorative SVG content from assistive technology.
- Implement the keyboard model for composite widgets such as tabs; CSS does not add runtime behavior.

Read the [accessibility guide](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Accessibility) for complete examples.

## Pair with UI Style Kit CSS

When UI Style Kit owns visual paint, import its opt-in bridge and the state-only core:

```js
import "ui-style-kit-css/with-bridge.css";
import "interactive-surface-css/state-core.css";
```

The bridge maps active UI Style Kit theme and mode values into the `--interactive-surface-*` contract. Interactive Surface keeps ownership of focus, hover, pressed, selected, current, loading, disabled, and motion behavior.

## Use all three libraries

Use the established order so paint, interaction, and structure retain clear ownership:

```js
import "ui-style-kit-css/with-bridge.css";
import "interactive-surface-css/state-core.css";
import "layout-style-css/bridge.css";
import "layout-style-css";
```

The [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/) is the canonical integrated example. Each package remains optional: use one library, use two compatible libraries, or use all three.

## Support and project links

- Browser behavior: current Chromium, Firefox, and WebKit are covered by the full Playwright gate; forced-colors and platform-specific behavior are tested where supported.
- [Testing and quality guide](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Testing-and-Quality)
- [Changelog](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/CODE_OF_CONDUCT.md)
- [Security policy](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/SECURITY.md)
- [MIT License](https://github.com/Foscat/Interactive-Surface-CSS/blob/main/LICENSE)
