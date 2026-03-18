import { CANVAS_W, TILE_SIZE } from '../constants.js';

export function drawHUD(ctx, player, scoring, depth) {
  const PAD = 10;
  const BAR_W = 140;
  const BAR_H = 14;

  // ── Health Bar ─────────────────────────────────────────────────────────────
  const hpPct = Math.max(0, player.hp / player.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(PAD - 2, PAD - 2, BAR_W + 44, BAR_H + 4);
  // Track
  ctx.fillStyle = '#333';
  ctx.fillRect(PAD + 24, PAD, BAR_W, BAR_H);
  // Fill
  ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#e53935';
  ctx.fillRect(PAD + 24, PAD, BAR_W * hpPct, BAR_H);
  // Label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('HP', PAD, PAD + 11);

  // ── Oxygen Bar ─────────────────────────────────────────────────────────────
  const oxPct = Math.max(0, player.oxygen / player.maxOxygen);
  const oxY   = PAD + BAR_H + 6;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(PAD - 2, oxY - 2, BAR_W + 44, BAR_H + 4);
  ctx.fillStyle = '#333';
  ctx.fillRect(PAD + 24, oxY, BAR_W, BAR_H);
  ctx.fillStyle = oxPct > 0.4 ? '#29b6f6' : oxPct > 0.15 ? '#ff9800' : '#e53935';
  ctx.fillRect(PAD + 24, oxY, BAR_W * oxPct, BAR_H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('O²', PAD, oxY + 11);

  // ── Score / Gold ───────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(PAD - 2, oxY + BAR_H + 4, 180, 20);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`Gold: ${scoring.displayGold}`, PAD, oxY + BAR_H + 19);

  // Run gold warning
  if (scoring.currentRunGold > 0) {
    ctx.fillStyle = '#ffcc02';
    ctx.font = '10px monospace';
    ctx.fillText(`(+${scoring.currentRunGold} unbanked)`, PAD + 90, oxY + BAR_H + 19);
  }

  // ── Depth ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(CANVAS_W - 120, PAD - 2, 118, 22);
  ctx.fillStyle = '#80deea';
  ctx.font = '12px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Depth: ${depth}m`, CANVAS_W - PAD, PAD + 14);
  ctx.textAlign = 'left';

  // ── Pickaxe Level ─────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(CANVAS_W - 120, PAD + 24, 118, 22);
  ctx.fillStyle = ['#aaa', '#c0a020', '#00bcd4'][player.pickaxeLevel - 1];
  ctx.font = '12px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Pickaxe Lv${player.pickaxeLevel}`, CANVAS_W - PAD, PAD + 38);
  ctx.textAlign = 'left';

  // ── Item Inventory ────────────────────────────────────────────────────────
  let itemX = PAD;
  const itemY = CANVAS_W - 36;  // use square canvas assumption
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, itemY - 4, 160, 28);
  ctx.font = '11px monospace';
  if (player.hasBomb)       { ctx.fillStyle = '#ff7043'; ctx.fillText('[B]Bomb',    itemX, itemY + 14); itemX += 60; }
  if (player.hasRope)       { ctx.fillStyle = '#a5d6a7'; ctx.fillText('[R]Rope',    itemX, itemY + 14); itemX += 60; }
  if (player.hasLifeJacket) { ctx.fillStyle = '#29b6f6'; ctx.fillText('LifeJacket', itemX, itemY + 14); itemX += 80; }
  if (player.ghostMode > 0) {
    ctx.fillStyle = '#ce93d8';
    ctx.fillText(`Ghost ${player.ghostMode.toFixed(0)}s`, itemX, itemY + 14);
  }
}
