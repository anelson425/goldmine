import { TILE_SIZE } from '../constants.js';

const _img = new Image();
let _imgReady = false;
_img.onload = () => { _imgReady = true; };
_img.src = 'assets/ghost.png';


export class MinerGhost {
  constructor(col, row) {
    this.col      = col;
    this.row      = row;
    this.type     = 'minerghost';
    this.dead     = false;
    this.used     = false;
    this._phase   = 0;
    this._hint    = null;
    this._showing = false;
    this._timer   = 0;
  }

  interact(player, _scoring, audio, entities = []) {
    this._showing = true;
    this._timer   = 5;
    this._hint    = this._buildHint(player, entities);
    audio?.npc();
  }

  _buildHint(player, entities) {
    const targets = entities.filter(e => e.type === 'wizard' || e.type === 'shopkeeper');
    if (targets.length === 0) return 'I sense no wizards or secret shops nearby...';
    const t = targets.reduce((closest, e) => {
      const d = Math.abs(e.col - player.col) + Math.abs(e.row - player.row);
      const cd = Math.abs(closest.col - player.col) + Math.abs(closest.row - player.row);
      return d < cd ? e : closest;
    });
    const dc = t.col - player.col;
    const dr = t.row - player.row;
    const dist = Math.round(Math.sqrt(dc*dc + dr*dr));
    const dir = Math.abs(dc) > Math.abs(dr)
      ? (dc > 0 ? 'east' : 'west')
      : (dr > 0 ? 'below' : 'above');
    const label = t.type === 'wizard' ? 'a wizard' : 'the secret shop';
    return `I sense ${label} ~${dist} tiles ${dir} of here.`;
  }

  update(delta) {
    this._phase += delta;
    if (this._timer > 0) {
      this._timer = Math.max(0, this._timer - delta);
      if (this._timer === 0) this._showing = false;
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const T = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(this.col * T, this.row * T);

    const alpha = 0.5 + Math.sin(this._phase * 2) * 0.2;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (_imgReady) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(_img, sx, sy, T, T);
    } else {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(sx + 8,  sy + 4,  T - 16, T - 10);
      ctx.fillRect(sx + 10, sy,      T - 20, 10);
      ctx.fillStyle = '#9e9e9e';
      ctx.fillRect(sx + 8,  sy - 4,  T - 16, 8);
    }
    ctx.restore();

    // Hint speech bubble
    if (this._showing) {
      const fadePct = Math.min(1, this._timer);
      ctx.globalAlpha = fadePct;
      const lines  = this._wrapText(this._hint, 22);
      const w      = 180;
      const h      = 14 + lines.length * 14;
      const bx     = sx - 70;
      const by     = sy - h - 10;
      ctx.fillStyle = 'rgba(10,20,40,0.88)';
      ctx.fillRect(bx, by, w, h);
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, w, h);
      ctx.fillStyle = '#e3f2fd';
      ctx.font      = '10px monospace';
      lines.forEach((line, i) => {
        ctx.fillText(line, bx + 8, by + 13 + i * 14);
      });
      ctx.globalAlpha = 1;
    }
  }

  _wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      if ((line + w).length > maxChars) { lines.push(line.trim()); line = ''; }
      line += w + ' ';
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  }
}
