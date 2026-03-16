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

Replace the snap assignment at the bottom of `update()` with lerp interpolation:

```js
this.px += (this.col * TILE_SIZE - this.px) * Math.min(1, delta * 12);
this.py += (this.row * TILE_SIZE - this.py) * Math.min(1, delta * 12);
```

- Lerp factor of `12` means ~90% of the distance is covered in ~5 frames at 60fps. Feels responsive without being instant.
- `Math.min(1, delta * 12)` clamps the factor at 1 so the player never overshoots at low framerates.
- **Edge case:** `useRope()` snaps `px`/`py` immediately after setting `row = 2, col = 15` to prevent a cross-screen glide on teleport:
  ```js
  this.px = this.col * TILE_SIZE;
  this.py = this.row * TILE_SIZE;
  ```

**No other files affected.**

---

### 2. Damage Feedback

**Files:** `src/entities/player.js`, `src/game.js`, `src/systems/renderer.js`

#### player.js

Add `iFrames` timer to the constructor:
```js
this.iFrames = 0;  // seconds of invincibility remaining
```

In `takeDamage()`, set the timer when damage is applied:
```js
takeDamage(amount) {
  if (this.iFrames > 0) return;  // ignore damage during i-frames
  this.hp = Math.max(0, this.hp - amount);
  this.iFrames = 0.5;
  if (this.hp <= 0) this._die();
}
```

In `update()`, count it down:
```js
if (this.iFrames > 0) this.iFrames = Math.max(0, this.iFrames - delta);
```

#### game.js

The enemy collision loop (currently ~line 194) triggers `particles.hitEffect` and `audio.hurt()` on every frame when an enemy shares a tile with the player. After adding i-frames to `takeDamage()`, damage is already gated — but the audio/particles still fire every frame. Guard them:

```js
if (e.col === player.col && e.row === player.row) {
  if (player.iFrames <= 0) {
    particles.hitEffect(player.px + TILE_SIZE/2, player.py + TILE_SIZE/2);
    this.audio.hurt();
  }
}
```

#### renderer.js

After `drawPlayer()` in `render()`, draw a full-canvas red overlay that fades with `iFrames`:

```js
if (player.iFrames > 0) {
  const alpha = (player.iFrames / 0.5) * 0.35;
  ctx.fillStyle = `rgba(220, 30, 30, ${alpha})`;
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}
```

- Alpha peaks at `0.35` immediately after a hit and fades to `0` over 0.5 seconds.
- Drawn after all world/entity/player drawing so it composites on top of everything.

---

### 3. Dig Animation

**Files:** `src/systems/renderer.js`, `src/game.js`

#### Crack overlays — renderer.js `drawWorld()`

Replace the existing flat damage overlay:
```js
// OLD
if (hp < def.hp && def.hp > 1) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(sx, sy, T, T);
}
```

With stage-based crack patterns:
```js
if (def.diggable && def.hp > 1) {
  const hp = world.getTileHP(col, row);
  const ratio = hp / def.hp;
  if (ratio < 1) {
    _drawCracks(ctx, sx, sy, T, ratio);
  }
}
```

`_drawCracks(ctx, sx, sy, T, ratio)` is a module-level helper:

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

#### Screen nudge on dig — game.js

The camera already has a `shake()` method. Add a lightweight `nudge(dx, dy)` method to `Camera` that applies a one-frame pixel offset, separate from shake:

In `src/systems/camera.js`, add:
```js
nudge(dx, dy) {
  this._nudgeX = dx;
  this._nudgeY = dy;
}
```

In camera's `worldToScreen()` (or wherever the offset is applied), add `_nudgeX`/`_nudgeY` to the translation and clear them each frame in `update()`:
```js
update(delta) {
  // existing shake logic...
  this._nudgeX = 0;
  this._nudgeY = 0;
}
```

In `game.js`, when a dig hit lands (tile not destroyed), call:
```js
const dirOffsets = { up: [0,-2], down: [0,2], left: [-2,0], right: [2,0] };
camera.nudge(...dirOffsets[action]);
```

#### Double break burst — game.js

When `destroyed === true` in the dig result, call `particles.digSparks()` twice:
```js
if (destroyed) {
  particles.digSparks(tx, ty);
  particles.digSparks(tx, ty);  // double burst on break
}
```

---

## Files Changed

| File | Change |
|---|---|
| `src/entities/player.js` | Lerp px/py; add iFrames; snap on rope |
| `src/game.js` | Guard hit audio/particles with iFrames; camera nudge on dig; double burst on break |
| `src/systems/renderer.js` | Red overlay when iFrames > 0; crack stage helper; replace flat damage overlay |
| `src/systems/camera.js` | Add nudge(dx, dy) method; clear nudge in update() |

---

## Tuning Values

These are all easy to tweak in one place after implementation:

| Value | Location | Default | Effect |
|---|---|---|---|
| Lerp factor | `player.js update()` | `12` | Higher = snappier movement |
| i-frame duration | `player.js takeDamage()` | `0.5s` | Longer = more forgiving |
| Flash peak alpha | `renderer.js` | `0.35` | Higher = more dramatic hit flash |
| Nudge amount | `game.js` | `2px` | Higher = more screen feedback on dig |
| Crack stage thresholds | `renderer.js _drawCracks()` | 50% / 25% | Adjust when cracks appear |
