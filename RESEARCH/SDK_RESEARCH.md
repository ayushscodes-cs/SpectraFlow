# SmartSpectra Node.js / Electron SDK Research & Integration Guide

## 1. Package Overview
- **Package:** `@smartspectra/node-sdk` (v3.5.0)
- **Native Platform Binary:** `@smartspectra/node-sdk-win32-x64`
- **FFI Binding:** Powered by `koffi` (pure-FFI binding to C ABI shim, requiring zero node-gyp or native build tools)
- **Serialization:** Protobuf serialization parsed via `decodeMetrics(buf)` (powered by `protobufjs`)

## 2. Core Exports & Types
From `@smartspectra/node-sdk`:
```typescript
import {
  SmartSpectraSDK,
  CameraSelection,
  cardioMetrics,      // PULSE_RATE, ARTERIAL_PRESSURE_TRACE, HRV
  breathingMetrics,   // CHEST_BREATHING, ABDOMEN_BREATHING, BREATHING_RATE
  faceMetrics,        // landmarks, blinking, talking, expressions
  edaMetrics,
  decodeMetrics,
} from '@smartspectra/node-sdk';
```

## 3. SDK Lifecycle
```typescript
// 1. Discovery
const cameras = SmartSpectraSDK.availableCameras();
// Returns: Array<{ id: string, name: string, lensType?: string, facing?: string }>

// 2. Initialization
const sdk = new SmartSpectraSDK({
  apiKey: process.env.SMARTSPECTRA_API_KEY,
  requestedMetrics: [
    ...cardioMetrics,
    ...breathingMetrics,
    ...faceMetrics,
  ],
});

// 3. Source Selection
sdk.useCamera(CameraSelection.byId(cameras[0]?.id || CameraSelection.default), {
  width: 1280,
  height: 720,
  fps: 30,
});

// 4. Event Subscriptions
sdk.on('processingStatus', (status) => {
  // e.g., 'INITIALIZING', 'WARMING_UP', 'CALIBRATING', 'PROCESSING', 'STOPPED'
});

sdk.on('metrics', (buf: Buffer, timestampUs: number) => {
  const metrics = decodeMetrics(buf);
  if (Buffer.isBuffer(metrics)) return;
  
  // Extract Cardio
  const pulseRate = metrics.cardio?.pulseRate?.at(-1)?.value;
  const pulseConfidence = metrics.cardio?.pulseRate?.at(-1)?.confidence;
  const ppgTrace = metrics.cardio?.arterialPressureTrace?.at(-1)?.value;
  
  // Extract Breathing
  const breathingRate = metrics.breathing?.rate?.at(-1)?.value;
  const chestWaveform = metrics.breathing?.chestBreathing?.at(-1)?.value;
  
  // Extract Face & Attention
  const isBlinking = metrics.face?.blinking?.at(-1)?.detected;
  const landmarks = metrics.face?.landmarks?.at(-1)?.value;
  const expression = metrics.face?.expression?.at(-1)?.value;
});

sdk.on('error', (err) => {
  console.error('SmartSpectra error:', err);
});

// 5. Execution Controls
sdk.start();
// To stop:
await sdk.stopAsync();
// To teardown process-global native instance before reload:
await sdk.destroy();
```

## 4. Signal Temporal Windows & Latency
- **Facial Landmarks & Blinks:** Real-time (~30-60 Hz frame-by-frame updates, `< 100ms` detection).
- **Breathing Waveform:** Continuous displacement curve (~10-30 Hz).
- **Breathing Rate:** Requires ~30 seconds of rolling respiratory wave data.
- **Cardio Plethysmograph Waveform:** Continuous relative optical trace (~30 Hz).
- **Pulse Rate:** Requires ~12 seconds averaging window to establish accurate frequency.
- **Heart Rate Variability (HRV):** Requires ~60 seconds continuous beat-to-beat intervals.

## 5. Security & Privacy Safeguards
- Camera access requires explicit affirmative user consent in the UI before `sdk.start()`.
- API Key is stored strictly in the Electron Main process and accessed via environment variables; never passed into the browser renderer.
- Zero raw video frames are saved to disk or transmitted to any third-party server.
- All biometric signals are processed locally on the client device.
- Immediate "Stop Camera" kill-switch terminates camera stream and tears down FFI pipeline immediately.
