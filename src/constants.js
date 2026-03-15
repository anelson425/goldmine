// ── Canvas & Viewport ────────────────────────────────────────────────────────
export const CANVAS_W = 600;
export const CANVAS_H = 600;
export const TILE_SIZE = 40;           // pixels per tile
export const VIEWPORT_COLS = 15;       // tiles visible horizontally
export const VIEWPORT_ROWS = 15;       // tiles visible vertically
export const WORLD_COLS = 30;          // world width in tiles

// ── Tile IDs ─────────────────────────────────────────────────────────────────
export const TILE = Object.freeze({
  EMPTY:   0,
  DIRT:    1,
  SAND:    2,
  STONE:   3,
  COPPER:  4,
  GOLD:    5,
  RUBY:    6,
  EMERALD: 7,
  DIAMOND: 8,
  WATER:   9,
  LAVA:    10,
  SURFACE: 11,   // grass/sky surface row
  SKY:     12,
});

// ── Depth Zones (tile row ranges) ─────────────────────────────────────────────
export const ZONES = [
  { name: 'Topsoil',    minRow: 3,  maxRow: 10  },
  { name: 'Stone Layer',minRow: 11, maxRow: 25  },
  { name: 'Deep Mine',  minRow: 26, maxRow: 50  },
  { name: 'Abyss',      minRow: 51, maxRow: Infinity },
];

// ── Player Defaults ───────────────────────────────────────────────────────────
export const PLAYER_START_HP     = 100;
export const PLAYER_MAX_HP_BASE  = 100;
export const PLAYER_OXYGEN_BASE  = 100;
export const OXYGEN_DEPTH_ROW    = 30;   // oxygen starts depleting below this row
export const OXYGEN_DRAIN_RATE   = 1;    // units per second below depth
export const OXYGEN_HP_DRAIN     = 5;    // HP lost per second when oxygen = 0
export const MOVE_COOLDOWN_MS    = 150;  // ms between moves when holding key

// ── Pickaxe Levels ────────────────────────────────────────────────────────────
export const PICKAXE = Object.freeze([
  null,                                 // index 0 unused
  { digStrength: 1, stoneHits: 2, diamondHits: 2 },   // level 1
  { digStrength: 2, stoneHits: 1, diamondHits: 2 },   // level 2
  { digStrength: 3, stoneHits: 1, diamondHits: 1 },   // level 3 (blast radius)
]);

// ── Enemy Stats ───────────────────────────────────────────────────────────────
export const ENEMY = Object.freeze({
  BAT:    { hp: 1, damage: 10, speed: 0.8,  drop: 0  },
  GOBLIN: { hp: 2, damage: 15, speed: 1.2,  drop: 5  },
  TROLL:  { hp: 5, damage: 25, speed: 0.5,  drop: 20 },
  OGRE:   { hp: 8, damage: 40, speed: 0.3,  drop: 50 },
});

// ── NPC Spawn Rates (per chunk) ───────────────────────────────────────────────
export const NPC_RATES = Object.freeze({
  WIZARD:      0.08,
  SHOPKEEPER:  0.04,
  MINER_GHOST: 0.06,
});

// ── Upgrade Shop ──────────────────────────────────────────────────────────────
export const UPGRADES = [
  { id: 'pickaxe2', label: 'Pickaxe Level 2',  cost: 200, desc: 'Stone breaks in 1 hit' },
  { id: 'pickaxe3', label: 'Pickaxe Level 3',  cost: 600, desc: 'Diamonds break in 1 hit' },
  { id: 'health',   label: 'Max Health +25',   cost: 150, desc: 'Survive longer underground' },
  { id: 'oxygen',   label: 'Oxygen Tank +50',  cost: 200, desc: 'Breathe deeper' },
];

// ── Chunk Generation ──────────────────────────────────────────────────────────
export const CHUNK_HEIGHT = 20;        // rows generated at a time
export const GEN_AHEAD_ROWS = 10;      // generate new chunk when player is this close to bottom

// ── Scoring ───────────────────────────────────────────────────────────────────
export const HIGHSCORE_KEY = 'goldmine_highscore';
