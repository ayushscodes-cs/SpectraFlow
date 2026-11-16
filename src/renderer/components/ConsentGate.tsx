import React from 'react';
import {
  ShieldCheck,
  Video,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AuthenticationState } from '../../types/telemetry';

interface ConsentGateProps {
  onGrantConsent: () => void;
  authState: AuthenticationState;
  authErrorMessage?: string;
  hasConfiguredApiKey: boolean;
  isSimulatedMode: boolean;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({
  onGrantConsent,
  authState,
  authErrorMessage,
  hasConfiguredApiKey,
  isSimulatedMode,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-6 select-none">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-36 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-lg shadow-teal-500/25">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">SpectraFlow</h1>
                <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  Living Observatory
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Find your rhythm. Stay in your flow.
              </p>
            </div>
          </div>
        </div>

        {/* Informative Grid */}
        <div className="space-y-3 my-6 text-xs text-slate-300">
          <div className="flex items-start gap-3 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800">
            <Lock className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">100% Local Optical Inference</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Camera frames are analyzed strictly in local volatile memory by the native Presage SmartSpectra C ABI engine. Zero camera frames or raw biometric images are ever saved to disk or transmitted to any server.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800">
            <Video className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">Documented Signals Analyzed</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Extracts optical pulse plethysmography (PPG), respiratory chest tidal curves, heart rate variability (HRV), and facial dynamics (blinks, talking cadence). Purely for cognitive work rhythm; strictly non-medical.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800">
            <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">SDK Licensing Telemetry Disclosure</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                SmartSpectra SDK reports aggregate non-identifying session diagnostics (SDK version, OS, session outcome counts) over TLS to Presage servers for developer quota tracking. No video or biometric values are transmitted.
              </p>
            </div>
          </div>

          {/* Honest Status Banner based on actual state */}
          {authState === 'AUTHENTICATION_FAILED' ? (
            <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 p-3.5 border border-rose-500/30">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Presage Cloud Authorization Required</p>
                <p className="text-[11px] text-rose-200/80 mt-0.5 leading-relaxed">
                  {authErrorMessage || 'The configured API key was rejected by Presage server (HTTP 401).'} You can continue into the studio using the transparent Laboratory Simulator mode.
                </p>
              </div>
            </div>
          ) : authState === 'AUTHENTICATED' ? (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">Presage SmartSpectra License Active</p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5 leading-relaxed">
                  SDK session verified and authenticated with Presage licensing network. Real-time optical sensing is ready.
                </p>
              </div>
            </div>
          ) : isSimulatedMode ? (
            <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Development Laboratory Simulator</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                  Operating in development test mode with transparently labelled simulated waveforms for UI and audio workflow evaluation.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl bg-slate-800/30 p-3.5 border border-slate-700/40">
              <ShieldCheck className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-300">API Key Configured in Local Environment</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Key detected. Native handshake will verify pairing on session start.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Consent Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 max-w-[280px]">
            Affirmative consent required for local webcam sensing. You can terminate capture at any moment.
          </p>
          <button
            onClick={onGrantConsent}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-emerald-500 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Grant Consent & Enter Studio</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
