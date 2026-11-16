import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import { SmartSpectraService } from './smartspectraService';
import { ProcessingLifecycleStatus, VitalsTelemetryPayload } from '../types/telemetry';

dotenv.config();

let mainWindow: BrowserWindow | null = null;
let smartSpectraService: SmartSpectraService | null = null;
let userHasGrantedConsent: boolean = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'SpectraFlow — Bio-Adaptive Deep Work Studio',
    backgroundColor: '#0a0d14',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load Vite Dev Server URL or Production Build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  smartSpectraService = new SmartSpectraService();
  smartSpectraService.setCallbacks(
    (payload: VitalsTelemetryPayload) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('spectra:telemetry', payload);
      }
    },
    (status: ProcessingLifecycleStatus) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('spectra:lifecycle', status);
      }
    },
    (errMsg: string) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('spectra:error', errMsg);
      }
    }
  );
}

// IPC Handlers
ipcMain.handle('spectra:getAvailableCameras', async () => {
  return smartSpectraService ? smartSpectraService.getAvailableCameras() : [];
});

ipcMain.handle('spectra:getConsentStatus', async () => {
  return userHasGrantedConsent;
});

ipcMain.handle('spectra:setConsentStatus', async (_event, granted: boolean) => {
  userHasGrantedConsent = granted;
  if (!granted && smartSpectraService) {
    await smartSpectraService.stop();
  }
  return userHasGrantedConsent;
});

ipcMain.handle('spectra:getSystemStatus', async () => {
  return smartSpectraService
    ? smartSpectraService.getStatus()
    : { hasValidApiKey: false, lifecycle: 'IDLE', isDevSimulator: true };
});

ipcMain.handle('spectra:startSensing', async (_event, cameraId?: string) => {
  if (!userHasGrantedConsent) {
    return {
      success: false,
      message: 'Explicit user consent has not been granted. Physiological sensing blocked.',
    };
  }
  if (!smartSpectraService) {
    return { success: false, message: 'SmartSpectra service not initialized.' };
  }
  return smartSpectraService.start(cameraId);
});

ipcMain.handle('spectra:stopSensing', async () => {
  if (smartSpectraService) {
    await smartSpectraService.stop();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (smartSpectraService) {
    await smartSpectraService.stop();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
