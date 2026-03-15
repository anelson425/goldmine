import { TILE, WORLD_COLS, CHUNK_HEIGHT } from '../constants.js';

// Zone tile probability tables [tileId, weight]
const ZONE_WEIGHTS = [
  // Zone 1: Topsoil (rows 3–10)
  [
    [TILE.DIRT,    60],
    [TILE.SAND,    15],
    [TILE.COPPER,  10],
    [TILE.GOLD,     5],
    [TILE.STONE,    7],
    [TILE.EMPTY,    3],
  ],
  // Zone 2: Stone Layer (rows 11–25)
  [
    [TILE.DIRT,    30],
    [TILE.SAND,    10],
    [TILE.STONE,   30],
    [TILE.GOLD,    12],
    [TILE.COPPER,   8],
    [TILE.EMPTY,    8],
    [TILE.WATER,    2],
  ],
  // Zone 3: Deep Mine (rows 26–50)
  [
    [TILE.DIRT,    20],
    [TILE.SAND,     5],
    [TILE.STONE,   40],
    [TILE.GOLD,     8],
    [TILE.RUBY,     4],
    [TILE.EMERALD,  3],
    [TILE.DIAMOND,  2],
    [TILE.EMPTY,    8],
    [TILE.WATER,    4],
    [TILE.LAVA,     6],
  ],
  // Zone 4: Abyss (rows 51+)
  [
    [TILE.STONE,   55],
    [TILE.GOLD,     8],
    [TILE.RUBY,     6],
    [TILE.EMERALD,  5],
    [TILE.DIAMOND,  5],
    [TILE.EMPTY,    8],
    [TILE.LAVA,     8],
    [TILE.WATER,    5],
  ],
];

function getZoneIndex(row) {
  if (row <= 10) return 0;
  if (row <= 25) return 1;
  if (row <= 50) return 2;
  return 3;
}

function pickWeighted(weights) {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [id, w] of weights) {
    r -= w;
    if (r <= 0) return id;
  }
  return weights[weights.length - 1][0];
}

/**
 * Generate a chunk of CHUNK_HEIGHT rows starting at worldRow.
 * Returns a 2D array: grid[localRow][col] = tileId
 */
export function generateChunk(startRow) {
  const grid = [];

  for (let r = 0; r < CHUNK_HEIGHT; r++) {
    const worldRow = startRow + r;
    const row = new Array(WORLD_COLS).fill(TILE.EMPTY);
    const zoneIdx = getZoneIndex(worldRow);
    const weights = ZONE_WEIGHTS[zoneIdx];

    for (let c = 0; c < WORLD_COLS; c++) {
      // Border columns are always stone
      if (c === 0 || c === WORLD_COLS - 1) {
        row[c] = TILE.STONE;
        continue;
      }
      row[c] = pickWeighted(weights);
    }
    grid.push(row);
  }

  // Cluster pass: gold, copper, gems spread to neighbours
  const ORE_SPREAD = [TILE.GOLD, TILE.COPPER, TILE.RUBY, TILE.EMERALD, TILE.DIAMOND];
  for (let r = 0; r < CHUNK_HEIGHT; r++) {
    for (let c = 1; c < WORLD_COLS - 1; c++) {
      if (ORE_SPREAD.includes(grid[r][c])) {
        spreadOre(grid, r, c, grid[r][c]);
      }
    }
  }

  // Cellular automata smoothing for empty caverns
  smoothCaverns(grid);

  // Guarantee at least one vertical passage through dirt (cols 12–18)
  ensurePassage(grid, startRow);

  return grid;
}

function spreadOre(grid, r, c, oreId) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= CHUNK_HEIGHT || nc <= 0 || nc >= WORLD_COLS - 1) continue;
    if (grid[nr][nc] === TILE.DIRT || grid[nr][nc] === TILE.STONE) {
      if (Math.random() < 0.30) grid[nr][nc] = oreId;
    }
  }
}

function smoothCaverns(grid) {
  const copy = grid.map(row => [...row]);
  for (let r = 1; r < CHUNK_HEIGHT - 1; r++) {
    for (let c = 1; c < WORLD_COLS - 1; c++) {
      let emptyNeighbours = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          if (copy[r+dr]?.[c+dc] === TILE.EMPTY) emptyNeighbours++;
        }
      }
      if (emptyNeighbours >= 4) grid[r][c] = TILE.EMPTY;
    }
  }
}

function ensurePassage(grid, startRow) {
  // Only guarantee a passage in zones 1-2 to avoid trivialising deep zones
  if (startRow > 25) return;
  const col = 10 + Math.floor(Math.random() * 8); // cols 10–17
  for (let r = 0; r < CHUNK_HEIGHT; r++) {
    if (grid[r][col] !== TILE.STONE && grid[r][col] !== TILE.WATER && grid[r][col] !== TILE.LAVA) {
      grid[r][col] = TILE.DIRT;
    }
  }
}

/** Generate the surface rows (rows 0-2): sky and grass. */
export function generateSurface() {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new Array(WORLD_COLS).fill(r < 2 ? TILE.SKY : TILE.SURFACE);
    row[0] = TILE.STONE;
    row[WORLD_COLS - 1] = TILE.STONE;
    rows.push(row);
  }
  return rows;
}
