# Goldmine — Development Tracker

## Completed

### Phase 1 — Skeleton & Rendering
- [x] `index.html` canvas entry point with touch control overlays
- [x] `style.css` layout, mobile touch buttons, pixel-font styling
- [x] `src/constants.js` — single source of truth for all tile IDs, zone defs, tuning values
- [x] `src/loop.js` — `requestAnimationFrame` game loop with delta time (capped at 0.1s)
- [x] `src/input.js` — keyboard (WASD/arrows) + touch input queue
- [x] `src/systems/camera.js` — viewport follow, world→screen coords, screen shake
- [x] `src/systems/renderer.js` — canvas draw (color-rect fallback mode): tiles, entities, player, HUD
- [x] `src/main.js` — wires game + loop, exposes input for touch buttons

### Phase 2 — World & Digging
- [x] `src/world/tiles.js` — tile definitions (id, hp, reward, color, hazard flags)
- [x] `src/world/world.js` — 2D tile grid, chunk management, dig damage, tile HP tracking
- [x] `src/world/generator.js` — chunked procedural generation (4 zones, ore clusters, cellular automata smoothing, guaranteed passage)
- [x] `src/entities/player.js` — movement, digging, HP, oxygen, pickaxe levels, special items
- [x] `src/systems/scoring.js` — run gold, banked gold, localStorage high score

### Phase 3 — Hazards & Basic Enemies
- [x] Tile types: dirt, sand (gravity), stone, copper, gold, ruby, emerald, diamond, water, lava (instakill)
- [x] `src/systems/physics.js` — sand gravity, falling rock ticks
- [x] `src/entities/fallingrock.js` — falls when tile below is empty, damages player
- [x] `src/entities/bat.js` — wanders ±2 tiles, damages on contact
- [x] `src/systems/particles.js` — dig sparks, gold sparkle, hit effect
- [x] `src/systems/audio.js` — synthesised Web Audio API sound effects (no files needed)
- [x] `src/ui/gameover.js` — death screen with score summary

### Phase 4 — Advanced Enemies & NPCs
- [x] `src/entities/goblin.js` — chases player within 4 tiles, drops gold
- [x] `src/entities/troll.js` — slow patrol AI, drops gold
- [x] `src/entities/ogre.js` — near-stationary, telegraphed shockwave attack, drops gold
- [x] `src/entities/wizard.js` — friendly NPC, grants random boon on interact (E)
- [x] `src/entities/shopkeeper.js` — friendly NPC, rare item shop (bomb, rope, lantern, heal)
- [x] `src/entities/minerghost.js` — friendly NPC, gives hint about current chunk

### Phase 5 — Full Game Loop
- [x] `src/game.js` — state machine: MENU → PLAYING → SHOP → GAME_OVER
- [x] `src/ui/menu.js` — animated title screen with high score display
- [x] `src/ui/hud.js` — HP bar, oxygen bar, score, depth, pickaxe level, item inventory
- [x] `src/ui/shop.js` — upgrade shop (pickaxe lv2/lv3, max HP, oxygen tank)
- [x] Enemy spawning by depth zone; NPC room spawning
- [x] Oxygen depletion below row 30; HP drain at zero oxygen
- [x] Surface detection → shop trigger; gold banking on surface
- [x] `tests/smoke.js` — 29 passing Node.js sanity checks (no framework)
- [x] `README.md` — full game documentation

---

## Todo — Phase 6: Polish & New Content

### Art & Animation
- [ ] Draw pixel art sprite sheet (`assets/sprites.png`) — tiles + player frames (use Piskel: piskelapp.com)
- [ ] Switch `src/systems/renderer.js` from color-rect mode to sprite-sheet mode
- [ ] Add player walk/dig/idle animation frames driven by player state
- [ ] Add enemy animations: bat flap, goblin run, troll stomp, ogre shockwave windup
- [ ] Add NPC animations: wizard float/sparkle, shopkeeper idle, ghost flicker

### Audio
- [ ] Replace synthesised beeps with real `.wav` sound effects (dig, gold, hurt, death, buy) — source from freesound.org
- [ ] Add optional looping background music (`.mp3`) with M key mute toggle

### New Content
- [ ] Add tile variants: mossy stone, cracked stone
- [ ] Add treasure chest tile/entity: rare spawn, opens on dig, drops 50–150 gold
- [ ] Add Rock Golem boss enemy: deep Zone 4 only, high HP, area stomp attack, drops 200 gold
- [ ] Add rising lava hazard in Zone 4: lava level slowly creeps upward to pressure the player

### Polish & Feel
- [ ] Add zone transition milestone messages (e.g. "Entering the Deep Mine..." at row 26)
- [ ] Add multi-line NPC dialogue with typewriter effect for all NPC interactions
- [ ] Add red screen flash overlay on player damage
- [ ] Add mobile haptic feedback (`navigator.vibrate`) on hit and dig events

### Persistence & UI
- [ ] Save/load player upgrades (pickaxe level, max HP, max oxygen) in `localStorage` across sessions
- [ ] Add top-5 high score leaderboard screen accessible from the main menu
