// ---------------------------------------------------------------------------
// Renderer. Draws the virtual playfield to a canvas sized to the device, with
// crisp (non-smoothed) rectangles and an optional CRT overlay.
// ---------------------------------------------------------------------------

import {
  FIELD_W,
  FIELD_H,
  PADDLE_W,
  PADDLE_H,
  PADDLE_INSET,
  BALL_SIZE,
  NET_DASH,
  NET_GAP,
  NET_W,
  COLOR_FG,
  COLOR_BG,
  WIN_SCORE,
  DIFFICULTY,
} from "./constants";
import { drawNumber } from "./font";
import type { Game } from "./game";

export class Renderer {
  ctx: CanvasRenderingContext2D;
  // Retro CRT look is the default; toggle with `C`.
  crt = true;

  /** Scale + offset mapping virtual coords -> canvas pixels. */
  private scale = 1;
  private offX = 0;
  private offY = 0;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  /** Resize the backing store to the window and recompute the fit transform. */
  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);

    // Fit the 4:3 field inside the screen (letterbox), keeping it centered.
    const sx = this.canvas.width / FIELD_W;
    const sy = this.canvas.height / FIELD_H;
    this.scale = Math.min(sx, sy);
    this.offX = (this.canvas.width - FIELD_W * this.scale) / 2;
    this.offY = (this.canvas.height - FIELD_H * this.scale) / 2;

    this.ctx.imageSmoothingEnabled = false;
  }

  /** Convert a client (CSS px) point into virtual playfield coords. */
  clientToVirtual(clientX: number, clientY: number): { x: number; y: number } {
    const px = clientX * this.dpr;
    const py = clientY * this.dpr;
    return {
      x: (px - this.offX) / this.scale,
      y: (py - this.offY) / this.scale,
    };
  }

  private fx(x: number): number {
    return this.offX + x * this.scale;
  }
  private fy(y: number): number {
    return this.offY + y * this.scale;
  }
  private fs(n: number): number {
    return n * this.scale;
  }

  draw(g: Game): void {
    const ctx = this.ctx;
    // Background (whole canvas, including letterbox bars).
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = COLOR_FG;

    // Net (dashed center line).
    const netX = FIELD_W / 2 - NET_W / 2;
    for (let y = 0; y < FIELD_H; y += NET_DASH + NET_GAP) {
      ctx.fillRect(this.fx(netX), this.fy(y), this.fs(NET_W), this.fs(NET_DASH));
    }

    // Scores.
    const px = this.fs(16);
    drawNumber(ctx, g.score1, this.fx(FIELD_W * 0.25), this.fy(40), px);
    drawNumber(ctx, g.score2, this.fx(FIELD_W * 0.75), this.fy(40), px);

    // Paddles.
    ctx.fillRect(
      this.fx(PADDLE_INSET),
      this.fy(g.p1y),
      this.fs(PADDLE_W),
      this.fs(PADDLE_H),
    );
    ctx.fillRect(
      this.fx(FIELD_W - PADDLE_INSET - PADDLE_W),
      this.fy(g.p2y),
      this.fs(PADDLE_W),
      this.fs(PADDLE_H),
    );

    // Ball (only when in play).
    if (g.phase === "rally") {
      ctx.fillRect(
        this.fx(g.bx - BALL_SIZE / 2),
        this.fy(g.by - BALL_SIZE / 2),
        this.fs(BALL_SIZE),
        this.fs(BALL_SIZE),
      );
    }

    // Text overlays.
    if (g.phase === "menu")
      this.overlay([
        "PONG",
        "",
        "1 — ONE PLAYER",
        "2 — TWO PLAYERS",
        "",
        `◄  DIFFICULTY  ${DIFFICULTY[g.difficulty].label}  ►`,
      ]);
    else if (g.phase === "gameover") {
      const winner = g.score1 >= WIN_SCORE ? "LEFT" : "RIGHT";
      this.overlay([`${winner} WINS`, "", "PRESS START"]);
    }

    if (this.crt) this.drawCrt();
  }

  private overlay(lines: string[]): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_FG;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = this.fx(FIELD_W / 2);
    let y = this.fy(FIELD_H * 0.32);
    const lineH = this.fs(46);
    lines.forEach((line, i) => {
      const size = i === 0 ? this.fs(64) : this.fs(26);
      ctx.font = `${size}px "Courier New", monospace`;
      ctx.fillText(line, cx, y);
      y += i === 0 ? lineH * 1.4 : lineH;
    });
  }

  private drawCrt(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Scanlines.
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    const step = Math.max(2, Math.round(this.dpr * 2));
    for (let y = 0; y < h; y += step * 2) {
      ctx.fillRect(0, y, w, step);
    }

    // Vignette.
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.35,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.62,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}
