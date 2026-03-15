import { CANVAS_W, CANVAS_H, UPGRADES } from '../constants.js';

export class ShopUI {
  constructor() {
    this.selectedIdx = 0;
  }

  navUp()   { if (this.selectedIdx > 0) this.selectedIdx--; }
  navDown() { if (this.selectedIdx < UPGRADES.length - 1) this.selectedIdx++; }

  /** Try to purchase the selected upgrade. Returns upgrade id or null. */
  tryBuy(player, scoring) {
    const upg = UPGRADES[this.selectedIdx];
    if (!upg) return null;
    if (scoring.spend(upg.cost)) {
      this._applyUpgrade(upg.id, player);
      return upg.id;
    }
    return null;
  }

  _applyUpgrade(id, player) {
    switch (id) {
      case 'pickaxe2': player.pickaxeLevel = Math.max(player.pickaxeLevel, 2); break;
      case 'pickaxe3': player.pickaxeLevel = Math.max(player.pickaxeLevel, 3); break;
      case 'health':   player.maxHp += 25; player.hp = Math.min(player.hp + 25, player.maxHp); break;
      case 'oxygen':   player.maxOxygen += 50; player.oxygen = player.maxOxygen; break;
    }
  }

  draw(ctx, scoring, player, message) {
    // Dark overlay
    ctx.fillStyle = 'rgba(10,8,4,0.93)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('UPGRADES', CANVAS_W / 2, 70);

    ctx.font = '15px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Gold banked this run — spend wisely!', CANVAS_W / 2, 100);

    // Banked gold
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Available Gold: ${scoring.bankedGold}`, CANVAS_W / 2, 135);

    // Upgrade list
    UPGRADES.forEach((upg, i) => {
      const y       = 175 + i * 64;
      const selected = i === this.selectedIdx;
      const owned   = _isOwned(upg.id, player);

      ctx.fillStyle = selected ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(80, y - 24, CANVAS_W - 160, 54);

      if (selected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth   = 2;
        ctx.strokeRect(80, y - 24, CANVAS_W - 160, 54);
      }

      ctx.font = `bold 16px monospace`;
      ctx.fillStyle = owned ? '#888' : (selected ? '#ffe57f' : '#fff');
      ctx.fillText(upg.label, CANVAS_W / 2, y);

      ctx.font = '12px monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText(upg.desc, CANVAS_W / 2, y + 18);

      ctx.fillStyle = scoring.bankedGold >= upg.cost ? '#ffd700' : '#e53935';
      ctx.fillText(owned ? '(owned)' : `${upg.cost} gold`, CANVAS_W / 2, y + 36);
    });

    // Controls hint
    ctx.font = '12px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('↑↓ select   Enter buy   C continue', CANVAS_W / 2, CANVAS_H - 50);

    // Message feedback
    if (message) {
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffe57f';
      ctx.fillText(message, CANVAS_W / 2, CANVAS_H - 28);
    }

    ctx.textAlign = 'left';
  }
}

function _isOwned(id, player) {
  if (id === 'pickaxe2') return player.pickaxeLevel >= 2;
  if (id === 'pickaxe3') return player.pickaxeLevel >= 3;
  return false;
}
