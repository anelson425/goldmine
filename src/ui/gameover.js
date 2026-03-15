import { CANVAS_W, CANVAS_H } from '../constants.js';

export function drawGameOver(ctx, scoring, phase) {
  // Dark red overlay
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1a0000');
  grad.addColorStop(1, '#0a0005');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';

  // Title
  ctx.font = 'bold 52px monospace';
  ctx.fillStyle = '#e53935';
  ctx.shadowColor = '#b71c1c';
  ctx.shadowBlur  = 20;
  ctx.fillText('YOU DIED', CANVAS_W / 2, 160);
  ctx.shadowBlur = 0;

  ctx.font = '16px monospace';
  ctx.fillStyle = '#ccc';
  ctx.fillText('Your unbanked gold was lost.', CANVAS_W / 2, 205);

  // Stats
  const stats = [
    { label: 'Gold Banked',  value: scoring.bankedGold },
    { label: 'Run Gold Lost',value: 0 },   // already cleared by onDeath
    { label: 'Total Score',  value: scoring.totalScore },
    { label: 'High Score',   value: scoring.highScore },
  ];

  stats.forEach(({ label, value }, i) => {
    const y = 270 + i * 42;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(label, CANVAS_W / 2, y);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = label === 'High Score' ? '#ffd700' : '#fff';
    ctx.fillText(value, CANVAS_W / 2, y + 22);
  });

  // New high score flash
  if (scoring.totalScore >= scoring.highScore && scoring.totalScore > 0) {
    if (Math.sin(phase * 4) > 0) {
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#ffe57f';
      ctx.fillText('★ NEW HIGH SCORE ★', CANVAS_W / 2, 460);
    }
  }

  // Continue
  if (Math.sin(phase * 2) > 0) {
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffe57f';
    ctx.fillText('Press ENTER to return to menu', CANVAS_W / 2, CANVAS_H - 40);
  }

  ctx.textAlign = 'left';
}
