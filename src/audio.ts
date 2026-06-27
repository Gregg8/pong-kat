// ---------------------------------------------------------------------------
// Sound engine.
//
// The original Pong didn't play sampled audio — its three blips were square
// waves pulled straight off the video sync counter. We recreate that exactly:
// a square-wave oscillator gated by a short envelope. No sample files, no
// copyrighted assets, just the same kind of tone the hardware made.
// ---------------------------------------------------------------------------

import { SND_PADDLE, SND_WALL, SND_SCORE } from "./constants";

type Tone = { freq: number; dur: number };

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /**
   * Browsers require audio to start from a user gesture. Call this from the
   * first tap/keypress to unlock the context.
   */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.ctx.destination);
  }

  private play(tone: Tone): void {
    if (this.muted || !this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.value = tone.freq;

    // Hard-ish gate with a tiny ramp to avoid clicks, mimicking the abrupt
    // on/off blip of the original.
    const g = env.gain;
    g.setValueAtTime(0, t0);
    g.linearRampToValueAtTime(1, t0 + 0.002);
    g.setValueAtTime(1, t0 + tone.dur - 0.004);
    g.linearRampToValueAtTime(0, t0 + tone.dur);

    osc.connect(env);
    env.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + tone.dur + 0.01);
  }

  paddle(): void {
    this.play(SND_PADDLE);
  }
  wall(): void {
    this.play(SND_WALL);
  }
  score(): void {
    this.play(SND_SCORE);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }
}
