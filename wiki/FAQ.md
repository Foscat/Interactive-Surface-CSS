# FAQ

## Is this a component library?

No. It is a CSS interaction primitive.

It gives you consistent surface behavior, but it does not ship prebuilt UI components, framework wrappers, or runtime logic.

## Does it work with React, Vue, or Svelte?

Yes. The package is framework-agnostic and can be imported into any stack that can consume CSS.

## Does it define global design tokens?

No. The stylesheet does not declare global `:root` tokens. It resolves values inline through fallback chains instead.

## Do the variant classes create full themes?

No. The variant classes primarily tune brightness behavior. They are designed to sit on top of your own color tokens.

## Is there a safe way to customize tokens without manual copy/paste errors?

Yes. Use the package demo app at `index.html`.

It includes token editing controls and CSS import/export helpers so you can generate a token stylesheet without hand-editing every variable.

## Can I use it on cards as well as buttons?

Yes. That is one of the intended use cases.

The primitive is meant to work across buttons, cards, icon controls, toggles, and similar interactive surfaces.

## Does it handle custom JavaScript interactions?

No. It only handles styling. State semantics such as toggling `aria-pressed`, keyboard behavior for non-semantic elements, and application logic remain your responsibility.

## What does `icon-only` do?

It adjusts the primitive for compact icon controls and enforces a minimum 44px hit target.

## Why does the package warn against extra transforms on the same element?

Because the primitive owns motion on the host node. Additional transforms on the same element can conflict with built-in hover and press behavior.

## What browsers are tested?

The repository includes Playwright coverage for Chromium, Firefox, and WebKit.
