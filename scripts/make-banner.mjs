// Builds assets/banner.svg — a minimal "coder" banner: name on the left,
// a terminal on the right that types commands in a loop. No photo.
import { mkdirSync, writeFileSync } from "node:fs";

const C = {
  bg: "#0B0D12", panel: "#11141B", edge: "#1E2230", text: "#E6E8EE", muted: "#7A8194",
  dim: "#4A5063", mauve: "#CBA6F7", pink: "#F5C2E7", teal: "#94E2D5", blue: "#89B4FA",
  green: "#A6E3A1", peach: "#FAB387",
};
const SANS = "Inter,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";
const W = 1200, H = 330, T = 13;          // T = loop length in seconds
const f = (n) => Number(n.toFixed(4));
const k = (s) => f(s / T);                // seconds -> keyTime

// dot grid
let dots = "";
for (let x = 20; x < W; x += 24) for (let y = 20; y < H; y += 24)
  dots += `<circle cx="${x}" cy="${y}" r="0.9"/>`;

// terminal geometry
const tx = 630, ty = 38, tw = 520, th = 256, lx = tx + 26, ly0 = ty + 66, LH = 26, CW = 9.7;

// helpers: a line that fades in at time a, and a command that types from a to b
const show = (a) =>
  `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${k(a)};${k(a + 0.05)};${k(T - 0.6)};1" dur="${T}s" repeatCount="indefinite"/>`;
let clips = "";
const typed = (id, text, a, b, x, y) => {
  const n = text.length, vals = [0], times = [0];
  for (let i = 0; i <= n; i++) { vals.push(f(i * CW + 2)); times.push(k(a + ((b - a) * i) / n)); }
  vals.push(f(n * CW + 2), f(n * CW + 2), 0); times.push(k(T - 0.6), k(T - 0.05), 1);
  clips += `<clipPath id="${id}"><rect x="${x}" y="${y - 18}" height="26" width="0"><animate attributeName="width" values="${vals.join(";")}" keyTimes="${times.join(";")}" calcMode="discrete" dur="${T}s" repeatCount="indefinite"/></rect></clipPath>`;
  return id;
};
const prompt = (y, a) =>
  `<text x="${lx}" y="${y}" font-family="${MONO}" font-size="16"><tspan fill="${C.teal}">~</tspan><tspan fill="${C.mauve}" dx="8">$</tspan>${show(a)}</text>`;
const cmdX = lx + 38;

const lines = [];
const steps = [
  { cmd: "whoami", a: 0.6, b: 1.3, out: [[{ t: "tanu saini", c: C.text }]], o: 1.7 },
  { cmd: "cat focus.txt", a: 2.4, b: 3.6, out: [[{ t: "react · node.js · mongodb · dsa in c++", c: C.blue }]], o: 4.0 },
  { cmd: 'git commit -m "keep building"', a: 4.8, b: 7.2, out: [[{ t: "✓ ", c: C.green }, { t: "1 file changed, ∞ insertions(+)", c: C.muted }]], o: 7.7 },
];
let y = ly0;
steps.forEach((s, i) => {
  lines.push(prompt(y, s.a - 0.3));
  const id = typed(`c${i}`, s.cmd, s.a, s.b, cmdX, y);
  lines.push(`<text x="${cmdX}" y="${y}" font-family="${MONO}" font-size="16" fill="${C.text}" clip-path="url(#${id})">${s.cmd.replace(/"/g, "&quot;")}</text>`);
  y += LH;
  s.out.forEach((parts) => {
    lines.push(`<text x="${lx}" y="${y}" font-family="${MONO}" font-size="16">${parts.map((p) => `<tspan fill="${p.c}">${p.t}</tspan>`).join("")}${show(s.o)}</text>`);
    y += LH;
  });
});
// final prompt with blinking cursor
lines.push(prompt(y, 8.3));
lines.push(`<rect x="${cmdX}" y="${y - 14}" width="9" height="18" rx="1" fill="${C.mauve}">
  <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${k(8.3)};${k(8.35)};${k(T - 0.6)};1" dur="${T}s" repeatCount="indefinite"/>
  <animate attributeName="fill-opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.05s" repeatCount="indefinite"/></rect>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tanu Saini — developer">
<defs>
  <linearGradient id="name" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.text}"/><stop offset="0.55" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.mauve}"/>
  </linearGradient>
  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  ${clips}
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <circle cx="260" cy="90" r="150" fill="${C.mauve}" opacity="0.16" filter="url(#blur)">
    <animate attributeName="cx" values="240;330;240" dur="16s" repeatCount="indefinite"/>
  </circle>
  <circle cx="900" cy="260" r="160" fill="${C.teal}" opacity="0.10" filter="url(#blur)">
    <animate attributeName="cy" values="270;200;270" dur="18s" repeatCount="indefinite"/>
  </circle>
  <g fill="${C.edge}">${dots}</g>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${C.edge}"/>

<!-- left: name -->
<text x="72" y="98" font-family="${MONO}" font-size="14" fill="${C.muted}"><tspan fill="${C.mauve}">//</tspan> hello world, i'm</text>
<text x="68" y="168" font-family="${SANS}" font-size="64" font-weight="700" letter-spacing="-1.5" fill="url(#name)">Tanu Saini</text>
<text x="72" y="210" font-family="${SANS}" font-size="19" fill="${C.text}" opacity="0.85">Developer  ·  B.Tech CSE  ·  DSA in C++</text>
<g font-family="${MONO}" font-size="13">
  <rect x="72" y="236" width="98" height="28" rx="14" fill="none" stroke="${C.edge}"/>
  <circle cx="90" cy="250" r="4" fill="${C.green}"><animate attributeName="opacity" values="1;0.35;1" dur="2s" repeatCount="indefinite"/></circle>
  <text x="101" y="254" fill="${C.muted}">building</text>
  <rect x="180" y="236" width="206" height="28" rx="14" fill="none" stroke="${C.edge}"/>
  <text x="196" y="254" fill="${C.muted}">github.com/<tspan fill="${C.text}">saini16tanu</tspan></text>
</g>

<!-- right: terminal -->
<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="12" fill="${C.panel}" stroke="${C.edge}"/>
<line x1="${tx}" y1="${ty + 36}" x2="${tx + tw}" y2="${ty + 36}" stroke="${C.edge}"/>
<circle cx="${tx + 20}" cy="${ty + 18}" r="5.5" fill="#F38BA8"/>
<circle cx="${tx + 38}" cy="${ty + 18}" r="5.5" fill="${C.peach}"/>
<circle cx="${tx + 56}" cy="${ty + 18}" r="5.5" fill="${C.green}"/>
<text x="${tx + tw / 2}" y="${ty + 23}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${C.muted}">tanu@dev: ~</text>
${lines.join("\n")}
</svg>`;

mkdirSync("assets", { recursive: true });
writeFileSync("assets/banner.svg", svg);
console.log("ok", svg.length);
