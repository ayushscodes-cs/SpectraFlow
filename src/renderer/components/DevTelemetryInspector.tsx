import React, { useState } from 'react';
import { Terminal, Shield, Cpu, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Eye, Mic } from 'lucide-react';
import { VitalsTelemetryPayload } from '../../types/telemetry';

interface DevTelemetryInspectorProps {
  telemetry: VitalsTelemetryPayload | null;
  lifecycle: string;
  authState: string;
  selectedCamera: string;
}

export const DevTelemetryInspector: React.FC<DevTelemetryInspectorProps> = ({
  telemetry,
  lifecycle,
  authState,
  selectedCamera,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0c0e14] overflow-hidden text-xs font-mono shadow-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-[#12151d] hover:bg-[#181d28] border-b border-slate-800 flex items-center justify-between text-slate-300 transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-lime-400" />
          <span className="font-bold text-white tracking-wider">SMARTSPECTRA LIVE TELEMETRY INSPECTOR</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30">
            NATIVE C++ ABI DECODER
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${lifecycle === 'PROCESSING' ? 'bg-lime-400 animate-pulse' : 'bg-amber-400'}`} />
            {lifecycle}
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 bg-[#0a0c10] text-[11px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-[#141721] border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Engine State</span>
              <span className="font-bold text-white">{lifecycle}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#141721] border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Camera Source</span>
              <span className="font-bold text-lime-400 truncate block" title={selectedCamera}>
                DirectShow / Hardware
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#141721] border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Cumulative Blinks</span>
              <span className="font-bold text-emerald-400">{telemetry?.totalBlinksDetected ?? 0}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#141721] border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Chest Expansion</span>
              <span className="font-bold text-teal-400">
                {telemetry?.chestDisplacement !== null && telemetry?.chestDisplacement !== undefined
                  ? Number(telemetry.chestDisplacement).toFixed(4)
                  : 'Awaiting signal'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/60 border border-slate-800/80 font-mono text-[10px] text-slate-300">
            <div className="text-slate-500 mb-1 flex items-center justify-between">
              <span>RAW PROTOBUF PAYLOAD METADATA</span>
              <span className="text-lime-400">SDK v3.5.0-win32-x64</span>
            </div>
            <pre className="text-slate-400 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(
  {
    source: telemetry?.isSimulated ? 'DEVELOPMENT_SIMULATOR' : 'HARDWARE_OPTICAL_DIRECTSHOW',
    timestamp_epoch_ms: Date.now(),
    optical_respiration_displacement: telemetry?.chestDisplacement ?? null,
    respiration_rpm: telemetry?.breathingRate ?? null,
    optical_blinking: telemetry?.isBlinking ?? false,
    optical_talking: telemetry?.isTalking ?? false,
    signal_confidence: telemetry?.signalQuality ?? 'WARMING_UP',
    validation_status: telemetry?.validationHint || 'Hold still and position chest/face in camera view',
  },
  null,
  2
)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};