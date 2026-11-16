# SpectraFlow — Bio-Adaptive Deep Work Studio Powered by Presage SmartSpectra

*This article is submitted for the Presage SmartSpectra SDK Challenge on DEV Community (#devchallenge, #presagechallenge).*

---

## 1. What I Built

Modern deep work is an endurance sport. When developers, researchers, and knowledge workers enter intense problem-solving sessions, our bodies reflect that cognitive load in subtle, often detrimental ways:
- We experience **"screen apnea"**—subconsciously arresting or holding our breath for seconds at a time while reading cryptic stack traces or tricky logic.
- We suppress our natural blink rate down to dangerous levels, leading to severe ocular strain and headache.
- We suffer through fixed timers (like Pomodoro clocks) that rudely interrupt us while we are in effortless flow, yet fail to intervene when our sympathetic nervous system is red-lining with stress.

To solve this, I built **SpectraFlow**: an autonomous desktop cognitive flow companion and autonomic co-pilot built with Electron, React, TypeScript, and the **Presage SmartSpectra SDK (v3.5.0)**.

Instead of being a passive mirror that just displays vital signs, SpectraFlow **actively orchestrates your focus environment** based on live human physiological signals:
1. **Bio-Adaptive Audio Entrainment:** A real-time Web Audio generative synthesizer whose binaural frequencies and low-pass filter cutoff breathe and pulse in harmony with your live respiratory wave and heart rate.
2. **Screen Apnea Interruption:** Detects the moment your respiratory motion freezes during deep concentration and delivers a gentle, peripheral visual reminder to breathe.
3. **Autonomic Flow Coherence Meter:** Synthesizes cardiovascular stability, respiratory cadence, and blink regularity into a continuous, real-time Flow Coherence percentage (0–100%).
4. **Post-Sprint Telemetry Ledger:** Provides an objective summary of your physiological stamina, flow peaks, and apnea episodes—stored 100% locally.

---

## 2. Demo

- **Video Walkthrough (YouTube / Loom):** [Link to Demonstration Video]
- **Repository:** [https://github.com/Ayush/SpectraFlow](https://github.com/Ayush/SpectraFlow)

---

## 3. How It Responds to Human Signals

SpectraFlow does not rely on a single metric; it uses a multi-modal fusion of signals powered by the Presage SmartSpectra SDK:

| Signal | SDK Module | Application Response |
| :--- | :--- | :--- |
| **Cardio Pulse Rate & PPG** | `cardioMetrics` | Drives sympathetic vs. parasympathetic balance tracking and modulates the base tempo of the focus soundscape. |
| **Respiratory Tidal Wave** | `breathingMetrics` | Live dual-canvas rendering of respiratory motion. Detects screen apnea if chest displacement arrests for > 7s. |
| **Facial Landmarks & Blinks** | `faceMetrics` | Tracks blink cadence in real-time. Flags ocular fixation fatigue if blink frequency drops below 4 bpm. |
| **Autonomic Coherence** | Computed Engine | Dynamic composite score (0-100%) that determines when you are in "Deep Flow", "Sympathetic Strain", or "Fatigue Drift". |

---

## 4. Prize Categories

### 🥇 Best Overall Human-Sensing Experience
SpectraFlow is a complete, production-grade Electron desktop application that demonstrates what is possible when camera-based physiological sensing is tightly woven into everyday knowledge work. It leverages the full depth of SmartSpectra—cardiac plethysmography, respiratory displacement, and ocular facial dynamics—into a cohesive, zero-lag user experience.

### 💡 Best Thoughtful Real-World Use
Screen apnea and sedentary cognitive burnout affect millions of developers and remote workers every day. SpectraFlow provides a non-invasive, local-first solution that safeguards cognitive health and productivity without needing wearables or smartwatches.

### 🎨 Most Creative or Delightful Use
The built-in Bio-Adaptive Generative Soundscape transforms raw physiological waveforms into warm ambient music that breathes with you. When your breath slows down, the audio environment subtly warms and opens up, creating an organic sensory feedback loop between human biology and software.

---

## 5. Consent and Data Handling

Privacy and consensual sensing are first-class engineering constraints in SpectraFlow:
- **Affirmative Consent Gate:** Camera sensors are completely disabled until the user explicitly reviews the data policies and clicks "Grant Consent".
- **100% Local Optical Processing:** Native Presage SmartSpectra C ABI bindings (via `koffi` FFI) analyze camera frames directly in local volatile memory.
- **Zero Video Storage or Transmission:** No video frames, pictures, or facial biometrics are ever written to disk or sent to any remote server or AI service.
- **Instant Hardware Kill Switch:** An omnipresent control allows the user to immediately terminate camera sensing and release the hardware.
- **Honest Labelling:** When running in development or testing mode without an active API key, simulated data is prominently and transparently labelled as such.

---

## 6. Code & Architecture

SpectraFlow is built with:
- **Electron 34 + React 18 + TypeScript + Vite + Tailwind CSS**
- **Presage SmartSpectra Node SDK (`@smartspectra/node-sdk` v3.5)** with native Windows x64 runtime
- **Web Audio API** for real-time generative bio-adaptation
- **Vitest** for automated unit and calculation testing

Check out the full open-source codebase on GitHub:
👉 [https://github.com/Ayush/SpectraFlow](https://github.com/Ayush/SpectraFlow)
