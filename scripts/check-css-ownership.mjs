import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  generate,
  lexer,
  parse,
  property as describeProperty,
  walk,
} from "css-tree";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const allowlistFields = [
  "owner",
  "property",
  "reason",
  "reviewDate",
  "selector",
];
const pageTopologyProperties = new Set([
  "grid",
  "grid-area",
  "grid-auto-columns",
  "grid-auto-flow",
  "grid-auto-rows",
  "grid-column",
  "grid-column-end",
  "grid-column-start",
  "grid-row",
  "grid-row-end",
  "grid-row-start",
  "grid-template",
  "grid-template-areas",
  "grid-template-columns",
  "grid-template-rows",
  "order",
]);
const majorPageProperties = new Set([
  "block-size",
  "bottom",
  "clear",
  "display",
  "float",
  "height",
  "inline-size",
  "inset",
  "inset-block",
  "inset-block-end",
  "inset-block-start",
  "inset-inline",
  "inset-inline-end",
  "inset-inline-start",
  "left",
  "margin",
  "margin-block",
  "margin-block-end",
  "margin-block-start",
  "margin-inline",
  "margin-inline-end",
  "margin-inline-start",
  "max-block-size",
  "max-height",
  "max-inline-size",
  "max-width",
  "min-block-size",
  "min-height",
  "min-inline-size",
  "min-width",
  "padding",
  "place-self",
  "position",
  "right",
  "top",
  "width",
]);
const nativeStatePseudos = new Set([
  "active",
  "any-link",
  "checked",
  "disabled",
  "enabled",
  "focus",
  "focus-visible",
  "focus-within",
  "hover",
  "indeterminate",
  "invalid",
  "open",
  "optional",
  "placeholder-shown",
  "popover-open",
  "read-only",
  "read-write",
  "required",
  "target",
  "user-invalid",
  "valid",
  "visited",
]);
const commonStateClasses = new Set([
  "is-active",
  "is-busy",
  "is-checked",
  "is-disabled",
  "is-loading",
  "is-open",
  "is-pressed",
  "is-selected",
]);
// Reflected native attributes are state selectors even when no pseudo-class is used.
const stateAttributes = new Set([
  "checked",
  "disabled",
  "hidden",
  "open",
  "readonly",
  "required",
  "selected",
  "aria-busy",
  "aria-checked",
  "aria-current",
  "aria-disabled",
  "aria-expanded",
  "aria-hidden",
  "aria-invalid",
  "aria-pressed",
  "aria-selected",
  "data-active",
  "data-checked",
  "data-disabled",
  "data-loading",
  "data-pressed",
  "data-selected",
  "data-state",
]);
const sharedStateClassVocabulary = new Set([
  "active",
  "any-link",
  "busy",
  "busy-loading",
  "checked",
  "current",
  "disabled",
  "enabled",
  "expanded",
  "focus",
  "focus-visible",
  "focus-within",
  "hidden",
  "hover",
  "indeterminate",
  "invalid",
  "loading",
  "open",
  "optional",
  "persistent",
  "placeholder-shown",
  "popover-open",
  "pressed",
  "read-only",
  "read-write",
  "readonly",
  "required",
  "selected",
  "target",
  "user-invalid",
  "valid",
  "visited",
]);
const neutralColorNames = new Set([
  "black",
  "currentcolor",
  "darkgray",
  "darkgrey",
  "dimgray",
  "dimgrey",
  "gainsboro",
  "gray",
  "grey",
  "lightgray",
  "lightgrey",
  "silver",
  "transparent",
  "white",
  "whitesmoke",
]);
const systemColorPattern =
  /^(?:accentcolor|accentcolortext|activetext|buttonborder|buttonface|buttontext|canvas|canvastext|field|fieldtext|graytext|highlight|highlighttext|linktext|mark|marktext|selecteditem|selecteditemtext|visitedtext)$/;

function propertyContract(propertyName) {
  const described = describeProperty(propertyName);
  return {
    custom: described.custom,
    name: described.custom ? propertyName : described.basename,
  };
}

function entryKey({ selector, property }) {
  return `${selector}\u0000${property}`;
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value)
  );
}

export function validateAllowlist({ entries, now = new Date() }) {
  if (!Array.isArray(entries))
    throw new Error("state-core allowlist must be an array.");

  // Strict metadata keeps accessibility fallbacks reviewable without granting broad paint ownership.
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("state-core allowlist entries must be objects.");
    }

    const fields = Object.keys(entry).sort();
    if (fields.join("\u0000") !== allowlistFields.join("\u0000")) {
      throw new Error(
        `state-core allowlist entries must contain exactly ${allowlistFields.join(", ")}.`,
      );
    }
    if (allowlistFields.some((field) => typeof entry[field] !== "string")) {
      throw new Error("state-core allowlist entries must use string fields.");
    }
    if (entry.selector.includes("*") || entry.property.includes("*")) {
      throw new Error(
        "state-core allowlist entries must not contain wildcards.",
      );
    }
    if (!entry.selector.trim() || !entry.property.trim()) {
      throw new Error(
        "state-core selector and property must be exact non-empty values.",
      );
    }
    if (entry.owner !== "interactive-surface-css") {
      throw new Error(
        "state-core allowlist owner must be interactive-surface-css.",
      );
    }
    if (entry.reason.trim().length < 24) {
      throw new Error(
        "state-core allowlist entries require a professional reason.",
      );
    }
    if (!isIsoDate(entry.reviewDate)) {
      throw new Error("state-core allowlist reviewDate must be an ISO date.");
    }

    const reviewTime = new Date(`${entry.reviewDate}T00:00:00Z`).valueOf();
    const ageDays = (now.valueOf() - reviewTime) / 86_400_000;
    if (ageDays < 0 || ageDays > 366) {
      throw new Error(
        `state-core allowlist entry has a stale reviewDate: ${entry.reviewDate}.`,
      );
    }

    const key = entryKey(entry);
    if (seen.has(key)) {
      throw new Error(
        `state-core allowlist has a duplicate selector and property: ${entry.selector} ${entry.property}.`,
      );
    }
    seen.add(key);
  }
}

function hexIsChromatic(value) {
  const expanded =
    value.length <= 4
      ? value
          .slice(0, 3)
          .split("")
          .map((digit) => `${digit}${digit}`)
      : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
  const [red, green, blue] = expanded.map((channel) =>
    Number.parseInt(channel, 16),
  );
  return red !== green || green !== blue;
}

function functionChannels(node) {
  const channels = [];
  node.children.forEach((child) => {
    if (child.type === "Number" || child.type === "Percentage") {
      channels.push(Number.parseFloat(child.value));
    }
  });
  return channels;
}

function colorNodeIsChromatic(node) {
  const text = generate(node);
  if (!lexer.matchType("color", text).matched) return false;

  const lower = text.toLowerCase();
  if (neutralColorNames.has(lower)) return false;
  if (node.type === "Identifier") {
    // System colors are accessibility-dependent rather than package branding.
    return !systemColorPattern.test(lower);
  }
  if (node.type === "Hash") return hexIsChromatic(node.value);
  if (node.type !== "Function") return true;

  const channels = functionChannels(node);
  const functionName = node.name.toLowerCase();
  if (["rgb", "rgba"].includes(functionName) && channels.length >= 3) {
    return channels[0] !== channels[1] || channels[1] !== channels[2];
  }
  if (["hsl", "hsla"].includes(functionName) && channels.length >= 2) {
    return channels[1] !== 0;
  }
  if (["lab", "oklab"].includes(functionName) && channels.length >= 3) {
    return channels[1] !== 0 || channels[2] !== 0;
  }
  if (["lch", "oklch"].includes(functionName) && channels.length >= 2) {
    return channels[1] !== 0;
  }

  return true;
}

function containsChromaticLiteral(value) {
  let chromatic = false;

  /* Parser grammar covers named, legacy, and modern color functions inside variable fallbacks. */
  walk(value, {
    enter(node) {
      if (["Function", "Hash", "Identifier"].includes(node.type) &&
          colorNodeIsChromatic(node)) chromatic = true;
    },
  });

  return chromatic;
}

function colorNodeIsDirectLiteral(node) {
  if (
    node.type === "Function" &&
    ["env", "var"].includes(node.name.toLowerCase())
  ) {
    return false;
  }

  const text = generate(node);
  if (!lexer.matchType("color", text).matched) return false;
  const lower = text.toLowerCase();
  return lower !== "currentcolor" && !systemColorPattern.test(lower);
}

function containsDirectLiteralPaint(value) {
  let literal = false;

  // A token reference is neutral, but a literal fallback still paints when the token is absent.
  walk(value, {
    enter(node) {
      if (
        ["Function", "Hash", "Identifier"].includes(node.type) &&
        colorNodeIsDirectLiteral(node)
      ) {
        literal = true;
      }
    },
  });
  return literal;
}

function containsImage(value) {
  let image = false;
  walk(value, {
    enter(node) {
      if (node.type === "Url") image = true;
      if (node.type === "Function" &&
          /(?:gradient|image|paint|cross-fade|element|url)/.test(node.name.toLowerCase())) {
        image = true;
      }
    },
  });
  return image;
}

function selectorOwnsPageTopology(rule) {
  const structuralNames = new Set([
    "container",
    "content",
    "grid",
    "layout",
    "main",
    "page",
    "section",
    "shell",
    "split",
    "stack",
    "wrapper",
  ]);
  let pageRoot = false;

  walk(rule.prelude, {
    enter(node) {
      if (node.type === "TypeSelector" &&
          ["body", "html", "main", "section"].includes(node.name.toLowerCase())) {
        pageRoot = true;
      }
      if (node.type === "IdSelector" &&
          ["app", "layout", "main", "page", "root", "shell"].includes(node.name.toLowerCase())) {
        pageRoot = true;
      }
      if (node.type === "ClassSelector" &&
          node.name.split(/[-_]/).some((segment) => structuralNames.has(segment))) {
        pageRoot = true;
      }
      if (node.type === "AttributeSelector") {
        const name = node.name.name.toLowerCase();
        const value = node.value?.name?.toLowerCase() ?? node.value?.value?.toLowerCase();
        if (["data-layout", "data-page", "data-shell"].includes(name) ||
            (name === "role" && value === "main")) pageRoot = true;
      }
    },
  });

  return pageRoot;
}

function manifestStateClasses(manifest) {
  const stateSuffixes = new Set([...commonStateClasses].map((name) => name.replace(/^is-/, "")));
  const manifestClasses = new Set([
    ...(manifest.selectors?.stateClasses ?? []),
    ...(manifest.classApi?.stateClasses ?? []),
  ].map((selector) => selector.replace(/^\./, "").toLowerCase()));

  for (const preset of manifest.presets ?? []) {
    const suffixes = [
      ...(manifest.classApi?.universalVisualSuffixes ?? []),
      ...(manifest.classApi?.presetExtras?.[preset.id] ?? []),
    ];
    for (const suffix of suffixes) {
      if (
        stateSuffixes.has(suffix) ||
        [...stateSuffixes].some((state) => suffix.endsWith(`-${state}`))
      ) {
        manifestClasses.add(`${preset.prefix}-${suffix}`.toLowerCase());
      }
    }
  }

  return manifestClasses;
}

function selectorHasState(rule, manifest) {
  const manifestClasses = manifestStateClasses(manifest);
  const exactStateClasses = new Set([
    ...commonStateClasses,
    ...sharedStateClassVocabulary,
    ...manifestClasses,
  ]);
  const stateVocabulary = new Set([
    ...sharedStateClassVocabulary,
    ...manifestClasses,
  ]);
  let stateful = false;

  walk(rule.prelude, {
    enter(node) {
      if (node.type === "PseudoClassSelector" && nativeStatePseudos.has(node.name.toLowerCase())) {
        stateful = true;
      }
      if (node.type === "ClassSelector") {
        const className = node.name.toLowerCase();
        const hasBoundarySuffix = [...stateVocabulary].some(
          (state) =>
            className.endsWith(`-${state}`) || className.endsWith(`_${state}`),
        );
        if (exactStateClasses.has(className) || hasBoundarySuffix) stateful = true;
      }
      if (node.type === "AttributeSelector" && stateAttributes.has(node.name.name.toLowerCase())) {
        stateful = true;
      }
    },
  });
  return stateful;
}

export function matchesStateSelector(selector, manifest = {}) {
  const ast = parse(`${selector} {}`, { filename: "state-selector" });
  let stateful = false;

  // The exported probe keeps the shared selector vocabulary directly testable in state-owning builds.
  walk(ast, {
    visit: "Rule",
    enter(rule) {
      if (selectorHasState(rule, manifest)) stateful = true;
    },
  });
  return stateful;
}

function violationRule({ rule, property, value, manifest }) {
  if (pageTopologyProperties.has(property.name))
    return "interactive-page-topology";
  if (
    selectorOwnsPageTopology(rule) &&
    majorPageProperties.has(property.name)
  ) {
    return "interactive-page-topology";
  }
  if (property.name === "font-family")
    return "interactive-branded-paint";

  const hasChromaticPaint = containsChromaticLiteral(value);
  const hasDirectLiteralPaint = containsDirectLiteralPaint(value);
  const hasImage = containsImage(value);
  if (property.custom && (hasChromaticPaint || hasImage)) {
    return "interactive-branded-paint";
  }
  if (
    /^(?:background|mask)(?:-|$)/.test(property.name) &&
    (hasDirectLiteralPaint || hasImage)
  ) {
    return "interactive-branded-paint";
  }
  if (
    /^(?:border|outline|text-decoration)(?:-|$)/.test(property.name) &&
    (hasDirectLiteralPaint || hasImage)
  ) {
    return "interactive-branded-paint";
  }
  if (
    ["color", "fill", "stroke", "box-shadow", "text-shadow"].includes(property.name) &&
    hasDirectLiteralPaint
  ) {
    return "interactive-branded-paint";
  }
  if (["filter", "backdrop-filter"].includes(property.name) && generate(value).trim() !== "none") {
    return "interactive-branded-paint";
  }

  // State mechanics remain package-owned; this shared AST contract prevents selector drift.
  selectorHasState(rule, manifest);

  return null;
}

export function auditOwnership({ css, manifest = {}, allowlist, now = new Date() }) {
  validateAllowlist({ entries: allowlist, now });

  const ast = parse(css, {
    filename: "state-core",
    parseCustomProperty: true,
    positions: true,
  });
  const allowlistByKey = new Map(
    allowlist.map((entry) => [entryKey(entry), entry]),
  );
  const matchedKeys = new Set();
  const violations = [];
  let declarationCount = 0;

  walk(ast, {
    visit: "Rule",
    enter(rule) {
      const selector = generate(rule.prelude);
      rule.block.children.forEach((node) => {
        if (node.type !== "Declaration") return;
        declarationCount += 1;

        const property = propertyContract(node.property);
        const ruleName = violationRule({
          rule,
          property,
          value: node.value,
          manifest,
        });
        if (!ruleName) return;

        const key = entryKey({ selector, property: property.name });
        if (allowlistByKey.has(key)) {
          matchedKeys.add(key);
          return;
        }

        violations.push({
          target: "state-core",
          selector,
          property: property.name,
          line: node.loc.start.line,
          rule: ruleName,
        });
      });
    },
  });

  for (const entry of allowlist) {
    if (!matchedKeys.has(entryKey(entry))) {
      throw new Error(
        `state-core allowlist entry does not match a forbidden declaration: ${entry.selector} ${entry.property}.`,
      );
    }
  }

  return {
    declarationCount,
    matchedAllowlistCount: matchedKeys.size,
    violations,
  };
}

function run() {
  const startedAt = performance.now();
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "manifest.json"), "utf8"),
  );
  const allowlist = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "ownership-allowlist.json"), "utf8"),
  );
  const result = auditOwnership({
    css: fs.readFileSync(path.join(packageRoot, "state-core.css"), "utf8"),
    allowlist: allowlist["state-core"],
    manifest,
  });

  if (result.violations.length > 0) {
    const details = result.violations
      .map(
        ({ selector, property, line, rule }) =>
          `state-core.css:${line} ${selector} ${property} (${rule})`,
      )
      .join("\n");
    throw new Error(`CSS ownership violations:\n${details}`);
  }

  const duration = Math.round(performance.now() - startedAt);
  console.log(
    `CSS ownership passed for ${result.declarationCount} declarations with ${result.matchedAllowlistCount} reviewed exceptions in ${duration}ms.`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
