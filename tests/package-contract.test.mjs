import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const EXPECTED_NAME = "interactive-surface-css";
const EXPECTED_VERSION = "1.5.0";
const CHECKOUT_V4_SHA = "34e114876b0b11c390a56381ad16ebd13914f8d5";
const CHECKOUT_V5_SHA = "93cb6efe18208431cddfb8368fd83d5badbf9bfd";
const SETUP_NODE_V5_SHA = "a0853c24544627f65ddf259abe73b1d18a591444";
const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const manifestPath = path.join(repositoryRoot, "package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const expectedPackedFiles = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "assets/android-chrome-192x192.png",
  "assets/android-chrome-512x512.png",
  "assets/apple-touch-icon.png",
  "assets/browserconfig.xml",
  "assets/favicon-16x16.png",
  "assets/favicon-32x32.png",
  "assets/favicon-48x48.png",
  "assets/favicon-64x64.png",
  "assets/favicon.ico",
  "assets/maskable-icon-192x192.png",
  "assets/maskable-icon-512x512.png",
  "assets/mstile-150x150.png",
  "assets/site.webmanifest",
  "demo/demo.css",
  "demo/demo.js",
  "index.cjs",
  "index.html",
  "index.js",
  "interactive-surface.css",
  "manifest.json",
  "package.json",
  "standalone-preset.css",
  "state-core.css",
];

const expectedManifestFiles = expectedPackedFiles.filter(
  (file) => file !== "package.json",
);
const expectedExports = {
  ".": {
    require: "./index.cjs",
    import: "./index.js",
    default: "./index.js",
    style: "./interactive-surface.css",
  },
  "./interactive-surface.css": "./interactive-surface.css",
  "./state-core.css": "./state-core.css",
  "./standalone-preset.css": "./standalone-preset.css",
  "./manifest.json": "./manifest.json",
  "./index.html": "./index.html",
  "./index.cjs": "./index.cjs",
  "./package.json": "./package.json",
};

const expectedScripts = {
  "test:package": "node --test tests/package-contract.test.mjs",
  "check:public": "node ./scripts/build.mjs check-public",
  audit: "npm audit",
  "validate:node20": "npm run validate:ci",
  "validate:publish": [
    "npm run check:no-hex-colors",
    "npm run lint:css",
    "npm run check:public",
    "npm run build",
    "npm run check:generated",
    "npm run check:ownership",
    "npm run test:contracts",
    "npm run test:package",
    "npm run pack:dry",
  ].join(" && "),
  "validate:ci": "npm run validate:publish && npm run audit",
  validate: "npm run validate:ci",
  "validate:browsers":
    "npm run validate:ci && npm run test:install:chromium && npm run test:chromium",
  "validate:full": "npm run validate:ci && npm run test:install && npm test",
  prepublishOnly: "npm run validate:publish",
};

function locateNpmCli() {
  const executableDirectory = path.dirname(process.execPath);
  const candidates = [
    process.env.npm_execpath,
    path.join(executableDirectory, "node_modules", "npm", "bin", "npm-cli.js"),
    path.resolve(
      executableDirectory,
      "..",
      "lib",
      "node_modules",
      "npm",
      "bin",
      "npm-cli.js",
    ),
  ].filter(Boolean);
  const npmCli = candidates.find((candidate) => existsSync(candidate));

  assert.ok(
    npmCli,
    `Unable to locate npm's JavaScript CLI. Checked: ${candidates.join(", ")}`,
  );
  return npmCli;
}

function runNode(commandArgs, options, label) {
  const result = spawnSync(process.execPath, commandArgs, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });

  assert.ifError(result.error);
  assert.equal(
    result.status,
    0,
    `${label} exited with ${result.status}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assert.equal(
    result.signal,
    null,
    `${label} was terminated by ${result.signal}`,
  );
  return result.stdout;
}

function runNpm(args, options, label) {
  return runNode([locateNpmCli(), ...args], options, label);
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch (error) {
    assert.fail(
      `${label} did not return valid JSON: ${error.message}\n${output}`,
    );
  }
}

function normalizePackagePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function collectDocumentAssets(indexHtml, demoScript) {
  const references = [];
  const attributePattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  const metaConfigPattern =
    /<meta\b(?=[^>]*\bname\s*=\s*["']msapplication-config["'])(?=[^>]*\bcontent\s*=\s*["']([^"']+)["'])[^>]*>/gi;
  const fetchPattern = /\bfetch\s*\(\s*["']([^"']+)["']/gi;
  const embeddedReadmeScriptPattern =
    /<script\b[^>]*\bid=["']embeddedReadme["'][^>]*>[\s\S]*?<\/script>/gi;
  let documentMarkup = indexHtml;
  let previousMarkup;
  do {
    previousMarkup = documentMarkup;
    documentMarkup = documentMarkup.replace(embeddedReadmeScriptPattern, "");
  } while (documentMarkup !== previousMarkup);

  // README examples are inert text; only assets requested by the live document belong in this check.
  for (const match of documentMarkup.matchAll(attributePattern))
    references.push(match[1]);
  for (const match of documentMarkup.matchAll(metaConfigPattern))
    references.push(match[1]);
  for (const match of demoScript.matchAll(fetchPattern))
    references.push(match[1]);

  return references
    .filter((reference) => {
      return (
        reference &&
        !reference.startsWith("#") &&
        !reference.startsWith("/") &&
        !reference.startsWith("//") &&
        !/^[a-z][a-z\d+.-]*:/i.test(reference)
      );
    })
    .map((reference) => {
      const withoutFragment = decodeURIComponent(reference)
        .split(/[?#]/, 1)[0]
        .replaceAll("\\", "/");
      const normalized = path.posix.normalize(withoutFragment);

      assert.ok(
        normalized !== ".." &&
          !normalized.startsWith("../") &&
          !path.posix.isAbsolute(normalized),
        `Relative document asset escapes the package root: ${reference}`,
      );
      return normalizePackagePath(normalized);
    })
    .sort();
}

function collectReferencedAssetPaths(assetFile, assetSource) {
  const assetDirectory = path.posix.dirname(assetFile);
  const references = [];

  if (assetFile.endsWith(".webmanifest")) {
    const manifestDocument = JSON.parse(assetSource);

    for (const icon of manifestDocument.icons ?? []) {
      if (typeof icon.src === "string") references.push(icon.src);
    }
  } else if (assetFile.endsWith(".xml")) {
    for (const match of assetSource.matchAll(
      /\bsrc\s*=\s*["']([^"']+)["']/gi,
    )) {
      references.push(match[1]);
    }
  }

  return references
    .filter(
      (reference) =>
        reference &&
        !reference.startsWith("/") &&
        !/^[a-z][a-z\d+.-]*:/i.test(reference),
    )
    .map((reference) => {
      const normalized = path.posix.normalize(
        path.posix.join(assetDirectory, reference.replaceAll("\\", "/")),
      );

      assert.ok(
        normalized !== ".." &&
          !normalized.startsWith("../") &&
          !path.posix.isAbsolute(normalized),
        `Nested asset escapes the package root: ${assetFile} -> ${reference}`,
      );
      return normalizePackagePath(normalized);
    })
    .sort();
}

test("the release manifest and validation graph are pinned to 1.5.0", () => {
  assert.equal(manifest.name, EXPECTED_NAME);
  assert.equal(manifest.version, EXPECTED_VERSION);
  assert.deepEqual(
    [...manifest.files].sort(),
    [...expectedManifestFiles].sort(),
  );
  assert.deepEqual(manifest.exports, expectedExports);
  assert.deepEqual(manifest.directories, { test: "tests" });

  assert.equal(manifest.main, "./index.cjs");
  assert.equal(manifest.module, "./index.js");
  assert.equal(manifest.style, "./interactive-surface.css");
  assert.equal(manifest.unpkg, "./interactive-surface.css");
  assert.equal(manifest.jsdelivr, "./interactive-surface.css");
  assert.deepEqual(manifest.engines, { node: ">=20" });

  for (const [scriptName, command] of Object.entries(expectedScripts)) {
    assert.equal(
      manifest.scripts[scriptName],
      command,
      `Unexpected ${scriptName} script`,
    );
  }
});

test("the changelog records the complete 1.5.0 release immediately after Unreleased", async () => {
  const changelog = await readFile(
    path.join(repositoryRoot, "CHANGELOG.md"),
    "utf8",
  );
  const releaseHeading = `## ${EXPECTED_VERSION} - 2026-07-20`;
  const releaseMatches =
    changelog.match(
      new RegExp(`^${releaseHeading.replaceAll(".", "\\.")}$`, "gm"),
    ) ?? [];

  assert.match(
    changelog,
    new RegExp(
      `^## Unreleased\\s+${releaseHeading.replaceAll(".", "\\.")}$`,
      "m",
    ),
  );
  assert.equal(
    releaseMatches.length,
    1,
    `Expected exactly one ${releaseHeading} heading`,
  );

  const releaseStart = changelog.indexOf(releaseHeading);
  const nextRelease = changelog.indexOf(
    "\n## ",
    releaseStart + releaseHeading.length,
  );
  const releaseNotes = changelog.slice(
    releaseStart,
    nextRelease === -1 ? undefined : nextRelease,
  );

  for (const category of [
    "Added",
    "Changed",
    "Fixed",
    "Accessibility",
    "Documentation",
    "Testing",
  ]) {
    assert.match(
      releaseNotes,
      new RegExp(`^### ${category}\\r?\\n\\r?\\n- `, "m"),
    );
  }
});

test("the npm publishing workflow only accepts a matching published release", async () => {
  const workflow = await readFile(
    path.join(repositoryRoot, ".github", "workflows", "npm-publish.yml"),
    "utf8",
  );
  const releaseGuard = workflow.indexOf("- name: Validate release metadata");
  const dependencyInstall = workflow.indexOf("- name: Install dependencies");
  const packageValidation = workflow.indexOf(
    "- name: Validate publish package",
  );
  const packagePublish = workflow.indexOf("- name: Publish to npm");
  const guardProgramStart = workflow.indexOf("node <<'NODE'");
  const guardProgramEnd = workflow.indexOf(
    "\n          NODE",
    guardProgramStart,
  );
  const guardProgram = workflow.slice(guardProgramStart, guardProgramEnd);
  const anchoredHeadingPattern =
    "`^## ${escapedVersion} - " + String.raw`\\d{4}-\\d{2}-\\d{2}\\r?$` + "`";

  // Matching through the next top-level key prevents any second publish trigger from being added silently.
  assert.match(
    workflow,
    /^on:\r?\n {2}release:\r?\n {4}types: \[published\]\r?\n\r?\nconcurrency:/m,
  );
  assert.equal(
    (workflow.match(/^on:/gm) ?? []).length,
    1,
    "Expected exactly one workflow trigger block",
  );
  assert.doesNotMatch(workflow, /workflow_dispatch/);
  assert.match(
    workflow,
    new RegExp(
      `uses: actions/checkout@${CHECKOUT_V5_SHA} # v5\\r?\\n` +
        String.raw`\s+with:\r?\n\s+ref: \$\{\{ github\.event\.release\.tag_name \}\}`,
    ),
  );
  assert.match(
    workflow,
    /RELEASE_TAG: \$\{\{ github\.event\.release\.tag_name \}\}/,
  );
  assert.match(workflow, /process\.env\.RELEASE_TAG/);
  assert.ok(
    guardProgramStart !== -1 && guardProgramEnd !== -1,
    "Missing release guard program",
  );
  assert.doesNotMatch(guardProgram, /\$\{\{/);
  assert.match(workflow, /const expectedTag = `v\$\{manifest\.version\}`;/);
  assert.ok(
    guardProgram.includes(anchoredHeadingPattern),
    "The changelog guard must use an anchored dated heading",
  );
  assert.match(workflow, /releaseHeadings\.length !== 1/);
  assert.match(
    workflow,
    /permissions:\r?\n\s+contents: read\r?\n\s+id-token: write/,
  );
  assert.match(workflow, /run: npm run validate:publish/);
  assert.match(
    workflow,
    /run: npm publish --provenance --access public --ignore-scripts/,
  );
  assert.ok(
    releaseGuard !== -1 && releaseGuard < dependencyInstall,
    "Release metadata must be checked before npm ci",
  );
  assert.ok(
    dependencyInstall < packageValidation && packageValidation < packagePublish,
  );
});

test("GitHub workflows pin actions and continuously prove the minimum Node version", async () => {
  const workflowDirectory = path.join(repositoryRoot, ".github", "workflows");
  const workflows = {
    ci: await readFile(path.join(workflowDirectory, "ci.yaml"), "utf8"),
    browsers: await readFile(
      path.join(workflowDirectory, "browser-tests.yml"),
      "utf8",
    ),
    publish: await readFile(
      path.join(workflowDirectory, "npm-publish.yml"),
      "utf8",
    ),
    wiki: await readFile(path.join(workflowDirectory, "wiki-sync.yml"), "utf8"),
  };

  for (const workflow of Object.values(workflows)) {
    assert.doesNotMatch(
      workflow,
      /uses: actions\/(?:checkout|setup-node)@v\d+/,
    );
  }

  for (const workflow of [
    workflows.ci,
    workflows.browsers,
    workflows.publish,
  ]) {
    assert.match(
      workflow,
      new RegExp(`uses: actions/checkout@${CHECKOUT_V5_SHA} # v5`),
    );
    assert.match(
      workflow,
      new RegExp(`uses: actions/setup-node@${SETUP_NODE_V5_SHA} # v5`),
    );
  }

  assert.equal(
    (
      workflows.wiki.match(
        new RegExp(`uses: actions/checkout@${CHECKOUT_V4_SHA} # v4`, "g"),
      ) ?? []
    ).length,
    2,
  );
  assert.match(
    workflows.ci,
    /matrix:\r?\n\s+include:\r?\n\s+- node-version: 20\r?\n\s+validation-script: validate:node20\r?\n\s+- node-version: 22\r?\n\s+validation-script: validate:ci/,
  );
  assert.match(workflows.ci, /node-version: \$\{\{ matrix\.node-version \}\}/);
  assert.match(
    workflows.ci,
    /run: npm run \$\{\{ matrix\.validation-script \}\}/,
  );
});

test("the packed tarball contains only public files and resolves every export", async (t) => {
  const packDirectory = await mkdtemp(
    path.join(tmpdir(), "interactive-surface-pack-"),
  );
  const consumerDirectory = await mkdtemp(
    path.join(tmpdir(), "interactive-surface-consumer-"),
  );
  const consumerCache = path.join(consumerDirectory, ".npm-cache");

  t.after(async () => {
    await Promise.all([
      rm(packDirectory, { force: true, recursive: true }),
      rm(consumerDirectory, { force: true, recursive: true }),
    ]);
  });

  // Give nested repository-local temp directories their own package scope so Node cannot self-resolve the source checkout.
  await writeFile(
    path.join(consumerDirectory, "package.json"),
    `${JSON.stringify({ name: "interactive-surface-contract-consumer", private: true, type: "module" }, null, 2)}\n`,
  );

  const packOutput = runNpm(
    [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      packDirectory,
      "--cache",
      path.join(repositoryRoot, ".npm-cache"),
    ],
    { cwd: repositoryRoot },
    "npm pack",
  );
  const packResults = parseJson(packOutput, "npm pack");

  assert.equal(
    packResults.length,
    1,
    "npm pack must produce exactly one package",
  );
  const packedRelease = packResults[0];
  assert.equal(packedRelease.name, EXPECTED_NAME);
  assert.equal(packedRelease.version, EXPECTED_VERSION);
  assert.equal(packedRelease.id, `${EXPECTED_NAME}@${EXPECTED_VERSION}`);

  const tarballPath = path.resolve(packDirectory, packedRelease.filename);
  assert.equal(
    path.dirname(tarballPath),
    path.resolve(packDirectory),
    "Tarball escaped the temporary destination",
  );
  assert.equal((await stat(tarballPath)).isFile(), true);

  const packedFiles = packedRelease.files
    .map(({ path: file }) => normalizePackagePath(file))
    .sort();
  assert.deepEqual(packedFiles, expectedPackedFiles);

  for (const file of packedFiles) {
    assert.doesNotMatch(
      file,
      /^(?:dist|docs|styles|tests|\.npm-cache|\.superpowers)\//,
    );
    assert.doesNotMatch(
      file,
      /(?:^ISC logo\.png$|favicon-source\.png$|social_preview|\.tgz$)/,
    );
  }

  const indexHtml = await readFile(
    path.join(repositoryRoot, "index.html"),
    "utf8",
  );
  const demoScript = await readFile(
    path.join(repositoryRoot, "demo", "demo.js"),
    "utf8",
  );
  const documentAssets = collectDocumentAssets(indexHtml, demoScript);

  assert.deepEqual(documentAssets, [
    "README.md",
    "assets/apple-touch-icon.png",
    "assets/browserconfig.xml",
    "assets/favicon-16x16.png",
    "assets/favicon-32x32.png",
    "assets/favicon-48x48.png",
    "assets/favicon-64x64.png",
    "assets/favicon.ico",
    "assets/site.webmanifest",
    "demo/demo.css",
    "demo/demo.js",
    "standalone-preset.css",
  ]);
  for (const asset of documentAssets)
    assert.ok(packedFiles.includes(asset), `Unpacked document asset: ${asset}`);

  const nestedAssets = [
    ...collectReferencedAssetPaths(
      "assets/site.webmanifest",
      await readFile(
        path.join(repositoryRoot, "assets", "site.webmanifest"),
        "utf8",
      ),
    ),
    ...collectReferencedAssetPaths(
      "assets/browserconfig.xml",
      await readFile(
        path.join(repositoryRoot, "assets", "browserconfig.xml"),
        "utf8",
      ),
    ),
  ].sort();

  assert.deepEqual(nestedAssets, [
    "assets/android-chrome-192x192.png",
    "assets/android-chrome-512x512.png",
    "assets/maskable-icon-192x192.png",
    "assets/maskable-icon-512x512.png",
    "assets/mstile-150x150.png",
  ]);
  for (const asset of nestedAssets)
    assert.ok(packedFiles.includes(asset), `Unpacked nested asset: ${asset}`);

  runNpm(
    [
      "install",
      tarballPath,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      "--cache",
      consumerCache,
    ],
    { cwd: consumerDirectory },
    "consumer npm install",
  );

  const consumerProbe = path.join(consumerDirectory, "resolve-exports.mjs");
  const publicSpecifiers = Object.keys(expectedExports)
    .filter((subpath) => subpath !== ".")
    .map((subpath) => `${EXPECTED_NAME}${subpath.slice(1)}`);
  await writeFile(
    consumerProbe,
    `import { createRequire } from "node:module";\n` +
      `const require = createRequire(import.meta.url);\n` +
      `const specifiers = ${JSON.stringify([EXPECTED_NAME, ...publicSpecifiers])};\n` +
      `const result = { esm: {}, cjs: {} };\n` +
      `for (const specifier of specifiers) {\n` +
      `  result.esm[specifier] = await import.meta.resolve(specifier, import.meta.url);\n` +
      `  result.cjs[specifier] = require.resolve(specifier);\n` +
      `}\n` +
      `process.stdout.write(JSON.stringify(result));\n`,
    "utf8",
  );

  const resolutions = parseJson(
    runNode(
      ["--experimental-import-meta-resolve", consumerProbe],
      { cwd: consumerDirectory },
      "consumer export probe",
    ),
    "consumer export probe",
  );
  const installedRoot = path.join(
    consumerDirectory,
    "node_modules",
    EXPECTED_NAME,
  );
  const expectedTargets = new Map([
    [EXPECTED_NAME, { esm: "index.js", cjs: "index.cjs" }],
    ...Object.entries(expectedExports)
      .filter(([subpath]) => subpath !== ".")
      .map(([subpath, target]) => [
        `${EXPECTED_NAME}${subpath.slice(1)}`,
        { esm: target.slice(2), cjs: target.slice(2) },
      ]),
  ]);

  for (const [specifier, targets] of expectedTargets) {
    assert.equal(
      fileURLToPath(resolutions.esm[specifier]),
      path.join(installedRoot, targets.esm),
    );
    assert.equal(
      path.resolve(resolutions.cjs[specifier]),
      path.join(installedRoot, targets.cjs),
    );
  }

  const installedManifest = JSON.parse(
    await readFile(path.join(installedRoot, "package.json"), "utf8"),
  );
  assert.equal(installedManifest.name, EXPECTED_NAME);
  assert.equal(installedManifest.version, EXPECTED_VERSION);
  assert.equal(installedManifest.main, "./index.cjs");
  assert.equal(installedManifest.module, "./index.js");
  assert.equal(installedManifest.style, "./interactive-surface.css");
  assert.equal(installedManifest.unpkg, "./interactive-surface.css");
  assert.equal(installedManifest.jsdelivr, "./interactive-surface.css");
});
