import { TILE_SIZE, ENEMY, TILE } from '../constants.js';

export class Goblin {
  constructor(col, row) {
    this.col    = col;
    this.row    = row;
    this.type   = 'goblin';
    this.hp     = ENEMY.GOBLIN.hp;
    this.maxHp  = ENEMY.GOBLIN.hp;
    this.damage = ENEMY.GOBLIN.damage;
    this.drop   = ENEMY.GOBLIN.drop;
    this.dead   = false;
    this._timer = 0;
  }

  update(delta, world, player) {
    if (this.dead) return;
    this._timer += delta;
    if (this._timer < 1 / ENEMY.GOBLIN.speed) return;
    this._timer = 0;

    const dx = player.col - this.col;
    const dy = player.row - this.row;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist > 4) return;  // only chase within 4 tiles

    // Move one step toward player along the axis with larger delta
    let mc = this.col, mr = this.row;
    if (Math.abs(dx) >= Math.abs(dy)) {
      mc += Math.sign(dx);
    } else {
      mr += Math.sign(dy);
    }

    // Only move into open/empty tiles
    const t = world.getTile(mc, mr);
    if (t === TILE.EMPTY || t === TILE.SURFACE || t === TILE.SKY) {
      this.col = mc;
      this.row = mr;
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
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(sx + 8, sy + 6, T - 16, T - 10);
    // Head
    ctx.fillStyle = '#388e3c';
    ctx.fillRect(sx + 10, sy + 2, T - 20, 10);
    // Eyes
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(sx + 12, sy + 4, 4, 4);
    ctx.fillRect(sx + 22, sy + 4, 4, 4);
    // HP bar
    this._drawHpBar(ctx, sx, sy, T);
  }

  _drawHpBar(ctx, sx, sy, T) {
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx + 4, sy - 6, T - 8, 4);
    ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#e53935';
    ctx.fillRect(sx + 4, sy - 6, (T - 8) * pct, 4);
  }
}
