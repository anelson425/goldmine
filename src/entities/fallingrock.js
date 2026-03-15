import { TILE_SIZE, TILE } from '../constants.js';

export class FallingRock {
  constructor(col, row) {
    this.col   = col;
    this.row   = row;
    this.type  = 'fallingrock';
    this.dead  = false;
    this._timer = 0;
  }

  update(delta, world, player, camera) {
    if (this.dead) return;
    this._timer += delta;
    if (this._timer < 0.4) return;
    this._timer = 0;

    const below = world.getTile(this.col, this.row + 1);
    if (below === TILE.EMPTY) {
      this.row += 1;
      // Damage player if landed on them
      if (this.col === player.col && this.row === player.row) {
        player.takeDamage(35);
        camera?.shake(8, 0.3);
        this.dead = true;
        return;
      }
    } else {
      // Came to rest — leave a stone tile and remove entity
      world.setTile(this.col, this.row, TILE.STONE);
      this.dead = true;
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const T = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(this.col * T, this.row * T);
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 2, sy + 2, T - 4, T - 4);
  }
}
