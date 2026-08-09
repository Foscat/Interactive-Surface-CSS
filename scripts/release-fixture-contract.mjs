import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

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
    if (/^(?!\s*(?:name:|#)).*\bnpm\s+publish\b/m.test(workflow.source)) {
      throw new Error(
        `pull-request workflow ${workflow.name} enables npm publish`,
      );
    }
    if (/^(?!\s*(?:name:|#)).*\bgit\s+(?:push|tag)\b/m.test(workflow.source)) {
      throw new Error(
        `pull-request workflow ${workflow.name} enables a git mutation`,
      );
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
  const preflightModule = path.join(
    resolvedFixtureRoot,
    "scripts",
    "release-preflight.mjs",
  );
  assert.ok(
    fs.existsSync(preflightModule),
    `Reviewed UI release fixture is missing ${preflightModule}.`,
  );
  assertReviewedRevision(resolvedFixtureRoot, descriptor.revision);

  const packageName = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
  ).name;
  const siblingLayout = path.resolve(rootDir, "..", "Layout-Style-CSS");
  const commandArgs = [
    preflightModule,
    "--fixture-root",
    resolvedFixtureRoot,
    "--candidate-root",
    rootDir,
    "--candidate-package",
    packageName,
    "--layout-repo",
    siblingLayout,
    "--layout-docs-repo",
    siblingLayout,
    "--interactive-docs-repo",
    rootDir,
    ...forwardedArgs,
  ];
  run(process.execPath, commandArgs, { cwd: rootDir });
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

function assertReviewedRevision(fixtureRoot, revision) {
  const result = spawnSync(
    "git",
    ["-C", fixtureRoot, "merge-base", "--is-ancestor", revision, "HEAD"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(
    result.status,
    0,
    `UI fixture checkout must contain reviewed revision ${revision}; got ${result.stderr || result.stdout || "unknown git error"}.`,
  );
}

function run(command, args, { cwd }) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): ${command} ${args.join(" ")}`,
    );
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await runCli(process.argv.slice(2));
}
