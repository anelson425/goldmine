# Goldmine

A 2D tile-based browser mining game. Dig deep, collect gold, survive the hazards — and make it back to the surface to bank your treasure.

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
| Arrow keys / WASD | Move & dig |
| E / Enter | Interact with NPCs / confirm |
| B | Use Bomb (3×3 blast) |
| R | Use Rope (teleport to surface) |
| C | Continue (close shop) |

## Game Overview

- **Mine** through dirt, sand, stone, and ore veins
- **Collect** copper, gold, rubies, emeralds, and diamonds
- **Avoid** bats, goblins, trolls, ogres, falling rocks, water, and lava
- **Talk** to Wizards, Secret Shopkeepers, and Miner Ghosts in hidden cave rooms
- **Surface** to bank your gold and spend it on upgrades
- **Die** and lose your unbanked run gold

## Tiles
| Tile | Color | Notes |
|---|---|---|
| Dirt | Brown | 1 hit to dig |
| Sand | Tan | 1 hit, falls with gravity |
| Stone | Gray | 2 hits (1 with Lv2 pickaxe) |
| Copper | Orange-brown | +5 gold |
| Gold Ore | Yellow | +10 gold |
| Ruby | Red | +50 gold |
| Emerald | Green | +30 gold |
| Diamond | Cyan | 2 hits, +100 gold |
| Water | Blue | -20 HP on entry |
| Lava | Orange-red | **Instant death** |

## Enemies
| Enemy | Zone | Notes |
|---|---|---|
| Bat | 2+ | Wanders, -10 HP |
| Goblin | 2+ | Chases within 4 tiles, drops gold |
| Troll | 3+ | Slow patrol, -25 HP |
| Ogre | 4 | Shockwave attack, -40 HP |

## Upgrades (shop on surfacing)
| Upgrade | Cost |
|---|---|
| Pickaxe Level 2 | 200g |
| Pickaxe Level 3 | 600g |
| Max Health +25 | 150g |
| Oxygen Tank +50 | 200g |

## Run Smoke Tests
```
node tests/smoke.js
```

## Project Structure
```
goldmine/
  index.html        # Entry point
  style.css         # Layout and touch controls
  src/
    constants.js    # All tuning values and IDs
    game.js         # State machine (MENU/PLAYING/SHOP/GAME_OVER)
    loop.js         # requestAnimationFrame game loop
    input.js        # Keyboard + touch input
    world/          # Map, tiles, procedural generation
    entities/       # Player, enemies, NPCs, falling rocks
    systems/        # Renderer, camera, physics, scoring, particles, audio
    ui/             # HUD, menu, shop, game-over screens
  tests/
    smoke.js        # Node.js sanity checks (no framework needed)
```
