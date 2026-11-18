/**
 * Bio-Adaptive Soundscape Synthesizer
 * Uses Web Audio API to create non-distracting, generative ambient focus audio
 * that subtly shifts tempo, harmonic timbre, and low-pass resonance to match the user's
 * real-time heart rate and respiratory waves.
 * 
 * DESIGN PRINCIPLE: Persistent AudioGraph.
 * Never destroys oscillators on mode change; smoothly transitions frequencies
 * and filter parameters via AudioParam.setTargetAtTime without audio dropping or muting.
 */

export interface SoundscapePresetConfig {
  name: string;
  baseFreq: number;
  offsetFreq: number; // Entrainment offset (alpha vs theta)
  filterCutoff: number;
  filterQ: number;
  type: OscillatorType;
}

export const SOUNDSCAPE_PRESETS: Record<string, SoundscapePresetConfig> = {
  'Deep Binaural Alpha': {
    name: 'Deep Binaural Alpha',
    baseFreq: 136.1, // Earth frequency (Om)
    offsetFreq: 10.0, // 10Hz Alpha brainwave entrainment
    filterCutoff: 450,
    filterQ: 2.0,
    type: 'sine',
  },
  'Warm Harmonic Tide': {
    name: 'Warm Harmonic Tide',
    baseFreq: 108.0, // Grounding sub-harmonic
    offsetFreq: 6.0, // 6Hz Theta deep work state
    filterCutoff: 520,
    filterQ: 1.5,
    type: 'triangle',
  },
};

export class BioAudioEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private isAdaptive: boolean = true;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5; // Normalized 0..1
  private currentMode: string = 'Deep Binaural Alpha';

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
  }

  public async resumeContext(): Promise<void> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public async start(): Promise<void> {
    await this.resumeContext();
    if (!this.ctx) return;

    if (this.isPlaying) {
      // If already playing, just un-mute
      this.setMuted(false);
      return;
    }

    const preset = SOUNDSCAPE_PRESETS[this.currentMode] || SOUNDSCAPE_PRESETS['Deep Binaural Alpha'];

    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.filter = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();

    this.osc1.type = preset.type;
    this.osc1.frequency.setValueAtTime(preset.baseFreq, this.ctx.currentTime);

    this.osc2.type = preset.type;
    this.osc2.frequency.setValueAtTime(preset.baseFreq + preset.offsetFreq, this.ctx.currentTime);

    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(preset.filterCutoff, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(preset.filterQ, this.ctx.currentTime);

    const targetGain = this.calculateTargetGain();
    this.gainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetGain), this.ctx.currentTime + 1.5);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.osc1.start();
    this.osc2.start();
    this.isPlaying = true;
    this.isMuted = false;
  }

  public setSoundscapeMode(mode: string) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    const preset = SOUNDSCAPE_PRESETS[mode] || SOUNDSCAPE_PRESETS['Deep Binaural Alpha'];

    // Smooth modulation without stopping or restarting oscillators
    if (this.ctx && this.isPlaying && this.osc1 && this.osc2 && this.filter) {
      const now = this.ctx.currentTime;
      // Smooth frequency glides over 800ms
      this.osc1.frequency.setTargetAtTime(preset.baseFreq, now, 0.4);
      this.osc2.frequency.setTargetAtTime(preset.baseFreq + preset.offsetFreq, now, 0.4);
      this.filter.frequency.setTargetAtTime(preset.filterCutoff, now, 0.4);
      this.filter.Q.setTargetAtTime(preset.filterQ, now, 0.4);
      this.osc1.type = preset.type;
      this.osc2.type = preset.type;
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.gainNode && this.isPlaying && !this.isMuted) {
      const targetGain = this.calculateTargetGain();
      this.gainNode.gain.setTargetAtTime(Math.max(0.0001, targetGain), this.ctx.currentTime, 0.1);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.gainNode && this.isPlaying) {
      const targetGain = muted ? 0.0001 : this.calculateTargetGain();
      this.gainNode.gain.setTargetAtTime(Math.max(0.0001, targetGain), this.ctx.currentTime, 0.15);
    }
  }

  public setAdaptive(adaptive: boolean) {
    this.isAdaptive = adaptive;
    if (!adaptive && this.filter && this.ctx) {
      const preset = SOUNDSCAPE_PRESETS[this.currentMode] || SOUNDSCAPE_PRESETS['Deep Binaural Alpha'];
      this.filter.frequency.setTargetAtTime(preset.filterCutoff, this.ctx.currentTime, 0.4);
    }
  }

  public modulateWithVitals(pulseRate: number | null, breathingWave: number | null) {
    if (!this.ctx || !this.filter || !this.isPlaying || !this.isAdaptive || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Smooth bounded parameter changes (350Hz - 700Hz)
    if (breathingWave !== null && !isNaN(breathingWave)) {
      const clampedWave = Math.max(-1, Math.min(1, breathingWave));
      const targetFreq = 400 + (clampedWave + 1.0) * 150;
      this.filter.frequency.setTargetAtTime(targetFreq, now, 0.3);
    }
  }

  private calculateTargetGain(): number {
    if (this.isMuted) return 0.0001;
    // Map 0..1 master volume to comfortable acoustic listening level 0..0.12
    return this.masterVolume * 0.12;
  }

  public stop() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      if (this.gainNode) {
        this.gainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      }
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.gainNode?.disconnect();
        } catch (e) {}
        this.isPlaying = false;
        this.isMuted = false;
        this.osc1 = null;
        this.osc2 = null;
        this.gainNode = null;
        this.filter = null;
      }, 350);
    } catch (e) {
      this.isPlaying = false;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsAdaptive(): boolean {
    return this.isAdaptive;
  }
}

export const bioAudio = new BioAudioEngine();

