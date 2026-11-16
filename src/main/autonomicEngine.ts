import {
  VitalsTelemetryPayload,
  ProcessingLifecycleStatus,
} from '../types/telemetry';

export class AutonomicEngine {
  private lastBlinkTimes: number[] = [];
  private pulseHistory: number[] = [];
  private breathingHistory: number[] = [];
  private lastBreathingMoveTime: number = Date.now();
  private lastChestVal: number = 0;
  private screenApneaActive: boolean = false;
  private consecutiveApneaCycles: number = 0;

  public processSample(raw: {
    pulseRate?: number | null;
    pulseConfidence?: number;
    ppgTrace?: number | null;
    breathingRate?: number | null;
    chestDisplacement?: number | null;
    isBlinking?: boolean;
    expression?: string;
  }): VitalsTelemetryPayload {
    const now = Date.now();

    // 1. Process Blinks & Eye Strain
    if (raw.isBlinking) {
      this.lastBlinkTimes.push(now);
    }
    // Retain blinks in the last 60 seconds
    this.lastBlinkTimes = this.lastBlinkTimes.filter((t) => now - t <= 60000);
    const blinkRate = this.lastBlinkTimes.length;
    // Normal blink rate is 12-20 bpm. Prolonged staring < 5 bpm indicates severe ocular strain
    const eyeStrainDetected = blinkRate < 4 && this.lastBlinkTimes.length > 0;

    // 2. Screen Apnea Detection (Arresting breath during cognitive load)
    const chest = raw.chestDisplacement ?? 0;
    const deltaChest = Math.abs(chest - this.lastChestVal);
    this.lastChestVal = chest;

    if (deltaChest > 0.05) {
      this.lastBreathingMoveTime = now;
      this.consecutiveApneaCycles = 0;
      this.screenApneaActive = false;
    } else {
      // If respiratory motion is paused for > 7 seconds during an active session
      if (now - this.lastBreathingMoveTime > 7000) {
        this.screenApneaActive = true;
        this.consecutiveApneaCycles++;
      }
    }

    // 3. Autonomic Equilibrium & Flow Coherence Calculation
    const pulse = raw.pulseRate ?? null;
    const pulseConf = raw.pulseConfidence ?? 0.8;
    const breathing = raw.breathingRate ?? null;

    if (pulse && pulse > 40 && pulse < 180) {
      this.pulseHistory.push(pulse);
      if (this.pulseHistory.length > 30) this.pulseHistory.shift();
    }
    if (breathing && breathing > 6 && breathing < 35) {
      this.breathingHistory.push(breathing);
      if (this.breathingHistory.length > 30) this.breathingHistory.shift();
    }

    // Coherence logic: Ideal flow is characterized by stable cardiac cadence (60-80 bpm),
    // diaphragmatic breathing rhythm (10-14 bpm), and regular blink cycles.
    let coherence = 75; // baseline
    if (pulse) {
      if (pulse >= 60 && pulse <= 78) coherence += 10;
      else if (pulse > 95) coherence -= 15; // sympathetic elevation
    }
    if (breathing) {
      if (breathing >= 9 && breathing <= 15) coherence += 10;
      else if (breathing > 22) coherence -= 15; // rapid shallow breathing
    }
    if (this.screenApneaActive) coherence -= 25;
    if (eyeStrainDetected) coherence -= 10;

    const flowCoherenceScore = Math.max(10, Math.min(100, Math.round(coherence)));

    let autonomicState: VitalsTelemetryPayload['autonomicState'] = 'BALANCED_FOCUS';
    if (flowCoherenceScore >= 82) autonomicState = 'DEEP_FLOW';
    else if (this.screenApneaActive || (pulse && pulse > 95)) autonomicState = 'SYMPATHETIC_STRAIN';
    else if (eyeStrainDetected || flowCoherenceScore < 50) autonomicState = 'FATIGUE_DRIFT';

    return {
      timestamp: now,
      pulseRate: pulse,
      pulseConfidence: pulseConf,
      ppgTrace: raw.ppgTrace ?? null,
      breathingRate: breathing,
      breathingConfidence: breathing ? 0.85 : 0.4,
      chestDisplacement: chest,
      isBlinking: !!raw.isBlinking,
      blinkRatePerMin: blinkRate,
      screenApneaDetected: this.screenApneaActive,
      eyeStrainDetected,
      expression: raw.expression,
      flowCoherenceScore,
      autonomicState,
    };
  }

  public reset() {
    this.lastBlinkTimes = [];
    this.pulseHistory = [];
    this.breathingHistory = [];
    this.lastBreathingMoveTime = Date.now();
    this.screenApneaActive = false;
    this.consecutiveApneaCycles = 0;
  }
}
