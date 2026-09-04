# Interactive Surface CSS

Interactive Surface CSS is a framework-agnostic interaction-state layer for buttons, links, toggles, tabs, cards, icon controls, and similar interactive hosts. It provides consistent focus, hover, press, current, selected, loading, disabled, outcome feedback, reduced-motion, and forced-colors treatment without requiring a component runtime.

Version 1.7.0 is a release candidate until it is published. It preserves every established 1.x import and selector while adding CSS-only `data-surface-feedback="error|success|attention"` outcomes to the focused `state-core.css` and complete `standalone-preset.css` entry points.

## Choose the layer you need

| Library                   | Responsibility                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ |
| `interactive-surface-css` | Interaction states, focus visibility, state precedence, and interaction motion |
| `ui-style-kit-css`        | Theme paint, modes, component appearance, and visual tokens                    |
| `layout-style-css`        | Page structure, layout recipes, and geometry                                   |

Use one library, use two compatible libraries, or use all three. None of the packages is a prerequisite for another.

## 1.7.0 entry points

- `interactive-surface-css/standalone-preset.css`: complete state behavior plus neutral standalone paint and geometry.
- `interactive-surface-css/state-core.css`: state behavior and the public interaction token contract without theme paint or consumer-facing layout.
- `interactive-surface-css/interactive-surface.css`: preserved complete 1.x compatibility stylesheet.
- `interactive-surface-css`: preserved JavaScript entry that imports the compatibility stylesheet.

## Quick start

```bash
npm install interactive-surface-css
```

```js
import "interactive-surface-css/standalone-preset.css";
```

```html
<button class="interactive-surface variant-primary" type="button">Save</button>
```

## Live references

- [Standalone state lab](https://foscat.github.io/Interactive-Surface-CSS/)
- [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/) — the canonical integration with all three libraries
- [npm package](https://www.npmjs.com/package/interactive-surface-css)
- [GitHub repository](https://github.com/Foscat/Interactive-Surface-CSS)

## Documentation map

- [Getting Started](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Getting-Started)
- [Installation and Usage](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Installation-and-Usage)
- [API Reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/API-Reference)
- [Token Reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Token-Reference)
- [Accessibility](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Accessibility)
- [Testing and Quality](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Testing-and-Quality)
- [Publishing and Releases](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Publishing-and-Releases)
- [Contributing](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Contributing)
- [FAQ](https://github.com/Foscat/Interactive-Surface-CSS/wiki/FAQ)
- [Roadmap](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Roadmap)

## Scope

The package styles state. It does not render components, manage application state, create page layouts, or supply an application-wide theme. Applications remain responsible for semantic HTML, state updates, keyboard behavior, and suppressing activation on custom disabled controls.
