import { Game }     from './game.js';
import { GameLoop } from './loop.js';
import { CANVAS_W, CANVAS_H } from './constants.js';

const canvas = document.getElementById('game');
canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

const game = new Game(canvas);
const loop = new GameLoop(game);

// Expose input for touch controls defined in index.html
window._gameInput = game.input;

// Map Enter key to 'interact' action in all states
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    game.input.queue.push('interact');
  }
  // C key = continue from shop
  if (e.key === 'c' || e.key === 'C') {
    game.input.queue.push('rope');
  }
});

loop.start();
