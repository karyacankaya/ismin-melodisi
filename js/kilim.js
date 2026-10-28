// İsmin Melodisi — melodiden İran tarzı bir halı/kilim
// Düzen, klasik İran halısınınki gibidir:
//  - ortada göbek (toranj) ve altında/üstünde salkım (sertoranj); şeklini yaşam yolu seçer
//  - zeminin dört köşesinde köşebent (lechak)
//  - üç katlı bordür: ince su yolu, geniş ana bordür (gül + sarmaşık), ince su yolu
//  - zeminde her harf bir motif sırasıdır (buta, herati, servi…); melodi çalarken o sıra parlar
// Desen önce sol üst çeyrekte bir düğüm ızgarası olarak kurulur, sonra yatay ve dikey
// aynalanır. Izgara kurma kısmı saftır (Node'da test edilir), çizim kısmı canvas kullanır.

import { baseNumber, createRng, profileSeed } from './numerology.js';

// Her yaşam yolunun bir halı paleti: zemin, ikinci zemin, bordür zemini, göbek zemini,
// ana iplik (fildişi), iki vurgu, kontur (koyu) ve çalarken parıltı rengi.
export const PALETTES = {
  1: { name: 'Kirman Kırmızısı', ground: '#8f1d1f', ground2: '#7a171a', border: '#1d2b4f', medallion: '#1d2b4f', main: '#efe2c4', a1: '#d9a440', a2: '#3d6b6a', line: '#1a0f12', glow: '#ffe7a8' },
  2: { name: 'İsfahan Fildişi', ground: '#e7d9bc', ground2: '#dccca9', border: '#7a2b38', medallion: '#2a3b66', main: '#7a2b38', a1: '#b8863b', a2: '#4f6f7c', line: '#2b1d1a', glow: '#fff6da' },
  3: { name: 'Safran', ground: '#c98b24', ground2: '#b67b1c', border: '#5a1f2a', medallion: '#efe2c4', main: '#5a1f2a', a1: '#2f5d55', a2: '#efe2c4', line: '#2c160d', glow: '#fff1c0' },
  4: { name: 'Tebriz Laciverti', ground: '#1d2b4f', ground2: '#18243f', border: '#8f1d1f', medallion: '#8f1d1f', main: '#efe2c4', a1: '#d9a440', a2: '#6f8fa8', line: '#0c1120', glow: '#fff0c4' },
  5: { name: 'Kaşkay Turuncusu', ground: '#b04a26', ground2: '#983e1f', border: '#1f3550', medallion: '#efe2c4', main: '#efe2c4', a1: '#2f6a6a', a2: '#e0ad3c', line: '#24110a', glow: '#ffe8b4' },
  6: { name: 'Keşan Gülü', ground: '#9e3446', ground2: '#86293a', border: '#23314f', medallion: '#efe0c8', main: '#efe0c8', a1: '#7d9a5a', a2: '#d8a04a', line: '#2a0e15', glow: '#ffe6d2' },
  7: { name: 'Büyücü Moru', ground: '#3a2550', ground2: '#2f1e42', border: '#1b1f3a', medallion: '#c9a24a', main: '#e3d3b0', a1: '#8a6bb0', a2: '#b04a5a', line: '#120b19', glow: '#f6e6c2' },
  8: { name: 'Lal', ground: '#5e1219', ground2: '#4c0e14', border: '#c9a24a', medallion: '#1b2a4a', main: '#e9d6a6', a1: '#c9a24a', a2: '#3c6a7a', line: '#1a0507', glow: '#ffe6a0' },
  9: { name: 'Zümrüt', ground: '#2f5a4a', ground2: '#274c3e', border: '#7a2533', medallion: '#efe2c4', main: '#efe2c4', a1: '#c9963c', a2: '#9c3a3a', line: '#0f1f19', glow: '#fff2cf' },
  11: { name: 'Seher', ground: '#1b2547', ground2: '#151d3a', border: '#4a2a5e', medallion: '#d6c08a', main: '#e9dfc4', a1: '#9fb3d9', a2: '#c46a6a', line: '#0a0e1d', glow: '#fff3c6' },
  22: { name: 'Ceviz', ground: '#4a3424', ground2: '#3d2b1d', border: '#1f2e48', medallion: '#c9a24a', main: '#e6d3a8', a1: '#a33c2c', a2: '#6f8a7a', line: '#170f09', glow: '#fff0c2' },
  33: { name: 'Nar', ground: '#7a1f3c', ground2: '#661a33', border: '#2a2350', medallion: '#f0e0c6', main: '#f0e0c6', a1: '#d9a440', a2: '#5c8a8a', line: '#250912', glow: '#ffe9d0' },
};

export const MOTIF_NAMES = ['Buta', 'Herati', 'Gül', 'Sekiz Köşeli Yıldız', 'Servi', 'Şah Abbasi', 'Mina Hani', 'Yengeç', 'Kandil'];
export const MEDALLION_NAMES = {
  1: 'Baklava', 2: 'Dilimli Oval', 3: 'Sekizgen', 4: 'Altıgen', 5: 'Haç Baklava',
  6: 'Gül Göbek', 7: 'Dilimli Baklava', 8: 'Yıldız Göbek', 9: 'Oval',
};

// Motifler: (x, y) ∈ [-1, 1]² (y aşağı doğru) → 0 zemin, 1 ana renk, 2 ikinci renk.
const MOTIFS = [
  // 1 Buta: ucu sağa kıvrılan damla
  (x, y) => {
    const bend = 0.9 * Math.max(0, -(y + 0.15)) ** 2;
    const xx = x + 0.12 - bend;
    let w;
    if (y > -0.15) {
      const t = (y - 0.35) / 0.65;
      w = t * t < 1 ? 0.62 * Math.sqrt(1 - t * t) : 0;
    } else {
      w = 0.397 * Math.max(0, (y + 1) / 0.85);
    }
    if (Math.abs(xx) >= w) return 0;
    if ((x + 0.12) ** 2 + (y - 0.4) ** 2 < 0.03) return 1;
    return Math.abs(xx) < w * 0.55 && y > -0.35 ? 2 : 1;
  },
  // 2 Herati: ortada gül, köşegenlerde dört mızrak yaprak
  (x, y) => {
    const m = Math.abs(x) + Math.abs(y);
    if (m < 0.3) return 2;
    if (m < 0.42) return 1;
    const a = (x + y) / Math.SQRT2;
    const b = (x - y) / Math.SQRT2;
    const leaf = (p, q) => {
      const ap = Math.abs(p);
      return ap > 0.36 && ap < 1.25 && Math.abs(q) < 0.22 * Math.sin((Math.PI * (ap - 0.36)) / 0.89);
    };
    return leaf(a, b) || leaf(b, a) ? 1 : 0;
  },
  // 3 Gül: sekizgen çiçek, içinde haç
  (x, y) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const o = Math.max(ax, ay, (ax + ay) / 1.35);
    if (o >= 0.9) return 0;
    if (o > 0.74) return 1;
    if (o > 0.6) return 2;
    if (ax < 0.13 || ay < 0.13 || o < 0.24) return 1;
    return 2;
  },
  // 4 Sekiz köşeli yıldız: kare + baklava birleşimi
  (x, y) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const s = Math.min(Math.max(ax, ay) / 0.66, (ax + ay) / 0.92);
    if (s >= 1) return 0;
    if (s > 0.56) return 1;
    if (s > 0.4) return 0;
    return 2;
  },
  // 5 Servi: sivri servi ağacı, gövdeli
  (x, y) => {
    const ax = Math.abs(x);
    if (y > 0.72) return ax < 0.1 ? 1 : 0;
    const w = 0.46 * Math.sqrt(Math.max(0, (y + 0.95) / 1.67));
    if (ax >= w) return 0;
    return ax < w * 0.45 && Math.floor((y + 1) * 6) % 2 === 0 ? 2 : 1;
  },
  // 6 Şah Abbasi: dilimli yelpaze çiçek, altında kâse
  (x, y) => {
    const dy = y - 0.55;
    const r = Math.hypot(x, dy);
    const th = Math.atan2(x, -dy);
    if (Math.abs(th) < 1.25 && r < 1.35 * (0.82 + 0.18 * Math.cos(7 * th))) return r < 0.6 ? 2 : 1;
    if (y > 0.55 && y < 0.95 && Math.abs(x) < 0.32 * (1 - (y - 0.55) / 0.5)) return 2;
    return 0;
  },
  // 7 Mina Hani: dört yapraklı çiçek, köşelerde noktalar
  (x, y) => {
    if (x * x + y * y < 0.04) return 2;
    const petal = [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]].some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 < 0.1);
    if (petal) return 1;
    const dot = [[0.74, 0.74], [-0.74, 0.74], [0.74, -0.74], [-0.74, -0.74]].some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 < 0.025);
    return dot ? 2 : 0;
  },
  // 8 Yengeç (harçeng): oval gövde, dört kıvrık bacak
  (x, y) => {
    const e = (x / 0.52) ** 2 + (y / 0.38) ** 2;
    if (e < 0.35) return 2;
    if (e < 1) return 1;
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    return ax > 0.4 && ax < 0.92 && Math.abs(ay - (ax - 0.3) * 0.95) < 0.11 ? 1 : 0;
  },
  // 9 Kandil: sivri kemerli mihrap, içinde asılı kandil
  (x, y) => {
    const ax = Math.abs(x);
    if (ax >= 0.62 || y >= 0.95) return 0;
    const top = -0.3 - 0.65 * Math.max(0, 1 - ax / 0.62) ** 1.5;
    if (y <= top) return 0;
    const innerTop = top + 0.2;
    if (ax < 0.44 && y > innerTop && y < 0.8) {
      return x * x + (y - 0.22) ** 2 < 0.045 || (ax < 0.04 && y < 0.22) ? 2 : 0;
    }
    return 1;
  },
];

// Göbek şekilleri: (X, Y) normalleştirilmiş → s (0 merkez, 1 kenar). Hepsi iki eksende simetrik.
const MEDALLIONS = {
  1: (X, Y) => Math.abs(X) + Math.abs(Y),
  2: (X, Y) => Math.hypot(X, Y) / (1 - 0.07 * Math.cos(12 * Math.atan2(Y, X))),
  3: (X, Y) => Math.max(Math.abs(X), Math.abs(Y), (Math.abs(X) + Math.abs(Y)) / 1.4),
  4: (X, Y) => Math.max(Math.abs(X) / 0.92, Math.abs(Y) + 0.55 * Math.abs(X)),
  5: (X, Y) => Math.min(Math.abs(X) + Math.abs(Y), Math.max(Math.abs(X) * 2.2, Math.abs(Y) * 1.05)),
  6: (X, Y) => Math.hypot(X, Y) / (0.86 + 0.14 * Math.cos(8 * Math.atan2(Y, X))),
  7: (X, Y) => (Math.abs(X) + Math.abs(Y)) / (1 - 0.08 * Math.cos(16 * Math.atan2(Y, X))),
  8: (X, Y) => Math.min(Math.max(Math.abs(X), Math.abs(Y)) / 0.78, Math.abs(X) + Math.abs(Y)),
  9: (X, Y) => Math.hypot(X, Y),
};

const SIZE = { consonant: 9, vowel: 13, space: 5, sep: 2 };
const MIN_HALF = 40; // kısa adlarda bantlar büyütülür, halı boş kalmaz
const MAX_HALF = 170; // uzun adlarda yarım zemin en fazla bu kadar düğüm
const GUARD = 3; // ince su yolu bordürlerinin kalınlığı (düğüm)
const ASPECT = 0.66; // tek halıda genişlik / yükseklik
const FRINGE = '#e9ddc4';
const FRINGE_SHADOW = '#b9a681';

/** Harf dizisini bantlara böler: harf sırası, boşluk şeridi ve aralarda ince çubuk. */
export function layoutBands(tokens, minHalf = MIN_HALF) {
  const items = [];
  tokens.forEach((t, i) => {
    if (items.length) items.push({ kind: 'sep', size: SIZE.sep, band: -1 });
    if (t.type === 'space') items.push({ kind: 'space', size: SIZE.space, band: i });
    else items.push({ kind: 'letter', size: t.vowel ? SIZE.vowel : SIZE.consonant, band: i, motif: t.value - 1, vowel: t.vowel });
  });
  const raw = items.reduce((a, it) => a + it.size, 0);
  // kısa adlar büyütülür; uzun adlarda sıralar incelir ki halı dev bir ızgaraya dönmesin
  const k = raw < minHalf ? minHalf / raw : raw > MAX_HALF ? MAX_HALF / raw : 1;
  let pos = 0;
  for (const it of items) {
    if (it.kind === 'sep') {
      if (k < 1) it.size = 1;
    } else {
      it.size = Math.max(5, Math.round(it.size * k));
      if (it.size % 2 === 0) it.size += 1; // tek boy: motifin tam ortası olsun
    }
    it.start = pos;
    pos += it.size;
  }
  const map = new Int16Array(pos);
  items.forEach((it, idx) => map.fill(idx, it.start, it.start + it.size));
  return { items, total: pos, map };
}

export function paletteFor(lifePath) {
  return PALETTES[lifePath] ?? PALETTES[1];
}

// Motif karoları önbelleği: (motif, boy) → katman dizisi
const tileCache = new Map();
function motifTile(motif, s) {
  const key = motif + '|' + s;
  let tile = tileCache.get(key);
  if (!tile) {
    tile = new Uint8Array(s * s);
    for (let v = 0; v < s; v++) {
      for (let u = 0; u < s; u++) {
        tile[v * s + u] = MOTIFS[motif](((u + 0.5) / s) * 2 - 1, ((v + 0.5) / s) * 2 - 1);
      }
    }
    tileCache.set(key, tile);
  }
  return tile;
}

/** Karodaki hücre: motif katmanı ya da motifin hemen dışındaysa kontur (3). */
function tileAt(tile, s, u, v) {
  if (u < 0 || v < 0 || u >= s || v >= s) return 0;
  const m = tile[v * s + u];
  if (m) return m;
  for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const uu = u + du;
    const vv = v + dv;
    if (uu >= 0 && vv >= 0 && uu < s && vv < s && tile[vv * s + uu]) return 3;
  }
  return 0;
}

function motifColor(layer, item) {
  if (layer === 3) return 'line';
  if (layer === 1) return item.vowel ? 'main' : item.band % 2 ? 'a2' : 'a1';
  return item.vowel ? 'a1' : 'main';
}

// Bordürün ana şeridi: gül + dalgalı sarmaşık
function mainBorder(along, across, M) {
  const P = Math.round(M * 1.6);
  const a = along % P;
  const x = (a + 0.5 - P / 2) / (M / 2);
  const y = (across + 0.5 - M / 2) / (M / 2);
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const o = Math.max(ax, ay, (ax + ay) / 1.35);
  if (o < 0.66) return o < 0.24 ? 'a2' : o > 0.52 ? 'line' : 'main';
  const vine = 0.62 * Math.cos((2 * Math.PI * along) / P);
  if (o > 0.78 && Math.abs(y - vine) < 0.16) return 'a1';
  if (o > 0.78 && Math.abs(y + vine) < 0.1 && ax > 1.1) return 'a2';
  return 'border';
}

// İnce su yolu: zincir gibi çapraz kafes
function guard(along, across) {
  return (along + across) % 4 === 0 || (along - across + 400) % 4 === 0 ? 'main' : 'ground2';
}

/**
 * Tek profil ya da iki profil (uyum) → düğüm ızgarası.
 * Uyumda A'nın harfleri yatay sıra (atkı), B'ninkiler dikey sıra (çözgü) olur;
 * kesişen her blokta sırayla A'nın ya da B'nin motifi dokunur.
 */
export function buildKilim(a, b = null) {
  let rows = layoutBands(a.tokens);
  let cols = null;
  if (b) {
    // Uyumda halı dengeli dursun: kısa adın bantları genişletilir (en/boy ≈ 0.7–1)
    cols = layoutBands(b.tokens, Math.round(rows.total * 0.7));
    if (cols.total > rows.total) rows = layoutBands(a.tokens, cols.total);
  }
  const R = rows.total; // yarım zemin yüksekliği
  const M = Math.max(9, Math.min(22, Math.round(0.09 * 2 * R)));
  const T = M + 2 * GUARD + 4; // bordür toplam kalınlığı
  const Q = cols ? cols.total : Math.max(14, Math.round((ASPECT * (2 * R + 2 * T)) / 2 - T)); // yarım zemin genişliği
  const QC = T + Q;
  const QR = T + R;
  const palA = paletteFor(a.lifePath);
  const palB = b ? paletteFor(b.lifePath) : palA;
  const shape = MEDALLIONS[baseNumber(a.lifePath)];
  const cornerShape = MEDALLIONS[baseNumber(b ? b.lifePath : a.lifePath)];
  const MX = 0.5 * Q;
  const MY = Math.min(0.5 * R, MX * 1.6);

  const colorTable = [];
  const colorIndex = new Map();
  const idx = (hex) => {
    if (!colorIndex.has(hex)) {
      colorIndex.set(hex, colorTable.length);
      colorTable.push(hex);
    }
    return colorIndex.get(hex);
  };

  const qColor = new Uint8Array(QC * QR);
  const qA = new Int16Array(QC * QR).fill(-1);
  const qB = new Int16Array(QC * QR).fill(-1);
  const qMotif = new Uint8Array(QC * QR);

  for (let qy = 0; qy < QR; qy++) {
    for (let qx = 0; qx < QC; qx++) {
      const i = qy * QC + qx;
      let key;
      let pal = palA;

      if (qx < T || qy < T) {
        const top = qy < T && qy <= qx;
        const across = top ? qy : qx;
        const along = top ? qx : qy;
        pal = top ? palA : palB;
        if (across === 0 || across === GUARD + 1 || across === GUARD + 2 + M || across === T - 1) key = 'line';
        else if (across <= GUARD) key = guard(along, across - 1);
        else if (across < GUARD + 2 + M) key = mainBorder(along, across - GUARD - 2, M);
        else key = guard(along, across - GUARD - 3 - M);
        qColor[i] = idx(pal[key]);
        continue;
      }

      const fx = qx - T;
      const fy = qy - T;
      // Göbek ve salkımlar
      const X = (Q - (fx + 0.5)) / MX;
      const Y = (R - (fy + 0.5)) / MY;
      const s = shape(X, Y);
      if (s < 1) {
        if (s > 0.94 || (s > 0.8 && s <= 0.84) || (s > 0.46 && s <= 0.5)) key = 'line';
        else if (s > 0.84) key = 'a1';
        else if (s > 0.5) key = (qx * 3 + qy * 5) % 7 === 0 ? 'a2' : 'medallion';
        else if (s > 0.3) key = 'ground';
        else if (s > 0.18) key = 'a1';
        else key = 'main';
        if (key === 'medallion' && b) pal = palB;
        qColor[i] = idx(pal[key]);
        continue;
      }
      const pend = Math.abs(X) / 0.2 + Math.abs(Math.abs(Y) - 1.2) / 0.16;
      if (pend < 1) {
        qColor[i] = idx(palA[pend > 0.62 ? 'line' : 'a1']);
        continue;
      }
      // Köşebent: köşede göbeğin dörtte biri
      const cs = cornerShape((fx + 0.5) / (0.55 * MX), (fy + 0.5) / (0.55 * MY));
      if (cs < 1) {
        const cp = b ? palB : palA;
        key = cs > 0.9 ? 'line' : cs > 0.76 ? 'a1' : cs < 0.35 ? 'main' : 'medallion';
        qColor[i] = idx(cp[key]);
        continue;
      }

      const row = rows.items[rows.map[fy]];
      const v = fy - row.start;
      if (!cols) {
        const d = Q - 1 - fx; // merkezden uzaklık: motifler ortada tam buluşur
        if (row.kind === 'sep') key = v === 0 ? 'line' : d % 3 === 0 ? 'a1' : 'ground2';
        else if (row.kind === 'space') {
          key = v === (row.size - 1) / 2 ? 'line' : d % 4 === 0 ? 'a2' : 'ground2';
          qA[i] = row.band;
        } else {
          const sz = row.size;
          const u = d % (sz + 2);
          const layer = tileAt(motifTile(row.motif, sz), sz, u, v);
          key = layer ? motifColor(layer, row) : row.band % 2 ? 'ground2' : 'ground';
          qA[i] = row.band;
          qMotif[i] = layer && layer !== 3 ? 1 : 0;
        }
      } else {
        const col = cols.items[cols.map[fx]];
        if (row.kind === 'sep' || col.kind === 'sep') {
          key = (fx + fy) % 2 === 0 ? 'line' : 'ground2';
        } else if (row.kind === 'space' || col.kind === 'space') {
          const mid = row.kind === 'space' ? v === (row.size - 1) / 2 : fx - col.start === (col.size - 1) / 2;
          key = mid ? 'line' : 'ground2';
          if (row.kind === 'space') qA[i] = row.band;
          if (col.kind === 'space') qB[i] = col.band;
        } else {
          const useA = (row.band + col.band) % 2 === 0;
          pal = useA ? palA : palB;
          const owner = useA ? row : col;
          const sz = Math.min(row.size, col.size);
          const u = fx - col.start - Math.floor((col.size - sz) / 2);
          const vv = v - Math.floor((row.size - sz) / 2);
          const layer = tileAt(motifTile(owner.motif, sz), sz, u, vv);
          key = layer ? motifColor(layer, owner) : 'ground';
          qA[i] = row.band;
          qB[i] = col.band;
          qMotif[i] = layer && layer !== 3 ? 1 : 0;
        }
      }
      qColor[i] = idx(pal[key]);
    }
  }

  // Aynala; el dokuması hissi için tohumlu ton sapması ve abraş (boya partisi farkı) ekle
  const W = QC * 2;
  const H = QR * 2;
  const color = new Uint8Array(W * H);
  const bandA = new Int16Array(W * H);
  const bandB = new Int16Array(W * H);
  const motif = new Uint8Array(W * H);
  const shade = new Float32Array(W * H);
  const rowTone = new Float32Array(H * 3);
  const rng = createRng((profileSeed(a) ^ (b ? Math.imul(profileSeed(b), 31) : 0)) >>> 0);
  let abrash = [1, 1, 1];
  let abrashLeft = 0;
  for (let y = 0; y < H; y++) {
    if (abrashLeft-- <= 0) {
      abrashLeft = 4 + Math.floor(rng() * 22);
      const f = 1 + (rng() - 0.5) * 0.13;
      const hue = (rng() - 0.5) * 0.05;
      abrash = [f * (1 + hue), f, f * (1 - hue)];
    }
    rowTone.set(abrash, y * 3);
    const qy = y < QR ? y : H - 1 - y;
    for (let x = 0; x < W; x++) {
      const qx = x < QC ? x : W - 1 - x;
      const qi = qy * QC + qx;
      const i = y * W + x;
      color[i] = qColor[qi];
      bandA[i] = qA[qi];
      bandB[i] = qB[qi];
      motif[i] = qMotif[qi];
      shade[i] = 1 + (rng() - 0.5) * 0.1;
    }
  }

  return {
    cols: W, rows: H, colors: colorTable, color, bandA, bandB, motif, shade, rowTone,
    seed: profileSeed(a),
    palette: palA, paletteB: palB,
    medallion: MEDALLION_NAMES[baseNumber(a.lifePath)],
    motifsA: rows.items.filter((it) => it.kind === 'letter').map((it) => MOTIF_NAMES[it.motif]),
  };
}

// --- Çizim (tarayıcı) ---

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Izgarayı verilen dikdörtgene sığdırıp çizer: gölge, dokulu düğümler, dalgalı
 * kenarlar, üstte ve altta düğümlü saçaklar. Dönen düzen parıltı çizimi için gerekir.
 */
export function drawKilim(ctx, grid, x, y, w, h) {
  const fringe = Math.max(4, Math.round(grid.rows * 0.055));
  const cs = Math.min(w / (grid.cols + 2), h / (grid.rows + fringe * 2));
  const rugW = grid.cols * cs;
  const rugH = grid.rows * cs;
  const ox = x + (w - rugW) / 2;
  const oy = y + (h - rugH) / 2;

  // Kenarlar dümdüz değil: her sıra hafifçe kayar (elde dokunmuş halı gibi)
  const p1 = (grid.seed % 1000) / 159;
  const p2 = (grid.seed % 777) / 123;
  const rowOffset = new Float32Array(grid.rows);
  for (let r = 0; r < grid.rows; r++) {
    rowOffset[r] = cs * 0.45 * (Math.sin(r * 0.07 + p1) + 0.6 * Math.sin(r * 0.021 + p2));
  }

  // Zemine düşen yumuşak gölge
  ctx.save();
  ctx.shadowColor = 'rgba(30, 18, 8, 0.38)';
  ctx.shadowBlur = Math.max(6, cs * 5);
  ctx.shadowOffsetY = Math.max(2, cs * 1.5);
  ctx.fillStyle = 'rgba(60, 40, 20, 0.6)';
  ctx.fillRect(ox + cs, oy + cs, rugW - 2 * cs, rugH - 2 * cs);
  ctx.restore();

  // Saçaklar halının altında kalsın diye önce çizilir
  drawFringe(ctx, grid, ox, oy, cs, rugH, fringe, rowOffset);

  // Düğümler: piksel piksel, iplik dokusu ve ışıkla
  const pad = Math.ceil(cs * 1.2);
  const cw = Math.ceil(rugW + 2 * pad);
  const ch = Math.ceil(rugH);
  const off = document.createElement('canvas');
  off.width = cw;
  off.height = ch;
  const octx = off.getContext('2d');
  const img = octx.createImageData(cw, ch);
  const data = img.data;

  const rgb = grid.colors.map(hexToRgb);
  const textured = cs >= 2.5;
  for (let py = 0; py < ch; py++) {
    const r = Math.min(grid.rows - 1, Math.floor(py / cs));
    const fy = py / cs - r;
    const shift = rowOffset[r];
    const tr = grid.rowTone[r * 3];
    const tg = grid.rowTone[r * 3 + 1];
    const tb = grid.rowTone[r * 3 + 2];
    const lightY = 1.04 - 0.09 * (py / ch);
    for (let px = 0; px < cw; px++) {
      const lx = px - pad - shift;
      const c = Math.floor(lx / cs);
      if (c < 0 || c >= grid.cols) continue;
      const i = r * grid.cols + c;
      const [cr, cg, cb] = rgb[grid.color[i]];
      let k = grid.shade[i] * lightY * (1 - 0.05 * (px / cw));
      if (textured) {
        const fx = lx / cs - c;
        const edge = Math.max(Math.abs(fx - 0.5), Math.abs(fy - 0.5)) * 2;
        k *= 1 + 0.08 * (0.5 - fy) - 0.2 * edge ** 4;
        if (fy < 0.1) k *= 0.93; // atkı ipliklerinin arası
      }
      const hash = (Math.imul(px, 73856093) ^ Math.imul(py, 19349663)) >>> 0;
      k *= 1 + ((hash & 255) / 255 - 0.5) * 0.07; // yün tüyü
      const o = (py * cw + px) * 4;
      data[o] = Math.min(255, cr * k * tr);
      data[o + 1] = Math.min(255, cg * k * tg);
      data[o + 2] = Math.min(255, cb * k * tb);
      data[o + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  ctx.drawImage(off, Math.round(ox - pad), Math.round(oy));
  return { ox, oy, cs, rowOffset };
}

function drawFringe(ctx, grid, ox, oy, cs, rugH, fringe, rowOffset) {
  const len = fringe * cs;
  ctx.save();
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const baseY = side < 0 ? oy + cs * 0.5 : oy + rugH - cs * 0.5;
    const shift = rowOffset[side < 0 ? 0 : grid.rows - 1];
    for (let c = 1; c < grid.cols - 1; c += 4) {
      const n = (Math.imul(c + (side > 0 ? 7 : 0), 2654435761) >>> 0) / 4294967296;
      const x0 = ox + (c + 1.5) * cs + shift;
      const sway = (n - 0.5) * cs * 2.4;
      const l = len * (0.82 + 0.25 * n);
      const knotY = baseY + side * l * 0.28;
      // dört çözgü ipliği bir düğümde toplanır, sonra püskül olarak dağılır
      ctx.strokeStyle = FRINGE_SHADOW;
      ctx.lineWidth = Math.max(0.8, cs * 0.55);
      for (const pass of [0, 1]) {
        if (pass) {
          ctx.strokeStyle = FRINGE;
          ctx.lineWidth = Math.max(0.6, cs * 0.38);
        }
        for (let s = 0; s < 4; s++) {
          const sx = x0 + (s - 1.5) * cs;
          const ex = x0 + sway + (s - 1.5) * cs * 0.7;
          ctx.beginPath();
          ctx.moveTo(sx, baseY);
          ctx.lineTo(x0 + (s - 1.5) * cs * 0.25, knotY);
          ctx.quadraticCurveTo(x0 + sway * 0.5, knotY + side * l * 0.35, ex, baseY + side * l);
          ctx.stroke();
        }
      }
      ctx.fillStyle = FRINGE_SHADOW;
      ctx.beginPath();
      ctx.arc(x0 + sway * 0.05, knotY, Math.max(1, cs * 0.75), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Bant → düğüm listesi (parıltıyı her karede tüm ızgarayı taramadan çizmek için). */
function bandIndex(grid, key) {
  grid._bands ??= {};
  if (!grid._bands[key]) {
    const src = key === 'a' ? grid.bandA : grid.bandB;
    const lists = new Map();
    for (let i = 0; i < src.length; i++) {
      if (src[i] < 0) continue;
      if (!lists.has(src[i])) lists.set(src[i], []);
      lists.get(src[i]).push(i);
    }
    grid._bands[key] = lists;
  }
  return grid._bands[key];
}

/** Çalan sıraların ipliklerini parlatır (her iki ayna kopyası birlikte). */
export function drawHighlight(ctx, grid, layout, activeA, activeB, alpha) {
  if (!activeA.size && !activeB.size) return;
  const { ox, oy, cs, rowOffset } = layout;
  ctx.save();
  ctx.fillStyle = grid.palette.glow;
  for (const [key, active] of [['a', activeA], ['b', activeB]]) {
    const lists = bandIndex(grid, key);
    for (const band of active) {
      for (const i of lists.get(band) ?? []) {
        const r = (i / grid.cols) | 0;
        const c = i - r * grid.cols;
        ctx.globalAlpha = grid.motif[i] ? alpha : alpha * 0.2;
        ctx.fillRect(ox + c * cs + rowOffset[r], oy + r * cs, cs + 0.5, cs + 0.5);
      }
    }
  }
  ctx.restore();
}

/** Sayfadaki canvas için: taban görüntüyü bir kez çizer, parıltıyı üstüne ekler. */
export class KilimView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.base = document.createElement('canvas');
    this.grid = null;
    this.layout = null;
    this.activeA = new Set();
    this.activeB = new Set();
    this.alpha = 0.7;
  }

  setGrid(grid) {
    this.grid = grid;
    this.activeA = new Set();
    this.activeB = new Set();
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    this.canvas.width = this.base.width = w;
    this.canvas.height = this.base.height = h;
    if (!this.grid) return;
    const bctx = this.base.getContext('2d');
    bctx.clearRect(0, 0, w, h);
    this.layout = drawKilim(bctx, this.grid, 0, 0, w, h);
    this.paint();
  }

  setActive(activeA, activeB, alpha = 0.7) {
    const same = (x, y) => x.size === y.size && [...x].every((v) => y.has(v));
    if (same(activeA, this.activeA) && same(activeB, this.activeB) && alpha === this.alpha) return;
    this.activeA = activeA;
    this.activeB = activeB;
    this.alpha = alpha;
    this.paint();
  }

  paint() {
    if (!this.grid || !this.layout) return;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.base, 0, 0);
    drawHighlight(ctx, this.grid, this.layout, this.activeA, this.activeB, this.alpha);
  }
}
