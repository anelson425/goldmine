# Goldmine — Development Tracker

## Completed

### Phase 1 — Skeleton & Rendering
- [x] `index.html` canvas entry point with touch control overlays
- [x] `style.css` layout, mobile touch buttons, pixel-font styling
- [x] `src/constants.js` — single source of truth for all tile IDs, zone defs, tuning values
- [x] `src/loop.js` — `requestAnimationFrame` game loop with delta time (capped at 0.1s)
- [x] `src/input.js` — keyboard (WASD/arrows) + touch input queue
- [x] `src/systems/camera.js` — viewport follow, world→screen coords, screen shake
- [x] `src/systems/renderer.js` — canvas draw: tiles, entities, player, HUD
- [x] `src/main.js` — wires game + loop, exposes input for touch buttons

### Phase 2 — World & Digging
- [x] `src/world/tiles.js` — tile definitions (id, hp, reward, color, hazard flags)
- [x] `src/world/world.js` — 2D tile grid, chunk management, dig damage, tile HP tracking
- [x] `src/world/generator.js` — chunked procedural generation (4 zones, ore clusters, cellular automata smoothing, guaranteed passage)
- [x] `src/entities/player.js` — movement, digging, HP, oxygen, pickaxe levels, special items, bump-to-attack, facing direction
- [x] `src/systems/scoring.js` — run gold, banked gold, localStorage high score

### Phase 3 — Hazards & Basic Enemies
- [x] Tile types: dirt, sand (gravity), stone, copper, gold, ruby, emerald, diamond, water, lava (instakill)
- [x] `src/systems/physics.js` — sand gravity, falling rock ticks
- [x] `src/entities/fallingrock.js` — falls when tile below is empty, damages player
- [x] `src/entities/bat.js` — wanders ±2 tiles, damages on contact
- [x] `src/systems/particles.js` — dig sparks, gold sparkle, hit effect
- [x] `src/systems/audio.js` — Web Audio API SFX + background music (A-minor pentatonic, 78 BPM)
- [x] `src/ui/gameover.js` — death screen with score summary

### Phase 4 — Advanced Enemies & NPCs
- [x] `src/entities/goblin.js` — chases player within 4 tiles, drops gold
- [x] `src/entities/troll.js` — slow patrol AI, drops gold
- [x] `src/entities/ogre.js` — near-stationary, telegraphed shockwave attack, drops gold
- [x] `src/entities/wizard.js` — friendly NPC, grants random boon on interact (E): full HP+oxygen, +1 max HP/oxygen, ghost mode, +1000 gold
- [x] `src/entities/shopkeeper.js` — friendly NPC, rare item shop (bomb, rope, lantern, heal)
- [x] `src/entities/minerghost.js` — friendly NPC, auto-reveals nearest wizard/secret shop direction on proximity

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

### Phase 6 — Polish & Sprites
- [x] `assets/` — pixel art sprites: adventurer, bat, goblin, ogre, wizard, ghost, minion, fire golem, secret shop
- [x] Player sprite renders from `assets/adventurer.png`, flips left/right based on facing direction
- [x] All entities render from PNG sprites with color-rect fallback (onload flag pattern)
- [x] Lava animated with pulsing yellow glow overlay; gem tiles have rotated diamond shape + sparkle
- [x] Volume slider in UI; DynamicsCompressor + makeup gain for speaker loudness
- [x] Background music: A-minor pentatonic melody + bass, 78 BPM, M key toggle
- [x] Ghost NPC spawns frequently, auto-triggers directional hint to nearest wizard/shop on proximity
- [x] Wizard boons upgraded: full HP+oxygen restore, +1 max HP/oxygen, ghost mode, +1000 gold
- [x] `.gitignore` for Windows, macOS, Node.js, and IDE files
- [x] Custom domain: `playgoldmine.com` (GitHub Pages CNAME)

---

## Todo — Phase 7: New Content & Features

### NPCs & Enemies
- [ ] Add minions purchasable from secret shop: follow player, absorb damage first, boost attack slightly, start with half player HP
- [ ] Add Fire Golem boss (4×4 tiles) at deepest zone — defeating it wins the game
- [ ] Fix secret shop purchase selection to work like the regular shop UI

### Art
- [ ] Add new pixel art graphics for all tiles (dirt, stone, sand, ore, lava, water, etc.)

### World
- [ ] Make the visible world bigger (increase viewport/canvas size)

### Audio
- [ ] Fix overall volume level through speakers (currently requires high makeup gain)

### Polish
- [ ] Add zone transition milestone messages (e.g. "Entering the Deep Mine..." at row 26)
- [ ] Add red screen flash overlay on player damage
- [ ] Save/load player upgrades in `localStorage` across sessions
- [ ] Add top-5 high score leaderboard screen accessible from the main menu
