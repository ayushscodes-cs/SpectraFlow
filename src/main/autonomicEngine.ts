import {
  VitalsTelemetryPayload,
} from '../types/telemetry';

export class AutonomicEngine {
  private lastBlinkTimes: number[] = [];
  private totalBlinkCount: number = 0;
  private wasBlinkingPreviousSample: boolean = false;
  private pulseHistory: number[] = [];
  private breathingHistory: number[] = [];
  private sessionStartTime: number = Date.now();

  public processSample(raw: {
    pulseRate?: number | null;
    pulseConfidence?: number;
    ppgTrace?: number | null;
    hrvRmssd?: number | null;
    hrvConfidence?: number;
    breathingRate?: number | null;
    breathingConfidence?: number;
    chestDisplacement?: number | null;
    isBlinking?: boolean;
    isTalking?: boolean;
    expression?: string;
    validationHint?: string;
    isSimulated?: boolean;
  }): VitalsTelemetryPayload {
    const now = Date.now();

    // 1. Process Blinks: Discrete Edge Detection (False -> True transition)
    const currentBlink = Boolean(raw.isBlinking);
    if (currentBlink && !this.wasBlinkingPreviousSample) {
      this.totalBlinkCount++;
      this.lastBlinkTimes.push(now);
    }
    this.wasBlinkingPreviousSample = currentBlink;

    // Rolling window for rate calculation: blinks within the last 60 seconds
    this.lastBlinkTimes = this.lastBlinkTimes.filter((t) => now - t <= 60000);
    const sessionElapsedMin = Math.max(0.1, (now - this.sessionStartTime) / 60000);
    // Extrapolate safely during initial minute without crazy spikes
    const rollingRate =
      sessionElapsedMin < 1.0
        ? Math.round(this.lastBlinkTimes.length / sessionElapsedMin)
        : this.lastBlinkTimes.length;

    const pulse = raw.pulseRate ?? null;
    const pulseConf = raw.pulseConfidence ?? 0;
    const breathing = raw.breathingRate ?? null;
    const breathingConf = raw.breathingConfidence ?? 0;

    // 2. Signal Quality Validation Gate with Hysteresis (prevents flickering)
    let signalQuality: VitalsTelemetryPayload['signalQuality'] = 'WARMING_UP';
    const isWarmingUp = now - this.sessionStartTime < 8000;

    if (raw.chestDisplacement !== null || (pulse && pulseConf >= 0.5) || (breathing && breathingConf >= 0.5)) {
      signalQuality = 'EXCELLENT';
    } else if (raw.isBlinking || raw.isTalking) {
      signalQuality = 'ADEQUATE';
    } else if (isWarmingUp) {
      signalQuality = 'WARMING_UP';
    } else {
      signalQuality = 'LOW_CONFIDENCE';
    }

    // 3. Transparent Cognitive Work Rhythm Score (Non-Medical)
    let flowCoherenceScore: number | null = null;
    let rhythmState: VitalsTelemetryPayload['rhythmState'] = 'AWAITING_SIGNAL';

    if (signalQuality === 'EXCELLENT' || signalQuality === 'ADEQUATE') {
      if (pulse) {
        this.pulseHistory.push(pulse);
        if (this.pulseHistory.length > 30) this.pulseHistory.shift();
      }
      if (breathing) {
        this.breathingHistory.push(breathing);
        if (this.breathingHistory.length > 30) this.breathingHistory.shift();
      }

      let score = 70;
      if (pulse && pulse >= 55 && pulse <= 85) score += 15;
      if (breathing && breathing >= 10 && breathing <= 18) score += 15;
      flowCoherenceScore = Math.max(10, Math.min(100, score));

      if (flowCoherenceScore >= 80) {
        rhythmState = 'STABLE_FOCUS';
      } else {
        rhythmState = 'ACTIVE_PACING';
      }
    } else if (signalQuality === 'WARMING_UP') {
      rhythmState = 'WARMING_UP';
    } else {
      rhythmState = 'AWAITING_SIGNAL';
    }

    return {
      timestamp: now,
      pulseRate: pulse,
      pulseConfidence: pulseConf,
      ppgTrace: raw.ppgTrace ?? null,
      hrvRmssd: raw.hrvRmssd ?? null,
      hrvConfidence: raw.hrvConfidence ?? 0,
      breathingRate: breathing,
      breathingConfidence: breathingConf,
      chestDisplacement: raw.chestDisplacement ?? null,
      isBlinking: currentBlink,
      isTalking: Boolean(raw.isTalking),
      totalBlinksDetected: this.totalBlinkCount,
      blinkRatePerMin: Math.min(120, rollingRate),
      expression: raw.expression,
      signalQuality,
      validationHint: raw.validationHint,
      flowCoherenceScore,
      rhythmState,
      isSimulated: Boolean(raw.isSimulated),
    };
  }

  public reset() {
    this.lastBlinkTimes = [];
    this.totalBlinkCount = 0;
    this.wasBlinkingPreviousSample = false;
    this.pulseHistory = [];
    this.breathingHistory = [];
    this.sessionStartTime = Date.now();
  }
}

