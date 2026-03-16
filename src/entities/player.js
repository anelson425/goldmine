import {
  TILE_SIZE,
  PLAYER_START_HP, PLAYER_MAX_HP_BASE, PLAYER_OXYGEN_BASE,
  OXYGEN_DEPTH_ROW, OXYGEN_DRAIN_RATE, OXYGEN_HP_DRAIN,
  PICKAXE, TILE, MOVE_COOLDOWN_MS,
} from '../constants.js';
import { getTileDef } from '../world/tiles.js';

export class Player {
  constructor(world, scoring) {
    this.world   = world;
    this.scoring = scoring;

    // Grid position
    this.col = Math.floor(15);   // start near centre
    this.row = 2;                // surface row

    // Stats
    this.maxHp      = PLAYER_MAX_HP_BASE;
    this.hp         = PLAYER_START_HP;
    this.maxOxygen  = PLAYER_OXYGEN_BASE;
    this.oxygen     = PLAYER_OXYGEN_BASE;
    this.pickaxeLevel = 1;

    // State
    this.alive       = true;
    this.onSurface   = true;
    this.interacting = false;    // set when adjacent to NPC and E pressed

    // Animation / dig feedback
    this.digTarget   = null;     // { col, row } tile currently being dug
    this.digTimer    = 0;        // seconds remaining in dig animation

    // Move cooldown
    this._moveCooldown = 0;      // ms remaining

    // Inventory (special items from NPCs)
    this.hasBomb     = false;
    this.hasRope     = false;
    this.hasLantern  = false;
    this.ghostMode   = 0;        // seconds remaining
    this.iFrames     = 0;        // seconds of invincibility remaining after a hit

    // Pixel position for smooth rendering (interpolated)
    this.px = this.col * 40;
    this.py = this.row * 40;
  }

  get digStrength() {
    const lvl = PICKAXE[this.pickaxeLevel];
    return lvl ? lvl.digStrength : 1;
  }

  /** Called by the input system. direction: 'up'|'down'|'left'|'right' */
  tryMove(dir, deltaMs) {
    if (!this.alive) return;
    this._moveCooldown -= deltaMs;
    if (this._moveCooldown > 0) return;

    const deltas = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
    const [dc, dr] = deltas[dir];
    const tc = this.col + dc;
    const tr = this.row + dr;

    const tileId = this.world.getTile(tc, tr);
    const def    = getTileDef(tileId);

    if (def.instakill) {
      // Lava — instant death
      this._die();
      return;
    }

    if (def.hazard) {
      // Water — damage and push back
      this.takeDamage(def.hazardDamage ?? 20);
      this._moveCooldown = MOVE_COOLDOWN_MS;
      return;
    }

    if (def.diggable) {
      // Dig the tile
      const pickaxeLvl = PICKAXE[this.pickaxeLevel];
      // Override HP for stone/diamond based on pickaxe level
      let strength = this.digStrength;
      if (tileId === TILE.STONE && pickaxeLvl && this.pickaxeLevel >= 2) strength = 99;
      if (tileId === TILE.DIAMOND && pickaxeLvl && this.pickaxeLevel >= 3) strength = 99;

      const { destroyed, reward } = this.world.digTile(tc, tr, strength);
      if (destroyed) {
        this.scoring.addRunGold(reward);
        this.col = tc;
        this.row = tr;
      }
      this.digTarget = { col: tc, row: tr };
      this.digTimer  = 0.12;
      this._moveCooldown = MOVE_COOLDOWN_MS;
      return;
    }

    if (!def.solid || this.ghostMode > 0) {
      // Move freely
      this.col = tc;
      this.row = tr;
      this.digTarget = null;   // clear stale reference to prevent false destroy-detection
      this._moveCooldown = MOVE_COOLDOWN_MS;
    }
  }

  /** Use bomb: destroy 3×3 area centred on player */
  useBomb() {
    if (!this.hasBomb) return;
    this.hasBomb = false;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const { reward } = this.world.digTile(this.col + dc, this.row + dr, 99);
        this.scoring.addRunGold(reward);
      }
    }
  }

  /** Use rope: teleport back to surface */
  useRope() {
    if (!this.hasRope) return;
    this.hasRope = false;
    this.row = 2;
    this.col = 15;
    this.px = this.col * TILE_SIZE;
    this.py = this.row * TILE_SIZE;
  }

  takeDamage(amount) {
    if (this.iFrames > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.iFrames = 0.5;
    if (this.hp <= 0) this._die();
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  refillOxygen() {
    this.oxygen = this.maxOxygen;
  }

  _die() {
    this.alive = false;
    this.scoring.onDeath();
  }

  update(delta) {
    if (!this.alive) return;

    // Ghost mode countdown
    if (this.ghostMode > 0) this.ghostMode = Math.max(0, this.ghostMode - delta);

    // iFrames countdown
    if (this.iFrames > 0) this.iFrames = Math.max(0, this.iFrames - delta);

    // Oxygen depletion below depth threshold
    this.onSurface = this.row <= 2;
    if (this.row > OXYGEN_DEPTH_ROW) {
      this.oxygen = Math.max(0, this.oxygen - OXYGEN_DRAIN_RATE * delta);
      if (this.oxygen <= 0) {
        this.takeDamage(OXYGEN_HP_DRAIN * delta);
      }
    } else if (this.row <= 2) {
      // Restore oxygen on surface
      this.oxygen = this.maxOxygen;
      // Bank gold on surface
      this.scoring.bankGold();
    }

    // Dig animation timer
    if (this.digTimer > 0) {
      this.digTimer = Math.max(0, this.digTimer - delta);
    }

    // Smooth pixel position (lerp toward grid position)
    this.px += (this.col * TILE_SIZE - this.px) * Math.min(1, delta * 12);
    this.py += (this.row * TILE_SIZE - this.py) * Math.min(1, delta * 12);

    // Ensure world is generated ahead
    this.world.ensureGenerated(this.row);
  }
}
