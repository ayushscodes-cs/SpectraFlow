# Privacy, Consent & Sensor Ethics

## 1. Ethical Principles
SpectraFlow is built on the strict premise that **physiological sensing must be user-empowered, fully consensual, and completely transparent**.

- **No Medical Diagnostic Claims:** SpectraFlow is designed solely as a cognitive ergonomics and focus optimization tool. It does NOT diagnose, treat, or prevent any medical condition (cardiac, neurological, or psychiatric).
- **Explicit Affirmative Consent:** No video frames or camera sensors are activated upon launching the app. The user must review the data handling disclosures and click "Grant Camera & Physiological Sensing Consent".
- **Local-Only Processing:** All camera frames are streamed locally into the Presage SmartSpectra native runtime via C ABI / koffi FFI.
  - Zero camera video is saved to disk.
  - Zero raw images leave the local device.
  - No facial images are uploaded to any external cloud, AI provider, or analytics platform.
- **Immediate Sensory Kill Switch:** An omnipresent status indicator and instant "Stop Sensing" button immediately releases the webcam hardware.
- **SDK Telemetry Disclosure:** Presage SmartSpectra SDK may send non-identifying SDK initialization telemetry (such as license key validation and session duration) to Presage Technologies servers (`physiology.presagetech.com`) for billing and quota tracking, as detailed in the official Presage documentation. No video or biometric identifiers are included in licensing telemetry.
- **Zero Third-Party Ad or Tracking Trackers:** The desktop app contains no analytics trackers, advertising IDs, or telemetry brokers.
