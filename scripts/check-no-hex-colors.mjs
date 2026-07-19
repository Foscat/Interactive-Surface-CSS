import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const targetFiles = [
  "styles/state-core.css",
  "styles/standalone-preset.css",
  "state-core.css",
  "standalone-preset.css",
  "interactive-surface.css"
];
const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
const violations = [];

targetFiles.forEach((targetFile) => {
  const source = fs.readFileSync(path.join(projectRoot, targetFile), "utf8");

  source.split(/\r?\n/).forEach((line, index) => {
    let match = hexPattern.exec(line);

    while (match) {
      violations.push({
        file: targetFile,
        line: index + 1,
        value: match[0]
      });
      match = hexPattern.exec(line);
    }

    hexPattern.lastIndex = 0;
  });
});

if (violations.length === 0) {
  console.log(`No hex color literals found in ${targetFiles.length} checked stylesheets.`);
  process.exit(0);
}

console.error("Hex color literals are not allowed:");
violations.forEach((violation) => {
  console.error(`- ${violation.file}:${violation.line}: ${violation.value}`);
});
console.error("Use CSS functional color notation instead (for example, rgb(...), rgb(... / <alpha>), or hsl(...)).");
process.exit(1);
