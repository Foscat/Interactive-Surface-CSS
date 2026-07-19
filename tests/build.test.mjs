import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { buildBundles, createBundleMap, verifyBundles } from "../scripts/build.mjs";

const publicBundleNames = ["state-core.css", "standalone-preset.css", "interactive-surface.css"];

function withoutGeneratedHeader(css) {
  return css.replace(/^\/\*![\s\S]*?\*\/\s*/, "");
}

test("the bundle map exposes every public and distribution stylesheet", async () => {
  const bundleMap = await createBundleMap();
  const publicKeys = Object.keys(bundleMap).filter((target) => !target.startsWith("dist/"));

  assert.deepEqual(publicKeys, publicBundleNames);

  publicBundleNames.forEach((bundleName) => {
    const stem = path.basename(bundleName, ".css");

    assert.equal(bundleMap[`dist/${bundleName}`], bundleMap[bundleName]);
    assert.ok(bundleMap[`dist/${stem}.min.css`], `Missing minified bundle: ${stem}.min.css`);
  });

  assert.equal(
    withoutGeneratedHeader(bundleMap["standalone-preset.css"]),
    withoutGeneratedHeader(bundleMap["interactive-surface.css"])
  );
  assert.match(bundleMap["state-core.css"], /Generated from: styles\/state-core\.css/);
  assert.match(
    bundleMap["standalone-preset.css"],
    /Generated from: styles\/standalone-preset\.css, styles\/state-core\.css/
  );
  assert.match(
    bundleMap["interactive-surface.css"],
    /Generated from: styles\/standalone-preset\.css, styles\/state-core\.css/
  );
  assert.doesNotMatch(
    bundleMap["state-core.css"],
    /(?:background-color|color|border-color): (?:ButtonFace|ButtonText|GrayText)/
  );

  ["standalone-preset.css", "interactive-surface.css"].forEach((bundleName) => {
    const exactBaseSelectors = bundleMap[bundleName].match(/^\.interactive-surface \{/gm) ?? [];

    assert.equal(exactBaseSelectors.length, 1, `${bundleName} contains a duplicate base selector`);
  });
});

test("bundle parity reports the stale target without mutating project files", async (t) => {
  const outputDirectory = await mkdtemp(path.join(tmpdir(), "interactive-surface-build-"));
  const bundleMap = await createBundleMap();

  t.after(() => rm(outputDirectory, { force: true, recursive: true }));

  await buildBundles(bundleMap, outputDirectory);
  await verifyBundles(bundleMap, outputDirectory);

  for (const [target, expected] of Object.entries(bundleMap)) {
    assert.equal(await readFile(path.join(outputDirectory, target), "utf8"), expected);
  }

  // Git may materialize generated text with CRLF on Windows even when source output is normalized to LF.
  const crlfTarget = "state-core.css";
  await writeFile(path.join(outputDirectory, crlfTarget), bundleMap[crlfTarget].replaceAll("\n", "\r\n"));
  await verifyBundles(bundleMap, outputDirectory);

  const staleTarget = "interactive-surface.css";
  await writeFile(path.join(outputDirectory, staleTarget), "/* stale fixture */\n");

  await assert.rejects(verifyBundles(bundleMap, outputDirectory), new RegExp(staleTarget.replace(".", "\\.")));
});
