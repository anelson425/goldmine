import { TILE_SIZE } from '../constants.js';

const _img = new Image();
let _imgReady = false;
_img.onload = () => { _imgReady = true; };
_img.src = 'assets/secret_shop.png';

const ITEMS = [
  { id: 'bomb',   label: 'Bomb (5×5 blast)',    cost: 80,  apply: (p) => { p.hasBomb = true; } },
  { id: 'rope',   label: 'Rope (surface warp)',  cost: 120, apply: (p) => { p.hasRope = true; } },
  { id: 'minion', label: 'Minion (follows you)', cost: 150, apply: (p) => { p.pendingMinion = true; } },
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

  interact(_player, _scoring, audio) {
    this.open = !this.open;
    audio?.npc();
  }

  buy(player, scoring, audio) {
    const item = this.stock[this.selectedIdx];
    if (!item) return false;
    if (scoring.spendAny(item.cost)) {
      item.apply(player);
      this._message  = `Bought: ${item.label}`;
      this._msgTimer = 2.5;
      this.stock.splice(this.selectedIdx, 1);
      this.selectedIdx = Math.min(this.selectedIdx, this.stock.length - 1);
      audio?.buy();
      return true;
    } else {
      this._message  = 'Not enough gold!';
      this._msgTimer = 1.5;
      return false;
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

    if (_imgReady) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(_img, sx, sy, T * 2, T * 2);
    } else {
      ctx.fillStyle = '#795548';
      ctx.fillRect(sx + 6, sy + 8, T * 2 - 12, T * 2 - 10);
      ctx.fillStyle = '#bcaaa4';
      ctx.fillRect(sx + 10, sy + 14, T * 2 - 20, T * 2 - 18);
      ctx.fillStyle = '#ffcc80';
      ctx.fillRect(sx + 10, sy + 2, T * 2 - 20, 12);
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(sx + 8, sy, T * 2 - 16, 6);
    }

    // [E] hint
    ctx.fillStyle = 'rgba(255,220,80,0.8)';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[E] shop', sx + T, sy + T * 2 + 12);
    ctx.textAlign = 'left';

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
