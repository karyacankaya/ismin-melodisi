// İsmin Melodisi — addan küçük bir beste
// Ad, parçanın ana temasıdır: her harf bir nota. Tema bir usulün (ritim döngüsü)
// içine oturtulur, sonra giriş → tema → cevap → nakarat → final diye gelişir.
// Saf fonksiyonlar: ses çalmaz, zamanlanmış olay listesi üretir. Hem audio.js
// (çalmak için) hem kilim.js (parlatmak için) aynı listeyi okur.

import { baseNumber, isMaster, createRng, profileSeed } from './numerology.js';

// Makam dizileri, kararın (tonik) üstündeki cent değerleri olarak.
// Koma sesleri 53 eşit bölümlü Türk müziği aralıklarından yaklaşık alındı
// (1 koma ≈ 22.6 cent): ör. Rast'ın segâhı 385 cent, düz Mi 400 cent olurdu.
export const MODES = {
  1: { key: 'rast', name: 'Rast', mood: 'aydınlık, öncü', tonic: 196.0, cents: [0, 204, 385, 498, 702, 906, 1087] },
  2: { key: 'ussak', name: 'Uşşak', mood: 'içli, yumuşak', tonic: 220.0, cents: [0, 181, 294, 498, 702, 792, 996] },
  3: { key: 'pentatonik', name: 'Majör Pentatonik', mood: 'neşeli, türkü havası', tonic: 261.63, cents: [0, 200, 400, 700, 900] },
  4: { key: 'cargah', name: 'Çargâh', mood: 'düzenli, sağlam', tonic: 261.63, cents: [0, 200, 400, 500, 700, 900, 1100] },
  5: { key: 'hicaz', name: 'Hicaz', mood: 'gezgin, renkli', tonic: 220.0, cents: [0, 113, 385, 498, 702, 792, 996] },
  6: { key: 'nihavend', name: 'Nihâvend', mood: 'sıcak, şefkatli', tonic: 196.0, cents: [0, 204, 294, 498, 702, 792, 1087] },
  7: { key: 'kurdi', name: 'Kürdî', mood: 'derin, düşünceli', tonic: 220.0, cents: [0, 90, 294, 498, 702, 792, 996] },
  8: { key: 'huseyni', name: 'Hüseynî', mood: 'güçlü, geniş', tonic: 220.0, cents: [0, 181, 294, 498, 702, 883, 996] },
  9: { key: 'saba', name: 'Sabâ', mood: 'hüzünlü, kapsayıcı', tonic: 220.0, cents: [0, 181, 294, 407, 679, 792, 996] },
};

// Usuller: bir ölçüdeki sekizlik sayısı ve vuruşlar (düm = pes, tek = tiz, ke = hafif tiz).
export const USULS = {
  sofyan: { key: 'sofyan', name: 'Sofyan', meter: '4/4', units: 8, strokes: [[0, 'dum'], [4, 'tek'], [6, 'ke']] },
  duyek: { key: 'duyek', name: 'Düyek', meter: '8/8', units: 8, strokes: [[0, 'dum'], [1, 'tek'], [3, 'tek'], [4, 'dum'], [6, 'tek']] },
  semai: { key: 'semai', name: 'Semâî', meter: '3/4', units: 6, strokes: [[0, 'dum'], [2, 'tek'], [4, 'tek']] },
  aksak: { key: 'aksak', name: 'Aksak', meter: '9/8', units: 9, strokes: [[0, 'dum'], [2, 'tek'], [4, 'dum'], [5, 'dum'], [6, 'tek']] },
};
const USUL_ORDER = ['sofyan', 'duyek', 'semai', 'aksak'];

// Süreler "birim" cinsinden; 1 birim = sekizlik nota.
export const DURATION = { consonant: 1, vowel: 2, rest: 2, grace: 0.25 };

const VOLUME = { theme: 0.55, answer: 0.5, chorus: 0.5, final: 0.55, intro: 0.3, grace: 0.55, ney: 0.6, bass: 0.45 };
const DRUM_VOLUME = { dum: 0.8, tek: 0.5, ke: 0.3 };
const RITARDANDO = 0.15; // finalde tempo %30'a kadar yavaşlar

/** Yaşam yolu sayısına göre makam. Usta sayılar tabanlarının makamını alır. */
export function modeFor(lifePath) {
  return MODES[baseNumber(lifePath)];
}

/** İfade sayısına göre usul. */
export function usulFor(expression) {
  return USULS[USUL_ORDER[(baseNumber(expression || 1) - 1) % USUL_ORDER.length]];
}

/** Tempo, ifade sayısından gelir: 84–116 BPM arası. */
export function tempoFor(expression) {
  return 80 + baseNumber(expression || 1) * 4;
}

/**
 * Makamda bir basamağın frekansı. 0 = karar; dizi bitince üst oktava geçer,
 * eksi basamaklar alt oktava iner.
 */
export function degreeFrequency(mode, step, tonic = mode.tonic) {
  const n = mode.cents.length;
  const octave = Math.floor(step / n);
  const cents = mode.cents[((step % n) + n) % n] + 1200 * octave;
  return tonic * Math.pow(2, cents / 1200);
}

/** Beşliye (güçlü sese) en yakın basamak: makamın ikinci durağı. */
export function dominantStep(mode) {
  let best = 0;
  mode.cents.forEach((c, i) => {
    if (Math.abs(c - 702) < Math.abs(mode.cents[best] - 702)) best = i;
  });
  return best;
}

/** Hedef perde sınıfının, verilen basamağa en yakın oktavdaki hâli. */
function nearestOf(pitchClass, n, near) {
  let best = pitchClass;
  for (let k = -3; k <= 3; k++) {
    const s = pitchClass + k * n;
    if (Math.abs(s - near) < Math.abs(best - near)) best = s;
  }
  return best;
}

/**
 * Ad → tema. Harfin Pisagor değeri makamın derecesini (perde sınıfını) seçer;
 * oktav ise bir önceki notaya en yakın olan seçilir, böylece melodi zıplamaz,
 * şarkı söyler gibi akar. Sesli 2 birim, sessiz 1 birim, boşluk 2 birim es.
 */
export function buildTheme(tokens, mode) {
  const n = mode.cents.length;
  let prev = Math.floor(n / 2);
  return tokens.map((t, band) => {
    if (t.type === 'space') return { rest: true, band, len: DURATION.rest };
    const pc = (t.value - 1) % n;
    let step = nearestOf(pc, n, prev);
    if (step < -2) step += n;
    if (step > 2 * n - 2) step -= n;
    prev = step;
    return {
      band, char: t.char, step, vowel: t.vowel, turkish: t.turkish,
      len: t.vowel ? DURATION.vowel : DURATION.consonant,
    };
  });
}

/** Temayı tam ölçülere oturtur: son nota, ölçü bitene kadar uzatılır. */
export function fitToBars(theme, barUnits) {
  const total = theme.reduce((a, x) => a + x.len, 0);
  const bars = Math.max(1, Math.ceil(total / barUnits));
  const notes = theme.map((x) => ({ ...x }));
  notes[notes.length - 1].len += bars * barUnits - total;
  return { notes, bars };
}

/**
 * Profil → beste.
 * Uyum modunda ikinci ad birincinin dünyasına taşınabilir:
 *  options.tonic  karar sesi
 *  options.mode, options.usul, options.bpm  birlikte çalarken aynı makam, usul ve tempo
 *  options.percussion  false ise def çalmaz (birlikte çalarken tek def yeter)
 */
export function buildMelody(profile, options = {}) {
  const mode = options.mode ?? modeFor(profile.lifePath);
  const tonic = options.tonic ?? mode.tonic;
  const usul = options.usul ?? usulFor(profile.expression);
  const bpm = options.bpm ?? tempoFor(profile.expression);
  const percussion = options.percussion ?? true;
  const unit = 60 / bpm / 2; // sekizlik notanın saniyesi
  const U = usul.units;
  const n = mode.cents.length;
  const dom = dominantStep(mode);
  const rng = createRng(profileSeed(profile));
  const { notes: theme, bars: themeBars } = fitToBars(buildTheme(profile.tokens, mode), U);

  const raw = []; // birim cinsinden olaylar
  const sections = [];
  let t = 0;

  // Giriş: kanun makamın ana seslerinden bir arpejle açar
  const arp = rng() < 0.5 ? [0, 2, 4, n, n + 2, n, 4, 2] : [0, 4, 2, n, 4, n + 2, n, 4];
  const introLen = 2 * U;
  for (let i = 0; i < introLen - 2; i++) {
    raw.push({ voice: 'kanun', kind: 'note', start: i, len: 1, step: arp[i % arp.length], band: -1, vel: VOLUME.intro * (0.7 + 0.6 * (i / introLen)) });
  }
  raw.push({ voice: 'kanun', kind: 'note', start: introLen - 2, len: 2, step: n, band: -1, vel: VOLUME.intro * 1.3, tremolo: true });
  sections.push({ name: 'Giriş', start: 0, end: introLen });
  t = introLen;

  // Tema bir kez çalınır; dönüşümleri (aktarma, kapanış, çalgılar) parametreyle değişir
  function statement(name, { shift = 0, end = null, voices = ['kanun'], vel, tremolo = false, bass = 0 }) {
    const start = t;
    let lastStep = 0;
    theme.forEach((note, i) => {
      if (note.rest) {
        raw.push({ voice: 'kanun', kind: 'rest', start: t, len: note.len, band: note.band });
        t += note.len;
        return;
      }
      let step = note.step + shift;
      if (i === theme.length - 1 && end !== null) step = nearestOf(end, n, lastStep);
      lastStep = step;
      let s0 = t;
      let len = note.len;
      if (note.turkish) {
        raw.push({ voice: 'kanun', kind: 'grace', start: s0, len: DURATION.grace, step: step + 1, band: note.band, char: note.char, vel: vel * VOLUME.grace });
        s0 += DURATION.grace;
        len -= DURATION.grace;
      }
      for (const voice of voices) {
        raw.push({
          voice, kind: 'note', start: s0, len, step, band: note.band, char: note.char, vowel: note.vowel,
          vel: voice === 'ney' ? vel * VOLUME.ney : vel,
          tremolo: voice === 'kanun' && tremolo && len >= 2,
        });
      }
      t += note.len;
    });
    for (let b = start; b < t; b += U) {
      raw.push({ voice: 'bass', kind: 'note', start: b, len: U, step: bass - n, band: -1, vel: VOLUME.bass });
    }
    sections.push({ name, start, end: t });
  }

  // Kısa adlar her cümleyi iki kez söyler ki parça dolu olsun; uzun adlar cevabı atlar
  const reps = themeBars <= 1 ? 2 : 1;
  for (let r = 0; r < reps; r++) statement('Tema', { vel: VOLUME.theme });
  if (themeBars <= 3) {
    for (let r = 0; r < reps; r++) statement('Cevap', { shift: 2, end: dom, vel: VOLUME.answer, bass: dom });
    for (let r = 0; r < reps; r++) statement('Nakarat', { voices: ['kanun', 'ney'], vel: VOLUME.chorus, tremolo: true });
  }
  const finalStart = t;
  statement('Final', { end: 0, voices: ['kanun', 'ney'], vel: VOLUME.final, tremolo: true });

  // Son nota bir ölçü daha tutulur, altta karar sesi
  const lastNotes = raw.filter((e) => e.kind === 'note' && e.voice !== 'bass' && e.start + e.len === t);
  for (const e of lastNotes) {
    e.len += U;
    e.tremolo = e.voice === 'kanun';
  }
  raw.push({ voice: 'bass', kind: 'note', start: t, len: U, step: -n, band: -1, vel: VOLUME.bass });
  t += U;
  const sectionFinal = sections[sections.length - 1];
  sectionFinal.end = t;

  // Def: temayla girer, usulü her ölçüde çalar; nakaratta hafif süslemeler, finalde tek düm
  for (let b = introLen; percussion && b < t - U; b += U) {
    const inChorus = sections.some((s) => s.name === 'Nakarat' && b >= s.start && b < s.end);
    const taken = new Set();
    for (const [pos, drum] of usul.strokes) {
      raw.push({ voice: 'perc', kind: 'drum', drum, start: b + pos, len: 1, band: -1, vel: DRUM_VOLUME[drum] });
      taken.add(pos);
    }
    if (inChorus) {
      for (let pos = 1; pos < U; pos++) {
        if (!taken.has(pos) && rng() < 0.4) raw.push({ voice: 'perc', kind: 'drum', drum: 'ke', start: b + pos, len: 1, band: -1, vel: 0.2 });
      }
    }
  }
  if (percussion) raw.push({ voice: 'perc', kind: 'drum', drum: 'dum', start: t - U, len: 1, band: -1, vel: DRUM_VOLUME.dum });

  // Birim → saniye; finalde yavaşlayarak (ritardando)
  const finalLen = t - finalStart;
  const toSec = (u) => {
    if (u <= finalStart) return u * unit;
    const x = Math.min(1, (u - finalStart) / finalLen);
    return (finalStart + finalLen * (x + RITARDANDO * x * x)) * unit;
  };

  const events = raw
    .map((e) => {
      const ev = { ...e, start: toSec(e.start), duration: toSec(e.start + e.len) - toSec(e.start) };
      delete ev.len;
      if (e.step !== undefined) ev.freq = degreeFrequency(mode, e.step, tonic);
      return ev;
    })
    .sort((a, b) => a.start - b.start);

  const drone = [tonic / 2, (tonic / 2) * Math.pow(2, 702 / 1200)];
  if (isMaster(profile.lifePath)) drone.push(tonic / 4);

  return {
    mode, usul, tonic, bpm, unit, themeBars,
    master: isMaster(profile.lifePath),
    events,
    sections: sections.map((s) => ({ name: s.name, start: toSec(s.start), end: toSec(s.end) })),
    duration: toSec(t) + 2 * unit, // yankının sönmesi için kısa bir nefes
    drone,
  };
}
