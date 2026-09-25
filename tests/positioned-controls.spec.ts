import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const stateCoreCss = fs.readFileSync(
  path.join(packageRoot, "state-core.css"),
  "utf8",
);

/** Build a consumer-first fixture so package CSS cannot reclaim layout topology. */
function positionedControlFixture(): string {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; max-width: 100%; }
        body { min-height: 150vh; padding: 0.75rem; }
        button { min-block-size: 2.75rem; min-inline-size: 2.75rem; }
        .bounded-region {
          border: 1px solid currentcolor;
          max-block-size: 10rem;
          overflow: auto;
          position: relative;
        }
        .region-content { min-block-size: 24rem; padding: 0.5rem; }
        .absolute-control { inset: 0.5rem 0.5rem auto auto; position: absolute; }
        .fixed-control { inset: auto 0.5rem 0.5rem auto; position: fixed; }
        .sticky-control { inset-block-start: 0; position: sticky; }
        .nested-surface { padding: 0.75rem; }
      </style>
      <style>${stateCoreCss}</style>
    </head>
    <body>
      <section class="bounded-region" aria-label="Bounded work area">
        <div class="region-content">
          <button
            id="sticky"
            class="interactive-surface sticky-control"
            type="button"
          >Sticky</button>
          <div
            id="nested-parent"
            class="interactive-surface nested-surface"
            role="group"
          >
            Nested surface
            <button
              id="absolute"
              aria-label="Absolute action"
              class="interactive-surface absolute-control"
              type="button"
            >A</button>
          </div>
        </div>
      </section>
      <button
        id="fixed"
        aria-label="Fixed action"
        class="interactive-surface fixed-control"
        type="button"
      >F</button>
    </body>
  </html>`;
}

/** Measure document overflow without confusing an intentionally scrollable region for page drift. */
async function documentOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

test.describe("consumer-positioned interaction surfaces", () => {
  for (const width of [320, 390]) {
    test(`${width}px consumers retain absolute, fixed, and sticky topology`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: 568, width });
      await page.setContent(positionedControlFixture());

      await expect(page.locator("#absolute")).toHaveCSS("position", "absolute");
      await expect(page.locator("#fixed")).toHaveCSS("position", "fixed");
      await expect(page.locator("#sticky")).toHaveCSS("position", "sticky");
      expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
    });
  }

  test("nested and positioned controls preserve independent keyboard focus layers", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 568, width: 320 });
    await page.setContent(positionedControlFixture());

    await page.locator("#absolute").focus();
    await expect(page.locator("#absolute")).toBeFocused();
    await expect(page.locator("#absolute")).toHaveCSS("outline-style", "solid");
    await expect(page.locator("#nested-parent")).toHaveCSS(
      "outline-style",
      "none",
    );

    const layerBounds = await page.locator("#absolute").evaluate((element) => {
      const host = element.getBoundingClientRect();
      const layer = window.getComputedStyle(element, "::before");
      return {
        hostHeight: host.height,
        hostWidth: host.width,
        layerHeight: Number.parseFloat(layer.height),
        layerWidth: Number.parseFloat(layer.width),
      };
    });

    expect(layerBounds.layerHeight).toBeGreaterThan(0);
    expect(layerBounds.layerHeight).toBeLessThanOrEqual(layerBounds.hostHeight);
    expect(layerBounds.layerWidth).toBeGreaterThan(0);
    expect(layerBounds.layerWidth).toBeLessThanOrEqual(layerBounds.hostWidth);
  });
});
