# Game Feel Polish — Design Spec

**Date:** 2026-03-15
**Scope:** Three targeted improvements to game feel using the existing color-rect rendering style. No new files, no new abstractions — surgical in-place changes only.

---

## Goals

1. **Smooth Movement** — player glides between tiles instead of snapping
2. **Damage Feedback** — invincibility frames + red screen flash on hit
3. **Dig Animation** — 3-stage crack overlays on damaged tiles, screen nudge on dig hit, double particle burst on tile break

---

## Out of Scope

- Pixel art sprites or sprite sheet rendering
- New audio assets
- Zone transition messages, boss enemies, or other Phase 6 content
- New system files or abstractions

---

## Design

### 1. Smooth Movement

**File:** `src/entities/player.js`

Replace the snap assignment at the bottom of `update()`:
```js
// OLD
this.px = this.col * 40;
this.py = this.row * 40;
```

With lerp interpolation:
```js
// NEW
this.px += (this.col * TILE_SIZE - this.px) * Math.min(1, delta * 12);
this.py += (this.row * TILE_SIZE - this.py) * Math.min(1, delta * 12);
```

- Lerp factor of `12` means ~90% of the distance is covered in ~5 frames at 60fps. Feels responsive without being instant.
- `Math.min(1, delta * 12)` clamps the factor at 1 so the player never overshoots at low framerates.
- **Edge case:** `useRope()` snaps `px`/`py` immediately after setting `row = 2, col = 15` to prevent a cross-screen glide on teleport. Add these two lines at the end of `useRope()`:
  ```js
  this.px = this.col * TILE_SIZE;
  this.py = this.row * TILE_SIZE;
  ```

Also in `player.js`, add `this.digTarget = null;` in the free-move branch of `tryMove()` (the `if (!def.solid || this.ghostMode > 0)` block). This clears the stale reference so that walking back into a previously-destroyed tile later does not falsely satisfy the destroy-detection check in `game.js`. The game.js check is already guarded by `player.digTarget &&`, so `null` is safe.

**No other files affected.**

---

### 2. Damage Feedback

**Files:** `src/entities/player.js`, `src/game.js`, `src/game.js` (render section)

#### player.js — constructor

Add `iFrames` timer:
```js
this.iFrames = 0;  // seconds of invincibility remaining
```

#### player.js — takeDamage()

Gate damage on `iFrames` and set the timer when hit:
```js
takeDamage(amount) {
  if (this.iFrames > 0) return;
  this.hp = Math.max(0, this.hp - amount);
  this.iFrames = 0.5;
  if (this.hp <= 0) this._die();
}
```

> **Note on oxygen drain:** `player.update()` also calls `takeDamage(OXYGEN_HP_DRAIN * delta)` when the player is out of oxygen. After this change, oxygen damage will also be blocked during the 0.5s i-frame window. This is intentional — it prevents the awkward situation where an enemy hit and oxygen drain stack to kill the player in one frame. Oxygen depletion is still lethal; it just can't combine with enemy hits during the invincibility window.

#### player.js — update()

Count down `iFrames` each tick:
```js
if (this.iFrames > 0) this.iFrames = Math.max(0, this.iFrames - delta);
```

Add this before the oxygen block.

#### game.js — enemy collision loop (~line 194)

The existing collision loop triggers per-frame feedback effects when an enemy shares a tile with the player. Enemy classes call `player.takeDamage()` from their own `update()` — damage is already gated by `iFrames` via the `takeDamage()` change above. This block only needs to guard the per-frame audio/particle feedback:

```js
for (const e of this.entities) {
  if (['bat','goblin','troll','ogre'].includes(e.type)) {
    if (e.col === player.col && e.row === player.row) {
      if (player.iFrames <= 0) {
        particles.hitEffect(player.px + TILE_SIZE/2, player.py + TILE_SIZE/2);
        this.audio.hurt();
      }
    }
  }
}
```

#### game.js — render() case PLAYING, after drawPlayer

The red flash overlay is drawn directly in `game.js`'s `render()` method (not in `Renderer`) because it uses `this.ctx` and `this.player` which are already in scope there. Insert after `this.renderer.drawPlayer(this.player, this.camera)`:

```js
// Red damage flash
if (this.player.iFrames > 0) {
  const alpha = (this.player.iFrames / 0.5) * 0.35;
  this.ctx.fillStyle = `rgba(220, 30, 30, ${alpha})`;
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}
```

- Alpha peaks at `0.35` immediately after a hit and fades to `0` over 0.5 seconds.
- Drawn before `particles.draw` and `drawHUD` so particles and HUD render on top of the flash.

---

### 3. Dig Animation

**Files:** `src/systems/renderer.js`, `src/systems/camera.js`, `src/game.js`

#### Crack overlays — renderer.js `drawWorld()`

The existing crack block (lines 73–79) reads:
```js
if (def.diggable) {
  const hp = world.getTileHP(col, row);
  if (hp < def.hp && def.hp > 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(sx, sy, T, T);
  }
}
```

Replace the entire block with:
```js
if (def.diggable && def.hp > 1) {
  const hp = world.getTileHP(col, row);
  if (hp < def.hp) {
    _drawCracks(ctx, sx, sy, T, hp / def.hp);
  }
}
```

This reuses the same `hp` binding — the entire old block is replaced, so there is no duplicate declaration.

Add this module-level helper function (outside the `Renderer` class, at the bottom of `renderer.js`):

```js
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
```

#### Camera nudge — camera.js

Add `_nudgeX` and `_nudgeY` to the constructor (initialized to `0` so `worldToScreen` is safe before the first `update()` tick):

```js
constructor() {
  this.x = 0;
  this.y = 0;
  this.shakeTimer     = 0;
  this.shakeIntensity = 0;
  this._nudgeX = 0;   // one-frame pixel offset
  this._nudgeY = 0;
}
```

Add a `nudge()` method:
```js
nudge(dx, dy) {
  this._nudgeX = dx;
  this._nudgeY = dy;
}
```

Clear nudge in `update()` (add after the existing shake logic):
```js
this._nudgeX = 0;
this._nudgeY = 0;
```

Update `worldToScreen()` to include the nudge offset:
```js
worldToScreen(wx, wy) {
  const { dx, dy } = this.shakeOffset;
  return {
    sx: wx - this.x + dx + this._nudgeX,
    sy: wy - this.y + dy + this._nudgeY,
  };
}
```

#### Dig nudge + break burst — game.js

The input loop in `_updatePlaying()` currently has two branches after calling `player.tryMove(action, 0)` (all of this is inside the `while ((action = this.input.consume()))` loop):

```js
if (player.col !== prevCol || player.row !== prevRow) {
  // movement — player entered a new tile
} else if (player.digTarget) {
  // dig hit — player swung but tile survived
  particles.digSparks(...);
  this.audio.dig();
}
```

**Key insight:** when a tile is destroyed, `player.js` moves the player into it (`this.col = tc; this.row = tr`), so `player.col !== prevCol` becomes true and the **movement branch** fires — not the `else if (player.digTarget)` branch. The double-burst must therefore be placed in the movement branch, not the dig-hit branch.

To distinguish a destroy-move from a normal walk, check whether the player just moved into their own `digTarget` — `tryMove()` always sets `digTarget` to the target tile in the same call:

```js
const dirOffsets = { up: [0,-2], down: [0,2], left: [-2,0], right: [2,0] };

if (player.col !== prevCol || player.row !== prevRow) {
  // Check if this was a tile destroy (player moved into their digTarget this frame)
  if (player.digTarget && player.col === player.digTarget.col && player.row === player.digTarget.row) {
    const tx = player.col * TILE_SIZE + TILE_SIZE / 2;
    const ty = player.row * TILE_SIZE + TILE_SIZE / 2;
    particles.digSparks(tx, ty);
    particles.digSparks(tx, ty);  // double burst on break
    this.audio.dig();
  }
} else if (player.digTarget) {
  // Dig hit — tile survived, player didn't move
  const tx = player.digTarget.col * TILE_SIZE + TILE_SIZE / 2;
  const ty = player.digTarget.row * TILE_SIZE + TILE_SIZE / 2;
  particles.digSparks(tx, ty);
  const [nx, ny] = dirOffsets[action] ?? [0, 0];
  camera.nudge(nx, ny);  // 2px nudge in dig direction
  this.audio.dig();
}
```

This replaces the existing movement branch comment and the existing `else if (player.digTarget)` block in full. The nudge is applied only on a hit (not destroy) — on break the player is already in the new tile and camera repositioning provides motion feedback.

---

## Files Changed

| File | Change |
|---|---|
| `src/entities/player.js` | Lerp px/py; snap on rope; add `iFrames`; gate `takeDamage` |
| `src/game.js` | Guard hit audio/particles with iFrames; red flash in render(); nudge + double burst on dig |
| `src/systems/camera.js` | Initialize `_nudgeX`/`_nudgeY` in constructor; add `nudge()`; update `worldToScreen()`; clear nudge in `update()` |
| `src/systems/renderer.js` | Replace flat crack overlay with `_drawCracks()` helper |

---

## Tuning Values

| Value | Location | Default | Effect |
|---|---|---|---|
| Lerp factor | `player.js update()` | `12` | Higher = snappier movement |
| i-frame duration | `player.js takeDamage()` | `0.5s` | Longer = more forgiving |
| Flash peak alpha | `game.js render()` | `0.35` | Higher = more dramatic hit flash |
| Nudge amount | `game.js` dig block | `2px` | Higher = more screen feedback on dig |
| Crack stage thresholds | `renderer.js _drawCracks()` | 50% / 25% | Adjust when cracks appear |
