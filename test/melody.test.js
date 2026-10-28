import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeProfile } from '../js/numerology.js';
import {
  MODES, USULS, modeFor, usulFor, degreeFrequency, dominantStep, buildTheme, fitToBars,
  buildMelody, tempoFor, DURATION,
} from '../js/melody.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const themeOf = (m, name = 'Tema') => {
  const s = m.sections.find((x) => x.name === name);
  return m.events.filter((e) => e.voice === 'kanun' && e.start >= s.start - 1e-9 && e.start < s.end - 1e-9);
};

test('Dokuz farklı makam var ve hepsi kararla başlıyor', () => {
  const keys = new Set();
  for (let n = 1; n <= 9; n++) {
    assert.equal(MODES[n].cents[0], 0);
    keys.add(MODES[n].key);
  }
  assert.equal(keys.size, 9);
});

test('Usta sayılar taban makamını kullanır', () => {
  assert.equal(modeFor(11), MODES[2]);
  assert.equal(modeFor(22), MODES[4]);
  assert.equal(modeFor(33), MODES[6]);
});

test('Derece frekansı: karar, oktav, alt oktav ve koma sesi', () => {
  const rast = MODES[1];
  assert.ok(close(degreeFrequency(rast, 0), 196));
  assert.ok(close(degreeFrequency(rast, 7), 392));
  assert.ok(close(degreeFrequency(rast, -7), 98));
  const segah = degreeFrequency(rast, 2);
  assert.ok(segah < 196 * Math.pow(2, 400 / 1200), 'Rast segâhı düz Mi\'den pes olmalı');
});

test('Güçlü ses beşliye en yakın basamak', () => {
  assert.equal(dominantStep(MODES[1]), 4);
  assert.equal(dominantStep(MODES[3]), 3); // pentatonik: 700 cent
});

test('Usul ifade sayısından gelir ve vuruşlar ölçü içinde', () => {
  const seen = new Set();
  for (let n = 1; n <= 9; n++) seen.add(usulFor(n).key);
  assert.equal(seen.size, 4);
  for (const u of Object.values(USULS)) {
    assert.ok(u.strokes.every(([pos]) => pos >= 0 && pos < u.units));
    assert.equal(u.strokes[0][1], 'dum');
  }
});

test('Tema: harf değeri perde sınıfını seçer, oktav bir öncekine yakın', () => {
  const p = computeProfile('ar', { lifePath: 1 }); // a=1, r=9
  const theme = buildTheme(p.tokens, MODES[1]);
  const n = 7;
  assert.equal(((theme[0].step % n) + n) % n, 0);
  assert.equal(((theme[1].step % n) + n) % n, 8 % n);
  assert.ok(Math.abs(theme[1].step - theme[0].step) <= 3, 'melodi zıplamamalı');
});

test('Tema: sesli uzun, sessiz kısa, boşluk es; ölçüye oturur', () => {
  const p = computeProfile('Ali Can', { lifePath: 1 });
  const theme = buildTheme(p.tokens, MODES[1]);
  assert.equal(theme[0].len, DURATION.vowel);
  assert.equal(theme[1].len, DURATION.consonant);
  assert.ok(theme.some((x) => x.rest && x.len === DURATION.rest));
  const { notes, bars } = fitToBars(theme, 8);
  assert.equal(notes.reduce((a, x) => a + x.len, 0), bars * 8);
});

test('Beste bölümleri sırayla gelir ve final kararda biter', () => {
  const m = buildMelody(computeProfile('Ayşe', { date: '1990-05-12' }));
  const names = [...new Set(m.sections.map((s) => s.name))];
  assert.deepEqual(names, ['Giriş', 'Tema', 'Cevap', 'Nakarat', 'Final']);
  for (let i = 1; i < m.sections.length; i++) {
    assert.ok(close(m.sections[i].start, m.sections[i - 1].end, 1e-6));
  }
  const last = m.events.filter((e) => e.voice === 'kanun' && e.kind === 'note').at(-1);
  const n = m.mode.cents.length;
  const ratio = Math.log2(last.freq / m.tonic) * n; // kararın oktavı mı?
  assert.ok(close(1200 * Math.log2(last.freq / m.tonic) % 1200, 0, 1e-6) || close(ratio % n, 0, 1e-6));
});

test('Parça dinlemeye değer uzunlukta: 15–60 saniye', () => {
  for (const name of ['Su', 'Ayşe', 'Karya Cankaya', 'Muhammed Mustafa Abdurrahman']) {
    const m = buildMelody(computeProfile(name, { date: '1995-03-14' }));
    assert.ok(m.duration > 15 && m.duration < 60, `${name}: ${m.duration.toFixed(1)} sn`);
  }
});

test('Her harf temada çalınır ve bandıyla işaretlenir', () => {
  const p = computeProfile('Mert', { lifePath: 4 });
  const m = buildMelody(p);
  const bands = new Set(themeOf(m).filter((e) => e.kind === 'note').map((e) => e.band));
  assert.deepEqual([...bands].sort(), [0, 1, 2, 3]);
});

test('Türkçe harf çarpma notası alır, toplam süre değişmez', () => {
  const tr = buildMelody(computeProfile('Şule', { lifePath: 5 }));
  const plain = buildMelody(computeProfile('Sule', { lifePath: 5 }));
  const first = themeOf(tr);
  assert.equal(first[0].kind, 'grace');
  assert.equal(first[1].kind, 'note');
  assert.ok(close(tr.duration, plain.duration, 1e-6));
  assert.ok(close(first[1].freq, themeOf(plain)[0].freq));
});

test('Boşluk temada es üretir', () => {
  const m = buildMelody(computeProfile('Ali Can', { lifePath: 1 }));
  assert.ok(themeOf(m).some((e) => e.kind === 'rest'));
});

test('Def usulü çalar, final yavaşlar', () => {
  const m = buildMelody(computeProfile('Ayşe', { date: '1990-05-12' }));
  const drums = m.events.filter((e) => e.voice === 'perc');
  assert.ok(drums.length > 10);
  assert.ok(drums.every((e) => e.start >= m.sections[0].end - 1e-9), 'def girişte susar');
  // Final = tema + bir tutulan ölçü; yavaşlamasaydı tam olarak bu kadar sürerdi
  const tema = m.sections.find((s) => s.name === 'Tema');
  const fin = m.sections.at(-1);
  const straight = (tema.end - tema.start) * (m.themeBars + 1) / m.themeBars;
  assert.ok(fin.end - fin.start > straight * 1.1, 'final ritardando ile uzamalı');
});

test('Aynı girdi her zaman aynı besteyi verir', () => {
  const a = buildMelody(computeProfile('Gönül Çağlar', { date: '1987-10-21' }));
  const b = buildMelody(computeProfile('Gönül Çağlar', { date: '1987-10-21' }));
  assert.deepEqual(a, b);
  const c = buildMelody(computeProfile('Gönül Çağlar', { date: '1987-10-22' }));
  assert.notDeepEqual(a.events.map((e) => e.freq), c.events.map((e) => e.freq));
});

test('Usta sayıda dem bir oktav aşağı genişler', () => {
  const m = buildMelody(computeProfile('Mert', { lifePath: 11 }));
  assert.equal(m.master, true);
  assert.equal(m.drone.length, 3);
});

test('Uyum modu için karar sesi değiştirilebilir', () => {
  const m = buildMelody(computeProfile('Mert', { lifePath: 3 }), { tonic: 220 });
  assert.equal(m.tonic, 220);
});

test('Düet: ikinci ad birincinin makamına, usulüne ve temposuna uyar, def çalmaz', () => {
  const a = buildMelody(computeProfile('Ayşe', { lifePath: 1 }));
  const b = buildMelody(computeProfile('Mert', { lifePath: 7 }), {
    tonic: a.tonic, mode: a.mode, usul: a.usul, bpm: a.bpm, percussion: false,
  });
  assert.equal(b.mode, a.mode);
  assert.equal(b.usul, a.usul);
  assert.equal(b.bpm, a.bpm);
  assert.ok(!b.events.some((e) => e.voice === 'perc'));
});

test('Tempo makul aralıkta', () => {
  for (const n of [1, 9, 11, 33]) {
    const bpm = tempoFor(n);
    assert.ok(bpm >= 84 && bpm <= 116);
  }
});
