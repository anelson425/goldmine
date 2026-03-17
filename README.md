# Goldmine

A 2D tile-based browser mining game. Dig deep, collect gold, survive the hazards — and make it back to the surface to bank your treasure.

**Play online:** [playgoldmine.com](https://playgoldmine.com)

## How to Play

Open `index.html` in a modern browser (Chrome, Firefox, Safari).

> If you see a CORS error for ES modules, serve with:
> ```
> python -m http.server 8080
> ```
> Then open `http://localhost:8080`

### Controls
| Key | Action |
|---|---|
| Arrow keys / WASD | Move & dig (hold to repeat) |
| E / Enter | Interact with NPCs / confirm |
| B | Use Bomb (3×3 blast) |
| C | Use Rope (teleport to surface) |
| M | Toggle background music |

### Mobile
On-screen arrow pad and action buttons appear automatically on touch devices.

---

## Game Overview

- **Mine** through dirt, sand, stone, and ore veins
- **Collect** copper, gold, rubies, emeralds, and diamonds
- **Avoid** bats, goblins, trolls, ogres, falling rocks, water, and lava
- **Find** Miner Ghosts — they automatically reveal the nearest wizard or secret shop
- **Interact (E)** with Wizards for powerful boons
- **Surface** to bank your gold and spend it on upgrades
- **Die** and lose your unbanked run gold

---

## Tiles
| Tile | Notes |
|---|---|
| Dirt | 1 hit to dig |
| Sand | 1 hit, falls with gravity |
| Stone | 2 hits (1 with Lv2 pickaxe) |
| Copper | +5 gold |
| Gold Ore | +10 gold |
| Ruby | +50 gold |
| Emerald | +30 gold |
| Diamond | 2 hits (1 with Lv3 pickaxe), +100 gold |
| Water | -20 HP on entry |
| Lava | **Instant death** |

---

## Enemies
| Enemy | Zone | Notes |
|---|---|---|
| Bat | 1+ | Wanders, -10 HP on contact |
| Goblin | 1+ | Chases within 4 tiles, drops gold |
| Troll | 3+ | Slow patrol, -25 HP |
| Ogre | 4 | Telegraphed shockwave attack, -40 HP |

Bump into enemies to attack them. Damage dealt equals your pickaxe level.

---

## NPCs
| NPC | Notes |
|---|---|
| Miner Ghost | Auto-reveals direction & distance to nearest wizard or secret shop |
| Wizard | Press E to receive a random boon: full HP+oxygen, +1 max HP/oxygen, ghost mode, or +1000 gold |
| Shopkeeper | Press E to open the secret shop (rare items) |

---

## Upgrades

### Surface Shop (on returning to surface)
| Upgrade | Cost |
|---|---|
| Pickaxe Level 2 | 200g |
| Pickaxe Level 3 | 600g |
| Max Health +25 | 150g |
| Oxygen Tank +50 | 200g |

### Secret Shop (found deep underground)
Rare items sold by the Shopkeeper NPC: bombs, ropes, lanterns, and heals.

---

## Run Smoke Tests
```
node tests/smoke.js
```

---

## Project Structure
```
goldmine/
  index.html          # Entry point + touch controls
  style.css           # Layout, mobile buttons, volume slider
  assets/             # Pixel art sprites (PNG)
  src/
    constants.js      # All tuning values and tile IDs
    game.js           # State machine (MENU/PLAYING/SHOP/GAME_OVER)
    loop.js           # requestAnimationFrame game loop
    input.js          # Keyboard + touch input, held-direction tracking
    world/            # Tile grid, procedural generation, tile definitions
    entities/         # Player, enemies (bat/goblin/troll/ogre), NPCs, falling rocks
    systems/          # Renderer, camera, physics, scoring, particles, audio
    ui/               # HUD, menu, shop, game-over screens
  tests/
    smoke.js          # Node.js sanity checks (no framework needed)
```
