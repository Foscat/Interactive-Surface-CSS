import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryUrl = "https://github.com/Foscat/Interactive-Surface-CSS";
const wikiUrl = `${repositoryUrl}/wiki`;
const labUrl = "https://foscat.github.io/interface-systems-lab/";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...segments) =>
  fs
    .readFileSync(path.join(root, ...segments), "utf8")
    .replaceAll("\r\n", "\n");

const readme = read("README.md");
const index = read("index.html");
const manifest = JSON.parse(read("package.json"));
const wiki = {
  home: read("wiki", "Home.md"),
  gettingStarted: read("wiki", "Getting-Started.md"),
  installation: read("wiki", "Installation-and-Usage.md"),
  api: read("wiki", "API-Reference.md"),
  tokens: read("wiki", "Token-Reference.md"),
  accessibility: read("wiki", "Accessibility.md"),
  testing: read("wiki", "Testing-and-Quality.md"),
  publishing: read("wiki", "Publishing-and-Releases.md"),
  roadmap: read("wiki", "Roadmap.md"),
  faq: read("wiki", "FAQ.md"),
  contributing: read("wiki", "Contributing.md"),
  sidebar: read("wiki", "_Sidebar.md"),
  footer: read("wiki", "_Footer.md"),
};
const allDocumentation = [readme, ...Object.values(wiki)].join("\n");
const authoredCss = [
  read("styles", "state-core.css"),
  read("styles", "standalone-preset.css"),
].join("\n");
const publicTokens = new Set(
  authoredCss.match(/--interactive-surface-[a-z0-9-]+/g),
);
const compatibilityTokens = new Set(
  authoredCss
    .match(/--[a-z][a-z0-9-]+/g)
    .filter(
      (token) =>
        !token.startsWith("--interactive-surface-") &&
        !token.startsWith("--_is-"),
    ),
);

// Documentation URLs are parsed locally so release checks never depend on network availability.
function assertPublicHttpsUrl(value) {
  const url = new URL(value);
  assert.equal(url.protocol, "https:");
  assert.ok(url.hostname.length > 0);
}

function assertAppearsInOrder(source, values) {
  let cursor = -1;

  for (const value of values) {
    const next = source.indexOf(value, cursor + 1);
    assert.ok(
      next > cursor,
      `${value} must appear in the documented npm-reader order`,
    );
    cursor = next;
  }
}

// The machine-readable table keeps human-facing package resolution guidance synchronized with npm.
function readPackageResolutionRows(source) {
  const match = source.match(
    /<!-- package-resolution-contract:start -->\n([\s\S]*?)\n<!-- package-resolution-contract:end -->/,
  );
  assert.ok(
    match,
    "API reference must contain the package resolution contract table",
  );

  return [...match[1].matchAll(/^\| `([^`]+)` \| `([^`]+)` \|$/gm)].map(
    ([, key, value]) => [key, value],
  );
}

test("README is an npm-first guide with durable project links", () => {
  [
    "https://foscat.github.io/Interactive-Surface-CSS/",
    labUrl,
    `${wikiUrl}/Home`,
    `${wikiUrl}/API-Reference`,
    `${wikiUrl}/Accessibility`,
    `${repositoryUrl}/blob/main/CHANGELOG.md`,
    `${repositoryUrl}/blob/main/CONTRIBUTING.md`,
    `${repositoryUrl}/blob/main/SECURITY.md`,
    `${repositoryUrl}/blob/main/LICENSE`,
  ].forEach((url) => {
    assertPublicHttpsUrl(url);
    assert.ok(readme.includes(url), `README is missing durable URL: ${url}`);
  });

  assertAppearsInOrder(readme, [
    "## Start here",
    "## Ownership",
    "## 60-second standalone setup",
    "## Semantic recipes",
    "## Entry points",
    "## Compact API",
    "## Customize tokens",
    "## Accessibility responsibilities",
    "## Pair with UI Style Kit CSS",
    "## Use all three libraries",
    "## Support and project links",
  ]);

  for (const [, destination] of readme.matchAll(/\]\(([^)]+)\)/g)) {
    assertPublicHttpsUrl(destination);
  }
});

test("README documents every supported entry point and a pinned CDN setup", () => {
  [
    'import "interactive-surface-css";',
    'import "interactive-surface-css/interactive-surface.css";',
    'import "interactive-surface-css/state-core.css";',
    'import "interactive-surface-css/standalone-preset.css";',
    `${manifest.name}@${manifest.version}/standalone-preset.css`,
  ].forEach((value) =>
    assert.ok(readme.includes(value), `README is missing: ${value}`),
  );

  const pinnedVersions = [
    ...readme.matchAll(/interactive-surface-css@(\d+\.\d+\.\d+)\//g),
  ].map((match) => match[1]);
  assert.ok(
    pinnedVersions.length >= 2,
    "README must show pinned jsDelivr and unpkg examples",
  );
  pinnedVersions.forEach((version) => assert.equal(version, manifest.version));
  ["https://cdn.jsdelivr.net/npm/", "https://unpkg.com/"].forEach((host) =>
    assert.ok(
      readme.includes(
        `${host}${manifest.name}@${manifest.version}/standalone-preset.css`,
      ),
      `README is missing the ${host} manifest-version CDN pin`,
    ),
  );

  assert.match(
    readme,
    /@latest[^\n]*(opt-in|unpinned)|(opt-in|unpinned)[^\n]*@latest/i,
  );
  assert.doesNotMatch(readme, /all three companion CSS libraries/i);
  ["`main`", "`module`", "`style`", "`unpkg`", "`jsdelivr`"].forEach((field) =>
    assert.ok(
      wiki.api.includes(field),
      `API reference is missing package metadata field: ${field}`,
    ),
  );
});

test("API package resolution matches package.json exactly", () => {
  const manifestFields = ["main", "module", "style", "unpkg", "jsdelivr"];
  const expectedRows = [
    ...manifestFields.map((field) => [field, manifest[field]]),
    ...Object.entries(manifest.exports).map(([key, target]) => [
      `exports[${JSON.stringify(key)}]`,
      typeof target === "string" ? target : JSON.stringify(target),
    ]),
  ];

  assert.deepEqual(readPackageResolutionRows(wiki.api), expectedRows);
});

test("README teaches the complete semantic and ecosystem contract", () => {
  [
    'aria-pressed="true"',
    'aria-current="page"',
    'aria-selected="true"',
    'aria-busy="true"',
    "disabled",
    'aria-disabled="true"',
    ".is-disabled",
    'input class="interactive-surface variant-subtle" type="file"',
    "::file-selector-button",
    "data-surface-variant",
    "data-surface-level",
    "icon-only",
    "data-icon-role",
  ].forEach((value) =>
    assert.ok(
      readme.includes(value),
      `README is missing semantic API: ${value}`,
    ),
  );

  assert.match(readme, /native `disabled`[^\n]*preferred/i);
  assert.match(
    readme,
    /suppress activation[^\n]*`aria-disabled="true"`[^\n]*`.is-disabled`/i,
  );
  assert.match(readme, /use one[^\n]*use two[^\n]*use all three/i);

  const allThreeOrder = [
    'import "ui-style-kit-css/with-bridge.css";',
    'import "interactive-surface-css/state-core.css";',
    'import "layout-style-css/bridge.css";',
    'import "layout-style-css";',
  ];
  assertAppearsInOrder(
    readme.slice(readme.indexOf("## Use all three libraries")),
    allThreeOrder,
  );
});

test("wiki API, token, and accessibility references cover the 1.4.0 contract", () => {
  assert.ok(
    wiki.api.includes(
      "`.size-sm`: default lift with a compact shadow profile.",
    ),
    "API reference must describe the size-sm lift accurately",
  );
  assert.doesNotMatch(wiki.api, /\.size-sm[^\n]*compact lift/i);

  [
    'aria-pressed="mixed"',
    '[aria-current]:not([aria-current="false"])',
    'aria-selected="true"',
    'aria-busy="true"',
    ".is-loading",
    ":disabled",
    'aria-disabled="true"',
    ".is-disabled",
    'input[type="file"].interactive-surface::file-selector-button',
    "data-surface-variant",
    "data-surface-level",
    "data-icon-role",
  ].forEach((value) =>
    assert.ok(wiki.api.includes(value), `API reference is missing: ${value}`),
  );

  [
    "Core defaults",
    "Standalone preset defaults",
    "--interactive-surface-state-layer-color",
    "--interactive-surface-motion-default",
    "--interactive-surface-disabled-opacity",
    "--interactive-surface-variant-primary-bg",
    "--interactive-surface-level-1-bg",
    "--interactive-surface-light-icon-color",
  ].forEach((value) =>
    assert.ok(
      wiki.tokens.includes(value),
      `Token reference is missing: ${value}`,
    ),
  );

  for (const token of publicTokens) {
    assert.ok(
      wiki.tokens.includes(token),
      `Token reference is missing authored token: ${token}`,
    );
  }

  for (const token of compatibilityTokens) {
    assert.ok(
      wiki.tokens.includes(token),
      `Token reference is missing compatibility token: ${token}`,
    );
  }

  [
    'aria-pressed="mixed"',
    "aria-current",
    "aria-selected",
    "aria-busy",
    "native `disabled`",
    'aria-disabled="true"',
    "`.is-disabled`",
    "suppress activation",
    "reduced motion",
    "forced colors",
  ].forEach((value) =>
    assert.ok(
      wiki.accessibility.toLowerCase().includes(value.toLowerCase()),
      `Accessibility guide is missing: ${value}`,
    ),
  );
});

test("wiki installation and quality guidance matches the release-candidate package", () => {
  [
    wiki.home,
    wiki.gettingStarted,
    wiki.installation,
    wiki.publishing,
    wiki.roadmap,
  ].forEach((document) => {
    assert.ok(
      document.includes("1.4.0"),
      "Release-facing wiki page must identify 1.4.0",
    );
    assert.match(document, /release candidate/i);
  });

  assert.ok(wiki.installation.includes(labUrl));
  assert.match(wiki.installation, /use one[^\n]*use two[^\n]*use all three/i);
  assertAppearsInOrder(wiki.installation, [
    'import "ui-style-kit-css/with-bridge.css";',
    'import "interactive-surface-css/state-core.css";',
    'import "layout-style-css/bridge.css";',
    'import "layout-style-css";',
  ]);

  assert.match(
    wiki.testing,
    /`npm run (validate|validate:ci)`[^#]*static[^#]*package[^#]*audit/i,
  );
  assert.match(wiki.testing, /`npm run validate:browsers`[^#]*Chromium/i);
  assert.match(
    wiki.testing,
    /`npm run validate:full`[^#]*Chromium[^#]*Firefox[^#]*WebKit/i,
  );
  assert.match(readme, /Node\.js 20\+/);
  assert.match(wiki.testing, /Node\.js 20[^#]*Node\.js 22/i);
  assert.match(wiki.testing, /`npm run validate:node20`/);
  assert.doesNotMatch(allDocumentation, /Node\.js 18|validate:node18/);
});

test("public docs contain no stale 1.x guidance", () => {
  assert.doesNotMatch(allDocumentation, /\]\(\.\/wiki\//);
  assert.doesNotMatch(allDocumentation, /example\.html/);
  assert.doesNotMatch(allDocumentation, /\.surface-card/);
  assert.doesNotMatch(
    allDocumentation,
    /only transform-based motion owner|owns transform-based motion|warn against extra transforms/i,
  );
  assert.doesNotMatch(
    allDocumentation,
    /interactive-surface-css@latest\/(?![^\n]*(?:opt-in|unpinned))/i,
  );
});

test("every maintained wiki surface points at current documentation", () => {
  [wiki.faq, wiki.contributing, wiki.sidebar, wiki.footer].forEach(
    (document) => {
      assert.ok(
        document.includes(wikiUrl),
        "Wiki navigation must use an absolute GitHub Wiki URL",
      );
    },
  );

  assert.ok(wiki.sidebar.includes(labUrl));
  assert.ok(wiki.footer.includes(labUrl));
});

test("public Markdown links have deterministic absolute URL shapes", () => {
  let linkCount = 0;

  for (const [, destination] of allDocumentation.matchAll(/\]\(([^)]+)\)/g)) {
    assertPublicHttpsUrl(destination);
    linkCount += 1;
  }

  assert.ok(linkCount > 0, "Documentation must expose public links");
});

test("the demo's offline README fallback cannot drift from README.md", () => {
  const match = index.match(
    /<script id="embeddedReadme" type="text\/markdown">\n([\s\S]*?)\n\s*<\/script>/,
  );
  assert.ok(match, "index.html must contain the embedded README fallback");
  assert.equal(match[1].trim(), readme.trim());
});
