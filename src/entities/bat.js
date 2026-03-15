import { TILE_SIZE, ENEMY } from '../constants.js';

export class Bat {
  constructor(col, row) {
    this.col    = col;
    this.row    = row;
    this.type   = 'bat';
    this.hp     = ENEMY.BAT.hp;
    this.maxHp  = ENEMY.BAT.hp;
    this.damage = ENEMY.BAT.damage;
    this.drop   = ENEMY.BAT.drop;
    this.dead   = false;

    this._dir   = Math.random() < 0.5 ? -1 : 1;
    this._timer = 0;
    this._startCol = col;
  }

  update(delta, world, player) {
    if (this.dead) return;
    this._timer += delta;
    if (this._timer < 0.8) return;
    this._timer = 0;

    // Wander 2 tiles left/right from start
    const nextCol = this.col + this._dir;
    if (Math.abs(nextCol - this._startCol) > 2 || world.getTile(nextCol, this.row) !== 0) {
      this._dir *= -1;
    } else {
      this.col = nextCol;
    }

    // Damage player on contact
    if (this.col === player.col && this.row === player.row) {
      player.takeDamage(this.damage);
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
    ctx.fillStyle = '#6a0dad';
    // Wings
    ctx.fillRect(sx + 2,  sy + 10, 14, 8);
    ctx.fillRect(sx + T-16, sy + 10, 14, 8);
    // Body
    ctx.fillStyle = '#3d0070';
    ctx.fillRect(sx + 12, sy + 8, 16, 14);
    // Eyes
    ctx.fillStyle = '#ff0';
    ctx.fillRect(sx + 14, sy + 12, 4, 4);
    ctx.fillRect(sx + 22, sy + 12, 4, 4);
  }
}
