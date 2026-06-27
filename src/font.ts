// ---------------------------------------------------------------------------
// Chunky score digits, drawn as a 3x5 pixel grid scaled up into big squares —
// the blocky numerals of early TV tennis. Each digit is five rows of three
// bits.
// ---------------------------------------------------------------------------

const DIGITS: Record<string, number[]> = {
  // bits per row, MSB = leftmost of 3 columns
  "0": [0b111, 0b101, 0b101, 0b101, 0b111],
  "1": [0b010, 0b110, 0b010, 0b010, 0b111],
  "2": [0b111, 0b001, 0b111, 0b100, 0b111],
  "3": [0b111, 0b001, 0b111, 0b001, 0b111],
  "4": [0b101, 0b101, 0b111, 0b001, 0b001],
  "5": [0b111, 0b100, 0b111, 0b001, 0b111],
  "6": [0b111, 0b100, 0b111, 0b101, 0b111],
  "7": [0b111, 0b001, 0b010, 0b010, 0b010],
  "8": [0b111, 0b101, 0b111, 0b101, 0b111],
  "9": [0b111, 0b101, 0b111, 0b001, 0b111],
};

/**
 * Draw a single digit. (x, y) is the top-left corner; `px` is the size of one
 * "pixel" square. Returns the rendered width.
 */
export function drawDigit(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  px: number,
): number {
  const rows = DIGITS[ch];
  if (!rows) return 0;
  for (let r = 0; r < 5; r++) {
    const bits = rows[r];
    for (let c = 0; c < 3; c++) {
      if (bits & (1 << (2 - c))) {
        ctx.fillRect(x + c * px, y + r * px, px, px);
      }
    }
  }
  return 3 * px;
}

/** Draw a number centered horizontally on `cx`. */
export function drawNumber(
  ctx: CanvasRenderingContext2D,
  value: number,
  cx: number,
  y: number,
  px: number,
): void {
  const s = String(value);
  const gap = px; // one pixel-cell between digits
  const width = s.length * (3 * px) + (s.length - 1) * gap;
  let x = cx - width / 2;
  for (const ch of s) {
    drawDigit(ctx, ch, x, y, px);
    x += 3 * px + gap;
  }
}
