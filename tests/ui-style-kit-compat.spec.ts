import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const packageRoot = path.resolve(__dirname, "..");
const interactiveCss = fs.readFileSync(
  path.join(packageRoot, "interactive-surface.css"),
  "utf8",
);
const stateCoreCss = fs.readFileSync(
  path.join(packageRoot, "state-core.css"),
  "utf8",
);
const uiKitRoot = path.dirname(
  require.resolve("ui-style-kit-css/package.json"),
);

const uiKitWithBridge = fs.readFileSync(
  path.join(uiKitRoot, "dist", "ui-style-kit.with-bridge.css"),
  "utf8",
);
const uiKitBridge = fs.readFileSync(
  path.join(uiKitRoot, "styles", "interactive-surface-bridge.css"),
  "utf8",
);
const uiKitThemeColors = fs.readFileSync(
  path.join(uiKitRoot, "styles", "theme-colors.css"),
  "utf8",
);
const uiKitNativeElements = fs.readFileSync(
  path.join(uiKitRoot, "styles", "native-elements.css"),
  "utf8",
);

const styleFilesBySystem = {
  "minimal-saas": "minimal-saas.css",
  cyberpunk: "cyberpunk.css",
  brutalism: "brutalism.css",
  "retro-glass": "retro-glass.css",
} as const;

type SystemName = keyof typeof styleFilesBySystem;
type ModeName = "light" | "dark" | "contrast";
type ImportOrder = "with-bridge-first" | "per-style-bridge-after";

const systems: SystemName[] = [
  "minimal-saas",
  "cyberpunk",
  "brutalism",
  "retro-glass",
];
const geometrySystems: SystemName[] = ["minimal-saas", "brutalism"];
const modes: ModeName[] = ["light", "dark", "contrast"];
const importOrders: ImportOrder[] = [
  "with-bridge-first",
  "per-style-bridge-after",
];
const liftCases = [
  { name: "default", selector: "#base", expectedLift: 4 },
  { name: "small", selector: "#small", expectedLift: 4 },
  { name: "large", selector: "#large", expectedLift: 8 },
  { name: "icon-only", selector: "#icon", expectedLift: 3 },
  { name: "legacy token", selector: "#legacy-lift", expectedLift: 6 },
  { name: "public token", selector: "#public-lift", expectedLift: 10 },
] as const;

function readStyle(system: SystemName) {
  return stripCssImports(
    fs.readFileSync(
      path.join(uiKitRoot, "styles", styleFilesBySystem[system]),
      "utf8",
    ),
  );
}

function stripCssImports(css: string) {
  return css.replaceAll(/@import\s+url\(["'][^)]+["']\);\s*/g, "");
}

function htmlFor(
  order: ImportOrder,
  system: SystemName,
  mode: ModeName,
  surfaceCss = interactiveCss,
) {
  const styles =
    order === "with-bridge-first"
      ? `<style data-source="ui-kit-with-bridge">${uiKitWithBridge}</style><style data-source="interactive">${surfaceCss}</style>`
      : `<style data-source="interactive">${surfaceCss}</style><style data-source="ui-kit-theme-colors">${uiKitThemeColors}</style><style data-source="ui-kit-native-elements">${uiKitNativeElements}</style><style data-source="ui-kit-style">${readStyle(system)}</style><style data-source="ui-kit-bridge">${uiKitBridge}</style>`;

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${styles}
  </head>
  <body data-ui="${system}" data-theme="arctic-indigo" data-mode="${mode}">
    <button id="base" class="interactive-surface">Base</button>
    <button id="small" class="interactive-surface size-sm">Small</button>
    <button id="large" class="interactive-surface size-lg">Large</button>
    <button id="legacy-lift" class="interactive-surface" style="--lift-hover: -6px">Legacy lift</button>
    <button
      id="public-lift"
      class="interactive-surface"
      style="--interactive-surface-lift-hover: -10px"
    >Public lift</button>
    <button id="primary" class="interactive-surface variant-primary">Primary</button>
    <button id="bridge-primary" class="interactive-surface" data-surface-variant="primary">Bridge Primary</button>
    <button id="level" class="interactive-surface" data-surface-level="1">Level</button>
    <button id="current" class="interactive-surface" aria-current="page">Current</button>
    <button id="disabled" class="interactive-surface" aria-disabled="true">Disabled</button>
    <button id="icon" class="interactive-surface icon-only" aria-label="Toggle theme">
      <span id="light-icon" data-icon-role="light">L</span>
    </button>
  </body>
</html>`;
}

async function computed(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const styles = window.getComputedStyle(el);

    return {
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor,
      borderRadius: styles.borderRadius,
      borderWidth: styles.borderWidth,
      boxShadow: styles.boxShadow,
      color: styles.color,
      minHeight: styles.minHeight,
      minWidth: styles.minWidth,
      opacity: styles.opacity,
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
      pointerEvents: styles.pointerEvents,
      transitionDelay: styles.transitionDelay,
      transitionDuration: styles.transitionDuration,
      transitionProperty: styles.transitionProperty,
      transitionTimingFunction: styles.transitionTimingFunction,
      transform: styles.transform,
      translate: styles.getPropertyValue("translate"),
    };
  });
}

function translateY(value: string) {
  if (value === "none") {
    return 0;
  }

  const coordinates = value.trim().split(/\s+/);
  return Number.parseFloat(coordinates[1] ?? "0");
}

function transitionProperties(value: string) {
  return value.split(",").map((property) => property.trim());
}

async function verticalPosition(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box, `${selector} should have rendered geometry`).not.toBeNull();
  return box!.y;
}

async function transformTranslateY(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const transform = window.getComputedStyle(element).transform;
    return new DOMMatrixReadOnly(transform).m42;
  });
}

async function resolvedTokenValue(
  page: Page,
  selector: string,
  tokenName: string,
  propertyName: string,
) {
  return page.locator(selector).evaluate(
    (el, { tokenName: token, propertyName: property }) => {
      const probe = document.createElement("span");
      probe.style.setProperty(property, `var(${token})`);
      probe.style.position = "absolute";
      probe.style.pointerEvents = "none";
      probe.style.visibility = "hidden";
      el.append(probe);

      const value = window.getComputedStyle(probe).getPropertyValue(property);
      probe.remove();

      return value;
    },
    { tokenName, propertyName },
  );
}

async function stateLayerOpacity(page: Page, selector: string) {
  return page
    .locator(selector)
    .evaluate((el) => window.getComputedStyle(el, "::before").opacity);
}

async function expectStateLayerOpacity(
  page: Page,
  selector: string,
  tokenName: string,
) {
  const expectedOpacity = await resolvedTokenValue(
    page,
    selector,
    tokenName,
    "opacity",
  );

  await expect
    .poll(async () => stateLayerOpacity(page, selector))
    .toBe(expectedOpacity);
}

test.describe("ui-style-kit-css 2.0.1 compatibility", () => {
  for (const order of importOrders) {
    for (const system of systems) {
      for (const mode of modes) {
        test(`${order} resolves ${system} ${mode} base, variant, and level tokens`, async ({
          page,
        }) => {
          await page.setContent(htmlFor(order, system, mode));

          const base = await computed(page, "#base");
          const primary = await computed(page, "#primary");
          const bridgePrimary = await computed(page, "#bridge-primary");
          const level = await computed(page, "#level");

          await expect
            .soft(
              base.backgroundColor,
              "base background should come from --interactive-surface-bg",
            )
            .toBe(
              await resolvedTokenValue(
                page,
                "#base",
                "--interactive-surface-bg",
                "background-color",
              ),
            );
          await expect
            .soft(
              base.color,
              "base foreground should come from --interactive-surface-fg",
            )
            .toBe(
              await resolvedTokenValue(
                page,
                "#base",
                "--interactive-surface-fg",
                "color",
              ),
            );
          await expect
            .soft(
              base.borderColor,
              "base border should come from --interactive-surface-border-color",
            )
            .toBe(
              await resolvedTokenValue(
                page,
                "#base",
                "--interactive-surface-border-color",
                "border-top-color",
              ),
            );

          expect(base.borderWidth).toBe("1px");
          expect(primary.backgroundColor).toBe(
            await resolvedTokenValue(
              page,
              "#primary",
              "--interactive-surface-variant-primary-bg",
              "background-color",
            ),
          );
          expect(bridgePrimary.backgroundColor).toBe(
            await resolvedTokenValue(
              page,
              "#bridge-primary",
              "--interactive-surface-variant-primary-bg",
              "background-color",
            ),
          );
          expect(level.backgroundColor).toBe(
            await resolvedTokenValue(
              page,
              "#level",
              "--interactive-surface-level-bg",
              "background-color",
            ),
          );
          expect(level.borderColor).toBe(
            await resolvedTokenValue(
              page,
              "#level",
              "--interactive-surface-level-border-color",
              "border-top-color",
            ),
          );
          expect(level.boxShadow).toBe(
            await resolvedTokenValue(
              page,
              "#level",
              "--interactive-surface-level-shadow",
              "box-shadow",
            ),
          );
        });
      }
    }

    test(`${order} keeps interaction, disabled, icon, and reduced-motion ownership`, async ({
      page,
    }) => {
      await page.setContent(htmlFor(order, "minimal-saas", "dark"));

      await page.keyboard.press("Tab");
      await expect(page.locator("#base")).toBeFocused();

      const focused = await computed(page, "#base");
      const disabled = await computed(page, "#disabled");
      const icon = await computed(page, "#icon");
      const lightIconColor = await page
        .locator("#light-icon")
        .evaluate((el) => window.getComputedStyle(el).color);

      expect(focused.outlineStyle).toBe("solid");
      expect(focused.outlineWidth).toBe("2px");
      await expect
        .poll(async () => translateY((await computed(page, "#base")).translate))
        .toBe(-4);
      expect(disabled.pointerEvents).toBe("none");
      expect(Number.parseFloat(disabled.opacity)).toBeLessThanOrEqual(0.72);
      expect(icon.minWidth).toBe("44px");
      expect(icon.minHeight).toBe("44px");
      expect(lightIconColor).toBe(
        await resolvedTokenValue(
          page,
          "#icon",
          "--interactive-surface-light-icon-color-dark",
          "color",
        ),
      );
      await expectStateLayerOpacity(
        page,
        "#base",
        "--interactive-surface-state-layer-opacity-focus",
      );

      await page.locator("#base").hover();
      await expectStateLayerOpacity(
        page,
        "#base",
        "--interactive-surface-state-layer-opacity-hover",
      );

      await expectStateLayerOpacity(
        page,
        "#current",
        "--interactive-surface-state-layer-opacity-active",
      );

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setContent(htmlFor(order, "minimal-saas", "dark"));
      await page.locator("#base").hover();
      const reduced = await computed(page, "#base");

      expect(reduced.translate).toBe("none");
      // UI Style Kit uses a conventional 1ms cap; both supported orders remain effectively motionless.
      expect(Number.parseFloat(reduced.transitionDuration)).toBeLessThanOrEqual(
        0.001,
      );
    });

    test(`${order} preserves interaction and UI Kit paint transition ownership`, async ({
      page,
    }) => {
      await page.setContent(htmlFor(order, "minimal-saas", "dark"));
      const transition = await computed(page, "#base");

      expect(transitionProperties(transition.transitionProperty)).toEqual([
        "background-color",
        "border-color",
        "box-shadow",
        "color",
        "transform",
        "translate",
        "outline-color",
      ]);
      expect(transition.transitionDuration).toBe("0.14s");
      expect(transition.transitionTimingFunction).toBe(
        "cubic-bezier(0.2, 0, 0.2, 1)",
      );
      expect(transition.transitionDelay).toBe("0s");
    });

    test(`${order} keeps every resolved hover lift across representative UI systems`, async ({
      page,
    }) => {
      for (const system of geometrySystems) {
        await page.mouse.move(0, 0);
        await page.setContent(htmlFor(order, system, "dark"));
        await page.addStyleTag({
          content: ".interactive-surface { transition: none !important; }",
        });

        for (const liftCase of liftCases) {
          await page.mouse.move(0, 0);
          const baseY = await verticalPosition(page, liftCase.selector);
          await page.locator(liftCase.selector).hover();
          const hoverY = await verticalPosition(page, liftCase.selector);
          const transformY = await transformTranslateY(page, liftCase.selector);
          const context = `${order} ${system} ${liftCase.name}`;

          expect(baseY - hoverY, `${context} total lift`).toBeCloseTo(
            liftCase.expectedLift,
            1,
          );
          expect(transformY, `${context} UI Kit transform`).toBe(-1);
        }
      }
    });

    test(`${order} neutralizes package hover translation in forced colors`, async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await page.setContent(htmlFor(order, "minimal-saas", "dark"));
      await page.addStyleTag({
        content: "#base { transition: none !important; }",
      });
      await page.locator("#base").hover();

      expect(translateY((await computed(page, "#base")).translate)).toBe(0);
    });

    test(`${order} lets the state core preserve UI Style Kit paint`, async ({
      page,
    }) => {
      await page.setContent(htmlFor(order, "minimal-saas", "dark", ""));
      const baseline = {
        base: await computed(page, "#base"),
        level: await computed(page, "#level"),
        primary: await computed(page, "#primary"),
      };

      await page.setContent(
        htmlFor(order, "minimal-saas", "dark", stateCoreCss),
      );
      const withCore = {
        base: await computed(page, "#base"),
        level: await computed(page, "#level"),
        primary: await computed(page, "#primary"),
      };

      for (const surface of ["base", "level", "primary"] as const) {
        expect({
          backgroundColor: withCore[surface].backgroundColor,
          borderColor: withCore[surface].borderColor,
          borderRadius: withCore[surface].borderRadius,
          borderWidth: withCore[surface].borderWidth,
          boxShadow: withCore[surface].boxShadow,
          color: withCore[surface].color,
        }).toEqual({
          backgroundColor: baseline[surface].backgroundColor,
          borderColor: baseline[surface].borderColor,
          borderRadius: baseline[surface].borderRadius,
          borderWidth: baseline[surface].borderWidth,
          boxShadow: baseline[surface].boxShadow,
          color: baseline[surface].color,
        });
      }
    });
  }
});
