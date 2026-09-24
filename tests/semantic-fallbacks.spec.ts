import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

import { withFixtureCleanup } from "./fixtures/fixture-cleanup.mjs";
import { createPackedEcosystemFixture } from "./fixtures/packed-ecosystem";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const standalone = fs.readFileSync(
  path.join(packageRoot, "standalone-preset.css"),
  "utf8",
);
const stateCore = fs.readFileSync(
  path.join(packageRoot, "state-core.css"),
  "utf8",
);
const semanticTheme = `
  :root {
    --ui-color-surface: rgb(12 34 56);
    --ui-color-text: rgb(222 223 224);
    --ui-color-muted: rgb(101 102 103);
    --ui-color-primary: rgb(90 60 210);
    --ui-color-on-primary: rgb(250 250 251);
    --ui-color-border: rgb(44 55 66);
    --ui-radius-control: 17px;
    --ui-shadow-control: 0 5px 11px rgb(1 2 3 / 0.4);
    --ui-focus-color: rgb(255 0 128);
    --ui-motion-duration: 275ms;
    --ui-motion-easing: linear;
  }
`;

async function render(page: Page, styles: string[]) {
  await page.setContent(`
    ${styles.map((css) => `<style>${css}</style>`).join("\n")}
    <button id="base" class="interactive-surface">Base</button>
    <button id="primary" class="interactive-surface variant-primary">Primary</button>
    <button id="subtle" class="interactive-surface variant-subtle">Subtle</button>
    <button
      id="namespaced"
      class="interactive-surface"
      style="
        --interactive-surface-bg: rgb(1 11 21);
        --interactive-surface-fg: rgb(231 232 233);
        --interactive-surface-border-color: rgb(31 41 51);
        --interactive-surface-radius: 19px;
        --interactive-surface-shadow-base: 0 7px 13px rgb(2 3 4 / 0.5);
        --interactive-surface-focus-ring-color: rgb(0 255 170);
        --interactive-surface-motion-default: 325ms;
        --interactive-surface-ease-standard: ease-in;
      "
    >Namespaced</button>
    <button
      id="namespaced-primary"
      class="interactive-surface variant-primary"
      style="
        --interactive-surface-variant-primary-bg: rgb(71 72 73);
        --interactive-surface-variant-primary-fg: rgb(241 242 243);
        --interactive-surface-variant-primary-border-color: rgb(81 82 83);
      "
    >Namespaced primary</button>
  `);
}

async function snapshot(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const computed = window.getComputedStyle(element);

    return {
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      focusRing: computed.getPropertyValue("--_is-focus-ring-color").trim(),
      outlineColor: computed.outlineColor,
      transitionDuration: computed.transitionDuration,
      transitionTimingFunction: computed.transitionTimingFunction,
    };
  });
}

test("semantic tokens are optional and preserve the complete standalone baseline when absent", async ({
  page,
}) => {
  await render(page, [standalone]);

  expect(await snapshot(page, "#base")).toMatchObject({
    backgroundColor: "rgb(248, 250, 252)",
    borderColor: "rgba(15, 23, 42, 0.2)",
    borderRadius: "12px",
    color: "rgb(17, 24, 39)",
    transitionDuration: "0.14s",
    transitionTimingFunction: "cubic-bezier(0.2, 0, 0.2, 1)",
  });
  expect(await snapshot(page, "#primary")).toMatchObject({
    backgroundColor: "rgb(15, 79, 127)",
    borderColor: "rgb(15, 79, 127)",
    color: "rgb(244, 251, 255)",
  });
});

test("third-party semantic tokens supply complete standalone defaults", async ({
  page,
}) => {
  await render(page, [semanticTheme, standalone]);
  await page.keyboard.press("Tab");

  expect(await snapshot(page, "#base")).toMatchObject({
    backgroundColor: "rgb(12, 34, 56)",
    borderColor: "rgb(44, 55, 66)",
    borderRadius: "17px",
    boxShadow: "rgba(1, 2, 3, 0.4) 0px 5px 11px 0px",
    color: "rgb(222, 223, 224)",
    focusRing: "rgb(255 0 128)",
    transitionDuration: "0.275s",
    transitionTimingFunction: "linear",
  });
  expect(await snapshot(page, "#primary")).toMatchObject({
    backgroundColor: "rgb(90, 60, 210)",
    borderColor: "rgb(90, 60, 210)",
    color: "rgb(250, 250, 251)",
  });
  expect((await snapshot(page, "#subtle")).color).toBe("rgb(101, 102, 103)");
});

test("package-specific values remain above shared semantic values", async ({
  page,
}) => {
  await render(page, [semanticTheme, standalone]);
  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press("Tab");
  }

  expect(await snapshot(page, "#namespaced")).toMatchObject({
    backgroundColor: "rgb(1, 11, 21)",
    borderColor: "rgb(31, 41, 51)",
    borderRadius: "19px",
    boxShadow: "rgba(2, 3, 4, 0.5) 0px 7px 13px 0px",
    color: "rgb(231, 232, 233)",
    focusRing: "rgb(0 255 170)",
    transitionDuration: "0.325s",
    transitionTimingFunction: "ease-in",
  });
  expect(await snapshot(page, "#namespaced-primary")).toMatchObject({
    backgroundColor: "rgb(71, 72, 73)",
    borderColor: "rgb(81, 82, 83)",
    color: "rgb(241, 242, 243)",
  });
});

test("state core consumes semantic mechanics without taking consumer paint or geometry", async ({
  page,
}) => {
  await page.setContent(`
    <style>${semanticTheme}</style>
    <style>${stateCore}</style>
    <style>
      .consumer {
        border: 5px dashed rgb(11 22 33);
        border-radius: 23px;
        background: rgb(201 202 203);
        color: rgb(41 42 43);
      }
    </style>
    <button id="consumer" class="interactive-surface consumer">Consumer</button>
  `);
  await page.keyboard.press("Tab");

  expect(await snapshot(page, "#consumer")).toMatchObject({
    backgroundColor: "rgb(201, 202, 203)",
    borderColor: "rgb(11, 22, 33)",
    borderRadius: "23px",
    color: "rgb(41, 42, 43)",
    focusRing: "rgb(255 0 128)",
    transitionDuration: "0.275s",
    transitionTimingFunction: "linear",
  });
});

test("reduced motion and forced colors override shared semantic presentation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await render(page, [semanticTheme, standalone]);
  expect((await snapshot(page, "#base")).transitionDuration).toBe("0s");

  await page.emulateMedia({
    forcedColors: "active",
    reducedMotion: "no-preference",
  });
  await render(page, [semanticTheme, standalone]);
  await page.locator("#base").focus();
  const forced = await snapshot(page, "#base");
  expect(forced.boxShadow).toBe("none");
  expect(forced.focusRing).toBe("rgb(255 0 128)");
  expect(forced.outlineColor).not.toBe("rgb(255, 0, 128)");
});

test("packed UI producer themes standalone Interactive Surface through shared semantics", async ({
  page,
}) => {
  await withFixtureCleanup(
    createPackedEcosystemFixture({ includeUiStyleKit: true }),
    async (fixture) => {
      const visual = fixture.readCss("ui-style-kit-css/visual.css");
      const interactive = fixture.readCss(
        "interactive-surface-css/standalone-preset.css",
      );
      await page.setContent(`
        <style>${visual}</style>
        <style>${interactive}</style>
        <body data-ui="bento" data-theme="arctic-indigo" data-mode="dark">
          <button id="packed" class="interactive-surface variant-primary">Packed</button>
        </body>
      `);

      const values = await page.locator("#packed").evaluate((element) => {
        const computed = window.getComputedStyle(element);
        return {
          backgroundColor: computed.backgroundColor,
          borderRadius: computed.borderRadius,
          color: computed.color,
          semanticPrimary: computed
            .getPropertyValue("--ui-color-primary")
            .trim(),
          semanticRadius: computed
            .getPropertyValue("--ui-radius-control")
            .trim(),
        };
      });

      expect(values.semanticPrimary).not.toBe("");
      expect(values.semanticRadius).not.toBe("");
      expect(values.backgroundColor).not.toBe("rgb(15, 79, 127)");
      expect(values.borderRadius).toBe("16px");
      expect(values.color).not.toBe("rgb(244, 251, 255)");
    },
  );
});
