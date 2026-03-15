import { TILE, WORLD_COLS, CHUNK_HEIGHT, GEN_AHEAD_ROWS } from '../constants.js';
import { generateChunk, generateSurface } from './generator.js';
import { getTileDef } from './tiles.js';

export class World {
  constructor() {
    // grid[row][col] = tileId; grows downward as chunks are generated
    this.grid = [];
    // Per-tile HP tracking: key "r,c" -> remaining HP
    this.tileHP = new Map();
    this.entities = [];   // enemies, NPCs, falling rocks (managed externally)
    this._init();
  }

  _init() {
    // Surface rows
    const surface = generateSurface();
    for (const row of surface) this.grid.push(row);

    // Generate initial chunks
    for (let i = 0; i < 4; i++) {
      this._addChunk();
    }
  }

  _addChunk() {
    const startRow = this.grid.length;
    const chunk = generateChunk(startRow);
    for (const row of chunk) this.grid.push(row);
  }

  get totalRows() { return this.grid.length; }

  /** Ensure enough rows are generated ahead of the player. */
  ensureGenerated(playerRow) {
    while (playerRow + GEN_AHEAD_ROWS >= this.totalRows) {
      this._addChunk();
    }
  }

  getTile(col, row) {
    if (col < 0 || col >= WORLD_COLS || row < 0) return TILE.STONE;
    if (row >= this.totalRows) return TILE.EMPTY;
    return this.grid[row][col];
  }

  setTile(col, row, id) {
    if (row < 0 || row >= this.totalRows || col < 0 || col >= WORLD_COLS) return;
    this.grid[row][col] = id;
    this.tileHP.delete(`${row},${col}`);
  }

  /** Returns current HP of a tile (initialises from tile def on first access). */
  getTileHP(col, row) {
    const key = `${row},${col}`;
    if (!this.tileHP.has(key)) {
      const def = getTileDef(this.getTile(col, row));
      this.tileHP.set(key, def.hp);
    }
    return this.tileHP.get(key);
  }

  /**
   * Apply dig damage to a tile.
   * Returns { destroyed, reward } where destroyed=true means the tile is gone.
   */
  digTile(col, row, strength) {
    const tileId = this.getTile(col, row);
    const def = getTileDef(tileId);
    if (!def.diggable) return { destroyed: false, reward: 0 };

    const key = `${row},${col}`;
    let hp = this.getTileHP(col, row);
    hp = Math.max(0, hp - strength);
    this.tileHP.set(key, hp);

    if (hp <= 0) {
      this.setTile(col, row, TILE.EMPTY);
      return { destroyed: true, reward: def.reward };
    }
    return { destroyed: false, reward: 0 };
  }
}
