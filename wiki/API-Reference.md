# API Reference

Interactive Surface CSS 1.4.0 is a CSS state primitive. It exports stylesheets and compatibility JavaScript entries, but it does not ship state-management or component-runtime behavior.

## Entry points

| Package path                                      | Contract                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `interactive-surface-css/state-core.css`          | State selectors, focus, precedence, motion preferences, forced-colors behavior, and neutral interaction token fallbacks |
| `interactive-surface-css/standalone-preset.css`   | State core plus neutral paint, variants, levels, icon roles, target geometry, and preset defaults                       |
| `interactive-surface-css/interactive-surface.css` | Preserved complete 1.x compatibility bundle                                                                             |
| `interactive-surface-css`                         | Preserved JavaScript entry that imports the compatibility bundle                                                        |

The preset and compatibility stylesheet are generated from the same authored modules and are behaviorally equivalent in 1.4.0.

Package metadata keeps established resolution intact: `main` points to the CommonJS entry, `module` points to the ESM entry, and both load `interactive-surface.css`. The `style`, `unpkg`, and `jsdelivr` fields point directly to that complete compatibility bundle.

### Exact package resolution

The following table is contract-tested against `package.json`; it includes every public export and resolution field.

<!-- package-resolution-contract:start -->

| Manifest key | Exact value |
| --- | --- |
| `main` | `./index.cjs` |
| `module` | `./index.js` |
| `style` | `./interactive-surface.css` |
| `unpkg` | `./interactive-surface.css` |
| `jsdelivr` | `./interactive-surface.css` |
| `exports["."]` | `{"require":"./index.cjs","import":"./index.js","default":"./index.js","style":"./interactive-surface.css"}` |
| `exports["./interactive-surface.css"]` | `./interactive-surface.css` |
| `exports["./state-core.css"]` | `./state-core.css` |
| `exports["./standalone-preset.css"]` | `./standalone-preset.css` |
| `exports["./index.html"]` | `./index.html` |
| `exports["./index.cjs"]` | `./index.cjs` |
| `exports["./package.json"]` | `./package.json` |

<!-- package-resolution-contract:end -->

## Base selector

### `.interactive-surface`

Apply the base class to a native interactive host when possible.

The state core provides:

- state-layer containment
- pointer-capability-aware hover
- visible keyboard focus
- transient press feedback
- persistent-state feedback
- disabled-state precedence
- reduced-motion, higher-contrast, and forced-colors handling
- composable motion through the individual `translate` property

The standalone preset additionally provides neutral paint, borders, radii, variants, levels, icon sizing, and default lift and shadows.

### Native file inputs

Apply `.interactive-surface` to the file input host. The complete preset styles the browser's native `::file-selector-button` from the same background, foreground, border, motion, hover, active, disabled, and forced-colors contract. The public subcontrol selector is `input[type="file"].interactive-surface::file-selector-button`.

```html
<input class="interactive-surface variant-subtle" type="file" />
```

The selector button is not styled globally; this keeps unrelated file inputs under application or design-system ownership.

## Transient states

| Selector         | Meaning                                                        |
| ---------------- | -------------------------------------------------------------- |
| `:hover`         | Pointer hover, limited to hover-capable fine pointers          |
| `:focus-visible` | Keyboard-visible focus; `:focus` is the compatibility fallback |
| `:active`        | Transient native press while the control activates             |

Disabled state overrides every transient state.

## Persistent states

| Selector or hook                             | Meaning                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `.is-active`                                 | Established application-controlled active state                                                     |
| `aria-pressed="true"`                        | Pressed toggle                                                                                      |
| `aria-pressed="mixed"`                       | Indeterminate or mixed toggle                                                                       |
| `[aria-current]:not([aria-current="false"])` | Any valid non-false current value, including `page`, `step`, `location`, `date`, `time`, and `true` |
| `aria-selected="true"`                       | Selected item in a composite widget such as a tablist                                               |
| `aria-busy="true"`                           | Semantic busy or loading state                                                                      |
| `.is-loading`                                | Established class-based loading hook                                                                |

Applications must update these values. The package only styles the resulting state.

## Disabled states

| Selector or hook       | Behavior                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| `:disabled`            | Preferred native disabled state; the browser suppresses focus and activation |
| `aria-disabled="true"` | Visual disabled state for a custom control that may remain focusable         |
| `.is-disabled`         | Established class-based visual disabled state                                |

All three suppress pointer interaction in the stylesheet and override pressed, selected, current, busy, loading, active, hover, and motion feedback. Only native `disabled` suppresses all activation automatically. Consumers must suppress keyboard and programmatic activation when using `aria-disabled="true"` or `.is-disabled`.

Focusable ARIA- or class-disabled widgets retain a visible focus ring without receiving activatable state feedback.

## Size modifiers

- `.size-sm`: default lift with a compact shadow profile.
- Default medium: no size class required.
- `.size-lg`: stronger lift and shadow profile.

These modifiers supply preset motion values. They do not create layout containers.

## Variants

Class and data-hook variants are equivalent:

| Class                | Data hook                          |
| -------------------- | ---------------------------------- |
| `.variant-primary`   | `data-surface-variant="primary"`   |
| `.variant-secondary` | `data-surface-variant="secondary"` |
| `.variant-accent`    | `data-surface-variant="accent"`    |
| `.variant-subtle`    | `data-surface-variant="subtle"`    |
| `.variant-warning`   | `data-surface-variant="warning"`   |
| `.variant-danger`    | `data-surface-variant="danger"`    |

Variant paint defaults belong to the standalone preset. A state-core consumer may still use the hooks for bridge or application CSS.

## Surface levels

`data-surface-level="1|2|3"` expresses semantic depth.

- Level 1: quiet surface.
- Level 2: raised surface.
- Level 3: strongest preset depth.

The standalone preset supplies background, border, shadow, and state-opacity defaults. Bridges can override generic or per-level public tokens.

## Icon controls and roles

`.icon-only` identifies an icon-only control. In the standalone preset it supplies centered inline-flex presentation and a 44 × 44px minimum target. The state core intentionally does not own that geometry.

Icon children can use data hooks:

- `data-icon-role="light"`
- `data-icon-role="dark"`
- `data-icon-role="accessibility"`

The preserved class aliases are `.light-icon`, `.dark-icon`, and `.accessibility-icon`. Role color defaults belong to the preset.

An icon-only control still needs an accessible name:

```html
<button
  class="interactive-surface icon-only"
  type="button"
  aria-label="Open settings"
>
  <svg aria-hidden="true" data-icon-role="dark" viewBox="0 0 24 24">…</svg>
</button>
```

## Exported package paths

- `interactive-surface-css`
- `interactive-surface-css/interactive-surface.css`
- `interactive-surface-css/state-core.css`
- `interactive-surface-css/standalone-preset.css`
- `interactive-surface-css/index.html`
- `interactive-surface-css/index.cjs`
- `interactive-surface-css/package.json`

## Non-goals

The package does not provide component rendering, JavaScript state management, framework bindings, page-layout utilities, or a global application theme.
