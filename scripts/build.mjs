import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CleanCSS from "clean-css";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const sourcePaths = {
  core: "styles/state-core.css",
  preset: "styles/standalone-preset.css"
};

function normalize(css) {
  return css.replace(/\r\n?/g, "\n");
}

function withGeneratedHeader(bundleName, sources, css) {
  const header = [
    "/*!",
    ` * ${bundleName}`,
    ` * Generated from: ${sources.join(", ")}`,
    " * Do not edit directly; run node scripts/build.mjs.",
    " */"
  ].join("\n");

  return `${header}\n\n${normalize(css).trim()}\n`;
}

function minify(bundleName, css) {
  const result = new CleanCSS({ level: 2 }).minify(css);

  if (result.errors.length > 0) {
    throw new Error(`Unable to minify ${bundleName}:\n${result.errors.join("\n")}`);
  }

  return `${result.styles}\n`;
}

function createNormalAndMinifiedMaps(publicBundles) {
  const bundleMap = {};

  for (const [bundleName, css] of Object.entries(publicBundles)) {
    const stem = path.basename(bundleName, ".css");

    bundleMap[bundleName] = css;
    bundleMap[`dist/${bundleName}`] = css;
    bundleMap[`dist/${stem}.min.css`] = minify(bundleName, css);
  }

  return bundleMap;
}

async function readSource(sourcePath) {
  try {
    return await readFile(path.join(projectRoot, sourcePath), "utf8");
  } catch (error) {
    throw new Error(`Unable to read source ${sourcePath}: ${error.message}`, { cause: error });
  }
}

export async function createBundleMap() {
  const core = normalize(await readSource(sourcePaths.core));
  const preset = normalize(await readSource(sourcePaths.preset));
  const complete = `${preset.trim()}\n\n${core.trim()}\n`;

  return createNormalAndMinifiedMaps({
    "state-core.css": withGeneratedHeader("state-core.css", [sourcePaths.core], core),
    "standalone-preset.css": withGeneratedHeader(
      "standalone-preset.css",
      [sourcePaths.preset, sourcePaths.core],
      complete
    ),
    "interactive-surface.css": withGeneratedHeader(
      "interactive-surface.css",
      [sourcePaths.preset, sourcePaths.core],
      complete
    )
  });
}

export async function buildBundles(bundleMap, outputDirectory = projectRoot) {
  for (const [target, css] of Object.entries(bundleMap)) {
    const targetPath = path.join(outputDirectory, target);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, css, "utf8");
  }
}

export async function verifyBundles(bundleMap, outputDirectory = projectRoot) {
  const staleTargets = [];

  for (const [target, expected] of Object.entries(bundleMap)) {
    try {
      const actual = await readFile(path.join(outputDirectory, target), "utf8");

      if (normalize(actual) !== expected) {
        staleTargets.push(target);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        staleTargets.push(target);
        continue;
      }

      throw new Error(`Unable to verify generated target ${target}: ${error.message}`, { cause: error });
    }
  }

  if (staleTargets.length > 0) {
    throw new Error(`Generated bundles are stale: ${staleTargets.join(", ")}`);
  }
}

export async function verifyPublicBundles(bundleMap, outputDirectory = projectRoot) {
  const publicBundles = Object.fromEntries(
    Object.entries(bundleMap).filter(([target]) => !target.startsWith("dist/"))
  );

  await verifyBundles(publicBundles, outputDirectory);
}

function selectTargets(bundleMap, step) {
  if (step === "bundle") {
    return Object.fromEntries(Object.entries(bundleMap).filter(([target]) => !target.endsWith(".min.css")));
  }

  if (step === "minify") {
    return Object.fromEntries(Object.entries(bundleMap).filter(([target]) => target.endsWith(".min.css")));
  }

  return bundleMap;
}

async function run() {
  const step = process.argv[2] ?? "build";
  const bundleMap = await createBundleMap();

  if (["build", "bundle", "minify"].includes(step)) {
    await buildBundles(selectTargets(bundleMap, step));
    return;
  }

  if (step === "check") {
    await verifyBundles(bundleMap);
    return;
  }

  if (step === "check-public") {
    // Public roots are committed, while dist is intentionally absent from a clean checkout.
    await verifyPublicBundles(bundleMap);
    return;
  }

  throw new Error(`Unknown build step: ${step}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    await run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
