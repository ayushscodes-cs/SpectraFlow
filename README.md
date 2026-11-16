# SpectraFlow — Bio-Adaptive Deep Work Studio

> **An autonomous cognitive flow companion and autonomic co-pilot powered by the Presage SmartSpectra SDK.**
> Built for the **Presage SmartSpectra SDK Challenge** (`#presagechallenge`).

---

## 🌟 Overview & Problem Solved

Knowledge workers, researchers, and engineers spend long stretches absorbed in intense cognitive work, unaware of autonomic nervous system strain until severe eye fatigue, burnout, or mental exhaustion sets in. 

Conventional focus clocks (like Pomodoro timers) are static and insensitive to the user:
- They aggressively ring and break your momentum when you are in effortless **deep flow**.
- They fail to notice when you are experiencing **"screen apnea"** (subconsciously arresting breathing while debugging complex problems) or acute autonomic stress.

**SpectraFlow** transforms your workspace into an intelligent, bio-adaptive environment. Using the **Presage SmartSpectra SDK**, SpectraFlow monitors your real-time physiological signals through your standard computer webcam with **100% local processing** and zero cloud transmission.

---

## 🔬 How SmartSpectra Directly Drives SpectraFlow

1. **Optical Plethysmograph Waveform (PPG) & Pulse Rate (`cardioMetrics`):**
   - Extracts micro-vascular optical pulsations from facial skin at ~30Hz.
   - Monitors sympathetic arousal vs. parasympathetic rest.
2. **Respiratory Tidal Wave & Cadence (`breathingMetrics`):**
   - Measures chest displacement and respiratory rate.
   - Real-time detection of **Screen Apnea** (breath-holding episodes > 7s).
3. **Facial Dynamics & Ocular Strain (`faceMetrics`):**
   - Monitors blink rate and prolonged stare fixations to detect optical fatigue.
4. **Bio-Generative Spatial Audio Engine:**
   - Synthesizes dynamic, non-distracting ambient focus audio (Web Audio API).
   - Generative low-pass filter and binaural alpha tones subtly "breathe" with your respiratory curve and heart rate to gently entrain sustained concentration.
5. **Autonomic Flow Coherence & Local Telemetry Ledger:**
   - Generates an objective, continuous **Flow Coherence Score (0-100%)**.
   - Preserves session summaries 100% locally on your machine.

---

## 🔒 Privacy, Consent & Ethical Architecture

- **No Medical Diagnostic Claims:** SpectraFlow is designed solely as a cognitive ergonomics tool and does not provide medical diagnoses or treatment recommendations.
- **Affirmative Hardware Consent:** Webcams remain completely inert upon application launch. Explicit user consent is mandatory via the Consent Gate.
- **100% Local Optical Processing:** Native Presage C ABI bindings evaluate frames directly in volatile memory. No video or raw pictures are ever saved to disk or transmitted over the network.
- **Hardware Kill Switch:** A single click instantly releases the camera and tears down the SmartSpectra session.
- **Honest Labelling:** If no API key is detected in `.env`, the studio transparently operates in an explicitly labelled Development Lab Simulator.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js 20+ (Tested on Node v24.20)
- npm 10+
- OS: Windows x64, macOS, or Linux
- Standard webcam

### Installation
```bash
# Clone the repository
git clone https://github.com/Ayush/SpectraFlow.git
cd SpectraFlow

# Install dependencies (includes @smartspectra/node-sdk v3.5.0)
npm install
```

### Configure API Key
Create a `.env` file in the project root:
```ini
# Presage SmartSpectra API Key (register at https://physiology.presagetech.com/auth/register)
SMARTSPECTRA_API_KEY=your_actual_key_here
```

### Run Application
```bash
# Start Vite development server & Electron desktop window
npm run dev
```

### Build for Distribution
```bash
npm run build
```

---

## 🧪 Automated Testing

SpectraFlow includes automated test suites covering autonomic engine calculations, screen apnea triggers, and ocular strain thresholds:
```bash
npx vitest run
```

---

## 🏆 Prize Category Nominations

1. **Best Overall Human-Sensing Experience:** Seamless, multi-signal integration (Cardio + Respiration + Facial Dynamics) driving real-time cognitive bio-adaptation.
2. **Best Thoughtful Real-World Use:** Solves screen apnea, ocular strain, and workplace burnout for knowledge workers.
3. **Most Creative or Delightful Use:** Bio-adaptive generative soundscapes and live respiratory tidal visualizers that turn biological rhythms into focus harmony.
