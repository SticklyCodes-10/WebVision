// Web Audio API Spatial Sound Effects & Ambient Synthesizer Engine

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  // Music Synth State
  private musicInterval: number | null = null;
  private isPlayingMusic: boolean = false;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private volume: number = 0.65;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Subtle visionOS Gaze + Pinch Click
  public playPinchClick() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.045);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore audio errors before user interaction
    }
  }

  // Window Open / Summon Spatial Chime
  public playWindowOpen() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.035);

        gain.gain.setValueAtTime(0.001, now + idx * 0.035);
        gain.gain.linearRampToValueAtTime(0.045, now + idx * 0.035 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.035 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.3);
      });
    } catch {}
  }

  // Window Minimize / Close Soft Thud
  public playWindowClose() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.14);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  // Gesture Recognized Feedback Tone
  public playGestureRecognized(type: 'open_palm' | 'closed_fist' | 'two_fingers') {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      if (type === 'open_palm') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      } else if (type === 'closed_fist') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(310, now + 0.12);
      } else {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(990, now + 0.1);
      }

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // Spatial Music Player Synth Engine
  public startMusicTrack(chordNotes: number[], bpm: number, spatialOrbit: boolean = true) {
    this.stopMusicTrack();
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isPlayingMusic = true;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume * 0.22, ctx.currentTime);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 64;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    let step = 0;
    const stepMs = Math.max(240, Math.round((60 / bpm) * 1000));

    const triggerNote = () => {
      if (!this.isPlayingMusic || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const noteFreq = chordNotes[step % chordNotes.length];
      const shimmerFreq = noteFreq * (step % 3 === 0 ? 2 : 1.5);

      // Warm Pad Oscillator
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const panner = this.ctx.createStereoPanner();
      const noteGain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(noteFreq, now);
      osc2.frequency.setValueAtTime(shimmerFreq, now);

      if (spatialOrbit) {
        panner.pan.setValueAtTime(Math.sin(step * 0.7) * 0.75, now);
      }

      const duration = (stepMs / 1000) * 2.2;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.32, now + 0.12);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(panner);
      panner.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);

      step++;
    };

    triggerNote();
    this.musicInterval = window.setInterval(triggerNote, stepMs);
  }

  public stopMusicTrack() {
    this.isPlayingMusic = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public setMusicVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.22, this.ctx.currentTime, 0.05);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.isPlayingMusic) {
      return new Uint8Array(16).fill(4);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

export const spatialAudio = new SpatialAudioEngine();
