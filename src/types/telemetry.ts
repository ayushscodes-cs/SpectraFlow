export interface CameraDeviceInfo {
  id: string;
  name: string;
  facing?: string;
  lensType?: string;
}

export type AuthenticationState =
  | 'NOT_CONFIGURED'
  | 'CONFIGURING'
  | 'AUTHENTICATED'
  | 'AUTHENTICATION_FAILED'
  | 'SDK_INITIALIZING'
  | 'SDK_READY'
  | 'CAMERA_READY'
  | 'PROCESSING'
  | 'ERROR';

export type ProcessingLifecycleStatus =
  | 'IDLE'
  | 'INITIALIZING'
  | 'WARMING_UP'
  | 'CALIBRATING'
  | 'PROCESSING'
  | 'INSUFFICIENT_SIGNAL'
  | 'STOPPED'
  | 'ERROR';

export interface VitalsTelemetryPayload {
  timestamp: number;
  // Cardio (from cardioMetrics)
  pulseRate: number | null;
  pulseConfidence: number; // 0.0 to 1.0
  ppgTrace: number | null;
  hrvRmssd?: number | null;
  hrvConfidence?: number;
  
  // Respiration (from breathingMetrics)
  breathingRate: number | null;
  breathingConfidence: number;
  chestDisplacement: number | null;
  
  // Face & Ocular Dynamics (from faceMetrics)
  isBlinking: boolean;
  isTalking: boolean;
  totalBlinksDetected: number; // Cumulative count
  blinkRatePerMin: number; // Rolling window rate
  expression?: string;

  // Signal & Telemetry Quality
  signalQuality: 'EXCELLENT' | 'ADEQUATE' | 'WARMING_UP' | 'LOW_CONFIDENCE';
  validationHint?: string;

  // Transparent Focus & Rhythm Synthesis (Non-medical focus metric)
  flowCoherenceScore: number | null;
  rhythmState: 'STABLE_FOCUS' | 'ACTIVE_PACING' | 'WARMING_UP' | 'AWAITING_SIGNAL';
  
  // Provenance & Mode
  isSimulated: boolean;
}

export interface FocusSessionState {
  isActive: boolean;
  sessionStartTimeMs: number | null;
  sessionDurationSec: number;
  validMeasurementDurationSec: number;
  averagePulse: number | null;
  averageBreathingRate: number | null;
}

export interface SystemStatusPayload {
  hasConfiguredApiKey: boolean;
  authState: AuthenticationState;
  authErrorMessage?: string;
  lifecycle: ProcessingLifecycleStatus;
  isDevSimulator: boolean;
  telemetryDisclosed: boolean;
}

export interface SpectraIPCBridge {
  getAvailableCameras: () => Promise<CameraDeviceInfo[]>;
  getConsentStatus: () => Promise<boolean>;
  setConsentStatus: (granted: boolean) => Promise<boolean>;
  startSensing: (cameraId?: string) => Promise<{ success: boolean; message?: string }>;
  stopSensing: () => Promise<void>;
  getSystemStatus: () => Promise<SystemStatusPayload>;
  onVitalsTelemetry: (callback: (data: VitalsTelemetryPayload) => void) => () => void;
  onLifecycleChange: (callback: (status: ProcessingLifecycleStatus) => void) => () => void;
  onAuthStateChange: (callback: (state: AuthenticationState, errorMsg?: string) => void) => () => void;
  onError: (callback: (errorMessage: string) => void) => () => void;
}

declare global {
  interface Window {
    spectraBridge: SpectraIPCBridge;
  }
}


