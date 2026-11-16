import React, { useState, useEffect } from 'react';
import {
  Heart,
  Wind,
  Eye,
  Activity,
  Shield,
  Volume2,
  VolumeX,
  Play,
  Square,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
} from 'lucide-react';
import { WaveCanvas } from './components/WaveCanvas';
import { ConsentGate } from './components/ConsentGate';
import { bioAudio } from './services/bioAudio';
import {
  CameraDeviceInfo,
  ProcessingLifecycleStatus,
  VitalsTelemetryPayload,
} from '../types/telemetry';

export const App: React.FC = () => {
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('default');
  const [lifecycle, setLifecycle] = useState<ProcessingLifecycleStatus>('IDLE');
  const [telemetry, setTelemetry] = useState<VitalsTelemetryPayload | null>(null);
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isFocusSessionActive, setIsFocusSessionActive] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Focus metrics accumulator
  const [sessionData, setSessionData] = useState<{
    pulseReadings: number[];
    breathingReadings: number[];
    apneaCount: number;
    peakFlow: number;
  }>({
    pulseReadings: [],
    breathingReadings: [],
    apneaCount: 0,
    peakFlow: 0,
  });

  useEffect(() => {
    // Check if Spectra IPC Bridge is ready
    if (window.spectraBridge) {
      window.spectraBridge.getConsentStatus().then(setConsentGranted);
      window.spectraBridge.getAvailableCameras().then((cams) => {
        setCameras(cams);
        if (cams.length > 0) setSelectedCamera(cams[0].id);
      });
      window.spectraBridge.getSystemStatus().then((status) => {
        setIsSimulatedMode(status.isDevSimulator);
        setLifecycle(status.lifecycle);
      });

      const unsubTelemetry = window.spectraBridge.onVitalsTelemetry((payload) => {
        setTelemetry(payload);

        // Feed to Web Audio engine for real-time generative bio-adaptation
        bioAudio.modulateWithVitals(payload.pulseRate, payload.chestDisplacement);

        // Accumulate session stats if session is running
        if (isFocusSessionActive) {
          setSessionData((prev) => {
            const nextPulses = payload.pulseRate
              ? [...prev.pulseReadings, payload.pulseRate]
              : prev.pulseReadings;
            const nextBreaths = payload.breathingRate
              ? [...prev.breathingReadings, payload.breathingRate]
              : prev.breathingReadings;
            return {
              pulseReadings: nextPulses,
              breathingReadings: nextBreaths,
              apneaCount: payload.screenApneaDetected ? prev.apneaCount + 1 : prev.apneaCount,
              peakFlow: Math.max(prev.peakFlow, payload.flowCoherenceScore),
            };
          });
        }
      });

      const unsubLifecycle = window.spectraBridge.onLifecycleChange((status) => {
        setLifecycle(status);
      });

      return () => {
        unsubTelemetry();
        unsubLifecycle();
      };
    }
  }, [isFocusSessionActive]);

  // Session clock timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFocusSessionActive) {
      timer = setInterval(() => {
        setSessionSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFocusSessionActive]);

  const handleGrantConsent = async () => {
    if (window.spectraBridge) {
      await window.spectraBridge.setConsentStatus(true);
      setConsentGranted(true);
    }
  };

  const handleToggleSensing = async () => {
    if (lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING') {
      await window.spectraBridge.stopSensing();
      if (audioActive) {
        bioAudio.stop();
        setAudioActive(false);
      }
      if (isFocusSessionActive) {
        setIsFocusSessionActive(false);
        setShowSummaryModal(true);
      }
    } else {
      await window.spectraBridge.startSensing(selectedCamera);
      setIsFocusSessionActive(true);
      setSessionSeconds(0);
      setSessionData({
        pulseReadings: [],
        breathingReadings: [],
        apneaCount: 0,
        peakFlow: 0,
      });
    }
  };

  const handleToggleAudio = () => {
    if (audioActive) {
      bioAudio.stop();
      setAudioActive(false);
    } else {
      bioAudio.start();
      setAudioActive(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans select-none">
      {/* Privacy Consent Gate */}
      {!consentGranted && (
        <ConsentGate
          onGrantConsent={handleGrantConsent}
          isSimulatedMode={isSimulatedMode}
        />
      )}

      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/60 px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-teal-500 to-indigo-600 shadow-md shadow-teal-500/20">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              SpectraFlow
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Studio
              </span>
            </h1>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                lifecycle === 'PROCESSING'
                  ? 'bg-emerald-500 animate-ping'
                  : lifecycle === 'CALIBRATING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-300 capitalize">{lifecycle.toLowerCase().replace('_', ' ')}</span>
          </div>

          {telemetry?.isSimulated && (
            <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Lab Simulator Mode
            </span>
          )}

          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
              audioActive
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            {audioActive ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>Bio-Audio</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physiological Cockpit & Real-time Flow Meter */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Active Flow Coherence Display */}
          <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Autonomic Flow Coherence
                </p>
                <h2 className="text-3xl font-extrabold text-white mt-1 flex items-center gap-2">
                  {telemetry ? `${telemetry.flowCoherenceScore}%` : '--'}
                  <span
                    className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                      telemetry?.autonomicState === 'DEEP_FLOW'
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                        : telemetry?.autonomicState === 'SYMPATHETIC_STRAIN'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {telemetry?.autonomicState?.replace('_', ' ') || 'Awaiting Session'}
                  </span>
                </h2>
              </div>

              {/* Focus Sprint Clock */}
              <div className="text-right">
                <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                  <Clock className="h-3.5 w-3.5" /> Sprint Elapsed
                </span>
                <span className="text-2xl font-mono font-bold text-white tracking-wider">
                  {formatTime(sessionSeconds)}
                </span>
              </div>
            </div>

            {/* Elastic Coherence Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 via-indigo-500 to-emerald-400 shadow-md shadow-teal-500/20"
                style={{ width: `${telemetry?.flowCoherenceScore || 15}%` }}
              />
            </div>

            {/* Screen Apnea / Eye Strain Alert Banners */}
            {telemetry?.screenApneaDetected && (
              <div className="mt-4 flex items-center gap-2 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-xl animate-bounce">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Screen Apnea Detected:</strong> Respiratory motion paused during deep focus. Take a gentle diaphragmatic inhale.
                </span>
              </div>
            )}
            {telemetry?.eyeStrainDetected && (
              <div className="mt-2 flex items-center gap-2 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-xl">
                <Eye className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Ocular Fixation Strain:</strong> Blink rate dropped below 4 bpm. Blink naturally to rehydrate eyes.
                </span>
              </div>
            )}
          </div>

          {/* Real-time Plethysmograph and Respiratory Tidal Waveform */}
          <WaveCanvas
            ppgValue={telemetry?.ppgTrace ?? null}
            breathingValue={telemetry?.chestDisplacement ?? null}
            pulseConfidence={telemetry?.pulseConfidence ?? 0.8}
          />

          {/* Vitals KPI Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
                <Heart className="h-4 w-4 text-rose-400" />
                <span>Pulse Rate</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {telemetry?.pulseRate ?? '--'}
                </span>
                <span className="text-xs text-slate-500 font-mono">BPM</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Confidence: {Math.round((telemetry?.pulseConfidence ?? 0) * 100)}%
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
                <Wind className="h-4 w-4 text-teal-400" />
                <span>Breathing Rate</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {telemetry?.breathingRate ?? '--'}
                </span>
                <span className="text-xs text-slate-500 font-mono">RPM</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Cadence: {telemetry?.breathingRate ? 'Smooth' : 'Calibrating'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
                <Eye className="h-4 w-4 text-indigo-400" />
                <span>Ocular Blink Rate</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {telemetry?.blinkRatePerMin ?? '--'}
                </span>
                <span className="text-xs text-slate-500 font-mono">/min</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Strain: {telemetry?.eyeStrainDetected ? 'High' : 'Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Studio Controls & Telemetry Overview */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Primary Action Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Session Co-Pilot</h3>
              <p className="text-xs text-slate-400 mb-4">
                Launch a contactless bio-adaptive deep work sprint.
              </p>

              {/* Camera Selector */}
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Optical Sensing Device
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-2 outline-none focus:border-teal-500"
                  disabled={lifecycle === 'PROCESSING'}
                >
                  {cameras.length > 0 ? (
                    cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="default">Integrated Hardware Camera</option>
                  )}
                </select>
              </div>
            </div>

            <button
              onClick={handleToggleSensing}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
              }`}
            >
              {lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING' ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop Sensing & Complete Sprint</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Bio-Adaptive Sprint</span>
                </>
              )}
            </button>
          </div>

          {/* Privacy & SDK Integrity Badge */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Camera Privacy Protocol</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Video is evaluated purely in volatile memory via SmartSpectra C ABI bindings. No footage is ever saved, streamed, or dispatched to external servers.
            </p>
          </div>
        </div>
      </main>

      {/* Session Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400" />
              <span>Sprint Telemetry Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your autonomic equilibrium breakdown for this session.
            </p>

            <div className="space-y-3 mb-6 font-mono text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Total Duration:</span>
                <span className="text-white font-bold">{formatTime(sessionSeconds)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Peak Flow Coherence:</span>
                <span className="text-teal-400 font-bold">{sessionData.peakFlow}%</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Screen Apneas Interrupted:</span>
                <span className="text-rose-400 font-bold">{sessionData.apneaCount}</span>
              </div>
            </div>

            <button
              onClick={() => setShowSummaryModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Close & Log to Local History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
