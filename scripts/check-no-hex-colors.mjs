import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, "..", "interactive-surface.css");

const source = fs.readFileSync(targetFile, "utf8");
const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
const lines = source.split(/\r?\n/);
const violations = [];

lines.forEach((line, index) => {
  let match = hexPattern.exec(line);
  while (match) {
    violations.push({
      line: index + 1,
      value: match[0]
    });
    match = hexPattern.exec(line);
  }
  hexPattern.lastIndex = 0;
});

if (!violations.length) {
  console.log("No hex color literals found in interactive-surface.css.");
  process.exit(0);
}

console.error("Hex color literals are not allowed in interactive-surface.css:");
violations.forEach((violation) => {
  console.error(`- line ${violation.line}: ${violation.value}`);
});
console.error("Use CSS functional color notation instead (for example, rgb(...), rgb(... / <alpha>), or hsl(...)).");
process.exit(1);
