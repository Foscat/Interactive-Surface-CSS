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
    revision: "0080528295e485a340959c602f35b47ff5b8fea3",
  });

  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "interactive-release-fixture-"),
  );
  const outputPath = path.join(tempRoot, "github-output.txt");
  try {
    releaseContract.writeGithubOutputs(descriptor, outputPath);
    assert.equal(
      fs.readFileSync(outputPath, "utf8"),
      "ui_repository=Foscat/ui-style-kit-css\nui_revision=0080528295e485a340959c602f35b47ff5b8fea3\n",
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

test("workflow policy rejects every release or deployment mutation from pull requests", () => {
  assert.ok(
    releaseContract,
    "scripts/release-fixture-contract.mjs must implement the fixture contract",
  );

  const forbiddenMutations = [
    ["npm publish", "      - run: npm publish"],
    ["npm version", "      - run: npm version patch"],
    ["git tag", "      - run: git tag v1.5.1"],
    ["git push", "      - run: git push origin HEAD"],
    ["GitHub release", "      - uses: softprops/action-gh-release@v2"],
    ["GitHub release", "      - run: gh release create v1.5.1"],
    ["deployment", "      - uses: actions/deploy-pages@v4"],
    ["deployment", "      - run: npx wrangler deploy"],
  ];
  const safeRelease =
    "on:\n  release:\njobs:\n  publish:\n    steps:\n      - run: npm run release:preflight\n      - run: npm publish --provenance --access public --ignore-scripts\n";

  for (const [label, mutation] of forbiddenMutations) {
    assert.throws(
      () =>
        releaseContract.validateWorkflowSources([
          {
            name: "ci.yaml",
            source:
              "on:\n  pull_request:\njobs:\n  verify:\n    steps:\n      - run: npm run release:preflight\n" +
              `${mutation}\n`,
          },
          { name: "npm-publish.yml", source: safeRelease },
        ]),
      new RegExp(
        `pull-request workflow ci\\.yaml enables forbidden mutation: ${label}`,
      ),
    );
  }
});

test("publishing guide records the immutable bootstrap and merge sequence", () => {
  const guide = fs.readFileSync(
    path.join(rootDir, "wiki", "Publishing-and-Releases.md"),
    "utf8",
  );

  for (const phrase of [
    "72286fc27e4c3664ab05598a34c4dcf7e8267821",
    "Push a stable UI bootstrap ref",
    "merge commits",
    "Update and verify the final UI companion pins",
    "Do not squash, rebase, or delete the only remote refs",
  ]) {
    assert.match(guide, new RegExp(phrase, "i"));
  }
});
