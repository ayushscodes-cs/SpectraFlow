import React, { useEffect, useRef } from 'react';

interface WaveCanvasProps {
  ppgValue: number | null;
  breathingValue: number | null;
  pulseConfidence: number;
}

export const WaveCanvas: React.FC<WaveCanvasProps> = ({
  ppgValue,
  breathingValue,
  pulseConfidence,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ppgHistoryRef = useRef<number[]>([]);
  const breathHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    // Record current values
    const ppg = ppgValue !== null ? ppgValue : 0;
    const breath = breathingValue !== null ? breathingValue : 0;

    ppgHistoryRef.current.push(ppg);
    breathHistoryRef.current.push(breath);

    if (ppgHistoryRef.current.length > 250) ppgHistoryRef.current.shift();
    if (breathHistoryRef.current.length > 250) breathHistoryRef.current.shift();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear with dark subtle fade
    ctx.fillStyle = '#0f1422';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 30) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 1. Draw Respiratory Tidal Wave (Cyan/Teal)
    if (breathHistoryRef.current.length > 1) {
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const step = width / 250;
      breathHistoryRef.current.forEach((val, i) => {
        // Normalize val (-1 to 1) to canvas height
        const y = height / 2 - val * (height * 0.32);
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * step, y);
      });
      ctx.stroke();
    }

    // 2. Draw Cardiac Arterial Plethysmograph Wave (Rose/Red)
    if (ppgHistoryRef.current.length > 1) {
      ctx.strokeStyle = pulseConfidence > 0.5 ? 'rgba(244, 63, 94, 0.85)' : 'rgba(244, 63, 94, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = width / 250;
      ppgHistoryRef.current.forEach((val, i) => {
        const y = height / 2 - val * (height * 0.28) + 15;
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * step, y);
      });
      ctx.stroke();
    }
  }, [ppgValue, breathingValue, pulseConfidence]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/70 p-3 shadow-inner">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-rose-300 font-medium">Optical PPG (Cardio Wave)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <span className="text-teal-300 font-medium">Respiratory Tidal Wave</span>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
          SmartSpectra v3.5
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={150}
        className="w-full h-[150px] rounded-lg block"
      />
    </div>
  );
};
