import { CANVAS_W, CANVAS_H, TILE_SIZE, TILE } from './constants.js';
import { World }       from './world/world.js';
import { Player }      from './entities/player.js';
import { Bat }         from './entities/bat.js';
import { Goblin }      from './entities/goblin.js';
import { Troll }       from './entities/troll.js';
import { Ogre }        from './entities/ogre.js';
import { FallingRock } from './entities/fallingrock.js';
import { Wizard }      from './entities/wizard.js';
import { Shopkeeper }  from './entities/shopkeeper.js';
import { MinerGhost }  from './entities/minerghost.js';
import { Input }       from './input.js';
import { Scoring }     from './systems/scoring.js';
import { Renderer }    from './systems/renderer.js';
import { Camera }      from './systems/camera.js';
import { Physics }     from './systems/physics.js';
import { Particles }   from './systems/particles.js';
import { Audio }       from './systems/audio.js';
import { drawHUD }     from './ui/hud.js';
import { drawMenu }    from './ui/menu.js';
import { ShopUI }      from './ui/shop.js';
import { drawGameOver }from './ui/gameover.js';

const STATE = { MENU: 'MENU', PLAYING: 'PLAYING', SHOP: 'SHOP', GAME_OVER: 'GAME_OVER' };

export class Game {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');

    this.input    = new Input();
    this.audio    = new Audio();
    this.scoring  = new Scoring();
    this.renderer = new Renderer(canvas);
    this.shopUI   = new ShopUI();

    this.state    = STATE.MENU;
    this._phase   = 0;   // generic timer for animations
    this._shopMsg = '';
    this._shopMsgTimer = 0;

    // These are initialised when PLAYING starts
    this.world    = null;
    this.player   = null;
    this.camera   = null;
    this.physics  = null;
    this.particles= null;
    this.entities = [];

    // Enemy spawn tracking
    this._lastSpawnRow   = 0;
    this._spawnCooldown  = 0;
  }

  // ── State transitions ─────────────────────────────────────────────────────

  _startGame() {
    this.input.flush();   // discard any stale actions from menu/shop
    this.world     = new World();
    this.scoring.newRun();
    this.camera    = new Camera();
    this.physics   = new Physics(this.world, this.camera);
    this.particles = new Particles();
    this.entities  = [];
    this._lastSpawnRow  = 0;
    this._spawnCooldown = 0;
    this.player    = new Player(this.world, this.scoring);
    this._wentUnderground = false;  // shop can't trigger until player digs down
    this.state     = STATE.PLAYING;
    this.audio.startMusic();
  }

  _openShop() {
    this.scoring.bankGold();
    this.shopUI.selectedIdx = 0;
    this._shopMsg      = '';
    this._shopMsgTimer = 0;
    this.state = STATE.SHOP;
  }

  _continueAfterShop() {
    this._startGame();
  }

  _gameOver() {
    this.state = STATE.GAME_OVER;
    this.audio.death();
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(delta) {
    this._phase += delta;

    // M key toggles music from any state — scan queue without consuming other actions
    const mi = this.input.queue.indexOf('music');
    if (mi !== -1) { this.input.queue.splice(mi, 1); this.audio.toggleMusic(); }

    switch (this.state) {
      case STATE.MENU:      this._updateMenu(delta);     break;
      case STATE.PLAYING:   this._updatePlaying(delta);  break;
      case STATE.SHOP:      this._updateShop(delta);     break;
      case STATE.GAME_OVER: this._updateGameOver(delta); break;
    }
  }

  _updateMenu(delta) {
    let action;
    while ((action = this.input.consume())) {
      if (action === 'interact' || action === 'bomb') {
        this._startGame();
        return;
      }
    }
  }

  _updatePlaying(delta) {
    // Clear camera nudge from previous frame at start of this frame
    this.camera._nudgeX = 0;
    this.camera._nudgeY = 0;

    const player   = this.player;
    const world    = this.world;
    const camera   = this.camera;
    const particles= this.particles;
    const dirOffsets = { up: [0,-2], down: [0,2], left: [-2,0], right: [2,0] };

    // Held direction keys — move every frame (throttled by player._moveCooldown)
    for (const dir of this.input.heldDirs) {
      const prevRow = player.row;
      const prevCol = player.col;
      player.tryMove(dir, 0, this.entities);
      if (player.col !== prevCol || player.row !== prevRow) {
        if (player.digTarget && player.col === player.digTarget.col && player.row === player.digTarget.row) {
          const tx = player.col * TILE_SIZE + TILE_SIZE / 2;
          const ty = player.row * TILE_SIZE + TILE_SIZE / 2;
          particles.digSparks(tx, ty);
          particles.digSparks(tx, ty);
          this.audio.dig();
        }
      } else if (player.digTarget) {
        const tx = player.digTarget.col * TILE_SIZE + TILE_SIZE / 2;
        const ty = player.digTarget.row * TILE_SIZE + TILE_SIZE / 2;
        particles.digSparks(tx, ty);
        const [nx, ny] = dirOffsets[dir] ?? [0, 0];
        camera.nudge(nx, ny);
        this.audio.dig();
      }
    }

    // Drain input queue (non-direction actions only; directions handled by heldDirs above)
    let action;
    while ((action = this.input.consume())) {
      if (action === 'interact') {
        // Check adjacent NPCs
        this._tryInteractNPC();
      } else if (action === 'bomb') {
        if (player.hasBomb) { player.useBomb(); this.audio.bomb(); camera.shake(); }
      } else if (action === 'rope') {
        if (player.hasRope) { player.useRope(); }
      }
    }

    // Track whether player has gone underground this run
    if (player.row >= 5) this._wentUnderground = true;

    // Player update
    const wasOnSurface = player.onSurface;
    player.update(delta);

    // Check surfacing — only trigger after player has gone underground this run
    if (player.onSurface && !wasOnSurface && this._wentUnderground && player.alive) {
      this._openShop();
      return;
    }

    // Check death
    if (!player.alive) {
      this._gameOver();
      return;
    }

    // Spawn entities near player
    this._spawnEntities();

    // Update entities
    for (const e of this.entities) {
      if (typeof e.update === 'function') {
        e.update(delta, world, player, camera);
      }
    }

    // Physics
    this.physics.update(delta, this.entities, player);

    // Remove dead entities, collect drops
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.dead) {
        if (e.drop > 0) {
          this.scoring.addRunGold(e.drop);
          particles.goldSparkle(e.col * TILE_SIZE + TILE_SIZE / 2, e.row * TILE_SIZE + TILE_SIZE / 2);
          this.audio.gold();
        }
        this.entities.splice(i, 1);
      }
    }

    // Enemy combat with player — damage particles
    for (const e of this.entities) {
      if (['bat','goblin','troll','ogre'].includes(e.type)) {
        if (e.col === player.col && e.row === player.row) {
          // Feedback only — takeDamage() is called by each entity's update() above;
          // guard here prevents audio/particle spam during the iFrames window.
          if (player.iFrames <= 0) {
            particles.hitEffect(player.px + TILE_SIZE/2, player.py + TILE_SIZE/2);
            this.audio.hurt();
          }
        }
      }
    }

    // Camera
    camera.follow(player);
    camera.update(delta);
    particles.update(delta);

    // Shop keeper navigation while open
    for (const e of this.entities) {
      if (e.type === 'shopkeeper' && e.open) {
        // handled in interact
      }
    }
  }

  _updateShop(delta) {
    if (this._shopMsgTimer > 0) this._shopMsgTimer = Math.max(0, this._shopMsgTimer - delta);

    let action;
    while ((action = this.input.consume())) {
      if (action === 'up')   this.shopUI.navUp();
      if (action === 'down') this.shopUI.navDown();
      if (action === 'interact' || action === 'bomb') {
        // 'interact' = E = confirm buy; 'bomb' = Enter (mapped below)
        const id = this.shopUI.tryBuy(this.player, this.scoring);
        if (id) {
          this._shopMsg      = 'Purchased!';
          this._shopMsgTimer = 2;
          this.audio.buy();
        } else {
          this._shopMsg      = 'Not enough gold!';
          this._shopMsgTimer = 1.5;
        }
      }
      if (action === 'rope') {   // C / rope key = continue
        this._continueAfterShop();
        return;
      }
    }
  }

  _updateGameOver(delta) {
    let action;
    while ((action = this.input.consume())) {
      if (action === 'interact' || action === 'bomb') {
        this.state = STATE.MENU;
      }
    }
  }

  // ── Entity Spawning ───────────────────────────────────────────────────────

  _spawnEntities() {
    const player = this.player;
    const world  = this.world;
    this._spawnCooldown -= 1;
    if (this._spawnCooldown > 0) return;
    this._spawnCooldown = 60;

    const depth = player.row;
    if (depth <= 5) return;

    // Spawn up to 8 enemies total within viewport
    const enemyCount = this.entities.filter(e => ['bat','goblin','troll','ogre'].includes(e.type)).length;
    if (enemyCount >= 8) return;

    // Pick a random off-screen tile nearby
    const col = 1 + Math.floor(Math.random() * 28);
    const row = player.row + 4 + Math.floor(Math.random() * 10);
    if (world.getTile(col, row) !== TILE.EMPTY) return;

    let enemy;
    if (depth > 50) {
      const r = Math.random();
      if (r < 0.3) enemy = new Ogre(col, row);
      else if (r < 0.6) enemy = new Bat(col, row);
      else enemy = new Goblin(col, row);
    } else if (depth > 25) {
      const r = Math.random();
      if (r < 0.3) enemy = new Troll(col, row);
      else if (r < 0.65) enemy = new Goblin(col, row);
      else enemy = new Bat(col, row);
    } else {
      enemy = Math.random() < 0.6 ? new Bat(col, row) : new Goblin(col, row);
    }

    this.entities.push(enemy);

    // Spawn NPC rooms rarely in fresh chunks
    if (row > this._lastSpawnRow + 15) {
      this._lastSpawnRow = row;
      this._trySpawnNPC(col, row);
    }
  }

  _trySpawnNPC(nearCol, nearRow) {
    const r = Math.random();
    const depth = this.player.row;
    let npc = null;

    if (r < 0.06) {
      npc = new MinerGhost(nearCol, nearRow + 2);
    } else if (r < 0.14 && depth >= 11) {
      npc = new Wizard(nearCol, nearRow + 3);
    } else if (r < 0.18 && depth >= 26) {
      npc = new Shopkeeper(nearCol, nearRow + 2);
    }

    if (npc) {
      // Clear the NPC's tile
      this.world.setTile(npc.col, npc.row, TILE.EMPTY);
      this.entities.push(npc);
    }
  }

  _tryInteractNPC() {
    const p = this.player;
    for (const e of this.entities) {
      if (!['wizard','shopkeeper','minerghost'].includes(e.type)) continue;
      const dx = Math.abs(e.col - p.col);
      const dy = Math.abs(e.row - p.row);
      if (dx <= 1 && dy <= 1) {
        if (e.type === 'wizard')      e.interact(p, this.scoring, this.audio);
        if (e.type === 'shopkeeper')  e.interact(p, this.scoring, this.audio);
        if (e.type === 'minerghost')  e.interact(p, this.scoring, this.audio);
        break;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const ctx = this.ctx;
    this.renderer.clear();

    switch (this.state) {
      case STATE.MENU:
        drawMenu(ctx, this.scoring.highScore, this._phase);
        break;

      case STATE.PLAYING: {
        this.renderer.drawBackground(this.camera);
        this.renderer.drawWorld(this.world, this.camera, 0.016);
        this.renderer.drawEntities(this.entities, this.camera);
        this.renderer.drawPlayer(this.player, this.camera);
        // Red damage flash — fades over iFrames duration
        if (this.player.iFrames > 0) {
          const alpha = (this.player.iFrames / 0.5) * 0.35;
          this.ctx.fillStyle = `rgba(220, 30, 30, ${alpha})`;
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.particles.draw(ctx, this.camera);
        const depth = Math.max(0, this.player.row - 2);
        drawHUD(ctx, this.player, this.scoring, depth);
        break;
      }

      case STATE.SHOP:
        this.renderer.drawBackground(this.camera);
        this.renderer.drawWorld(this.world, this.camera, 0);
        this.renderer.drawPlayer(this.player, this.camera);
        this.shopUI.draw(ctx, this.scoring, this.player, this._shopMsgTimer > 0 ? this._shopMsg : '');
        break;

      case STATE.GAME_OVER:
        drawGameOver(ctx, this.scoring, this._phase);
        break;
    }
  }
}
