# pong-kat

A super-close replica of the original 1972 Atari **Pong** — pure black & white,
square ball, blocky scores, dashed center net, and the authentic square-wave
blips. Built to run buttery-smooth and to ship to multiple platforms from a
single codebase.

## Status

- ✅ **Web** — playable now (HTML5 Canvas + TypeScript, Vite).
- ⏳ **iPhone (native, no paid dev account)** — architected to wrap with
  Capacitor and sideload; see [Roadmap](#roadmap).

## Authenticity details

This isn't a generic Pong — it recreates the original's quirks:

- **4:3 playfield** like the arcade CRT, letterboxed to any screen.
- **Square ball**, thin paddles, **blocky 3×5 score digits**, dashed net.
- **8-zone paddle return**: where the ball strikes the paddle sets its angle —
  center zones return nearly flat, the outer zones return steep.
- **Rally speed-up**: the ball accelerates at the classic hit thresholds.
- **Edge dead-band**: paddles can't quite reach the very top/bottom, like the
  original hardware.
- **Three square-wave sounds** (paddle / wall / score) synthesized via the Web
  Audio API the same way the 1972 hardware made them — no sampled assets.
- **First to 11 wins.**

## Controls

| Action            | Keyboard                | Touch                          |
| ----------------- | ----------------------- | ------------------------------ |
| Player 1 (left)   | `W` / `S`, or mouse     | Drag on the **left** half      |
| Player 2 (right)  | `↑` / `↓`               | Drag on the **right** half     |
| Start 1-player    | `1` (or tap / space)    | Tap                            |
| Start 2-player    | `2`                     | —                              |
| Toggle CRT look   | `C`                     | —                              |
| Mute / unmute     | `M`                     | —                              |

## Run it

```bash
npm install
npm run dev      # dev server with hot reload
# or
npm run build && npm run preview   # production build + static preview
```

## How it's built (for smoothness & portability)

- **Fixed-timestep simulation** at 120 Hz with rendering on every animation
  frame, so motion is identical and smooth on 60 Hz and 120 Hz (ProMotion)
  displays alike.
- **Pure simulation core** (`src/game.ts`) that the renderer only reads — easy
  to port or wrap.
- **Crisp rendering**: integer-fit scaling with image smoothing off keeps the
  squares sharp at any size.
- `base: "./"` in the Vite config so the same build runs on the web and inside
  an iOS WebView.

## Roadmap

1. **Web** (done) — polish, optional menu/settings.
2. **iPhone via Capacitor** — wrap the web build as a native app. Without a paid
   Apple Developer account it can be installed by **free-provisioning sideload**
   (Xcode + a free Apple ID; the app re-signs every 7 days) or via **AltStore**.
   This needs a Mac to build the iOS project.
3. Other targets (Android, desktop) reuse the same core.

## Project layout

```
src/
  constants.ts  — all authenticity tunables (sizes, speeds, sound tones)
  audio.ts      — square-wave sound engine (Web Audio)
  input.ts      — keyboard / mouse / touch
  game.ts       — state machine + physics (pure simulation)
  font.ts       — blocky pixel score digits
  render.ts     — canvas drawing + optional CRT overlay
  main.ts       — fixed-timestep game loop
```
