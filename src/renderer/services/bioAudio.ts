/**
 * Bio-Adaptive Soundscape Synthesizer
 * Uses Web Audio API to create non-distracting, generative ambient focus audio
 * that subtly shifts tempo, harmonic timbre, and low-pass resonance to match the user's
 * real-time heart rate and respiratory waves.
 */

export class BioAudioEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private isAdaptive: boolean = true;
  private masterVolume: number = 0.08;
  private currentMode: string = 'Deep Binaural Alpha';

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
  }

  public start() {
    this.init();
    if (!this.ctx || this.isPlaying) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const baseFreq = this.currentMode === 'Warm Harmonic Tide' ? 108.0 : 136.1;
    const offset = this.currentMode === 'Warm Harmonic Tide' ? 6.0 : 10.0; // Theta vs Alpha entrainment

    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.filter = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();

    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    this.osc2.type = 'sine';
    this.osc2.frequency.setValueAtTime(baseFreq + offset, this.ctx.currentTime);

    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 2.0);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.osc1.start();
    this.osc2.start();
    this.isPlaying = true;
  }

  public setSoundscapeMode(mode: string) {
    this.currentMode = mode;
    if (this.isPlaying) {
      this.stop();
      setTimeout(() => this.start(), 300);
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol * 0.15));
    if (this.ctx && this.gainNode && this.isPlaying) {
      this.gainNode.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.1);
    }
  }

  public setAdaptive(adaptive: boolean) {
    this.isAdaptive = adaptive;
    if (!adaptive && this.filter && this.ctx) {
      // Reset filter to standard focus preset
      this.filter.frequency.setTargetAtTime(450, this.ctx.currentTime, 0.4);
    }
  }

  public modulateWithVitals(pulseRate: number | null, breathingWave: number | null) {
    if (!this.ctx || !this.filter || !this.isPlaying || !this.isAdaptive) return;

    const now = this.ctx.currentTime;

    // Smooth bounded parameter changes (250Hz - 700Hz)
    if (breathingWave !== null && !isNaN(breathingWave)) {
      const clampedWave = Math.max(-1, Math.min(1, breathingWave));
      const targetFreq = 400 + (clampedWave + 1.0) * 150;
      this.filter.frequency.setTargetAtTime(targetFreq, now, 0.4);
    }
  }

  public stop() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      if (this.gainNode) {
        this.gainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      }
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
        } catch (e) {}
        this.isPlaying = false;
      }, 500);
    } catch (e) {
      this.isPlaying = false;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsAdaptive(): boolean {
    return this.isAdaptive;
  }
}

export const bioAudio = new BioAudioEngine();

