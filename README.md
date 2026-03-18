# Goldmine

A 2D tile-based browser mining game. Dig deep, collect gold, survive the hazards — and make it back to the surface to bank your treasure. Defeat the Fire Golem to win.

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
| B | Use Bomb (5×5 blast) |
| R or C | Use Rope (teleport to surface) |
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
- **Defeat** the Fire Golem boss in Zone 4 to win the game
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
| Troll | 2+ | Slow patrol, -25 HP, drops gold |
| Ogre | 3+ | Telegraphed shockwave attack, -40 HP, drops gold |
| **Fire Golem** | **4 (boss)** | **4×4 boss, telegraphed fire slam + lava scorch, 40 HP, drops 500 gold — defeating it wins the game** |

Bump into enemies to attack them. Damage dealt equals your pickaxe level.

---

## NPCs
| NPC | Notes |
|---|---|
| Miner Ghost | Auto-reveals direction & distance to nearest wizard or secret shop on proximity |
| Wizard | Press E to receive a random boon: full HP+oxygen, +1 max HP/oxygen, 10s ghost mode, or +1000 gold |
| Shopkeeper | Press E to open the secret shop — spends run gold first, then banked gold |

---

## Upgrades

### Surface Shop (on returning to surface)
| Upgrade | Cost |
|---|---|
| Pickaxe Level 2 | 200g |
| Pickaxe Level 3 | 600g |
| Max Health +25 | 150g |
| Oxygen Tank +50 | 200g |

### Secret Shop (found underground, depth ≥26)
| Item | Cost | Effect |
|---|---|---|
| Bomb | 80g | Destroys a 5×5 area centred on player |
| Rope | 120g | Teleports player instantly to the surface |
| Minion | 150g | Companion that follows one tile behind and absorbs all damage before you are hit (one at a time) |

---

## Zones
| Zone | Rows | Notes |
|---|---|---|
| Topsoil | 3–10 | Dirt, sand, copper, gold, some stone |
| Stone Layer | 11–25 | More stone, gold, occasional water |
| Deep Mine | 26–50 | Stone dominant, rubies, emeralds, diamonds, lava |
| Abyss | 51+ | Dense stone, all gems, heavy lava — Fire Golem spawns here |

Oxygen depletes below row 30. Return to surface to refill.

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
    game.js           # State machine (MENU/PLAYING/SHOP/SECRET_SHOP/GAME_OVER/WIN)
    loop.js           # requestAnimationFrame game loop
    input.js          # Keyboard + touch input, held-direction tracking
    world/            # Tile grid, procedural generation, tile definitions
    entities/         # Player, enemies (bat/goblin/troll/ogre/firegolem), NPCs, falling rocks
    systems/          # Renderer, camera, physics, scoring, particles, audio
    ui/               # HUD, menu, shop, secret shop, game-over, win screens
  tests/
    smoke.js          # Node.js sanity checks (47 passing, no framework needed)
```
