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

loop.start();
