/**
 * Input module.
 * Maintains a queue of input events drained each game tick.
 * Supports keyboard (WASD / arrows) and on-screen touch buttons.
 */

export class Input {
  constructor() {
    this.queue = [];          // ['up'|'down'|'left'|'right'|'interact'|'bomb'|'rope']
    this._held  = {};         // key -> ms held (for auto-repeat)
    this._bound = {};

    this._bind();
  }

  _bind() {
    const KEY_MAP = {
      ArrowUp:    'up',    w: 'up',    W: 'up',
      ArrowDown:  'down',  s: 'down',  S: 'down',
      ArrowLeft:  'left',  a: 'left',  A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
      e: 'interact', E: 'interact', Enter: 'interact',
      b: 'bomb',     B: 'bomb',
      c: 'rope',     C: 'rope',
    };

    this._bound.keydown = (e) => {
      const action = KEY_MAP[e.key];
      if (!action) return;
      e.preventDefault();
      if (!this._held[e.key]) {
        this._held[e.key] = 1;
        this.queue.push(action);
      }
    };

    this._bound.keyup = (e) => {
      delete this._held[e.key];
    };

    window.addEventListener('keydown', this._bound.keydown);
    window.addEventListener('keyup',   this._bound.keyup);
  }

  /** Drain and return one action from the queue (or null). */
  consume() {
    return this.queue.shift() ?? null;
  }

  /** Peek whether any directional input is queued. */
  hasPending() {
    return this.queue.length > 0;
  }

  destroy() {
    window.removeEventListener('keydown', this._bound.keydown);
    window.removeEventListener('keyup',   this._bound.keyup);
  }
}
