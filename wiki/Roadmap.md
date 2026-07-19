# Roadmap

Interactive Surface CSS 1.4.0 is a release candidate. The work in this branch focuses the package on a durable interaction-state contract without expanding into layout or theme ownership.

## 1.4.0 release candidate

- Preserve every existing 1.x import, selector, hook, and token fallback.
- Add `state-core.css` for design-system integrations.
- Add `standalone-preset.css` for complete standalone use.
- Generate the compatibility bundle from the same authored modules.
- Cover pressed mixed, non-false current, selected, busy, loading, and disabled precedence.
- Preserve state meaning under reduced motion, higher contrast, and forced colors.
- Compose interaction `translate` with consumer `transform`, `scale`, and `rotate`.
- Turn the demo into a state-first interaction lab.
- Publish an npm-first README and aligned wiki.
- Lock the package, audit, Chromium, and full-browser release gates.

Publication, tagging, and a GitHub Release remain separate approval-gated steps.

## After 1.4.0

Potential follow-up work must be driven by demonstrated consumer need:

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
