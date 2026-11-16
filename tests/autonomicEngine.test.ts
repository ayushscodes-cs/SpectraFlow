import { describe, it, expect } from 'vitest';
import { AutonomicEngine } from '../src/main/autonomicEngine';

describe('AutonomicEngine - Non-Medical Focus Rhythm & Signal Validation', () => {
  it('should calculate flow coherence score only when signal confidence is high', () => {
    const engine = new AutonomicEngine();
    const payload = engine.processSample({
      pulseRate: 72,
      pulseConfidence: 0.95,
      breathingRate: 12,
      breathingConfidence: 0.90,
      chestDisplacement: 0.45,
      isBlinking: false,
    });

    expect(payload.pulseRate).toBe(72);
    expect(payload.breathingRate).toBe(12);
    expect(payload.signalQuality).toBe('EXCELLENT');
    expect(payload.flowCoherenceScore).toBeGreaterThanOrEqual(80);
    expect(payload.rhythmState).toBe('STABLE_FOCUS');
  });

  it('should withhold flow coherence score when signal confidence is insufficient', () => {
    const engine = new AutonomicEngine();
    
    // Simulate elapsed session warmup
    const futureTime = Date.now() + 25000;
    const originalNow = Date.now;
    global.Date.now = () => futureTime;

    const payload = engine.processSample({
      pulseRate: 74,
      pulseConfidence: 0.15, // Low confidence
      breathingRate: null,
      breathingConfidence: 0.10,
    });

    global.Date.now = originalNow;

    expect(payload.signalQuality).toBe('LOW_CONFIDENCE');
    expect(payload.flowCoherenceScore).toBeNull();
    expect(payload.rhythmState).toBe('AWAITING_SIGNAL');
  });

  it('should track blink rate as an experimental non-clinical interaction heuristic', () => {
    const engine = new AutonomicEngine();
    
    // First sample with blink
    engine.processSample({
      isBlinking: true,
      pulseRate: 70,
      pulseConfidence: 0.8,
    });

    // Second sample without blink
    const payload = engine.processSample({
      isBlinking: false,
      pulseRate: 70,
      pulseConfidence: 0.8,
    });

    expect(payload.totalBlinksDetected).toBe(1);
    expect(payload.isTalking).toBe(false);
  });
});

