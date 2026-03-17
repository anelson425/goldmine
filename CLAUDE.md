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
- [x] `src/systems/scoring.js` — run gold, banked gold, lostGold on death, localStorage high score

### Phase 3 — Hazards & Basic Enemies
- [x] Tile types: dirt, sand (gravity), stone, copper, gold, ruby, emerald, diamond, water, lava (instakill)
- [x] `src/systems/physics.js` — sand gravity (entity-aware: won't fall into entity footprints)
- [x] `src/entities/fallingrock.js` — falls when tile below is empty, damages player
- [x] `src/entities/bat.js` — wanders ±2 tiles, damages on contact
- [x] `src/systems/particles.js` — dig sparks, gold sparkle, hit effect
- [x] `src/systems/audio.js` — Web Audio API SFX + background music (A-minor pentatonic, 78 BPM)
- [x] `src/ui/gameover.js` — death screen with gold lost, gold banked, total score, high score

### Phase 4 — Advanced Enemies & NPCs
- [x] `src/entities/goblin.js` — chases player within 4 tiles, drops gold
- [x] `src/entities/troll.js` — slow patrol AI, drops gold; renders from `assets/troll.png`
- [x] `src/entities/ogre.js` — near-stationary, telegraphed shockwave attack, drops gold
- [x] `src/entities/wizard.js` — friendly NPC, grants random boon on interact (E): full HP+oxygen, +1 max HP/oxygen, ghost mode, +1000 gold
- [x] `src/entities/shopkeeper.js` — friendly NPC, 2×2 sprite, secret shop (bomb 80g, rope 120g); spends run gold first then banked
- [x] `src/entities/minerghost.js` — friendly NPC, auto-reveals nearest wizard/secret shop direction on proximity

### Phase 5 — Full Game Loop
- [x] `src/game.js` — state machine: MENU → PLAYING → SHOP → SECRET_SHOP → GAME_OVER → WIN
- [x] `src/ui/menu.js` — animated title screen with high score display
- [x] `src/ui/hud.js` — HP bar, oxygen bar, score, depth, pickaxe level, item inventory
- [x] `src/ui/shop.js` — upgrade shop (pickaxe lv2/lv3, max HP, oxygen tank)
- [x] Enemy spawning by depth zone; NPC room spawning (entity-overlap-safe, generation-frontier-safe)
- [x] Oxygen depletion below row 30; HP drain at zero oxygen
- [x] Surface detection → shop trigger; gold banking on surface
- [x] `tests/smoke.js` — 47 passing Node.js sanity checks (no framework)
- [x] `README.md` — full game documentation

### Phase 6 — Polish & Sprites
- [x] `assets/` — pixel art sprites: adventurer, bat, goblin, troll, ogre, wizard, ghost, minion, fire_golem, secret_shop
- [x] Player sprite renders from `assets/adventurer.png`, flips left/right based on facing direction
- [x] All entities render from PNG sprites with color-rect fallback (onload flag pattern)
- [x] Lava animated with pulsing yellow glow overlay; gem tiles have rotated diamond shape + sparkle
- [x] Volume slider in UI; DynamicsCompressor + makeup gain for speaker loudness
- [x] Background music: A-minor pentatonic melody + bass, 78 BPM, M key toggle
- [x] Ghost NPC spawns frequently, auto-triggers directional hint to nearest wizard/shop on proximity
- [x] Wizard boons upgraded: full HP+oxygen restore, +1 max HP/oxygen, ghost mode, +1000 gold
- [x] `.gitignore` for Windows, macOS, Node.js, and IDE files
- [x] Custom domain: `playgoldmine.com` (GitHub Pages CNAME)

### Phase 7 — New Content & Bug Fixes
- [x] Secret shop UI fixed: full-screen overlay (STATE.SECRET_SHOP), proper keyboard navigation
- [x] Secret shop spends run gold first, then banked gold (`scoring.spendAny()`)
- [x] Bomb radius expanded to 5×5; Rope key restored (R or C)
- [x] Lantern removed; secret shop has exactly 2 items: Bomb and Rope
- [x] Death screen now shows gold lost on the run (not hardcoded 0)
- [x] Sand physics is entity-aware: won't fall into tiles occupied by any entity
- [x] Entity spawn safety: NPC spawn ensures world generation before tile clearing; enemies check entity positions
- [x] Player starting tile (15, 3) cleared to EMPTY on game init
- [x] `src/entities/firegolem.js` — Fire Golem boss (4×4 tiles), spawns once in Zone 4 (depth >60), telegraphed fire slam + lava scorch, 40 HP, drops 500 gold, defeating it wins the game
- [x] `src/ui/win.js` — victory screen with score summary

---

## Todo — Phase 8

### NPCs & Enemies
- [ ] Add minions purchasable from secret shop: follow player, absorb damage first, boost attack slightly, start with half player HP

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

## Rules
- Always update `CLAUDE.md` and `README.md` after every change
