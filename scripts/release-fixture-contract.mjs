import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const fixtureTempPrefix = "interactive-release-fixture-overlay-";

export function readFixtureDescriptor(repositoryRoot) {
  const descriptor = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, "ecosystem-release-fixture.json"),
      "utf8",
    ),
  );
  assert.match(
    descriptor.repository,
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
    "Fixture repository must be owner/name.",
  );
  assert.match(
    descriptor.revision,
    /^[0-9a-f]{40}$/,
    "Fixture revision must be an immutable 40-character commit SHA.",
  );
  return descriptor;
}

export function writeGithubOutputs(descriptor, outputPath) {
  assert.ok(
    outputPath,
    "GITHUB_OUTPUT is required for workflow source resolution.",
  );
  fs.appendFileSync(
    outputPath,
    `ui_repository=${descriptor.repository}\nui_revision=${descriptor.revision}\n`,
  );
}

export function validateWorkflowSources(workflows) {
  const mutationPatterns = [
    {
      label: "npm publish",
      pattern: /^(?!\s*(?:name:|#)).*\bnpm\s+publish\b/m,
    },
    {
      label: "npm version",
      pattern: /^(?!\s*(?:name:|#)).*\bnpm\s+version(?:\s|$)/m,
    },
    {
      label: "git tag",
      pattern: /^(?!\s*(?:name:|#)).*\bgit\s+tag(?:\s|$)/m,
    },
    {
      label: "git push",
      pattern: /^(?!\s*(?:name:|#)).*\bgit\s+push(?:\s|$)/m,
    },
    {
      label: "GitHub release",
      pattern:
        /(?:^\s*(?:-\s*)?uses:\s*(?:softprops\/action-gh-release|ncipollo\/release-action|actions\/create-release)@|^(?!\s*(?:name:|#)).*\bgh\s+release\b)/m,
    },
    {
      label: "deployment",
      pattern:
        /(?:^\s*(?:-\s*)?uses:\s*(?:actions\/(?:deploy-pages|upload-pages-artifact)|peaceiris\/actions-gh-pages|cloudflare\/wrangler-action|azure\/webapps-deploy)@|^(?!\s*(?:name:|#)).*\b(?:wrangler\s+(?:deploy|publish)|netlify\s+deploy|firebase\s+deploy|vercel(?:\s+deploy)?)\b)/m,
    },
  ];
  const pullRequestWorkflows = workflows.filter(({ source }) =>
    /^\s*pull_request\s*:/m.test(source),
  );
  assert.ok(
    pullRequestWorkflows.some(({ source }) =>
      /\bnpm\s+run\s+release:preflight\b/.test(source),
    ),
    "A pull-request workflow must execute npm run release:preflight.",
  );
  for (const workflow of pullRequestWorkflows) {
    for (const mutation of mutationPatterns) {
      if (mutation.pattern.test(workflow.source)) {
        throw new Error(
          `pull-request workflow ${workflow.name} enables forbidden mutation: ${mutation.label}`,
        );
      }
    }
  }

  const publishWorkflow = workflows.find(
    ({ name }) => name === "npm-publish.yml",
  );
  assert.ok(publishWorkflow, "npm-publish.yml must exist.");
  const preflightIndex = publishWorkflow.source.search(
    /\bnpm\s+run\s+release:preflight\b/,
  );
  const publishIndex = publishWorkflow.source.search(
    /^(?!\s*(?:name:|#)).*\bnpm\s+publish\b/m,
  );
  assert.ok(
    publishIndex >= 0,
    "npm-publish.yml must retain the package publish step.",
  );
  assert.ok(
    preflightIndex >= 0 && preflightIndex < publishIndex,
    "npm-publish.yml must run preflight before npm publish.",
  );
  assert.match(
    publishWorkflow.source,
    /^(?!\s*(?:name:|#)).*\bnpm\s+publish\b[^\r\n]*--ignore-scripts(?:\s|$)/m,
    "npm-publish.yml must suppress lifecycle re-entry after explicit preflight.",
  );
}

export function validateRepositoryWorkflows(repositoryRoot) {
  const workflowRoot = path.join(repositoryRoot, ".github", "workflows");
  const workflows = fs
    .readdirSync(workflowRoot)
    .filter((name) => /\.ya?ml$/i.test(name))
    .map((name) => ({
      name,
      source: fs.readFileSync(path.join(workflowRoot, name), "utf8"),
    }));
  validateWorkflowSources(workflows);
}

/**
 * Returns a compatibility contract copy with the active candidate as the current version.
 *
 * @param {object} contract - Reviewed ecosystem compatibility contract.
 * @param {string} candidatePackage - Package currently being release-verified.
 * @param {string} candidateVersion - Version from the candidate package manifest.
 * @returns {object} A contract copy with only the current candidate version overlaid.
 */
export function withCandidateCurrentVersion(
  contract,
  candidatePackage,
  candidateVersion,
) {
  assert.match(
    candidateVersion,
    /^\d+\.\d+\.\d+$/,
    "Candidate version must be a plain semver version.",
  );
  assert.ok(
    contract.supportedCombinations?.current?.[candidatePackage],
    `Candidate package is missing from the fixture current combination: ${candidatePackage}`,
  );

  return {
    ...contract,
    supportedCombinations: {
      ...contract.supportedCombinations,
      current: {
        ...contract.supportedCombinations.current,
        [candidatePackage]: candidateVersion,
      },
    },
  };
}

async function runCli(args) {
  const descriptor = readFixtureDescriptor(rootDir);
  if (args.includes("--write-github-outputs")) {
    writeGithubOutputs(descriptor, process.env.GITHUB_OUTPUT);
    return;
  }

  const { fixtureRoot, forwardedArgs } = parseFixtureRoot(args);
  const resolvedFixtureRoot = path.resolve(
    fixtureRoot ??
      process.env.CSS_ECOSYSTEM_FIXTURE_ROOT ??
      path.join(rootDir, "..", "ui-style-kit-css"),
  );
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), fixtureTempPrefix));
  let completed = false;

  try {
    const packageJson = readJson(path.join(rootDir, "package.json"));
    const packageName = packageJson.name;
    const fixture = prepareReviewedFixture({
      candidatePackage: packageName,
      candidateVersion: packageJson.version,
      descriptor,
      sourceRoot: resolvedFixtureRoot,
      tempRoot,
    });
    const preflightModule = path.join(
      fixture.root,
      "scripts",
      "release-preflight.mjs",
    );
    assert.ok(
      fs.existsSync(preflightModule),
      `Reviewed UI release fixture is missing ${preflightModule}.`,
    );

    const compatibility = readJson(
      path.join(fixture.root, "ecosystem-compatibility.json"),
    );
    const layout = prepareReviewedCompanion({
      packageName: "layout-style-css",
      sourceRoot: path.resolve(rootDir, "..", "Layout-Style-CSS"),
      source: compatibility.packageSources["layout-style-css"],
      tempRoot,
    });
    const commandArgs = [
      preflightModule,
      "--fixture-root",
      fixture.root,
      "--candidate-root",
      rootDir,
      "--candidate-package",
      packageName,
      "--layout-repo",
      layout.root,
      "--layout-docs-repo",
      layout.root,
      "--interactive-docs-repo",
      rootDir,
      ...forwardedArgs,
    ];
    run(process.execPath, commandArgs, {
      cwd: rootDir,
      env: { ...process.env, npm_config_ignore_scripts: "true" },
    });
    completed = true;
  } finally {
    if (completed) {
      removeSafeTempDir(tempRoot);
    } else {
      console.error(`Release fixture overlay retained at ${tempRoot}`);
    }
  }
}

/**
 * Creates a clean reviewed UI fixture and overlays this package candidate version.
 *
 * @param {object} options - Fixture materialization options.
 * @param {string} options.candidatePackage - Package being release-verified.
 * @param {string} options.candidateVersion - Candidate package version.
 * @param {{repository: string, revision: string}} options.descriptor - Reviewed UI fixture descriptor.
 * @param {string} options.sourceRoot - Local UI fixture source checkout.
 * @param {string} options.tempRoot - Temporary root that owns cleanup.
 * @returns {{root: string}} The prepared fixture root.
 */
function prepareReviewedFixture({
  candidatePackage,
  candidateVersion,
  descriptor,
  sourceRoot,
  tempRoot,
}) {
  const targetRoot = path.join(tempRoot, "ui-style-kit-css");
  materializeGitRevision({
    label: "UI release fixture",
    repository: descriptor.repository,
    revision: descriptor.revision,
    sourceRoot,
    targetRoot,
  });

  const contractPath = path.join(targetRoot, "ecosystem-compatibility.json");
  const contract = readJson(contractPath);
  const overlaid = withCandidateCurrentVersion(
    contract,
    candidatePackage,
    candidateVersion,
  );
  fs.writeFileSync(contractPath, `${JSON.stringify(overlaid, null, 2)}\n`);

  return { root: targetRoot };
}

/**
 * Creates a clean companion checkout at the exact reviewed ecosystem revision.
 *
 * @param {object} options - Companion materialization options.
 * @param {string} options.packageName - Companion package name for diagnostics.
 * @param {string} options.sourceRoot - Local companion source checkout.
 * @param {{repository: string, revision: string}} options.source - Reviewed source metadata.
 * @param {string} options.tempRoot - Temporary root that owns cleanup.
 * @returns {{root: string}} The prepared companion root.
 */
function prepareReviewedCompanion({
  packageName,
  sourceRoot,
  source,
  tempRoot,
}) {
  const targetRoot = path.join(tempRoot, packageName);
  materializeGitRevision({
    label: packageName,
    repository: source.repository,
    revision: source.revision,
    sourceRoot,
    targetRoot,
  });

  return { root: targetRoot };
}

/**
 * Clones a repository source and checks out a specific immutable revision.
 *
 * @param {object} options - Git materialization options.
 * @param {string} options.label - Human-readable source label.
 * @param {string} options.repository - GitHub owner/name fallback repository.
 * @param {string} options.revision - Commit SHA to check out.
 * @param {string} options.sourceRoot - Preferred local source checkout.
 * @param {string} options.targetRoot - Destination checkout root.
 * @returns {void}
 */
function materializeGitRevision({
  label,
  repository,
  revision,
  sourceRoot,
  targetRoot,
}) {
  const cloneSource = hasGitRevision(sourceRoot, revision)
    ? sourceRoot
    : `https://github.com/${repository}.git`;
  run("git", ["clone", "--no-checkout", cloneSource, targetRoot], {
    cwd: rootDir,
  });
  run("git", ["-C", targetRoot, "checkout", "--force", revision], {
    cwd: rootDir,
  });
  const packagePath = path.join(targetRoot, "package.json");
  assert.ok(
    fs.existsSync(packagePath),
    `Reviewed ${label} checkout is missing package.json at ${targetRoot}.`,
  );
  installReviewedDependencies(targetRoot, label);
}

function parseFixtureRoot(args) {
  const forwardedArgs = [];
  let fixtureRoot;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--fixture-root") {
      fixtureRoot = args[(index += 1)];
      assert.ok(fixtureRoot, "--fixture-root requires a value.");
    } else {
      forwardedArgs.push(args[index]);
    }
  }
  return { fixtureRoot, forwardedArgs };
}

function hasGitRevision(fixtureRoot, revision) {
  const result = spawnSync(
    "git",
    ["-C", fixtureRoot, "cat-file", "-e", `${revision}^{commit}`],
    {
      encoding: "utf8",
    },
  );
  return result.status === 0;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Installs a reviewed fixture's locked dev toolchain inside its temporary clone.
 *
 * @param {string} packageRoot - Temporary package checkout root.
 * @param {string} label - Human-readable package label.
 * @returns {void}
 */
function installReviewedDependencies(packageRoot, label) {
  assert.ok(
    fs.existsSync(path.join(packageRoot, "package-lock.json")),
    `Reviewed ${label} checkout is missing package-lock.json at ${packageRoot}.`,
  );
  runNpm(["ci", "--ignore-scripts", "--no-audit", "--no-fund"], packageRoot);
}

function npmInvocation() {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && fs.existsSync(npmExecPath)) {
    return { command: process.execPath, baseArgs: [npmExecPath] };
  }
  return {
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    baseArgs: [],
  };
}

function runNpm(args, cwd) {
  const npm = npmInvocation();
  run(npm.command, [...npm.baseArgs, ...args], { cwd });
}

function run(command, args, { cwd, env = process.env }) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): ${command} ${args.join(" ")}`,
    );
  }
}

function removeSafeTempDir(directory) {
  const tempRoot = fs.realpathSync(os.tmpdir());
  const target = fs.realpathSync(directory);
  if (
    !target.startsWith(`${tempRoot}${path.sep}`) ||
    !path.basename(target).startsWith(fixtureTempPrefix)
  ) {
    throw new Error(`Refusing to remove unexpected fixture overlay: ${target}`);
  }
  fs.rmSync(target, { recursive: true, force: true });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await runCli(process.argv.slice(2));
}
