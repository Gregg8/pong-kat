# Project status & open decisions

> This file is the source of truth for where the project stands and what still
> needs deciding. It exists so **any** session (or contributor) can pick up
> without relying on chat history. Update it as decisions are made.

_Last updated: 2026-06-27_

## Goal

A super-close replica of the original 1972 Atari **Pong**: black & white, square
ball and scores, authentic square-wave sounds, very high/smooth frame rate.
Target the **web first**, then **iPhone** — installed natively **without a paid
Apple Developer account** (sideloading), explicitly _not_ as a web page.

## Decisions made

- **Tech**: single shared core in HTML5 Canvas + TypeScript (Vite). Same code
  runs on web now and wraps into iOS later via Capacitor.
- **Modes**: 1-player vs CPU (default) and 2-player local.
- **Sounds**: synthesized square-wave tones via Web Audio (no sampled assets).
- **Look**: clean black & white by default; optional CRT overlay (toggle `C`).
- **Smoothness**: fixed 120 Hz timestep sim, render every animation frame.
- **Win condition**: first to 11.

## Status

- ✅ Web build — playable, verified rendering. Merged to `main` (PR #1).
- ⏳ iPhone native wrapper — not started (waiting on the Mac question below).

## OPEN QUESTIONS (awaiting Gregg's answers)

1. **Mac available?** This gates the native iPhone path.
   - Yes → Capacitor → Xcode → sideload with a free Apple ID (re-signs every 7
     days). Cleanest "real app on phone."
   - No → native iOS is awkward (AltStore, or a cloud-Mac CI). Worth
     reconsidering whether an installable PWA ("Add to Home Screen" = real
     fullscreen app icon, no account, no 7-day expiry) is truly off the table.
   - **Answer:** _(unanswered)_

2. **Sound reference.** Currently using commonly-documented frequencies (paddle
   459 Hz, wall 226 Hz, score 490 Hz, square waves). If there's a specific
   reference recording to match, point to it.
   - **Answer:** _(unanswered)_

3. **CRT look default.** Currently off (clean B&W) with a toggle. Want it on by
   default for max authenticity?
   - **Answer:** _(unanswered)_

4. **AI difficulty.** CPU is deliberately beatable. Too easy / hard / add levels?
   - **Answer:** _(unanswered)_

## Likely next steps (once questions are answered)

- Scaffold the Capacitor iOS project so it's ready to open in Xcode.
- Tune sounds / difficulty / CRT per the answers above.
- Optional web polish (settings menu, pause screen).
