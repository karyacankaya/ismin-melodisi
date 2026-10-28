import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenize, letters, reduceNumber, baseNumber, lifePathNumber, parseDate,
  expressionNumber, soulUrgeNumber, personalityNumber, computeProfile,
  compatibility, isValidNumber, THEMES, hashString, createRng, profileSeed,
} from '../js/numerology.js';

test('Türkçe harfler taban harfe eşlenir', () => {
  const t = letters('çğıöşü');
  assert.deepEqual(t.map((x) => x.base), ['c', 'g', 'i', 'o', 's', 'u']);
  assert.ok(t.every((x) => x.turkish));
  assert.equal(expressionNumber('Şükrü'), expressionNumber('Sukru'));
  assert.equal(expressionNumber('Gönül Çağlar'), expressionNumber('Gonul Caglar'));
});

test('Büyük İ ve I Türkçe kurala göre küçülür', () => {
  assert.deepEqual(letters('İI').map((x) => x.char), ['i', 'ı']);
  assert.deepEqual(letters('İI').map((x) => x.value), [9, 9]);
});

test('ı, ö, ü sesli; y sessiz sayılır', () => {
  const t = letters('ıöüy');
  assert.deepEqual(t.map((x) => x.vowel), [true, true, true, false]);
});

test('Boşluklar teke iner, harf olmayanlar atılır', () => {
  const t = tokenize('  Ali   Can-2! ');
  assert.deepEqual(t.map((x) => (x.type === 'space' ? '_' : x.char)).join(''), 'ali_can');
});

test('İndirgeme ve usta sayılar', () => {
  assert.equal(reduceNumber(32), 5);
  assert.equal(reduceNumber(99), 9); // 18 → 9
  assert.equal(reduceNumber(11), 11);
  assert.equal(reduceNumber(22), 22);
  assert.equal(reduceNumber(33), 33);
  assert.equal(reduceNumber(29), 11); // 2+9 = 11, durur
  assert.equal(reduceNumber(44), 8);
  assert.equal(baseNumber(11), 2);
  assert.equal(baseNumber(33), 6);
  assert.equal(baseNumber(7), 7);
});

test('Yaşam yolu: 21 Ekim 1987 → 11 (kaynak metindeki örnek)', () => {
  assert.equal(lifePathNumber('1987-10-21'), 11);
});

test('Yaşam yolu: bileşen düzeyinde usta sayı korunur', () => {
  // gün 22 (usta) + ay 11 (usta) + yıl 2000 → 2 : 22 + 11 + 2 = 35 → 8
  assert.equal(lifePathNumber('2000-11-22'), 8);
  // 1990-05-12: 3 + 5 + 1 (19→10→1) = 9
  assert.equal(lifePathNumber('1990-05-12'), 9);
});

test('Geçersiz tarihler reddedilir', () => {
  assert.equal(parseDate('2023-02-30'), null);
  assert.equal(parseDate('12.05.1990'), null);
  assert.throws(() => lifePathNumber(''));
});

test('İfade, ruh güdüsü, kişilik: OGGUSTO örneği', () => {
  assert.equal(expressionNumber('OGGUSTO'), 5); // 32 → 5
  assert.equal(soulUrgeNumber('OGGUSTO'), 6); // o6 u3 o6 = 15 → 6
  assert.equal(personalityNumber('OGGUSTO'), 8); // g7 g7 s1 t2 = 17 → 8
});

test('Karya örneği: kader/ifade 2, ruh 2, kişilik 9', () => {
  assert.equal(expressionNumber('Karya'), 2); // 2+1+9+7+1 = 20 → 2
  assert.equal(soulUrgeNumber('Karya'), 2); // a1 + a1
  assert.equal(personalityNumber('Karya'), 9); // k2 r9 y7 = 18 → 9
});

test('Profil: tarih zorunlu, aynı girdi aynı sonucu verir', () => {
  assert.throws(() => computeProfile('Ayşe'));
  const a = computeProfile('Ayşe Yılmaz', { date: '1990-05-12' });
  const b = computeProfile('Ayşe Yılmaz', { date: '1990-05-12' });
  assert.deepEqual(a, b);
  assert.equal(a.theme, THEMES[a.lifePath]);
});

test('Profil: paylaşım linkindeki yaşam yolu ile tarihli profil aynı tohumu verir', () => {
  const withDate = computeProfile('Mert', { date: '1987-10-21' });
  const withNumber = computeProfile('Mert', { lifePath: 11 });
  assert.equal(withNumber.lifePath, 11);
  assert.equal(profileSeed(withDate), profileSeed(withNumber));
});

test('Geçerli sayı kontrolü', () => {
  for (const n of [1, 5, 9, 11, 22, 33, '7']) assert.ok(isValidNumber(n));
  for (const n of [0, 10, 12, 44, 'x', 2.5]) assert.equal(isValidNumber(n), false);
});

test('Her sayının teması ve yorumu var', () => {
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
    assert.ok(THEMES[n].word.length > 0);
    assert.ok(THEMES[n].text.split('.').filter((s) => s.trim()).length >= 2);
  }
});

test('Uyum yorumu deterministik ve doğru başlık seçer', () => {
  const a = computeProfile('Ayşe', { lifePath: 1 });
  const b = computeProfile('Mert', { lifePath: 5 });
  const c = computeProfile('Can', { lifePath: 2 });
  assert.equal(compatibility(a, b).title, 'Akraba Sesler');
  assert.equal(compatibility(a, a).title, 'Ayna');
  assert.equal(compatibility(a, c).title, 'Tamamlayan Sesler');
  assert.deepEqual(compatibility(a, b), compatibility(a, b));
  assert.equal(compatibility(a, b).shared, 6);
});

test('Hash ve PRNG tekrarlanabilir', () => {
  assert.equal(hashString('ayşe'), hashString('ayşe'));
  assert.notEqual(hashString('ayşe'), hashString('ayse'));
  const r1 = createRng(42);
  const r2 = createRng(42);
  const s1 = Array.from({ length: 5 }, r1);
  const s2 = Array.from({ length: 5 }, r2);
  assert.deepEqual(s1, s2);
  assert.ok(s1.every((x) => x >= 0 && x < 1));
});
