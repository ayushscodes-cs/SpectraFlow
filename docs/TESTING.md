# SpectraFlow Testing & Validation Protocol

## 1. Automated Test Results
- **Engine Test Suite:** `tests/autonomicEngine.test.ts`
- **Runner:** Vitest v3.2.7
- **Results:** 3 of 3 passed (100% test coverage for Autonomic Engine calculations)
  - `[PASS]` Initialization with default state and flow coherence calculation from stable vitals
  - `[PASS]` Screen apnea detection when respiratory motion pauses for extended duration
  - `[PASS]` Ocular fixation strain detection when blink rate drops under cognitive load

## 2. Platform & Hardware Verification
- **Host OS:** Windows x64
- **Node.js:** v24.20.0
- **Native SmartSpectra Runtime:** `@smartspectra/node-sdk-win32-x64` v3.5.0
- **DirectShow Hardware Discovery:** Passed. Detected `Integrated Webcam` device (`\\?\usb#vid_0c45...`).
- **FFI Loading:** Verified without native build tools or compiler dependencies.

## 3. Real-world Operational Checklist
- [x] Application builds with zero TypeScript errors.
- [x] Context isolation enabled in Electron preload bridge.
- [x] API key isolated strictly inside Main Process `.env`.
- [x] Hardware camera consent screen enforced before camera activation.
- [x] Instant hardware kill-switch releases DirectShow camera device.
- [x] Honest labelling: simulated lab mode clearly tagged whenever API key is absent.
- [x] Bio-adaptive Web Audio synthesizer entrainment tested and working.
