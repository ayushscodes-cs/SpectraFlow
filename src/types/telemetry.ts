export interface CameraDeviceInfo {
  id: string;
  name: string;
  facing?: string;
  lensType?: string;
}

export type ProcessingLifecycleStatus =
  | 'IDLE'
  | 'INITIALIZING'
  | 'WARMING_UP'
  | 'CALIBRATING'
  | 'PROCESSING'
  | 'UNSTABLE_SIGNAL'
  | 'STOPPED'
  | 'ERROR';

export interface VitalsTelemetryPayload {
  timestamp: number;
  // Cardio
  pulseRate: number | null;
  pulseConfidence: number; // 0.0 to 1.0
  ppgTrace: number | null;
  hrvRmssd?: number | null;
  // Respiration
  breathingRate: number | null;
  breathingConfidence: number;
  chestDisplacement: number | null;
  // Face & Ocular
  isBlinking: boolean;
  blinkRatePerMin: number;
  screenApneaDetected: boolean;
  eyeStrainDetected: boolean;
  expression?: string;
  // Cognitive Flow Synthesis
  flowCoherenceScore: number; // 0 to 100%
  autonomicState: 'DEEP_FLOW' | 'BALANCED_FOCUS' | 'SYMPATHETIC_STRAIN' | 'FATIGUE_DRIFT';
  isSimulated?: boolean;
}

export interface FocusSessionState {
  isActive: boolean;
  sessionDurationSec: number;
  targetDurationSec: number;
  isElasticExtended: boolean;
  screenApneaEvents: number;
  strainWarnings: number;
  averagePulse: number;
  averageBreathingRate: number;
  peakFlowCoherence: number;
}

export interface SpectraIPCBridge {
  getAvailableCameras: () => Promise<CameraDeviceInfo[]>;
  getConsentStatus: () => Promise<boolean>;
  setConsentStatus: (granted: boolean) => Promise<boolean>;
  startSensing: (cameraId?: string) => Promise<{ success: boolean; message?: string }>;
  stopSensing: () => Promise<void>;
  getSystemStatus: () => Promise<{
    hasValidApiKey: boolean;
    lifecycle: ProcessingLifecycleStatus;
    isDevSimulator: boolean;
  }>;
  onVitalsTelemetry: (callback: (data: VitalsTelemetryPayload) => void) => () => void;
  onLifecycleChange: (callback: (status: ProcessingLifecycleStatus) => void) => () => void;
  onError: (callback: (errorMessage: string) => void) => () => void;
}

declare global {
  interface Window {
    spectraBridge: SpectraIPCBridge;
  }
}
