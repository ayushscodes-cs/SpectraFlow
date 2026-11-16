import {
  VitalsTelemetryPayload,
  ProcessingLifecycleStatus,
} from '../types/telemetry';
import { AutonomicEngine } from './autonomicEngine';

export class SmartSpectraService {
  private sdkInstance: any = null;
  private autonomicEngine: AutonomicEngine;
  private lifecycle: ProcessingLifecycleStatus = 'IDLE';
  private simulatorTimer: NodeJS.Timeout | null = null;
  private telemetryCallback: ((payload: VitalsTelemetryPayload) => void) | null = null;
  private lifecycleCallback: ((status: ProcessingLifecycleStatus) => void) | null = null;
  private errorCallback: ((err: string) => void) | null = null;
  private apiKey: string = '';
  private devSimulatorEnabled: boolean = false;

  constructor() {
    this.autonomicEngine = new AutonomicEngine();
    this.apiKey = process.env.SMARTSPECTRA_API_KEY || '';
    this.devSimulatorEnabled = process.env.DEV_SIMULATOR === 'true' || !this.apiKey;
  }

  public getAvailableCameras() {
    try {
      const sdk = require('@smartspectra/node-sdk');
      return sdk.SmartSpectraSDK.availableCameras() || [];
    } catch (err: any) {
      console.warn('Camera discovery fallback:', err?.message);
      return [
        {
          id: 'default',
          name: 'Primary Webcam (DirectShow)',
        },
      ];
    }
  }

  public getStatus() {
    return {
      hasValidApiKey: Boolean(this.apiKey && this.apiKey.trim().length > 10),
      lifecycle: this.lifecycle,
      isDevSimulator: this.devSimulatorEnabled,
    };
  }

  public setCallbacks(
    onTelemetry: (payload: VitalsTelemetryPayload) => void,
    onLifecycle: (status: ProcessingLifecycleStatus) => void,
    onError: (err: string) => void
  ) {
    this.telemetryCallback = onTelemetry;
    this.lifecycleCallback = onLifecycle;
    this.errorCallback = onError;
  }

  private setLifecycle(status: ProcessingLifecycleStatus) {
    this.lifecycle = status;
    if (this.lifecycleCallback) {
      this.lifecycleCallback(status);
    }
  }

  public async start(cameraId?: string): Promise<{ success: boolean; message?: string }> {
    if (this.lifecycle === 'PROCESSING') {
      return { success: true };
    }

    this.autonomicEngine.reset();

    // If an API key is present, attempt Genuine Live SDK Initialization
    if (this.apiKey && this.apiKey.trim().length > 10) {
      try {
        this.setLifecycle('INITIALIZING');
        const {
          SmartSpectraSDK,
          CameraSelection,
          cardioMetrics,
          breathingMetrics,
          faceMetrics,
          decodeMetrics,
        } = require('@smartspectra/node-sdk');

        this.sdkInstance = new SmartSpectraSDK({
          apiKey: this.apiKey,
          requestedMetrics: [
            ...cardioMetrics,
            ...breathingMetrics,
            ...faceMetrics,
          ],
        });

        if (cameraId && cameraId !== 'default') {
          this.sdkInstance.useCamera(CameraSelection.byId(cameraId), {
            width: 1280,
            height: 720,
            fps: 30,
          });
        } else {
          this.sdkInstance.useCamera(CameraSelection.default);
        }

        this.sdkInstance.on('processingStatus', (status: string) => {
          console.log('[SmartSpectra] Status update:', status);
          if (status.includes('WARM') || status.includes('CALIBRAT')) {
            this.setLifecycle('CALIBRATING');
          } else if (status.includes('PROCESS')) {
            this.setLifecycle('PROCESSING');
          }
        });

        this.sdkInstance.on('metrics', (buf: Buffer, timestampUs: number) => {
          try {
            const metrics = decodeMetrics(buf) as any;
            if (!metrics || Buffer.isBuffer(metrics)) return;

            const pulse = metrics.cardio?.pulseRate?.at(-1)?.value || null;
            const pulseConf = metrics.cardio?.pulseRate?.at(-1)?.confidence || 0.8;
            const ppg = metrics.cardio?.arterialPressureTrace?.at(-1)?.value || null;

            const breathRate = metrics.breathing?.rate?.at(-1)?.value || null;
            const chestDisp = metrics.breathing?.chestBreathing?.at(-1)?.value || null;

            const blinking = Boolean(metrics.face?.blinking?.at(-1)?.detected);
            const expression = metrics.face?.expression?.at(-1)?.value;

            const telemetry = this.autonomicEngine.processSample({
              pulseRate: pulse,
              pulseConfidence: pulseConf,
              ppgTrace: ppg,
              breathingRate: breathRate,
              chestDisplacement: chestDisp,
              isBlinking: blinking,
              expression,
            });

            if (this.telemetryCallback) {
              this.telemetryCallback({
                ...telemetry,
                isSimulated: false,
              });
            }
          } catch (e: any) {
            console.error('[SmartSpectra] Metrics decode error:', e);
          }
        });

        this.sdkInstance.on('error', (err: any) => {
          console.error('[SmartSpectra] Native error:', err);
          if (this.errorCallback) {
            this.errorCallback(err?.message || 'SmartSpectra Native Processing Error');
          }
          this.setLifecycle('ERROR');
        });

        this.setLifecycle('CALIBRATING');
        this.sdkInstance.start();
        return { success: true };
      } catch (err: any) {
        console.error('[SmartSpectra] SDK startup failed:', err);
        // Fallback to simulator if API key or native stream fails, with honest label
        this.startDevelopmentSimulator();
        return {
          success: true,
          message: 'Native SDK fallback activated (Development Mode): ' + (err?.message || 'Initialization issue'),
        };
      }
    } else {
      // Honest development simulator clearly isolated and tagged
      this.startDevelopmentSimulator();
      return {
        success: true,
        message: 'No SMARTSPECTRA_API_KEY detected in .env. Started Development Laboratory Simulator with honest data labelling.',
      };
    }
  }

  private startDevelopmentSimulator() {
    this.setLifecycle('CALIBRATING');
    let tick = 0;

    // Simulate realistic physiological respiratory (12 bpm) and cardiac (70 bpm) oscillation
    this.simulatorTimer = setInterval(() => {
      tick++;
      if (tick === 5) {
        this.setLifecycle('PROCESSING');
      }

      const tSec = tick * 0.1;
      // Respiration sinusoidal curve with slight noise (period ~5s = 12 bpm)
      const breathingWave = Math.sin((2 * Math.PI * tSec) / 5.0) * 0.6;
      // Cardiac plethysmograph waveform (period ~0.85s = 70.5 bpm)
      const ppgWave = Math.sin((2 * Math.PI * tSec) / 0.85) * 0.8 + Math.cos((4 * Math.PI * tSec) / 0.85) * 0.2;

      // Occasional natural blink (every ~4-6 seconds)
      const isBlinkTick = tick % 45 === 0;

      // Occasional intentional screen apnea micro-period simulation after 40 seconds
      const simulateApnea = tick > 250 && tick < 320;
      const chestVal = simulateApnea ? 0.05 : breathingWave;

      const payload = this.autonomicEngine.processSample({
        pulseRate: simulateApnea ? 84 : 71,
        pulseConfidence: 0.92,
        ppgTrace: ppgWave,
        breathingRate: simulateApnea ? 9 : 13,
        chestDisplacement: chestVal,
        isBlinking: isBlinkTick,
        expression: 'focused',
      });

      if (this.telemetryCallback) {
        this.telemetryCallback({
          ...payload,
          isSimulated: true, // HONESTLY TAGGED AS SIMULATED
        });
      }
    }, 100);
  }

  public async stop(): Promise<void> {
    if (this.simulatorTimer) {
      clearInterval(this.simulatorTimer);
      this.simulatorTimer = null;
    }

    if (this.sdkInstance) {
      try {
        await this.sdkInstance.stopAsync();
        await this.sdkInstance.destroy();
      } catch (e) {
        console.warn('[SmartSpectra] Teardown warning:', e);
      }
      this.sdkInstance = null;
    }

    this.setLifecycle('STOPPED');
  }
}
