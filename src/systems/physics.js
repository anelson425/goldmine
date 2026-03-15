import { TILE } from '../constants.js';
import { getTileDef } from '../world/tiles.js';

/** Physics: handles sand/falling rock gravity and entity movement ticks. */
export class Physics {
  constructor(world, camera) {
    this.world  = world;
    this.camera = camera;
    this._sandTimer = 0;
  }

  /**
   * Update physics simulation.
   * fallingRocks: array of FallingRock entities (mutated in-place)
   * Returns list of newly-created falling rocks from sand/gravity tiles.
   */
  update(delta, entities, player) {
    this._sandTimer += delta;
    const newEntities = [];

    // Sand gravity tick every 0.3s
    if (this._sandTimer >= 0.3) {
      this._sandTimer = 0;
      newEntities.push(...this._tickSandGravity(player));
    }

    // Tick falling rocks
    for (const e of entities) {
      if (e.type === 'fallingrock') {
        e.update(delta, this.world, player, this.camera);
      }
    }

    return newEntities;
  }

  _tickSandGravity(player) {
    const world = this.world;
    const newEntities = [];

    // Scan all visible rows + buffer for sand tiles
    const scanStart = Math.max(0, player.row - 20);
    const scanEnd   = Math.min(world.totalRows - 1, player.row + 20);

    // Scan bottom-up so falling sand doesn't get double-processed
    for (let row = scanEnd; row >= scanStart; row--) {
      for (let col = 1; col < 30 - 1; col++) {
        if (world.getTile(col, row) !== TILE.SAND) continue;
        const below = world.getTile(col, row + 1);
        const belowDef = getTileDef(below);
        if (!belowDef.solid) {
          // Sand falls
          world.setTile(col, row + 1, TILE.SAND);
          world.setTile(col, row,     TILE.EMPTY);

          // Damage player if sand falls on them
          if (col === player.col && row + 1 === player.row) {
            player.takeDamage(15);
          }
        }
      }
    }

    return newEntities;
  }
}
