// Web Audio API Sound Utility for POS Tactile Feedback

class SoundManager {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play satisfying dual-tone POS add chime (E5 -> B5)
  playAddSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Note 2: B5 (987.77 Hz) - 60ms offset
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.06);
      gain2.gain.setValueAtTime(0.18, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.16);
    } catch {
      // Ignore audio policy errors if user has not interacted
    }
  }

  // Play Cash Register "Cha-Ching!" success fanfare for checkout completion
  playCheckoutSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 4-Note Ascending Cash Register Arpeggio (G5 -> C6 -> E6 -> G6)
      const notes = [
        { freq: 783.99, delay: 0.00, duration: 0.12, gain: 0.15 },
        { freq: 1046.50, delay: 0.05, duration: 0.15, gain: 0.18 },
        { freq: 1318.51, delay: 0.10, duration: 0.18, gain: 0.20 },
        { freq: 1567.98, delay: 0.15, duration: 0.35, gain: 0.25 },
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.delay);

        gain.gain.setValueAtTime(n.gain, now + n.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.delay + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.delay);
        osc.stop(now + n.delay + n.duration);
      });

      // Metallic Bell Shimmer (High C7 Ping - 2093 Hz)
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(2093.00, now + 0.18);

      shimmerGain.gain.setValueAtTime(0.12, now + 0.18);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(now + 0.18);
      shimmerOsc.stop(now + 0.50);
    } catch {
      // Ignore audio policy errors
    }
  }
}

export const soundManager = new SoundManager();
