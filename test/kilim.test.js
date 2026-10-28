import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeProfile } from '../js/numerology.js';
import { buildKilim, layoutBands, PALETTES, MEDALLION_NAMES } from '../js/kilim.js';

const ayse = computeProfile('Ayşe Yılmaz', { date: '1990-05-12' });
const mert = computeProfile('Mert', { date: '1987-10-21' });

function assertMirrored(g) {
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      const i = y * g.cols + x;
      assert.equal(g.color[i], g.color[y * g.cols + (g.cols - 1 - x)]);
      assert.equal(g.color[i], g.color[(g.rows - 1 - y) * g.cols + x]);
    }
  }
}

const colorAt = (g, x, y) => g.colors[g.color[y * g.cols + x]];

test('Halı yatay ve dikey simetrik', () => {
  assertMirrored(buildKilim(ayse));
  assertMirrored(buildKilim(ayse, mert));
});

test('Aynı girdi aynı halıyı verir', () => {
  assert.deepEqual(buildKilim(ayse), buildKilim(computeProfile('Ayşe Yılmaz', { date: '1990-05-12' })));
});

test('Her harf bir sıraya karşılık gelir, sesli sıra daha kalın', () => {
  const { items } = layoutBands(mert.tokens);
  const lettersOnly = items.filter((it) => it.kind === 'letter');
  assert.equal(lettersOnly.length, 4);
  assert.ok(lettersOnly[1].size > lettersOnly[2].size); // e sesli, r sessiz
  const g = buildKilim(mert);
  for (const it of lettersOnly) assert.ok(g.bandA.includes(it.band), `bant ${it.band} görünmeli`);
});

test('Göbeğin ortası fildişi rozet, dış kenar kontur', () => {
  const g = buildKilim(ayse);
  const pal = PALETTES[ayse.lifePath];
  assert.equal(colorAt(g, g.cols / 2, g.rows / 2), pal.main);
  assert.equal(colorAt(g, 0, g.rows / 2), pal.line);
});

test('Yaşam yolu göbek şeklini ve paleti seçer', () => {
  const names = new Set();
  for (let lp = 1; lp <= 9; lp++) {
    const g = buildKilim(computeProfile('Deniz', { lifePath: lp }));
    names.add(g.medallion);
    assert.equal(g.palette, PALETTES[lp]);
  }
  assert.equal(names.size, Object.keys(MEDALLION_NAMES).length);
});

test('Uzun adlar da makul boyutta kalır', () => {
  const g = buildKilim(computeProfile('Muhammed Mustafa Abdurrahman Yıldırım', { lifePath: 4 }));
  assert.ok(g.cols * g.rows < 600000);
  assert.ok(g.cols / g.rows > 0.5 && g.cols / g.rows < 0.8);
});
