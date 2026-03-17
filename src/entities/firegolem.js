import { TILE_SIZE, TILE } from '../constants.js';

const _img = new Image();
let _imgReady = false;
_img.onload = () => { _imgReady = true; };
_img.src = 'assets/fire_golem.png';

const MAX_HP       = 40;
const DAMAGE       = 50;
const ATTACK_CD    = 3.0;   // seconds between attacks
const WINDUP_TIME  = 1.2;   // telegraph duration
const LAVA_REACH   = 3;     // tiles in each cardinal direction
const AGGRO_RANGE  = 8;     // tiles from centre before attacking

export class FireGolem {
  constructor(col, row) {
    this.col      = col;
    this.row      = row;
    this.type     = 'firegolem';
    this.hp       = MAX_HP;
    this.maxHp    = MAX_HP;
    this.dead     = false;
    this.drop     = 500;
    this._attackTimer = ATTACK_CD;
    this._windup      = 0;
    this._phase       = 0;
  }

  /** Returns true if (col, row) is inside this golem's 4×4 footprint. */
  occupiesTile(col, row) {
    return col >= this.col && col < this.col + 4 &&
           row >= this.row && row < this.row + 4;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.dead = true;
  }

  update(delta, world, player) {
    if (this.dead) return;
    this._phase += delta;

    // Wind-up countdown
    if (this._windup > 0) {
      this._windup = Math.max(0, this._windup - delta);
      if (this._windup === 0) {
        // Release: damage player if in range, scatter lava in a cross
        const cx = this.col + 2;
        const cy = this.row + 2;
        if (Math.abs(player.col - cx) <= AGGRO_RANGE &&
            Math.abs(player.row - cy) <= AGGRO_RANGE) {
          player.takeDamage(DAMAGE);
        }
        for (let i = 1; i <= LAVA_REACH; i++) {
          world.setTile(cx - i, cy,     TILE.LAVA);
          world.setTile(cx + i, cy,     TILE.LAVA);
          world.setTile(cx,     cy - i, TILE.LAVA);
          world.setTile(cx,     cy + i, TILE.LAVA);
        }
      }
      return;
    }

    // Attack cooldown
    this._attackTimer -= delta;
    if (this._attackTimer <= 0) {
      this._attackTimer = ATTACK_CD;
      const cx = this.col + 2;
      const cy = this.row + 2;
      if (Math.abs(player.col - cx) <= AGGRO_RANGE &&
          Math.abs(player.row - cy) <= AGGRO_RANGE) {
        this._windup = WINDUP_TIME;
      }
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const T = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(this.col * T, this.row * T);

    const flash = this._windup > 0 && Math.sin(this._windup * 15) > 0;

    ctx.save();
    if (flash) ctx.globalAlpha = 0.7;
    ctx.imageSmoothingEnabled = false;
    if (_imgReady) {
      ctx.drawImage(_img, sx, sy, T * 4, T * 4);
    } else {
      // Fallback color rect
      ctx.fillStyle = flash ? '#ff5722' : '#bf360c';
      ctx.fillRect(sx + 4, sy + 4, T * 4 - 8, T * 4 - 8);
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(sx + T,          sy + T, 20, 20);
      ctx.fillRect(sx + T * 2 + 20, sy + T, 20, 20);
    }
    ctx.restore();

    // Expanding fire ring during windup
    if (this._windup > 0) {
      const progress = 1 - (this._windup / WINDUP_TIME);
      const radius   = T * 5 * progress;
      ctx.strokeStyle = `rgba(255,100,0,${0.9 - progress * 0.7})`;
      ctx.lineWidth   = 5;
      ctx.beginPath();
      ctx.arc(sx + T * 2, sy + T * 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HP bar (wide, above the boss)
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = '#111';
    ctx.fillRect(sx, sy - 14, T * 4, 8);
    ctx.fillStyle = pct > 0.5 ? '#e53935' : pct > 0.25 ? '#ff6d00' : '#ffd600';
    ctx.fillRect(sx, sy - 14, T * 4 * pct, 8);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy - 14, T * 4, 8);

    // Boss name
    ctx.fillStyle = '#ffcc02';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FIRE GOLEM', sx + T * 2, sy - 18);
    ctx.textAlign = 'left';
  }
}
