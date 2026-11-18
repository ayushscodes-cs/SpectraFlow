import React, { useRef, useEffect } from 'react';
import { Wind, Activity, CheckCircle, AlertCircle } from 'lucide-react';

interface BioMirrorSynchronyProps {
  detectedChestDisplacement: number | null;
  detectedBreathingRate: number | null;
  targetPacerPhase: 'inhale' | 'exhale';
  targetPacerScale: number; // 1.0 to 1.45
  isSensingActive: boolean;
}

export const BioMirrorSynchrony: React.FC<BioMirrorSynchronyProps> = ({
  detectedChestDisplacement,
  detectedBreathingRate,
  targetPacerPhase,
  targetPacerScale,
  isSensingActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    const val = detectedChestDisplacement !== null ? detectedChestDisplacement : 0;
    historyRef.current.push(val);
    if (historyRef.current.length > 120) {
      historyRef.current.shift();
    }
  }, [detectedChestDisplacement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      // Draw faint center zero baseline
      ctx.strokeStyle = '#232936';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      const points = historyRef.current;
      if (points.length > 1) {
        ctx.strokeStyle = '#a3e635'; // Hacktoberfest Lime
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const step = w / 120;
        for (let i = 0; i < points.length; i++) {
          const x = i * step;
          // Normalized wave scale (-1..1 to midY +/- 35px)
          const y = midY - points[i] * 38;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glowing pulse head
        const lastIdx = points.length - 1;
        const lastX = lastIdx * step;
        const lastY = midY - points[lastIdx] * 38;
        ctx.fillStyle = '#a3e635';
        ctx.shadowColor = '#a3e635';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="rounded-2xl border border-[#232936] bg-[#10131a] p-5 shadow-2xl relative overflow-hidden font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-lime-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            BIO-MIRROR: RESPIRATORY DISPLACEMENT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
              isSensingActive
                ? 'bg-lime-500/10 border-lime-500/30 text-lime-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isSensingActive ? 'OPTICAL TRACKING LIVE' : 'STANDBY'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Kinetic Pacer Circle */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3">
          <div
            className="relative flex items-center justify-center rounded-full transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${targetPacerScale})`,
              width: '140px',
              height: '140px',
            }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-lime-400/30 bg-lime-500/5 animate-pulse" />
            <div className="absolute inset-2 rounded-full border border-lime-400/50 bg-[#0c0e14] flex flex-col items-center justify-center text-center p-2">
              <Wind className="h-6 w-6 text-lime-400 mb-1" />
              <span className="text-xs font-black uppercase text-lime-300">
                {targetPacerPhase === 'inhale' ? 'INHALE' : 'EXHALE'}
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">
                {detectedBreathingRate ? `${detectedBreathingRate} RPM` : '4s In / 6s Out'}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Oscilloscope */}
        <div className="md:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>REAL-TIME CHEST DISPLACEMENT (OPTICAL WAVE)</span>
              <span className="text-lime-400 font-bold">
                {detectedChestDisplacement !== null ? Number(detectedChestDisplacement).toFixed(3) : '0.000'}
              </span>
            </div>
            <div className="h-24 w-full bg-[#0a0c10] border border-[#232936] rounded-xl overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={500}
                height={96}
                className="w-full h-full block"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>Synchronize natural chest rise with pacer</span>
            <span className="text-lime-400">Presage SmartSpectra v3.5.0 DirectShow</span>
          </div>
        </div>
      </div>
    </div>
  );
};