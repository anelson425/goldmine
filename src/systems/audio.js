/**
 * Audio system.
 * Plays sound effects using the Web Audio API.
 * Synthesises simple sounds so no audio files are needed to start.
 */
export class Audio {
  constructor() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this._ctx = null;
    }
    this.muted = false;
  }

  _resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
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

  dig()   { this._beep({ freq: 180, type: 'sawtooth', duration: 0.06, volume: 0.1 }); }
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
}
