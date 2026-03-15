import { TILE_SIZE } from '../constants.js';

const ITEMS = [
  { id: 'bomb',    label: 'Bomb (3×3 blast)',   cost: 80,  apply: (p) => { p.hasBomb = true; } },
  { id: 'rope',    label: 'Rope (surface warp)', cost: 120, apply: (p) => { p.hasRope = true; } },
  { id: 'lantern', label: 'Magic Lantern',        cost: 60,  apply: (p) => { p.hasLantern = true; } },
  { id: 'heal50',  label: 'Heal +50 HP',          cost: 100, apply: (p) => { p.heal(50); } },
];

export class Shopkeeper {
  constructor(col, row) {
    this.col      = col;
    this.row      = row;
    this.type     = 'shopkeeper';
    this.dead     = false;
    this._phase   = 0;
    this._message = null;
    this._msgTimer= 0;

    // Pick 3 random items for this shop
    const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
    this.stock = shuffled.slice(0, 3);
    this.selectedIdx = 0;
    this.open = false;
  }

  interact(player, scoring, audio) {
    this.open = !this.open;
    audio?.npc();
  }

  buy(player, scoring, audio) {
    if (!this.open) return;
    const item = this.stock[this.selectedIdx];
    if (!item) return;
    if (scoring.spend(item.cost)) {
      item.apply(player);
      this._message  = `Bought: ${item.label}`;
      this._msgTimer = 2.5;
      this.stock.splice(this.selectedIdx, 1);
      this.selectedIdx = Math.min(this.selectedIdx, this.stock.length - 1);
      audio?.buy();
    } else {
      this._message  = 'Not enough gold!';
      this._msgTimer = 1.5;
    }
  }

  navUp()   { if (this.selectedIdx > 0) this.selectedIdx--; }
  navDown() { if (this.selectedIdx < this.stock.length - 1) this.selectedIdx++; }

  update(delta) {
    this._phase += delta;
    if (this._msgTimer > 0) this._msgTimer = Math.max(0, this._msgTimer - delta);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const T = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(this.col * T, this.row * T);

    // Body
    ctx.fillStyle = '#795548';
    ctx.fillRect(sx + 6, sy + 8, T - 12, T - 10);
    // Apron
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(sx + 10, sy + 14, T - 20, T - 18);
    // Head
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(sx + 10, sy + 2, T - 20, 12);
    // Hat
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(sx + 8, sy, T - 16, 6);

    // [E] hint
    ctx.fillStyle = 'rgba(255,220,80,0.8)';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.open ? '[E] close' : '[E] shop', sx + T/2, sy + T + 12);
    ctx.textAlign = 'left';

    // Shop UI
    if (this.open) {
      const panelX = sx - 80;
      const panelY = sy - 20;
      ctx.fillStyle = 'rgba(30,20,10,0.92)';
      ctx.fillRect(panelX, panelY, 200, 16 + this.stock.length * 20 + 10);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('Secret Shop', panelX + 8, panelY + 14);
      this.stock.forEach((item, i) => {
        const y = panelY + 28 + i * 20;
        ctx.fillStyle = i === this.selectedIdx ? '#ffe57f' : '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(`${i === this.selectedIdx ? '>' : ' '} ${item.label}  (${item.cost}g)`, panelX + 8, y);
      });
      if (this.stock.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText('Sold out!', panelX + 8, panelY + 30);
      }
    }

    // Message
    if (this._msgTimer > 0 && this._message) {
      ctx.globalAlpha = Math.min(1, this._msgTimer);
      ctx.fillStyle   = 'rgba(0,0,0,0.7)';
      ctx.fillRect(sx - 50, sy - 26, 140, 20);
      ctx.fillStyle = '#ffe57f';
      ctx.font      = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this._message, sx + T/2, sy - 12);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  }
}
