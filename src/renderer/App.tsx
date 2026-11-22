import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Wind,
  Eye,
  Activity,
  Shield,
  Play,
  Square,
  Sparkles,
  Clock,
  Compass,
  Palette,
  Sliders,
  AlertCircle,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { LivingWaveform } from './components/LivingWaveform';
import { LivingObservatoryOrb } from './components/LivingObservatoryOrb';
import { SoundStudioPanel } from './components/SoundStudioPanel';
import { StageReadyView } from './components/StageReadyView';
import { TruthLiePolygraph } from './components/TruthLiePolygraph';
import { DevTelemetryInspector } from './components/DevTelemetryInspector';
import { ConsentGate } from './components/ConsentGate';
import { bioAudio } from './services/bioAudio';
import {
  AuthenticationState,
  CameraDeviceInfo,
  ProcessingLifecycleStatus,
  VitalsTelemetryPayload,
} from '../types/telemetry';

export const App: React.FC = () => {
  // Theme state: 'midnight-flow' | 'warm-focus' | 'daylight'
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('spectra_theme') || 'midnight-flow';
  });

  // Mode Switcher: 'FLOW' | 'STAGEREADY'
  const [activeAppMode, setActiveAppMode] = useState<'FLOW' | 'STAGEREADY'>('FLOW');

  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('default');
  const [lifecycle, setLifecycle] = useState<ProcessingLifecycleStatus>('IDLE');
  const [authState, setAuthState] = useState<AuthenticationState>('NOT_CONFIGURED');
  const [authErrorMsg, setAuthErrorMsg] = useState<string>('');
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<VitalsTelemetryPayload | null>(null);

  // Authoritative Session State
  const [isFocusSessionActive, setIsFocusSessionActive] = useState<boolean>(false);
  const [sessionStartTimeMs, setSessionStartTimeMs] = useState<number | null>(null);
  const [sessionElapsedSec, setSessionElapsedSec] = useState<number>(0);
  const [targetDurationMin, setTargetDurationMin] = useState<number>(25);
  const [sessionObjective, setSessionObjective] = useState<string>('');
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Sound Studio State
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioAdaptive, setIsAudioAdaptive] = useState<boolean>(true);
  const [audioVolume, setAudioVolume] = useState<number>(0.5);
  const [soundscapeMode, setSoundscapeMode] = useState<string>('Deep Binaural Alpha');

  // Session Statistics Accumulator
  const [sessionMetrics, setSessionMetrics] = useState<{
    pulseSamples: number[];
    breathingSamples: number[];
    validFrameCount: number;
    peakFlow: number;
    totalBlinks: number;
  }>({
    pulseSamples: [],
    breathingSamples: [],
    validFrameCount: 0,
    peakFlow: 0,
    totalBlinks: 0,
  });

  // Apply Theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('spectra_theme', currentTheme);
  }, [currentTheme]);

  // IPC Bridge Listeners
  useEffect(() => {
    if (window.spectraBridge) {
      window.spectraBridge.getConsentStatus().then(setConsentGranted);
      window.spectraBridge.getAvailableCameras().then((cams) => {
        setCameras(cams);
        if (cams.length > 0) setSelectedCamera(cams[0].id);
      });
      window.spectraBridge.getSystemStatus().then((status) => {
        setHasConfiguredKey(status.hasConfiguredApiKey);
        setAuthState(status.authState);
        setAuthErrorMsg(status.authErrorMessage || '');
        setIsSimulatedMode(status.isDevSimulator);
        setLifecycle(status.lifecycle);
      });

      const unsubTelemetry = window.spectraBridge.onVitalsTelemetry((payload) => {
        setTelemetry(payload);

        // Modulate Web Audio engine when active and adaptive
        bioAudio.modulateWithVitals(payload.pulseRate, payload.chestDisplacement);

        // Accumulate session stats
        if (isFocusSessionActive) {
          setSessionMetrics((prev) => {
            const nextPulses = payload.pulseRate
              ? [...prev.pulseSamples, payload.pulseRate]
              : prev.pulseSamples;
            const nextBreaths = payload.breathingRate
              ? [...prev.breathingSamples, payload.breathingRate]
              : prev.breathingSamples;
            const isValid =
              payload.signalQuality === 'EXCELLENT' || payload.signalQuality === 'ADEQUATE';
            const currentScore = payload.flowCoherenceScore ?? 0;
            return {
              pulseSamples: nextPulses,
              breathingSamples: nextBreaths,
              validFrameCount: isValid ? prev.validFrameCount + 1 : prev.validFrameCount,
              peakFlow: Math.max(prev.peakFlow, currentScore),
              totalBlinks: payload.totalBlinksDetected,
            };
          });
        }
      });

      const unsubLifecycle = window.spectraBridge.onLifecycleChange((status) => {
        setLifecycle(status);
      });

      const unsubAuth = window.spectraBridge.onAuthStateChange((state, errorMsg) => {
        setAuthState(state);
        if (errorMsg) setAuthErrorMsg(errorMsg);
      });

      return () => {
        unsubTelemetry();
        unsubLifecycle();
        unsubAuth();
      };
    }
  }, [isFocusSessionActive]);

  // Authoritative Timestamp-based Session Clock
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusSessionActive && sessionStartTimeMs) {
      interval = setInterval(() => {
        const now = Date.now();
        const diffSec = Math.floor((now - sessionStartTimeMs) / 1000);
        setSessionElapsedSec(diffSec);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isFocusSessionActive, sessionStartTimeMs]);

  const handleGrantConsent = async () => {
    if (window.spectraBridge) {
      await window.spectraBridge.setConsentStatus(true);
      setConsentGranted(true);
    }
  };

  const handleToggleSensing = async () => {
    if (lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING') {
      await window.spectraBridge.stopSensing();
      if (isAudioPlaying) {
        bioAudio.stop();
        setIsAudioPlaying(false);
      }
      setIsFocusSessionActive(false);
      setShowSummaryModal(true);
    } else {
      const now = Date.now();
      setSessionStartTimeMs(now);
      setSessionElapsedSec(0);
      setSessionMetrics({
        pulseSamples: [],
        breathingSamples: [],
        validFrameCount: 0,
        peakFlow: 0,
        totalBlinks: 0,
      });

      await window.spectraBridge.startSensing(selectedCamera);
      setIsFocusSessionActive(true);
    }
  };

  const handleToggleAudio = async () => {
    if (isAudioPlaying) {
      bioAudio.stop();
      setIsAudioPlaying(false);
    } else {
      await bioAudio.start();
      setIsAudioPlaying(true);
    }
  };

  const handleToggleAdaptive = () => {
    const next = !isAudioAdaptive;
    bioAudio.setAdaptive(next);
    setIsAudioAdaptive(next);
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    bioAudio.setMasterVolume(vol);
  };

  const handleSoundscapeChange = (mode: string) => {
    setSoundscapeMode(mode);
    bioAudio.setSoundscapeMode(mode);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans select-none transition-colors duration-400">
      {/* Privacy Consent Gate */}
      {!consentGranted && (
        <ConsentGate
          onGrantConsent={handleGrantConsent}
          authState={authState}
          authErrorMessage={authErrorMsg}
          hasConfiguredApiKey={hasConfiguredKey}
          isSimulatedMode={isSimulatedMode}
        />
      )}

      {/* TOP BAR: Living Observatory Header */}
      <header className="h-16 border-b border-slate-800/80 bg-[var(--bg-secondary)] px-6 flex items-center justify-between backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 shadow-lg shadow-teal-500/25 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">SpectraFlow</h1>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/25">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {activeAppMode === 'FLOW' ? 'Bio-Adaptive Deep Work' : 'Pre-Stage Presence'}
            </p>
          </div>
        </div>

        {/* PRIMARY MODE SWITCHER: FLOW vs STAGEREADY */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <button
            onClick={() => {
              setActiveAppMode('FLOW');
              handleSoundscapeChange('Deep Binaural Alpha');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAppMode === 'FLOW'
                ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>FLOW</span>
          </button>
          <button
            onClick={() => {
              setActiveAppMode('STAGEREADY');
              handleSoundscapeChange('Stage Grounding 432Hz');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAppMode === 'STAGEREADY'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>STAGEREADY</span>
          </button>
        </div>

        {/* Status Pills & Controls */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {/* HARDWARE CAMERA KILL SWITCH */}
          <button
            onClick={async () => {
              if (lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING') {
                await window.spectraBridge.stopSensing();
                setIsFocusSessionActive(false);
              } else {
                await window.spectraBridge.startSensing(selectedCamera);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
              lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                : 'bg-[#141721] border-[#232936] text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING'
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <span>
              {lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING'
                ? 'CAMERA LIVE [KILL]'
                : 'CAMERA OFF'}
            </span>
          </button>

          {/* Auth / SDK Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141721] border border-[#232936]">
            <span
              className={`w-2 h-2 rounded-full ${
                authState === 'AUTHENTICATED'
                  ? 'bg-lime-400'
                  : authState === 'AUTHENTICATION_FAILED'
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 capitalize text-[11px]">
              {authState === 'AUTHENTICATED'
                ? 'Presage Verified'
                : authState === 'AUTHENTICATION_FAILED'
                ? 'Auth Failed (401)'
                : 'Lab Mode'}
            </span>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-[#141721] border border-[#232936] p-0.5 rounded-lg">
            {[
              { id: 'cyber-dark', label: 'Cyber' },
              { id: 'hack-amber', label: 'Amber' },
              { id: 'daylight', label: 'Day' },
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => setCurrentTheme(th.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                  currentTheme === th.id
                    ? 'bg-lime-500/20 text-lime-400 border border-lime-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN VIEW: FLOW vs STAGEREADY */}
      {activeAppMode === 'STAGEREADY' ? (
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <StageReadyView
            telemetry={telemetry}
            onSelectSoundscape={handleSoundscapeChange}
            onStartSensing={() => {
              if (lifecycle !== 'PROCESSING' && lifecycle !== 'CALIBRATING') {
                window.spectraBridge.startSensing(selectedCamera);
              }
            }}
            isSensingActive={lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING'}
          />
        </main>
      ) : (
        /* FLOW MODE: LIVING OBSERVATORY STUDIO */
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: The Living Observatory Visual Core */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Living Centerpiece Orb & Rhythm Cockpit */}
          <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between min-h-[380px]">
            {/* Ambient Background Radial Lighting */}
            <div className="absolute inset-0 bg-radial-gradient from-teal-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />

            {/* Top Info Header */}
            <div className="w-full flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs uppercase font-mono tracking-widest text-slate-400">
                  Focus Rhythm State
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-white">
                    {sessionObjective || 'Deep Concentration Sprint'}
                  </span>
                </div>
              </div>

              {/* Authoritative Sprint Timer */}
              <div className="text-right">
                <span className="text-xs text-slate-400 flex items-center gap-1 justify-end font-mono">
                  <Clock className="h-3.5 w-3.5 text-teal-400" /> Sprint Clock
                </span>
                <span className="text-3xl font-mono font-black text-white tracking-widest">
                  {formatTime(sessionElapsedSec)}
                </span>
              </div>
            </div>

            {/* The Living Centerpiece Orb */}
            <div className="relative z-10 my-1">
              <LivingObservatoryOrb
                rhythmState={telemetry?.rhythmState || 'AWAITING_SIGNAL'}
                signalQuality={telemetry?.signalQuality || 'WARMING_UP'}
                breathingWave={telemetry?.chestDisplacement ?? null}
                pulseBpm={telemetry?.pulseRate ?? null}
                flowCoherence={telemetry?.flowCoherenceScore ?? null}
                isSimulated={telemetry?.isSimulated ?? isSimulatedMode}
              />
            </div>

            {/* Signal Integrity & Positioning Feedback */}
            <div className="w-full flex items-center justify-between text-xs border-t border-slate-800/80 pt-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">Signal Quality:</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                    telemetry?.signalQuality === 'EXCELLENT'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : telemetry?.signalQuality === 'ADEQUATE'
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : telemetry?.signalQuality === 'WARMING_UP'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {telemetry?.signalQuality || 'INITIALIZING'}
                </span>
              </div>

              {telemetry?.validationHint && (
                <div className="text-[11px] text-slate-400 italic font-sans flex items-center gap-1">
                  <span>Hint:</span> {telemetry.validationHint}
                </div>
              )}
            </div>
          </div>

          {/* Genuine Living Waveform Canvas */}
          <LivingWaveform
            ppgValue={telemetry?.ppgTrace ?? null}
            breathingValue={telemetry?.chestDisplacement ?? null}
            pulseConfidence={telemetry?.pulseConfidence ?? 0}
            breathingConfidence={telemetry?.breathingConfidence ?? 0}
            signalQuality={telemetry?.signalQuality ?? 'WARMING_UP'}
            isSimulated={telemetry?.isSimulated ?? isSimulatedMode}
          />

          {/* Documented Vitals KPI Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Cardio Metric */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1.5">
                <Heart className="h-4 w-4 text-rose-400" />
                <span>Cardio Pulse</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-white">
                  {telemetry?.pulseRate !== null && telemetry?.pulseRate !== undefined
                    ? telemetry.pulseRate
                    : '--'}
                </span>
                <span className="text-xs text-slate-500 font-mono">BPM</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Confidence: {Math.round((telemetry?.pulseConfidence ?? 0) * 100)}%
                {telemetry?.hrvRmssd ? ` • HRV: ${telemetry.hrvRmssd}ms` : ''}
              </span>
            </div>

            {/* Breathing Metric */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1.5">
                <Wind className="h-4 w-4 text-teal-400" />
                <span>Respiration</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-white">
                  {telemetry?.breathingRate !== null && telemetry?.breathingRate !== undefined
                    ? telemetry.breathingRate
                    : '--'}
                </span>
                <span className="text-xs text-slate-500 font-mono">RPM</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Confidence: {Math.round((telemetry?.breathingConfidence ?? 0) * 100)}%
              </span>
            </div>

            {/* Face & Blinks Metric */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1.5">
                <Eye className="h-4 w-4 text-indigo-400" />
                <span>Blink Dynamics</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-white">
                  {telemetry?.totalBlinksDetected ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-mono">blinks</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Rate: {telemetry?.blinkRatePerMin ?? 0} /min • Talking: {telemetry?.isTalking ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Co-Pilot Controls & Adaptive Sound Studio */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Session Co-Pilot Control Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white">Session Co-Pilot</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {isFocusSessionActive ? 'In Progress' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Launch a contactless bio-adaptive focus sprint with local sensor processing.
              </p>

              {/* Work Objective Input */}
              <div className="mb-4">
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Focus Objective (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Write competitor analysis..."
                  value={sessionObjective}
                  onChange={(e) => setSessionObjective(e.target.value)}
                  disabled={isFocusSessionActive}
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 px-3 py-2 outline-none focus:border-teal-500"
                />
              </div>

              {/* Target Duration Selector */}
              <div className="mb-4">
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Sprint Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 45].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTargetDurationMin(m)}
                      disabled={isFocusSessionActive}
                      className={`py-2 rounded-xl text-xs font-semibold font-mono border transition cursor-pointer ${
                        targetDurationMin === m
                          ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {m} Min
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Device Selector */}
              <div className="mb-5">
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Camera Device
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  disabled={isFocusSessionActive}
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 px-3 py-2 outline-none focus:border-teal-500 cursor-pointer"
                >
                  {cameras.length > 0 ? (
                    cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="default">Primary Integrated Webcam</option>
                  )}
                </select>
              </div>
            </div>

            {/* Start/Stop Main Button */}
            <button
              onClick={handleToggleSensing}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                isFocusSessionActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 shadow-teal-500/25'
              }`}
            >
              {isFocusSessionActive ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop Sensing & Log Sprint</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Bio-Adaptive Sprint</span>
                </>
              )}
            </button>
          </div>

          {/* Dedicated Adaptive Sound Studio */}
          <SoundStudioPanel
            isPlaying={isAudioPlaying}
            isAdaptive={isAudioAdaptive}
            volume={audioVolume}
            currentSoundscape={soundscapeMode}
            pulseBpm={telemetry?.pulseRate ?? null}
            breathingWave={telemetry?.chestDisplacement ?? null}
            onTogglePlay={handleToggleAudio}
            onToggleAdaptive={handleToggleAdaptive}
            onVolumeChange={handleVolumeChange}
            onSoundscapeChange={handleSoundscapeChange}
          />
        </div>

        {/* TRUTH OR LIE BIOMETRIC EXPERIMENT SECTION */}
        <div className="lg:col-span-12 mt-4">
          <TruthLiePolygraph
            telemetry={telemetry}
            isSensingActive={lifecycle === 'PROCESSING' || lifecycle === 'CALIBRATING'}
            onStartSensing={() => {
              window.spectraBridge.startSensing(selectedCamera);
            }}
          />
        </div>

        {/* BOTTOM FULL-WIDTH: LIVE SMARTSPECTRA TELEMETRY INSPECTOR */}
        <div className="lg:col-span-12 mt-2">
          <DevTelemetryInspector
            telemetry={telemetry}
            lifecycle={lifecycle}
            authState={authState}
            selectedCamera={selectedCamera}
          />
        </div>
      </main>
      )}

      {/* SESSION COMPLETION & TELEMETRY LEDGER MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-6 select-none animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-teal-400" />
              <span>Sprint Telemetry Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Authoritative session duration and validated measurement records.
            </p>

            <div className="space-y-3 mb-6 font-mono text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Authoritative Duration:</span>
                <span className="text-white font-bold">{formatTime(sessionElapsedSec)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Valid Optical Frames:</span>
                <span className="text-emerald-400 font-bold">{sessionMetrics.validFrameCount}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Peak Cognitive Rhythm:</span>
                <span className="text-teal-400 font-bold">
                  {sessionMetrics.peakFlow > 0 ? `${sessionMetrics.peakFlow}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Cumulative Blinks Detected:</span>
                <span className="text-indigo-300 font-bold">{sessionMetrics.totalBlinks}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Data Integrity Notice:</span>
                <span className="text-slate-300 font-bold">
                  {sessionMetrics.validFrameCount === 0
                    ? 'Zero Valid Optical Samples'
                    : 'Validated Samples Recorded'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Done & Return to Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
