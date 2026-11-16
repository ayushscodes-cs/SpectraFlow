import React, { useEffect, useRef } from 'react';

interface LivingWaveformProps {
  ppgValue: number | null;
  breathingValue: number | null;
  pulseConfidence: number;
  breathingConfidence: number;
  signalQuality: 'EXCELLENT' | 'ADEQUATE' | 'WARMING_UP' | 'LOW_CONFIDENCE';
  isSimulated: boolean;
}

export const LivingWaveform: React.FC<LivingWaveformProps> = ({
  ppgValue,
  breathingValue,
  pulseConfidence,
  breathingConfidence,
  signalQuality,
  isSimulated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ppgHistoryRef = useRef<number[]>([]);
  const breathHistoryRef = useRef<number[]>([]);
  const idleTickRef = useRef<number>(0);

  useEffect(() => {
    idleTickRef.current += 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const hasRealPPG = ppgValue !== null && pulseConfidence > 0;
    const hasRealBreath = breathingValue !== null && breathingConfidence > 0;

    // Buffer samples
    if (hasRealPPG || isSimulated) {
      ppgHistoryRef.current.push(ppgValue ?? 0);
    } else {
      ppgHistoryRef.current.push(0);
    }

    if (hasRealBreath || isSimulated) {
      breathHistoryRef.current.push(breathingValue ?? 0);
    } else {
      breathHistoryRef.current.push(0);
    }

    if (ppgHistoryRef.current.length > 300) ppgHistoryRef.current.shift();
    if (breathHistoryRef.current.length > 300) breathHistoryRef.current.shift();

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Subtle Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += 50) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 35) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    const isAwaitingOrWarmup = signalQuality === 'WARMING_UP' || signalQuality === 'LOW_CONFIDENCE';

    // 1. Draw Respiratory Waveform (Teal/Cyan)
    if (breathHistoryRef.current.length > 1) {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const step = width / 300;

      if (!hasRealBreath && !isSimulated) {
        // Honest resting baseline with gentle harmonic ripple
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.25)';
        for (let i = 0; i < breathHistoryRef.current.length; i++) {
          const t = (i + idleTickRef.current) * 0.05;
          const y = height / 2 + Math.sin(t) * 2;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * step, y);
        }
      } else {
        ctx.strokeStyle =
          breathingConfidence > 0.5 ? 'rgba(45, 212, 191, 0.9)' : 'rgba(45, 212, 191, 0.4)';
        breathHistoryRef.current.forEach((val, i) => {
          const y = height / 2 - val * (height * 0.35);
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * step, y);
        });
      }
      ctx.stroke();
    }

    // 2. Draw Cardiac Optical Plethysmograph Waveform (Rose/Coral)
    if (ppgHistoryRef.current.length > 1) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = width / 300;

      if (!hasRealPPG && !isSimulated) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
        for (let i = 0; i < ppgHistoryRef.current.length; i++) {
          const t = (i + idleTickRef.current) * 0.08;
          const y = height / 2 + 15 + Math.sin(t) * 2;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * step, y);
        }
      } else {
        ctx.strokeStyle =
          pulseConfidence > 0.6 ? 'rgba(244, 63, 94, 0.95)' : 'rgba(244, 63, 94, 0.4)';
        ppgHistoryRef.current.forEach((val, i) => {
          const y = height / 2 - val * (height * 0.3) + 10;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * step, y);
        });
      }
      ctx.stroke();
    }

    // Honest Waiting Banner Overlay
    if (isAwaitingOrWarmup && !isSimulated) {
      ctx.fillStyle = 'rgba(10, 15, 25, 0.7)';
      ctx.fillRect(width / 2 - 160, height / 2 - 20, 320, 40);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.strokeRect(width / 2 - 160, height / 2 - 20, 320, 40);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '12px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        signalQuality === 'WARMING_UP'
          ? '⏳ GATHERING OPTICAL SAMPLES (WARMING UP)...'
          : '⚠️ AWAITING VALID CAMERA POSITION...',
        width / 2,
        height / 2
      );
    }
  }, [ppgValue, breathingValue, pulseConfidence, breathingConfidence, signalQuality, isSimulated]);

  return (
    <div className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            <span className="text-slate-300 font-medium">Optical PPG (Cardio)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50"></span>
            <span className="text-slate-300 font-medium">Respiratory Wave</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSimulated ? (
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
              Laboratory Simulator Mode
            </span>
          ) : (
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
              Native SmartSpectra 3.5
            </span>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={180}
        className="w-full h-[180px] rounded-xl block bg-[#080c14]/90"
      />
    </div>
  );
};
