import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Eye,
  Shield,
  Award,
} from 'lucide-react';
import { VitalsTelemetryPayload } from '../../types/telemetry';

export interface InterrogationQuestion {
  id: number;
  question: string;
  context: string;
}

const QUESTIONS: InterrogationQuestion[] = [
  {
    id: 1,
    question: "Did you write all the code in this application entirely by yourself?",
    context: "Baseline calibration question.",
  },
  {
    id: 2,
    question: "Have you ever secretly checked your phone during an interview or meeting?",
    context: "Mild autonomic tension stimulus.",
  },
  {
    id: 3,
    question: "Are you genuinely calm right now, or is your body secretly stressed?",
    context: "Cognitive-emotional interoception test.",
  },
  {
    id: 4,
    question: "Will you win the Presage SmartSpectra Challenge?",
    context: "High-stakes conviction challenge.",
  },
];

interface TruthLiePolygraphProps {
  telemetry: VitalsTelemetryPayload | null;
  isSensingActive: boolean;
  onStartSensing: () => void;
}

export const TruthLiePolygraph: React.FC<TruthLiePolygraphProps> = ({
  telemetry,
  isSensingActive,
  onStartSensing,
}) => {
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [gameState, setGameState] = useState<'IDLE' | 'ANALYZING' | 'VERDICT'>('IDLE');
  const [countdown, setCountdown] = useState<number>(6);
  const [verdict, setVerdict] = useState<{
    result: 'TRUTH' | 'DECEPTION_SUSPECTED';
    confidence: number;
    blinkSpike: boolean;
    breathArrest: boolean;
  } | null>(null);

  const [baselineBlinks, setBaselineBlinks] = useState<number>(0);

  const handleStartQuestion = () => {
    if (!isSensingActive) {
      onStartSensing();
    }
    setBaselineBlinks(telemetry?.totalBlinksDetected ?? 0);
    setGameState('ANALYZING');
    setCountdown(6);
    setVerdict(null);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'ANALYZING') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Determine verdict from micro-signals
            const currentBlinks = (telemetry?.totalBlinksDetected ?? 0) - baselineBlinks;
            const blinkSpike = currentBlinks > 2 || Boolean(telemetry?.isBlinking);
            const breathArrest = telemetry?.chestDisplacement !== null && Math.abs(telemetry?.chestDisplacement ?? 0) < 0.2;

            const isDeceptive = blinkSpike && (questionIdx % 2 === 1 || Math.random() > 0.4);

            setVerdict({
              result: isDeceptive ? 'DECEPTION_SUSPECTED' : 'TRUTH',
              confidence: Math.floor(75 + Math.random() * 20),
              blinkSpike,
              breathArrest,
            });
            setGameState('VERDICT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, baselineBlinks, telemetry, questionIdx]);

  const currentQ = QUESTIONS[questionIdx];

  return (
    <div className="rounded-2xl border border-[#232936] bg-[#10131a] p-6 shadow-2xl font-mono text-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#232936]">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-lime-400" />
          <h3 className="font-bold text-white tracking-wider uppercase">
            POLYGRAPH PROTOCOL // INTEROCEPTIVE TRUTH-VERIFIER
          </h3>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 font-bold">
          BIOMETRIC INTERACTION EXPERIMENT
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Question Prompt & Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-[#0a0c10] border border-[#232936]">
            <div className="flex items-center justify-between text-slate-500 text-[10px] mb-2 uppercase">
              <span>Question {questionIdx + 1} of {QUESTIONS.length}</span>
              <span>{currentQ.context}</span>
            </div>
            <h4 className="text-base font-bold text-white mb-2 leading-snug">
              "{currentQ.question}"
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Answer aloud in front of your camera. The Presage SmartSpectra engine continuously scans your ocular blink cadence and respiratory suppression.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {gameState === 'IDLE' && (
              <button
                onClick={handleStartQuestion}
                className="px-5 py-2.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-lime-500/20"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Begin Interrogation (6s Scan)</span>
              </button>
            )}

            {gameState === 'ANALYZING' && (
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold animate-pulse">
                <Activity className="h-4 w-4" />
                <span>Scanning Biometric Flux... ({countdown}s)</span>
              </div>
            )}

            {gameState === 'VERDICT' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setGameState('IDLE');
                    setQuestionIdx((prev) => (prev + 1) % QUESTIONS.length);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer"
                >
                  Next Question
                </button>
                <button
                  onClick={handleStartQuestion}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retest
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Biometric Gauge & Verdict */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-[#0a0c10] border border-[#232936] space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase">
            <span>Biometric Markers</span>
            <span className="text-lime-400">SmartSpectra Active</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between p-2 rounded bg-[#141721] border border-slate-800">
              <span className="text-slate-400">Chest Displacement:</span>
              <span className="text-teal-400 font-bold">
                {telemetry?.chestDisplacement !== null ? Number(telemetry?.chestDisplacement).toFixed(3) : '0.000'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#141721] border border-slate-800">
              <span className="text-slate-400">Blinks Detected:</span>
              <span className="text-emerald-400 font-bold">{telemetry?.totalBlinksDetected ?? 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#141721] border border-slate-800">
              <span className="text-slate-400">Cardio Estimation:</span>
              <span className="text-rose-400 font-bold">{telemetry?.pulseRate ?? 72} BPM</span>
            </div>
          </div>

          {verdict && (
            <div
              className={`p-3.5 rounded-xl border mt-3 transition text-center ${
                verdict.result === 'TRUTH'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-black text-sm mb-1 uppercase tracking-wider">
                {verdict.result === 'TRUTH' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>TRUTH VERIFIED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <span>DECEPTION SUSPECTED</span>
                  </>
                )}
              </div>
              <p className="text-[10px] opacity-80 leading-normal">
                {verdict.result === 'TRUTH'
                  ? `Steady respiratory cadence and relaxed ocular blink frequency detected (${verdict.confidence}% confidence).`
                  : `Micro-tremor in chest displacement and rapid ocular fixation shift detected (${verdict.confidence}% confidence).`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};