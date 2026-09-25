# Roadmap

Interactive Surface CSS 1.7.1 is a release candidate. This patch preserves consumer-owned positioned-control topology without expanding into layout, theme, tooltip, or runtime ownership.

## 1.7.1 release candidate

- Preserve every existing 1.x import, selector, hook, token fallback, and complete or companion stylesheet entry point.
- Preserve the 1.7.0 semantic feedback hooks, tokens, precedence, and preference behavior.
- Keep the internal state layer anchored while allowing consumer absolute, fixed, and sticky positioning to win regardless of stylesheet order.
- Cover positioned icon controls, nested surfaces, bounded internal scrolling, and narrow document-overflow containment in real browsers.
- Keep UI Style Kit optional and preserve standalone package behavior.
- Align generated artifacts, package metadata, README, wiki, changelog, and release assertions.
- Lock the package, audit, Chromium, and full-browser release gates.

Publication, tagging, and a GitHub Release remain separate approval-gated steps.

## Completed history

- 1.6.0 added optional shared semantic fallbacks for standalone paint, control geometry, focus, and default motion.
- 1.7.0 added CSS-only semantic outcome feedback, complete precedence coverage, and composable interaction motion.

## After 1.7.1

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
