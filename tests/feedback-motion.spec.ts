import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const standaloneCss = fs.readFileSync(
  path.join(packageRoot, "standalone-preset.css"),
  "utf8",
);

const feedbackCases = [
  {
    value: "error",
    hostAnimation: "interactive-surface-feedback-error",
    layerAnimation: "interactive-surface-feedback-layer",
    color: "rgb(185, 28, 28)",
  },
  {
    value: "success",
    hostAnimation: "interactive-surface-feedback-success",
    layerAnimation: "interactive-surface-feedback-layer",
    color: "rgb(21, 128, 61)",
  },
  {
    value: "attention",
    hostAnimation: "interactive-surface-feedback-attention",
    layerAnimation: "interactive-surface-feedback-layer-attention",
    color: "rgb(180, 83, 9)",
  },
] as const;

function feedbackFixtureHtml() {
  const buttons = feedbackCases
    .map(
      ({ value }) =>
        `<button id="${value}" class="interactive-surface" data-surface-feedback="${value}">${value}</button>`,
    )
    .join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        #custom {
          --interactive-surface-feedback-duration: 480ms;
          --interactive-surface-feedback-easing: linear;
          --interactive-surface-feedback-distance: 5px;
          --interactive-surface-feedback-layer-opacity: 0.24;
          --interactive-surface-feedback-error-color: rgb(10 20 30);
        }
      </style>
      <style>${standaloneCss}</style>
    </head>
    <body>
      ${buttons}
      <button id="custom" class="interactive-surface" data-surface-feedback="error">custom</button>
      <button id="unknown" class="interactive-surface" data-surface-feedback="celebrate">unknown</button>
    </body>
  </html>`;
}

test.describe("semantic feedback motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(feedbackFixtureHtml());
  });

  test("maps each outcome to its exact host, layer, and standalone color", async ({
    page,
  }) => {
    for (const feedbackCase of feedbackCases) {
      const styles = await page
        .locator(`#${feedbackCase.value}`)
        .evaluate((element) => {
          const host = window.getComputedStyle(element);
          const layer = window.getComputedStyle(element, "::before");
          return {
            hostAnimation: host.animationName,
            hostDuration: host.animationDuration,
            hostEasing: host.animationTimingFunction,
            hostDelay: host.animationDelay,
            hostFillMode: host.animationFillMode,
            hostIterations: host.animationIterationCount,
            layerAnimation: layer.animationName,
            layerColor: layer.backgroundColor,
          };
        });

      expect(styles, feedbackCase.value).toEqual({
        hostAnimation: feedbackCase.hostAnimation,
        hostDuration: "0.24s",
        hostEasing: "cubic-bezier(0.2, 0, 0.2, 1)",
        hostDelay: "0s",
        hostFillMode: "none",
        hostIterations: "1",
        layerAnimation: feedbackCase.layerAnimation,
        layerColor: feedbackCase.color,
      });
    }
  });

  test("resolves scoped custom tokens and ignores unknown outcomes", async ({
    page,
  }) => {
    const custom = await page.locator("#custom").evaluate((element) => {
      const host = window.getComputedStyle(element);
      const layer = window.getComputedStyle(element, "::before");
      return {
        duration: host.animationDuration,
        easing: host.animationTimingFunction,
        layerColor: layer.backgroundColor,
        distance: host
          .getPropertyValue("--interactive-surface-feedback-distance")
          .trim(),
        layerOpacityToken: host
          .getPropertyValue("--interactive-surface-feedback-layer-opacity")
          .trim(),
      };
    });
    expect(custom).toEqual({
      duration: "0.48s",
      easing: "linear",
      layerColor: "rgb(10, 20, 30)",
      distance: "5px",
      layerOpacityToken: "0.24",
    });
    await expect(page.locator("#unknown")).toHaveCSS("animation-name", "none");
  });

  test("exposes the exact host keyframe offsets and returns every profile to rest", async ({
    page,
  }) => {
    const expectedOffsets = {
      error: [0, 0.2, 0.4, 0.6, 0.8, 1],
      success: [0, 0.45, 1],
      attention: [0, 0.25, 0.45, 0.7, 1],
    } as const;

    for (const feedbackCase of feedbackCases) {
      const frames = await page
        .locator(`#${feedbackCase.value}`)
        .evaluate(async (element, value) => {
          const target = element as HTMLElement;
          const nextFrame = () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
          target.style.setProperty(
            "--interactive-surface-feedback-duration",
            "10s",
          );
          target.removeAttribute("data-surface-feedback");
          await nextFrame();
          target.setAttribute("data-surface-feedback", value);
          await nextFrame();
          const animation = target
            .getAnimations()
            .find((candidate) =>
              candidate instanceof CSSAnimation
                ? candidate.animationName ===
                  `interactive-surface-feedback-${value}`
                : false,
            );
          if (!animation)
            throw new Error(`Missing host animation for ${value}`);
          const keyframes =
            animation.effect instanceof KeyframeEffect
              ? animation.effect.getKeyframes()
              : [];
          return keyframes.map(({ offset, translate }) => ({
            offset:
              typeof offset === "number" ? Number(offset.toFixed(4)) : offset,
            translate,
          }));
        }, feedbackCase.value);

      expect(
        frames.map(({ offset }) => offset),
        feedbackCase.value,
      ).toEqual(expectedOffsets[feedbackCase.value]);
      expect(frames[0]?.translate, feedbackCase.value).toBe(
        frames.at(-1)?.translate,
      );
    }
  });

  test("removing and reapplying the same outcome creates a new animation", async ({
    page,
  }) => {
    const replayed = await page.locator("#error").evaluate(async (element) => {
      const target = element as HTMLElement;
      const nextFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      target.style.setProperty(
        "--interactive-surface-feedback-duration",
        "10s",
      );
      target.removeAttribute("data-surface-feedback");
      await nextFrame();
      target.setAttribute("data-surface-feedback", "error");
      await nextFrame();
      const first = target.getAnimations()[0];

      target.removeAttribute("data-surface-feedback");
      await nextFrame();
      target.setAttribute("data-surface-feedback", "error");
      await nextFrame();
      const second = target.getAnimations()[0];

      return Boolean(first && second && first !== second);
    });

    expect(replayed).toBe(true);
  });
});
