import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generate, parse, walk } from "css-tree";

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
  "grid-area",
  "grid-template",
  "grid-template-areas",
  "grid-template-columns",
  "grid-template-rows",
  "order",
]);
const pageSelectorPattern =
  /(?:^|[-_.])(?:container|layout|main|page|shell|wrapper)(?:$|[-_ .:#[])/;
const majorPageProperties = new Set([
  "display",
  "inline-size",
  "margin",
  "max-inline-size",
  "max-width",
  "min-inline-size",
  "min-width",
  "padding",
  "position",
  "width",
]);
const paintProperties = new Set([
  "background",
  "background-color",
  "background-image",
  "border",
  "border-color",
  "border-bottom-color",
  "border-left-color",
  "border-right-color",
  "border-top-color",
  "box-shadow",
  "color",
  "fill",
  "outline-color",
  "stroke",
  "text-shadow",
]);
const chromaticNames = new Set([
  "aqua",
  "blue",
  "cyan",
  "fuchsia",
  "gold",
  "green",
  "lime",
  "magenta",
  "maroon",
  "navy",
  "olive",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "yellow",
]);

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

function containsChromaticLiteral(value) {
  let chromatic = false;

  /* CSS variables stay theme-neutral unless their fallback embeds chromatic paint. */
  walk(value, {
    enter(node) {
      if (node.type === "Hash" && hexIsChromatic(node.value)) chromatic = true;
      if (
        node.type === "Identifier" &&
        chromaticNames.has(node.name.toLowerCase())
      ) {
        chromatic = true;
      }
      if (node.type !== "Function") return;

      const channels = functionChannels(node);
      if (
        ["rgb", "rgba"].includes(node.name.toLowerCase()) &&
        channels.length >= 3
      ) {
        if (channels[0] !== channels[1] || channels[1] !== channels[2])
          chromatic = true;
      }
      if (
        ["hsl", "hsla"].includes(node.name.toLowerCase()) &&
        channels.length >= 2
      ) {
        if (channels[1] !== 0) chromatic = true;
      }
    },
  });

  return chromatic;
}

function violationRule({ selector, declaration }) {
  if (pageTopologyProperties.has(declaration.property))
    return "interactive-page-topology";
  if (
    pageSelectorPattern.test(selector) &&
    majorPageProperties.has(declaration.property)
  ) {
    return "interactive-page-topology";
  }
  if (declaration.property === "font-family")
    return "interactive-branded-paint";

  const paintToken =
    declaration.property.startsWith("--") &&
    /(?:bg|color|fg|highlight|paint|shadow)$/.test(declaration.property);
  if (
    (paintProperties.has(declaration.property) || paintToken) &&
    containsChromaticLiteral(declaration.value)
  ) {
    return "interactive-branded-paint";
  }

  return null;
}

export function auditOwnership({ css, allowlist, now = new Date() }) {
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

        const ruleName = violationRule({ selector, declaration: node });
        if (!ruleName) return;

        const key = entryKey({ selector, property: node.property });
        if (allowlistByKey.has(key)) {
          matchedKeys.add(key);
          return;
        }

        violations.push({
          target: "state-core",
          selector,
          property: node.property,
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
  const allowlist = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "ownership-allowlist.json"), "utf8"),
  );
  const result = auditOwnership({
    css: fs.readFileSync(path.join(packageRoot, "state-core.css"), "utf8"),
    allowlist: allowlist["state-core"],
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
