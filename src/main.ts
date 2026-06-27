// ---------------------------------------------------------------------------
// Entry point. Wires input + audio + game + renderer and runs a fixed-timestep
// loop (physics at TICK_HZ, rendering every animation frame) so motion stays
// smooth and identical across 60Hz and 120Hz (ProMotion) displays.
// ---------------------------------------------------------------------------

import { TICK_DT } from "./constants";
import { Audio } from "./audio";
import { Input } from "./input";
import { Game } from "./game";
import { Renderer } from "./render";

const canvas = document.getElementById("screen") as HTMLCanvasElement;

const audio = new Audio();
const input = new Input();
const game = new Game(input, audio);
const renderer = new Renderer(canvas);

// Unlock audio on the very first interaction.
input.onFirstGesture = () => audio.unlock();

// Let input map screen taps into virtual coordinates.
input.toVirtual = (cx, cy) => renderer.clientToVirtual(cx, cy);
input.attach(canvas);

function resize() {
  renderer.resize();
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize();

// --- Global controls -------------------------------------------------------
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyC") renderer.crt = !renderer.crt;
  if (e.code === "KeyM") audio.toggleMute();
});

// --- Menu / start handling -------------------------------------------------
function handleMenuInput() {
  if (game.phase === "menu") {
    // Adjust difficulty with arrows / + / - before starting.
    if (input.consume("ArrowRight") || input.consume("Equal")) game.cycleDifficulty(1);
    if (input.consume("ArrowLeft") || input.consume("Minus")) game.cycleDifficulty(-1);

    if (input.consume("Digit1") || input.consume("Numpad1")) game.start("1p");
    else if (input.consume("Digit2") || input.consume("Numpad2"))
      game.start("2p");
    // A tap/click/space defaults to 1-player so touch users can just go.
    else if (input.consumeConfirm()) game.start("1p");
  } else if (game.phase === "gameover") {
    if (input.consumeConfirm() || input.consume("Digit1")) game.start("1p");
    else if (input.consume("Digit2")) game.start("2p");
  }
}

// --- Fixed-timestep loop ---------------------------------------------------
let last = performance.now();
let acc = 0;
const MAX_FRAME = 0.25; // clamp huge gaps (tab switch) to avoid spiral

function frame(now: number) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > MAX_FRAME) dt = MAX_FRAME;
  acc += dt;

  handleMenuInput();

  while (acc >= TICK_DT) {
    game.step();
    acc -= TICK_DT;
  }

  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
