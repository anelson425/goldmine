import { CANVAS_W, CANVAS_H } from '../constants.js';

export function drawMenu(ctx, highScore, phase) {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Sparkle stars
  ctx.fillStyle = 'rgba(255,215,0,0.7)';
  for (let i = 0; i < 20; i++) {
    const x = ((i * 137 + phase * 20) % CANVAS_W);
    const y = ((i * 89  + phase * 10) % CANVAS_H);
    const s = 2 + Math.sin(phase * 3 + i) * 1.5;
    ctx.fillRect(x, y, s, s);
  }

  // Title
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px monospace';
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ff8c00';
  ctx.shadowBlur  = 20;
  ctx.fillText('GOLDMINE', CANVAS_W / 2, 160);
  ctx.shadowBlur = 0;

  ctx.font = '18px monospace';
  ctx.fillStyle = '#c0c0c0';
  ctx.fillText('Dig deep. Collect gold. Survive.', CANVAS_W / 2, 200);

  // Blink start prompt
  if (Math.sin(phase * 3) > 0) {
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffe57f';
    ctx.fillText('Press  ENTER  to start', CANVAS_W / 2, 290);
  }

  // Controls
  ctx.font = '13px monospace';
  ctx.fillStyle = '#888';
  const controls = [
    'Arrow keys / WASD — move & dig',
    'E — interact with NPCs',
    'B — use Bomb   R — use Rope',
  ];
  controls.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 350 + i * 20));

  // High score
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(`High Score: ${highScore}`, CANVAS_W / 2, 440);

  ctx.textAlign = 'left';
}
