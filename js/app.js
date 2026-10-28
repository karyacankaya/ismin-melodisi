// İsmin Melodisi — sayfanın kendisi
// Formlar, canlı halı önizlemesi, sonuç kartı, çalma ve parlatma, tarot kartları,
// paylaşım linki, PNG kart, uyum (düet) ve kart rehberi. Hesaplamaların hepsi
// diğer modüllerde; burası yalnızca onları sayfaya bağlar.

import { computeProfile, compatibility, isValidNumber, parseDate, DISCLAIMER } from './numerology.js';
import { buildMelody } from './melody.js';
import { buildKilim, drawKilim, KilimView } from './kilim.js';
import { NamePlayer } from './audio.js';
import { CARDS, cardIndex, personalityNumber, soulNumber, yearNumber, relationshipNumber } from './tarot.js';
import { cardSVG } from './cardart.js';

const RWS_FILES = ['00-fool', '01-magician', '02-high-priestess', '03-empress', '04-emperor', '05-hierophant',
  '06-lovers', '07-chariot', '08-strength', '09-hermit', '10-wheel-of-fortune', '11-justice', '12-hanged-man',
  '13-death', '14-temperance', '15-devil', '16-tower', '17-star', '18-moon', '19-sun', '20-judgement', '21-world'];

/** Kullanıcıdan (ya da paylaşım linkinden) gelen metni HTML içine güvenle koymak için. */
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const today = new Date().toISOString().slice(0, 10);

function stored(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* gizli pencere: hatırlanmaz, sorun değil */ }
}

let deck = stored('deste', 'cizim') === 'orijinal' ? 'orijinal' : 'cizim';
const player = new NamePlayer();

/** Kartın görseli, seçili desteyle. uid aynı sayfada çakışmasın diye. */
function cardArt(n, uid) {
  const image = deck === 'orijinal' ? `assets/tarot/${RWS_FILES[n]}.jpg` : null;
  return cardSVG(CARDS[n], { uid, image });
}

/** Adın harflerini, çalarken parlayabilecek şekilde yazar. */
function renderLetters(el, profile, who = '') {
  el.textContent = '';
  if (who) {
    const tag = document.createElement('span');
    tag.className = 'who';
    tag.textContent = who;
    el.append(tag);
  }
  // Her kelime bölünmez bir grup; satır yalnızca kelime aralarında kırılır
  let word = null;
  profile.tokens.forEach((t, band) => {
    if (t.type === 'space') {
      el.append(' · ');
      word = null;
      return;
    }
    if (!word) {
      word = document.createElement('span');
      word.className = 'word';
      el.append(word);
    }
    const s = document.createElement('span');
    s.textContent = t.char;
    s.dataset.band = band;
    word.append(s);
  });
}

function scrollToEl(el) {
  el.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
}

// ---------------------------------------------------------------------------
// Çal düğmeleri: girdap süsü ve tek bir çalma oturumu
// ---------------------------------------------------------------------------

function decorateSeal(button) {
  const swirl = $('.swirl', button);
  let dots = '';
  for (let i = 0; i < 140; i++) {
    const a = i * 0.32;
    const r = 18 + i * 0.58;
    const kind = i % 3;
    dots += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="${kind ? 1.1 : 1.6}" fill="${kind === 0 ? '#f2d68c' : kind === 1 ? '#d98fa8' : '#9fb7e6'}"/>`;
  }
  swirl.innerHTML = dots;
}
$$('.seal').forEach(decorateSeal);

let session = null; // { button, view, rows: [{ track, el }], sectionEl, names }
let raf = 0;

function setSeal(button, playing) {
  button.setAttribute('aria-pressed', String(playing));
  $('.label', button).textContent = playing ? 'DUR' : 'ÇAL';
  button.setAttribute('aria-label', playing ? 'Durdur' : button.dataset.playLabel);
}

function stopPlayback() {
  if (!session) return;
  player.stop();
  cancelAnimationFrame(raf);
  session.view.setActive(new Set(), new Set());
  session.rows.forEach(({ el }) => $$('span.on', el).forEach((s) => s.classList.remove('on')));
  session.sectionEl.innerHTML = '&nbsp;';
  setSeal(session.button, false);
  session = null;
}

function frame(t) {
  if (!session) return;
  const { a, b, section, sectionTrack } = player.active();
  const alpha = reduceMotion.matches ? 0.7 : 0.55 + 0.2 * Math.sin(t / 140);
  session.view.setActive(a, b, alpha);
  for (const { track, el } of session.rows) {
    const on = track === 'b' ? b : a;
    $$('span[data-band]', el).forEach((s) => s.classList.toggle('on', on.has(Number(s.dataset.band))));
  }
  let label = section ?? ' ';
  if (section && session.names) {
    label = sectionTrack === 'ab' ? `Birlikte · ${section}` : `${session.names[sectionTrack] ?? ''} · ${section}`;
  }
  if (session.sectionEl.textContent !== label) session.sectionEl.textContent = label;
  raf = requestAnimationFrame(frame);
}

async function startPlayback(ctx) {
  stopPlayback();
  session = ctx;
  setSeal(ctx.button, true);
  await player.play({
    tracks: ctx.tracks,
    drone: ctx.drone,
    loop: ctx.loop(),
    onEnd: () => stopPlayback(),
  });
  raf = requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Giriş: yazdıkça dokunan halı
// ---------------------------------------------------------------------------

const heroView = new KilimView($('#hero-kilim'));
new ResizeObserver(() => heroView.resize()).observe($('#hero-kilim'));
let previewTimer = 0;
let lastPreview = '';

function previewProfile() {
  const name = $('#ad').value.trim();
  const date = $('#tarih').value;
  try {
    return computeProfile(name || 'Melodi', parseDate(date) ? { date } : { lifePath: 7 });
  } catch {
    return computeProfile('Melodi', { lifePath: 7 });
  }
}

function updatePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const p = previewProfile();
    const key = p.tokens.map((t) => t.char ?? ' ').join('') + p.lifePath;
    if (key === lastPreview) return;
    lastPreview = key;
    heroView.setGrid(buildKilim(p));
    $('#hero-caption').textContent = $('#ad').value.trim() ? `${p.name} için dokunan halı` : 'Adını yazdıkça halın dokunur';
  }, 140);
}
$('#ad').addEventListener('input', updatePreview);
$('#tarih').addEventListener('input', updatePreview);
updatePreview();

// ---------------------------------------------------------------------------
// Form doğrulama
// ---------------------------------------------------------------------------

function readPerson(nameInput, dateInput, errors) {
  const name = nameInput.value.trim();
  const date = dateInput.value;
  let ok = true;
  const hasLetter = /\p{L}/u.test(name);
  nameInput.setAttribute('aria-invalid', String(!hasLetter));
  if (!hasLetter) {
    errors.push('Adında en az bir harf olmalı.');
    ok = false;
  }
  const valid = parseDate(date) && date <= today;
  dateInput.setAttribute('aria-invalid', String(!valid));
  if (!valid) {
    errors.push(date ? 'Doğum tarihi bugünden ileri olamaz.' : 'Doğum tarihini seç; makamın ve kartların ona göre belirlenir.');
    ok = false;
  }
  return ok ? { name, date } : null;
}

for (const input of $$('input[type="date"]')) input.max = today;

// ---------------------------------------------------------------------------
// Tek kişi: sonuç kartı, müzik, tarot, paylaşım
// ---------------------------------------------------------------------------

const single = {
  view: new KilimView($('#r-kilim')),
  profile: null,
  melody: null,
  grid: null,
  date: null,
  pn: null, // tarot kişilik sayısı (1–22)
  year: new Date().getFullYear(),
};
new ResizeObserver(() => single.view.resize()).observe($('#r-kilim'));
$('#cal-tek').dataset.playLabel = 'Melodiyi çal';

function showSingle(profile, { date = null, pn }, { scroll = true } = {}) {
  stopPlayback();
  Object.assign(single, {
    profile,
    melody: buildMelody(profile),
    grid: buildKilim(profile),
    date,
    pn,
    year: new Date().getFullYear(),
  });
  const { melody, grid } = single;

  $('#r-ad').textContent = profile.name.toLocaleUpperCase('tr-TR');
  $('#r-tema').textContent = profile.theme.word;
  $('#r-yorum').textContent = profile.theme.text;
  const nums = [
    [profile.lifePath, 'Yaşam yolu', melody.mode.name],
    [profile.expression, 'Kader', 'tüm harfler'],
    [profile.soulUrge || '–', 'Ruh', 'sesliler'],
    [profile.personality || '–', 'Kişilik', 'sessizler'],
  ];
  $('#r-nums').innerHTML = nums.map(([n, l, h]) => `<div><b>${n}</b><span>${l}</span><i>${h}</i></div>`).join('');
  const card = CARDS[cardIndex(pn)];
  $('#r-tarot').textContent = `Tarot: ${card.roman} ${card.name}`;
  $('#r-kilim').setAttribute('aria-label',
    `${profile.name} adından dokunan halı: ${grid.palette.name} paleti, ${grid.medallion.toLocaleLowerCase('tr-TR')} göbek; motif sıraları ${grid.motifsA.join(', ')}.`);
  $('#r-muzik').textContent =
    `${melody.mode.name} makamı · ${melody.usul.name} usulü (${melody.usul.meter}) · ${Math.round(melody.duration)} sn · ${grid.medallion} göbek, ${grid.palette.name}`;
  renderLetters($('#r-harfler'), profile);
  $('#durum-tek').textContent = '';
  $('#tarih-linke').checked = false;
  $('#tarih-linke').disabled = !date;
  $('#link-aciklama').textContent = date
    ? 'Link adını ve sayılarını taşır; doğum tarihin gizli kalır.'
    : 'Bu sonuç bir paylaşım linkinden açıldı; doğum tarihi bilinmiyor.';

  $('#sonuc').hidden = false;
  single.view.setGrid(grid);
  renderTarot();
  if (scroll) scrollToEl($('#sonuc'));
}

$('#form-tek').addEventListener('submit', (e) => {
  e.preventDefault();
  const errors = [];
  const person = readPerson($('#ad'), $('#tarih'), errors);
  $('#hata-tek').textContent = errors.join(' ');
  if (!person) return;
  const profile = computeProfile(person.name, { date: person.date });
  showSingle(profile, { date: person.date, pn: personalityNumber(person.date) });
});

$('#cal-tek').addEventListener('click', () => {
  if (session?.button === $('#cal-tek')) return stopPlayback();
  if (!single.melody) return;
  startPlayback({
    button: $('#cal-tek'),
    view: single.view,
    rows: [{ track: 'a', el: $('#r-harfler') }],
    sectionEl: $('#r-bolum'),
    names: null,
    tracks: [{ id: 'a', melody: single.melody, offset: 0 }],
    drone: single.melody.drone,
    loop: () => $('#dongu-tek').checked,
  });
});

// --- Tarot kartları ---

function renderTarot() {
  if (!single.profile) return;
  const pn = single.pn;
  const sn = soulNumber(pn);
  const same = cardIndex(pn) === cardIndex(sn);
  const items = [
    { role: 'Kişilik kartın', n: cardIndex(pn), text: 'Hayat amacını ve dünyaya gösterdiğin yüzü anlatır; ömür boyu değişmez.' },
    {
      role: 'Ruh kartın', n: cardIndex(sn),
      text: same ? 'Kişilik sayın tek haneli; ruh kartın da aynı kart. İçin ve dışın aynı yöne bakıyor.' : 'İç dünyanı ve seni içten içe neyin harekete geçirdiğini anlatır.',
    },
  ];
  if (single.date) {
    items.push({ role: 'Yıl kartın', n: cardIndex(yearNumber(single.date, single.year)), year: true, text: `${single.year} yılında öne çıkan enerji; her doğum gününde değişir.` });
  }
  $('#r-kartlar').innerHTML = items.map((it, i) => `
    <article class="tarot-card">
      <div class="card-art">${cardArt(it.n, 'r' + i)}</div>
      <div>
        <p class="role">${it.role}</p>
        <p class="card-name">${CARDS[it.n].roman} · ${CARDS[it.n].name}</p>
        <p class="keywords">${CARDS[it.n].keywords}</p>
        <p>${CARDS[it.n].meaning}</p>
        <p class="hint">${it.text}</p>
        ${it.year ? `<div class="year-step" role="group" aria-label="Yıl seç">
          <button type="button" data-year="-1" aria-label="Önceki yıl">‹</button>
          <output aria-live="polite">${single.year}</output>
          <button type="button" data-year="1" aria-label="Sonraki yıl">›</button>
        </div>` : ''}
      </div>
    </article>`).join('') + (single.date ? '' : `<p class="hint">Yıl kartın için doğum tarihini girerek kendi melodini oluştur.</p>`);
}

$('#r-kartlar').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-year]');
  if (!btn) return;
  single.year += Number(btn.dataset.year);
  renderTarot();
  $(`#r-kartlar [data-year="${btn.dataset.year}"]`)?.focus();
});

// --- Paylaşım ---

function singleURL() {
  const q = new URLSearchParams({ ad: single.profile.name });
  if (single.date && $('#tarih-linke').checked) q.set('tarih', single.date);
  else {
    q.set('yy', single.profile.lifePath);
    q.set('tk', single.pn);
  }
  return `${location.origin}${location.pathname}?${q}#sonuc`;
}

async function copyLink(url, statusEl) {
  try {
    await navigator.clipboard.writeText(url);
    statusEl.textContent = 'Link kopyalandı.';
  } catch {
    statusEl.textContent = url;
  }
}

$('#kopyala-tek').addEventListener('click', () => copyLink(singleURL(), $('#durum-tek')));
if (navigator.share) {
  $('#paylas-tek').hidden = false;
  $('#paylas-tek').addEventListener('click', () => {
    navigator.share({ title: 'İsmin Melodisi', text: `${single.profile.name} adının melodisi`, url: singleURL() }).catch(() => {});
  });
}

// --- PNG kart (1080×1350, 4:5) ---

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

async function exportPNG() {
  const { profile, grid, melody, pn } = single;
  $('#durum-tek').textContent = 'Kart hazırlanıyor…';
  await document.fonts.ready;
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');

  x.fillStyle = '#f3ece0';
  x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, W);
  glow.addColorStop(0, 'rgba(255,255,255,.55)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = glow;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = '#b8913f';
  x.lineWidth = 3;
  x.strokeRect(28, 28, W - 56, H - 56);
  x.lineWidth = 1;
  x.strokeRect(40, 40, W - 80, H - 80);

  x.fillStyle = '#1e1b18';
  x.textBaseline = 'alphabetic';
  x.font = '600 76px "Cormorant Garamond", serif';
  const title = profile.name.toLocaleUpperCase('tr-TR');
  let size = 76;
  while (x.measureText(title).width > 640 && size > 40) {
    size -= 4;
    x.font = `600 ${size}px "Cormorant Garamond", serif`;
  }
  x.fillText(title, 90, 150);
  x.fillStyle = '#8a5a1c';
  x.font = '600 62px Caveat, cursive';
  x.textAlign = 'right';
  x.fillText(profile.theme.word, W - 90, 150);
  x.textAlign = 'left';
  x.fillStyle = 'rgba(30,27,24,.25)';
  x.fillRect(90, 176, W - 180, 2);

  drawKilim(x, grid, 90, 200, W - 180, 640);

  const nums = [
    [profile.lifePath, 'Yaşam yolu', melody.mode.name],
    [profile.expression, 'Kader', 'tüm harfler'],
    [profile.soulUrge || '–', 'Ruh', 'sesliler'],
    [profile.personality || '–', 'Kişilik', 'sessizler'],
  ];
  const colW = (W - 180) / 4;
  x.textAlign = 'center';
  nums.forEach(([n, label, hint], i) => {
    const cx = 90 + colW * (i + 0.5);
    x.fillStyle = '#1e1b18';
    x.font = '600 84px "Cormorant Garamond", serif';
    x.fillText(String(n), cx, 940);
    x.font = '600 28px "EB Garamond", serif';
    x.fillText(label, cx, 992);
    x.fillStyle = '#5a5148';
    x.font = '34px Caveat, cursive';
    x.fillText(hint, cx, 1028);
  });

  x.textAlign = 'left';
  x.fillStyle = '#2b2622';
  x.font = '30px "EB Garamond", serif';
  wrapText(x, profile.theme.text, W - 180).slice(0, 4).forEach((line, i) => x.fillText(line, 90, 1090 + i * 40));

  const card = CARDS[cardIndex(pn)];
  x.fillStyle = '#5a5148';
  x.font = '24px "EB Garamond", serif';
  x.fillText(`Tarot: ${card.roman} ${card.name} · ${melody.mode.name} makamı`, 90, H - 82);
  x.textAlign = 'right';
  x.font = '30px Caveat, cursive';
  x.fillText(DISCLAIMER, W - 90, H - 82);

  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ismin-melodisi-${profile.name.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  $('#durum-tek').textContent = 'Kart indirildi.';
}
$('#png-tek').addEventListener('click', () => exportPNG().catch(() => { $('#durum-tek').textContent = 'Kart hazırlanamadı.'; }));

// ---------------------------------------------------------------------------
// Uyum: iki ad, birleşik halı, düet, ilişki kartı
// ---------------------------------------------------------------------------

const pair = { view: new KilimView($('#u-kilim')), a: null, b: null, srcA: null, srcB: null, tracks: null, drone: null };
new ResizeObserver(() => pair.view.resize()).observe($('#u-kilim'));
$('#cal-uyum').dataset.playLabel = 'Düeti çal';

function showPair(a, srcA, b, srcB, { scroll = true } = {}) {
  stopPlayback();
  Object.assign(pair, { a, b, srcA, srcB });

  // Sırayla: önce A, sonra B (A'nın kararında); sonra birlikte, B A'nın makamı ve usulünde
  const mA = buildMelody(a);
  const mB = buildMelody(b, { tonic: mA.tonic });
  const mB2 = buildMelody(b, { tonic: mA.tonic, mode: mA.mode, usul: mA.usul, bpm: mA.bpm, percussion: false });
  const together = mA.duration + mB.duration;
  pair.tracks = [
    { id: 'a', melody: mA, offset: 0 },
    { id: 'b', melody: mB, offset: mA.duration },
    { id: 'a', melody: mA, offset: together },
    { id: 'b', melody: mB2, offset: together, volume: 0.75 },
  ];
  pair.drone = mA.drone;

  const grid = buildKilim(a, b);
  const compat = compatibility(a, b);
  const rel = relationshipNumber(srcA.pn, srcB.pn);
  const card = CARDS[cardIndex(rel)];

  $('#u-adlar').textContent = `${a.name} & ${b.name}`;
  $('#u-baslik').textContent = compat.title;
  $('#u-yorum').textContent = compat.text;
  $('#u-sayilar').innerHTML = [a, b].map((p, i) => {
    const pn = i ? srcB.pn : srcA.pn;
    return `<p><b>${escapeHTML(p.name)}</b>: yaşam yolu ${p.lifePath} (${p.theme.word}), kader ${p.expression}, ruh ${p.soulUrge || '–'}, kişilik ${p.personality || '–'} · ${CARDS[cardIndex(pn)].name}</p>`;
  }).join('');
  $('#u-muzik').textContent =
    `${a.name}: ${mA.mode.name} · ${b.name}: ${mB.mode.name} · birlikte ${mA.mode.name} makamında, ${mA.usul.name} usulünde · ${Math.round(together + Math.max(mA.duration, mB2.duration))} sn`;
  renderLetters($('#u-harfler-a'), a, a.name.split(' ')[0]);
  renderLetters($('#u-harfler-b'), b, b.name.split(' ')[0]);
  $('#u-kilim').setAttribute('aria-label', `${a.name} ve ${b.name} adlarından birlikte dokunan halı.`);
  pair.relN = cardIndex(rel);
  renderPairCard();
  $('#durum-uyum').textContent = '';

  $('#uyum-sonuc').hidden = false;
  pair.view.setGrid(grid);
  if (scroll) scrollToEl($('#uyum-sonuc'));
}

function renderPairCard() {
  if (pair.relN === undefined) return;
  const card = CARDS[pair.relN];
  $('#u-kart').innerHTML = cardArt(pair.relN, 'u');
  $('#u-kart-ad').textContent = `${card.roman} · ${card.name}`;
  $('#u-kart-anahtar').textContent = card.keywords;
  $('#u-kart-yorum').textContent = card.love;
}

$('#form-uyum').addEventListener('submit', (e) => {
  e.preventDefault();
  const errors = [];
  const p1 = readPerson($('#ad1'), $('#tarih1'), errors);
  const p2 = readPerson($('#ad2'), $('#tarih2'), errors);
  $('#hata-uyum').textContent = [...new Set(errors)].join(' ');
  if (!p1 || !p2) return;
  showPair(
    computeProfile(p1.name, { date: p1.date }), { date: p1.date, pn: personalityNumber(p1.date) },
    computeProfile(p2.name, { date: p2.date }), { date: p2.date, pn: personalityNumber(p2.date) },
  );
});

$('#cal-uyum').addEventListener('click', () => {
  if (session?.button === $('#cal-uyum')) return stopPlayback();
  if (!pair.tracks) return;
  startPlayback({
    button: $('#cal-uyum'),
    view: pair.view,
    rows: [{ track: 'a', el: $('#u-harfler-a') }, { track: 'b', el: $('#u-harfler-b') }],
    sectionEl: $('#u-bolum'),
    names: { a: pair.a.name.split(' ')[0], b: pair.b.name.split(' ')[0] },
    tracks: pair.tracks,
    drone: pair.drone,
    loop: () => false,
  });
});

$('#kopyala-uyum').addEventListener('click', () => {
  const q = new URLSearchParams({
    ad: pair.a.name, yy: pair.a.lifePath, tk: pair.srcA.pn,
    ad2: pair.b.name, yy2: pair.b.lifePath, tk2: pair.srcB.pn,
  });
  copyLink(`${location.origin}${location.pathname}?${q}#uyum`, $('#durum-uyum'));
});

// ---------------------------------------------------------------------------
// Kart rehberi ve deste seçimi
// ---------------------------------------------------------------------------

function renderGuide() {
  $('#rehber-kartlar').innerHTML = CARDS.map((card, i) => `
    <li><button type="button" data-card="${i}" aria-label="${card.roman} ${card.name}: anlamını aç">${cardArt(i, 'g')}</button></li>`).join('');
}

const dialog = $('#kart-penceresi');
let dialogCard = null;
function openCard(n) {
  dialogCard = n;
  const card = CARDS[n];
  $('#kp-resim').innerHTML = cardArt(n, 'kp');
  $('#kp-numara').textContent = `Büyük Arkana ${card.roman}`;
  $('#kp-ad').textContent = card.name;
  $('#kp-anahtar').textContent = card.keywords;
  $('#kp-anlam').textContent = card.meaning;
  $('#kp-iliski').textContent = card.love;
  if (!dialog.open) dialog.showModal();
}
$('#rehber-kartlar').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-card]');
  if (btn) openCard(Number(btn.dataset.card));
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close(); // pencerenin dışına tıklayınca kapanır
});

function setDeck(next) {
  deck = next;
  store('deste', deck);
  $$('.deck-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deck === deck)));
  renderTarot();
  renderPairCard();
  renderGuide();
  if (dialog.open && dialogCard !== null) $('#kp-resim').innerHTML = cardArt(dialogCard, 'kp');
}
$$('.deck-switch button').forEach((b) => b.addEventListener('click', () => setDeck(b.dataset.deck)));
setDeck(deck);

// ---------------------------------------------------------------------------
// Paylaşım linkinden açılış: ?ad=…&tarih=… ya da ?ad=…&yy=…&tk=…
// ---------------------------------------------------------------------------

function sourceFrom(q, suffix = '') {
  const date = q.get('tarih' + suffix);
  if (date && parseDate(date) && date <= today) return { date, pn: personalityNumber(date) };
  const yy = q.get('yy' + suffix);
  const tk = Number(q.get('tk' + suffix));
  if (isValidNumber(yy) && Number.isInteger(tk) && tk >= 1 && tk <= 22) return { lifePath: Number(yy), pn: tk };
  return null;
}

function profileFrom(name, src) {
  if (!name || !/\p{L}/u.test(name) || !src) return null;
  try {
    return computeProfile(name.slice(0, 40), src.date ? { date: src.date } : { lifePath: src.lifePath });
  } catch {
    return null;
  }
}

function openFromURL() {
  const q = new URLSearchParams(location.search);
  const srcA = sourceFrom(q);
  const a = profileFrom(q.get('ad'), srcA);
  if (!a) return;
  if (q.has('ad2')) {
    const srcB = sourceFrom(q, '2');
    const b = profileFrom(q.get('ad2'), srcB);
    if (!b) return;
    $('#ad1').value = a.name;
    $('#ad2').value = b.name;
    if (srcA.date) $('#tarih1').value = srcA.date;
    if (srcB.date) $('#tarih2').value = srcB.date;
    showPair(a, srcA, b, srcB, { scroll: false });
    requestAnimationFrame(() => scrollToEl($('#uyum')));
    return;
  }
  $('#ad').value = a.name;
  if (srcA.date) $('#tarih').value = srcA.date;
  updatePreview();
  showSingle(a, { date: srcA.date ?? null, pn: srcA.pn }, { scroll: false });
  requestAnimationFrame(() => scrollToEl($('#sonuc')));
}
openFromURL();

// ---------------------------------------------------------------------------
// Bölümler görünür olunca parçaları sırayla yükselir (hareket kapalıysa hiç gizlenmez)
// ---------------------------------------------------------------------------

if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  const groups = [
    ['.hero', ['.hero-hand', 'h1', '.lede', '.ask', '.note', '.hero-loom']],
    ['#uyum', ['.duo-intro h2', '.duo-intro .lede', '.duo-form']],
    ['#rehber', ['.tarot-head', '.guide-grid']],
    ['.foot', ['.foot-name', 'p:not(.foot-name)']],
  ];
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      $$('.rise', en.target).forEach((el) => el.classList.add('in'));
      io.unobserve(en.target);
    }
  }, { threshold: 0.12 });
  for (const [root, parts] of groups) {
    const rootEl = $(root);
    if (!rootEl) continue;
    let i = 0;
    for (const sel of parts) {
      $$(sel, rootEl).forEach((el) => {
        el.classList.add('rise');
        el.style.setProperty('--delay', `${i++ * 75}ms`);
      });
    }
    io.observe(rootEl);
  }
}
