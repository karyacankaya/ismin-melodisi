import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CARDS, reduceTo22, cardIndex, personalityNumber, soulNumber, yearNumber,
  relationshipNumber, tarotProfile, relationshipCard,
} from '../js/tarot.js';

test('22 Büyük Arkana kartı, 0–21 sıralı ve eksiksiz', () => {
  assert.equal(CARDS.length, 22);
  CARDS.forEach((c, i) => {
    assert.equal(c.number, i);
    assert.ok(c.name && c.meaning && c.love && c.keywords);
    assert.equal(c.colors.length, 2);
  });
  assert.equal(CARDS[0].name, 'Deli');
  assert.equal(CARDS[17].name, 'Yıldız');
  assert.equal(CARDS[21].name, 'Dünya');
});

test('İndirgeme 22 ve altına iner; 22 Deli kartıdır', () => {
  assert.equal(reduceTo22(2018), 11);
  assert.equal(reduceTo22(22), 22);
  assert.equal(reduceTo22(23), 5);
  assert.equal(cardIndex(22), 0);
  assert.equal(cardIndex(11), 11);
});

test('Kişilik ve ruh kartı: 15 Kasım 1992 → XI Adalet, II Azize', () => {
  const p = personalityNumber('1992-11-15'); // 15 + 11 + 1992 = 2018 → 11
  assert.equal(p, 11);
  assert.equal(CARDS[cardIndex(p)].name, 'Adalet');
  assert.equal(soulNumber(p), 2);
  const t = tarotProfile('1992-11-15', 2026);
  assert.equal(t.personality.name, 'Adalet');
  assert.equal(t.soul.name, 'Azize');
});

test('Yıl kartı: 15 Kasım doğumlu, 2026 → IX Ermiş', () => {
  assert.equal(yearNumber('1992-11-15', 2026), 9); // 15 + 11 + 2026 = 2052 → 9
  assert.equal(tarotProfile('1992-11-15', 2026).year.name, 'Ermiş');
});

test('İlişki kartı: 12.04.1994 (III) + 25.09.1991 (IX) → XII Asılan Adam', () => {
  assert.equal(personalityNumber('1994-04-12'), 3);
  assert.equal(personalityNumber('1991-09-25'), 9);
  const r = relationshipCard('1994-04-12', '1991-09-25');
  assert.equal(r.number, 12);
  assert.equal(r.card.name, 'Asılan Adam');
});

test('İlişki toplamı 22 ise Deli kartı çıkar', () => {
  assert.equal(relationshipNumber(11, 11), 22);
  assert.equal(CARDS[cardIndex(relationshipNumber(11, 11))].name, 'Deli');
});

test('Tek haneli kişilik sayısında ruh kartı aynıdır', () => {
  const t = tarotProfile('1994-04-12', 2026);
  assert.equal(t.personality, t.soul);
  assert.equal(t.sameSoul, true);
});

test('Aynı tarih aynı kartları verir; geçersiz tarih reddedilir', () => {
  assert.deepEqual(tarotProfile('1987-10-21', 2026), tarotProfile('1987-10-21', 2026));
  assert.throws(() => personalityNumber('2023-02-30'));
});
