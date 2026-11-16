import { contextBridge, ipcRenderer } from 'electron';
import {
  CameraDeviceInfo,
  ProcessingLifecycleStatus,
  SpectraIPCBridge,
  VitalsTelemetryPayload,
} from '../types/telemetry';

const apiBridge: SpectraIPCBridge = {
  getAvailableCameras: () => ipcRenderer.invoke('spectra:getAvailableCameras'),
  getConsentStatus: () => ipcRenderer.invoke('spectra:getConsentStatus'),
  setConsentStatus: (granted: boolean) => ipcRenderer.invoke('spectra:setConsentStatus', granted),
  startSensing: (cameraId?: string) => ipcRenderer.invoke('spectra:startSensing', cameraId),
  stopSensing: () => ipcRenderer.invoke('spectra:stopSensing'),
  getSystemStatus: () => ipcRenderer.invoke('spectra:getSystemStatus'),
  onVitalsTelemetry: (callback: (data: VitalsTelemetryPayload) => void) => {
    const handler = (_event: any, data: VitalsTelemetryPayload) => callback(data);
    ipcRenderer.on('spectra:telemetry', handler);
    return () => {
      ipcRenderer.removeListener('spectra:telemetry', handler);
    };
  },
  onLifecycleChange: (callback: (status: ProcessingLifecycleStatus) => void) => {
    const handler = (_event: any, status: ProcessingLifecycleStatus) => callback(status);
    ipcRenderer.on('spectra:lifecycle', handler);
    return () => {
      ipcRenderer.removeListener('spectra:lifecycle', handler);
    };
  },
  onError: (callback: (errorMessage: string) => void) => {
    const handler = (_event: any, msg: string) => callback(msg);
    ipcRenderer.on('spectra:error', handler);
    return () => {
      ipcRenderer.removeListener('spectra:error', handler);
    };
  },
};

contextBridge.exposeInMainWorld('spectraBridge', apiBridge);
