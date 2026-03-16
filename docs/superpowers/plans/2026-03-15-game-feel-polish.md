# Game Feel Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smooth movement interpolation, invincibility frames with damage flash, and 3-stage tile crack overlays to the Goldmine game without introducing new files or abstractions.

**Architecture:** Four surgical in-place edits — camera gets a one-frame nudge system, player gets lerp and iFrames, game.js wires up feedback effects and restructures the dig branch, renderer gets a `_drawCracks` helper that replaces the flat damage overlay.

**Tech Stack:** Vanilla JS ES modules, HTML5 Canvas 2D API. Tests run in Node.js 18+ via `node tests/smoke.js` (no framework).

---

## File Map

| File | What changes |
|---|---|
| `src/systems/camera.js` | Add `_nudgeX`/`_nudgeY` state; `nudge()` method; update `worldToScreen()`; clear nudge in `update()` |
| `src/entities/player.js` | Lerp `px`/`py`; snap on rope; `iFrames` timer; gate `takeDamage`; clear `digTarget` on free move |
| `src/game.js` | Guard hit particles/audio with `iFrames`; red flash in render; restructure dig branch for double-burst + nudge |
| `src/systems/renderer.js` | Replace flat crack overlay with `_drawCracks()` module-level helper |
| `tests/smoke.js` | Add Camera and Player unit tests for all new logic |

---

## Chunk 1: Camera Nudge System

### Task 1: Write failing Camera tests

**Files:**
- Modify: `tests/smoke.js`

- [ ] **Step 1: Add Camera import and failing tests to smoke.js**

Add this block after the existing Scoring tests (before the Summary section):

```js
// ── Camera ─────────────────────────────────────────────────────────────────
console.log('\n[Camera]');
{
  const { Camera } = await import('../src/systems/camera.js');
  const cam = new Camera();

  assert(cam._nudgeX === 0, 'Camera._nudgeX initialises to 0');
  assert(cam._nudgeY === 0, 'Camera._nudgeY initialises to 0');

  cam.nudge(3, 5);
  assert(cam._nudgeX === 3, 'nudge() sets _nudgeX');
  assert(cam._nudgeY === 5, 'nudge() sets _nudgeY');

  cam.update(0.016);
  assert(cam._nudgeX === 0, 'update() clears _nudgeX');
  assert(cam._nudgeY === 0, 'update() clears _nudgeY');

  // worldToScreen with nudge — camera at origin, no shake
  cam.nudge(7, -3);
  const { sx, sy } = cam.worldToScreen(100, 200);
  assert(sx === 107, 'worldToScreen applies _nudgeX');
  assert(sy === 197, 'worldToScreen applies _nudgeY');
}
```

- [ ] **Step 2: Run tests — expect failures**

```bash
node tests/smoke.js
```

Expected: existing 29 pass, new Camera tests FAIL (`cam.nudge is not a function` or `_nudgeX` is `undefined`).

---

### Task 2: Implement Camera nudge

**Files:**
- Modify: `src/systems/camera.js`

- [ ] **Step 3: Update Camera constructor**

In the constructor, after `this.shakeIntensity = 0;` add:
```js
this._nudgeX = 0;   // one-frame pixel offset, cleared each update()
this._nudgeY = 0;
```

- [ ] **Step 4: Add nudge() method**

After the `shake()` method, add:
```js
nudge(dx, dy) {
  this._nudgeX = dx;
  this._nudgeY = dy;
}
```

- [ ] **Step 5: Update worldToScreen() to include nudge**

Replace the existing `worldToScreen` body:
```js
worldToScreen(wx, wy) {
  const { dx, dy } = this.shakeOffset;
  return {
    sx: wx - this.x + dx + this._nudgeX,
    sy: wy - this.y + dy + this._nudgeY,
  };
}
```

- [ ] **Step 6: Clear nudge in update()**

At the end of `update()`, after the existing shake logic, add:
```js
this._nudgeX = 0;
this._nudgeY = 0;
```

- [ ] **Step 7: Run tests — expect all pass**

```bash
node tests/smoke.js
```

Expected: all tests pass including the 6 new Camera tests (total should be 35).

- [ ] **Step 8: Commit**

```bash
git add src/systems/camera.js tests/smoke.js
git commit -m "feat: add camera nudge() for one-frame screen offset on dig"
```

---

## Chunk 2: Player — Smooth Movement, iFrames, digTarget Fix

### Task 3: Write failing Player tests

**Files:**
- Modify: `tests/smoke.js`

- [ ] **Step 9: Add Player import and failing tests to smoke.js**

Add this block after the Camera tests (before the Summary section). `Player` needs `World` and `Scoring` — both already imported:

```js
// ── Player ─────────────────────────────────────────────────────────────────
console.log('\n[Player]');
{
  const { TILE_SIZE } = await import('../src/constants.js');
  const { Player } = await import('../src/entities/player.js');

  const world  = new World();
  const scoring = new Scoring();
  const player = new Player(world, scoring);

  // iFrames initial state
  assert(player.iFrames === 0, 'player.iFrames initialises to 0');

  // takeDamage sets iFrames and reduces hp
  const hpBefore = player.hp;
  player.takeDamage(10);
  assert(player.hp === hpBefore - 10, 'takeDamage reduces hp');
  assert(player.iFrames === 0.5, 'takeDamage sets iFrames to 0.5');

  // takeDamage is blocked while iFrames > 0
  const hpAfterHit = player.hp;
  player.takeDamage(10);
  assert(player.hp === hpAfterHit, 'takeDamage is ignored while iFrames > 0');

  // update() counts down iFrames
  player.update(0.1);
  assert(Math.abs(player.iFrames - 0.4) < 0.001, 'update() decrements iFrames by delta');

  // Lerp: set px far from target, verify it moves toward it after update()
  player.iFrames = 0;  // clear so takeDamage works
  const targetPx = player.col * TILE_SIZE;
  player.px = targetPx - 100;  // force px far from target
  player.update(0.016);
  assert(player.px > targetPx - 100, 'update() lerps px toward col*TILE_SIZE');
  assert(player.px < targetPx, 'lerp does not overshoot in one frame at 60fps delta');

  // useRope snaps px/py immediately (no glide)
  player.hasRope = true;
  player.row = 20;
  player.col = 5;
  player.px = 5 * TILE_SIZE;
  player.py = 20 * TILE_SIZE;
  player.useRope();
  assert(player.px === 15 * TILE_SIZE, 'useRope snaps px to surface col');
  assert(player.py === 2  * TILE_SIZE, 'useRope snaps py to surface row');

  // digTarget is cleared when player moves freely
  player.digTarget = { col: 99, row: 99 };  // stale reference
  // Place player at a known-empty tile and move to another empty tile
  // Surface row is SURFACE tiles — player.row=2 is the surface
  // Move to col 14 (player is currently at col 15 after rope)
  // Surface row tiles are not diggable so tryMove should free-move if empty
  // Set an EMPTY tile to the left of player's current position
  world.setTile(14, 2, TILE.EMPTY);
  player.tryMove('left', 0);
  assert(player.digTarget === null, 'tryMove into free tile clears digTarget');
}
```

- [ ] **Step 10: Run tests — expect failures**

```bash
node tests/smoke.js
```

Expected: new Player tests FAIL (`player.iFrames` undefined, lerp not applied, etc.).

---

### Task 4: Implement Player changes

**Files:**
- Modify: `src/entities/player.js`

- [ ] **Step 11: Add iFrames to constructor**

After `this.ghostMode = 0;`, add:
```js
this.iFrames = 0;    // seconds of invincibility remaining after a hit
```

- [ ] **Step 12: Update takeDamage() to gate on iFrames**

Replace the existing `takeDamage` method:
```js
takeDamage(amount) {
  if (this.iFrames > 0) return;
  this.hp = Math.max(0, this.hp - amount);
  this.iFrames = 0.5;
  if (this.hp <= 0) this._die();
}
```

- [ ] **Step 13: Add iFrames countdown to update()**

In `update()`, before the oxygen block (before `this.onSurface = this.row <= 2;`), add:
```js
if (this.iFrames > 0) this.iFrames = Math.max(0, this.iFrames - delta);
```

- [ ] **Step 14: Add TILE_SIZE to player.js import**

`player.js` currently imports from `'../constants.js'` but does not include `TILE_SIZE` (the existing code used the hardcoded literal `40`). Add `TILE_SIZE` to the existing import at the top of the file:

```js
import {
  TILE_SIZE,
  PLAYER_START_HP, PLAYER_MAX_HP_BASE, PLAYER_OXYGEN_BASE,
  OXYGEN_DEPTH_ROW, OXYGEN_DRAIN_RATE, OXYGEN_HP_DRAIN,
  PICKAXE, TILE, MOVE_COOLDOWN_MS,
} from '../constants.js';
```

- [ ] **Step 15: Replace snap with lerp in update()**

At the bottom of `update()`, replace:
```js
this.px = this.col * 40;
this.py = this.row * 40;
```

With:
```js
this.px += (this.col * TILE_SIZE - this.px) * Math.min(1, delta * 12);
this.py += (this.row * TILE_SIZE - this.py) * Math.min(1, delta * 12);
```

- [ ] **Step 16: Snap px/py in useRope()**

At the end of `useRope()`, after `this.col = 15;`, add:
```js
this.px = this.col * TILE_SIZE;
this.py = this.row * TILE_SIZE;
```

- [ ] **Step 17: Clear digTarget in free-move branch of tryMove()**

In `tryMove()`, in the `if (!def.solid || this.ghostMode > 0)` block, add `this.digTarget = null;` before `this._moveCooldown`:
```js
if (!def.solid || this.ghostMode > 0) {
  this.col = tc;
  this.row = tr;
  this.digTarget = null;   // clear stale reference to prevent false destroy-detection
  this._moveCooldown = MOVE_COOLDOWN_MS;
}
```

- [ ] **Step 18: Run tests — expect all pass**

```bash
node tests/smoke.js
```

Expected: all tests pass. Total count should now be 35 + 10 new Player tests = 45.

- [ ] **Step 19: Commit**

```bash
git add src/entities/player.js tests/smoke.js
git commit -m "feat: smooth movement lerp, iFrames on damage, digTarget cleanup"
```

---

## Chunk 3: game.js — Red Flash + Dig Branch Restructure

No unit tests are possible for `game.js` (it depends on canvas). Manual testing instructions are provided at the end.

### Task 5: Wire up iFrames guard in enemy collision loop

**Files:**
- Modify: `src/game.js:194-200`

- [ ] **Step 20: Guard hit feedback with iFrames check**

In `_updatePlaying()`, find the enemy collision loop (currently around line 194). It reads:
```js
for (const e of this.entities) {
  if (['bat','goblin','troll','ogre'].includes(e.type)) {
    if (e.col === player.col && e.row === player.row) {
      particles.hitEffect(player.px + TILE_SIZE/2, player.py + TILE_SIZE/2);
      this.audio.hurt();
    }
  }
}
```

Add the `iFrames` guard around the inner feedback calls:
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

- [ ] **Step 21: Commit**

```bash
git add src/game.js
git commit -m "feat: gate hurt particles/audio behind iFrames window"
```

---

### Task 6: Add red damage flash to render()

**Files:**
- Modify: `src/game.js` (render method, case PLAYING)

- [ ] **Step 22: Insert red flash after drawPlayer**

In `render()`, inside the `case STATE.PLAYING:` block, after `this.renderer.drawPlayer(this.player, this.camera)` and before `this.particles.draw(...)`, insert:

```js
// Red damage flash — fades over iFrames duration
if (this.player.iFrames > 0) {
  const alpha = (this.player.iFrames / 0.5) * 0.35;
  this.ctx.fillStyle = `rgba(220, 30, 30, ${alpha})`;
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}
```

- [ ] **Step 23: Commit**

```bash
git add src/game.js
git commit -m "feat: red screen flash fading over iFrames window on player hit"
```

---

### Task 7: Restructure dig branch for nudge + double-burst

**Files:**
- Modify: `src/game.js` (_updatePlaying input loop)

- [ ] **Step 24: Restructure the dig detection block**

In `_updatePlaying()`, inside the `while ((action = this.input.consume()))` loop, find the **first** movement/dig `if/else if` block after `player.tryMove()`. There is a second independent `if` block immediately after it (the "Gold sparkle" block at line 136) — **leave that one untouched**. The full area looks like this in the source:

```js
if (player.col !== prevCol || player.row !== prevRow) {
  // movement
} else if (player.digTarget) {
  particles.digSparks(
    player.digTarget.col * TILE_SIZE + TILE_SIZE / 2,
    player.digTarget.row * TILE_SIZE + TILE_SIZE / 2,
  );
  this.audio.dig();
}

// Gold sparkle
if (player.col !== prevCol || player.row !== prevRow) {
  const tileHere = world.getTile(player.col, player.row);
  if (tileHere === TILE.EMPTY) {
    // Check if we just collected something
  }
}
```

Replace **only the first `if/else if` block** (up to and not including `// Gold sparkle`). Leave the Gold sparkle block exactly as-is. The replacement is:

```js
const dirOffsets = { up: [0,-2], down: [0,2], left: [-2,0], right: [2,0] };

if (player.col !== prevCol || player.row !== prevRow) {
  // Player moved — check if this was a tile destroy (player is now on their digTarget)
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
  camera.nudge(nx, ny);  // 2px nudge toward dig direction
  this.audio.dig();
}
```

- [ ] **Step 25: Run smoke tests to confirm nothing regressed**

```bash
node tests/smoke.js
```

Expected: all tests still pass (game.js changes don't affect pure-logic tests).

- [ ] **Step 26: Commit**

```bash
git add src/game.js
git commit -m "feat: double particle burst on tile break, camera nudge on dig hit"
```

---

## Chunk 4: Renderer — 3-Stage Crack Overlays

No unit tests possible (requires canvas). Manual testing instructions at end.

### Task 8: Replace flat crack overlay with _drawCracks helper

**Files:**
- Modify: `src/systems/renderer.js`

- [ ] **Step 27: Replace existing crack block in drawWorld()**

In `drawWorld()`, find the existing crack overlay block (around lines 73–79):
```js
// HP crack overlay on partially-dug tiles
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
// Progressive crack overlay on partially-dug tiles
if (def.diggable && def.hp > 1) {
  const hp = world.getTileHP(col, row);
  if (hp < def.hp) {
    _drawCracks(ctx, sx, sy, T, hp / def.hp);
  }
}
```

- [ ] **Step 28: Add _drawCracks helper at bottom of renderer.js**

After the closing `}` of the `Renderer` class (at the very end of the file), add:

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

- [ ] **Step 29: Run smoke tests to confirm no regression**

```bash
node tests/smoke.js
```

Expected: all tests still pass (renderer changes don't affect pure-logic tests).

- [ ] **Step 30: Commit**

```bash
git add src/systems/renderer.js
git commit -m "feat: 3-stage tile crack overlays replace flat damage overlay"
```

---

## Manual Testing Checklist

Open `index.html` in a browser (serve locally with e.g. `npx serve .` or `python3 -m http.server`).

- [ ] **Smooth movement:** Walk in any direction. Player should glide smoothly between tiles, not snap. Movement should feel responsive (not sluggish).
- [ ] **Rope snap:** Buy a rope from a shopkeeper and use it (C key). Player should teleport to surface instantly with no glide animation.
- [ ] **Damage flash:** Find an enemy and let it hit you. Screen should flash red and fade over ~0.5s. Should not flash repeatedly until the 0.5s window expires.
- [ ] **iFrames:** Let a bat stand on you. You should take damage once per 0.5s rather than every frame. HP should drain slowly, not instantly.
- [ ] **Dig hit nudge:** Dig into a stone tile (requires 2+ hits). Screen should nudge 2px toward the dig direction on each hit, giving tactile feedback.
- [ ] **Break double burst:** Dig a tile until it breaks. Particle burst on break should be noticeably larger than on a hit.
- [ ] **Crack stage 1:** Find a stone tile (2 HP). Hit it once. Should show a hairline crack.
- [ ] **Crack stage 2:** Find a diamond tile (2 HP) with pickaxe 1. (Actually find any multi-HP tile.) Check stage progression as HP decreases.
- [ ] **Crack stage 3:** Bring a tile to <25% HP. Should show 6 crack lines with heavy darkening.
