import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import CleanCSS from "clean-css";

const sourceFile = "interactive-surface.css";
const bundleFile = "dist/interactive-surface.css";
const minifiedFile = "dist/interactive-surface.min.css";

async function bundle() {
  await mkdir("dist", { recursive: true });
  await copyFile(sourceFile, bundleFile);
}

function minify() {
  return readFile(bundleFile, "utf8").then((source) => {
    const result = new CleanCSS({ level: 2 }).minify(source);

    if (result.errors.length > 0) {
      throw new Error(result.errors.join("\n"));
    }

    return writeFile(minifiedFile, result.styles);
  });
}

const step = process.argv[2] ?? "build";

if (step === "bundle") {
  await bundle();
} else if (step === "minify") {
  await minify();
} else if (step === "build") {
  await bundle();
  await minify();
} else {
  console.error(`Unknown build step: ${step}`);
  process.exit(1);
}