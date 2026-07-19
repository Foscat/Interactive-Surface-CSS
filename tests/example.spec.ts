import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Locator, type Page } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

function readPackageFile(relativePath: string): string {
  const absolutePath = path.join(packageRoot, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
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
    `<style data-test-asset="standalone-preset.css">${standaloneCss}</style>`
  )
  .replace(
    '<link rel="stylesheet" href="./demo/demo.css" />',
    `<style data-test-asset="demo/demo.css">${demoCss}</style>`
  )
  .replace('<script src="./demo/demo.js" defer></script>', () => `<script>${demoJavaScript}</script>`);
const fullReadmeExampleHtml = exampleHtml.replace(
  /(<script id="embeddedReadme" type="text\/markdown">)[\s\S]*?(<\/script>)/,
  (_match, openingTag: string, closingTag: string) => `${openingTag}\n${readmeMarkdown}\n${closingTag}`
);

async function expectFocused(locator: Locator): Promise<void> {
  await expect(locator).toBeFocused();
}

async function expectActionableError(page: Page, message: string): Promise<void> {
  const status = page.getByRole("status");
  await expect(status).toHaveText(message);
  await expectFocused(status);
}

test.describe("state-first example page", () => {
  test.describe.configure({ mode: "parallel" });

  test.beforeEach(async ({ page }) => {
    await page.setContent(exampleHtml);
  });

  test("loads the standalone preset and split demo assets", async () => {
    expect(sourceHtml).toContain('<link rel="stylesheet" href="./standalone-preset.css" />');
    expect(sourceHtml).toContain('<link rel="stylesheet" href="./demo/demo.css" />');
    expect(sourceHtml).toContain('<script src="./demo/demo.js" defer></script>');
    expect(sourceHtml).not.toContain('id="demoThemeStyles"');
    expect(sourceHtml).not.toMatch(/<link[^>]+href="[^"]*ISC(?:%20| )logo\.png"/i);
    expect(sourceHtml).toContain('<script type="application/ld+json">');
    expect(sourceHtml).toContain('<script id="embeddedReadme" type="text/markdown">');
    expect(demoCss.length).toBeGreaterThan(0);
    expect(demoJavaScript.length).toBeGreaterThan(0);
    expect(packageManifest.files).toEqual(expect.arrayContaining(["demo/demo.css", "demo/demo.js"]));
    expect(packageManifest.exports?.["./index.html"]).toBe("./index.html");
    expect(packageManifest.sideEffects).toEqual(expect.arrayContaining(["*.css"]));
  });

  test("puts integrated proof and live state evidence before token tooling", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Interactive Surface CSS" })).toBeVisible();

    const systemsLabLink = page.getByRole("link", { name: "Open the Interface Systems Lab" });
    await expect(systemsLabLink).toBeVisible();
    await expect(systemsLabLink).toHaveAttribute("href", "https://foscat.github.io/interface-systems-lab/");
    await expect(systemsLabLink).toHaveAttribute("data-primary-control", "");

    const sectionOrder = await page.locator("main > section").evaluateAll((sections) =>
      sections.map((section) => section.id)
    );
    expect(sectionOrder).toEqual([
      "ecosystem-ownership",
      "state-lab",
      "accessibility-guidance",
      "entry-points",
      "advanced-tools",
      "readme-reference"
    ]);

    const ownership = page.locator("#ecosystem-ownership");
    await expect(ownership.getByText("structure and geometry", { exact: true })).toBeVisible();
    await expect(ownership.getByText("visual paint and themes", { exact: true })).toBeVisible();
    await expect(ownership.getByText("interaction states", { exact: true })).toBeVisible();
    await expect(page.locator("#readme-reference #readmeContent")).toContainText("Interactive Surface CSS");
  });

  test("exposes every supported state with native, inspectable semantics", async ({ page }) => {
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

    await expect(action).toHaveJSProperty("tagName", "BUTTON");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(selected).toHaveAttribute("role", "tab");
    await expect(selected).toHaveAttribute("aria-selected", "false");
    await expect(loading).toHaveAttribute("aria-busy", "false");
    await expect(disabled).toBeDisabled();
    await expect(variant).toHaveClass(/variant-primary/);
    await expect(level).toHaveAttribute("data-surface-level", "2");
    await expect(icon).toHaveAttribute("aria-label", "Show interaction details");
    await expect(icon.locator("svg")).toHaveAttribute("aria-hidden", "true");
  });

  test("updates pressed, selected, busy, and action state through real controls", async ({ page }) => {
    const stateLab = page.locator("#state-lab");
    const toggle = stateLab.locator('[data-example="toggle"]');
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#toggle-state")).toHaveText("On");

    const selectedTab = stateLab.locator('[data-example="selected"]');
    await selectedTab.click();
    await expect(selectedTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('#state-tabs [role="tab"]').first()).toHaveAttribute("aria-selected", "false");

    const loading = stateLab.locator('[data-example="loading"]');
    await loading.click();
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(loading).toHaveText("Loading proof…");
    await expect(loading).toHaveAttribute("aria-busy", "false", { timeout: 2_000 });
    await expect(loading).toHaveText("Run loading proof");

    await stateLab.locator('[data-example="action"]').click();
    await expect(page.getByRole("status")).toHaveText("Action example completed.");
  });

  test("supports wrapping keyboard navigation for the roving state tabs", async ({ page }) => {
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

  test("opens a modal dialog, traps focus, and restores the exact opener", async ({ page }) => {
    const main = page.locator("main");
    const advancedTools = page.locator("#advanced-tools");
    const opener = advancedTools.getByRole("button", { name: "Edit --interactive-surface-focus-ring-color" });
    const cancelOpener = advancedTools.getByRole("button", { name: "Edit --interactive-surface-bg" });
    const dialog = page.getByRole("dialog", { name: "Edit --interactive-surface-focus-ring-color" });
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

  test("keeps validation feedback available inside the open token dialog", async ({ page }) => {
    const advancedTools = page.locator("#advanced-tools");
    const dialog = page.getByRole("dialog", { name: "Edit --interactive-surface-bg" });
    const valueField = page.getByLabel("Token value");

    await advancedTools.getByRole("button", { name: "Edit --interactive-surface-bg" }).click();
    await valueField.fill("not-a-color");
    await page.getByRole("button", { name: "Apply token" }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveText(
      "Enter a valid CSS color value, such as rgb(16 42 67), and try again."
    );
    await expectFocused(valueField);
  });

  test("applies a valid token override from the dialog", async ({ page }) => {
    const advancedTools = page.locator("#advanced-tools");
    const dialog = page.getByRole("dialog", { name: "Edit --interactive-surface-bg" });
    await advancedTools.getByRole("button", { name: "Edit --interactive-surface-bg" }).click();
    await page.getByLabel("Token value").fill("rgb(250 251 252)");
    await page.getByRole("button", { name: "Apply token" }).click();

    await expect(dialog.getByRole("status")).toHaveText(
      "--interactive-surface-bg updated. Close the editor to review the state lab."
    );
    await expect(page.locator('[data-token="--interactive-surface-bg"] [data-token-value]')).toHaveText(
      "rgb(250 251 252)"
    );

    await page.keyboard.press("Escape");
    await expect(page.locator("body > #demoStatus")).toHaveText(
      "--interactive-surface-bg updated. Close the editor to review the state lab."
    );
  });

  test("renders the repository README without markdown fence artifacts", async ({ page }) => {
    await page.setContent(fullReadmeExampleHtml);
    await expect(page.locator("body")).toHaveAttribute("data-demo-ready", "true");

    const readmeReference = page.locator("#readme-reference #readmeContent");
    await expect(readmeReference).not.toContainText("```");
    expect(await readmeReference.locator("pre > code").count()).toBeGreaterThan(3);
  });

  test("reports a readable recovery when token file import fails", async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(File.prototype, "text", {
        configurable: true,
        value: () => Promise.reject(new Error("file read failed"))
      });
    });

    await page.locator("#advanced-tools").getByLabel("Import token CSS").setInputFiles({
      name: "tokens.css",
      mimeType: "text/css",
      buffer: Buffer.from(":root {}")
    });

    await expectActionableError(page, "Token CSS import failed. Choose a readable CSS file and try again.");
  });

  test("reports a readable recovery when clipboard access fails", async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("clipboard denied")) }
      });
    });

    await page.locator("#advanced-tools").getByRole("button", { name: "Copy token CSS" }).click();
    await expectActionableError(page, "Token CSS could not be copied. Allow clipboard access and try again.");
  });

  test("reports a readable recovery when Blob URL creation fails", async ({ page }) => {
    await page.evaluate(() => {
      URL.createObjectURL = () => {
        throw new Error("Blob URL failed");
      };
    });

    await page.locator("#advanced-tools").getByRole("button", { name: "Download token CSS" }).click();
    await expectActionableError(
      page,
      "Token CSS download could not be prepared. Check browser download support and try again."
    );
  });

  test("reports a readable recovery when the generated download fails", async ({ page }) => {
    await page.evaluate(() => {
      URL.createObjectURL = () => "blob:interactive-surface-test";
      URL.revokeObjectURL = () => undefined;
      HTMLAnchorElement.prototype.click = () => {
        throw new Error("download failed");
      };
    });

    await page.locator("#advanced-tools").getByRole("button", { name: "Download token CSS" }).click();
    await expectActionableError(page, "Token CSS download could not start. Try again or use Copy token CSS.");
  });

  for (const width of [1440, 1024, 720, 390, 320]) {
    test(`keeps the ${width}px state lab within the viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(fullReadmeExampleHtml);
      await expect(page.locator("body")).toHaveAttribute("data-demo-ready", "true");

      const overflow = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
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
