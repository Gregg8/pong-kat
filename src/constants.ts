// ---------------------------------------------------------------------------
// Central config for the 1972 Pong replica.
//
// Everything authenticity-related lives here so it's easy to tweak toward the
// original cabinet feel. The playfield uses a fixed virtual coordinate system
// (4:3, like an NTSC CRT) and the renderer scales it to fit the screen.
// ---------------------------------------------------------------------------

/** Virtual playfield size. 4:3 to match the original arcade monitor. */
export const FIELD_W = 800;
export const FIELD_H = 600;

/** Physics runs at a fixed timestep for deterministic, smooth motion. */
export const TICK_HZ = 120;
export const TICK_DT = 1 / TICK_HZ;

/** Score that wins a game (the original played to 11). */
export const WIN_SCORE = 11;

// --- Paddles ---------------------------------------------------------------
export const PADDLE_W = 14;
export const PADDLE_H = 84;
/** Distance of each paddle's inner edge from its wall. */
export const PADDLE_INSET = 28;
/** Max paddle speed in virtual units/second (human paddles). */
export const PADDLE_SPEED = 620;
/**
 * The original cabinet could not move the paddle all the way to the very top
 * or bottom — there was a small dead band at each edge. Recreated here.
 */
export const PADDLE_EDGE_GAP = 6;

// --- Ball ------------------------------------------------------------------
export const BALL_SIZE = 14;
/** Horizontal serve speed (units/sec) at the start of a rally. */
export const BALL_START_SPEED = 360;
/** Ball speeds up as the rally goes on, like the original. */
export const BALL_SPEEDUP_HITS = [4, 12]; // hit counts at which it accelerates
export const BALL_SPEEDUP_FACTOR = 1.25;
export const BALL_MAX_SPEED = 900;

/**
 * Paddle face is divided into 8 zones (like the original's segmented return).
 * The zone the ball strikes sets its vertical velocity — center zones return
 * nearly flat, the outer zones return at a steep angle. Values are the
 * vertical speed component (units/sec); sign comes from which half is hit.
 */
export const PADDLE_ZONE_VY = [330, 235, 140, 55];

/** Delay (seconds) between a point being scored and the next serve. */
export const SERVE_DELAY = 1.1;

// --- Net (center dashed line) ---------------------------------------------
export const NET_DASH = 18;
export const NET_GAP = 14;
export const NET_W = 6;

// --- Audio: the three classic Pong tones -----------------------------------
// The 1972 hardware derived its blips from the video sync counter, producing
// short square-wave tones. These recreate that character: square waves, short
// durations. Frequencies match commonly documented values for the originals.
export const SND_PADDLE = { freq: 459, dur: 0.05 };
export const SND_WALL = { freq: 226, dur: 0.05 };
export const SND_SCORE = { freq: 490, dur: 0.18 };

// --- Colors (pure black & white) -------------------------------------------
export const COLOR_FG = "#ffffff";
export const COLOR_BG = "#000000";
