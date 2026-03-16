/**
 * Smoke tests for Goldmine game logic.
 * Run with: node tests/smoke.js
 * No test framework required.
 */

// Minimal browser globals for Node.js
global.localStorage = { _data: {}, getItem(k) { return this._data[k] ?? null; }, setItem(k,v) { this._data[k]=v; } };
global.window = global;
global.requestAnimationFrame = () => {};
global.performance = { now: () => Date.now() };

// ── Imports ────────────────────────────────────────────────────────────────
// We use dynamic import to support ES modules in Node.js 16+
const { TILE, WORLD_COLS, CHUNK_HEIGHT } = await import('../src/constants.js');
const { generateChunk, generateSurface } = await import('../src/world/generator.js');
const { getTileDef }                     = await import('../src/world/tiles.js');
const { World }                          = await import('../src/world/world.js');
const { Scoring }                        = await import('../src/systems/scoring.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

// ── generateChunk ──────────────────────────────────────────────────────────
console.log('\n[generateChunk]');
{
  const chunk = generateChunk(3);
  assert(chunk.length === CHUNK_HEIGHT, `chunk has ${CHUNK_HEIGHT} rows`);
  assert(chunk[0].length === WORLD_COLS, `chunk has ${WORLD_COLS} columns`);
  assert(chunk[0][0] === TILE.STONE, 'left border column is STONE');
  assert(chunk[0][WORLD_COLS - 1] === TILE.STONE, 'right border column is STONE');
}

// ── generateSurface ────────────────────────────────────────────────────────
console.log('\n[generateSurface]');
{
  const surface = generateSurface();
  assert(surface.length === 3, 'surface has 3 rows');
  assert(surface[0].every(t => t === TILE.SKY || t === TILE.STONE), 'row 0 is sky/stone');
  assert(surface[2].includes(TILE.SURFACE), 'row 2 contains SURFACE tiles');
}

// ── getTileDef ─────────────────────────────────────────────────────────────
console.log('\n[getTileDef]');
{
  const gold = getTileDef(TILE.GOLD);
  assert(gold.reward === 10, 'gold reward is 10');
  assert(gold.diggable === true, 'gold is diggable');
  const lava = getTileDef(TILE.LAVA);
  assert(lava.instakill === true, 'lava is instakill');
  assert(lava.diggable === false, 'lava is not diggable');
  const diamond = getTileDef(TILE.DIAMOND);
  assert(diamond.reward === 100, 'diamond reward is 100');
  assert(diamond.hp === 2, 'diamond requires 2 hits');
}

// ── World ──────────────────────────────────────────────────────────────────
console.log('\n[World]');
{
  const world = new World();
  assert(world.totalRows >= 3, 'world has at least 3 rows after init');
  assert(world.getTile(0, 0) === TILE.STONE || world.getTile(0, 0) === TILE.SKY, 'tile (0,0) is a valid type');
  // Out-of-bounds returns STONE (safe default)
  assert(world.getTile(-1, 0) === TILE.STONE, 'out-of-bounds col returns STONE');

  // Dig a dirt tile
  const startRow = 3;
  let dirtCol = -1;
  for (let c = 1; c < WORLD_COLS - 1; c++) {
    if (world.getTile(c, startRow) === TILE.DIRT) { dirtCol = c; break; }
  }
  if (dirtCol >= 0) {
    const { destroyed, reward } = world.digTile(dirtCol, startRow, 1);
    assert(destroyed === true, 'dirt tile is destroyed in 1 hit');
    assert(reward === 0, 'dirt gives no reward');
    assert(world.getTile(dirtCol, startRow) === TILE.EMPTY, 'dug tile becomes EMPTY');
  }

  // Cannot dig lava
  world.setTile(5, 5, TILE.LAVA);
  const { destroyed: lavaDig } = world.digTile(5, 5, 99);
  assert(lavaDig === false, 'lava cannot be dug');
}

// ── Scoring ────────────────────────────────────────────────────────────────
console.log('\n[Scoring]');
{
  const s = new Scoring();
  s.addRunGold(10);
  assert(s.currentRunGold === 10, 'addRunGold increases currentRunGold');
  assert(s.displayGold === 10, 'displayGold reflects currentRunGold');
  s.bankGold();
  assert(s.bankedGold === 10, 'bankGold moves to bankedGold');
  assert(s.currentRunGold === 0, 'currentRunGold resets after banking');
  s.addRunGold(50);
  s.onDeath();
  assert(s.currentRunGold === 0, 'onDeath clears currentRunGold');
  assert(s.bankedGold === 10, 'onDeath does not affect bankedGold');
  assert(s.spend(5) === true, 'spend succeeds with enough gold');
  assert(s.bankedGold === 5, 'spend reduces bankedGold');
  assert(s.spend(100) === false, 'spend fails without enough gold');
}

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

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
