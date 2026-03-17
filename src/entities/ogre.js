import { TILE_SIZE, ENEMY } from '../constants.js';

const _img = new Image();
_img.src = 'assets/ogre.png';

export class Ogre {
  constructor(col, row) {
    this.col        = col;
    this.row        = row;
    this.type       = 'ogre';
    this.hp         = ENEMY.OGRE.hp;
    this.maxHp      = ENEMY.OGRE.hp;
    this.damage     = ENEMY.OGRE.damage;
    this.drop       = ENEMY.OGRE.drop;
    this.dead       = false;
    this._timer     = 0;
    this._windup    = 0;    // shockwave wind-up animation seconds
    this._windupMax = 0.6;
  }

  update(delta, world, player) {
    if (this.dead) return;

    // Wind-up animation
    if (this._windup > 0) {
      this._windup = Math.max(0, this._windup - delta);
      if (this._windup === 0) {
        // Release shockwave: damage player if within 1 tile (adjacent)
        const dx = Math.abs(player.col - this.col);
        const dy = Math.abs(player.row - this.row);
        if (dx <= 1 && dy <= 1) {
          player.takeDamage(this.damage);
        }
      }
      return;
    }

    this._timer += delta;
    if (this._timer < 1 / ENEMY.OGRE.speed) return;
    this._timer = 0;

    // Check if player is adjacent — trigger shockwave
    const dx = Math.abs(player.col - this.col);
    const dy = Math.abs(player.row - this.row);
    if (dx <= 2 && dy <= 2) {
      this._windup = this._windupMax;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const T = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(this.col * T, this.row * T);

    // Windup flash
    const flash = this._windup > 0 && Math.sin(this._windup * 20) > 0;

    if (_img.complete && _img.naturalWidth > 0) {
      ctx.save();
      if (flash) { ctx.globalAlpha = 0.6; ctx.filter = 'hue-rotate(30deg)'; }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(_img, sx, sy, T, T);
      ctx.restore();
    } else {
      ctx.fillStyle = flash ? '#ff5722' : '#5d4037';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(sx + 6, sy - 2, T - 12, 10);
      ctx.fillStyle = '#ff6f00';
      ctx.fillRect(sx + 8,  sy,    6, 6);
      ctx.fillRect(sx + 22, sy,    6, 6);
    }

    // Shockwave ring during windup
    if (this._windup > 0) {
      const progress = 1 - (this._windup / this._windupMax);
      const radius   = (T * 1.5) * progress;
      ctx.strokeStyle = `rgba(255,100,0,${1 - progress})`;
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HP bar
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx + 2, sy - 8, T - 4, 5);
    ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#e53935';
    ctx.fillRect(sx + 2, sy - 8, (T - 4) * pct, 5);
  }
}
