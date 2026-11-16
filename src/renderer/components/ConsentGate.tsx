import React from 'react';
import { ShieldCheck, Video, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ConsentGateProps {
  onGrantConsent: () => void;
  isSimulatedMode: boolean;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({
  onGrantConsent,
  isSimulatedMode,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Camera & Privacy Consent Gate</h2>
            <p className="text-xs text-slate-400">Presage SmartSpectra Contactless Physiological Sensing</p>
          </div>
        </div>

        <div className="space-y-3 my-6 text-sm text-slate-300">
          <div className="flex items-start gap-3 rounded-lg bg-slate-800/40 p-3 border border-slate-800">
            <Lock className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">100% Local Optical Processing</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Camera frames are analyzed strictly in local memory by the native Presage SmartSpectra C ABI engine. No video or images are saved to disk or transmitted to any cloud servers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-slate-800/40 p-3 border border-slate-800">
            <Video className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">Signals Captured</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Micro-vascular optical pulse (PPG), chest respiratory displacement, blink cadence, and facial landmarks to detect deep work flow state and screen apnea.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-slate-800/40 p-3 border border-slate-800">
            <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">Instant Hardware Kill Switch</p>
              <p className="text-xs text-slate-400 mt-0.5">
                You can terminate camera processing and release your webcam instantly at any moment with a single click.
              </p>
            </div>
          </div>

          {isSimulatedMode && (
            <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-300">Development Laboratory Mode</p>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  No SmartSpectra API key detected in .env. Operating in transparent development lab mode with clearly labelled simulated physiological waveforms.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 max-w-[280px]">
            By continuing, you grant affirmative consent to local camera access for focus monitoring.
          </p>
          <button
            onClick={onGrantConsent}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-emerald-500 transition-all cursor-pointer"
          >
            Grant Consent & Enter Studio
          </button>
        </div>
      </div>
    </div>
  );
};
