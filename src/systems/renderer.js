import { TILE_SIZE, TILE } from '../constants.js';
import { getTileDef } from '../world/tiles.js';

// Lava animation phase
let _lavaPhase = 0;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground(camera) {
    const ctx = this.ctx;
    const surfaceY = -camera.y;   // screen Y of row 0

    // Sky gradient above surface
    if (surfaceY > 0) {
      const grad = ctx.createLinearGradient(0, 0, 0, surfaceY);
      grad.addColorStop(0, '#87ceeb');
      grad.addColorStop(1, '#c8e6f5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, surfaceY);
    }

    // Underground dark gradient
    const underY = Math.max(0, surfaceY);
    const grad2 = ctx.createLinearGradient(0, underY, 0, this.canvas.height);
    grad2.addColorStop(0, '#2a1a0a');
    grad2.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, underY, this.canvas.width, this.canvas.height - underY);
  }

  drawWorld(world, camera, delta) {
    _lavaPhase += delta;
    const ctx = this.ctx;
    const T    = TILE_SIZE;

    for (let row = camera.startRow; row <= camera.endRow; row++) {
      for (let col = camera.startCol; col <= camera.endCol; col++) {
        const tileId = world.getTile(col, row);
        if (tileId === TILE.EMPTY) continue;

        const def    = getTileDef(tileId);
        const { sx, sy } = camera.worldToScreen(col * T, row * T);

        // Base tile color
        let color = def.color;
        if (tileId === TILE.LAVA) {
          // Pulsing lava
          const pulse = Math.sin(_lavaPhase * 4 + col * 0.5 + row * 0.5);
          const r = Math.floor(255);
          const g = Math.floor(50 + pulse * 30);
          color = `rgb(${r},${g},0)`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, T, T);

        // Subtle border on solid tiles
        if (def.solid && tileId !== TILE.SURFACE) {
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx + 0.5, sy + 0.5, T - 1, T - 1);
        }

        // Progressive crack overlay on partially-dug tiles
        if (def.diggable && def.hp > 1) {
          const hp = world.getTileHP(col, row);
          if (hp < def.hp) {
            _drawCracks(ctx, sx, sy, T, hp / def.hp);
          }
        }

        // Gem shine indicator
        if ([TILE.RUBY, TILE.EMERALD, TILE.DIAMOND].includes(tileId)) {
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(sx + 4, sy + 4, 8, 8);
        }

        // Surface grass texture
        if (tileId === TILE.SURFACE) {
          ctx.fillStyle = '#388e3c';
          ctx.fillRect(sx, sy, T, 5);
        }
      }
    }
  }

  drawEntities(entities, camera) {
    for (const e of entities) {
      if (typeof e.draw === 'function') e.draw(this.ctx, camera);
    }
  }

  drawPlayer(player, camera) {
    const ctx = this.ctx;
    const T   = TILE_SIZE;
    const { sx, sy } = camera.worldToScreen(player.px, player.py);

    // Body
    ctx.fillStyle = player.ghostMode > 0 ? 'rgba(180,180,255,0.6)' : '#f5c518';
    ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);

    // Hard hat
    ctx.fillStyle = '#e53935';
    ctx.fillRect(sx + 6, sy + 2, T - 12, 8);

    // Eyes
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(sx + 10, sy + 12, 4, 4);
    ctx.fillRect(sx + 22, sy + 12, 4, 4);

    // Pickaxe indicator (level pip)
    ctx.fillStyle = ['#aaa', '#c0a020', '#00bcd4'][player.pickaxeLevel - 1];
    ctx.fillRect(sx + T - 10, sy + T - 10, 6, 6);
  }
}

function _drawCracks(ctx, sx, sy, T, ratio) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineCap = 'round';

  if (ratio < 0.25) {
    // Stage 3: heavy — 6 lines + heavy darken
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(sx, sy, T, T);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + T*0.30, sy + T*0.08); ctx.lineTo(sx + T*0.53, sy + T*0.47);
    ctx.moveTo(sx + T*0.53, sy + T*0.47); ctx.lineTo(sx + T*0.25, sy + T*0.92);
    ctx.moveTo(sx + T*0.53, sy + T*0.47); ctx.lineTo(sx + T*0.83, sy + T*0.63);
    ctx.moveTo(sx + T*0.13, sy + T*0.37); ctx.lineTo(sx + T*0.42, sy + T*0.53);
    ctx.moveTo(sx + T*0.67, sy + T*0.17); ctx.lineTo(sx + T*0.87, sy + T*0.37);
    ctx.moveTo(sx + T*0.08, sy + T*0.75); ctx.lineTo(sx + T*0.33, sy + T*0.87);
    ctx.stroke();
  } else if (ratio < 0.50) {
    // Stage 2: medium — 4 lines + light darken
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(sx, sy, T, T);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx + T*0.30, sy + T*0.08); ctx.lineTo(sx + T*0.53, sy + T*0.47);
    ctx.moveTo(sx + T*0.53, sy + T*0.47); ctx.lineTo(sx + T*0.25, sy + T*0.92);
    ctx.moveTo(sx + T*0.58, sy + T*0.33); ctx.lineTo(sx + T*0.75, sy + T*0.67);
    ctx.moveTo(sx + T*0.17, sy + T*0.50); ctx.lineTo(sx + T*0.42, sy + T*0.63);
    ctx.stroke();
  } else {
    // Stage 1: hairline — 2 lines, no darken
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + T*0.33, sy + T*0.10); ctx.lineTo(sx + T*0.47, sy + T*0.53);
    ctx.moveTo(sx + T*0.47, sy + T*0.53); ctx.lineTo(sx + T*0.27, sy + T*0.88);
    ctx.stroke();
  }

  ctx.restore();
}
