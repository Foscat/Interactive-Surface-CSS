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
    <button id="class-primary" class="interactive-surface variant-primary">Class Primary</button>
    <button id="data-primary" class="interactive-surface" data-surface-variant="primary">Data Primary</button>
    <button id="level-1" class="interactive-surface" data-surface-level="1">Level 1</button>
    <button id="level-2" class="interactive-surface" data-surface-level="2">Level 2</button>
    <button id="level-3" class="interactive-surface" data-surface-level="3">Level 3</button>
    <button id="icon" class="interactive-surface icon-only" aria-label="Icon">
      <span id="icon-light-default" data-icon-role="light">☀</span>
      <span id="icon-dark-default" data-icon-role="dark">☾</span>
      <span id="icon-accessibility-default" data-icon-role="accessibility">◎</span>
    </button>
    <div data-mode="dark">
      <button id="icon-dark-mode" class="interactive-surface icon-only" aria-label="Dark mode icon">
        <span id="icon-light-dark-mode" data-icon-role="light">☀</span>
        <span id="icon-dark-dark-mode" data-icon-role="dark">☾</span>
        <span id="icon-accessibility-dark-mode" data-icon-role="accessibility">◎</span>
      </button>
    </div>
    <div data-mode="contrast">
      <button id="icon-contrast-mode" class="interactive-surface icon-only" aria-label="Contrast mode icon">
        <span id="icon-light-contrast-mode" data-icon-role="light">☀</span>
        <span id="icon-dark-contrast-mode" data-icon-role="dark">☾</span>
        <span id="icon-accessibility-contrast-mode" data-icon-role="accessibility">◎</span>
      </button>
    </div>
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

  test("data-surface-variant aliases class-based visual variants", async ({ page }) => {
    const variantNames = ["primary", "secondary", "accent", "subtle", "warning", "danger"];

    for (const variantName of variantNames) {
      const { classStyles, dataStyles, dataVariant } = await page.evaluate((value) => {
        const classButton = document.createElement("button");
        classButton.className = `interactive-surface variant-${value}`;
        classButton.textContent = "Class variant";

        const dataButton = document.createElement("button");
        dataButton.className = "interactive-surface";
        dataButton.setAttribute("data-surface-variant", value);
        dataButton.textContent = "Data variant";

        document.body.append(classButton, dataButton);

        const getSurfaceStyles = (el: HTMLElement) => {
          const computed = window.getComputedStyle(el);

          return {
            background: computed.backgroundColor,
            borderColor: computed.borderColor,
            color: computed.color
          };
        };

        const comparison = {
          classStyles: getSurfaceStyles(classButton),
          dataStyles: getSurfaceStyles(dataButton),
          dataVariant: dataButton.getAttribute("data-surface-variant")
        };

        classButton.remove();
        dataButton.remove();

        return comparison;
      }, variantName);

      expect(dataVariant).toBe(variantName);
      expect(dataStyles, `data-surface-variant="${variantName}"`).toEqual(classStyles);
    }
  });

  test("data-surface-level exposes distinct standalone depth and state defaults", async ({ page }) => {
    const levelStyles = await page.locator("[data-surface-level]").evaluateAll((elements) =>
      elements.map((el) => {
        const computed = window.getComputedStyle(el);

        return {
          level: el.getAttribute("data-surface-level"),
          boxShadow: computed.boxShadow,
          hoverOpacity: computed.getPropertyValue("--interactive-surface-state-layer-hover-opacity").trim(),
          activeOpacity: computed.getPropertyValue("--interactive-surface-state-layer-active-opacity").trim(),
          focusOpacity: computed.getPropertyValue("--interactive-surface-state-layer-focus-opacity").trim()
        };
      })
    );

    expect(levelStyles.map(({ level }) => level)).toEqual(["1", "2", "3"]);
    expect(new Set(levelStyles.map(({ boxShadow }) => boxShadow)).size).toBe(3);
    expect(levelStyles).toEqual([
      expect.objectContaining({ hoverOpacity: "0.08", activeOpacity: "0.14", focusOpacity: "0.18" }),
      expect.objectContaining({ hoverOpacity: "0.11", activeOpacity: "0.18", focusOpacity: "0.22" }),
      expect.objectContaining({ hoverOpacity: "0.14", activeOpacity: "0.24", focusOpacity: "0.28" })
    ]);
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

  test("data-mode dark and contrast containers apply dark icon-role colors without changing baseline colors", async ({
    page
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.setContent(html);

    const getColor = async (selector: string) =>
      page.locator(selector).evaluate((el) => window.getComputedStyle(el).color);

    expect(await getColor("#icon-light-default")).toBe("rgb(212, 175, 55)");
    expect(await getColor("#icon-dark-default")).toBe("rgb(0, 0, 0)");
    expect(await getColor("#icon-accessibility-default")).toBe("rgb(59, 130, 246)");

    expect(await getColor("#icon-light-dark-mode")).toBe("rgb(255, 255, 255)");
    expect(await getColor("#icon-dark-dark-mode")).toBe("rgb(30, 58, 138)");
    expect(await getColor("#icon-accessibility-dark-mode")).toBe("rgb(156, 163, 175)");

    expect(await getColor("#icon-light-contrast-mode")).toBe("rgb(255, 255, 255)");
    expect(await getColor("#icon-dark-contrast-mode")).toBe("rgb(30, 58, 138)");
    expect(await getColor("#icon-accessibility-contrast-mode")).toBe("rgb(156, 163, 175)");
  });
});
