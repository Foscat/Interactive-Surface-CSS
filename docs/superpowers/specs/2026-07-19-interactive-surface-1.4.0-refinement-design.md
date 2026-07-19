# Interactive Surface CSS 1.4.0 Refinement Design

## Summary

Interactive Surface CSS 1.4.0 will become a more focused, composable interaction-state library without breaking any existing 1.x import path, selector, data hook, token, or JavaScript entry point. The release will add a state-only core, a complete standalone preset, and a generated legacy-compatible bundle. It will also reorganize the npm-facing README, turn the demo into a state-first interaction lab, and link prominently to the Interface Systems Lab as the canonical three-library integration proof.

The package will continue to work by itself. Pairing it with `ui-style-kit-css` or `layout-style-css` will remain optional.

## Goals

1. Preserve all existing 1.x imports, selectors, data attributes, ARIA hooks, tokens, and JavaScript entry points.
2. Add `interactive-surface-css/state-core.css` for interaction behavior without standalone theme or layout ownership.
3. Add `interactive-surface-css/standalone-preset.css` as the complete batteries-included standalone stylesheet.
4. Keep `interactive-surface-css/interactive-surface.css` and the package root import as backward-compatible complete bundles.
5. Make persistent, transient, disabled, focus, reduced-motion, and forced-colors states reliable and distinguishable.
6. Make host-element interaction motion composable with consumer and companion-library transforms.
7. Make the README an excellent npm landing page with durable links into the GitHub wiki.
8. Make the demo prove interaction behavior before exposing advanced token tooling.
9. Link prominently to `https://foscat.github.io/interface-systems-lab/` as the integrated three-library example.
10. Update every release-facing repository surface to version `1.4.0` without publishing or tagging the release.

## Non-Goals

- Removing or renaming any 1.x public API.
- Turning Interactive Surface CSS into a layout system or theme system.
- Recreating or embedding the Interface Systems Lab inside this repository.
- Adding JavaScript-controlled component behavior to the CSS package.
- Publishing to npm, creating a Git tag, or creating a GitHub Release during this work.
- Modifying the existing untracked `assets/` directory or `interactive-surface-css-1.3.0.tgz` archive.

## Ecosystem Ownership

The three libraries retain strict, independently useful boundaries:

| Library | Owns | Does not own |
| --- | --- | --- |
| `layout-style-css` | Page structure, layout recipes, and geometry | Theme paint or interaction state behavior |
| `ui-style-kit-css` | Themes, component paint, modes, and visual tokens | Page layout or state behavior |
| `interactive-surface-css` | Focus, hover, pressed, selected, current, loading, disabled, and motion affordances | Page layout or application theme systems |

The documentation will consistently explain how to use one library, any compatible pair, or all three. No package will be presented as a prerequisite for another.

## Public Entry-Point Contract

### New entry points

```js
import "interactive-surface-css/state-core.css";
```

`state-core.css` supplies state selectors, state-layer behavior, focus visibility, semantic-state handling, disabled-state precedence, motion preferences, forced-colors behavior, and the public interaction token contract. It does not supply a standalone visual theme, component spacing, or layout recipes.

The core may apply only the mechanical containment needed by its state layer, such as pseudo-element isolation and positioning context. It will not set consumer-facing dimensions, padding, grid or flex layout, border radius, surface color, or typography.

```js
import "interactive-surface-css/standalone-preset.css";
```

`standalone-preset.css` is a complete standalone bundle. It contains the state core plus the existing neutral base appearance, variants, surface levels, icon-control defaults, and fallback token values required for useful unthemed markup.

### Preserved entry points

The following existing imports remain supported:

```js
import "interactive-surface-css";
import "interactive-surface-css/interactive-surface.css";
```

Both continue to deliver the complete standalone experience. The package root JavaScript entry points, `style`, `unpkg`, and `jsdelivr` metadata continue to resolve to the legacy-compatible complete bundle.

### Compatibility bundle

`interactive-surface.css` will be generated from the same authored modules as `standalone-preset.css`. For 1.4.0 they will be behaviorally equivalent. Keeping both generated from one source prevents fixes from drifting while preserving the established filename and CDN URLs.

## Source And Build Architecture

Authored CSS will move into focused source modules:

- `styles/state-core.css` owns interaction selectors, state-layer mechanics, accessibility media queries, and interaction tokens.
- `styles/standalone-preset.css` owns neutral standalone paint, variant defaults, surface-level defaults, and icon-control presentation.

The build script will generate these publishable root files:

- `state-core.css`
- `standalone-preset.css`
- `interactive-surface.css`

It will also generate matching normal and minified artifacts under `dist/` for local verification. Root files remain the package's published CSS entry points so CDN and bundler paths stay simple.

Generated files will contain a concise professional header identifying their source modules and instructing maintainers not to edit them directly. The build will fail clearly if a source module is missing or CSS minification reports an error. A parity check will ensure committed root bundles match the authored modules before release validation succeeds.

## Interaction-State Contract

### Supported states

The core will support the existing selectors and add compatible semantic coverage for:

- Pointer hover when a hover-capable pointer is present.
- Keyboard `:focus-visible`.
- Transient `:active` press feedback.
- Existing `.is-active` state.
- Existing `aria-pressed="true"` and the valid mixed pressed state.
- Existing `aria-current="page"` plus other non-false `aria-current` values.
- `aria-selected="true"` for selectable composite widgets.
- `aria-busy="true"` and `.is-loading` for loading affordances.
- Native `:disabled`, existing `.is-disabled`, and existing `aria-disabled="true"`.

CSS communicates these states visually; it does not implement activation behavior. Documentation will state that native `disabled` is preferred and that applications must suppress activation for `aria-disabled` and `.is-disabled` controls.

### State precedence

Disabled state has highest precedence. A disabled surface must not retain hover, active, selected, current, pressed, loading-motion, or `.is-active` feedback. Persistent states remain distinguishable from the default state when enabled.

Focus visibility remains available on disabled-looking custom widgets when the widget can still receive focus, but focus styling must not imply activatability.

### Motion composition

The core will stop resetting consumer-owned `transform`, `scale`, and `rotate` properties. Interaction lift will use an isolated, token-driven individual translation with a neutral core default. The standalone preset and compatibility bundle may enable the familiar lift values, while consumers of the state core opt in through public motion tokens.

This preserves existing standalone behavior and allows transforms owned by an application, `layout-style-css`, or another animation layer to coexist on the host element.

### Reduced motion

`prefers-reduced-motion: reduce` will remove transitions and movement without removing state meaning. Focused, pressed, selected, current, active, disabled, and loading surfaces must retain static visual differentiation.

### Forced colors and contrast

Forced-colors mode will use system colors, borders, or outlines to preserve focus and persistent-state meaning instead of hiding the state layer without replacement. The release will also verify usable state distinction when users request greater contrast.

### Pointer and touch behavior

Hover styles remain limited to hover-capable pointers. Touch and coarse-pointer users receive press, focus, selected, current, loading, and disabled feedback without sticky hover assumptions. Icon-only targets retain the existing minimum target-size guarantee in the standalone preset and compatibility bundle; the state core will not claim responsibility for component geometry.

## Token Contract

All existing `--interactive-surface-*` tokens and documented fallback behavior remain valid. The refactor will group documentation by responsibility:

- State-layer color and opacity.
- Focus ring.
- Motion duration, easing, and lift.
- Persistent states.
- Disabled state.
- Loading state.
- Standalone base paint and variants.
- Surface levels and icon roles.

New tokens will use the existing namespace. Core tokens will have neutral fallbacks that do not impose a theme. Standalone-only tokens will live in the preset source. Token documentation will identify which entry point supplies each default.

## README And Wiki Design

### README information architecture

The README will be optimized for npm readers in this order:

1. Package identity, one-sentence value proposition, badges, and primary links.
2. Live standalone demo, GitHub wiki, API reference, accessibility guide, and Interface Systems Lab.
3. A concise ownership table explaining what the package owns and what the companion libraries own.
4. A 60-second install using the portable direct-CSS import first.
5. Minimal action, toggle, current-link, disabled, loading, selected, and icon-only examples.
6. An entry-point comparison covering state core, standalone preset, and compatibility imports.
7. A compact selector, data-hook, and semantic-state API table.
8. A small token customization example with a link to the complete token reference.
9. Accessibility guarantees and application responsibilities.
10. One canonical `ui-style-kit-css` bridge example and the recommended all-three import order.
11. Browser support, changelog, contribution, security, and license links.

Repository-relative wiki links will be replaced by durable absolute GitHub Wiki URLs so they work from npm. Repository files not shipped in the tarball will use absolute GitHub blob URLs. Contributor-only release instructions and extended bundler recipes will move out of the npm-critical path and into the wiki.

### Wiki corrections

The wiki will be aligned with actual package behavior and packaging:

- Remove the nonexistent `example.html` entry-point claim.
- Replace demo-only `.surface-card` examples with consumer-owned markup.
- Correct the distinction among `validate`, `validate:browsers`, and `validate:full`.
- Expand the API and token references to cover the complete 1.4.0 contract.
- Clarify disabled-state application responsibilities.
- Pin CDN examples to `1.4.0`, while documenting `@latest` as an explicit opt-in.
- Update roadmap and release documentation that still describes the package as unpublished.

## Demo Design

The demo remains a standalone proof that imports this package without requiring either companion library. Its hierarchy will become:

1. A concise hero explaining the interaction-state value proposition.
2. Primary links to installation, the wiki, and the Interface Systems Lab.
3. An ownership strip for layout, visual paint, and interaction state.
4. A state laboratory showing hover, keyboard focus, active press, pressed, current, selected, loading, disabled, variants, levels, and icon-only controls.
5. Keyboard and accessibility guidance tied to live examples.
6. Entry-point and ecosystem composition examples.
7. Advanced token editing, import, export, and README reference tools.

The Interface Systems Lab will be linked as the canonical integrated proof rather than duplicated or embedded. Demo-local CSS may style the documentation shell, but its copy will label that shell clearly as standalone demo presentation rather than part of the shipped state core.

The current monolithic HTML will be split into focused demo stylesheet and script assets when doing so preserves the exported `index.html` contract. Those assets will be included in the package allowlist and Pages deployment. The demo will not depend on the existing untracked `assets/` directory.

## Demo Interaction Reliability

The token editor dialog will trap focus, make background content inert while open, close on Escape, and restore focus to its trigger. Import, export, clipboard, validation, and download errors will be reported through the existing live-status pattern with actionable messages. File-input triggers will receive an explicit keyboard focus treatment.

All interactive examples must update meaningful local state or demonstrate native browser state. Decorative controls and inert demonstrations are out of scope.

## Package And Release Metadata

The release target is `1.4.0`. Implementation will update:

- `package.json` and `package-lock.json`.
- README CDN and installation examples.
- Demo version labels and copy.
- `CHANGELOG.md` with a complete 1.4.0 entry.
- Wiki installation, API, publishing, roadmap, and compatibility content.
- Package exports, allowlist, side-effect metadata, and generated artifacts.
- Any workflow, test, or documentation fixture that pins the package version.

The repository branch is `1.4.0`. Publishing, tagging, and GitHub Release creation remain separate irreversible actions requiring explicit approval after verification.

## Verification Strategy

### Contract tests

Tests will prove:

- Every 1.x import and export remains resolvable.
- New `state-core.css` and `standalone-preset.css` exports resolve from a packed tarball.
- Every documented public file exists in the packed package.
- Existing selectors, aliases, data hooks, and tokens remain present.
- Root generated bundles match their authored source modules.
- The state core does not introduce standalone layout or theme paint.

### Rendered state tests

Playwright coverage will verify:

- Hover only on hover-capable pointers.
- Keyboard focus visibility.
- Transient active press feedback.
- Pressed, mixed, current, selected, active, and loading states.
- Disabled precedence across native, ARIA, and class-based combinations.
- Static state distinction under reduced motion.
- System-color state distinction under forced colors.
- Consumer transform composition.
- Coarse-pointer and touch behavior.
- Icon-only target size in the preset and compatibility bundles.
- Compatibility with supported `ui-style-kit-css` modes and import orders.

### Demo tests

The demo will be checked at 1440, 1024, 390, and 320 CSS pixels, plus 200% zoom. Tests will cover keyboard-only navigation, sticky-anchor positioning, horizontal overflow, dialog focus containment and restoration, live-status errors, light and dark presentation, reduced motion, forced colors, and successful navigation to the Interface Systems Lab.

### Release gates

The final release gate will include formatting and diff checks, Stylelint, the no-hex-color guard, generated-bundle parity, package validation, packed-tarball inspection, Chromium coverage, the full supported browser suite when available, and an npm audit. Verification will report local results separately from publishing or live deployment status.

## Acceptance Criteria

1. Existing 1.x consumers can keep their current imports and selectors unchanged.
2. `state-core.css` provides interaction behavior without owning theme paint or page layout.
3. `standalone-preset.css` provides a complete standalone experience.
4. `interactive-surface.css` remains a complete backward-compatible bundle generated from the same sources.
5. Disabled states always override active and persistent states.
6. Reduced-motion and forced-colors users retain meaningful state differentiation.
7. Consumer transforms coexist with interaction feedback.
8. README links work from npm and guide users quickly from install to correct usage.
9. Wiki API, token, validation, packaging, and release guidance matches the shipped package.
10. The demo foregrounds state behavior and links prominently to the Interface Systems Lab.
11. Package, lockfile, changelog, docs, demo, exports, and fixtures consistently identify release `1.4.0`.
12. Existing untracked user files remain untouched.
13. No npm publish, tag, or GitHub Release occurs without later explicit approval.
