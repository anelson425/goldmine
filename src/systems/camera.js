import { TILE_SIZE, VIEWPORT_COLS, VIEWPORT_ROWS, WORLD_COLS } from '../constants.js';

export class Camera {
  constructor() {
    this.x = 0;   // world pixel offset
    this.y = 0;
    this.shakeTimer     = 0;
    this.shakeIntensity = 0;
    this._nudgeX = 0;   // one-frame pixel offset, cleared each update()
    this._nudgeY = 0;
  }

  /** Follow player; centres viewport on them. */
  follow(player) {
    const targetX = player.px - (VIEWPORT_COLS / 2) * TILE_SIZE;
    const targetY = player.py - (VIEWPORT_ROWS / 2) * TILE_SIZE;

    // Clamp X so we don't show outside the world width
    const maxX = (WORLD_COLS * TILE_SIZE) - (VIEWPORT_COLS * TILE_SIZE);
    this.x = Math.max(0, Math.min(maxX, targetX));
    this.y = Math.max(0, targetY);
  }

  shake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeTimer     = duration;
  }

  nudge(dx, dy) {
    this._nudgeX = dx;
    this._nudgeY = dy;
  }

  update(delta) {
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - delta);
      if (this.shakeTimer === 0) this.shakeIntensity = 0;
    }
  }

  /** Returns current shake offset {dx, dy}. */
  get shakeOffset() {
    if (this.shakeTimer <= 0) return { dx: 0, dy: 0 };
    const i = this.shakeIntensity;
    return {
      dx: (Math.random() * 2 - 1) * i,
      dy: (Math.random() * 2 - 1) * i,
    };
  }

  /** Convert world pixel coords to screen pixel coords. */
  worldToScreen(wx, wy) {
    const { dx, dy } = this.shakeOffset;
    return {
      sx: wx - this.x + dx + this._nudgeX,
      sy: wy - this.y + dy + this._nudgeY,
    };
  }

  /** First visible tile column. */
  get startCol() { return Math.floor(this.x / TILE_SIZE); }
  get startRow() { return Math.floor(this.y / TILE_SIZE); }
  get endCol()   { return this.startCol + VIEWPORT_COLS + 1; }
  get endRow()   { return this.startRow + VIEWPORT_ROWS + 1; }
}
