# FAQ

## Is this a component library?

No. It is a CSS interaction-state primitive. It does not render components, ship framework wrappers, or manage state.

## Which entry point should I use?

Use `interactive-surface-css/standalone-preset.css` for a complete neutral surface. Use `interactive-surface-css/state-core.css` when an application or design system already owns paint and geometry. Existing `interactive-surface-css` and `interactive-surface-css/interactive-surface.css` imports remain supported.

See the [installation guide](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Installation-and-Usage).

## Does it work with React, Vue, Svelte, or server rendering?

Yes. The package is framework-agnostic. Import the appropriate stylesheet through the toolchain and render semantic HTML.

## Does it define global design tokens?

No. Public values resolve through fallback chains on `.interactive-surface`; the package does not declare a global `:root` token layer.

## Can I use only the state behavior?

Yes. `state-core.css` intentionally omits standalone theme paint, component spacing, variants, levels, icon geometry, and layout recipes.

## Can I combine it with the other CSS libraries?

Yes. Use one library, use two compatible libraries, or use all three. UI Style Kit CSS owns paint, Layout Style CSS owns structure, and Interactive Surface CSS owns state behavior. See the [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/).

## Does CSS disable custom controls?

No. Native `disabled` is preferred because the browser suppresses activation. For `aria-disabled="true"` and `.is-disabled`, application code must suppress pointer, keyboard, and programmatic activation.

## Which persistent states are supported?

The state layer supports `.is-active`, `aria-pressed="true"`, `aria-pressed="mixed"`, any non-false `aria-current`, `aria-selected="true"`, `aria-busy="true"`, and `.is-loading`.

## Can application transforms coexist with interaction motion?

Yes. Interactive Surface uses the individual `translate` longhand for lift and preserves consumer-owned `transform`, `scale`, and `rotate`.

## What does `.icon-only` do?

In the standalone preset and compatibility bundle it supplies centered icon presentation and a 44 × 44px minimum target. A core-only consumer owns that geometry. Every icon-only control still needs an accessible name.

## Is 1.4.0 published?

The repository describes 1.4.0 as a release candidate until npm publication is explicitly approved and completed. Pinned CDN URLs are distribution checks, not proof of publication.

## What browsers are tested?

The focused rendered gate uses Chromium. The full gate covers Chromium, Firefox, and WebKit. See [Testing and Quality](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Testing-and-Quality).
