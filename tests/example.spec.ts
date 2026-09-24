import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Locator, type Page } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

function readPackageFile(relativePath: string): string {
  const absolutePath = path.join(packageRoot, relativePath);
  return fs.existsSync(absolutePath)
    ? fs.readFileSync(absolutePath, "utf8")
    : "";
}

const sourceHtml = readPackageFile("index.html");
const standaloneCss = readPackageFile("standalone-preset.css");
const demoCss = readPackageFile("demo/demo.css");
const demoJavaScript = readPackageFile("demo/demo.js");
const readmeMarkdown = readPackageFile("README.md");
const packageManifest = JSON.parse(readPackageFile("package.json")) as {
  exports?: Record<string, unknown>;
  files?: string[];
  sideEffects?: string[];
};
const exampleHtml = sourceHtml
  .replace(
    '<link rel="stylesheet" href="./standalone-preset.css" />',
    `<style data-test-asset="standalone-preset.css">${standaloneCss}</style>`,
  )
  .replace(
    '<link rel="stylesheet" href="./demo/demo.css" />',
    `<style data-test-asset="demo/demo.css">${demoCss}</style>`,
  )
  .replace(
    '<script src="./demo/demo.js" defer></script>',
    () => `<script>${demoJavaScript}</script>`,
  );
const fullReadmeExampleHtml = exampleHtml.replace(
  /(<script id="embeddedReadme" type="text\/markdown">)[\s\S]*?(<\/script>)/,
  (_match, openingTag: string, closingTag: string) =>
    `${openingTag}\n${readmeMarkdown}\n${closingTag}`,
);

async function expectFocused(locator: Locator): Promise<void> {
  await expect(locator).toBeFocused();
}

async function expectActionableError(
  page: Page,
  message: string,
): Promise<void> {
  const status = page.getByRole("status");
  await expect(status).toHaveText(message);
  await expectFocused(status);
}

function expectElementWithAttributes(
  source: string,
  tagName: string,
  attributes: Record<string, string>,
): void {
  const attributeLookaheads = Object.entries(attributes)
    .map(([name, value]) => {
      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return `(?=[^>]*\\b${name}="${escapedValue}")`;
    })
    .join("");

  expect(source).toMatch(
    new RegExp(`<${tagName}\\b${attributeLookaheads}[^>]*>`, "i"),
  );
}

test.describe("state-first example page", () => {
  test.describe.configure({ mode: "parallel" });

  test.beforeEach(async ({ page }) => {
    await page.setContent(exampleHtml);
  });

  test("loads the standalone preset and split demo assets", async () => {
    expect(sourceHtml).toContain(
      '<link rel="stylesheet" href="./standalone-preset.css" />',
    );
    expect(sourceHtml).toContain(
      '<link rel="stylesheet" href="./demo/demo.css" />',
    );
    expect(sourceHtml).toContain(
      '<script src="./demo/demo.js" defer></script>',
    );
    expect(sourceHtml).not.toContain('id="demoThemeStyles"');
    expect(sourceHtml).not.toMatch(
      /<link[^>]+href="[^"]*ISC(?:%20| )logo\.png"/i,
    );
    expect(sourceHtml).not.toMatch(/<link[^>]+href="data:image\/svg\+xml/i);
    [
      { rel: "icon", href: "./assets/favicon.ico", sizes: "any" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "./assets/favicon-16x16.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "./assets/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "48x48",
        href: "./assets/favicon-48x48.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "64x64",
        href: "./assets/favicon-64x64.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "./assets/apple-touch-icon.png",
      },
      { rel: "manifest", href: "./assets/site.webmanifest" },
    ].forEach((attributes) =>
      expectElementWithAttributes(sourceHtml, "link", attributes),
    );
    expectElementWithAttributes(sourceHtml, "meta", {
      name: "msapplication-config",
      content: "./assets/browserconfig.xml",
    });
    expect(sourceHtml).toContain('<script type="application/ld+json">');
    expect(sourceHtml).toContain(
      '<script id="embeddedReadme" type="text/markdown">',
    );
    expect(demoCss.length).toBeGreaterThan(0);
    expect(demoJavaScript.length).toBeGreaterThan(0);
    expect(packageManifest.files).toEqual(
      expect.arrayContaining(["demo/demo.css", "demo/demo.js"]),
    );
    expect(packageManifest.exports?.["./index.html"]).toBe("./index.html");
    expect(packageManifest.sideEffects).toEqual(
      expect.arrayContaining(["*.css"]),
    );
  });

  test("puts integrated proof and live state evidence before token tooling", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Interactive Surface CSS" }),
    ).toBeVisible();

    const systemsLabLink = page.getByRole("link", {
      name: "Open the Interface Systems Lab",
    });
    await expect(systemsLabLink).toBeVisible();
    await expect(systemsLabLink).toHaveAttribute(
      "href",
      "https://foscat.github.io/interface-systems-lab/",
    );
    await expect(systemsLabLink).toHaveAttribute("data-primary-control", "");

    const sectionOrder = await page
      .locator("main > section")
      .evaluateAll((sections) => sections.map((section) => section.id));
    expect(sectionOrder).toEqual([
      "ecosystem-ownership",
      "state-lab",
      "accessibility-guidance",
      "entry-points",
      "advanced-tools",
      "readme-reference",
    ]);

    const ownership = page.locator("#ecosystem-ownership");
    await expect(
      ownership.getByText("structure and geometry", { exact: true }),
    ).toBeVisible();
    await expect(
      ownership.getByText("visual paint and themes", { exact: true }),
    ).toBeVisible();
    await expect(
      ownership.getByText("interaction states", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("#readme-reference #readmeContent"),
    ).toContainText("Interactive Surface CSS");
  });

  test("exposes every supported state with native, inspectable semantics", async ({
    page,
  }) => {
    const stateLab = page.locator("#state-lab");
    const action = stateLab.locator('[data-example="action"]');
    const toggle = stateLab.locator('[data-example="toggle"]');
    const current = stateLab.locator('[data-example="current"]');
    const selected = stateLab.locator('[data-example="selected"]');
    const loading = stateLab.locator('[data-example="loading"]');
    const disabled = stateLab.locator('[data-example="disabled"]');
    const variant = stateLab.locator('[data-example="variant"]');
    const level = stateLab.locator('[data-example="level"]');
    const icon = stateLab.locator('[data-example="icon"]');
    const feedbackError = stateLab.locator('[data-feedback-trigger="error"]');
    const feedbackSuccess = stateLab.locator(
      '[data-feedback-trigger="success"]',
    );
    const feedbackAttention = stateLab.locator(
      '[data-feedback-trigger="attention"]',
    );

    await expect(action).toHaveJSProperty("tagName", "BUTTON");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(selected).toHaveAttribute("role", "tab");
    await expect(selected).toHaveAttribute("aria-selected", "false");
    await expect(loading).toHaveAttribute("aria-busy", "false");
    await expect(disabled).toBeDisabled();
    await expect(variant).toHaveClass(/variant-primary/);
    await expect(level).toHaveAttribute("data-surface-level", "2");
    await expect(icon).toHaveAttribute(
      "aria-label",
      "Show interaction details",
    );
    await expect(icon.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(feedbackError).toHaveJSProperty("tagName", "BUTTON");
    await expect(feedbackSuccess).toHaveJSProperty("tagName", "BUTTON");
    await expect(feedbackAttention).toHaveJSProperty("tagName", "BUTTON");
  });

  test("updates pressed, selected, busy, and action state through real controls", async ({
    page,
  }) => {
    const stateLab = page.locator("#state-lab");
    const toggle = stateLab.locator('[data-example="toggle"]');
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#toggle-state")).toHaveText("On");

    const selectedTab = stateLab.locator('[data-example="selected"]');
    await selectedTab.click();
    await expect(selectedTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.locator('#state-tabs [role="tab"]').first(),
    ).toHaveAttribute("aria-selected", "false");

    const loading = stateLab.locator('[data-example="loading"]');
    const initialLoadingState = await loading.evaluate(
      (element: HTMLButtonElement) => {
        // Capture transient state in the click task so its completion timer cannot race protocol round trips.
        element.click();
        return {
          busy: element.getAttribute("aria-busy"),
          text: element.textContent,
        };
      },
    );
    expect(initialLoadingState).toEqual({
      busy: "true",
      text: "Loading proof…",
    });
    await expect(loading).toHaveAttribute("aria-busy", "false", {
      timeout: 2_000,
    });
    await expect(loading).toHaveText("Run loading proof");

    await stateLab.locator('[data-example="action"]').click();
    await expect(page.getByRole("status")).toHaveText(
      "Action example completed.",
    );
  });

  test("triggers, announces, clears, and replays semantic feedback", async ({
    page,
  }) => {
    const expectations = [
      ["error", "The demo action failed. Review the control and try again."],
      ["success", "The demo action completed successfully."],
      ["attention", "The demo control needs your attention."],
    ] as const;

    for (const [outcome, message] of expectations) {
      const control = page.locator(`[data-feedback-trigger="${outcome}"]`);
      await control.click();
      await expect(control).toHaveAttribute("data-surface-feedback", outcome);
      await expect(page.getByRole("status")).toHaveText(message);
      await expect(control).not.toHaveAttribute(
        "data-surface-feedback",
        outcome,
        {
          timeout: 1_200,
        },
      );
    }

    const error = page.locator('[data-feedback-trigger="error"]');
    await error.click();
    await expect(error).toHaveAttribute("data-surface-feedback", "error");
    await error.click();
    await expect(error).toHaveAttribute("data-surface-feedback", "error");
  });

  test("supports wrapping keyboard navigation for the roving state tabs", async ({
    page,
  }) => {
    const restingTab = page.getByRole("tab", { name: "Resting" });
    const selectedTab = page.getByRole("tab", { name: "Selected" });

    await restingTab.focus();
    await page.keyboard.press("ArrowRight");
    await expectFocused(selectedTab);
    await expect(selectedTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    await expectFocused(restingTab);
    await page.keyboard.press("ArrowLeft");
    await expectFocused(selectedTab);

    await page.keyboard.press("Home");
    await expectFocused(restingTab);
    await page.keyboard.press("End");
    await expectFocused(selectedTab);

    await page.keyboard.press("ArrowDown");
    await expectFocused(restingTab);
    await page.keyboard.press("ArrowUp");
    await expectFocused(selectedTab);
    await expect(selectedTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#selected-panel")).toBeVisible();
    await expect(page.locator("#resting-panel")).toBeHidden();
  });

  test("dialog feedback lifecycle clears external status before opening", async ({
    page,
  }) => {
    const advancedTools = page.locator("#advanced-tools");
    const globalStatus = page.locator("body > #demoStatus");
    const dialog = page.locator("#token-editor-dialog");

    await page.locator('[data-example="action"]').click();
    await expect(globalStatus).toHaveText("Action example completed.");
    await expect(globalStatus).toHaveClass(/is-success/);

    await advancedTools
      .getByRole("button", { name: "Edit --interactive-surface-bg" })
      .click();
    await expect(dialog.locator("#demoStatus")).toBeEmpty();
    await expect(dialog.locator("#demoStatus")).not.toHaveClass(
      /is-(?:error|success)/,
    );
  });

  test("opens a modal dialog, traps focus, and restores the exact opener", async ({
    page,
  }) => {
    const main = page.locator("main");
    const advancedTools = page.locator("#advanced-tools");
    const opener = advancedTools.getByRole("button", {
      name: "Edit --interactive-surface-focus-ring-color",
    });
    const cancelOpener = advancedTools.getByRole("button", {
      name: "Edit --interactive-surface-bg",
    });
    const dialog = page.getByRole("dialog", {
      name: "Edit --interactive-surface-focus-ring-color",
    });
    const valueField = page.getByLabel("Token value");
    const cancel = page.getByRole("button", { name: "Cancel token edit" });

    await opener.click();
    await expect(dialog).toBeVisible();
    await expect(main).toHaveAttribute("inert", "");
    await expectFocused(valueField);

    await cancel.focus();
    await page.keyboard.press("Tab");
    await expectFocused(valueField);
    await valueField.focus();
    await page.keyboard.press("Shift+Tab");
    await expectFocused(cancel);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(main).not.toHaveAttribute("inert", "");
    await expectFocused(opener);

    await cancelOpener.click();
    await cancel.click();
    await expect(dialog).toBeHidden();
    await expect(main).not.toHaveAttribute("inert", "");
    await expectFocused(cancelOpener);
  });

  test("keeps validation feedback available inside the open token dialog", async ({
    page,
  }) => {
    const advancedTools = page.locator("#advanced-tools");
    const dialog = page.getByRole("dialog", {
      name: "Edit --interactive-surface-bg",
    });
    const valueField = page.getByLabel("Token value");

    await advancedTools
      .getByRole("button", { name: "Edit --interactive-surface-bg" })
      .click();
    await valueField.fill("not-a-color");
    await page.getByRole("button", { name: "Apply token" }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveText(
      "Enter a valid CSS color value, such as rgb(16 42 67), and try again.",
    );
    await expectFocused(valueField);
  });

  test("dialog feedback lifecycle discards invalid feedback after Escape and Cancel", async ({
    page,
  }) => {
    const advancedTools = page.locator("#advanced-tools");
    const backgroundOpener = advancedTools.getByRole("button", {
      name: "Edit --interactive-surface-bg",
    });
    const focusOpener = advancedTools.getByRole("button", {
      name: "Edit --interactive-surface-focus-ring-color",
    });
    const dialog = page.locator("#token-editor-dialog");
    const valueField = page.getByLabel("Token value");
    const globalStatus = page.locator("body > #demoStatus");

    await backgroundOpener.click();
    await valueField.fill("not-a-color");
    await page.getByRole("button", { name: "Apply token" }).click();
    await expect(dialog.locator("#demoStatus")).toHaveClass(/is-error/);
    await page.keyboard.press("Escape");
    await expect(globalStatus).toBeEmpty();
    await expect(globalStatus).not.toHaveClass(/is-(?:error|success)/);

    await focusOpener.click();
    await expect(dialog.locator("#demoStatus")).toBeEmpty();
    await valueField.fill("still-not-a-color");
    await page.getByRole("button", { name: "Apply token" }).click();
    await page.getByRole("button", { name: "Cancel token edit" }).click();
    await expect(globalStatus).toBeEmpty();
    await expect(globalStatus).not.toHaveClass(/is-(?:error|success)/);
  });

  test("dialog feedback lifecycle preserves valid success until the next session", async ({
    page,
  }) => {
    const advancedTools = page.locator("#advanced-tools");
    const dialog = page.getByRole("dialog", {
      name: "Edit --interactive-surface-bg",
    });
    await advancedTools
      .getByRole("button", { name: "Edit --interactive-surface-bg" })
      .click();
    await page.getByLabel("Token value").fill("rgb(250 251 252)");
    await page.getByRole("button", { name: "Apply token" }).click();

    const dialogStatus = dialog.getByRole("status");
    await expect(dialogStatus).toHaveText(
      "--interactive-surface-bg updated. Close the editor to review the state lab.",
    );
    await expect(dialogStatus).toHaveClass(/is-success/);
    await expect(
      page.locator(
        '[data-token="--interactive-surface-bg"] [data-token-value]',
      ),
    ).toHaveText("rgb(250 251 252)");

    await page.keyboard.press("Escape");
    const globalStatus = page.locator("body > #demoStatus");
    await expect(globalStatus).toHaveText(
      "--interactive-surface-bg updated. Close the editor to review the state lab.",
    );
    await expect(globalStatus).toHaveClass(/is-success/);

    await advancedTools
      .getByRole("button", {
        name: "Edit --interactive-surface-focus-ring-color",
      })
      .click();
    await expect(page.locator("#token-editor-dialog #demoStatus")).toBeEmpty();
    await expect(
      page.locator("#token-editor-dialog #demoStatus"),
    ).not.toHaveClass(/is-(?:error|success)/);
  });

  test("reports a dialog launch failure globally after cleanup", async ({
    page,
  }) => {
    await page.evaluate(() => {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: () => {
          throw new Error("dialog launch failed");
        },
      });
    });

    const opener = page
      .locator("#advanced-tools")
      .getByRole("button", { name: "Edit --interactive-surface-bg" });
    await opener.click();

    const globalStatus = page.locator("body > #demoStatus");
    await expect(page.locator("#token-editor-dialog")).toBeHidden();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
    await expect(globalStatus).toHaveText(
      "The token editor could not open. Reload the page and try again.",
    );
    await expect(globalStatus).toHaveClass(/is-error/);
    await expectFocused(globalStatus);
  });

  test("renders the repository README without markdown fence artifacts", async ({
    page,
  }) => {
    await page.setContent(fullReadmeExampleHtml);
    await expect(page.locator("body")).toHaveAttribute(
      "data-demo-ready",
      "true",
    );

    const readmeReference = page.locator("#readme-reference #readmeContent");
    await expect(readmeReference).not.toContainText("```");
    expect(await readmeReference.locator("pre > code").count()).toBeGreaterThan(
      3,
    );
  });

  test("reports a readable recovery when token file import fails", async ({
    page,
  }) => {
    await page.evaluate(() => {
      Object.defineProperty(File.prototype, "text", {
        configurable: true,
        value: () => Promise.reject(new Error("file read failed")),
      });
    });

    await page
      .locator("#advanced-tools")
      .getByLabel("Import token CSS")
      .setInputFiles({
        name: "tokens.css",
        mimeType: "text/css",
        buffer: Buffer.from(":root {}"),
      });

    await expectActionableError(
      page,
      "Token CSS import failed. Choose a readable CSS file and try again.",
    );
  });

  test("reports a readable recovery when clipboard access fails", async ({
    page,
  }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error("clipboard denied")),
        },
      });
    });

    await page
      .locator("#advanced-tools")
      .getByRole("button", { name: "Copy token CSS" })
      .click();
    await expectActionableError(
      page,
      "Token CSS could not be copied. Allow clipboard access and try again.",
    );
  });

  test("reports a readable recovery when Blob URL creation fails", async ({
    page,
  }) => {
    await page.evaluate(() => {
      URL.createObjectURL = () => {
        throw new Error("Blob URL failed");
      };
    });

    await page
      .locator("#advanced-tools")
      .getByRole("button", { name: "Download token CSS" })
      .click();
    await expectActionableError(
      page,
      "Token CSS download could not be prepared. Check browser download support and try again.",
    );
  });

  test("reports a readable recovery when the generated download fails", async ({
    page,
  }) => {
    await page.evaluate(() => {
      URL.createObjectURL = () => "blob:interactive-surface-test";
      URL.revokeObjectURL = () => undefined;
      HTMLAnchorElement.prototype.click = () => {
        throw new Error("download failed");
      };
    });

    await page
      .locator("#advanced-tools")
      .getByRole("button", { name: "Download token CSS" })
      .click();
    await expectActionableError(
      page,
      "Token CSS download could not start. Try again or use Copy token CSS.",
    );
  });

  for (const width of [1440, 1024, 720, 390, 320]) {
    test(`keeps the ${width}px state lab within the viewport`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(fullReadmeExampleHtml);
      await expect(page.locator("body")).toHaveAttribute(
        "data-demo-ready",
        "true",
      );

      const overflow = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

      const primaryControls = page.locator("[data-primary-control]");
      expect(await primaryControls.count()).toBeGreaterThanOrEqual(3);
      for (const control of await primaryControls.all()) {
        await control.scrollIntoViewIfNeeded();
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box?.x).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
      }
    });
  }
});
