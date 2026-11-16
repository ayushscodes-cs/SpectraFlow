import { describe, it, expect } from 'vitest';
import { AutonomicEngine } from '../src/main/autonomicEngine';

describe('AutonomicEngine - Physiological Coherence & Strain Analysis', () => {
  it('should initialize with default state and calculate flow coherence from stable vitals', () => {
    const engine = new AutonomicEngine();
    const payload = engine.processSample({
      pulseRate: 72,
      pulseConfidence: 0.95,
      breathingRate: 12,
      chestDisplacement: 0.45,
      isBlinking: false,
    });

    expect(payload.pulseRate).toBe(72);
    expect(payload.breathingRate).toBe(12);
    expect(payload.flowCoherenceScore).toBeGreaterThanOrEqual(80);
    expect(payload.autonomicState).toBe('DEEP_FLOW');
  });

  it('should detect screen apnea when respiratory motion pauses for extended duration', () => {
    const engine = new AutonomicEngine();
    
    // First sample establishes initial chest movement
    engine.processSample({
      pulseRate: 74,
      chestDisplacement: 0.5,
    });

    // Simulate apnea by freezing chest displacement for 8 seconds
    const futureTime = Date.now() + 8500;
    const originalNow = Date.now;
    global.Date.now = () => futureTime;

    const apneaPayload = engine.processSample({
      pulseRate: 88,
      chestDisplacement: 0.501, // negligible motion
    });

    global.Date.now = originalNow;

    expect(apneaPayload.screenApneaDetected).toBe(true);
    expect(apneaPayload.autonomicState).toBe('SYMPATHETIC_STRAIN');
  });

  it('should detect ocular fixation strain when blink rate is abnormally low', () => {
    const engine = new AutonomicEngine();
    
    // Process single blink
    engine.processSample({
      isBlinking: true,
      pulseRate: 70,
    });

    const payload = engine.processSample({
      isBlinking: false,
      pulseRate: 70,
    });

    expect(payload.blinkRatePerMin).toBe(1);
    expect(payload.eyeStrainDetected).toBe(true);
  });
});
