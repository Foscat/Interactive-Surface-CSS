import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const cssPath = path.join(packageRoot, "interactive-surface.css");
const css = fs.readFileSync(cssPath, "utf8");

const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      :root {
        --bg-surface: rgb(248, 250, 252);
        --text-primary: rgb(17, 24, 39);
        --focus-ring: rgb(11, 99, 246);
      }

      body {
        margin: 0;
        padding: 24px;
      }
    </style>
    <style>${css}</style>
  </head>
  <body>
    <button id="target" class="interactive-surface">Target</button>
    <button id="pressed" class="interactive-surface" aria-pressed="true">Pressed</button>
    <button id="disabled" class="interactive-surface" aria-disabled="true">Disabled</button>
    <button id="icon" class="interactive-surface icon-only" aria-label="Icon">+</button>
  </body>
</html>
`;

test.describe("interactive surface package behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(html);
  });

  test("renders standalone fallback styles", async ({ page }) => {
    const styles = await page.locator("#target").evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        background: computed.backgroundColor,
        borderWidth: computed.borderWidth,
        color: computed.color
      };
    });

    expect(styles.background).toBe("rgb(248, 250, 252)");
    expect(styles.borderWidth).toBe("1px");
    expect(styles.color).toBe("rgb(17, 24, 39)");
  });

  test("focus ring is visible for keyboard users", async ({ page }) => {
    await page.keyboard.press("Tab");
    const target = page.locator("#target");
    await expect(target).toBeFocused();

    const focusStyles = await target.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth
      };
    });

    expect(focusStyles.outlineStyle).toBe("solid");
    expect(focusStyles.outlineWidth).toBe("2px");
  });

  test("aria-pressed is styled as active", async ({ page }) => {
    const pressedBoxShadow = await page
      .locator("#pressed")
      .evaluate((el) => window.getComputedStyle(el).boxShadow);

    expect(pressedBoxShadow).not.toBe("none");
  });

  test("aria-disabled is non-interactive", async ({ page }) => {
    const pointerEvents = await page
      .locator("#disabled")
      .evaluate((el) => window.getComputedStyle(el).pointerEvents);

    expect(pointerEvents).toBe("none");
  });

  test("reduced motion disables movement transform", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setContent(html);
    const target = page.locator("#target");
    await target.hover();

    const transform = await target.evaluate((el) => window.getComputedStyle(el).transform);
    expect(transform).toBe("none");
  });

  test("icon-only enforces minimum target size", async ({ page }) => {
    const iconStyles = await page.locator("#icon").evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        minWidth: computed.minWidth,
        minHeight: computed.minHeight
      };
    });

    expect(iconStyles.minWidth).toBe("44px");
    expect(iconStyles.minHeight).toBe("44px");
  });
});
