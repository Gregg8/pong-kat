// ---------------------------------------------------------------------------
// Game state + physics. Pure simulation: it advances by fixed timesteps and
// emits sound events; rendering reads the state but never mutates it.
// ---------------------------------------------------------------------------

import {
  FIELD_W,
  FIELD_H,
  PADDLE_W,
  PADDLE_H,
  PADDLE_INSET,
  PADDLE_SPEED,
  PADDLE_EDGE_GAP,
  BALL_SIZE,
  BALL_START_SPEED,
  BALL_SPEEDUP_HITS,
  BALL_SPEEDUP_FACTOR,
  BALL_MAX_SPEED,
  PADDLE_ZONE_VY,
  SERVE_DELAY,
  WIN_SCORE,
  TICK_DT,
} from "./constants";
import type { Input } from "./input";
import type { Audio } from "./audio";

export type Mode = "1p" | "2p";
export type Phase = "menu" | "serving" | "rally" | "point" | "gameover";

export class Game {
  mode: Mode = "1p";
  phase: Phase = "menu";

  // Paddle Y is the top edge.
  p1y = (FIELD_H - PADDLE_H) / 2;
  p2y = (FIELD_H - PADDLE_H) / 2;

  // Ball center.
  bx = FIELD_W / 2;
  by = FIELD_H / 2;
  bvx = 0;
  bvy = 0;
  ballSpeed = BALL_START_SPEED;
  hitCount = 0;

  score1 = 0;
  score2 = 0;

  /** Which side serves next (ball travels toward the side that was scored on). */
  private serveTo: 0 | 1 = 1;
  private timer = 0;
  /** Slightly imperfect AI target, refreshed periodically for beatability. */
  private aiTargetY = FIELD_H / 2;
  private aiThink = 0;

  constructor(
    private input: Input,
    private audio: Audio,
  ) {}

  start(mode: Mode): void {
    this.mode = mode;
    this.score1 = 0;
    this.score2 = 0;
    this.p1y = (FIELD_H - PADDLE_H) / 2;
    this.p2y = (FIELD_H - PADDLE_H) / 2;
    // First serve direction: pick toward player 2 to open.
    this.serveTo = 1;
    this.beginServe();
  }

  private beginServe(): void {
    this.phase = "serving";
    this.timer = SERVE_DELAY;
    this.bx = FIELD_W / 2;
    this.by = FIELD_H / 2;
    this.ballSpeed = BALL_START_SPEED;
    this.hitCount = 0;
    this.bvx = 0;
    this.bvy = 0;
  }

  private launch(): void {
    this.phase = "rally";
    const dir = this.serveTo === 1 ? 1 : -1;
    // Small deterministic-ish vertical spread based on current paddle offset.
    const spread = ((this.p1y + this.p2y) % 97) / 97 - 0.5; // -0.5..0.5
    this.bvx = dir * this.ballSpeed;
    this.bvy = spread * this.ballSpeed * 0.6;
  }

  /** Advance one fixed physics step. */
  step(): void {
    switch (this.phase) {
      case "serving":
        this.movePaddles();
        this.timer -= TICK_DT;
        if (this.timer <= 0) this.launch();
        break;
      case "rally":
        this.movePaddles();
        this.moveBall();
        break;
      case "point":
        this.movePaddles();
        this.timer -= TICK_DT;
        if (this.timer <= 0) {
          if (this.score1 >= WIN_SCORE || this.score2 >= WIN_SCORE) {
            this.phase = "gameover";
          } else {
            this.beginServe();
          }
        }
        break;
    }
  }

  private clampPaddle(y: number): number {
    const min = PADDLE_EDGE_GAP;
    const max = FIELD_H - PADDLE_H - PADDLE_EDGE_GAP;
    return Math.max(min, Math.min(max, y));
  }

  private movePaddles(): void {
    // Player 1 (always human).
    this.p1y = this.applyHuman(0, this.p1y);

    // Player 2: human in 2p, AI in 1p.
    if (this.mode === "2p") {
      this.p2y = this.applyHuman(1, this.p2y);
    } else {
      this.p2y = this.applyAI(this.p2y);
    }
  }

  private applyHuman(side: 0 | 1, y: number): number {
    const it = this.input.intent(side);
    const center = y + PADDLE_H / 2;
    if (it.targetY != null) {
      // Pointer/touch: move toward the target, capped by paddle speed.
      const desired = it.targetY - PADDLE_H / 2;
      const maxStep = PADDLE_SPEED * TICK_DT;
      const delta = desired - y;
      y += Math.max(-maxStep, Math.min(maxStep, delta));
    }
    if (it.dir !== 0) {
      y += it.dir * PADDLE_SPEED * TICK_DT;
    }
    void center;
    return this.clampPaddle(y);
  }

  private applyAI(y: number): number {
    // Re-aim a few times per second; only react when the ball approaches.
    this.aiThink -= TICK_DT;
    const approaching = this.bvx > 0;
    if (this.aiThink <= 0) {
      this.aiThink = 0.08;
      if (approaching && this.phase === "rally") {
        // Aim at the ball with a small error band so it's beatable.
        const err = (((this.p2y * 7) % 53) / 53 - 0.5) * 46;
        this.aiTargetY = this.by + err;
      } else {
        // Drift back toward center when idle.
        this.aiTargetY = FIELD_H / 2;
      }
    }
    const desired = this.aiTargetY - PADDLE_H / 2;
    const delta = desired - y;
    // AI slightly slower than a human so a sharp player can win.
    const maxStep = PADDLE_SPEED * 0.86 * TICK_DT;
    const dead = 6;
    if (Math.abs(delta) > dead) {
      y += Math.sign(delta) * Math.min(maxStep, Math.abs(delta));
    }
    return this.clampPaddle(y);
  }

  private moveBall(): void {
    const half = BALL_SIZE / 2;
    this.bx += this.bvx * TICK_DT;
    this.by += this.bvy * TICK_DT;

    // Top / bottom walls bounce.
    if (this.by - half < 0) {
      this.by = half;
      this.bvy = Math.abs(this.bvy);
      this.audio.wall();
    } else if (this.by + half > FIELD_H) {
      this.by = FIELD_H - half;
      this.bvy = -Math.abs(this.bvy);
      this.audio.wall();
    }

    // Paddle collisions.
    const p1x = PADDLE_INSET + PADDLE_W;
    const p2x = FIELD_W - PADDLE_INSET - PADDLE_W;

    if (
      this.bvx < 0 &&
      this.bx - half <= p1x &&
      this.bx - half >= PADDLE_INSET - PADDLE_W &&
      this.by >= this.p1y &&
      this.by <= this.p1y + PADDLE_H
    ) {
      this.bx = p1x + half;
      this.bounceOffPaddle(this.p1y);
    } else if (
      this.bvx > 0 &&
      this.bx + half >= p2x &&
      this.bx + half <= p2x + PADDLE_W * 2 &&
      this.by >= this.p2y &&
      this.by <= this.p2y + PADDLE_H
    ) {
      this.bx = p2x - half;
      this.bounceOffPaddle(this.p2y);
    }

    // Scoring: ball past a back wall.
    if (this.bx < -half) {
      this.score2++;
      this.serveTo = 0; // serve toward the player who was scored on
      this.endPoint();
    } else if (this.bx > FIELD_W + half) {
      this.score1++;
      this.serveTo = 1;
      this.endPoint();
    }
  }

  private bounceOffPaddle(paddleY: number): void {
    this.bvx = -this.bvx;
    this.hitCount++;

    // Speed up at the documented rally thresholds.
    if (BALL_SPEEDUP_HITS.includes(this.hitCount)) {
      this.ballSpeed = Math.min(
        BALL_MAX_SPEED,
        this.ballSpeed * BALL_SPEEDUP_FACTOR,
      );
    }

    // Which of 8 zones did it hit? Center zones return flat, edges steep.
    const rel = (this.by - paddleY) / PADDLE_H; // 0..1 top->bottom
    const zone = Math.max(0, Math.min(7, Math.floor(rel * 8))); // 0..7
    const half = zone < 4 ? zone : 7 - zone; // 0..3 distance from center
    const sign = zone < 4 ? -1 : 1; // top half deflects up
    const vy = PADDLE_ZONE_VY[half] * sign;

    // Renormalize so total speed tracks ballSpeed (keeps motion crisp).
    const sp = this.ballSpeed;
    const vx = Math.sign(this.bvx) * Math.sqrt(Math.max(1, sp * sp - vy * vy));
    this.bvx = vx;
    this.bvy = vy;

    this.audio.paddle();
  }

  private endPoint(): void {
    this.audio.score();
    this.phase = "point";
    this.timer = SERVE_DELAY;
    this.bvx = 0;
    this.bvy = 0;
  }
}
