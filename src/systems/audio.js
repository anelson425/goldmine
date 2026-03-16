/**
 * Audio system.
 * Plays sound effects using the Web Audio API.
 * Synthesises simple sounds so no audio files are needed to start.
 */
// A-minor pentatonic: A2 C3 D3 E3 G3 A3 C4 D4
const SCALE = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66];

// 16-beat melody (index into SCALE, beat offset, duration in beats)
const MELODY = [
  {i:3, b:0,    d:0.9}, {i:2, b:1,    d:0.45}, {i:1, b:1.5,  d:0.45},
  {i:0, b:2,    d:1.7},
  {i:1, b:4,    d:0.45},{i:2, b:4.5,  d:0.45}, {i:3, b:5,    d:0.8},
  {i:4, b:6,    d:0.8}, {i:5, b:7,    d:1.5},
  {i:4, b:9,    d:0.8}, {i:3, b:10,   d:0.45},{i:2, b:10.5, d:0.45},
  {i:1, b:11,   d:1.7},
  {i:2, b:13,   d:0.45},{i:3, b:13.5, d:0.45},{i:2, b:14,   d:0.8},
  {i:1, b:15,   d:0.8}, {i:0, b:16,   d:2.0},
];

// Bass: sustained low notes (freq in Hz, beat offset, duration in beats)
const BASS = [
  {f:55,    b:0,  d:3.5},
  {f:55,    b:4,  d:3.5},
  {f:65.41, b:8,  d:3.5},
  {f:55,    b:12, d:4.5},
];

const LOOP_BEATS = 18; // total pattern length before repeat

export class Audio {
  constructor() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this._ctx = null;
    }
    this.muted        = false;
    this._musicOn     = false;
    this._musicGain   = null;
    this._musicNext   = 0;
    this._musicTimer  = null;
  }

  _resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      return this._ctx.resume().catch(() => {});
    }
    return Promise.resolve();
  }

  _beep({ freq = 440, type = 'square', duration = 0.08, volume = 0.15, decay = 0.08 } = {}) {
    if (this.muted || !this._ctx) return;
    this._resume();
    const osc  = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, this._ctx.currentTime);
    gain.gain.setValueAtTime(volume, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration + decay);
    osc.start(this._ctx.currentTime);
    osc.stop(this._ctx.currentTime + duration + decay + 0.01);
  }

  dig() {
    if (this.muted || !this._ctx) return;
    this._resume();
    const ctx = this._ctx;
    // Short white-noise burst through a bandpass — sounds like a dull earth impact
    const len    = Math.floor(ctx.sampleRate * 0.04);
    const buf    = ctx.createBuffer(1, len, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    const filter = ctx.createBiquadFilter();
    filter.type  = 'bandpass';
    filter.frequency.value = 250;
    filter.Q.value = 1.2;
    const gain   = ctx.createGain();
    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + 0.08);
  }
  gold()  { this._beep({ freq: 660, type: 'sine',     duration: 0.15, volume: 0.2, decay: 0.2 }); }
  hurt()  { this._beep({ freq: 220, type: 'square',   duration: 0.12, volume: 0.25 }); }
  death() { this._beep({ freq: 110, type: 'sawtooth', duration: 0.5,  volume: 0.3, decay: 0.4 }); }
  buy()   { this._beep({ freq: 880, type: 'sine',     duration: 0.1,  volume: 0.2, decay: 0.15 }); }
  npc()   { this._beep({ freq: 500, type: 'sine',     duration: 0.2,  volume: 0.18, decay: 0.1 }); }
  bomb()  {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this._beep({ freq: 80 + i*30, type: 'sawtooth', duration: 0.15, volume: 0.3 }), i * 60);
    }
  }

  // ── Background music ────────────────────────────────────────────────────

  startMusic() {
    if (!this._ctx || this._musicOn) return;
    this._musicOn   = true;
    this._musicGain = this._ctx.createGain();
    this._musicGain.gain.setValueAtTime(0, this._ctx.currentTime);
    this._musicGain.connect(this._ctx.destination);
    this._resume().then(() => {
      if (!this._musicOn) return;
      this._musicGain.gain.linearRampToValueAtTime(0.13, this._ctx.currentTime + 3);
      this._musicNext = this._ctx.currentTime + 0.1;
      this._musicLoop();
    });
  }

  stopMusic() {
    if (!this._musicOn) return;
    this._musicOn = false;
    clearTimeout(this._musicTimer);
    if (this._musicGain) {
      this._musicGain.gain.setTargetAtTime(0, this._ctx.currentTime, 0.8);
    }
  }

  toggleMusic() {
    this._musicOn ? this.stopMusic() : this.startMusic();
  }

  _musicNote(freq, start, dur, vol, type = 'triangle') {
    if (!this._musicGain) return;
    const ctx = this._ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(this._musicGain);
    const attack = Math.min(0.05, dur * 0.1);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.88);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  _musicLoop() {
    if (!this._musicOn) return;
    const BPM = 78;
    const B   = 60 / BPM;
    const t0  = this._musicNext;

    for (const { i, b, d } of MELODY) {
      this._musicNote(SCALE[i], t0 + b * B, d * B, 0.048, 'triangle');
    }
    for (const { f, b, d } of BASS) {
      this._musicNote(f, t0 + b * B, d * B, 0.065, 'sine');
    }

    this._musicNext = t0 + LOOP_BEATS * B;
    this._musicTimer = setTimeout(
      () => this._musicLoop(),
      (LOOP_BEATS * B - 0.6) * 1000,
    );
  }
}
