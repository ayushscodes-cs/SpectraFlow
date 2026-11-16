import dotenv from 'dotenv';
import path from 'path';
import {
  SmartSpectraSDK,
  CameraSelection,
  cardioMetrics,
  breathingMetrics,
  faceMetrics,
  decodeMetrics,
} from '@smartspectra/node-sdk';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const apiKey = process.env.SMARTSPECTRA_API_KEY;

console.log('--- 1. PACKAGE & RUNTIME VERIFICATION ---');
console.log('Package version from node-sdk loaded successfully');
console.log('API key detected (masked):', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'NONE');

async function runVerification() {
  console.log('\n--- 2. CAMERA DISCOVERY ---');
  const cameras = SmartSpectraSDK.availableCameras();
  console.log(`Found ${cameras.length} camera(s):`);
  cameras.forEach((cam, idx) => {
    console.log(` [${idx}] ID: ${cam.id.substring(0, 30)}... | Name: ${cam.name}`);
  });

  console.log('\n--- 3. REQUESTED METRICS CONFIGURATION ---');
  // Strict, verified metrics only: NO APNEA, NO INVALID ENUMS
  const requested = [
    ...cardioMetrics,
    ...breathingMetrics,
    ...faceMetrics,
  ];
  console.log('Configuring metrics: cardioMetrics, breathingMetrics, faceMetrics');

  console.log('\n--- 4. INITIALIZING SMARTSPECTRA SDK ---');
  const sdk = new SmartSpectraSDK({
    apiKey: apiKey || '',
    requestedMetrics: requested,
    enableTelemetry: true, // Transparently disclosed
  });

  const selectedCam = cameras.length > 0 ? CameraSelection.byId(cameras[0].id) : CameraSelection.default;
  sdk.useCamera(selectedCam, {
    width: 1280,
    height: 720,
    fps: 30,
  });

  let metricsReceived = 0;
  let validationReceived = 0;

  sdk.on('processingStatus', (status) => {
    console.log(`[Event: processingStatus] -> ${status}`);
  });

  sdk.on('validationStatus', (code, ts, hint) => {
    validationReceived++;
    if (validationReceived <= 3 || validationReceived % 15 === 0) {
      console.log(`[Event: validationStatus] Code: ${code} | Hint: ${hint || 'None'}`);
    }
  });

  sdk.on('metrics', (buf, ts) => {
    metricsReceived++;
    try {
      const decoded = decodeMetrics(buf);
      if (metricsReceived <= 5) {
        console.log(`[Event: metrics #${metricsReceived}] Decoded keys:`, Object.keys(decoded));
        if (decoded.cardio) {
          console.log('  cardio keys:', Object.keys(decoded.cardio));
          if (decoded.cardio.pulseRate) {
            console.log('  pulseRate sample count:', decoded.cardio.pulseRate.length);
          }
        }
        if (decoded.breathing) {
          console.log('  breathing keys:', Object.keys(decoded.breathing));
        }
        if (decoded.face) {
          console.log('  face keys:', Object.keys(decoded.face));
        }
      }
    } catch (e) {
      console.error('Error decoding metrics buffer:', e);
    }
  });

  sdk.on('error', (err) => {
    console.error('[Event: error] SDK reported error:', err);
  });

  console.log('\n--- 5. STARTING SDK CAMERA SESSION ---');
  try {
    sdk.start();
    console.log('sdk.start() called successfully. Listening for live events for 12 seconds...');

    await new Promise((resolve) => setTimeout(resolve, 12000));

    console.log('\n--- 6. TEARDOWN & DESTROY ---');
    console.log(`Total metrics frames received: ${metricsReceived}`);
    console.log(`Total validation frames received: ${validationReceived}`);
    console.log('Calling sdk.stopAsync()...');
    await sdk.stopAsync();
    console.log('Calling sdk.destroy()...');
    await sdk.destroy();
    console.log('SDK cleanly stopped and destroyed.');
    process.exit(0);
  } catch (err) {
    console.error('SDK Runtime Error:', err);
    process.exit(1);
  }
}

runVerification();
