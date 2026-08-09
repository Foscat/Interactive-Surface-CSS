# Token Reference

Interactive Surface CSS resolves public custom properties where `.interactive-surface` is used. It does not declare a global `:root` token set, so installing the package does not overwrite an application's global theme.

All preferred public properties use the `--interactive-surface-*` namespace. Existing 1.x legacy and semantic fallback names remain supported.

## Core defaults

`state-core.css` owns interaction mechanics and supplies neutral fallbacks that do not define a component theme.

### State layer

- `--interactive-surface-state-layer-color`
- `--interactive-surface-state-layer-opacity`
- `--interactive-surface-state-layer-hover-opacity`
- `--interactive-surface-state-layer-focus-opacity`
- `--interactive-surface-state-layer-active-opacity`

The UI Style Kit bridge aliases remain recognized:

- `--interactive-surface-state-layer-opacity-hover`
- `--interactive-surface-state-layer-opacity-focus`
- `--interactive-surface-state-layer-opacity-active`

### Focus

- `--interactive-surface-focus-ring-color`
- `--interactive-surface-focus-ring-width`
- `--interactive-surface-focus-ring-offset`

### Motion and depth

- `--interactive-surface-lift-base`
- `--interactive-surface-lift-hover`
- `--interactive-surface-lift-active`
- `--interactive-surface-shadow-base`
- `--interactive-surface-shadow-hover`
- `--interactive-surface-shadow-active`
- `--interactive-surface-motion-default`
- `--interactive-surface-motion-press`
- `--interactive-surface-ease-standard`
- `--interactive-surface-ease-press`

The core's lift fallbacks are neutral. The standalone preset opts into the established lift and shadow values.

### Interaction transition tuple

| Token                                       | Default or fallback chain                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--interactive-surface-transition-property` | `translate, box-shadow, outline-color`                                                                                          |
| `--interactive-surface-transition-duration` | Default motion; transient `:active` uses press motion. Both retain `--interactive-surface-motion-*` and `--motion-*` fallbacks. |
| `--interactive-surface-transition-easing`   | Standard easing; transient `:active` uses press easing. Both retain `--interactive-surface-ease-*` and `--ease-*` fallbacks.    |
| `--interactive-surface-transition-delay`    | `0s`                                                                                                                            |

Supplying a public duration or easing value overrides both the default and transient-press fallback. The core owns this mechanics tuple; companion theme packages do not need a transition override.

### Persistent-state emphasis

- `--interactive-surface-darken-hover`
- `--interactive-surface-darken-active`

These feed state-layer opacity fallback calculations. The state layer changes emphasis without applying a filter to consumer content.

### Disabled and touch

- `--interactive-surface-disabled-opacity`
- `--interactive-surface-tap-highlight-color`

Loading state uses the same state-layer and active-depth token contract. Consumers can scope overrides to `[aria-busy="true"]` or `.is-loading` when a distinct loading treatment is needed.

## Standalone preset defaults

`standalone-preset.css` adds paint, variant, level, icon-role, lift, shadow, and target-geometry defaults. `interactive-surface.css` contains the same defaults for compatibility.

### Base paint

- `--interactive-surface-bg`
- `--interactive-surface-fg`
- `--interactive-surface-border-color`
- `--interactive-surface-border-width`
- `--interactive-surface-radius`

### Variants

| Variant   | Background                                   | Foreground                                   | Border                                                 |
| --------- | -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Primary   | `--interactive-surface-variant-primary-bg`   | `--interactive-surface-variant-primary-fg`   | `--interactive-surface-variant-primary-border-color`   |
| Secondary | `--interactive-surface-variant-secondary-bg` | `--interactive-surface-variant-secondary-fg` | `--interactive-surface-variant-secondary-border-color` |
| Accent    | `--interactive-surface-variant-accent-bg`    | `--interactive-surface-variant-accent-fg`    | `--interactive-surface-variant-accent-border-color`    |
| Subtle    | `--interactive-surface-variant-subtle-bg`    | `--interactive-surface-variant-subtle-fg`    | `--interactive-surface-variant-subtle-border-color`    |
| Warning   | `--interactive-surface-variant-warning-bg`   | `--interactive-surface-variant-warning-fg`   | `--interactive-surface-variant-warning-border-color`   |
| Danger    | `--interactive-surface-variant-danger-bg`    | `--interactive-surface-variant-danger-fg`    | `--interactive-surface-variant-danger-border-color`    |

### Surface levels

Generic bridge-facing level tokens:

- `--interactive-surface-level-bg`
- `--interactive-surface-level-border-color`
- `--interactive-surface-level-shadow`

| Level | Paint and depth                                                                                                          | State opacity                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `--interactive-surface-level-1-bg`, `--interactive-surface-level-1-border-color`, `--interactive-surface-level-1-shadow` | `--interactive-surface-level-1-hover-opacity`, `--interactive-surface-level-1-focus-opacity`, `--interactive-surface-level-1-active-opacity` |
| 2     | `--interactive-surface-level-2-bg`, `--interactive-surface-level-2-border-color`, `--interactive-surface-level-2-shadow` | `--interactive-surface-level-2-hover-opacity`, `--interactive-surface-level-2-focus-opacity`, `--interactive-surface-level-2-active-opacity` |
| 3     | `--interactive-surface-level-3-bg`, `--interactive-surface-level-3-border-color`, `--interactive-surface-level-3-shadow` | `--interactive-surface-level-3-hover-opacity`, `--interactive-surface-level-3-focus-opacity`, `--interactive-surface-level-3-active-opacity` |

### Icon roles

- `--interactive-surface-light-icon-color`
- `--interactive-surface-light-icon-color-dark`
- `--interactive-surface-dark-icon-color`
- `--interactive-surface-dark-icon-color-dark`
- `--interactive-surface-accessibility-icon-color`
- `--interactive-surface-accessibility-icon-color-dark`

These values apply to the matching `data-icon-role` hooks and preserved icon-role classes inside `.icon-only`.

## Shared semantic fallbacks

A third-party theme or design system may provide these optional, package-neutral values. Interactive Surface resolves package-specific values first, shared semantic values second, and existing legacy values or literals last.

| Shared token            | Interactive Surface use                     |
| ----------------------- | ------------------------------------------- |
| `--ui-color-surface`    | Standalone base surface background          |
| `--ui-color-text`       | Standalone base foreground                  |
| `--ui-color-muted`      | Subtle-variant foreground                   |
| `--ui-color-primary`    | Primary-variant background and border       |
| `--ui-color-on-primary` | Primary-variant foreground                  |
| `--ui-color-border`     | Standalone base border                      |
| `--ui-radius-control`   | Standalone control radius                   |
| `--ui-shadow-control`   | Standalone base shadow                      |
| `--ui-focus-color`      | Focus-ring color                            |
| `--ui-motion-duration`  | Default interaction and transition duration |
| `--ui-motion-easing`    | Standard interaction and transition easing  |

These fallbacks are additive. Existing output is unchanged when they are absent, and a package-specific `--interactive-surface-*` override always wins. `state-core.css` consumes only the focus and default-motion semantic values; paint and component geometry remain consumer-owned in the state-only entry point.

## Existing fallback tokens

### Legacy interaction fallbacks

- `--lift-base`, `--lift-hover`, `--lift-active`
- `--shadow-base`, `--shadow-hover`, `--shadow-active`
- `--surface-darken-hover`, `--surface-darken-active`
- `--motion-default`, `--motion-press`
- `--ease-standard`, `--ease-press`

### Semantic paint fallbacks

- `--surface-bg`, `--bg-surface`
- `--surface-fg`, `--text-primary`
- `--surface-border`, `--border-color`
- `--focus-ring`

### Preserved icon fallbacks

- `--icon-light`, `--icon-light-dark`
- `--icon-dark`, `--icon-dark-dark`
- `--icon-accessibility`, `--icon-accessibility-dark`

### Preserved variant fallbacks

- `--variant-primary-bg`, `--variant-primary-fg`, `--variant-primary-border`
- `--variant-secondary-bg`, `--variant-secondary-fg`, `--variant-secondary-border`
- `--variant-accent-bg`, `--variant-accent-fg`, `--variant-accent-border`
- `--variant-subtle-bg`, `--variant-subtle-fg`, `--variant-subtle-border`
- `--variant-warning-bg`, `--variant-warning-fg`, `--variant-warning-border`
- `--variant-danger-bg`, `--variant-danger-fg`, `--variant-danger-border`

These non-namespaced families are compatibility-only. Prefer the namespaced properties in new code.

## Starter override

```css
.account-action {
  --interactive-surface-bg: rgb(245 250 252);
  --interactive-surface-fg: rgb(17 45 55);
  --interactive-surface-border-color: rgb(160 190 200);
  --interactive-surface-focus-ring-color: rgb(0 95 115);
  --interactive-surface-state-layer-color: rgb(0 45 55);
  --interactive-surface-state-layer-hover-opacity: 0.1;
  --interactive-surface-transition-property:
    translate, box-shadow, outline-color;
  --interactive-surface-transition-duration: 120ms;
  --interactive-surface-transition-easing: cubic-bezier(0.2, 0, 0.2, 1);
  --interactive-surface-transition-delay: 0ms;
}
```

Use functional color notation such as `rgb(0 95 115)` or `hsl(190deg 100% 23%)`. Avoid reducing focus-ring visibility or disabled distinction below practical usability.

## UI Style Kit theme bridge

`ui-style-kit-css/interactive-surface-theme.css` maps active theme and mode values into this public contract. Pair UI paint, the token-and-paint bridge, and the state-only entry:

```js
import "ui-style-kit-css/visual.css";
import "ui-style-kit-css/interactive-surface-theme.css";
import "interactive-surface-css/state-core.css";
```

UI Style Kit owns the mapped paint values. Interactive Surface owns state behavior and remains usable without the bridge. The stateful `ui-style-kit-css/with-bridge.css` path remains a deprecated migration-only compatibility export; new integrations should use the token-and-paint bridge above.

Third-party design systems that publish only the shared semantic contract can load their token stylesheet before `interactive-surface-css/standalone-preset.css`. UI Style Kit integrations should keep the canonical bridge imports when they need specialized variant, level, icon, and state-opacity mappings.
