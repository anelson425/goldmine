import { CANVAS_W, CANVAS_H } from '../constants.js';

export function drawWin(ctx, scoring, phase) {
  // Golden gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1a1000');
  grad.addColorStop(1, '#0a0500');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';

  // Title
  ctx.font = 'bold 42px monospace';
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur  = 24;
  ctx.fillText('FIRE GOLEM SLAIN!', CANVAS_W / 2, 150);
  ctx.shadowBlur = 0;

  ctx.font = '15px monospace';
  ctx.fillStyle = '#ffcc80';
  ctx.fillText('You conquered the depths.', CANVAS_W / 2, 190);

  // Stats
  const stats = [
    { label: 'Gold Earned', value: scoring.bankedGold, color: '#ffd700' },
    { label: 'Total Score', value: scoring.totalScore, color: '#fff' },
    { label: 'High Score',  value: scoring.highScore,  color: '#ffd700' },
  ];

  stats.forEach(({ label, value, color }, i) => {
    const y = 260 + i * 50;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(label, CANVAS_W / 2, y);
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = color;
    ctx.fillText(value, CANVAS_W / 2, y + 26);
  });

  // New high score flash
  if (scoring.totalScore >= scoring.highScore && scoring.totalScore > 0) {
    if (Math.sin(phase * 4) > 0) {
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#ffe57f';
      ctx.fillText('★ NEW HIGH SCORE ★', CANVAS_W / 2, 450);
    }
  }

  // Prompt
  if (Math.sin(phase * 2) > 0) {
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffe57f';
    ctx.fillText('Press ENTER to return to menu', CANVAS_W / 2, CANVAS_H - 40);
  }

  ctx.textAlign = 'left';
}
