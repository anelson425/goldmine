export class Particles {
  constructor() {
    this.list = [];
  }

  /** Emit dig sparks at world pixel position (cx, cy). */
  digSparks(cx, cy, color = '#c8a060') {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      this.list.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        color,
        size: 3 + Math.random() * 3,
      });
    }
  }

  /** Emit gold sparkle at world pixel position. */
  goldSparkle(cx, cy) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 80;
      this.list.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color: '#ffd700',
        size: 4 + Math.random() * 4,
      });
    }
  }

  /** Emit damage particles (red). */
  hitEffect(cx, cy) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.list.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        color: '#e63946',
        size: 4,
      });
    }
  }

  update(delta) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x    += p.vx * delta;
      p.y    += p.vy * delta;
      p.vy   += 120 * delta;   // gravity
      p.life -= delta;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  }

  draw(ctx, camera) {
    for (const p of this.list) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const { sx, sy } = camera.worldToScreen(p.x, p.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;
      ctx.fillRect(sx - p.size/2, sy - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
