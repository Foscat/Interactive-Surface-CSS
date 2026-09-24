# Installation and Usage

These instructions target the Interactive Surface CSS 1.7.0 release candidate. Existing 1.x imports remain supported.

The npm package targets Node.js 20+ for installation and local validation. CI also proves the preferred Node.js 22 release lane.

## Install from npm

```bash
npm install interactive-surface-css
```

## Choose an entry point

### Complete standalone preset

```js
import "interactive-surface-css/standalone-preset.css";
```

Use this for a new standalone integration. It includes state behavior, neutral paint, variants, levels, icon defaults, and component geometry.

### State-only core

```js
import "interactive-surface-css/state-core.css";
```

Use this when an application or design system already owns component paint and geometry.

### Preserved compatibility imports

```js
import "interactive-surface-css/interactive-surface.css";
import "interactive-surface-css";
```

Both preserve the complete 1.x experience. The package-root JavaScript import requires a bundler configured to consume CSS imports.

### CSS-level imports

```css
@import "interactive-surface-css/standalone-preset.css";
/* Or use state-core.css when your design system owns presentation. */
```

## CDN usage

Pin the release in reproducible pages:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/interactive-surface-css@1.7.0/standalone-preset.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/interactive-surface-css@1.7.0/standalone-preset.css"
/>
```

The `interactive-surface.css` compatibility path is also available from both CDNs. Use `https://cdn.jsdelivr.net/npm/interactive-surface-css@latest/standalone-preset.css` — unpinned opt-in — only when following future releases automatically is acceptable.

## Bundler configuration

Vite, Next.js, Parcel, and similar toolchains normally consume direct CSS imports without extra configuration. For Webpack, configure a CSS rule when the project does not already provide one:

```js
export default {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

The direct stylesheet entry points are the most portable option because they do not rely on the package-root JavaScript side effect.

## Common markup

```html
<button class="interactive-surface" type="button">Submit</button>

<button class="interactive-surface variant-accent size-lg" type="button">
  Continue
</button>

<button
  class="interactive-surface"
  type="button"
  data-surface-variant="accent"
  data-surface-level="2"
>
  Continue
</button>

<button class="interactive-surface icon-only" type="button" aria-label="Search">
  <svg aria-hidden="true" data-icon-role="dark" viewBox="0 0 24 24">…</svg>
</button>
```

The library does not require a card-specific class. Consumers own their markup and content layout; Interactive Surface owns the state behavior applied to the host.

## Use one, use two, or use all three

Use one library, use two compatible libraries, or use all three according to the ownership layers you need.

### Interactive Surface alone

```js
import "interactive-surface-css/standalone-preset.css";
```

### With UI Style Kit CSS

```js
import "ui-style-kit-css/visual.css";
import "ui-style-kit-css/interactive-surface-theme.css";
import "interactive-surface-css/state-core.css";
```

UI Style Kit owns paint and theme modes; Interactive Surface owns interaction states.

### With a third-party semantic theme

```js
import "third-party-theme/tokens.css";
import "interactive-surface-css/standalone-preset.css";
```

The third-party design system may provide the optional `--ui-*` semantic control tokens documented in the token reference. Resolution remains package-specific first, shared semantic second, and legacy fallback or literal last. Use `state-core.css` instead when that theme already paints and sizes the component itself.

### With all three libraries

```js
import "ui-style-kit-css/visual.css";
import "ui-style-kit-css/interactive-surface-theme.css";
import "interactive-surface-css/state-core.css";
import "layout-style-css";
```

Layout Style CSS owns structure and geometry. The [Interface Systems Lab](https://foscat.github.io/interface-systems-lab/) demonstrates the complete composition.

## State and activation responsibilities

CSS provides visible state but no runtime state machine. Applications must update `aria-pressed`, `aria-current`, `aria-selected`, and `aria-busy`. Prefer native `disabled`; consumers must suppress activation for `aria-disabled="true"` and `.is-disabled` controls.

For outcome feedback, apply `data-surface-feedback="error"`, `"success"`, or `"attention"` only after the application knows the result. Pair it with visible text or a live status region.

```js
const feedbackGenerations = new WeakMap();

function showSurfaceFeedback(control, outcome, visibleFor = 600) {
  const generation = (feedbackGenerations.get(control) ?? 0) + 1;
  feedbackGenerations.set(control, generation);
  control.removeAttribute("data-surface-feedback");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (feedbackGenerations.get(control) !== generation) return;

      control.setAttribute("data-surface-feedback", outcome);
      window.setTimeout(() => {
        if (
          feedbackGenerations.get(control) === generation &&
          control.getAttribute("data-surface-feedback") === outcome
        ) {
          control.removeAttribute("data-surface-feedback");
        }
      }, visibleFor);
    });
  });
}
```

```jsx
function SaveButton({ saveChanges }) {
  const [feedback, setFeedback] = React.useState();
  const [status, setStatus] = React.useState("");
  const clearTimer = React.useRef();

  React.useEffect(() => () => window.clearTimeout(clearTimer.current), []);

  async function save() {
    window.clearTimeout(clearTimer.current);
    setFeedback(undefined);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    let outcome;

    try {
      await saveChanges();
      outcome = "success";
      setStatus("Changes saved.");
    } catch {
      outcome = "error";
      setStatus("Changes could not be saved.");
    }

    setFeedback(outcome);
    clearTimer.current = window.setTimeout(
      () =>
        setFeedback((current) => (current === outcome ? undefined : current)),
      600,
    );
  }

  return (
    <>
      <button
        className="interactive-surface variant-primary"
        data-surface-feedback={feedback}
        onClick={save}
        type="button"
      >
        Save changes
      </button>
      <span role="status">{status}</span>
    </>
  );
}
```

Interaction lift uses the individual `translate` property and composes with consumer-owned `transform`, `scale`, and `rotate`.

## Next references

- [API Reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/API-Reference)
- [Token Reference](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Token-Reference)
- [Accessibility](https://github.com/Foscat/Interactive-Surface-CSS/wiki/Accessibility)
