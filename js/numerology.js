// İsmin Melodisi — numeroloji (Pisagor sistemi)
// Saf fonksiyonlar: DOM'a dokunmaz, Node testlerinde doğrudan çalışır.

export const MASTER_NUMBERS = [11, 22, 33];

// Pisagor tablosu: A J S = 1, B K T = 2 ... I R = 9
const LETTER_VALUES = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
};

// Türkçe harfler tablodaki taban harfe eşlenir.
const TURKISH_BASE = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

// Taban harfe çevrildikten sonra sesliler (ı→i, ö→o, ü→u de sesli kalır).
// Y Türkçede sessiz olduğu için burada yok.
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Adı harf ve boşluk dizisine çevirir.
 * Her harf: { type:'letter', char, base, value, vowel, turkish }
 * Boşluk:   { type:'space' } (art arda boşluklar teke iner, baş/son atılır)
 */
export function tokenize(name) {
  const lower = String(name ?? '').toLocaleLowerCase('tr-TR');
  const tokens = [];
  for (const raw of lower) {
    if (/\s|-/.test(raw)) {
      if (tokens.length && tokens[tokens.length - 1].type !== 'space') {
        tokens.push({ type: 'space' });
      }
      continue;
    }
    let base = TURKISH_BASE[raw];
    const turkish = Boolean(base);
    if (!base) {
      // â, î, û, é gibi şapkalı/aksanlı harfler: işareti at, taban harfi al
      base = raw.normalize('NFD').replace(/[̀-ͯ]/g, '');
    }
    const value = LETTER_VALUES[base];
    if (!value) continue; // rakam, noktalama vb.
    tokens.push({ type: 'letter', char: raw, base, value, vowel: VOWELS.has(base), turkish });
  }
  while (tokens.length && tokens[tokens.length - 1].type === 'space') tokens.pop();
  return tokens;
}

export function letters(name) {
  return tokenize(name).filter((t) => t.type === 'letter');
}

function digitSum(n) {
  let sum = 0;
  for (const d of String(n)) sum += Number(d);
  return sum;
}

/** Tek haneye indirger; 11, 22, 33 usta sayıları olduğu gibi kalır. */
export function reduceNumber(n) {
  let x = Math.abs(Math.trunc(n));
  while (x > 9 && !MASTER_NUMBERS.includes(x)) x = digitSum(x);
  return x;
}

/** Usta sayının taban hâli: 11→2, 22→4, 33→6. Diğerleri aynen döner. */
export function baseNumber(n) {
  return MASTER_NUMBERS.includes(n) ? digitSum(n) : n;
}

export function isMaster(n) {
  return MASTER_NUMBERS.includes(n);
}

/** "YYYY-MM-DD" → { year, month, day } ya da geçersizse null */
export function parseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str ?? '').trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

/**
 * Yaşam yolu: gün, ay ve yıl ayrı ayrı indirgenir, sonra toplanıp yeniden indirgenir.
 * Örnek 21.10.1987 → 3 + 1 + 7 = 11 (usta sayı, indirgenmez).
 */
export function lifePathNumber(dateStr) {
  const d = parseDate(dateStr);
  if (!d) throw new Error('Geçersiz tarih: ' + dateStr);
  return reduceNumber(reduceNumber(d.day) + reduceNumber(d.month) + reduceNumber(d.year));
}

function sumValues(list) {
  return list.reduce((acc, t) => acc + t.value, 0);
}

export function expressionNumber(name) {
  return reduceNumber(sumValues(letters(name)));
}

export function soulUrgeNumber(name) {
  return reduceNumber(sumValues(letters(name).filter((t) => t.vowel)));
}

export function personalityNumber(name) {
  return reduceNumber(sumValues(letters(name).filter((t) => !t.vowel)));
}

export const THEMES = {
  1: {
    word: 'Öncü',
    text: 'Kendi patikanı açmaktan çekinmiyorsun; bir fikre inandığında ilk adımı atan çoğu zaman sen oluyorsun. Cesaretin çevrendekilere de yol gösteriyor. Ara sıra yavaşlayıp başkalarına da yürüyecek alan açtığında yolun daha da güzelleşiyor.',
  },
  2: {
    word: 'Köprü',
    text: 'İnsanların arasındaki ince ipleri herkesten önce görüyorsun. Sabrın ve sezgin, gergin bir odayı bile yumuşatabiliyor. Kendi sesini de duymayı unutmadığında kurduğun denge en sağlam hâlini alıyor.',
  },
  3: {
    word: 'Ozan',
    text: 'İçinde hep bir şarkı, bir hikâye ya da bir renk var. Neşen bulaşıcı; anlattığın her şey sıradan bir günü biraz daha parlak yapıyor. Dağınık ilhamlarını bir işe döktüğünde gerçekten iz bırakıyorsun.',
  },
  4: {
    word: 'Mimar',
    text: 'Sağlam temeller atmak sana iyi geliyor. Planlı, sabırlı ve güvenilirsin; senin elinden çıkan şey kolay kolay yıkılmıyor. Arada bir plansız bir güzelliğe de kapı araladığında hayat sana fazladan bir renk veriyor.',
  },
  5: {
    word: 'Kâşif',
    text: 'Yeni yollar, yeni yüzler, yeni tatlar seni çağırıyor. Değişime çabucak uyum sağlıyor, rutini tazeliyorsun. Gezginliğin bir yere kök salmanla buluştuğunda topladığın hikâyeler başkalarına da ilham oluyor.',
  },
  6: {
    word: 'Ocak',
    text: 'Sevdiklerinin etrafında sıcak bir ocak gibisin. Sorumluluktan kaçmıyor, çevrendeki huzuru ve güzelliği büyütüyorsun. Aynı şefkati kendine de gösterdiğinde verdiğin sevgi hiç tükenmiyor.',
  },
  7: {
    word: 'Bilge',
    text: 'Yüzeyde kalmak sana göre değil; her şeyin ardındaki anlamı merak ediyorsun. En derin cevapları çoğu zaman sessiz anlarda buluyorsun. Bildiklerini paylaşmaya cesaret ettiğinde bilgin bir fenere dönüşüyor.',
  },
  8: {
    word: 'Kaptan',
    text: 'Büyük hedeflere bakmaktan korkmuyorsun. Kararlılığın ve düzen kurma yeteneğin dağınık işleri bile sonuca taşıyor. Gücünü cömertlikle harmanladığında başarın herkesin sofrasına bereket oluyor.',
  },
  9: {
    word: 'Gönüldaş',
    text: 'Kalbin geniş; farklı insanları ve farklı hikâyeleri kucaklayabiliyorsun. Bir şeyi güzelce tamamlamayı ve vedalaşmayı bilmek senin bilgeliğin. Verdiğin emek çoğu zaman sandığından çok daha uzağa ulaşıyor.',
  },
  11: {
    word: 'Işık',
    text: 'Sezgilerin güçlü, ilhamın derin. Bazen kimsenin fark etmediğini önceden seziyor, tek bir cümlenle birinin yolunu aydınlatıyorsun. Bu yoğun enerjiyi dinlenmeyle dengelediğinde ışığın daha da berraklaşıyor.',
  },
  22: {
    word: 'Kurucu',
    text: 'Hayalleri gerçeğe dönüştürebilen ender insanlardansın. Büyük bir vizyonu sabırla, tuğla tuğla örebiliyorsun. Yükü paylaşmayı öğrendiğinde inşa ettiklerin seni de aşıp başkalarına kalıyor.',
  },
  33: {
    word: 'Şifacı',
    text: 'Sevgin koşulsuz, şefkatin iyileştirici. Yanında insanlar kendilerini görülmüş ve güvende hissediyor. Kendi yaralarına da aynı özeni gösterdiğinde ilham verme gücün katlanarak büyüyor.',
  },
};

export const DISCLAIMER = 'Eğlence amaçlıdır, bilimsel bir yöntem değildir.';

/**
 * Ad + (tarih ya da hazır yaşam yolu sayısı) → tam profil.
 * Paylaşım linkinde tarih gizlenmişse { lifePath } doğrudan verilir.
 */
export function computeProfile(name, { date, lifePath } = {}) {
  const tokens = tokenize(name);
  if (!tokens.some((t) => t.type === 'letter')) throw new Error('Adda en az bir harf olmalı.');
  let lp;
  if (date) lp = lifePathNumber(date);
  else if (isValidNumber(lifePath)) lp = Number(lifePath);
  else throw new Error('Doğum tarihi gerekli.');
  return {
    name: String(name).trim().replace(/\s+/g, ' '),
    tokens,
    date: date || null,
    lifePath: lp,
    expression: expressionNumber(name),
    soulUrge: soulUrgeNumber(name),
    personality: personalityNumber(name),
    theme: THEMES[lp],
  };
}

/** 1–9, 11, 22, 33 dışındaki değerler (ör. URL'den gelen ?yy=12) reddedilir. */
export function isValidNumber(n) {
  const x = Number(n);
  return Number.isInteger(x) && ((x >= 1 && x <= 9) || MASTER_NUMBERS.includes(x));
}

// Klasik üçlü gruplar: aynı gruptaki sayıların doğal olarak anlaştığı kabul edilir.
const GROUPS = [
  { members: [1, 5, 7], name: 'arayışçılar' },
  { members: [2, 4, 8], name: 'kurucular' },
  { members: [3, 6, 9], name: 'gönül insanları' },
];

function groupOf(n) {
  const b = baseNumber(n);
  return GROUPS.find((g) => g.members.includes(b));
}

/** İki profilden kısa, sıcak bir uyum yorumu üretir (puan vermez). */
export function compatibility(a, b) {
  const shared = reduceNumber(a.lifePath + b.lifePath);
  let title;
  let text;
  if (a.lifePath === b.lifePath) {
    title = 'Ayna';
    text = `İkiniz de ${a.lifePath} yolundasınız; aynı perdeden başlayan iki ses gibi birbirinizi kolayca duyuyorsunuz. Aynı ritimde yürümek güzel, ama arada birinizin farklı bir nota denemesine alan açmak melodiyi zenginleştirir.`;
  } else if (groupOf(a.lifePath) === groupOf(b.lifePath)) {
    title = 'Akraba Sesler';
    text = `${a.lifePath} ve ${b.lifePath} aynı aileden, ${groupOf(a.lifePath).name} üçlüsünden. Birbirinizin cümlesini tamamlamanız için çok söze gerek yok; ortak bir hedefe yöneldiğinizde iki ses tek bir ezgiye dönüşüyor.`;
  } else {
    title = 'Tamamlayan Sesler';
    text = `${a.lifePath} ile ${b.lifePath} farklı makamlardan geliyor; biri diğerinin eksik notasını taşıyor. İlk anda farklı tempolarda çalabilirsiniz, ama birbirinizi dinledikçe ortaya ikinizin tek başına çıkaramayacağı bir armoni çıkıyor.`;
  }
  const extras = [];
  if (a.soulUrge && a.soulUrge === b.soulUrge) {
    extras.push(`Ruh güdüleriniz aynı (${a.soulUrge}): içten içe aynı şeyi istiyorsunuz.`);
  }
  if (a.expression === b.expression) {
    extras.push(`İfade sayılarınız da aynı (${a.expression}); kendinizi benzer biçimde anlatıyorsunuz.`);
  }
  extras.push(`Birlikte sayınız ${shared}: ${THEMES[shared].word}.`);
  return { title, text: text + ' ' + extras.join(' '), shared };
}

// --- Deterministik rastgelelik (kilim dokusu için) ---

/** FNV-1a 32 bit hash: aynı metin her zaman aynı sayıyı verir. */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (const ch of String(str)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: tohumdan 0–1 arası tekrarlanabilir sayı dizisi üretir. */
export function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Profilin tohumu: normalize ad (taban harfler) + yaşam yolu. */
export function profileSeed(profile) {
  const key = profile.tokens.map((t) => (t.type === 'space' ? ' ' : t.char)).join('') + '|' + profile.lifePath;
  return hashString(key);
}
