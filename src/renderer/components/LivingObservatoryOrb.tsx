import React, { useEffect, useRef } from 'react';

interface LivingObservatoryOrbProps {
  rhythmState: 'STABLE_FOCUS' | 'ACTIVE_PACING' | 'WARMING_UP' | 'AWAITING_SIGNAL';
  signalQuality: 'EXCELLENT' | 'ADEQUATE' | 'WARMING_UP' | 'LOW_CONFIDENCE';
  breathingWave: number | null;
  pulseBpm: number | null;
  flowCoherence: number | null;
  isSimulated: boolean;
}

export const LivingObservatoryOrb: React.FC<LivingObservatoryOrbProps> = ({
  rhythmState,
  signalQuality,
  breathingWave,
  pulseBpm,
  flowCoherence,
  isSimulated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      phaseRef.current += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Safe bounded modulation based on real breathing wave or gentle idle oscillation
      const safeBreath = breathingWave !== null && !isNaN(breathingWave) ? Math.max(-1.5, Math.min(1.5, breathingWave)) : Math.sin(phaseRef.current) * 0.4;
      const breathMod = safeBreath * 16;
      const baseRadius = Math.max(40, Math.min(130, 85 + breathMod));

      // Color scheme according to state
      let primaryColor = 'rgba(45, 212, 191, '; // Teal
      let secondaryColor = 'rgba(99, 102, 241, '; // Indigo
      let glowColor = 'rgba(20, 184, 166, 0.2)';

      if (rhythmState === 'ACTIVE_PACING') {
        primaryColor = 'rgba(245, 158, 11, '; // Amber
        secondaryColor = 'rgba(234, 88, 12, '; // Orange
        glowColor = 'rgba(245, 158, 11, 0.2)';
      } else if (signalQuality === 'LOW_CONFIDENCE' || rhythmState === 'AWAITING_SIGNAL') {
        primaryColor = 'rgba(100, 116, 139, '; // Slate
        secondaryColor = 'rgba(71, 85, 105, ';
        glowColor = 'rgba(100, 116, 139, 0.1)';
      }

      // 1. Ambient Glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * 1.6
      );
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Multi-layer Harmonic Fluid Rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = baseRadius + r * 14;
        const speed = (r + 1) * 0.8;
        const waveCount = 5 + r * 2;

        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.05) {
          const distortion = Math.sin(a * waveCount + phaseRef.current * speed) * (4 + r * 2);
          const rad = ringRadius + distortion;
          const x = centerX + Math.cos(a) * rad;
          const y = centerY + Math.sin(a) * rad;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const alpha = 0.65 - r * 0.2;
        ctx.strokeStyle = primaryColor + alpha + ')';
        ctx.lineWidth = 2 - r * 0.4;
        ctx.stroke();
      }

      // 3. Central Core Circle
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        baseRadius * 0.7
      );
      coreGrad.addColorStop(0, secondaryColor + '0.45)');
      coreGrad.addColorStop(0.8, primaryColor + '0.15)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [rhythmState, signalQuality, breathingWave, pulseBpm, flowCoherence, isSimulated]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        className="w-[300px] h-[300px] block"
      />
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[11px] uppercase tracking-widest font-mono text-slate-400">
          Cognitive Rhythm
        </span>
        <span className="text-4xl font-black tracking-tight text-white mt-0.5">
          {flowCoherence !== null ? `${flowCoherence}%` : '--'}
        </span>
        <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full mt-1.5 bg-slate-900/80 border border-slate-700/80 text-teal-300">
          {rhythmState.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};
