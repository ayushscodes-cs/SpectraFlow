import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Mic,
  Presentation,
  Briefcase,
  Award,
  Zap,
  Wind,
  ShieldCheck,
  ChevronRight,
  Flame,
  Clock,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { VitalsTelemetryPayload } from '../../types/telemetry';
import { BioMirrorSynchrony } from './BioMirrorSynchrony';

export interface StageActivity {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  targetMinutes: number;
  icon: React.ComponentType<{ className?: string }>;
  suggestedSoundscape: string;
  steps: {
    title: string;
    description: string;
    actionLabel: string;
    durationSec: number;
    phaseType: 'grounding' | 'breathwork' | 'vocal_presence' | 'final_countdown';
  }[];
}

export const STAGE_ACTIVITIES: StageActivity[] = [
  {
    id: 'presentation',
    title: 'Keynote & Presentation',
    category: 'Speaking',
    subtitle: 'Cadence stabilization, diaphragmatic grounding, and opening presence.',
    targetMinutes: 3,
    icon: Presentation,
    suggestedSoundscape: 'Stage Grounding 432Hz',
    steps: [
      {
        title: 'Centering & Diaphragmatic Breath',
        description: 'Sync with the visual breathing pacer. Slow, rhythmic exhalations signal vagal tone engagement.',
        actionLabel: 'Begin Breath Pacing',
        durationSec: 60,
        phaseType: 'breathwork',
      },
      {
        title: 'Opening Vocal Cadence',
        description: 'Speak your opening sentence at 130 words per minute. Maintain steady blink cadence to ease gaze tension.',
        actionLabel: 'Practice First 30 Seconds',
        durationSec: 60,
        phaseType: 'vocal_presence',
      },
      {
        title: 'Ready Countdown',
        description: 'Shoulders back, posture aligned, step into the spotlight.',
        actionLabel: 'Final Countdown',
        durationSec: 15,
        phaseType: 'final_countdown',
      },
    ],
  },
  {
    id: 'interview',
    title: 'Job Interview',
    category: 'Professional',
    subtitle: 'Nervous energy dissipation, cognitive pause discipline, and composure.',
    targetMinutes: 4,
    icon: Briefcase,
    suggestedSoundscape: 'Clarity & Presence 14Hz',
    steps: [
      {
        title: 'Physiological Sigh & Reset',
        description: 'Two quick inhales through the nose, one prolonged exhale through the mouth to lower autonomic arousal.',
        actionLabel: 'Complete 4 Cycles',
        durationSec: 60,
        phaseType: 'breathwork',
      },
      {
        title: 'Pause Discipline Drill',
        description: 'Before answering questions, rehearse taking a silent 2-second breath. Notice your blink stability.',
        actionLabel: 'Rehearse Pause Technique',
        durationSec: 90,
        phaseType: 'grounding',
      },
      {
        title: 'Ready Countdown',
        description: 'Composed, attentive, and confident. Connect with the interviewer.',
        actionLabel: 'Ready to Enter Room',
        durationSec: 15,
        phaseType: 'final_countdown',
      },
    ],
  },
  {
    id: 'quick_reset',
    title: 'Quick 90s Reset',
    category: 'Express Routine',
    subtitle: 'Immediate autonomic recalibration before entering any high-stakes conversation.',
    targetMinutes: 1.5,
    icon: Zap,
    suggestedSoundscape: 'Stage Grounding 432Hz',
    steps: [
      {
        title: 'Diaphragmatic Grounding',
        description: 'Follow the 4-second inhale, 6-second exhale wave to shift into centered focus.',
        actionLabel: 'Begin Express Breathing',
        durationSec: 60,
        phaseType: 'breathwork',
      },
      {
        title: 'Final Centering',
        description: 'Ground your feet, relax your jaw, exhale completely.',
        actionLabel: 'Final Launch Cue',
        durationSec: 15,
        phaseType: 'final_countdown',
      },
    ],
  },
  {
    id: 'viva_defense',
    title: 'Viva & Academic Defense',
    category: 'Academic',
    subtitle: 'Defensive composure, steady articulation, and intellectual clarity under questioning.',
    targetMinutes: 4,
    icon: Award,
    suggestedSoundscape: 'Clarity & Presence 14Hz',
    steps: [
      {
        title: 'Clarity Grounding',
        description: 'Anchor attention on steady exhalations. Acknowledge nervous sensations as adaptive energy.',
        actionLabel: 'Settle Cognitive Pace',
        durationSec: 75,
        phaseType: 'grounding',
      },
      {
        title: 'Structured Argument Pacing',
        description: 'Practice answering with structured clarity: Claim, Evidence, Nuance. Keep posture upright.',
        actionLabel: 'Practice Core Thesis',
        durationSec: 90,
        phaseType: 'vocal_presence',
      },
      {
        title: 'Ready Countdown',
        description: 'Your research is solid. Step up to defend your thesis with confidence.',
        actionLabel: 'Ready for Examination',
        durationSec: 15,
        phaseType: 'final_countdown',
      },
    ],
  },
];

interface StageReadyViewProps {
  telemetry: VitalsTelemetryPayload | null;
  onSelectSoundscape: (preset: string) => void;
  onStartSensing: () => void;
  isSensingActive: boolean;
}

export const StageReadyView: React.FC<StageReadyViewProps> = ({
  telemetry,
  onSelectSoundscape,
  onStartSensing,
  isSensingActive,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<StageActivity>(STAGE_ACTIVITIES[0]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isRoutineRunning, setIsRoutineRunning] = useState<boolean>(false);
  const [stepTimerSec, setStepTimerSec] = useState<number>(0);
  const [isReadyComplete, setIsReadyComplete] = useState<boolean>(false);

  // Guided Breathing Pacer Phase (0..1)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [breathScale, setBreathScale] = useState<number>(1.0);

  // Step timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRoutineRunning && !isReadyComplete) {
      timer = setInterval(() => {
        setStepTimerSec((prev) => {
          const currentStep = selectedActivity.steps[activeStepIndex];
          if (prev + 1 >= currentStep.durationSec) {
            // Next step or complete
            if (activeStepIndex + 1 < selectedActivity.steps.length) {
              setActiveStepIndex((idx) => idx + 1);
              return 0;
            } else {
              setIsReadyComplete(true);
              setIsRoutineRunning(false);
              return currentStep.durationSec;
            }
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRoutineRunning, activeStepIndex, selectedActivity, isReadyComplete]);

  // Breathing pacer animation loop (4s in, 6s out)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRoutineRunning) {
      let tick = 0;
      interval = setInterval(() => {
        tick = (tick + 0.1) % 10.0;
        if (tick < 4.0) {
          setBreathPhase('inhale');
          setBreathScale(1.0 + (tick / 4.0) * 0.45);
        } else {
          setBreathPhase('exhale');
          setBreathScale(1.45 - ((tick - 4.0) / 6.0) * 0.45);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRoutineRunning]);

  const handleStartActivity = (activity: StageActivity) => {
    setSelectedActivity(activity);
    setActiveStepIndex(0);
    setStepTimerSec(0);
    setIsReadyComplete(false);
    setIsRoutineRunning(true);
    onSelectSoundscape(activity.suggestedSoundscape);
    if (!isSensingActive) {
      onStartSensing();
    }
  };

  const handleRestartRoutine = () => {
    setActiveStepIndex(0);
    setStepTimerSec(0);
    setIsReadyComplete(false);
    setIsRoutineRunning(true);
  };

  const currentStep = selectedActivity.steps[activeStepIndex];
  const stepProgress = Math.min(100, Math.round((stepTimerSec / currentStep.durationSec) * 100));

  return (
    <div className="space-y-6">
      {/* StageReady Cinematic Backstage Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#332d24] bg-[#141310] p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
              <Flame className="h-3.5 w-3.5" />
              <span>Backstage Preparation Studio</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight font-mono">
              StageReady // Pre-Performance Presence
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Targeted bio-acoustic routines and breathwork protocols to center autonomic arousal before you step into high-stakes moments.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <div className="px-4 py-2 rounded-xl bg-[#0a0c10] border border-[#232936] text-right">
              <span className="text-[10px] uppercase text-amber-400/80 block">Active Signal Sensor</span>
              <span className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                Presage SmartSpectra v3.5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Routine In Progress vs Selection Grid */}
      {isRoutineRunning ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Preparation Stage & Guided Pacer */}
          <div className="lg:col-span-8 rounded-3xl border border-amber-500/25 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <selectedActivity.icon className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">{selectedActivity.title}</h3>
                <span className="text-xs text-amber-300/80 font-mono">
                  (Step {activeStepIndex + 1} of {selectedActivity.steps.length})
                </span>
              </div>
              <button
                onClick={() => setIsRoutineRunning(false)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Exit Routine</span>
              </button>
            </div>

            {/* Guided Visual Pacer & Respiration Sync: Integrated BioMirror Synchrony */}
            <div className="my-6">
              <BioMirrorSynchrony
                detectedChestDisplacement={telemetry?.chestDisplacement ?? null}
                detectedBreathingRate={telemetry?.breathingRate ?? null}
                targetPacerPhase={breathPhase}
                targetPacerScale={breathScale}
                isSensingActive={isSensingActive}
              />

              {/* Step Title & Instruction */}
              <div className="mt-6 text-center max-w-lg mx-auto font-mono">
                <h4 className="text-base font-bold text-white tracking-tight uppercase">{currentStep.title}</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{currentStep.description}</p>
              </div>
            </div>

            {/* Step Progress & Time Remaining */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>Phase Progress</span>
                <span>
                  {stepTimerSec}s / {currentStep.durationSec}s
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Side Step Plan & Live Bio-Telemetry */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
                Routine Sequence
              </h4>
              <div className="space-y-3">
                {selectedActivity.steps.map((step, idx) => {
                  const isCurrent = idx === activeStepIndex;
                  const isDone = idx < activeStepIndex;
                  return (
                    <div
                      key={step.title}
                      className={`p-3 rounded-2xl border transition text-xs ${
                        isCurrent
                          ? 'border-amber-500/50 bg-amber-500/10 text-white'
                          : isDone
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-slate-400'
                          : 'border-slate-800/80 bg-slate-950/40 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span>{step.title}</span>
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <span className="font-mono text-[11px]">{step.durationSec}s</span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-80 leading-normal line-clamp-2">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Acoustic Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="h-4 w-4 text-amber-400" />
                <div>
                  <span className="font-semibold block text-white">{selectedActivity.suggestedSoundscape}</span>
                  <span className="text-[10px] text-slate-400">Harmonically modulated with breath</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      ) : isReadyComplete ? (
        /* READY SCREEN & COUNTDOWN TRANSITION */
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-10 shadow-2xl text-center max-w-xl mx-auto backdrop-blur-xl">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">You Are Stage Ready</h3>
          <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Your breathing rhythm is calibrated. Diaphragmatic centering is engaged. Step forward with calm authority and own the room.
          </p>

          <div className="my-8 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-xs mx-auto text-left text-xs font-mono">
            <div className="flex justify-between py-1 text-slate-400">
              <span>Preparation Protocol:</span>
              <span className="text-white">{selectedActivity.title}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Blink Dynamics:</span>
              <span className="text-teal-400 font-bold">{telemetry?.totalBlinksDetected ?? 0} blinks</span>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Readiness State:</span>
              <span className="text-emerald-400 font-bold">ALIGNED</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRestartRoutine}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Repeat Routine</span>
            </button>
            <button
              onClick={() => setIsReadyComplete(false)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition cursor-pointer"
            >
              Return to Stage Menu
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVITY SELECTION GRID */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
              Choose Upcoming Event
            </h3>
            <span className="text-xs text-slate-400">Select a purposeful pre-performance routine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAGE_ACTIVITIES.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleStartActivity(activity)}
                className="group p-5 rounded-3xl border border-slate-800 bg-slate-900/70 hover:border-amber-500/40 hover:bg-slate-900/90 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                      <activity.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {activity.targetMinutes} min
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase text-amber-400/80 font-bold">
                    {activity.category}
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors mt-0.5">
                    {activity.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{activity.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span>Start Routine</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};