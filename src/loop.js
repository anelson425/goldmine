/**
 * Game loop driver.
 * Calls game.update(delta) and game.render() at ~60fps.
 */
export class GameLoop {
  constructor(game) {
    this.game     = game;
    this._running = false;
    this._last    = null;
    this._raf     = null;
    this._tick    = this._tick.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._last    = performance.now();
    this._raf     = requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _tick(now) {
    if (!this._running) return;
    const raw   = (now - this._last) / 1000;
    const delta = Math.min(raw, 0.1);   // cap to avoid spiral of death
    this._last  = now;

    this.game.update(delta);
    this.game.render();

    this._raf = requestAnimationFrame(this._tick);
  }
}
