import { expect, test } from "@playwright/test";

import { createPackedEcosystemFixture } from "./fixtures/packed-ecosystem";

test.describe("canonical UI Style Kit theme integration", () => {
  test("packed Interactive Surface standalone entry renders the published preset", async ({
    page,
  }) => {
    const fixture = createPackedEcosystemFixture();

    try {
      await page.setContent(`
        <style>${fixture.readCss("interactive-surface-css/standalone-preset.css")}</style>
        <button class="interactive-surface variant-primary">Publish</button>
      `);

      const backgroundColor = await page
        .locator(".interactive-surface")
        .evaluate(
          (element) => window.getComputedStyle(element).backgroundColor,
        );

      expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(
        fixture.resolvePublicExport(
          "interactive-surface-css/standalone-preset.css",
        ),
      ).toContain("node_modules");
    } finally {
      fixture.cleanup();
    }
  });

  test("packed canonical theme entry paints the surface while state core owns focus", async ({
    page,
  }) => {
    const fixture = createPackedEcosystemFixture({ includeUiStyleKit: true });

    try {
      expect(() =>
        fixture.resolvePublicExport("ui-style-kit-css/visual.css"),
      ).not.toThrow();

      await page.setContent(`
        <style>${fixture.readCss("ui-style-kit-css/visual.css")}</style>
        <style>${fixture.readCss("ui-style-kit-css/interactive-surface-theme.css")}</style>
        <style>${fixture.readCss("interactive-surface-css/state-core.css")}</style>
        <body data-ui="minimal-saas" data-theme="arctic-indigo" data-mode="dark">
          <button id="primary" class="interactive-surface variant-primary">Primary</button>
        </body>
      `);

      await page.keyboard.press("Tab");
      const styles = await page.locator("#primary").evaluate((element) => {
        const computed = window.getComputedStyle(element);

        return {
          backgroundColor: computed.backgroundColor,
          borderWidth: computed.borderWidth,
          outlineStyle: computed.outlineStyle,
        };
      });

      expect(styles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(styles.borderWidth).toBe("1px");
      expect(styles.outlineStyle).toBe("solid");
    } finally {
      fixture.cleanup();
    }
  });
});
