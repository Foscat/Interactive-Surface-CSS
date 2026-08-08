import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

type PackageArtifact = {
  name: string;
  tarballPath: string;
  version: string;
};

type PackedEcosystemOptions = {
  includeUiStyleKit?: boolean;
};

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const uiStyleKitRoot =
  process.env.UI_STYLE_KIT_CSS_SOURCE ??
  path.resolve(repositoryRoot, "..", "ui-style-kit-css");

function runNpm(args: string[], cwd: string, label: string) {
  const executableDirectory = path.dirname(process.execPath);
  const npmCliCandidates = [
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
  ].filter((candidate): candidate is string => Boolean(candidate));
  const npmCli = npmCliCandidates.find((candidate) => existsSync(candidate));

  if (!npmCli) {
    throw new Error(
      "Unable to locate npm's JavaScript CLI for the packed fixture.",
    );
  }

  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error || result.status !== 0 || result.signal) {
    throw new Error(
      `${label} failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
      { cause: result.error },
    );
  }

  return result.stdout;
}

function packPackage(
  packageRoot: string,
  packDirectory: string,
  cacheDirectory: string,
) {
  const output = runNpm(
    [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      packDirectory,
      "--cache",
      cacheDirectory,
    ],
    packageRoot,
    `npm pack ${packageRoot}`,
  );
  const [packedPackage] = JSON.parse(output) as Array<{
    filename: string;
    name: string;
    version: string;
  }>;

  if (!packedPackage) {
    throw new Error(`npm pack ${packageRoot} did not produce an artifact.`);
  }

  const tarballPath = path.resolve(packDirectory, packedPackage.filename);

  if (!tarballPath.startsWith(`${path.resolve(packDirectory)}${path.sep}`)) {
    throw new Error(
      `npm pack ${packageRoot} wrote outside its fixture directory.`,
    );
  }

  return {
    name: packedPackage.name,
    tarballPath,
    version: packedPackage.version,
  } satisfies PackageArtifact;
}

export function createPackedEcosystemFixture(
  options: PackedEcosystemOptions = {},
) {
  const fixtureDirectory = mkdtempSync(
    path.join(tmpdir(), "interactive-surface-ecosystem-"),
  );
  const packDirectory = path.join(fixtureDirectory, "packages");
  const consumerDirectory = path.join(fixtureDirectory, "consumer");
  const cacheDirectory = path.join(fixtureDirectory, ".npm-cache");

  try {
    mkdirSync(packDirectory, { recursive: true });
    mkdirSync(consumerDirectory, { recursive: true });
    const interactiveArtifact = packPackage(
      repositoryRoot,
      packDirectory,
      cacheDirectory,
    );
    const artifacts = [interactiveArtifact];

    if (options.includeUiStyleKit) {
      if (!existsSync(path.join(uiStyleKitRoot, "package.json"))) {
        throw new Error(
          `UI Style Kit source checkout is required at ${uiStyleKitRoot}.`,
        );
      }

      const uiStyleKitArtifact = packPackage(
        uiStyleKitRoot,
        packDirectory,
        cacheDirectory,
      );

      if (
        uiStyleKitArtifact.name !== "ui-style-kit-css" ||
        uiStyleKitArtifact.version !== "2.1.0"
      ) {
        throw new Error(
          `Expected ui-style-kit-css@2.1.0, received ${uiStyleKitArtifact.name}@${uiStyleKitArtifact.version}.`,
        );
      }

      artifacts.push(uiStyleKitArtifact);
    }

    writeFileSync(
      path.join(consumerDirectory, "package.json"),
      `${JSON.stringify(
        {
          name: "interactive-surface-packed-consumer",
          private: true,
          type: "module",
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    runNpm(
      [
        "install",
        ...artifacts.map((artifact) => artifact.tarballPath),
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--no-package-lock",
        "--cache",
        cacheDirectory,
      ],
      consumerDirectory,
      "npm install packed ecosystem",
    );

    const consumerRequire = createRequire(
      path.join(consumerDirectory, "package.json"),
    );

    return {
      artifacts,
      cleanup() {
        rmSync(fixtureDirectory, { force: true, recursive: true });
      },
      readCss(publicSpecifier: string) {
        return readFileSync(this.resolvePublicExport(publicSpecifier), "utf8");
      },
      resolvePublicExport(publicSpecifier: string) {
        return consumerRequire.resolve(publicSpecifier);
      },
    };
  } catch (error) {
    rmSync(fixtureDirectory, { force: true, recursive: true });
    throw error;
  }
}
