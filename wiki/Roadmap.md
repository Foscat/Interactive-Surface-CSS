# Roadmap

Interactive Surface CSS 1.7.0 is a release candidate. The work in this branch adds CSS-only semantic feedback outcomes without expanding into layout, theme, tooltip, or runtime ownership.

## 1.7.0 release candidate

- Preserve every existing 1.x import, selector, hook, token fallback, and complete or companion stylesheet entry point.
- Add `data-surface-feedback="error"`, `"success"`, and `"attention"` as application-controlled outcome hooks.
- Expose duration, easing, distance, layer-opacity, and outcome-color feedback tokens from `state-core.css`.
- Enforce disabled, busy/loading, feedback, transient active, persistent, hover, and base precedence while keeping focus-visible orthogonal.
- Preserve feedback meaning under reduced motion, higher contrast, and forced colors.
- Compose interaction `translate` with consumer `transform`, `scale`, and `rotate`.
- Keep UI Style Kit optional and preserve standalone package behavior.
- Align generated artifacts, package metadata, README, wiki, changelog, and release assertions.
- Lock the package, audit, Chromium, and full-browser release gates.

Publication, tagging, and a GitHub Release remain separate approval-gated steps.

## Completed history

- 1.6.0 added optional shared semantic fallbacks for standalone paint, control geometry, focus, and default motion.

## After 1.7.0

Potential follow-up work must be driven by demonstrated consumer need:

- decide whether tooltip feedback should be attribute-triggered, ARIA-owned, or companion-owned
- decide whether tooltip motion needs a dedicated reduced-motion static state
- decide which package owns tooltip geometry before adding any selector
- add targeted visual-regression baselines if state combinations become difficult to review
- expand framework examples without shipping framework wrappers
- add migration notes only when token evolution requires them
- add state recipes for new semantic platform behavior when browsers expose stable primitives

## Permanent guardrails

The package should remain:

- small and framework-agnostic
- compatible with plain HTML and existing design systems
- accessibility-forward
- token-driven
- independently useful
- complementary to `ui-style-kit-css` and `layout-style-css`
- focused on interaction states rather than page layout or application theming

The [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/) remains the canonical proof of the three-library composition.
