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

type Rect = { x: number; y: number; w: number; h: number };

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

  draw(g: Game, ui: { muted: boolean }): void {
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
    const playing =
      g.phase === "serving" || g.phase === "rally" || g.phase === "point";
    if (g.phase === "menu") this.drawMenu(g, ui.muted);
    else if (g.phase === "gameover") {
      const winner = g.score1 >= WIN_SCORE ? "LEFT" : "RIGHT";
      this.overlay([`${winner} WINS`, "", "TAP TO CONTINUE"]);
    }

    // In-game pause button (hidden while paused / on menus).
    if (playing && !g.paused) this.drawPauseButton();
    if (g.paused) this.drawPauseOverlay();

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

  /** Tappable menu button rectangles, in virtual coords. */
  private menuButtons(): Record<string, Rect> {
    const cx = FIELD_W / 2;
    return {
      onePlayer: { x: cx - 150, y: 128, w: 300, h: 52 },
      twoPlayer: { x: cx - 150, y: 190, w: 300, h: 52 },
      diffDown: { x: cx - 160, y: 292, w: 52, h: 52 },
      diffUp: { x: cx + 108, y: 292, w: 52, h: 52 },
      sound: { x: cx - 205, y: 372, w: 190, h: 50 },
      crt: { x: cx + 15, y: 372, w: 190, h: 50 },
    };
  }

  /** Pause button shown during play. */
  private playButtons(): Record<string, Rect> {
    const cx = FIELD_W / 2;
    return { pause: { x: cx - 30, y: 12, w: 60, h: 50 } };
  }

  /** Buttons on the pause overlay. */
  private pauseButtons(): Record<string, Rect> {
    const cx = FIELD_W / 2;
    return {
      resume: { x: cx - 150, y: 290, w: 300, h: 56 },
      quit: { x: cx - 150, y: 362, w: 300, h: 56 },
    };
  }

  private hitTest(
    rects: Record<string, Rect>,
    p: { x: number; y: number } | null,
  ): string | null {
    if (!p) return null;
    for (const key of Object.keys(rects)) {
      const r = rects[key];
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h)
        return key;
    }
    return null;
  }

  hitTestMenu(p: { x: number; y: number } | null): string | null {
    return this.hitTest(this.menuButtons(), p);
  }
  hitTestPlay(p: { x: number; y: number } | null): string | null {
    return this.hitTest(this.playButtons(), p);
  }
  hitTestPause(p: { x: number; y: number } | null): string | null {
    return this.hitTest(this.pauseButtons(), p);
  }

  private drawButton(r: Rect, label: string, fontPx: number): void {
    const ctx = this.ctx;
    ctx.lineWidth = Math.max(2, this.fs(3));
    ctx.strokeStyle = COLOR_FG;
    ctx.strokeRect(this.fx(r.x), this.fy(r.y), this.fs(r.w), this.fs(r.h));
    ctx.fillStyle = COLOR_FG;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${this.fs(fontPx)}px "Courier New", monospace`;
    ctx.fillText(label, this.fx(r.x + r.w / 2), this.fy(r.y + r.h / 2));
  }

  private drawMenu(g: Game, muted: boolean): void {
    const ctx = this.ctx;
    const cx = FIELD_W / 2;
    ctx.fillStyle = COLOR_FG;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `${this.fs(56)}px "Courier New", monospace`;
    ctx.fillText("PONG", this.fx(cx), this.fy(84));

    const b = this.menuButtons();
    this.drawButton(b.onePlayer, "1 PLAYER", 24);
    this.drawButton(b.twoPlayer, "2 PLAYERS", 24);

    ctx.font = `${this.fs(20)}px "Courier New", monospace`;
    ctx.fillText("DIFFICULTY", this.fx(cx), this.fy(268));
    this.drawButton(b.diffDown, "◄", 24);
    this.drawButton(b.diffUp, "►", 24);
    ctx.font = `${this.fs(38)}px "Courier New", monospace`;
    ctx.fillText(DIFFICULTY[g.difficulty].label, this.fx(cx), this.fy(318));

    this.drawButton(b.sound, muted ? "SOUND OFF" : "SOUND ON", 20);
    this.drawButton(b.crt, this.crt ? "CRT ON" : "CRT OFF", 20);

    // Keyboard hints — shown only on the menu (before a game starts).
    ctx.fillStyle = COLOR_FG;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${this.fs(20)}px "Courier New", monospace`;
    ctx.fillText("P1", this.fx(120), this.fy(478));
    ctx.fillText("P2", this.fx(FIELD_W - 120), this.fy(478));
    ctx.font = `${this.fs(18)}px "Courier New", monospace`;
    ctx.fillText("W / S", this.fx(120), this.fy(506));
    ctx.fillText("↑ / ↓", this.fx(FIELD_W - 120), this.fy(506));
  }

  /** The pause control shown during play — a box with two bars. */
  private drawPauseButton(): void {
    const r = this.playButtons().pause;
    const ctx = this.ctx;
    ctx.lineWidth = Math.max(2, this.fs(3));
    ctx.strokeStyle = COLOR_FG;
    ctx.strokeRect(this.fx(r.x), this.fy(r.y), this.fs(r.w), this.fs(r.h));
    ctx.fillStyle = COLOR_FG;
    const barW = r.w * 0.14;
    const barH = r.h * 0.5;
    const cx = r.x + r.w / 2;
    const top = r.y + (r.h - barH) / 2;
    ctx.fillRect(this.fx(cx - barW * 1.6), this.fy(top), this.fs(barW), this.fs(barH));
    ctx.fillRect(this.fx(cx + barW * 0.6), this.fy(top), this.fs(barW), this.fs(barH));
  }

  private drawPauseOverlay(): void {
    const ctx = this.ctx;
    // Dim the frozen field.
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = COLOR_FG;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${this.fs(56)}px "Courier New", monospace`;
    ctx.fillText("PAUSED", this.fx(FIELD_W / 2), this.fy(200));

    const b = this.pauseButtons();
    this.drawButton(b.resume, "RESUME", 24);
    this.drawButton(b.quit, "QUIT", 24);
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
