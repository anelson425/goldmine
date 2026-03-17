import { HIGHSCORE_KEY } from '../constants.js';

export class Scoring {
  constructor() {
    this.currentRunGold = 0;   // gold this descent (lost on death)
    this.bankedGold     = 0;   // gold safely surfaced (used for upgrades)
    this.totalScore     = 0;   // all-time cumulative (persisted)
    this.lostGold       = 0;   // run gold lost on last death
    this._goldBankedThisRun = false;

    // Load persisted high score
    try {
      this.highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) ?? '0', 10) || 0;
    } catch {
      this.highScore = 0;
    }
  }

  addRunGold(amount) {
    if (amount <= 0) return;
    this.currentRunGold += amount;
    this._goldBankedThisRun = false;
  }

  /** Called when player returns to surface. Banks currentRunGold. */
  bankGold() {
    if (this._goldBankedThisRun || this.currentRunGold === 0) return;
    this._goldBankedThisRun = true;
    this.bankedGold   += this.currentRunGold;
    this.totalScore   += this.currentRunGold;
    this.currentRunGold = 0;

    if (this.totalScore > this.highScore) {
      this.highScore = this.totalScore;
      try { localStorage.setItem(HIGHSCORE_KEY, String(this.highScore)); } catch {}
    }
  }

  /** Called on player death. Run gold is lost. */
  onDeath() {
    this.lostGold = this.currentRunGold;
    this.currentRunGold = 0;
    this._goldBankedThisRun = false;
  }

  /** Spend banked gold for an upgrade. Returns true if successful. */
  spend(amount) {
    if (this.bankedGold < amount) return false;
    this.bankedGold -= amount;
    return true;
  }

  /** Spend from run gold first, then banked gold. Used by secret shop. */
  spendAny(amount) {
    if (this.currentRunGold + this.bankedGold < amount) return false;
    const fromRun = Math.min(this.currentRunGold, amount);
    this.currentRunGold -= fromRun;
    this.bankedGold -= (amount - fromRun);
    return true;
  }

  /** Display-ready gold total for HUD. */
  get displayGold() {
    return this.bankedGold + this.currentRunGold;
  }

  /** Reset for a new run (called after shop). */
  newRun() {
    this.currentRunGold = 0;
    this._goldBankedThisRun = false;
  }
}
