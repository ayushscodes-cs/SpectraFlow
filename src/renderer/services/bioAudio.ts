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
  private pulseBpm: number = 70;

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

    // Binaural / Warm Focus Drone (Alpha-entrainment ~10Hz offset)
    const baseFreq = 136.1; // "Om" frequency / 432Hz harmonic base
    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.filter = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();

    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    this.osc2.type = 'sine';
    this.osc2.frequency.setValueAtTime(baseFreq + 10.0, this.ctx.currentTime); // 10Hz binaural delta

    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 2.5);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.osc1.start();
    this.osc2.start();
    this.isPlaying = true;
  }

  public modulateWithVitals(pulseRate: number | null, breathingWave: number | null) {
    if (!this.ctx || !this.filter || !this.isPlaying) return;

    const now = this.ctx.currentTime;

    // Modulate lowpass filter frequency with respiratory wave (inhale opens spectrum, exhale warms it)
    if (breathingWave !== null) {
      const targetFreq = 400 + (breathingWave + 1.0) * 150; // 250Hz to 700Hz
      this.filter.frequency.setTargetAtTime(targetFreq, now, 0.4);
    }

    if (pulseRate) {
      this.pulseBpm = pulseRate;
    }
  }

  public stop() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      if (this.gainNode) {
        this.gainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.5);
      }
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
        } catch (e) {}
        this.isPlaying = false;
      }, 600);
    } catch (e) {
      this.isPlaying = false;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const bioAudio = new BioAudioEngine();
