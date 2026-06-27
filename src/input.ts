// ---------------------------------------------------------------------------
// Input: keyboard, mouse, and touch — mapped to a simple intent model the
// game reads each frame.
//
//   Player 1 (left):  W / S keys, or mouse / touch on the LEFT half.
//   Player 2 (right): Up / Down arrows, or touch on the RIGHT half.
//
// In 1-player mode the human always drives the left paddle and may use the
// whole screen / either control scheme.
// ---------------------------------------------------------------------------

export type PaddleIntent = {
  /** -1 = up, +1 = down, 0 = no keyboard input this frame. */
  dir: number;
  /** Absolute target Y in virtual units (pointer/touch), or null if unused. */
  targetY: number | null;
};

export class Input {
  private keys = new Set<string>();
  /** Pointer target Y per side, in virtual coords. null when not pointing. */
  private pointerY: [number | null, number | null] = [null, null];
  /** One-shot actions consumed by the game (start, pause, toggles). */
  private pressed = new Set<string>();
  /** Virtual-coord location of the most recent press, for menu hit-testing. */
  lastPress: { x: number; y: number } | null = null;

  /** Maps a client point to virtual coords; set by the renderer each resize. */
  toVirtual: (clientX: number, clientY: number) => { x: number; y: number } = (
    x,
    y,
  ) => ({ x, y });

  /** Called on any first interaction (to unlock audio). */
  onFirstGesture: (() => void) | null = null;
  private gestureFired = false;

  attach(canvas: HTMLCanvasElement): void {
    window.addEventListener("keydown", (e) => {
      this.fireGesture();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      // Stop arrows/space from scrolling the page.
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "Space",
          "KeyW",
          "KeyS",
        ].includes(e.code)
      )
        e.preventDefault();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));

    // Mouse drives player 1.
    canvas.addEventListener("mousemove", (e) => {
      const v = this.toVirtual(e.clientX, e.clientY);
      this.pointerY[0] = v.y;
    });
    canvas.addEventListener("mousedown", (e) => {
      this.fireGesture();
      const v = this.toVirtual(e.clientX, e.clientY);
      this.pointerY[0] = v.y;
      this.lastPress = v;
      this.pressed.add("Pointer");
    });

    // Touch — split by screen half so two thumbs can play.
    const handleTouches = (e: TouchEvent) => {
      this.fireGesture();
      const mid = canvas.clientWidth / 2;
      let left: number | null = null;
      let right: number | null = null;
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const v = this.toVirtual(t.clientX, t.clientY);
        // Use the raw client X to decide which side this thumb controls.
        if (t.clientX < mid) left = v.y;
        else right = v.y;
      }
      this.pointerY[0] = left;
      this.pointerY[1] = right;
    };
    canvas.addEventListener(
      "touchstart",
      (e) => {
        handleTouches(e);
        if (e.touches.length > 0) {
          const t = e.touches[0];
          this.lastPress = this.toVirtual(t.clientX, t.clientY);
        }
        this.pressed.add("Pointer");
        e.preventDefault();
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        handleTouches(e);
        e.preventDefault();
      },
      { passive: false },
    );
    const clearTouch = (e: TouchEvent) => {
      // Recompute from remaining touches.
      if (e.touches.length === 0) {
        this.pointerY[0] = null;
        this.pointerY[1] = null;
      } else {
        handleTouches(e);
      }
    };
    canvas.addEventListener("touchend", clearTouch);
    canvas.addEventListener("touchcancel", clearTouch);
  }

  private fireGesture(): void {
    if (!this.gestureFired) {
      this.gestureFired = true;
      this.onFirstGesture?.();
    }
  }

  /** Intent for a paddle: side 0 = left/P1, side 1 = right/P2. */
  intent(side: 0 | 1): PaddleIntent {
    let dir = 0;
    if (side === 0) {
      if (this.keys.has("KeyW")) dir -= 1;
      if (this.keys.has("KeyS")) dir += 1;
    } else {
      if (this.keys.has("ArrowUp")) dir -= 1;
      if (this.keys.has("ArrowDown")) dir += 1;
    }
    return { dir, targetY: this.pointerY[side] };
  }

  /**
   * Drop any unconsumed one-shot presses at the end of a frame, so a press is
   * only ever actionable on the frame it occurred (no stale presses carrying
   * over between phases).
   */
  clearFrame(): void {
    this.pressed.clear();
  }

  /** True once if the action was pressed since the last check. */
  consume(code: string): boolean {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  /** Any "confirm/start" press (space, enter, click, tap). */
  consumeConfirm(): boolean {
    return (
      this.consume("Space") ||
      this.consume("Enter") ||
      this.consume("Pointer")
    );
  }
}
