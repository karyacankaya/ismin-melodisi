// İsmin Melodisi — tarot kartı çizimi (SVG)
// Ortak çerçeve: parşömen kenar, noktalı altın bordür, art nouveau kemerli pencere,
// kemerin tepesinde Roma rakamı madalyonu, altta oyma baskı tarzı kart adı.
// İç panelin renk dünyası kartın kendi renklerinden gelir; gökyüzü suluboya gibi boyanır.
// İki deste: kendi çizdiğimiz sembolik sahneler ya da (image verilirse) orijinal resim.

import { createRng } from './numerology.js';

const W = 300;
const H = 520;
const PX = 18; // panel sol
const PR = 282; // panel sağ
const PT = 24; // kemerin tepesi
const SPRING = 84; // kemerin başladığı yükseklik
const PB = 448; // panel alt
const PANEL_PATH = `M${PX},${PB} V${SPRING} A${(PR - PX) / 2},${SPRING - PT} 0 0 1 ${PR},${SPRING} V${PB} Z`;
const PANEL_W = PR - PX;
const PANEL_H = PB - PT;

// Orijinal kart resmi (≈ 600×1040): beyaz kenar, üstteki numara ve alttaki İngilizce
// ad panelin dışında kalsın diye büyütülüp kaydırılır (yalnızca çizim görünür)
const IMG_W = PANEL_W / 0.855;
const IMG_H = IMG_W * 1.733;

const PARCHMENT = '#efe4cc';
const INK = '#1e1712';

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

const f1 = (n) => +n.toFixed(1);

function starPath(cx, cy, R, r, points = 8, rot = -Math.PI / 2) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = rot + (i * Math.PI) / points;
    d += (i ? 'L' : 'M') + f1(cx + rad * Math.cos(a)) + ',' + f1(cy + rad * Math.sin(a));
  }
  return d + 'Z';
}

/** Merkezden dışa ışınlar; alt > 0 ise her ikinci ışın kısa. */
function rays(cx, cy, r1, r2, n, stroke, width = 2, opacity = 1, alt = 0, rot = -Math.PI / 2) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const r = alt && i % 2 ? r1 + (r2 - r1) * alt : r2;
    out += `<line x1="${f1(cx + r1 * Math.cos(a))}" y1="${f1(cy + r1 * Math.sin(a))}" x2="${f1(cx + r * Math.cos(a))}" y2="${f1(cy + r * Math.sin(a))}"/>`;
  }
  return `<g stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}">${out}</g>`;
}

/** Dört kollu parıltı. */
const sparkle = (x, y, s, fill) => `<path d="${starPath(x, y, s, s * 0.22, 4)}" fill="${fill}"/>`;

/** Beş yapraklı gül. */
function rose(x, y, r, petal, heart) {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    out += `<circle cx="${f1(x + r * 0.55 * Math.cos(a))}" cy="${f1(y + r * 0.55 * Math.sin(a))}" r="${f1(r * 0.5)}" fill="${petal}"/>`;
  }
  return out + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.32)}" fill="${heart}"/>`;
}

/** Ufuktaki tepeler. */
const hills = (fill, y = 392, op = 1) =>
  `<path d="M${PX},${y} Q70,${y - 18} 120,${y - 4} T210,${y - 10} T${PR},${y - 2} V${PB} H${PX}Z" fill="${fill}" opacity="${op}"/>`;

/** Su yüzeyi dalgaları. */
function waves(y0, rowsN, stroke, op = 0.6) {
  let out = '';
  for (let r = 0; r < rowsN; r++) {
    const y = y0 + r * 16;
    const x0 = PX + (r % 2 ? 22 : 6);
    out += `<path d="M${x0},${y} q15,-7 30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0" opacity="${f1(op * (1 - r * 0.22))}"/>`;
  }
  return `<g fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round">${out}</g>`;
}

/** Kartın gökyüzü: suluboya bulutsular + yıldız tozu (karta göre hep aynı). */
function sky(card, c, id) {
  const rng = createRng(card.number * 977 + 13);
  let clouds = '';
  for (let i = 0; i < 5; i++) {
    const x = PX + rng() * PANEL_W;
    const y = PT + 30 + rng() * PANEL_H * 0.6;
    const rx = 50 + rng() * 70;
    const ry = 26 + rng() * 34;
    const fill = i % 2 ? c.L : c.A;
    clouds += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" opacity="${f1(0.08 + rng() * 0.1)}"/>`;
  }
  let dust = '';
  for (let i = 0; i < 34; i++) {
    const x = PX + 8 + rng() * (PANEL_W - 16);
    const y = PT + 20 + rng() * (PANEL_H * 0.66);
    const s = 1 + rng() * 2.4;
    dust += rng() < 0.3
      ? sparkle(f1(x), f1(y), f1(s * 2.2), c.L)
      : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s * 0.4)}" fill="${c.L}" opacity="${f1(0.35 + rng() * 0.55)}"/>`;
  }
  return `<g filter="url(#wash-${id})">${clouds}</g>${dust}`;
}

// Kartlara özel sahneler. c: { M ana, A vurgu, L açık, D koyu, F yaldız, H hâle, P kâğıt }
const SCENES = {
  // 0 Deli: doğan güneş, uçurum kenarı, beyaz gül, rüzgâr ve kuşlar
  0: (c) => `
    <circle cx="208" cy="122" r="70" fill="${c.H}"/>
    ${rays(208, 122, 40, 66, 20, c.F, 3, 0.9, 0.55)}
    <circle cx="208" cy="122" r="34" fill="${c.F}"/>
    <path d="M70,170 q8,-8 16,0 q8,-8 16,0 M108,146 q6,-6 12,0 q6,-6 12,0" fill="none" stroke="${c.D}" stroke-width="2" stroke-linecap="round"/>
    <path d="M40,250 q60,-40 130,-14 M56,276 q50,-26 110,-8" fill="none" stroke="${c.P}" stroke-width="2" opacity=".7" stroke-linecap="round"/>
    <path d="M150,${PB} L178,392 L206,410 L238,370 L${PR},404 V${PB}Z" fill="${shade(c.M, -0.25)}"/>
    <path d="M${PX},${PB} V330 Q60,316 112,326 L148,342 L134,${PB}Z" fill="${c.D}"/>
    ${rose(82, 306, 18, c.P, c.F)}
    <path d="M82,324 v26" stroke="${shade(c.D, 0.25)}" stroke-width="3"/>`,

  // I Büyücü: sonsuzluk işareti, ışık saçan asa, masada dört element, gül kemeri
  1: (c) => `
    ${[60, 92, 124, 156, 188, 220].map((x, i) => rose(x + 12, 70 + Math.abs(i - 2.5) * 9, 9, shade(c.A, -0.1), c.P)).join('')}
    <circle cx="150" cy="176" r="56" fill="${c.H}"/>
    ${rays(150, 176, 22, 44, 16, c.F, 1.6, 0.85, 0.6)}
    <path d="M110,118 C110,96 140,96 150,118 C160,140 190,140 190,118 C190,96 160,96 150,118 C140,140 110,140 110,118Z" fill="none" stroke="${c.F}" stroke-width="5"/>
    <circle cx="150" cy="176" r="13" fill="${c.L}"/>
    <path d="M146,176 h8 l-2,156 h-4Z" fill="${c.F}"/>
    <rect x="40" y="336" width="220" height="13" rx="2" fill="${c.F}"/>
    <path d="M52,349 h14 v${PB - 349} h-14Z M234,349 h14 v${PB - 349} h-14Z" fill="${c.D}"/>
    <path d="M66,300 h28 l-5,20 h-18Z M80,320 v10 M70,332 h20" stroke="${c.F}" stroke-width="2.5" fill="${c.F}"/>
    <circle cx="126" cy="318" r="14" fill="none" stroke="${c.F}" stroke-width="2.5"/>
    <path d="${starPath(126, 318, 11, 4.2, 5)}" fill="${c.F}"/>
    <path d="M172,334 L198,288 M178,314 l14,7" stroke="${c.L}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M220,334 L234,296" stroke="${c.F}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="235" cy="292" r="4" fill="${c.L}"/>`,

  // II Azize: iki sütun (B ve J), nar desenli perde, üçlü ay tacı, ayakta hilal
  2: (c) => `
    <rect x="96" y="96" width="108" height="270" fill="${shade(c.M, 0.15)}" opacity=".7"/>
    ${Array.from({ length: 15 }, (_, i) => {
      const x = 112 + (i % 3) * 38;
      const y = 120 + Math.floor(i / 3) * 50;
      return `<circle cx="${x}" cy="${y}" r="9" fill="${shade(c.A, -0.1)}" opacity=".55"/><path d="M${x - 3},${y - 9} l3,-4 l3,4" fill="${shade(c.A, -0.1)}" opacity=".55"/>`;
    }).join('')}
    <rect x="44" y="110" width="40" height="300" fill="${shade(c.M, -0.55)}"/>
    <rect x="216" y="110" width="40" height="300" fill="${c.L}"/>
    <path d="M38,110 h52 l-6,-14 h-40Z M210,110 h52 l-6,-14 h-40Z" fill="${c.F}"/>
    <text x="64" y="160" text-anchor="middle" font-family="Cinzel, serif" font-size="22" font-weight="700" fill="${c.L}">B</text>
    <text x="236" y="160" text-anchor="middle" font-family="Cinzel, serif" font-size="22" font-weight="700" fill="${shade(c.M, -0.4)}">J</text>
    <circle cx="150" cy="78" r="13" fill="${c.L}"/>
    <path d="M118,78 a14,14 0 1 0 14,-14 a10,10 0 1 1 -14,14Z M182,78 a14,14 0 1 1 -14,-14 a10,10 0 1 0 14,14Z" fill="${c.L}"/>
    <circle cx="150" cy="300" r="46" fill="${c.H}"/>
    <path d="M118,388 a40,40 0 0 0 64,0 a34,34 0 0 1 -64,0Z" fill="${c.F}"/>
    <rect x="124" y="240" width="52" height="34" rx="4" fill="${c.P}"/>
    <text x="150" y="263" text-anchor="middle" font-family="Cinzel, serif" font-size="13" font-weight="700" fill="${INK}">TORA</text>`,

  // III İmparatoriçe: on iki yıldızlı taç, Venüs kalkanı, buğday başakları
  3: (c) => `
    ${Array.from({ length: 12 }, (_, i) => {
      const a = Math.PI + (i / 11) * Math.PI;
      return `<path d="${starPath(150 + 92 * Math.cos(a), 168 + 70 * Math.sin(a), 8, 3, 6)}" fill="${c.F}"/>`;
    }).join('')}
    <circle cx="150" cy="210" r="80" fill="${c.H}"/>
    <path d="M150,300 C96,262 92,206 122,190 C138,182 148,192 150,202 C152,192 162,182 178,190 C208,206 204,262 150,300Z" fill="${c.A}" stroke="${c.F}" stroke-width="3"/>
    <circle cx="150" cy="226" r="16" fill="none" stroke="${c.P}" stroke-width="4"/>
    <path d="M150,242 v26 M140,256 h20" stroke="${c.P}" stroke-width="4" stroke-linecap="round"/>
    ${hills(shade(c.M, -0.35), 380)}
    ${[50, 74, 98, 202, 226, 250].map((x, i) => `
      <path d="M${x},${PB} Q${x + 4},400 ${x + (i < 3 ? -4 : 4)},350" stroke="${c.F}" stroke-width="2.5" fill="none"/>
      ${[0, 1, 2, 3, 4].map((k) => `<ellipse cx="${x + (i < 3 ? -4 : 4) + (k % 2 ? 5 : -5)}" cy="${356 + k * 9}" rx="4" ry="7" fill="${c.F}" transform="rotate(${k % 2 ? 25 : -25} ${x + (i < 3 ? -4 : 4) + (k % 2 ? 5 : -5)} ${356 + k * 9})"/>`).join('')}`).join('')}`,

  // IV İmparator: dağlar, koç boynuzlu taht, ankh asa ve küre
  4: (c) => `
    <path d="M${PX},330 L70,190 L110,270 L160,150 L214,262 L250,200 L${PR},280 V${PB} H${PX}Z" fill="${shade(c.A, -0.35)}"/>
    <path d="M70,190 l-12,26 l12,-6 l12,6Z M160,150 l-14,30 l14,-7 l14,7Z M250,200 l-10,22 l10,-5 l10,5Z" fill="${c.L}" opacity=".8"/>
    <rect x="80" y="200" width="140" height="210" rx="4" fill="${shade(c.M, -0.3)}" stroke="${c.F}" stroke-width="3"/>
    <path d="M80,212 c-22,-6 -26,-36 -4,-40 c16,-2 18,16 6,18 M220,212 c22,-6 26,-36 4,-40 c-16,-2 -18,16 -6,18" fill="none" stroke="${c.F}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="150" cy="250" r="22" fill="none" stroke="${c.F}" stroke-width="7"/>
    <path d="M150,272 v84 M124,292 h52" stroke="${c.F}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="150" cy="384" r="16" fill="${c.F}"/>
    <path d="M150,368 v-8 M144,362 h12" stroke="${c.F}" stroke-width="3"/>`,

  // V Aziz: üç katlı taç, çapraz anahtarlar, üçlü haç asa
  5: (c) => `
    <circle cx="150" cy="150" r="70" fill="${c.H}"/>
    <path d="M118,190 h64 l-6,-22 h-52Z M122,166 h56 l-6,-22 h-44Z M126,142 h48 l-8,-22 h-32Z" fill="${c.F}" stroke="${c.D}" stroke-width="1.5"/>
    <path d="M150,120 v-18 M144,106 h12" stroke="${c.F}" stroke-width="3"/>
    <path d="M150,206 v190 M136,222 h28 M132,238 h36 M128,254 h44" stroke="${c.P}" stroke-width="5" stroke-linecap="round"/>
    <g stroke="${c.F}" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M86,280 L214,380 M214,280 L86,380"/>
      <circle cx="80" cy="274" r="13"/><circle cx="220" cy="274" r="13"/>
    </g>
    <path d="M206,374 l10,-12 l8,6 M94,374 l-10,-12 l-8,6" stroke="${c.F}" stroke-width="5" fill="none"/>
    <rect x="${PX}" y="408" width="${PANEL_W}" height="40" fill="${c.D}"/>
    <path d="M${PX},408 h${PANEL_W}" stroke="${c.F}" stroke-width="2"/>`,

  // VI Aşıklar: kanatlı güneş, iç içe iki kalp, iki ağaç (alev ve elma)
  6: (c) => `
    <circle cx="150" cy="110" r="80" fill="${c.H}"/>
    ${rays(150, 110, 30, 52, 24, c.F, 2, 0.8, 0.6)}
    <circle cx="150" cy="110" r="28" fill="${c.F}"/>
    <path d="M122,112 C90,80 60,92 40,72 C66,110 92,118 120,122Z M178,112 C210,80 240,92 260,72 C234,110 208,118 180,122Z" fill="${c.P}" opacity=".9"/>
    <path d="M150,300 C114,276 106,236 128,226 C140,220 148,230 150,238 C152,230 160,220 172,226 C194,236 186,276 150,300Z" fill="${c.M}" stroke="${c.F}" stroke-width="3" transform="translate(-20 0)"/>
    <path d="M150,300 C114,276 106,236 128,226 C140,220 148,230 150,238 C152,230 160,220 172,226 C194,236 186,276 150,300Z" fill="none" stroke="${c.F}" stroke-width="3" transform="translate(20 0)"/>
    ${hills(shade(c.M, -0.45), 392)}
    <path d="M60,392 v-80" stroke="${c.D}" stroke-width="6"/>
    ${[0, 1, 2, 3, 4].map((k) => `<path d="M${46 + k * 7},${318 - (k % 2) * 14} q6,-18 0,-30 q-8,14 0,30Z" fill="${shade(c.A, -0.05)}"/>`).join('')}
    <path d="M240,392 v-70" stroke="${c.D}" stroke-width="6"/>
    <circle cx="240" cy="310" r="30" fill="${shade('#3d6b4a', 0)}"/>
    ${[[226, 300], [250, 296], [238, 318], [256, 318], [222, 322]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#c2361f"/>`).join('')}
    <path d="M240,392 c-10,-14 10,-20 0,-34" stroke="${c.F}" stroke-width="2" fill="none"/>`,

  // VII Savaş Arabası: yıldızlı gölgelik, kanatlı küre, iki tekerlek, iki sfenks
  7: (c) => `
    <path d="M70,150 Q150,96 230,150" fill="none" stroke="${c.F}" stroke-width="4"/>
    <path d="M70,150 Q150,110 230,150 V164 Q150,124 70,164Z" fill="${shade(c.M, 0.2)}"/>
    ${[90, 120, 150, 180, 210].map((x) => sparkle(x, 136 - Math.abs(150 - x) * 0.2, 6, c.F)).join('')}
    <path d="M78,150 v120 M222,150 v120" stroke="${c.L}" stroke-width="5"/>
    <rect x="70" y="234" width="160" height="80" rx="4" fill="${shade(c.M, -0.25)}" stroke="${c.F}" stroke-width="3"/>
    <circle cx="150" cy="262" r="10" fill="${c.F}"/>
    <path d="M140,262 c-24,-10 -36,-2 -46,-14 c18,20 32,18 46,20Z M160,262 c24,-10 36,-2 46,-14 c-18,20 -32,18 -46,20Z" fill="${c.F}"/>
    ${[96, 204].map((x) => `<circle cx="${x}" cy="326" r="22" fill="none" stroke="${c.F}" stroke-width="4"/>${rays(x, 326, 4, 20, 8, c.F, 2, 1)}`).join('')}
    <path d="M70,410 q0,-34 26,-40 q26,6 26,40Z" fill="${shade(c.M, -0.65)}"/>
    <path d="M178,410 q0,-34 26,-40 q26,6 26,40Z" fill="${c.P}"/>
    <circle cx="96" cy="368" r="14" fill="${shade(c.M, -0.65)}"/><circle cx="204" cy="368" r="14" fill="${c.P}"/>
    <path d="M86,360 h20 v-6 h-20Z M194,360 h20 v-6 h-20Z" fill="${c.F}"/>
    <path d="${starPath(150, 200, 16, 6, 8)}" fill="${c.F}"/>`,

  // VIII Güç: sonsuzluk işareti, aslan başı (alev yeleli), gül zinciri
  8: (c) => `
    <path d="M118,92 C118,74 142,74 150,92 C158,110 182,110 182,92 C182,74 158,74 150,92 C142,110 118,110 118,92Z" fill="none" stroke="${c.F}" stroke-width="4.5"/>
    <circle cx="150" cy="238" r="96" fill="${c.H}"/>
    <path d="${starPath(150, 238, 92, 62, 18)}" fill="${shade(c.M, -0.15)}"/>
    <path d="${starPath(150, 238, 76, 52, 18, -Math.PI / 2 + 0.17)}" fill="${c.F}"/>
    <ellipse cx="150" cy="244" rx="46" ry="52" fill="${shade(c.A, 0.15)}"/>
    <path d="M126,226 q8,-8 16,0 M158,226 q8,-8 16,0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M140,256 l10,12 l10,-12Z" fill="${shade(c.M, -0.4)}"/>
    <path d="M136,276 q14,12 28,0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M136,268 h-22 M136,272 l-20,6 M164,268 h22 M164,272 l20,6" stroke="${shade(c.M, -0.4)}" stroke-width="1.4"/>
    ${[40, 76, 112, 148, 184, 220, 256].map((x, i) => rose(x, 376 + (i % 2) * 10, 10, '#c2361f', c.L)).join('')}
    <path d="M30,380 Q150,420 270,380" stroke="${shade(c.D, 0.3)}" stroke-width="2" fill="none"/>`,

  // IX Ermiş: karlı doruk, uzun asa, içinde altı köşeli yıldız parlayan fener
  9: (c) => `
    <path d="M${PX},420 L120,300 L170,360 L230,270 L${PR},330 V${PB} H${PX}Z" fill="${shade(c.M, 0.22)}"/>
    <path d="M${PX},440 L90,380 L150,420 L210,370 L${PR},420 V${PB} H${PX}Z" fill="${shade(c.M, 0.08)}"/>
    <path d="M120,300 l-16,24 l16,-8 l16,8Z M230,270 l-18,28 l18,-9 l18,9Z" fill="${c.P}" opacity=".85"/>
    <path d="M206,120 L196,${PB}" stroke="${shade(c.A, -0.35)}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="120" cy="178" r="74" fill="${c.H}"/>
    <path d="M100,136 h40 l-6,-10 h-28Z" fill="${c.D}"/>
    <path d="M120,126 v-14" stroke="${c.D}" stroke-width="3"/>
    <rect x="96" y="136" width="48" height="70" rx="6" fill="none" stroke="${c.D}" stroke-width="4"/>
    <path d="M120,150 l14,24 h-28Z M120,192 l14,-24 h-28Z" fill="${c.F}"/>
    <path d="M96,206 h48 l-8,10 h-32Z" fill="${c.D}"/>
    ${rays(120, 171, 52, 72, 12, c.F, 1.5, 0.6)}`,

  // X Kader Çarkı: TARO harfli çark, sekiz kol, yılan ve tepede sfenks
  10: (c) => `
    <circle cx="150" cy="238" r="112" fill="${c.H}"/>
    <circle cx="150" cy="238" r="92" fill="${shade(c.M, -0.2)}" stroke="${c.F}" stroke-width="5"/>
    <circle cx="150" cy="238" r="70" fill="none" stroke="${c.F}" stroke-width="2"/>
    <circle cx="150" cy="238" r="28" fill="${c.F}"/>
    ${rays(150, 238, 28, 70, 8, c.F, 3, 1, 0, -Math.PI / 2 + Math.PI / 8)}
    ${[['T', 0], ['A', 1], ['R', 2], ['O', 3]].map(([t, k]) => {
      const a = -Math.PI / 2 + k * Math.PI / 2;
      return `<text x="${f1(150 + 81 * Math.cos(a))}" y="${f1(238 + 81 * Math.sin(a) + 6)}" text-anchor="middle" font-family="Cinzel, serif" font-weight="700" font-size="17" fill="${c.L}">${t}</text>`;
    }).join('')}
    <path d="M138,238 h24 M150,226 v24" stroke="${shade(c.M, -0.3)}" stroke-width="3"/>
    <path d="M44,150 c22,30 -18,60 6,96 c24,36 -14,66 8,100" fill="none" stroke="${c.F}" stroke-width="5" stroke-linecap="round"/>
    <path d="M150,146 l-20,-18 h40Z" fill="${c.P}"/>
    <circle cx="150" cy="116" r="12" fill="${c.P}"/>
    <path d="M150,104 v-34 M144,80 h12" stroke="${c.L}" stroke-width="3"/>
    ${[[52, 104], [248, 104], [52, 410], [248, 410]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="12" fill="${c.P}" opacity=".85"/>`).join('')}`,

  // XI Adalet: kılıç, terazi, iki sütun ve aradaki perde
  11: (c) => `
    <path d="M${PX + 30},${PB} V110 h40 V${PB}Z M${PR - 70},${PB} V110 h40 V${PB}Z" fill="${shade(c.M, -0.35)}"/>
    <rect x="88" y="110" width="124" height="300" fill="${shade(c.A, -0.3)}" opacity=".55"/>
    <circle cx="150" cy="150" r="64" fill="${c.H}"/>
    <path d="M147,80 h6 l4,170 h-14Z" fill="${c.L}"/>
    <path d="M150,70 l-6,10 h12Z" fill="${c.L}"/>
    <rect x="124" y="250" width="52" height="8" rx="3" fill="${c.F}"/>
    <path d="M146,258 h8 v28 h-8Z" fill="${c.F}"/><circle cx="150" cy="292" r="7" fill="${c.F}"/>
    <path d="M96,310 h108 M150,300 v10" stroke="${c.F}" stroke-width="4" stroke-linecap="round"/>
    <path d="M96,310 l-20,46 M96,310 l20,46 M204,310 l-20,46 M204,310 l20,46" stroke="${c.F}" stroke-width="1.5"/>
    <path d="M72,356 h48 a24,12 0 0 1 -48,0Z M180,356 h48 a24,12 0 0 1 -48,0Z" fill="${c.F}"/>`,

  // XII Asılan Adam: yaşayan ağaçtan tau haçı, ters asılı figür, başında ışık hâlesi
  12: (c) => `
    <path d="M70,96 h160 v16 h-160Z" fill="${shade(c.A, -0.45)}"/>
    <path d="M142,112 h16 v${PB - 112} h-16Z" fill="${shade(c.A, -0.45)}"/>
    ${[[84, 92], [120, 90], [196, 92], [222, 90], [154, 200], [140, 300]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="#6f9a5a" transform="rotate(-30 ${x} ${y})"/>`).join('')}
    <path d="M196,112 v12" stroke="${c.L}" stroke-width="2.5"/>
    <path d="M196,124 V206" stroke="${c.P}" stroke-width="8" stroke-linecap="round"/>
    <path d="M196,206 L226,170 L198,150" stroke="${c.P}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M182,200 h28 l4,74 h-36Z" fill="#c2361f"/>
    <path d="M182,262 L162,236 L184,214 M210,262 L230,236 L208,214" stroke="${c.P}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="196" cy="294" r="44" fill="${c.H}"/>
    ${rays(196, 294, 20, 36, 16, c.F, 2, 0.9, 0.6)}
    <circle cx="196" cy="292" r="14" fill="${c.P}"/>
    ${hills(shade(c.M, -0.4), 410)}`,

  // XIII Ölüm: beyaz gülü taşıyan kara bayrak, iki kule arasında doğan güneş
  13: (c) => `
    <circle cx="207" cy="380" r="64" fill="${c.H}"/>
    ${rays(207, 380, 40, 72, 15, c.F, 2, 0.6, 0.5)}
    <circle cx="207" cy="380" r="30" fill="${c.F}"/>
    <path d="M166,380 v-62 h8 v-7 h6 v7 h6 v62Z M228,380 v-62 h8 v-7 h6 v7 h6 v62Z" fill="${shade(c.L, -0.6)}"/>
    <path d="M${PX},380 H${PR} V${PB} H${PX}Z" fill="${shade(c.M, 0.14)}"/>
    <path d="M${PX},380 H${PR}" stroke="${c.L}" stroke-width="1" opacity=".6"/>
    <path d="M86,90 V420" stroke="${c.L}" stroke-width="5" stroke-linecap="round"/>
    <path d="M89,96 C130,86 160,108 200,96 V220 C160,232 130,210 89,220Z" fill="${shade(c.M, 0.08)}" stroke="${c.L}" stroke-width="2"/>
    ${rose(144, 158, 28, c.L, c.F)}
    <circle cx="144" cy="158" r="40" fill="none" stroke="${c.L}" stroke-width="1" opacity=".5"/>
    ${waves(410, 2, shade(c.L, -0.3), 0.5)}`,

  // XIV Denge: iki kupa arasında akan su, ufukta taçlı güneş, süsenler
  14: (c) => `
    <path d="M${PX},420 L110,300 L150,330 L190,290 L${PR},400 V${PB} H${PX}Z" fill="${shade(c.M, -0.25)}"/>
    <path d="M140,${PB} C150,410 120,380 160,320 C176,300 170,290 168,276" stroke="${c.P}" stroke-width="5" fill="none" opacity=".75"/>
    <circle cx="168" cy="266" r="16" fill="${c.F}"/>
    ${rays(168, 266, 20, 32, 12, c.F, 1.5, 0.8)}
    <circle cx="150" cy="170" r="76" fill="${c.H}"/>
    <path d="M80,120 h40 l-6,30 h-28Z" fill="${c.F}"/>
    <path d="M182,214 h40 l-6,30 h-28Z" fill="${c.F}"/>
    <path d="M114,124 C150,130 176,170 190,214" stroke="${shade(c.A, 0.3)}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M114,124 C150,130 176,170 190,214" stroke="${c.P}" stroke-width="2" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/>
    <path d="M150,180 l14,24 h-28Z" fill="none" stroke="${c.P}" stroke-width="2.5"/>
    <rect x="130" y="172" width="40" height="40" fill="none" stroke="${c.P}" stroke-width="2.5"/>
    ${[44, 66, 236, 256].map((x) => `<path d="M${x},${PB} v-48" stroke="#4f7a4a" stroke-width="3"/><path d="M${x},${PB - 52} c-10,-6 -8,-18 0,-22 c8,4 10,16 0,22Z" fill="${c.L}"/>`).join('')}`,

  // XV Şeytan: yarasa kanatları, ters beşgen yıldız, kaide ve iki zincir
  15: (c) => `
    <circle cx="150" cy="140" r="90" fill="${c.H}"/>
    <path d="M150,170 C110,110 70,120 30,90 C44,130 34,150 52,170 C40,180 46,200 60,214 C90,190 120,200 150,210Z" fill="${shade(c.M, 0.12)}"/>
    <path d="M150,170 C190,110 230,120 270,90 C256,130 266,150 248,170 C260,180 254,200 240,214 C210,190 180,200 150,210Z" fill="${shade(c.M, 0.12)}"/>
    <circle cx="150" cy="120" r="34" fill="none" stroke="${c.A}" stroke-width="3"/>
    <path d="${starPath(150, 120, 32, 12.5, 5, Math.PI / 2)}" fill="none" stroke="${c.A}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="96" y="260" width="108" height="64" fill="${shade(c.M, 0.18)}" stroke="${c.A}" stroke-width="2"/>
    <circle cx="150" cy="300" r="7" fill="none" stroke="${c.F}" stroke-width="3"/>
    ${[0, 1].map((side) => {
      const x0 = 150;
      const x1 = side ? 226 : 74;
      let links = '';
      for (let k = 0; k < 7; k++) {
        const t = k / 6;
        const x = x0 + (x1 - x0) * t;
        const y = 304 + 90 * t - 30 * Math.sin(Math.PI * t);
        links += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="6" ry="4" fill="none" stroke="${c.F}" stroke-width="2.5" transform="rotate(${side ? 40 : -40} ${f1(x)} ${f1(y)})"/>`;
      }
      return links;
    }).join('')}
    <path d="M210,250 l24,-60" stroke="${c.F}" stroke-width="5" stroke-linecap="round"/>
    <path d="M234,190 q-10,-20 4,-36 q4,18 10,20 q-2,10 -14,16Z" fill="${c.A}"/>`,

  // XVI Yıkılan Kule: kayalık doruktaki kule, düşen taç, yıldırım, pencerelerden alev
  16: (c) => `
    <path d="M${PX},${PB} L80,360 L120,380 L180,350 L230,370 L${PR},${PB}Z" fill="${shade(c.M, -0.45)}"/>
    <path d="M112,360 L120,150 h60 L188,360Z" fill="${shade(c.M, 0.15)}" stroke="${c.D}" stroke-width="2"/>
    <path d="M114,150 h72 v-14 h-10 v8 h-10 v-8 h-12 v8 h-10 v-8 h-10 v8 h-10 v-8 h-10Z" fill="${shade(c.M, 0.2)}"/>
    ${[[136, 200], [164, 240], [140, 290]].map(([x, y]) => `<rect x="${x}" y="${y}" width="14" height="22" rx="7" fill="${c.A}"/><path d="M${x + 7},${y - 2} q-10,-16 2,-26 q2,12 8,14 q-2,8 -10,12Z" fill="${c.A}"/>`).join('')}
    <path d="M190,126 l18,-14 l6,10 l10,-16 l6,14 l10,-8 l-6,20Z" fill="${c.F}" transform="rotate(28 210 118)"/>
    <path d="M250,40 L196,118 L214,120 L170,176 L232,104 L214,102 L258,44Z" fill="${c.L}"/>
    <path d="M250,40 L196,118 L214,120 L170,176" fill="none" stroke="${c.F}" stroke-width="1.5"/>
    ${Array.from({ length: 12 }, (_, i) => {
      const x = 46 + (i % 6) * 42 + (i > 5 ? 20 : 0);
      const y = 110 + Math.floor(i / 6) * 120 + (i % 3) * 22;
      return `<path d="M${x},${y} l4,8 l-4,8 l-4,-8Z" fill="${c.F}"/>`;
    }).join('')}`,

  // XVII Yıldız: ışın patlaması, büyük sekiz kollu yıldız, yedi küçük yıldız, iki testiden su
  17: (c) => `
    ${rays(150, 168, 70, 128, 24, c.L, 2.4, 0.5, 0.75)}
    <circle cx="150" cy="168" r="82" fill="${c.H}"/>
    <path d="${starPath(150, 168, 78, 30, 8)}" fill="${c.F}"/>
    <path d="${starPath(150, 168, 48, 20, 8, -Math.PI / 2 + Math.PI / 8)}" fill="${shade(c.M, 0.15)}"/>
    <path d="${starPath(150, 168, 14, 5, 4)}" fill="${c.L}"/>
    ${[[60, 70], [240, 70], [44, 160], [256, 160], [66, 252], [234, 252], [150, 284]].map(([x, y]) =>
      `<path d="${starPath(x, y, 13, 5, 8)}" fill="${c.F}"/>`).join('')}
    ${waves(372, 4, c.L, 0.7)}
    <path d="M88,318 q-6,-18 8,-26 h20 q14,8 8,26 q-4,12 -18,12 q-14,0 -18,-12Z" fill="${c.F}"/>
    <path d="M196,318 q-6,-18 8,-26 h20 q14,8 8,26 q-4,12 -18,12 q-14,0 -18,-12Z" fill="${c.F}"/>
    <path d="M100,330 C104,350 100,362 104,380 M214,330 C222,346 230,352 244,358" stroke="${c.L}" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  // XVIII Ay: yüzlü hilal, düşen çiy damlaları, iki kule, ufka kıvrılan yol, havuz
  18: (c) => `
    <circle cx="150" cy="128" r="92" fill="${c.H}"/>
    ${rays(150, 128, 64, 80, 24, c.L, 2, 0.6, 0.6)}
    <mask id="moonmask"><rect width="300" height="520" fill="#fff"/><circle cx="174" cy="114" r="52" fill="#000"/></mask>
    <circle cx="150" cy="128" r="58" fill="${c.L}" mask="url(#moonmask)"/>
    <path d="M118,104 q6,4 4,10 M112,136 q8,8 18,4" stroke="${shade(c.M, -0.2)}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${[[116, 214], [150, 230], [184, 214], [132, 250], [168, 250]].map(([x, y]) =>
      `<path d="M${x},${y - 9} q6,9 0,13 q-6,-4 0,-13Z" fill="${c.F}"/>`).join('')}
    <g fill="${shade(c.M, -0.4)}">
      <path d="M32,360 v-112 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v112Z"/>
      <path d="M228,360 v-112 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v112Z"/>
    </g>
    <rect x="47" y="270" width="8" height="15" rx="4" fill="${c.F}"/><rect x="243" y="270" width="8" height="15" rx="4" fill="${c.F}"/>
    ${hills(shade(c.M, -0.3), 372)}
    <path d="M150,${PB - 30} C120,408 186,392 150,368 C124,350 166,334 150,312" fill="none" stroke="${c.P}" stroke-width="6" opacity=".7" stroke-linecap="round"/>
    <ellipse cx="150" cy="${PB - 14}" rx="130" ry="22" fill="${shade(c.M, -0.55)}"/>
    ${waves(PB - 22, 2, c.L, 0.5)}
    <path d="M140,${PB - 14} q10,-14 20,0 M138,${PB - 12} l-8,-6 M162,${PB - 12} l8,-6" stroke="${c.A}" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  // XIX Güneş: yüzlü güneş (düz ve dalgalı ışınlar), tuğla duvar, ayçiçekleri
  19: (c) => `
    <circle cx="150" cy="150" r="104" fill="${c.H}"/>
    ${Array.from({ length: 24 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 24) * Math.PI * 2;
      const x1 = 150 + 54 * Math.cos(a);
      const y1 = 150 + 54 * Math.sin(a);
      const x2 = 150 + 92 * Math.cos(a);
      const y2 = 150 + 92 * Math.sin(a);
      const nx = -Math.sin(a) * 8;
      const ny = Math.cos(a) * 8;
      return i % 2
        ? `<path d="M${f1(x1)},${f1(y1)} Q${f1((x1 + x2) / 2 + nx)},${f1((y1 + y2) / 2 + ny)} ${f1(x2)},${f1(y2)}" stroke="${c.F}" stroke-width="3" fill="none"/>`
        : `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${c.F}" stroke-width="4"/>`;
    }).join('')}
    <circle cx="150" cy="150" r="52" fill="${c.F}"/>
    <path d="M128,142 q8,6 16,0 M156,142 q8,6 16,0" stroke="${shade(c.M, -0.45)}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M136,166 q14,12 28,0" stroke="${shade(c.M, -0.45)}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="${PX}" y="330" width="${PANEL_W}" height="70" fill="${shade(c.M, -0.1)}"/>
    ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 8 }, (_, k) =>
      `<rect x="${PX + k * 34 + (r % 2 ? 17 : 0) - 10}" y="${334 + r * 17}" width="30" height="13" fill="none" stroke="${shade(c.M, -0.35)}" stroke-width="1.2"/>`).join('')).join('')}
    ${[52, 108, 192, 248].map((x, i) => `<path d="M${x},330 v-${30 + (i % 2) * 14}" stroke="#4f7a3a" stroke-width="3"/>
      <circle cx="${x}" cy="${300 - (i % 2) * 14}" r="15" fill="${shade(c.A, 0.15)}"/>
      ${rays(x, 300 - (i % 2) * 14, 8, 17, 12, c.F, 3, 1)}
      <circle cx="${x}" cy="${300 - (i % 2) * 14}" r="8" fill="${shade(c.M, -0.5)}"/>`).join('')}
    ${hills('#5f8a4a', 420)}`,

  // XX Mahkeme: bulutlardan uzanan boru ve bayrağı, ses ışınları, yükselen figürler
  20: (c) => `
    <circle cx="150" cy="120" r="96" fill="${c.H}"/>
    ${[[96, 96], [150, 84], [204, 96], [124, 118], [178, 118]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="20" fill="${c.L}" opacity=".9"/>`).join('')}
    <path d="M150,124 L104,226" stroke="${c.F}" stroke-width="6" stroke-linecap="round"/>
    <path d="M104,226 l-18,22 l28,-6Z" fill="${c.F}"/>
    <path d="M126,176 h40 v32 h-40Z" fill="${c.L}" stroke="${c.F}" stroke-width="1.5" transform="rotate(-24 146 192)"/>
    <path d="M146,180 v24 M134,192 h24" stroke="#c2361f" stroke-width="4" transform="rotate(-24 146 192)"/>
    ${[0, 1, 2].map((k) => `<path d="M${74 - k * 14},${254 + k * 10} q-10,10 -2,22" stroke="${c.F}" stroke-width="2" fill="none" opacity=".8"/>`).join('')}
    ${hills(shade(c.M, -0.35), 360)}
    ${waves(380, 3, c.P, 0.55)}
    ${[100, 150, 200].map((x, i) => `<path d="M${x},${PB - 10} v-44" stroke="${shade(c.P, -0.15)}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="${x}" cy="${PB - 64}" r="9" fill="${shade(c.P, -0.15)}"/>
      <path d="M${x - 4},${PB - 44} l-16,-${22 + i * 4} M${x + 4},${PB - 44} l16,-${22 + i * 4}" stroke="${shade(c.P, -0.15)}" stroke-width="5" stroke-linecap="round"/>`).join('')}`,

  // XXI Dünya: kurdeleli defne çelengi, içinde dans eden figür, köşelerde dört bulut
  21: (c) => `
    <ellipse cx="150" cy="236" rx="96" ry="146" fill="${c.H}"/>
    ${Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2;
      const x = 150 + 74 * Math.cos(a);
      const y = 236 + 124 * Math.sin(a);
      const rot = (a * 180) / Math.PI + 90;
      return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="5" ry="12" fill="${i % 2 ? '#4f8a4a' : '#6faa5a'}" transform="rotate(${f1(rot + (i % 2 ? 25 : -25))} ${f1(x)} ${f1(y)})"/>`;
    }).join('')}
    <path d="M136,108 q14,10 28,0 q-14,-10 -28,0Z M136,364 q14,10 28,0 q-14,-10 -28,0Z" fill="#c2361f"/>
    <path d="M136,108 q14,-14 28,0 M136,364 q14,14 28,0" stroke="#c2361f" stroke-width="3" fill="none"/>
    <circle cx="150" cy="180" r="11" fill="${c.P}"/>
    <path d="M150,192 l-6,70 M150,192 l10,70" stroke="${c.P}" stroke-width="10" stroke-linecap="round"/>
    <path d="M144,262 l-20,40 M160,262 l-4,22 l22,14" stroke="${c.P}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M148,206 l-36,-24 M152,206 l34,30" stroke="${c.P}" stroke-width="5" stroke-linecap="round"/>
    <path d="M112,182 l-6,-18 M186,236 l6,16" stroke="${c.F}" stroke-width="4" stroke-linecap="round"/>
    <path d="M140,200 C120,220 186,240 160,280 C150,296 170,300 176,320" stroke="${c.A}" stroke-width="5" fill="none" opacity=".85" stroke-linecap="round"/>
    ${[[52, 104], [248, 104], [52, 410], [248, 410]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="14" fill="${c.L}" opacity=".9"/>${sparkle(x, y, 9, c.F)}`).join('')}`,
};

// Art nouveau kıvrım (panelin alt köşeleri için; diğer köşe aynalanır)
const flourish = (stroke) => `<path d="M0,-46 C0,-18 18,0 46,0 M6,-40 C10,-22 22,-10 40,-6 M0,-46 c10,0 14,6 14,14 M46,0 c0,-10 -6,-14 -14,-14" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><circle cx="17" cy="-17" r="3.5" fill="${stroke}"/>`;

/** Kartın etrafındaki noktalı altın bordür. */
function dotBorder(fill) {
  let out = '';
  const inset = 12;
  for (let x = inset + 6; x <= W - inset - 6; x += 9) {
    out += `<circle cx="${x}" cy="${inset}" r="1.3"/><circle cx="${x}" cy="${H - inset}" r="1.3"/>`;
  }
  for (let y = inset + 6; y <= H - inset - 6; y += 9) {
    out += `<circle cx="${inset}" cy="${y}" r="1.3"/><circle cx="${W - inset}" cy="${y}" r="1.3"/>`;
  }
  return `<g fill="${fill}">${out}</g>`;
}

/**
 * Kartın SVG'si. options.image verilirse (orijinal kart resmi) sahne yerine o konur;
 * kartın rengiyle hafifçe tonlanır ki iki deste de aynı dünyadan görünsün.
 */
export function cardSVG(card, { image = null, uid = 'c' } = {}) {
  const [main, accent] = card.colors;
  const id = `${uid}-${card.number}`;
  const c = {
    M: main,
    A: accent,
    L: shade(accent, 0.55),
    D: shade(main, -0.45),
    P: '#f3ead6',
    F: `url(#foil-${id})`,
    H: `url(#halo-${id})`,
  };
  const scene = SCENES[card.number];
  const title = card.name.toLocaleUpperCase('tr-TR');
  const titleSize = title.length > 11 ? 16.5 : title.length > 8 ? 19.5 : 22;

  const inner = image
    ? `<image href="${image}" x="${f1(PX - 0.0725 * IMG_W)}" y="${f1(PT - 0.08 * IMG_H)}" width="${f1(IMG_W)}" height="${f1(IMG_H)}" preserveAspectRatio="xMidYMid slice"/>
       <rect x="${PX}" y="${PT}" width="${PANEL_W}" height="${PANEL_H}" fill="${main}" style="mix-blend-mode:color" opacity=".32"/>`
    : `<rect x="${PX}" y="${PT}" width="${PANEL_W}" height="${PANEL_H}" fill="url(#bg-${id})"/>
       ${sky(card, c, id)}
       ${scene ? scene(c).replaceAll('moonmask', `moonmask-${id}`) : ''}`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${card.roman} ${card.name} kartı">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="${shade(main, -0.3)}"/>
      <stop offset=".5" stop-color="${main}"/>
      <stop offset="1" stop-color="${shade(main, -0.45)}"/>
    </linearGradient>
    <linearGradient id="foil-${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="110" y2="130" spreadMethod="reflect">
      <stop offset="0" stop-color="${shade(accent, -0.35)}"/>
      <stop offset=".3" stop-color="${accent}"/>
      <stop offset=".48" stop-color="${shade(accent, 0.6)}"/>
      <stop offset=".62" stop-color="${accent}"/>
      <stop offset="1" stop-color="${shade(accent, -0.3)}"/>
    </linearGradient>
    <linearGradient id="gold-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a6a2a"/><stop offset=".35" stop-color="#d8b25a"/>
      <stop offset=".5" stop-color="#fff0c0"/><stop offset=".65" stop-color="#d0a64c"/>
      <stop offset="1" stop-color="#8a6a2a"/>
    </linearGradient>
    <radialGradient id="halo-${id}">
      <stop offset="0" stop-color="${c.L}" stop-opacity=".7"/>
      <stop offset="1" stop-color="${c.L}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig-${id}" cx=".5" cy=".42" r=".78">
      <stop offset=".58" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".5"/>
    </radialGradient>
    <filter id="wash-${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${card.number + 5}"/>
      <feDisplacementMap in="SourceGraphic" scale="34"/>
      <feGaussianBlur stdDeviation="5"/>
    </filter>
    <filter id="paper-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="${card.number + 3}"/>
      <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .22  0 0 0 .22 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
      <feBlend in2="SourceGraphic" mode="multiply"/>
    </filter>
    <clipPath id="clip-${id}"><path d="${PANEL_PATH}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="${PARCHMENT}" filter="url(#paper-${id})"/>
  <rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="9" fill="none" stroke="url(#gold-${id})" stroke-width="1.6"/>
  ${dotBorder(`url(#gold-${id})`)}
  <g clip-path="url(#clip-${id})">
    ${inner}
    <rect x="${PX}" y="${PT}" width="${PANEL_W}" height="${PANEL_H}" fill="url(#vig-${id})"/>
  </g>
  <path d="${PANEL_PATH}" fill="none" stroke="url(#gold-${id})" stroke-width="3.5"/>
  <path d="M${PX + 6},${PB - 6} V${SPRING + 2} A${(PR - PX) / 2 - 6},${SPRING - PT - 6} 0 0 1 ${PR - 6},${SPRING + 2} V${PB - 6} Z" fill="none" stroke="#f3dc9a" stroke-width=".8" opacity=".75"/>
  <g transform="translate(${PX + 5},${PB - 5})">${flourish('#f3dc9a')}</g>
  <g transform="translate(${PR - 5},${PB - 5}) scale(-1,1)">${flourish('#f3dc9a')}</g>
  <circle cx="150" cy="${PT + 2}" r="17" fill="${PARCHMENT}" stroke="url(#gold-${id})" stroke-width="2.5"/>
  <circle cx="150" cy="${PT + 2}" r="13" fill="none" stroke="#b8913f" stroke-width=".8"/>
  <text x="150" y="${PT + 6.5}" text-anchor="middle" font-family="Cinzel, 'Cormorant Garamond', serif" font-weight="700" font-size="${card.roman.length > 3 ? 9.5 : 12}" fill="${INK}">${card.roman}</text>
  <rect x="${PX}" y="${PB + 9}" width="${PANEL_W}" height="${H - PB - 27}" rx="3" fill="#f5ecd8" stroke="url(#gold-${id})" stroke-width="2"/>
  <rect x="${PX + 4}" y="${PB + 13}" width="${PANEL_W - 8}" height="${H - PB - 35}" rx="2" fill="none" stroke="#b8913f" stroke-width=".7"/>
  ${sparkle(PX + 18, (PB + H - 18) / 2 + 0.5, 6, `url(#gold-${id})`)}
  ${sparkle(PR - 18, (PB + H - 18) / 2 + 0.5, 6, `url(#gold-${id})`)}
  <text x="150" y="${(PB + H - 18) / 2 + titleSize * 0.36}" text-anchor="middle" font-family="Cinzel, 'Cormorant Garamond', serif" font-weight="700" font-size="${titleSize}" letter-spacing="2.2" fill="${INK}">${title}</text>
</svg>`;
}
