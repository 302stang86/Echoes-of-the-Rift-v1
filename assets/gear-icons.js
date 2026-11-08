/* Original vector icons for every piece of gear. Drawn in code so they scale and need no image files.
   GearIcons.svg(item, px) returns an <svg> string. Tier changes the materials: hide, leather, fur. */
(function (root) {
  const WOOD = ["#a9773f", "#6d4724"];
  const PAL = {
    1: { main: "#a47245", dark: "#6a4526", light: "#c9976a", trim: "#d8c3a0" },
    2: { main: "#7a4b27", dark: "#43280f", light: "#a06a3a", trim: "#e8dcc4" },
    3: { main: "#74502f", dark: "#2d1b0d", light: "#926a43", trim: "#f6f1e7" },
  };
  const fur = (pts, p) => pts.map(([x, y, r = 4.5]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.trim}" stroke="#b8ad98" stroke-width="1"/>`).join("");
  const st = (d, p) => `<path d="${d}" fill="none" stroke="${p.trim}" stroke-width="1.2" stroke-dasharray="2.5 2.5" opacity=".85"/>`;
  const body = (d, p, extra = "") => `<path d="${d}" fill="${p.main}" stroke="${p.dark}" stroke-width="2" stroke-linejoin="round"/>${extra}`;
  const ICONS = {
    shirt: (p, tier) => body("M20 10 L28 13 Q32 18 36 13 L44 10 L57 22 L49 31 L44 27 L44 55 L20 55 L20 27 L15 31 L7 22 Z", p, `<path d="M28 13 Q32 18 36 13" fill="none" stroke="${p.dark}" stroke-width="2"/>${st("M23 50 H41", p)}${tier > 1 ? st("M32 20 V50", p) : ""}${tier === 3 ? fur([[24, 55], [32, 56], [40, 55], [10, 27, 4], [54, 27, 4]], p) : ""}`),
    pants: (p, tier) => body("M19 8 H45 L48 57 H35 L32 30 L29 57 H16 Z", p, `<rect x="19" y="8" width="26" height="6" fill="${p.dark}" opacity=".6"/>${st("M32 14 V30", p)}${st("M22 50 H28", p)}${st("M36 50 H43", p)}${tier === 3 ? fur([[22, 57], [29, 57], [38, 57], [44, 57]], p) : ""}`),
    shoes: (p, tier) => body("M22 8 H38 V32 L53 38 Q58 40 58 46 V54 H20 Z", p, `<rect x="20" y="49" width="38" height="6" rx="2" fill="${p.dark}"/>${st("M26 18 H34", p)}${st("M26 24 H34", p)}${tier > 1 ? `<path d="M23 12 H37" stroke="${p.light}" stroke-width="2"/>` : ""}${tier === 3 ? fur([[24, 8], [30, 7], [36, 8]], p) : ""}`),
    gloves: (p, tier) => body("M20 34 V16 Q20 12 24 12 Q28 12 28 16 V28 V10 Q28 6 32 6 Q36 6 36 10 V28 V12 Q36 8 40 8 Q44 8 44 12 V30 V18 Q44 14 48 14 Q52 14 52 18 V40 Q52 52 40 52 H32 Q22 52 18 44 L12 34 Q10 30 14 28 Q18 28 20 34 Z", p, `<rect x="20" y="48" width="32" height="9" rx="2" fill="${tier === 3 ? p.trim : p.dark}" stroke="${p.dark}" stroke-width="2"/>${st("M24 40 H46", p)}`),
    coat: (p, tier) => body("M18 8 L28 12 L32 21 L36 12 L46 8 L59 23 L51 31 L47 27 L47 59 L17 59 L17 27 L13 31 L5 23 Z", p, `<path d="M32 21 V59" stroke="${p.dark}" stroke-width="2"/>${[30, 38, 46].map((y) => `<circle cx="36" cy="${y}" r="1.8" fill="${p.trim}" stroke="${p.dark}"/>`).join("")}<path d="M17 52 H47" stroke="${p.dark}" stroke-width="1.5" opacity=".6"/>${tier > 1 ? `<path d="M21 27 H29 M35 27 H43" stroke="${p.light}" stroke-width="2"/>` : ""}${tier === 3 ? fur([[20, 11, 4.5], [27, 13], [37, 13], [44, 11, 4.5], [32, 22, 4], [20, 59, 4], [30, 60, 4], [38, 60, 4], [46, 59, 4]], p) : `<path d="M28 12 L32 21 L36 12" fill="${p.light}" stroke="${p.dark}" stroke-width="2"/>`}`),
    axe: (_, tier) => {
      const head = tier === 1 ? ["#9aa1a9", "#5c636b", "#c8cdd2"] : ["#6f8199", "#33414f", "#dfe8f1"];
      return `<g transform="rotate(38 32 32)"><rect x="29.5" y="6" width="5" height="54" rx="2.5" fill="${WOOD[0]}" stroke="${WOOD[1]}" stroke-width="1.6"/><path d="M34 9 L50 5 Q56 20 50 34 L34 30 Z" fill="${head[0]}" stroke="${head[1]}" stroke-width="2" stroke-linejoin="round"/><path d="M50 6 Q55 20 50 33" fill="none" stroke="${head[2]}" stroke-width="2"/>${tier === 1 ? `<path d="M29 14 H35 M29 18 H35" stroke="#d8c3a0" stroke-width="1.5"/>` : `<rect x="29" y="28" width="6" height="4" fill="${head[1]}"/>`}</g>`;
    },
    pole: (_, tier) => `<path d="M8 58 L52 8" stroke="${WOOD[1]}" stroke-width="5.5" stroke-linecap="round"/><path d="M8 58 L52 8" stroke="${WOOD[0]}" stroke-width="3" stroke-linecap="round"/><path d="M52 8 Q61 26 50 40" fill="none" stroke="#e9eef2" stroke-width="1.4"/><path d="M50 40 Q44 46 49 51" fill="none" stroke="${tier === 2 ? "#f3ecd9" : "#b8c0c8"}" stroke-width="2.2" stroke-linecap="round"/>${tier === 2 ? `<path d="M49 51 L45 49 M47 47 L43 46" stroke="#f3ecd9" stroke-width="2" stroke-linecap="round"/>` : ""}<circle cx="30" cy="33" r="3" fill="#b6c2cc" stroke="#55626d"/>`,
    basket: (_, tier) => `<path d="M14 28 Q32 -2 50 28" fill="none" stroke="${WOOD[1]}" stroke-width="3.5" stroke-linecap="round"/><path d="M10 28 H54 L47 56 Q46 58 44 58 H20 Q18 58 17 56 Z" fill="#d1a85e" stroke="#8a6628" stroke-width="2" stroke-linejoin="round"/>${[36, 44, 52].map((y) => `<path d="M${12 + (y - 28) * 0.2} ${y} H${52 - (y - 28) * 0.2}" stroke="#8a6628" stroke-width="1.4"/>`).join("")}${[20, 28, 36, 44].map((x) => `<path d="M${x} 28 L${x + (x < 32 ? 1 : -1)} 57" stroke="#a98238" stroke-width="1.3"/>`).join("")}${tier === 2 ? `<rect x="10" y="26" width="44" height="7" rx="2" fill="#7a4b27" stroke="#43280f" stroke-width="1.6"/>` : ""}${[[22, 25], [30, 22], [38, 25], [45, 26]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${i % 2 ? "#b73a63" : "#d1485b"}" stroke="#7a2038"/>`).join("")}`,
    spear: (_, tier) => {
      const tip = tier === 1 ? ["#b88a52", "#6d4724"] : tier === 2 ? ["#f3ecd9", "#a99a78"] : ["#9fb1c6", "#3d4b5b"];
      return `<g transform="rotate(42 32 32)"><rect x="30" y="14" width="4" height="48" rx="2" fill="${WOOD[0]}" stroke="${WOOD[1]}" stroke-width="1.4"/><path d="M32 1 L38 17 Q32 20 26 17 Z" fill="${tip[0]}" stroke="${tip[1]}" stroke-width="2" stroke-linejoin="round"/>${tier === 2 ? `<path d="M26 17 L22 22 M38 17 L42 22" stroke="${tip[1]}" stroke-width="2" stroke-linecap="round"/><path d="M26 17 L23 21 L28 20 Z M38 17 L41 21 L36 20 Z" fill="${tip[0]}"/>` : ""}${tier === 3 ? `<path d="M32 4 V16" stroke="#e7eef6" stroke-width="1.5"/>` : ""}<path d="M29 20 H35 M29 23 H35 M29 26 H35" stroke="#d8c3a0" stroke-width="1.5"/></g>`;
    },
  };
  function svg(item, px) {
    const fam = item.fam || item, tier = item.tier || 1, p = PAL[tier] || PAL[1];
    const draw = ICONS[fam]; if (!draw) return "";
    const s = px || 40;
    return `<svg class="gear-svg" viewBox="0 0 64 64" width="${s}" height="${s}" role="img" aria-label="${(item.name || fam).replace(/"/g, "")}"><title>${(item.name || fam).replace(/</g, "")}</title>${draw(p, tier)}</svg>`;
  }
  const api = { svg, families: Object.keys(ICONS) };
  root.GearIcons = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
