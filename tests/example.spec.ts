import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

const css = fs.readFileSync(path.join(packageRoot, "interactive-surface.css"), "utf8");
const exampleHtml = fs
  .readFileSync(path.join(packageRoot, "example.html"), "utf8")
  .replace('<link rel="stylesheet" href="./interactive-surface.css" />', `<style>${css}</style>`);

test.describe("example page", () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(exampleHtml);
  });

  test("renders all major showcase sections", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Interactive Surface Library" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Buttons and states" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Card surfaces" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Icon micro controls" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accessibility highlights" })).toBeVisible();
  });

  test("example exposes a variety of interactive surfaces", async ({ page }) => {
    const controls = page.locator(".interactive-surface");
    await expect(controls).toHaveCount(13);
  });
});
