import { expect, test, type Page } from "@playwright/test";

import { createPackedEcosystemFixture } from "./fixtures/packed-ecosystem";

async function surfaceSnapshot(page: Page, stylesheets: string[]) {
  await page.setContent(`
    ${stylesheets.map((stylesheet) => `<style>${stylesheet}</style>`).join("\n")}
    <body data-ui="minimal-saas" data-theme="arctic-indigo" data-mode="dark">
      <button id="surface" class="interactive-surface variant-primary">Primary</button>
      <button id="icon" class="interactive-surface icon-only" aria-label="Settings">S</button>
    </body>
  `);
  await page.keyboard.press("Tab");

  return page.locator("#surface").evaluate((element) => {
    const computed = window.getComputedStyle(element);
    const icon = window.getComputedStyle(
      document.querySelector("#icon") as HTMLElement,
    );

    return {
      borderRadius: computed.borderRadius,
      focusOutlineStyle: computed.outlineStyle,
      focusOutlineWidth: computed.outlineWidth,
      themeRadius: computed.getPropertyValue("--interactive-surface-radius"),
      iconMinHeight: icon.minHeight,
      iconMinWidth: icon.minWidth,
    };
  });
}

test.describe("canonical UI Style Kit theme integration", () => {
  test("packed Interactive Surface standalone entry renders the published preset", async ({
    page,
  }) => {
    const fixture = createPackedEcosystemFixture();

    try {
      const standalone = fixture.readCss(
        "interactive-surface-css/standalone-preset.css",
      );
      const full = await surfaceSnapshot(page, [standalone]);
      const nativeBaseline = await surfaceSnapshot(page, [""]);

      expect(full.borderRadius).toBe("12px");
      expect(full.iconMinHeight).toBe("44px");
      expect(full.iconMinWidth).toBe("44px");
      expect(nativeBaseline.borderRadius).not.toBe(full.borderRadius);
      expect(nativeBaseline.iconMinHeight).not.toBe(full.iconMinHeight);
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

      const visual = fixture.readCss("ui-style-kit-css/visual.css");
      const theme = fixture.readCss(
        "ui-style-kit-css/interactive-surface-theme.css",
      );
      const stateCore = fixture.readCss(
        "interactive-surface-css/state-core.css",
      );
      const full = await surfaceSnapshot(page, [visual, theme, stateCore]);
      const withoutTheme = await surfaceSnapshot(page, [visual, stateCore]);
      const withoutStateCore = await surfaceSnapshot(page, [visual, theme]);

      expect(full.themeRadius).toBe(".85rem");
      expect(withoutTheme.themeRadius).toBe("");
      expect(full.focusOutlineStyle).toBe("solid");
      expect(full.focusOutlineWidth).toBe("2px");
      expect(withoutStateCore.focusOutlineWidth).not.toBe(
        full.focusOutlineWidth,
      );
    } finally {
      fixture.cleanup();
    }
  });
});
