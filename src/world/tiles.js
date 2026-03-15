import { TILE } from '../constants.js';

// Each tile definition:
//   id        - matches TILE constant
//   name      - display name
//   solid     - blocks movement entirely (cannot pass or dig)
//   diggable  - can be dug with pickaxe
//   hp        - hits to destroy (base; pickaxe level may override)
//   reward    - gold awarded when destroyed
//   hazard    - true if contact damages player
//   instakill - true if contact kills instantly (lava)
//   gravity   - true if tile falls when tile below is empty (sand, falling rock)
//   color     - fallback color for development rendering

export const TILE_DEFS = {
  [TILE.EMPTY]:   { id: TILE.EMPTY,   name: 'Empty',        solid: false, diggable: false, hp: 0, reward: 0,   hazard: false, instakill: false, gravity: false, color: '#1a1a2e' },
  [TILE.SKY]:     { id: TILE.SKY,     name: 'Sky',          solid: false, diggable: false, hp: 0, reward: 0,   hazard: false, instakill: false, gravity: false, color: '#87ceeb' },
  [TILE.SURFACE]: { id: TILE.SURFACE, name: 'Surface',      solid: false, diggable: false, hp: 0, reward: 0,   hazard: false, instakill: false, gravity: false, color: '#4caf50' },
  [TILE.DIRT]:    { id: TILE.DIRT,    name: 'Dirt',         solid: true,  diggable: true,  hp: 1, reward: 0,   hazard: false, instakill: false, gravity: false, color: '#8b5e3c' },
  [TILE.SAND]:    { id: TILE.SAND,    name: 'Sand',         solid: true,  diggable: true,  hp: 1, reward: 0,   hazard: false, instakill: false, gravity: true,  color: '#d4b483' },
  [TILE.STONE]:   { id: TILE.STONE,   name: 'Stone',        solid: true,  diggable: true,  hp: 2, reward: 0,   hazard: false, instakill: false, gravity: false, color: '#7a7a8c' },
  [TILE.COPPER]:  { id: TILE.COPPER,  name: 'Copper Ore',   solid: true,  diggable: true,  hp: 1, reward: 5,   hazard: false, instakill: false, gravity: false, color: '#b87333' },
  [TILE.GOLD]:    { id: TILE.GOLD,    name: 'Gold Ore',     solid: true,  diggable: true,  hp: 1, reward: 10,  hazard: false, instakill: false, gravity: false, color: '#ffd700' },
  [TILE.RUBY]:    { id: TILE.RUBY,    name: 'Ruby',         solid: true,  diggable: true,  hp: 1, reward: 50,  hazard: false, instakill: false, gravity: false, color: '#e63946' },
  [TILE.EMERALD]: { id: TILE.EMERALD, name: 'Emerald',      solid: true,  diggable: true,  hp: 1, reward: 30,  hazard: false, instakill: false, gravity: false, color: '#2dc653' },
  [TILE.DIAMOND]: { id: TILE.DIAMOND, name: 'Diamond',      solid: true,  diggable: true,  hp: 2, reward: 100, hazard: false, instakill: false, gravity: false, color: '#a8e6f0' },
  [TILE.WATER]:   { id: TILE.WATER,   name: 'Water',        solid: true,  diggable: false, hp: 0, reward: 0,   hazard: true,  instakill: false, gravity: false, color: '#1565c0', hazardDamage: 20 },
  [TILE.LAVA]:    { id: TILE.LAVA,    name: 'Lava',         solid: true,  diggable: false, hp: 0, reward: 0,   hazard: true,  instakill: true,  gravity: false, color: '#ff4500' },
};

/** Get tile definition by tile ID. */
export function getTileDef(id) {
  return TILE_DEFS[id] ?? TILE_DEFS[TILE.EMPTY];
}
