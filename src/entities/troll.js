import { TILE_SIZE, ENEMY, TILE } from '../constants.js';

export class Troll {
  constructor(col, row) {
    this.col       = col;
    this.row       = row;
    this.type      = 'troll';
    this.hp        = ENEMY.TROLL.hp;
    this.maxHp     = ENEMY.TROLL.hp;
    this.damage    = ENEMY.TROLL.damage;
    this.drop      = ENEMY.TROLL.drop;
    this.dead      = false;
    this._dir      = 1;
    this._timer    = 0;
    this._startCol = col;
  }

  update(delta, world, player) {
    if (this.dead) return;
    this._timer += delta;
    if (this._timer < 1 / ENEMY.TROLL.speed) return;
    this._timer = 0;

    // Patrol ±4 tiles from start column
    const nextCol = this.col + this._dir;
    const t = world.getTile(nextCol, this.row);
    if (Math.abs(nextCol - this._startCol) > 4 || (t !== TILE.EMPTY && t !== TILE.SURFACE)) {
      this._dir *= -1;
    } else {
      this.col = nextCol;
    }

    // Melee on contact
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
    // Large body
    ctx.fillStyle = '#795548';
    ctx.fillRect(sx + 4, sy + 4, T - 8, T - 6);
    // Head
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(sx + 8, sy, T - 16, 12);
    // Eyes
    ctx.fillStyle = '#f44336';
    ctx.fillRect(sx + 10, sy + 2, 5, 5);
    ctx.fillRect(sx + 22, sy + 2, 5, 5);
    // HP bar
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx + 2, sy - 6, T - 4, 4);
    ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#e53935';
    ctx.fillRect(sx + 2, sy - 6, (T - 4) * pct, 4);
  }
}
