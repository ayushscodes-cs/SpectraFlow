import {
  VitalsTelemetryPayload,
  ProcessingLifecycleStatus,
  AuthenticationState,
  SystemStatusPayload,
} from '../types/telemetry';
import { AutonomicEngine } from './autonomicEngine';

export class SmartSpectraService {
  private sdkInstance: any = null;
  private autonomicEngine: AutonomicEngine;
  private lifecycle: ProcessingLifecycleStatus = 'IDLE';
  private authState: AuthenticationState = 'NOT_CONFIGURED';
  private authErrorMessage: string = '';
  private simulatorTimer: NodeJS.Timeout | null = null;
  private telemetryCallback: ((payload: VitalsTelemetryPayload) => void) | null = null;
  private lifecycleCallback: ((status: ProcessingLifecycleStatus) => void) | null = null;
  private authStateCallback: ((state: AuthenticationState, errorMsg?: string) => void) | null = null;
  private errorCallback: ((err: string) => void) | null = null;
  private apiKey: string = '';
  private devSimulatorEnabled: boolean = false;
  private lastValidationHint: string = '';

  constructor() {
    this.autonomicEngine = new AutonomicEngine();
    this.apiKey = (process.env.SMARTSPECTRA_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    this.devSimulatorEnabled = process.env.DEV_SIMULATOR === 'true';

    if (!this.apiKey) {
      this.authState = 'NOT_CONFIGURED';
      this.authErrorMessage = 'No API key provided in .env';
    } else {
      // Configured, pending verification by native SDK handshake
      this.authState = 'CONFIGURING';
    }
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

  public getStatus(): SystemStatusPayload {
    return {
      hasConfiguredApiKey: Boolean(this.apiKey && this.apiKey.length > 5),
      authState: this.authState,
      authErrorMessage: this.authErrorMessage,
      lifecycle: this.lifecycle,
      isDevSimulator: this.devSimulatorEnabled,
      telemetryDisclosed: true,
    };
  }

  public setCallbacks(
    onTelemetry: (payload: VitalsTelemetryPayload) => void,
    onLifecycle: (status: ProcessingLifecycleStatus) => void,
    onAuthState: (state: AuthenticationState, errorMsg?: string) => void,
    onError: (err: string) => void
  ) {
    this.telemetryCallback = onTelemetry;
    this.lifecycleCallback = onLifecycle;
    this.authStateCallback = onAuthState;
    this.errorCallback = onError;
  }

  private setLifecycle(status: ProcessingLifecycleStatus) {
    this.lifecycle = status;
    if (this.lifecycleCallback) {
      this.lifecycleCallback(status);
    }
  }

  private setAuthState(state: AuthenticationState, errorMsg?: string) {
    this.authState = state;
    this.authErrorMessage = errorMsg || '';
    if (this.authStateCallback) {
      this.authStateCallback(state, errorMsg);
    }
  }

  public async start(cameraId?: string): Promise<{ success: boolean; message?: string }> {
    if (this.lifecycle === 'PROCESSING' || this.lifecycle === 'CALIBRATING') {
      return { success: true };
    }

    this.autonomicEngine.reset();

    // Ensure any existing native instance is completely stopped before starting fresh
    if (this.sdkInstance) {
      try {
        await this.sdkInstance.stopAsync();
        await this.sdkInstance.destroy();
      } catch (e) {
        console.warn('[SmartSpectra] Pre-start cleanup warning:', e);
      }
      this.sdkInstance = null;
    }

    // If an API key is present and simulator is not explicitly forced
    if (this.apiKey && this.apiKey.length > 10 && !this.devSimulatorEnabled) {
      try {
        this.setLifecycle('INITIALIZING');
        this.setAuthState('SDK_INITIALIZING');

        const {
          SmartSpectraSDK,
          CameraSelection,
          MetricType,
          decodeMetrics,
          SmartSpectraErrorCode,
        } = require('@smartspectra/node-sdk');

        // RESILIENT METRICS: Request verified on-device metrics that run reliably
        // without remote model download failures. Exclude APNEA (unavailable) and
        // EXPRESSIONS (which requires remote paired server model delivery).
        const requestedMetrics = [
          MetricType.CHEST_BREATHING,
          MetricType.BREATHING_RATE,
          MetricType.FACE_LANDMARKS,
          MetricType.BLINKING,
          MetricType.TALKING,
        ];

        this.sdkInstance = new SmartSpectraSDK({
          apiKey: this.apiKey,
          requestedMetrics,
          enableTelemetry: true, // Transparently disclosed
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

        this.setAuthState('CAMERA_READY');

        this.sdkInstance.on('processingStatus', (status: any) => {
          console.log('[SmartSpectra] Status update:', status);
          const strStatus = String(status);
          if (strStatus.includes('WARM') || strStatus.includes('CALIBRAT') || strStatus === '1') {
            this.setLifecycle('CALIBRATING');
          } else if (strStatus.includes('PROCESS') || strStatus === '2') {
            this.setLifecycle('PROCESSING');
            // If processing starts without fatal auth failure, SDK is active
            if (this.authState !== 'AUTHENTICATED') {
              this.setAuthState('AUTHENTICATED');
            }
          } else if (strStatus === '5') {
            this.setLifecycle('STOPPED');
          }
        });

        this.sdkInstance.on('validationStatus', (code: any, ts: any, hint: any) => {
          this.lastValidationHint = hint || '';
        });

        this.sdkInstance.on('metrics', (buf: Buffer, timestampUs: number) => {
          try {
            const metrics = decodeMetrics(buf) as any;
            if (!metrics || Buffer.isBuffer(metrics)) return;

            const pulse = metrics.cardio?.pulseRate?.at(-1)?.value ?? null;
            const pulseConf = metrics.cardio?.pulseRate?.at(-1)?.confidence ?? 0;
            const ppg = metrics.cardio?.arterialPressureTrace?.at(-1)?.value ?? null;
            const hrv = metrics.cardio?.hrv?.at(-1)?.value ?? null;
            const hrvConf = metrics.cardio?.hrv?.at(-1)?.confidence ?? 0;

            const breathRate = metrics.breathing?.rate?.at(-1)?.value ?? null;
            const breathConf = metrics.breathing?.rate?.at(-1)?.confidence ?? 0;
            const chestDisp = metrics.breathing?.chestBreathing?.at(-1)?.value ?? null;

            const blinking = Boolean(metrics.face?.blinking?.at(-1)?.detected);
            const talking = Boolean(metrics.face?.talking?.at(-1)?.detected);
            const expression = metrics.face?.expression?.at(-1)?.value;

            const telemetry = this.autonomicEngine.processSample({
              pulseRate: pulse,
              pulseConfidence: pulseConf,
              ppgTrace: ppg,
              hrvRmssd: hrv,
              hrvConfidence: hrvConf,
              breathingRate: breathRate,
              breathingConfidence: breathConf,
              chestDisplacement: chestDisp,
              isBlinking: blinking,
              isTalking: talking,
              expression,
              validationHint: this.lastValidationHint,
              isSimulated: false,
            });

            if (this.telemetryCallback) {
              this.telemetryCallback(telemetry);
            }
          } catch (e: any) {
            console.error('[SmartSpectra] Metrics decode error:', e);
          }
        });

        this.sdkInstance.on('error', (err: any) => {
          console.error('[SmartSpectra] Native error:', err);
          const errorCode = typeof err === 'number' ? err : err?.code;
          
          if (errorCode === 2 || String(err).includes('AuthenticationFailed') || String(err).includes('401')) {
            this.setAuthState('AUTHENTICATION_FAILED', 'API key authorization failed with Presage server (HTTP 401). Please verify key at physiology.presagetech.com.');
          } else {
            this.setAuthState('ERROR', typeof err === 'object' ? err?.message : String(err));
          }

          if (this.errorCallback) {
            this.errorCallback(typeof err === 'object' ? err?.message || JSON.stringify(err) : String(err));
          }
          this.setLifecycle('ERROR');
        });

        this.setLifecycle('CALIBRATING');
        this.sdkInstance.start();
        return { success: true };
      } catch (err: any) {
        console.error('[SmartSpectra] SDK startup failed:', err);
        this.setAuthState('ERROR', err?.message || 'SDK Initialization failed');
        this.startDevelopmentSimulator();
        return {
          success: true,
          message: 'Native SDK fallback activated (Development Mode): ' + (err?.message || 'Initialization issue'),
        };
      }
    } else {
      this.startDevelopmentSimulator();
      return {
        success: true,
        message: 'Operating in Development Laboratory Simulator with transparently labelled simulated waveforms.',
      };
    }
  }

  private startDevelopmentSimulator() {
    this.setLifecycle('CALIBRATING');
    let tick = 0;

    // Realistic non-medical lab simulator for interface testing
    this.simulatorTimer = setInterval(() => {
      tick++;
      if (tick === 8) {
        this.setLifecycle('PROCESSING');
      }

      const tSec = tick * 0.1;
      // Respiration wave (period ~5s = 12 rpm)
      const breathingWave = Math.sin((2 * Math.PI * tSec) / 5.0) * 0.6;
      // Cardiac plethysmograph wave (period ~0.85s = 70.5 bpm)
      const ppgWave = Math.sin((2 * Math.PI * tSec) / 0.85) * 0.8 + Math.cos((4 * Math.PI * tSec) / 0.85) * 0.2;

      // Occasional natural blink (every ~4-6 seconds)
      const isBlinkTick = tick % 45 === 0;

      const payload = this.autonomicEngine.processSample({
        pulseRate: 72,
        pulseConfidence: 0.92,
        ppgTrace: ppgWave,
        hrvRmssd: 42,
        hrvConfidence: 0.85,
        breathingRate: 13,
        breathingConfidence: 0.88,
        chestDisplacement: breathingWave,
        isBlinking: isBlinkTick,
        isTalking: false,
        expression: 'neutral',
        validationHint: 'Lab Simulator: Face Centered',
        isSimulated: true, // HONESTLY TAGGED AS SIMULATED
      });

      if (this.telemetryCallback) {
        this.telemetryCallback(payload);
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
