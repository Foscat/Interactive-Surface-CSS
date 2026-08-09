import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
let releaseContract;
try {
  releaseContract = await import("../scripts/release-fixture-contract.mjs");
} catch {
  // RED remains an assertion failure until the companion fixture contract exists.
}

test("pins an immutable reviewed UI release fixture and writes exact checkout outputs", () => {
  assert.ok(
    releaseContract,
    "scripts/release-fixture-contract.mjs must implement the fixture contract",
  );

  const descriptor = releaseContract.readFixtureDescriptor(rootDir);
  assert.deepEqual(descriptor, {
    repository: "Foscat/ui-style-kit-css",
    revision: "72286fc27e4c3664ab05598a34c4dcf7e8267821",
  });

  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "interactive-release-fixture-"),
  );
  const outputPath = path.join(tempRoot, "github-output.txt");
  try {
    releaseContract.writeGithubOutputs(descriptor, outputPath);
    assert.equal(
      fs.readFileSync(outputPath, "utf8"),
      "ui_repository=Foscat/ui-style-kit-css\nui_revision=72286fc27e4c3664ab05598a34c4dcf7e8267821\n",
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("pull requests execute read-only preflight and npm publish stays downstream", () => {
  assert.ok(
    releaseContract,
    "scripts/release-fixture-contract.mjs must implement the fixture contract",
  );

  assert.doesNotThrow(() =>
    releaseContract.validateRepositoryWorkflows(rootDir),
  );
});

test("workflow policy rejects a pull-request publish command", () => {
  assert.ok(
    releaseContract,
    "scripts/release-fixture-contract.mjs must implement the fixture contract",
  );

  assert.throws(
    () =>
      releaseContract.validateWorkflowSources([
        {
          name: "ci.yaml",
          source:
            "on:\n  pull_request:\njobs:\n  verify:\n    steps:\n      - run: npm run release:preflight\n      - run: npm publish\n",
        },
        {
          name: "npm-publish.yml",
          source:
            "on:\n  release:\njobs:\n  publish:\n    steps:\n      - run: npm run release:preflight\n      - run: npm publish\n",
        },
      ]),
    /pull-request workflow ci\.yaml enables npm publish/,
  );
});
