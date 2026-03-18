import { TILE_SIZE } from '../constants.js';

const _img = new Image();
let _imgReady = false;
_img.onload = () => { _imgReady = true; };
_img.src = 'assets/minion.png';

export class Minion {
  constructor(col, row, hp) {
    this.col    = col;
    this.row    = row;
    this.type   = 'minion';
    this.dead   = false;
    this.hp     = hp;
    this.maxHp  = hp;
    this.drop   = 0;
    this._phase = 0;

    // Pixel position for smooth rendering
    this.px = col * TILE_SIZE;
    this.py = row * TILE_SIZE;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.dead = true;
  }

  update(delta, player) {
    if (this.dead) return;
    this._phase += delta;

    // Follow the tile the player just left
    this.col = player._prevCol;
    this.row = player._prevRow;

    // Smooth pixel lerp
    this.px += (this.col * TILE_SIZE - this.px) * Math.min(1, delta * 12);
    this.py += (this.row * TILE_SIZE - this.py) * Math.min(1, delta * 12);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const T = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(this.px, this.py);

    ctx.imageSmoothingEnabled = false;
    if (_imgReady) {
      ctx.drawImage(_img, sx, sy, T, T);
    } else {
      ctx.fillStyle = '#7c4dff';
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
    }

    // HP bar
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx + 2, sy - 6, T - 4, 4);
    ctx.fillStyle = pct > 0.5 ? '#7c4dff' : pct > 0.25 ? '#ff9800' : '#e53935';
    ctx.fillRect(sx + 2, sy - 6, (T - 4) * pct, 4);
  }
}
