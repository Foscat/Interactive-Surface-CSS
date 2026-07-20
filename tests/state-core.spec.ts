import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const stateCoreCss = fs.readFileSync(
  path.join(packageRoot, "state-core.css"),
  "utf8",
);

const persistentSelectors = [
  "#pressed-true",
  "#pressed-mixed",
  "#current-page",
  "#current-step",
  "#selected",
  "#active",
  "#busy",
  "#loading",
] as const;

const disabledSelectors = [
  "#native-disabled",
  "#aria-disabled",
  "#class-disabled",
] as const;

function stateFixtureHtml() {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        padding: 24px;
      }

      .interactive-surface {
        margin: 4px;
        padding: 8px 12px;
        border: 2px solid rgb(91 101 111);
        border-radius: 6px;
        background: rgb(231 235 239);
        color: rgb(21 31 41);
        --interactive-surface-state-layer-active-opacity: 0.32;
        --interactive-surface-state-layer-focus-opacity: 0.24;
        --interactive-surface-state-layer-hover-opacity: 0.18;
      }

      #transient,
      #pressed-true,
      #current-step,
      #busy,
      #loading {
        --interactive-surface-motion-default: 0ms;
        --interactive-surface-motion-press: 0ms;
      }

      .consumer-transform {
        transform: skewX(10deg);
        scale: 1.1;
        rotate: 3deg;
      }

      #composed {
        --interactive-surface-lift-base: 0px;
        --interactive-surface-lift-hover: -7px;
        --interactive-surface-lift-active: -3px;
      }

      #precedence {
        --interactive-surface-lift-base: 0px;
        --interactive-surface-lift-hover: -8px;
        --interactive-surface-lift-active: -3px;
        --interactive-surface-shadow-base: 0 1px 0 rgb(10 20 30);
        --interactive-surface-shadow-hover: 0 2px 0 rgb(40 50 60);
        --interactive-surface-shadow-active: 0 3px 0 rgb(70 80 90);
        --interactive-surface-motion-default: 0ms;
        --interactive-surface-motion-press: 0ms;
      }

      #custom-transition {
        --interactive-surface-transition-property: translate, box-shadow, outline-color;
        --interactive-surface-transition-duration: 110ms, 220ms, 330ms;
        --interactive-surface-transition-easing: linear, ease-in, ease-out;
        --interactive-surface-transition-delay: 10ms, 20ms, 30ms;
      }

      #legacy-transition {
        --motion-default: 90ms;
        --ease-standard: linear;
      }

      /* The persistent fixture must prove reduced motion neutralizes a real active lift. */
      #selected {
        --interactive-surface-lift-active: -9px;
      }
    </style>
    <style>${stateCoreCss}</style>
  </head>
  <body>
    <button id="default" class="interactive-surface">Default</button>
    <button id="focus-target" class="interactive-surface">Focus target</button>
    <button id="transient" class="interactive-surface">Transient</button>
    <button id="pressed-true" class="interactive-surface" aria-pressed="true">Pressed true</button>
    <button id="pressed-mixed" class="interactive-surface" aria-pressed="mixed">Pressed mixed</button>
    <a id="current-page" class="interactive-surface" href="#page" aria-current="page">Current page</a>
    <a id="current-step" class="interactive-surface" href="#step" aria-current="step">Current step</a>
    <div id="selected" class="interactive-surface" role="option" tabindex="0" aria-selected="true">Selected</div>
    <button id="active" class="interactive-surface is-active">Active</button>
    <button id="busy" class="interactive-surface" aria-busy="true">Busy</button>
    <button id="loading" class="interactive-surface is-loading">Loading</button>

    <button
      id="native-disabled"
      class="interactive-surface is-active is-loading"
      aria-selected="true"
      disabled
    >Native disabled</button>
    <button
      id="aria-disabled"
      class="interactive-surface is-loading"
      aria-busy="true"
      aria-disabled="true"
      aria-pressed="mixed"
    >ARIA disabled</button>
    <button
      id="class-disabled"
      class="interactive-surface is-disabled is-active is-loading"
      aria-current="step"
    >Class disabled</button>
    <div
      id="custom-disabled"
      class="interactive-surface"
      role="button"
      tabindex="0"
      aria-disabled="true"
      aria-pressed="true"
    >Focusable custom disabled</div>

    <div id="reference" class="consumer-transform">Reference</div>
    <button id="composed" class="interactive-surface consumer-transform">Composed</button>
    <button id="neutral" class="interactive-surface">Neutral core motion</button>
    <button id="precedence" class="interactive-surface">Precedence</button>
    <button id="custom-transition" class="interactive-surface">Custom transition</button>
    <button id="legacy-transition" class="interactive-surface">Legacy transition</button>
  </body>
</html>`;
}

async function stateLayerOpacity(page: Page, selector: string) {
  return page
    .locator(selector)
    .evaluate((element) =>
      Number.parseFloat(window.getComputedStyle(element, "::before").opacity),
    );
}

async function translateY(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const value = window
      .getComputedStyle(element)
      .getPropertyValue("translate");

    if (value === "none") {
      return 0;
    }

    const coordinates = value.trim().split(/\s+/);
    return Number.parseFloat(coordinates[1] ?? "0");
  });
}

async function systemColor(
  page: Page,
  color: "ButtonText" | "GrayText" | "Highlight",
) {
  return page.evaluate((systemColorName) => {
    const probe = document.createElement("span");
    probe.style.color = systemColorName;
    document.body.append(probe);
    const resolved = window.getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, color);
}

async function composedSnapshot(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      rotate: styles.getPropertyValue("rotate"),
      scale: styles.getPropertyValue("scale"),
      transform: styles.transform,
      translate: styles.getPropertyValue("translate"),
    };
  });
}

async function interactionSnapshot(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const host = window.getComputedStyle(element);
    const layer = window.getComputedStyle(element, "::before");
    const translate = host.getPropertyValue("translate");
    const coordinates = translate.trim().split(/\s+/);

    return {
      boxShadow: host.boxShadow,
      layerOpacity: Number.parseFloat(layer.opacity),
      translateY:
        translate === "none" ? 0 : Number.parseFloat(coordinates[1] ?? "0"),
    };
  });
}

async function transitionSnapshot(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      delay: styles.transitionDelay,
      duration: styles.transitionDuration,
      easing: styles.transitionTimingFunction,
      property: styles.transitionProperty,
    };
  });
}

async function stateLayerTransitionSnapshot(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const styles = window.getComputedStyle(element, "::before");

    return {
      delay: styles.transitionDelay,
      duration: styles.transitionDuration,
      easing: styles.transitionTimingFunction,
      property: styles.transitionProperty,
    };
  });
}

test.describe("state core semantics and precedence", () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(stateFixtureHtml());
  });

  test("all supported enabled persistent and loading states expose a visible state layer", async ({
    page,
  }) => {
    for (const selector of persistentSelectors) {
      await expect
        .poll(() => stateLayerOpacity(page, selector), {
          message: `${selector} should retain persistent feedback`,
        })
        .toBeGreaterThan(0);
    }
  });

  test("every disabled form clears persistent, loading, hover, and motion feedback", async ({
    page,
  }) => {
    for (const selector of disabledSelectors) {
      await page.locator(selector).hover({ force: true });

      const styles = await page.locator(selector).evaluate((element) => {
        const host = window.getComputedStyle(element);
        const layer = window.getComputedStyle(element, "::before");

        return {
          animationName: host.animationName,
          boxShadow: host.boxShadow,
          layerAnimationName: layer.animationName,
          layerOpacity: Number.parseFloat(layer.opacity),
          layerTransitionDuration: layer.transitionDuration,
          transitionDuration: host.transitionDuration,
        };
      });

      expect(styles, selector).toEqual({
        animationName: "none",
        boxShadow: "none",
        layerAnimationName: "none",
        layerOpacity: 0,
        layerTransitionDuration: "0s",
        transitionDuration: "0s",
      });
      expect(await translateY(page, selector), selector).toBe(0);
    }
  });

  test("focusable custom-disabled controls retain an explicit keyboard focus indicator", async ({
    page,
  }) => {
    for (const selector of ["#custom-disabled", "#class-disabled"]) {
      const customDisabled = page.locator(selector);
      await customDisabled.focus();
      await expect(customDisabled).toBeFocused();

      const outline = await customDisabled.evaluate((element) => {
        const styles = window.getComputedStyle(element);
        return {
          style: styles.outlineStyle,
          width: Number.parseFloat(styles.outlineWidth),
        };
      });

      expect(outline.style, selector).toBe("solid");
      expect(outline.width, selector).toBeGreaterThanOrEqual(2);
    }
  });

  test("transient pointer press feedback differs from persistent state feedback", async ({
    page,
  }) => {
    const transient = page.locator("#transient");
    await transient.hover();
    await page.mouse.down();

    try {
      const transientFeedback = {
        layerOpacity: await stateLayerOpacity(page, "#transient"),
        translateY: await translateY(page, "#transient"),
      };
      const persistentFeedback = {
        layerOpacity: await stateLayerOpacity(page, "#pressed-true"),
        translateY: await translateY(page, "#pressed-true"),
      };

      expect(transientFeedback).not.toEqual(persistentFeedback);
    } finally {
      await page.mouse.up();
    }
  });

  test("transient press overrides persistent state feedback", async ({
    page,
  }) => {
    const currentStep = page.locator("#current-step");
    await currentStep.hover();
    await page.mouse.down();

    try {
      expect(await stateLayerOpacity(page, "#current-step")).toBe(0);
    } finally {
      await page.mouse.up();
    }
  });

  test("state precedence is disabled, busy, transient active, persistent, hover, then base", async ({
    page,
  }) => {
    const target = page.locator("#precedence");
    const base = await interactionSnapshot(page, "#precedence");

    expect(base).toEqual({
      boxShadow: "rgb(10, 20, 30) 0px 1px 0px 0px",
      layerOpacity: 0,
      translateY: 0,
    });

    await target.hover();
    expect(await interactionSnapshot(page, "#precedence")).toEqual({
      boxShadow: "rgb(40, 50, 60) 0px 2px 0px 0px",
      layerOpacity: 0.18,
      translateY: -8,
    });

    await target.evaluate((element) =>
      element.setAttribute("aria-pressed", "true"),
    );
    expect(await interactionSnapshot(page, "#precedence")).toEqual({
      boxShadow: "rgb(70, 80, 90) 0px 3px 0px 0px",
      layerOpacity: 0.32,
      translateY: -3,
    });

    await page.mouse.down();
    try {
      expect(await interactionSnapshot(page, "#precedence")).toEqual(base);

      await target.evaluate((element) =>
        element.setAttribute("aria-busy", "true"),
      );
      expect(await interactionSnapshot(page, "#precedence")).toEqual({
        boxShadow: "rgb(70, 80, 90) 0px 3px 0px 0px",
        layerOpacity: 0.32,
        translateY: -3,
      });

      await target.evaluate((element) =>
        element.setAttribute("aria-disabled", "true"),
      );
      expect(await interactionSnapshot(page, "#precedence")).toEqual({
        boxShadow: "none",
        layerOpacity: 0,
        translateY: 0,
      });
    } finally {
      await page.mouse.up();
    }
  });

  test("busy and class loading retain precedence during a transient press", async ({
    page,
  }) => {
    for (const selector of ["#busy", "#loading"]) {
      const target = page.locator(selector);
      await target.hover();
      await page.mouse.down();

      try {
        expect(await stateLayerOpacity(page, selector), selector).toBe(0.32);
      } finally {
        await page.mouse.up();
      }
    }
  });

  test("focus-visible remains orthogonal to base, persistent, busy, and loading feedback", async ({
    page,
  }) => {
    const cases = [
      { selector: "#focus-target", expectedOpacity: 0 },
      { selector: "#pressed-true", expectedOpacity: 0.32 },
      { selector: "#busy", expectedOpacity: 0.32 },
      { selector: "#loading", expectedOpacity: 0.32 },
    ];

    for (const stateCase of cases) {
      const target = page.locator(stateCase.selector);
      const beforeFocus = await interactionSnapshot(page, stateCase.selector);
      await target.focus();
      await expect(target).toBeFocused();
      const afterFocus = await interactionSnapshot(page, stateCase.selector);
      const outline = await target.evaluate((element) => {
        const styles = window.getComputedStyle(element);
        return {
          style: styles.outlineStyle,
          width: Number.parseFloat(styles.outlineWidth),
        };
      });

      expect(afterFocus).toEqual(beforeFocus);
      expect(afterFocus.layerOpacity).toBe(stateCase.expectedOpacity);
      expect(outline.style).toBe("solid");
      expect(outline.width).toBeGreaterThanOrEqual(2);
    }
  });
});

test.describe("state core user preferences", () => {
  test("reduced motion stops movement and timing without erasing persistent or focus meaning", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setContent(stateFixtureHtml());

    const selectedOpacity = await stateLayerOpacity(page, "#selected");
    const currentOpacity = await stateLayerOpacity(page, "#current-step");
    const pressedOpacity = await stateLayerOpacity(page, "#pressed-mixed");
    const defaultOpacity = await stateLayerOpacity(page, "#default");

    expect(selectedOpacity).toBeGreaterThan(defaultOpacity);
    expect(currentOpacity).toBeGreaterThan(defaultOpacity);
    expect(pressedOpacity).toBeGreaterThan(defaultOpacity);
    expect(await translateY(page, "#selected")).toBe(0);

    await page.locator("#composed").hover();
    expect(await translateY(page, "#composed")).toBe(0);

    const timing = await page.locator("#loading").evaluate((element) => {
      const host = window.getComputedStyle(element);
      const layer = window.getComputedStyle(element, "::before");
      return {
        animationName: host.animationName,
        layerAnimationName: layer.animationName,
        layerTransitionDuration: layer.transitionDuration,
        transitionDuration: host.transitionDuration,
      };
    });

    expect(timing).toEqual({
      animationName: "none",
      layerAnimationName: "none",
      layerTransitionDuration: "0s",
      transitionDuration: "0s",
    });

    const focusTarget = page.locator("#focus-target");
    await focusTarget.focus();
    const focusOutline = await focusTarget.evaluate(
      (element) => window.getComputedStyle(element).outlineStyle,
    );
    expect(focusOutline).toBe("solid");
  });

  test("forced colors replaces hidden overlays with system-color focus and state outlines", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.setContent(stateFixtureHtml());

    const buttonText = await systemColor(page, "ButtonText");
    const grayText = await systemColor(page, "GrayText");

    const selected = await page.locator("#selected").evaluate((element) => {
      const host = window.getComputedStyle(element);
      const layer = window.getComputedStyle(element, "::before");
      return {
        layerDisplay: layer.display,
        outlineColor: host.outlineColor,
        outlineStyle: host.outlineStyle,
        outlineWidth: Number.parseFloat(host.outlineWidth),
      };
    });

    expect(selected.layerDisplay).toBe("none");
    expect(selected.outlineStyle).toBe("solid");
    expect(selected.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(selected.outlineColor).toBe(buttonText);

    const focusTarget = page.locator("#focus-target");
    await focusTarget.focus();
    const focus = await focusTarget.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        color: styles.outlineColor,
        style: styles.outlineStyle,
        width: Number.parseFloat(styles.outlineWidth),
      };
    });

    // User agents may remap a native button's forced-color outline; the following anchor test covers exact Highlight precedence.
    expect(focus.style).toBe("solid");
    expect(focus.width).toBeGreaterThanOrEqual(2);
    expect(["transparent", "rgba(0, 0, 0, 0)"]).not.toContain(focus.color);

    const disabled = await page
      .locator("#class-disabled")
      .evaluate((element) => {
        const styles = window.getComputedStyle(element);
        return { color: styles.outlineColor, style: styles.outlineStyle };
      });
    expect(disabled).toEqual({ color: grayText, style: "solid" });
  });

  test("forced colors prioritizes focus over a persistent state outline", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.setContent(stateFixtureHtml());

    const highlight = await systemColor(page, "Highlight");
    const persistentFocus = page.locator("#current-step");
    await persistentFocus.focus();

    const outline = await persistentFocus.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return { color: styles.outlineColor, style: styles.outlineStyle };
    });

    expect(outline).toEqual({ color: highlight, style: "solid" });
  });

  test("greater contrast strengthens focus and persistent state distinctions", async ({
    page,
  }) => {
    await page.emulateMedia({ contrast: "more" });
    await page.setContent(stateFixtureHtml());

    const focusTarget = page.locator("#focus-target");
    await focusTarget.focus();
    const focusWidth = await focusTarget.evaluate((element) =>
      Number.parseFloat(window.getComputedStyle(element).outlineWidth),
    );
    const persistentOutline = await page
      .locator("#selected")
      .evaluate((element) => {
        const styles = window.getComputedStyle(element);
        return {
          style: styles.outlineStyle,
          width: Number.parseFloat(styles.outlineWidth),
        };
      });

    expect(focusWidth).toBeGreaterThanOrEqual(3);
    expect(persistentOutline.style).toBe("solid");
    expect(persistentOutline.width).toBeGreaterThanOrEqual(2);
  });

  test("greater contrast prioritizes focus over a persistent state outline", async ({
    page,
  }) => {
    await page.emulateMedia({ contrast: "more" });
    await page.setContent(stateFixtureHtml());

    const persistentFocus = page.locator("#current-step");
    await persistentFocus.focus();
    const outlineWidth = await persistentFocus.evaluate((element) =>
      Number.parseFloat(window.getComputedStyle(element).outlineWidth),
    );

    expect(outlineWidth).toBeGreaterThanOrEqual(3);
  });
});

test.describe("state core motion composition", () => {
  test("consumer transform, scale, and rotate survive every interaction state", async ({
    page,
  }) => {
    const stateCases = [
      {
        name: "hover",
        expectedTranslateY: -7,
        activate: async () => page.locator("#composed").hover(),
      },
      {
        name: "focus",
        expectedTranslateY: 0,
        activate: async () => page.locator("#composed").focus(),
      },
      {
        name: "press",
        expectedTranslateY: 0,
        activate: async () => {
          await page.locator("#composed").hover();
          await page.mouse.down();
        },
      },
      {
        name: "persistent",
        expectedTranslateY: -3,
        activate: async () =>
          page
            .locator("#composed")
            .evaluate((element) =>
              element.setAttribute("aria-selected", "true"),
            ),
      },
      {
        name: "disabled",
        expectedTranslateY: 0,
        activate: async () =>
          page.locator("#composed").evaluate((element) => {
            element.setAttribute("aria-selected", "true");
            (element as HTMLButtonElement).disabled = true;
          }),
      },
    ];

    for (const stateCase of stateCases) {
      await page.mouse.move(0, 0);
      await page.setContent(stateFixtureHtml());
      const reference = await composedSnapshot(page, "#reference");
      await stateCase.activate();

      try {
        const composed = await composedSnapshot(page, "#composed");

        expect(composed.transform, `${stateCase.name} transform`).toBe(
          reference.transform,
        );
        expect(composed.scale, `${stateCase.name} scale`).toBe(reference.scale);
        expect(composed.rotate, `${stateCase.name} rotate`).toBe(
          reference.rotate,
        );
        await expect
          .poll(() => translateY(page, "#composed"), {
            message: `${stateCase.name} translate`,
          })
          .toBe(stateCase.expectedTranslateY);
      } finally {
        if (stateCase.name === "press") {
          await page.mouse.up();
        }
      }
    }
  });

  test("core exposes exact default, public, and legacy transition tuples", async ({
    page,
  }) => {
    await page.setContent(stateFixtureHtml());
    await page.locator("#neutral").hover();

    expect(await translateY(page, "#neutral")).toBe(0);

    expect(await transitionSnapshot(page, "#neutral")).toEqual({
      delay: "0s",
      duration: "0.14s",
      easing: "cubic-bezier(0.2, 0, 0.2, 1)",
      property: "translate, box-shadow, outline-color",
    });
    expect(await transitionSnapshot(page, "#custom-transition")).toEqual({
      delay: "0.01s, 0.02s, 0.03s",
      duration: "0.11s, 0.22s, 0.33s",
      easing: "linear, ease-in, ease-out",
      property: "translate, box-shadow, outline-color",
    });
    expect(
      await stateLayerTransitionSnapshot(page, "#custom-transition"),
    ).toEqual({
      delay: "0.01s, 0.02s, 0.03s",
      duration: "0.11s, 0.22s, 0.33s",
      easing: "linear, ease-in, ease-out",
      property: "opacity",
    });

    const customTransition = page.locator("#custom-transition");
    await customTransition.hover();
    await page.mouse.down();
    try {
      expect(await transitionSnapshot(page, "#custom-transition")).toEqual({
        delay: "0.01s, 0.02s, 0.03s",
        duration: "0.11s, 0.22s, 0.33s",
        easing: "linear, ease-in, ease-out",
        property: "translate, box-shadow, outline-color",
      });
    } finally {
      await page.mouse.up();
    }

    expect(await transitionSnapshot(page, "#legacy-transition")).toEqual({
      delay: "0s",
      duration: "0.09s",
      easing: "linear",
      property: "translate, box-shadow, outline-color",
    });
  });
});
