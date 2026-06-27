# Project status & open decisions

> This file is the source of truth for where the project stands and what still
> needs deciding. It exists so **any** session (or contributor) can pick up
> without relying on chat history. Update it as decisions are made.

_Last updated: 2026-06-27 (all Qs answered; Route A iOS pipeline built)_

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
- **Look**: **retro CRT on by default** (scanlines + vignette); toggle `C`.
- **Smoothness**: fixed 120 Hz timestep sim, render every animation frame.
- **Win condition**: first to 11.
- **Difficulty**: 5 AI levels (default 3), selectable on the menu with ◄/►
  (arrows or +/-). A proper touch slider is still TODO.

## Status

- ✅ Web build — playable, verified rendering. Merged to `main` (PR #1).
- ✅ iPhone wrapper (Route A) — Capacitor project + CI build **verified green**
  on a macOS runner; produces the `Pong-unsigned-ipa` artifact. Ready to
  sideload from Windows via `docs/SIDELOADING.md`.

## Decisions / answers

1. **Mac:** Mac Mini arriving in ~2 months. **Chosen: Route A** — cloud-built
   Capacitor IPA, sideloaded from a **Windows PC** with Sideloadly + a free
   Apple ID. Gregg is in **Australia** (not EU → no AltStore PAL; standard
   7-day / 3-app free-account limits apply). iPad can't build/sideload, so it's
   not part of the flow. **Built:** Capacitor iOS project (`ios/`), a GitHub
   Actions workflow that produces an unsigned `.ipa` (no Apple secrets needed —
   Sideloadly signs on the PC), and a step-by-step guide in
   `docs/SIDELOADING.md`.
2. **Sounds:** current frequencies are fine. ✅
3. **CRT look:** retro CRT is the **default** now (toggle `C`). ✅
4. **Difficulty:** 5 selectable AI levels added (default 3). A touch-friendly
   slider UI is still TODO. ✅

## iOS interim options (no Mac, until the Mac Mini)

The long-term plan stays **Capacitor** (wrap the existing web build), because
that's exactly what we'll keep using once the Mac Mini lands — no rework.

Reality check: any *standalone* iOS app must be built on macOS (or a cloud Mac)
and code-signed. A free Apple ID can sign for sideloading but caps you at 3 apps
with a **7-day** certificate. The realistic no-Mac routes:

- **A. Capacitor IPA built on a free cloud Mac (Codemagic / GitHub Actions) →
  sideload with Sideloadly / AltStore / SideStore using a free Apple ID.**
  Real standalone app icon. Same Capacitor setup as the Mac Mini → zero rework.
  Needs a Windows/Linux PC for sideloading; 7-day refresh (SideStore avoids
  re-tethering to a computer). **← recommended if a Windows/Linux PC exists.**
- **B. Expo Go (the "runtime you download")** + a thin React-Native WebView that
  loads our web build. No Mac, no signing, no 7-day limit. But it runs *inside*
  Expo Go (no own icon), needs a computer running the dev server, and adds a
  throwaway RN shell.
- **C. Wait ~2 months** for the Mac Mini, then Capacitor + Xcode free-provision
  (7-day) or a paid account for the App Store.

EU note: the DMA lets **AltStore PAL** install notarized apps without the 7-day
limit and without a desktop — materially better if Gregg is in the EU.

## Next steps

- Resolve route A vs B (needs Gregg's computer + region).
- Add Capacitor to the project so an IPA can be cloud-built (route A) — also the
  permanent Mac path.
- Touch UI for difficulty; optional pause screen / settings.
