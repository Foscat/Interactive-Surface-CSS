import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const EXPECTED_NAME = "interactive-surface-css";
const EXPECTED_VERSION = "1.4.0";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repositoryRoot, "package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const expectedPackedFiles = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "demo/demo.css",
  "demo/demo.js",
  "index.cjs",
  "index.html",
  "index.js",
  "interactive-surface.css",
  "package.json",
  "standalone-preset.css",
  "state-core.css"
];

const expectedManifestFiles = expectedPackedFiles.filter((file) => file !== "package.json");
const expectedExports = {
  ".": {
    require: "./index.cjs",
    import: "./index.js",
    default: "./index.js",
    style: "./interactive-surface.css"
  },
  "./interactive-surface.css": "./interactive-surface.css",
  "./state-core.css": "./state-core.css",
  "./standalone-preset.css": "./standalone-preset.css",
  "./index.html": "./index.html",
  "./index.cjs": "./index.cjs",
  "./package.json": "./package.json"
};

const expectedScripts = {
  "test:package": "node --test tests/package-contract.test.mjs",
  audit: "npm audit",
  "validate:publish": [
    "npm run check:no-hex-colors",
    "npm run lint:css",
    "npm run check:generated",
    "npm run build",
    "npm run check:generated",
    "npm run test:contracts",
    "npm run test:package",
    "npm run pack:dry"
  ].join(" && "),
  "validate:ci": "npm run validate:publish && npm run audit",
  validate: "npm run validate:ci",
  "validate:browsers":
    "npm run validate:ci && npm run test:install:chromium && npm run test:chromium",
  "validate:full": "npm run validate:ci && npm run test:install && npm test",
  prepublishOnly: "npm run validate:publish"
};

function locateNpmCli() {
  const executableDirectory = path.dirname(process.execPath);
  const candidates = [
    process.env.npm_execpath,
    path.join(executableDirectory, "node_modules", "npm", "bin", "npm-cli.js"),
    path.resolve(executableDirectory, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js")
  ].filter(Boolean);
  const npmCli = candidates.find((candidate) => existsSync(candidate));

  assert.ok(npmCli, `Unable to locate npm's JavaScript CLI. Checked: ${candidates.join(", ")}`);
  return npmCli;
}

function runNode(commandArgs, options, label) {
  const result = spawnSync(process.execPath, commandArgs, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    ...options
  });

  assert.ifError(result.error);
  assert.equal(
    result.status,
    0,
    `${label} exited with ${result.status}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  assert.equal(result.signal, null, `${label} was terminated by ${result.signal}`);
  assert.equal(result.stderr.trim(), "", `${label} wrote to stderr:\n${result.stderr}`);
  return result.stdout;
}

function runNpm(args, options, label) {
  return runNode([locateNpmCli(), ...args], options, label);
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch (error) {
    assert.fail(`${label} did not return valid JSON: ${error.message}\n${output}`);
  }
}

function normalizePackagePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function collectDocumentAssets(indexHtml, demoScript) {
  const references = [];
  const attributePattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  const fetchPattern = /\bfetch\s*\(\s*["']([^"']+)["']/gi;
  const documentMarkup = indexHtml.replace(
    /<script\b[^>]*\bid=["']embeddedReadme["'][^>]*>[\s\S]*?<\/script>/i,
    ""
  );

  // README examples are inert text; only assets requested by the live document belong in this check.
  for (const match of documentMarkup.matchAll(attributePattern)) references.push(match[1]);
  for (const match of demoScript.matchAll(fetchPattern)) references.push(match[1]);

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
      const withoutFragment = decodeURIComponent(reference).split(/[?#]/, 1)[0].replaceAll("\\", "/");
      const normalized = path.posix.normalize(withoutFragment);

      assert.ok(
        normalized !== ".." && !normalized.startsWith("../") && !path.posix.isAbsolute(normalized),
        `Relative document asset escapes the package root: ${reference}`
      );
      return normalizePackagePath(normalized);
    })
    .sort();
}

test("the release manifest and validation graph are pinned to 1.4.0", () => {
  assert.equal(manifest.name, EXPECTED_NAME);
  assert.equal(manifest.version, EXPECTED_VERSION);
  assert.deepEqual([...manifest.files].sort(), [...expectedManifestFiles].sort());
  assert.deepEqual(manifest.exports, expectedExports);
  assert.deepEqual(manifest.directories, { test: "tests" });

  assert.equal(manifest.main, "./index.cjs");
  assert.equal(manifest.module, "./index.js");
  assert.equal(manifest.style, "./interactive-surface.css");
  assert.equal(manifest.unpkg, "./interactive-surface.css");
  assert.equal(manifest.jsdelivr, "./interactive-surface.css");

  for (const [scriptName, command] of Object.entries(expectedScripts)) {
    assert.equal(manifest.scripts[scriptName], command, `Unexpected ${scriptName} script`);
  }
});

test("the changelog records the complete 1.4.0 release immediately after Unreleased", async () => {
  const changelog = await readFile(path.join(repositoryRoot, "CHANGELOG.md"), "utf8");
  const releaseHeading = `## ${EXPECTED_VERSION} - 2026-07-19`;
  const releaseMatches = changelog.match(new RegExp(`^${releaseHeading.replaceAll(".", "\\.")}$`, "gm")) ?? [];

  assert.match(changelog, new RegExp(`^## Unreleased\\s+${releaseHeading.replaceAll(".", "\\.")}$`, "m"));
  assert.equal(releaseMatches.length, 1, `Expected exactly one ${releaseHeading} heading`);

  const releaseStart = changelog.indexOf(releaseHeading);
  const nextRelease = changelog.indexOf("\n## ", releaseStart + releaseHeading.length);
  const releaseNotes = changelog.slice(releaseStart, nextRelease === -1 ? undefined : nextRelease);

  for (const category of ["Added", "Changed", "Fixed", "Accessibility", "Documentation", "Testing"]) {
    assert.match(releaseNotes, new RegExp(`^### ${category}\\r?\\n\\r?\\n- `, "m"));
  }
});

test("the npm publishing workflow only accepts a matching published release", async () => {
  const workflow = await readFile(path.join(repositoryRoot, ".github", "workflows", "npm-publish.yml"), "utf8");
  const releaseGuard = workflow.indexOf("- name: Validate release metadata");
  const dependencyInstall = workflow.indexOf("- name: Install dependencies");
  const packageValidation = workflow.indexOf("- name: Validate publish package");
  const packagePublish = workflow.indexOf("- name: Publish to npm");
  const guardProgramStart = workflow.indexOf("node <<'NODE'");
  const guardProgramEnd = workflow.indexOf("\n          NODE", guardProgramStart);
  const guardProgram = workflow.slice(guardProgramStart, guardProgramEnd);
  const anchoredHeadingPattern =
    "`^## ${escapedVersion} - " + String.raw`\\d{4}-\\d{2}-\\d{2}\\r?$` + "`";

  assert.match(workflow, /on:\r?\n\s+release:\r?\n\s+types: \[published\]/);
  assert.doesNotMatch(workflow, /workflow_dispatch/);
  assert.match(
    workflow,
    /uses: actions\/checkout@v5\r?\n\s+with:\r?\n\s+ref: \$\{\{ github\.event\.release\.tag_name \}\}/
  );
  assert.match(workflow, /RELEASE_TAG: \$\{\{ github\.event\.release\.tag_name \}\}/);
  assert.match(workflow, /process\.env\.RELEASE_TAG/);
  assert.ok(guardProgramStart !== -1 && guardProgramEnd !== -1, "Missing release guard program");
  assert.doesNotMatch(guardProgram, /\$\{\{/);
  assert.match(workflow, /const expectedTag = `v\$\{manifest\.version\}`;/);
  assert.ok(guardProgram.includes(anchoredHeadingPattern), "The changelog guard must use an anchored dated heading");
  assert.match(workflow, /releaseHeadings\.length !== 1/);
  assert.match(workflow, /permissions:\r?\n\s+contents: read\r?\n\s+id-token: write/);
  assert.match(workflow, /run: npm run validate:publish/);
  assert.match(workflow, /run: npm publish --provenance --access public --ignore-scripts/);
  assert.ok(releaseGuard !== -1 && releaseGuard < dependencyInstall, "Release metadata must be checked before npm ci");
  assert.ok(dependencyInstall < packageValidation && packageValidation < packagePublish);
});

test("the packed tarball contains only public files and resolves every export", async (t) => {
  const packDirectory = await mkdtemp(path.join(tmpdir(), "interactive-surface-pack-"));
  const consumerDirectory = await mkdtemp(path.join(tmpdir(), "interactive-surface-consumer-"));
  const consumerCache = path.join(consumerDirectory, ".npm-cache");

  t.after(async () => {
    await Promise.all([
      rm(packDirectory, { force: true, recursive: true }),
      rm(consumerDirectory, { force: true, recursive: true })
    ]);
  });

  const packOutput = runNpm(
    [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      packDirectory,
      "--cache",
      path.join(repositoryRoot, ".npm-cache")
    ],
    { cwd: repositoryRoot },
    "npm pack"
  );
  const packResults = parseJson(packOutput, "npm pack");

  assert.equal(packResults.length, 1, "npm pack must produce exactly one package");
  const packedRelease = packResults[0];
  assert.equal(packedRelease.name, EXPECTED_NAME);
  assert.equal(packedRelease.version, EXPECTED_VERSION);
  assert.equal(packedRelease.id, `${EXPECTED_NAME}@${EXPECTED_VERSION}`);

  const tarballPath = path.resolve(packDirectory, packedRelease.filename);
  assert.equal(path.dirname(tarballPath), path.resolve(packDirectory), "Tarball escaped the temporary destination");
  assert.equal((await stat(tarballPath)).isFile(), true);

  const packedFiles = packedRelease.files.map(({ path: file }) => normalizePackagePath(file)).sort();
  assert.deepEqual(packedFiles, expectedPackedFiles);

  for (const file of packedFiles) {
    assert.doesNotMatch(file, /^(?:assets|dist|docs|styles|tests|\.npm-cache|\.superpowers)\//);
    assert.doesNotMatch(file, /(?:^ISC logo\.png$|\.tgz$)/);
  }

  const indexHtml = await readFile(path.join(repositoryRoot, "index.html"), "utf8");
  const demoScript = await readFile(path.join(repositoryRoot, "demo", "demo.js"), "utf8");
  const documentAssets = collectDocumentAssets(indexHtml, demoScript);

  assert.deepEqual(documentAssets, ["README.md", "demo/demo.css", "demo/demo.js", "standalone-preset.css"]);
  for (const asset of documentAssets) assert.ok(packedFiles.includes(asset), `Unpacked document asset: ${asset}`);

  runNpm(
    [
      "install",
      tarballPath,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      "--cache",
      consumerCache
    ],
    { cwd: consumerDirectory },
    "consumer npm install"
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
    "utf8"
  );

  const resolutions = parseJson(
    runNode(
      ["--experimental-import-meta-resolve", consumerProbe],
      { cwd: consumerDirectory },
      "consumer export probe"
    ),
    "consumer export probe"
  );
  const installedRoot = path.join(consumerDirectory, "node_modules", EXPECTED_NAME);
  const expectedTargets = new Map([
    [EXPECTED_NAME, { esm: "index.js", cjs: "index.cjs" }],
    ...Object.entries(expectedExports)
      .filter(([subpath]) => subpath !== ".")
      .map(([subpath, target]) => [
        `${EXPECTED_NAME}${subpath.slice(1)}`,
        { esm: target.slice(2), cjs: target.slice(2) }
      ])
  ]);

  for (const [specifier, targets] of expectedTargets) {
    assert.equal(fileURLToPath(resolutions.esm[specifier]), path.join(installedRoot, targets.esm));
    assert.equal(path.resolve(resolutions.cjs[specifier]), path.join(installedRoot, targets.cjs));
  }

  const installedManifest = JSON.parse(await readFile(path.join(installedRoot, "package.json"), "utf8"));
  assert.equal(installedManifest.name, EXPECTED_NAME);
  assert.equal(installedManifest.version, EXPECTED_VERSION);
  assert.equal(installedManifest.main, "./index.cjs");
  assert.equal(installedManifest.module, "./index.js");
  assert.equal(installedManifest.style, "./interactive-surface.css");
  assert.equal(installedManifest.unpkg, "./interactive-surface.css");
  assert.equal(installedManifest.jsdelivr, "./interactive-surface.css");
});
