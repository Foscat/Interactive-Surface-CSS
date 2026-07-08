# Interactive Surface Data Hooks Follow-Up

## Summary

This follow-up implements the `interactive-surface-css` portion of the three-library ecosystem plan. The package remains an interaction primitive, while adding data-attribute hooks that can be assigned by apps, renderers, or companion CSS libraries without requiring style-specific class names.

## Public API

- Existing class variants remain supported:
  - `.variant-primary`
  - `.variant-secondary`
  - `.variant-accent`
  - `.variant-subtle`
  - `.variant-warning`
  - `.variant-danger`
- New equivalent data variant hook:
  - `data-surface-variant="primary|secondary|accent|subtle|warning|danger"`
- Existing `data-surface-level` support now has standalone defaults for:
  - `data-surface-level="1"`
  - `data-surface-level="2"`
  - `data-surface-level="3"`

## Ownership Boundaries

- `layout-style-css` owns structure and layout recipes.
- `ui-style-kit-css` owns visual theme identity, color roles, and style systems.
- `interactive-surface-css` owns hover, focus, active, selected, pressed, disabled, reduced-motion, and forced-colors behavior on `.interactive-surface`.

Interactive Surface does not define global theme tokens and does not depend on either companion package.

## Verification Targets

- Data variant styles match the existing class variant styles.
- Surface levels have distinct standalone depth defaults.
- UI Style Kit bridge imports can continue to provide stronger token values through the public `--interactive-surface-*` contract.
- Existing accessibility behavior remains unchanged for focus, pressed, disabled, reduced motion, high contrast, and forced colors.
