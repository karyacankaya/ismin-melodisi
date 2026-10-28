// İsmin Melodisi — ses motoru (Web Audio API)
// Çalgılar dosyasız, tamamen sentezle üretilir:
//  - Kanun: Karplus-Strong tel sesi, gerçek kanundaki gibi çift tel (hafif akortsuz),
//    uzun notalarda tremolo (mızrapla hızlı tekrar)
//  - Ney: yumuşak osilatör + sonradan açılan vibrato + filtreli nefes gürültüsü
//  - Ud bası: koyu, uzun sönen tel
//  - Def: düm (pes, perdesi düşen gövde sesi) ve tek/ke (tiz, kısa deri sesi)
//  - Dem: karar + beşli, altta sürekli
//  - Yankı: kodla üretilmiş salon yankısı (ConvolverNode)
// AudioContext ancak play() çağrılınca (yani "Çal" düğmesine basılınca) kurulur.

import { createRng } from './numerology.js';

const LOOKAHEAD = 1.0; // bir sonraki turu bu kadar saniye önceden zamanla
const TICK_MS = 100;

// Her çalgının sağ-sol konumu ve yankıya gönderilen payı
const MIX = {
  kanun: { pan: -0.18, wet: 0.32 },
  ney: { pan: 0.28, wet: 0.5 },
  bass: { pan: 0.05, wet: 0.18 },
  perc: { pan: 0.1, wet: 0.22 },
  drone: { pan: 0, wet: 0.35 },
};

export class NamePlayer {
  constructor() {
    this.ctx = null;
    this.cache = new Map();
    this.voices = new Set();
    this.timeline = [];
    this.sections = [];
    this.playing = false;
    this.timer = null;
    this.onEnd = null;
  }

  setup() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    this.master.connect(comp).connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(2.8, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.9;
    this.reverb.connect(wet).connect(this.master);

    this.buses = {};
    for (const [name, { pan, wet: send }] of Object.entries(MIX)) {
      const input = ctx.createGain();
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      const sendGain = ctx.createGain();
      sendGain.gain.value = send;
      input.connect(panner).connect(this.master);
      panner.connect(sendGain).connect(this.reverb);
      this.buses[name] = input;
    }

    // Kanunun tahta gövdesi: hafif bir rezonans
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 1100;
    body.Q.value = 1.1;
    body.gain.value = 3.5;
    body.connect(this.buses.kanun);
    this.kanunIn = body;

    this.noise = this.noiseBuffer(1.5);
  }

  /** Salon yankısı: üstel sönen, iki kanallı, tohumlu gürültü. */
  impulse(seconds, decay) {
    const sr = this.ctx.sampleRate;
    const len = Math.round(sr * seconds);
    const buf = this.ctx.createBuffer(2, len, sr);
    const rng = createRng(7);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (rng() * 2 - 1) * Math.pow(1 - t, decay) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
      }
    }
    return buf;
  }

  noiseBuffer(seconds) {
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.round(sr * seconds), sr);
    const d = buf.getChannelData(0);
    const rng = createRng(99);
    for (let i = 0; i < d.length; i++) d[i] = rng() * 2 - 1;
    return buf;
  }

  /**
   * Karplus-Strong tel sesi (önbellekli). t60: sesin -60 dB'e inme süresi,
   * bright: 0 (koyu, ud gibi) – 1 (parlak, kanun gibi).
   */
  pluckBuffer(freq, seconds, t60 = 1.8, bright = 0.6) {
    const key = [freq.toFixed(2), seconds.toFixed(2), t60, bright].join('|');
    const hit = this.cache.get(key);
    if (hit) return hit;
    const sr = this.ctx.sampleRate;
    const period = Math.max(2, Math.round(sr / freq));
    const length = Math.round(sr * seconds);
    const buffer = this.ctx.createBuffer(1, length, sr);
    const out = buffer.getChannelData(0);

    // Deterministik gürültü: aynı nota her zaman aynı "koparılışı" verir
    const rng = createRng(Math.round(freq * 100));
    const smooth = 1 - bright * 0.8;
    const noise = new Float32Array(period);
    let lp = 0;
    for (let i = 0; i < period; i++) {
      lp = lp * smooth + (rng() * 2 - 1) * (1 - smooth);
      noise[i] = lp;
    }
    // Mızrabın teli kenara yakın koparması: bazı harmonikler söner, tını "oyuk" olur
    const pick = Math.max(1, Math.floor(period * 0.13));
    const ring = new Float32Array(period);
    let peak = 0;
    for (let i = 0; i < period; i++) {
      ring[i] = noise[i] - 0.6 * noise[(i + pick) % period];
      peak = Math.max(peak, Math.abs(ring[i]));
    }
    const norm = peak > 0 ? 0.9 / peak : 1;
    const rho = Math.pow(0.001, 1 / (freq * t60));
    for (let n = 0; n < length; n++) {
      const i = n % period;
      const cur = ring[i];
      out[n] = cur * norm;
      ring[i] = rho * 0.5 * (cur + ring[(i + 1) % period]);
    }
    const fade = Math.min(length, Math.round(sr * 0.05));
    for (let n = 0; n < fade; n++) out[length - 1 - n] *= n / fade;

    this.cache.set(key, buffer);
    return buffer;
  }

  track(src, gain) {
    const voice = { src, gain };
    this.voices.add(voice);
    src.onended = () => {
      this.voices.delete(voice);
      gain.disconnect();
    };
  }

  /** Tek bir tel vuruşu: iki tel, birbirinden 3 cent açık. */
  pluck(freq, at, vel, dur, dest, { t60 = 1.8, bright = 0.6, courses = 2 } = {}) {
    const ring = Math.min(2.6, Math.max(0.8, dur * 2.2));
    const ringQ = Math.ceil(ring * 4) / 4; // önbellek isabeti için çeyrek saniyeye yuvarla
    for (let c = 0; c < courses; c++) {
      const f = freq * Math.pow(2, (courses === 1 ? 0 : c ? 3 : -3) / 1200);
      const src = this.ctx.createBufferSource();
      src.buffer = this.pluckBuffer(f, ringQ, t60, bright);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vel / courses, at);
      g.gain.setTargetAtTime(0, at + dur + 0.1, 0.16);
      src.connect(g).connect(dest);
      src.start(at);
      src.stop(at + ringQ);
      this.track(src, g);
    }
  }

  playKanun(ev, at) {
    if (!ev.tremolo) {
      this.pluck(ev.freq, at, ev.vel, ev.duration, this.kanunIn);
      return;
    }
    // Tremolo: ilk vuruş tam, ardından hızlı ve hafif tekrarlar
    const step = 0.085;
    this.pluck(ev.freq, at, ev.vel, step * 2, this.kanunIn);
    let i = 1;
    for (let t = at + step; t < at + ev.duration - step; t += step, i++) {
      const swell = 0.42 + 0.12 * Math.sin(i * 0.7);
      this.pluck(ev.freq, t, ev.vel * swell, step * 2, this.kanunIn, { courses: 1 });
    }
  }

  playNey(ev, at) {
    const ctx = this.ctx;
    const f = ev.freq < 300 ? ev.freq * 2 : ev.freq; // ney bir oktav üstten
    const end = at + ev.duration;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, at);
    out.gain.exponentialRampToValueAtTime(ev.vel * 0.5, at + 0.09);
    out.gain.setValueAtTime(ev.vel * 0.5, Math.max(at + 0.1, end - 0.05));
    out.gain.setTargetAtTime(0.0001, end - 0.02, 0.09);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2600;
    tone.connect(out).connect(this.buses.ney);

    // Vibrato: notanın başında düz, sonra açılır
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.2;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(9, at + Math.min(0.45, ev.duration * 0.6));
    lfo.connect(depth);

    const stopAt = end + 0.6;
    for (const [type, mult, level] of [['sine', 1, 1], ['triangle', 2, 0.18], ['sine', 3, 0.05]]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = f * mult;
      depth.connect(osc.detune);
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(tone);
      osc.start(at);
      osc.stop(stopAt);
      this.track(osc, g);
    }
    lfo.start(at);
    lfo.stop(stopAt);

    // Nefes: notanın perdesine yakın bant geçiren gürültü
    const breath = ctx.createBufferSource();
    breath.buffer = this.noise;
    breath.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = f * 1.5;
    band.Q.value = 1.4;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, at);
    bg.gain.exponentialRampToValueAtTime(0.09, at + 0.05);
    bg.gain.setTargetAtTime(0.025, at + 0.08, 0.1);
    bg.gain.setTargetAtTime(0.0001, end, 0.08);
    breath.connect(band).connect(bg).connect(out);
    breath.start(at);
    breath.stop(stopAt);
    this.track(breath, bg);
    this.track(lfo, out);
  }

  playBass(ev, at) {
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    lp.connect(this.buses.bass);
    this.pluck(ev.freq, at, ev.vel, ev.duration, lp, { t60: 2.6, bright: 0.2 });
  }

  playDrum(ev, at) {
    const ctx = this.ctx;
    if (ev.drum === 'dum') {
      // Gövde: perdesi hızla düşen sinüs
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(125, at);
      osc.frequency.exponentialRampToValueAtTime(52, at + 0.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(ev.vel, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(g).connect(this.buses.perc);
      osc.start(at);
      osc.stop(at + 0.55);
      this.track(osc, g);
    }
    // Deri: kısa, filtreli gürültü patlaması (düm'de de hafif bir "tok" için)
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = ev.drum === 'dum' ? 'lowpass' : 'bandpass';
    filter.frequency.value = ev.drum === 'dum' ? 400 : ev.drum === 'tek' ? 3200 : 4200;
    filter.Q.value = ev.drum === 'dum' ? 0.7 : 1.6;
    const g = ctx.createGain();
    const len = ev.drum === 'dum' ? 0.08 : ev.drum === 'tek' ? 0.07 : 0.045;
    const level = ev.drum === 'dum' ? ev.vel * 0.5 : ev.vel * 1.1;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    src.connect(filter).connect(g).connect(this.buses.perc);
    // her vuruş gürültünün farklı bir yerinden: tekdüze duyulmasın
    src.start(at, ((at * 7.3) % 1.2));
    src.stop(at + len + 0.02);
    this.track(src, g);
  }

  startDrone(freqs, at) {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.05, at + 2.2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    filter.connect(gain).connect(this.buses.drone);
    const types = ['triangle', 'sawtooth', 'sine'];
    this.droneOscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = types[i] ?? 'sine';
      osc.frequency.value = f;
      osc.detune.value = i === 1 ? 4 : 0; // çok hafif vuru: canlı bir dem
      const g = ctx.createGain();
      g.gain.value = i === 1 ? 0.3 : 1;
      osc.connect(g).connect(filter);
      osc.start(at);
      return osc;
    });
    this.droneGain = gain;
  }

  schedulePass(at) {
    for (const track of this.tracks) {
      const t0 = at + track.offset;
      const scale = track.volume ?? 1;
      for (const ev of track.melody.events) {
        const start = t0 + ev.start;
        const e = scale === 1 ? ev : { ...ev, vel: ev.vel * scale };
        if (ev.kind === 'drum') this.playDrum(e, start);
        else if (ev.kind !== 'rest') {
          if (ev.voice === 'ney') this.playNey(e, start);
          else if (ev.voice === 'bass') this.playBass(e, start);
          else this.playKanun(e, start);
        }
        if (ev.band >= 0 && ev.kind !== 'rest' && ev.voice !== 'ney') {
          this.timeline.push({ start, end: start + ev.duration, band: ev.band, track: track.id, char: ev.char });
        }
      }
      for (const s of track.melody.sections) {
        this.sections.push({ start: t0 + s.start, end: t0 + s.end, name: s.name, track: track.id });
      }
    }
    this.nextPass = at + this.passDuration;
  }

  /**
   * tracks: [{ id:'a'|'b', melody, offset (sn), volume? }]
   * drone: frekans listesi. loop: sonsuza dek tekrarla.
   */
  async play({ tracks, drone, loop = true, onEnd = null }) {
    this.setup();
    if (this.playing) this.stop();
    // resume() beklenmez: tarayıcı izin vermezse bile arayüz donmasın
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    this.tracks = tracks;
    this.loop = loop;
    this.onEnd = onEnd;
    this.passDuration = Math.max(...tracks.map((t) => t.offset + t.melody.duration));
    this.timeline = [];
    this.sections = [];
    this.playing = true;
    const at = this.ctx.currentTime + 0.15;
    this.startDrone(drone, at);
    this.schedulePass(at);
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    const now = this.ctx.currentTime;
    this.timeline = this.timeline.filter((e) => e.end > now - 0.5);
    this.sections = this.sections.filter((s) => s.end > now - 0.5);
    if (now < this.nextPass - LOOKAHEAD) return;
    if (this.loop) this.schedulePass(this.nextPass);
    else if (now >= this.nextPass) {
      const cb = this.onEnd;
      this.stop();
      if (cb) cb();
    }
  }

  stop() {
    if (!this.ctx) return;
    clearInterval(this.timer);
    this.timer = null;
    const now = this.ctx.currentTime;
    for (const { src, gain } of this.voices) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.03);
      try { src.stop(now + 0.2); } catch { /* zaten durmuş */ }
    }
    this.voices.clear();
    if (this.droneGain) {
      this.droneGain.gain.cancelScheduledValues(now);
      this.droneGain.gain.setTargetAtTime(0, now, 0.25);
      for (const osc of this.droneOscs) osc.stop(now + 1.2);
      this.droneGain = null;
    }
    this.timeline = [];
    this.sections = [];
    this.playing = false;
  }

  /** Şu an çalan harfler ve bölüm: kilim parlatma ve ekrandaki gösterge için. */
  active() {
    const a = new Set();
    const b = new Set();
    if (!this.playing) return { a, b, events: [], section: null, sectionTrack: null };
    const now = this.ctx.currentTime;
    const events = this.timeline.filter((e) => e.start <= now && now < e.end);
    for (const e of events) (e.track === 'b' ? b : a).add(e.band);
    const current = this.sections.filter((s) => s.start <= now && now < s.end);
    const tracks = new Set(current.map((s) => s.track));
    return {
      a, b, events,
      section: current[0]?.name ?? null,
      sectionTrack: tracks.size > 1 ? 'ab' : current[0]?.track ?? null,
    };
  }
}
