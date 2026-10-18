// dist/cat-walk.svg — a coder cat (hoodie + headphones) walks the contribution
// calendar like a snake: it eats every lit square and drags a glowing tail.
// Theme matches assets/banner.svg (near-black + lavender/pink).
//
// GitHub Actions: GITHUB_TOKEN=... USERNAME=saini16tanu node scripts/cat-walk.mjs
// Local preview:  node scripts/cat-walk.mjs --demo
import { mkdirSync, writeFileSync } from "node:fs";

const DEMO = process.argv.includes("--demo");
const USER = process.env.USERNAME || "saini16tanu";
const C = {
  bg: "#0B0D12", edge: "#1E2230", text: "#E6E8EE", muted: "#7A8194", mauve: "#CBA6F7",
  pink: "#F5C2E7", teal: "#94E2D5", hoodie: "#313244", hoodie2: "#45475A", fur: "#E6E8EE",
  levels: ["#161A23", "#3B2F57", "#6A4F9E", "#9D7BD8", "#CBA6F7"],
};
const SANS = "Inter,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";
const f = (n) => Number(n.toFixed(4));

async function calendar() {
  if (DEMO) {
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const start = Date.UTC(2025, 9, 19), weeks = [];
    for (let w = 0; w < 53; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const lvl = r() < (w > 42 ? 0.4 : 0.07) ? 1 + Math.floor(r() * 4) : 0;
        days.push({ date: new Date(start + (w * 7 + d) * 864e5).toISOString().slice(0, 10), weekday: d, level: lvl, count: lvl });
      }
      weeks.push(days);
    }
    return { weeks, total: weeks.flat().reduce((a, d) => a + d.count, 0) };
  }
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
    totalContributions weeks{contributionDays{date weekday contributionCount contributionLevel}}}}}}`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const json = await res.json();
  if (!json.data?.user) throw new Error("GraphQL error: " + JSON.stringify(json.errors || json));
  const cal = json.data.user.contributionsCollection.contributionCalendar;
  const L = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({
      date: d.date, weekday: d.weekday, level: L[d.contributionLevel] ?? 0, count: d.contributionCount,
    }))),
  };
}

function render({ weeks, total }) {
  const P = 15, S = 11, nW = weeks.length;
  const padL = 40, padR = 40, top = 82;
  const W = padL + nW * P + padR, H = top + 7 * P + 54;
  const cx = (w) => padL + w * P + S / 2, cy = (d) => top + d * P + S / 2;

  // snake path: row by row, alternating direction, starting/ending off-grid
  const pts = [[cx(-3), cy(0)]];
  for (let r = 0; r < 7; r++) {
    const ltr = r % 2 === 0;
    pts.push([cx(ltr ? -1 : nW), cy(r)], [cx(ltr ? nW : -1), cy(r)]);
  }
  pts.push([cx(nW + 4), cy(6)]);
  const path = pts.filter((p, i) => !i || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const L = seg.reduce((a, b) => a + b, 0);
  const d = "M" + path.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L");
  const WF = 0.93, DUR = f(L / 175 / WF);
  const at = (w, r) => {
    let s = 0;
    for (let i = 0; i < seg.length; i++) {
      const [x1, y1] = path[i], [x2] = path[i + 1];
      if (y1 === cy(r) && path[i + 1][1] === y1 && Math.min(x1, x2) <= cx(w) && cx(w) <= Math.max(x1, x2)) return s + Math.abs(cx(w) - x1);
      s += seg[i];
    }
    return L;
  };

  // facing direction per row
  const ft = [0], fv = ["1 1"];
  for (let r = 1; r < 7; r++) { ft.push(f((at(r % 2 ? nW : -1, r) / L) * WF)); fv.push(r % 2 ? "-1 1" : "1 1"); }
  ft.push(1); fv.push("1 1");

  // grid + eating
  let cells = "", pops = "";
  weeks.forEach((wk, w) => wk.forEach((day) => {
    const x = padL + w * P, y = top + day.weekday * P, col = C.levels[day.level];
    if (!day.level) { cells += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="3" fill="${col}"/>`; return; }
    const a = f(Math.min((at(w, day.weekday) / L) * WF, WF - 0.003));
    const a2 = f(a + 0.002), back = f(WF + 0.02), a3 = f(Math.min(a + 0.018, 0.999));
    cells += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="3" fill="${col}"><animate attributeName="fill" values="${col};${col};${C.levels[0]};${C.levels[0]};${col}" keyTimes="0;${a};${a2};${back};1" dur="${DUR}s" repeatCount="indefinite"/></rect>`;
    pops += `<rect x="${x + S / 2}" y="${y + S / 2}" width="0" height="0" rx="3" fill="none" stroke="${C.pink}" stroke-width="1.3"><animate attributeName="x" values="${x + S / 2};${x + S / 2};${x - 4};${x - 4}" keyTimes="0;${a};${a3};1" dur="${DUR}s" repeatCount="indefinite"/><animate attributeName="y" values="${y + S / 2};${y + S / 2};${y - 4};${y - 4}" keyTimes="0;${a};${a3};1" dur="${DUR}s" repeatCount="indefinite"/><animate attributeName="width" values="0;0;${S + 8};${S + 8}" keyTimes="0;${a};${a3};1" dur="${DUR}s" repeatCount="indefinite"/><animate attributeName="height" values="0;0;${S + 8};${S + 8}" keyTimes="0;${a};${a3};1" dur="${DUR}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;${a};${a3};1" dur="${DUR}s" repeatCount="indefinite"/></rect>`;
  }));

  // months
  let months = "", last = "";
  weeks.forEach((wk, w) => {
    const m = new Date(wk[0].date + "T00:00:00Z").toLocaleString("en", { month: "short", timeZone: "UTC" }).toLowerCase();
    if (m !== last && w < nW - 1) { months += `<text x="${padL + w * P}" y="${top - 10}">${m}</text>`; last = m; }
  });

  const motion = (begin) => `<animateMotion path="${d}" dur="${DUR}s" begin="${f(begin)}s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;${WF};1" calcMode="linear"/>`;

  // snake tail: rounded squares that shrink and fade
  const LAG = 0.085, TAIL = 9;
  let tail = "";
  for (let i = TAIL; i >= 1; i--) {
    const s = f(S - i * 0.55), col = i < 4 ? C.pink : i < 7 ? C.mauve : C.levels[3];
    tail += `<rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${s}" height="${s}" rx="3" fill="${col}" opacity="${f(1 - i * 0.085)}">${motion(i * LAG - DUR)}</rect>`;
  }

  // coder cat: hoodie, headphones, blinking eyes (drawn facing right)
  const cat = `<g>
  <animateTransform attributeName="transform" type="scale" calcMode="discrete" values="${fv.join(";")}" keyTimes="${ft.join(";")}" dur="${DUR}s" repeatCount="indefinite"/>
  <g><animateTransform attributeName="transform" type="translate" values="0 0;0 -1.2;0 0" dur="0.3s" repeatCount="indefinite"/>
    <path d="M-8 -3 C-13 -4 -14 -11 -10.5 -14" stroke="${C.fur}" stroke-width="2.6" fill="none" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-12 -8 -3;12 -8 -3;-12 -8 -3" dur="0.7s" repeatCount="indefinite"/></path>
    <g fill="${C.fur}">
      <rect x="-6" y="1" width="2.4" height="4.5" rx="1.2"><animate attributeName="y" values="1;-0.3;1" dur="0.3s" repeatCount="indefinite"/></rect>
      <rect x="-2.6" y="1" width="2.4" height="4.5" rx="1.2"><animate attributeName="y" values="-0.3;1;-0.3" dur="0.3s" repeatCount="indefinite"/></rect>
      <rect x="1.6" y="1" width="2.4" height="4.5" rx="1.2"><animate attributeName="y" values="1;-0.3;1" dur="0.3s" repeatCount="indefinite"/></rect>
      <rect x="5" y="1" width="2.4" height="4.5" rx="1.2"><animate attributeName="y" values="-0.3;1;-0.3" dur="0.3s" repeatCount="indefinite"/></rect>
    </g>
    <rect x="-9" y="-8" width="18" height="10.5" rx="5" fill="${C.hoodie}"/>
    <path d="M-4 -6.5 L4 -6.5" stroke="${C.hoodie2}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M3.5 -14 L4.4 -20 L8 -15.8 Z M10.4 -15.8 L14 -20 L14.8 -14 Z" fill="${C.fur}"/>
    <path d="M4.8 -15.2 L5.3 -18.2 L7 -16 Z M11.4 -16 L13.2 -18.2 L13.6 -15.2 Z" fill="${C.pink}"/>
    <circle cx="9.2" cy="-10.5" r="6" fill="${C.fur}"/>
    <path d="M2.6 -11.5 A6.8 6.8 0 0 1 15.8 -11.5" stroke="${C.mauve}" stroke-width="1.6" fill="none"/>
    <rect x="1.5" y="-12.5" width="3" height="5" rx="1.4" fill="${C.mauve}"/>
    <rect x="13.9" y="-12.5" width="3" height="5" rx="1.4" fill="${C.mauve}"/>
    <g fill="${C.bg}">
      <rect x="6.6" y="-11.6" width="1.6" height="2.2" rx="0.8"><animate attributeName="height" values="2.2;2.2;0.3;2.2" keyTimes="0;0.92;0.96;1" dur="3.2s" repeatCount="indefinite"/></rect>
      <rect x="10.6" y="-11.6" width="1.6" height="2.2" rx="0.8"><animate attributeName="height" values="2.2;2.2;0.3;2.2" keyTimes="0;0.92;0.96;1" dur="3.2s" repeatCount="indefinite"/></rect>
    </g>
    <path d="M8.8 -8.2 L9.4 -7.6 L10 -8.2" stroke="${C.pink}" stroke-width="0.8" fill="none" stroke-linecap="round"/>
  </g>
</g>`;

  let dots = "";
  for (let x = 16; x < W; x += 22) for (let y = 16; y < H; y += 22) dots += `<circle cx="${x}" cy="${y}" r="0.8"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribution calendar with a coder cat">
<defs><clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="50"/></filter></defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <circle cx="${W - 160}" cy="40" r="120" fill="${C.mauve}" opacity="0.10" filter="url(#blur)"/>
  <g fill="${C.edge}">${dots}</g>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${C.edge}"/>
<text x="${padL}" y="40" font-family="${MONO}" font-size="14"><tspan fill="${C.teal}">~</tspan><tspan fill="${C.mauve}" dx="8">$</tspan><tspan fill="${C.text}" dx="8">./mochi --eat commits</tspan></text>
<text x="${W - padR}" y="40" text-anchor="end" font-family="${MONO}" font-size="14" fill="${C.muted}"><tspan fill="${C.mauve}">${total}</tspan> commits this year</text>
<g font-family="${MONO}" font-size="10" fill="${C.muted}">${months}</g>
${cells}
${pops}
${tail}
<g>${motion(0)}<g transform="translate(0 2) scale(1.2)">${cat}</g></g>
<g font-family="${MONO}" font-size="11" fill="${C.muted}">
  <text x="${padL}" y="${H - 20}"><tspan fill="${C.mauve}">//</tspan> one commit at a time</text>
  <text x="${W - padR - 104}" y="${H - 20}" text-anchor="end">less</text>
  ${C.levels.map((c, i) => `<rect x="${W - padR - 98 + i * 14}" y="${H - 29}" width="${S}" height="${S}" rx="3" fill="${c}"/>`).join("")}
  <text x="${W - padR}" y="${H - 20}" text-anchor="end">more</text>
</g>
</svg>`;
}

const cal = await calendar();
mkdirSync("dist", { recursive: true });
writeFileSync("dist/cat-walk.svg", render(cal));
console.log(`cat-walk.svg: ${cal.total} contributions, ${cal.weeks.length} weeks`);
