# SpectraFlow: Architecture & Engineering Design

```
+--------------------------------------------------------------------------------+
|                             SpectraFlow Desktop                                |
|                                                                                |
|  +--------------------------------------------------------------------------+  |
|  |                     Electron Main Process (Node.js)                      |  |
|  |                                                                          |  |
|  |  +------------------------+      +------------------------------------+  |  |
|  |  |  Presage SmartSpectra  | ---> |  Signal Filter & Autonomic Engine  |  |  |
|  |  |  SDK (koffi / C ABI)   |      |  - Windowing & confidence filters  |  |  |
|  |  |  - cardioMetrics       |      |  - Screen apnea detection          |  |  |
|  |  |  - breathingMetrics    |      |  - Blink rate & strain cadence     |  |  |
|  |  |  - faceMetrics         |      |  - Elastic flow scoring            |  |  |
|  |  +------------------------+      +------------------------------------+  |  |
|  |              |                                      |                    |  |
|  |              v                                      v                    |  |
|  |   [Hardware Camera Feed]               [Typed IPC Event Stream]          |  |
|  +-----------------------------------------------------|--------------------+  |
|                                                        |                       |
|                                        (Context-Isolated IPC Bridge)           |
|                                                        |                       |
|  +-----------------------------------------------------v--------------------+  |
|  |                     React 18 + Vite + Tailwind Renderer                  |  |
|  |                                                                          |  |
|  |  +------------------------+  +-------------------+  +-----------------+  |  |
|  |  | Consent & Privacy Gate |  | Real-time Pleth & |  | Generative Bio- |  |  |
|  |  | - Transparent notice   |  | Respiratory Wave  |  | Adaptive Audio  |  |  |
|  |  | - Hardware kill switch |  | Canvas Visualizer |  | Web Audio Synth |  |  |
|  |  +------------------------+  +-------------------+  +-----------------+  |  |
|  |                                                                          |  |
|  |  +--------------------------------------------------------------------+  |  |
|  |  |  Bio-Adaptive Work Studio: Elastic Pomodoro & Cognitive Telemetry  |  |  |
|  |  |  - Flow Coherence score (0-100%)                                   |  |  |
|  |  |  - Screen Apnea & Eye Fatigue gentle peripheral alerts             |  |  |
|  |  |  - Session Summary Ledger (Exportable, 100% Local)                 |  |  |
|  |  +--------------------------------------------------------------------+  |  |
|  +--------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------+
```

## Security & IPC Boundaries
1. **API Key Isolation:** Stored in `.env` / Main Process only. Never exposed over IPC or to Renderer window.
2. **Affirmative Hardware Consent:** Camera lifecycle remains in `STOPPED` state until explicit user interaction on the Consent Gate.
3. **Emergency Stop:** Immediate single-click Kill Switch triggers `sdk.stopAsync()` and hardware release.
4. **Data Locality:** All vitals are processed in-memory. Zero cloud telemetry or external logging of biological data.
