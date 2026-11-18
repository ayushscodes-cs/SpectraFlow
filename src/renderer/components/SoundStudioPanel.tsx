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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Adaptive Sound Studio</h3>
        </div>
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
            isPlaying
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          {isPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>{isPlaying ? 'Synthesizer Active' : 'Muted'}</span>
        </button>
      </div>

      {/* Preset Selector */}
      <div className="mb-4">
        <label className="text-[11px] font-medium text-slate-400 block mb-1.5 uppercase tracking-wider font-mono">
          Soundscape Mode
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {availableModes.map((mode) => (
            <button
              key={mode}
              onClick={() => onSoundscapeChange(mode)}
              className={`py-2 px-3 rounded-xl border text-left transition font-medium cursor-pointer ${
                currentSoundscape === mode
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Adaptive Bio-Feedback Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-4">
        <div>
          <span className="text-xs font-semibold text-slate-200 block">Autonomic Entrainment</span>
          <span className="text-[10px] text-slate-400">
            Harmonic filter tracks respiratory wave in real-time
          </span>
        </div>
        <button
          onClick={onToggleAdaptive}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
            isAdaptive
              ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {isAdaptive ? 'ENABLED' : 'MANUAL'}
        </button>
      </div>

      {/* Volume Slider */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>Master Synthesis Volume</span>
          <span>{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
      </div>

      {/* Signal-to-Audio Mapping Explanation */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15 text-[11px] text-indigo-300/80">
        <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Mapping Protocol:</strong> Respiratory tidal expansion gently opens the 400Hz–700Hz low-pass cutoff; exhalation warms the acoustic spectrum. You can switch to manual at any moment.
        </p>
      </div>
    </div>
  );
};
