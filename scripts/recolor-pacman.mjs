// Recolors the Pac-Man dark SVG (GitHub greens -> lavender theme, darker background)
// so it matches the banner and the cat chart. Safe: it only swaps known colors.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const file = "dist/pacman-contribution-graph-dark.svg";
if (!existsSync(file)) { console.log("no dark pacman file, skipping"); process.exit(0); }

const map = {
  "#0d1117": "#0B0D12", // page background
  "#161b22": "#161A23", // empty squares
  "#0e4429": "#3B2F57", "#006d32": "#6A4F9E", "#26a641": "#9D7BD8", "#39d353": "#CBA6F7", // dark greens
  "#9be9a8": "#3B2F57", "#40c463": "#6A4F9E", "#30a14e": "#9D7BD8", "#216e39": "#CBA6F7", // light greens
};
let svg = readFileSync(file, "utf8"), n = 0;
for (const [from, to] of Object.entries(map)) {
  svg = svg.replace(new RegExp(from, "gi"), () => (n++, to));
}
writeFileSync(file, svg);
console.log(`recolored ${n} color values in ${file}`);
