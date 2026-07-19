import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

const bundles = {
  core: fs.readFileSync(path.join(packageRoot, "state-core.css"), "utf8"),
  preset: fs.readFileSync(path.join(packageRoot, "standalone-preset.css"), "utf8"),
  compatibility: fs.readFileSync(path.join(packageRoot, "interactive-surface.css"), "utf8")
} as const;

function entryPointHtml(css: string) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      .consumer-owned {
        display: grid;
        padding: 13px;
        border: 5px dashed rgb(11 22 33);
        border-radius: 23px;
        background: rgb(201 202 203);
        color: rgb(41 42 43);
        font: 700 19px/1.3 Georgia, serif;
      }
    </style>
    <style>${css}</style>
  </head>
  <body>
    <button id="consumer" class="interactive-surface consumer-owned">Consumer owned</button>
    <button id="default" class="interactive-surface">Default</button>
    <button id="variant" class="interactive-surface variant-primary">Variant</button>
    <button id="level" class="interactive-surface" data-surface-level="2">Level</button>
    <button id="icon" class="interactive-surface icon-only" aria-label="Icon">I</button>
    <button id="hover-motion" class="interactive-surface">Hover motion</button>
    <button id="persistent-motion" class="interactive-surface" aria-selected="true">Selected</button>
  </body>
</html>`;
}

async function standaloneSnapshot(page: Page, css: string) {
  await page.setContent(entryPointHtml(css));

  return page.evaluate(() => {
    const selectors = ["#default", "#variant", "#level", "#icon"];

    return Object.fromEntries(
      selectors.map((selector) => {
        const styles = window.getComputedStyle(document.querySelector(selector) as HTMLElement);

        return [
          selector,
          {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            borderRadius: styles.borderRadius,
            borderWidth: styles.borderWidth,
            boxShadow: styles.boxShadow,
            color: styles.color,
            display: styles.display,
            minHeight: styles.minHeight,
            minWidth: styles.minWidth,
            padding: styles.padding
          }
        ];
      })
    );
  });
}

async function translateY(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const value = window.getComputedStyle(element).getPropertyValue("translate");

    if (value === "none") {
      return 0;
    }

    const coordinates = value.trim().split(/\s+/);
    return Number.parseFloat(coordinates[1] ?? "0");
  });
}

test.describe("public stylesheet entry points", () => {
  test("state core preserves consumer-owned paint, geometry, typography, and display", async ({ page }) => {
    await page.setContent(entryPointHtml(bundles.core));

    const styles = await page.locator("#consumer").evaluate((element) => {
      const computed = window.getComputedStyle(element);

      return {
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        borderRadius: computed.borderRadius,
        borderStyle: computed.borderStyle,
        borderWidth: computed.borderWidth,
        display: computed.display,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        padding: computed.padding
      };
    });

    expect(styles).toEqual({
      backgroundColor: "rgb(201, 202, 203)",
      borderColor: "rgb(11, 22, 33)",
      borderRadius: "23px",
      borderStyle: "dashed",
      borderWidth: "5px",
      display: "grid",
      fontFamily: "Georgia, serif",
      fontSize: "19px",
      fontWeight: "700",
      padding: "13px"
    });
  });

  test("preset and compatibility bundles render equivalent complete defaults", async ({ page }) => {
    const preset = await standaloneSnapshot(page, bundles.preset);
    const compatibility = await standaloneSnapshot(page, bundles.compatibility);

    expect(compatibility).toEqual(preset);
    expect(preset["#default"].backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(preset["#variant"].backgroundColor).not.toBe(preset["#default"].backgroundColor);
    expect(preset["#level"].boxShadow).not.toBe("none");
    expect(preset["#icon"].display).toBe("inline-flex");
    expect(preset["#icon"].minWidth).toBe("44px");
    expect(preset["#icon"].minHeight).toBe("44px");
  });

  for (const entryPoint of ["preset", "compatibility"] as const) {
    test(`${entryPoint} bundle retains familiar hover and persistent lift`, async ({ page }) => {
      await page.setContent(entryPointHtml(bundles[entryPoint]));
      await page.locator("#hover-motion").hover();

      await expect.poll(() => translateY(page, "#hover-motion")).toBe(-4);
      await expect.poll(() => translateY(page, "#persistent-motion")).toBe(-2);
    });
  }
});
