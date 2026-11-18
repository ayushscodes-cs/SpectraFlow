import React from 'react';
import { Volume2, VolumeX, Sliders, Waves, Info } from 'lucide-react';

interface SoundStudioPanelProps {
  isPlaying: boolean;
  isAdaptive: boolean;
  volume: number;
  currentSoundscape: string;
  pulseBpm: number | null;
  breathingWave: number | null;
  availableModes?: string[];
  onTogglePlay: () => void;
  onToggleAdaptive: () => void;
  onVolumeChange: (vol: number) => void;
  onSoundscapeChange: (name: string) => void;
}

export const SoundStudioPanel: React.FC<SoundStudioPanelProps> = ({
  isPlaying,
  isAdaptive,
  volume,
  currentSoundscape,
  pulseBpm,
  breathingWave,
  availableModes = ['Deep Binaural Alpha', 'Warm Harmonic Tide', 'Stage Grounding 432Hz', 'Clarity & Presence 14Hz'],
  onTogglePlay,
  onToggleAdaptive,
  onVolumeChange,
  onSoundscapeChange,
}) => {
  return (
    <div className="rounded-xl border border-[#232936] bg-[#10131a] p-5 shadow-2xl font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-lime-400" />
          <h3 className="text-xs font-bold text-white tracking-wider uppercase">Adaptive Sound Studio</h3>
        </div>
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
            isPlaying
              ? 'bg-lime-500/15 border-lime-500/40 text-lime-400'
              : 'bg-[#181d28] border-[#2b3342] text-slate-400 hover:text-white'
          }`}
        >
          {isPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>{isPlaying ? 'AUDIO ENGINE ACTIVE' : 'MUTED'}</span>
        </button>
      </div>

      {/* Preset Selector */}
      <div className="mb-4">
        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
          SYNTHESIZER ENTRAINMENT PRESET
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {availableModes.map((mode) => (
            <button
              key={mode}
              onClick={() => onSoundscapeChange(mode)}
              className={`py-2 px-3 rounded-lg border text-left transition font-semibold cursor-pointer ${
                currentSoundscape === mode
                  ? 'bg-lime-500/10 border-lime-500/50 text-lime-300'
                  : 'bg-[#141721] border-[#232936] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Adaptive Bio-Feedback Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0c10] border border-[#232936] mb-4">
        <div>
          <span className="text-xs font-bold text-slate-200 block uppercase">Bio-Resonant Coupling</span>
          <span className="text-[10px] text-slate-400">
            Modulates low-pass cutoff via chest displacement wave
          </span>
        </div>
        <button
          onClick={onToggleAdaptive}
          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer border ${
            isAdaptive
              ? 'bg-lime-500/20 border-lime-500/50 text-lime-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {isAdaptive ? 'COUPLED' : 'MANUAL'}
        </button>
      </div>

      {/* Volume Slider */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>MASTER SYNTHESIS GAIN</span>
          <span className="text-lime-400 font-bold">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-lime-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
      </div>

      {/* Signal-to-Audio Mapping Explanation */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-lime-500/5 border border-lime-500/20 text-[10px] text-slate-300">
        <Info className="h-4 w-4 shrink-0 text-lime-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Mapping Protocol:</strong> Optical chest displacement opens the low-pass filter (400Hz-700Hz) during expansion, warming harmonics on relaxation. Zero cloud telemetry.
        </p>
      </div>
    </div>
  );
};
