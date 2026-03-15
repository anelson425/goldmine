import { TILE_SIZE } from '../constants.js';

const BOONS = [
  { label: 'Full HP restored!',     apply: (p) => { p.hp = p.maxHp; } },
  { label: 'Oxygen refilled!',      apply: (p) => { p.refillOxygen(); } },
  { label: 'Ghost mode! (10s)',      apply: (p) => { p.ghostMode = 10; } },
  { label: '+30 Gold bonus!',        apply: (p, s) => { s.addRunGold(30); } },
];

export class Wizard {
  constructor(col, row) {
    this.col      = col;
    this.row      = row;
    this.type     = 'wizard';
    this.dead     = false;
    this.used     = false;
    this._phase   = 0;
    this._message = null;
    this._msgTimer= 0;
  }

  interact(player, scoring, audio) {
    if (this.used) return;
    this.used = true;
    const boon = BOONS[Math.floor(Math.random() * BOONS.length)];
    boon.apply(player, scoring);
    this._message  = boon.label;
    this._msgTimer = 3;
    audio?.npc();
  }

  update(delta) {
    this._phase += delta;
    if (this._msgTimer > 0) this._msgTimer = Math.max(0, this._msgTimer - delta);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const T = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(this.col * T, this.row * T);

    // Robe
    ctx.fillStyle = this.used ? '#555' : '#7c4dff';
    ctx.fillRect(sx + 8, sy + 10, T - 16, T - 12);
    // Hat
    ctx.fillStyle = this.used ? '#444' : '#4527a0';
    ctx.beginPath();
    ctx.moveTo(sx + T/2, sy);
    ctx.lineTo(sx + 8,   sy + 14);
    ctx.lineTo(sx + T-8, sy + 14);
    ctx.closePath();
    ctx.fill();
    // Face
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(sx + 12, sy + 10, T - 24, 10);
    // Stars (animated)
    if (!this.used) {
      ctx.fillStyle = '#ffe57f';
      const s = Math.sin(this._phase * 3);
      ctx.fillRect(sx + 4 + s*2, sy + 4, 5, 5);
      ctx.fillRect(sx + T-10 - s*2, sy + 16, 4, 4);
    }

    // Message bubble
    if (this._msgTimer > 0 && this._message) {
      const alpha = Math.min(1, this._msgTimer);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = 'rgba(0,0,0,0.7)';
      ctx.fillRect(sx - 40, sy - 26, 120, 20);
      ctx.fillStyle = '#ffe57f';
      ctx.font      = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this._message, sx + T/2, sy - 11);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    // Interact hint
    if (!this.used) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font      = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E]', sx + T/2, sy + T + 12);
      ctx.textAlign = 'left';
    }
  }
}
