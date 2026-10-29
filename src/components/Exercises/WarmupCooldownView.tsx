import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Snowflake,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Volume2,
  VolumeX,
  Dumbbell,
  Heart,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  SessionFocus,
  SESSION_ROUTINES_MAP,
  WarmupMovement,
  CooldownMovement,
} from '../../data/warmupCooldownData';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface WarmupCooldownViewProps {
  initialFocus?: SessionFocus;
  onNavigateTab?: (tab: any) => void;
}

export const WarmupCooldownView: React.FC<WarmupCooldownViewProps> = ({
  initialFocus = 'push',
  onNavigateTab,
}) => {
  const [selectedFocus, setSelectedFocus] = useState<SessionFocus>(initialFocus);
  const [routineType, setRoutineType] = useState<'warmup' | 'cooldown'>('warmup');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Guided player state
  const [isGuidedActive, setIsGuidedActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepSecondsLeft, setStepSecondsLeft] = useState<number>(45);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const timerRef = useRef<any>(null);

  const currentRoutineData = SESSION_ROUTINES_MAP[selectedFocus];
  const movementsList: (WarmupMovement | CooldownMovement)[] =
    routineType === 'warmup'
      ? currentRoutineData.warmup.movements
      : currentRoutineData.cooldown.movements;

  const currentMovement = movementsList[currentStepIndex] || movementsList[0];

  // Reset step index and timer when focus or type changes
  useEffect(() => {
    setIsGuidedActive(false);
    setIsTimerRunning(false);
    setCurrentStepIndex(0);
    setCompletedSteps({});
  }, [selectedFocus, routineType]);

  // Guided timer tick
  useEffect(() => {
    if (isGuidedActive && isTimerRunning && stepSecondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setStepSecondsLeft((prev) => {
          // Warning beeps in final 3 seconds
          if (prev <= 4 && prev > 1 && soundEnabled) {
            playShortBeep(700, 0.08);
          }

          if (prev <= 1) {
            // Step finished!
            if (soundEnabled) playShortBeep(920, 0.2);
            // Mark current movement complete
            setCompletedSteps((c) => ({ ...c, [currentMovement.id]: true }));

            // Advance to next step if available
            if (currentStepIndex < movementsList.length - 1) {
              const nextIndex = currentStepIndex + 1;
              setCurrentStepIndex(nextIndex);
              const nextDuration = movementsList[nextIndex].defaultSeconds || 45;
              return nextDuration;
            } else {
              // Routine complete!
              clearInterval(timerRef.current);
              setIsTimerRunning(false);
              if (soundEnabled) playTimerFinishChime();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGuidedActive, isTimerRunning, stepSecondsLeft, currentStepIndex, movementsList, currentMovement, soundEnabled]);

  const startGuidedRoutine = (startIndex = 0) => {
    setCurrentStepIndex(startIndex);
    const initialSec = movementsList[startIndex]?.defaultSeconds || 45;
    setStepSecondsLeft(initialSec);
    setIsGuidedActive(true);
    setIsTimerRunning(true);
    if (soundEnabled) playShortBeep(600, 0.1);
  };

  const nextStep = () => {
    if (currentStepIndex < movementsList.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setStepSecondsLeft(movementsList[nextIdx].defaultSeconds || 45);
      setIsTimerRunning(true);
      if (soundEnabled) playShortBeep(600, 0.08);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setStepSecondsLeft(movementsList[prevIdx].defaultSeconds || 45);
      setIsTimerRunning(true);
      if (soundEnabled) playShortBeep(500, 0.08);
    }
  };

  const toggleGuidedPlayPause = () => {
    if (stepSecondsLeft === 0) {
      setStepSecondsLeft(currentMovement.defaultSeconds || 45);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning((prev) => !prev);
    }
    if (soundEnabled) playShortBeep(550, 0.08);
  };

  const toggleManualComplete = (id: string) => {
    setCompletedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
    if (soundEnabled) playShortBeep(880, 0.08);
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const allCompleted = movementsList.length > 0 && movementsList.every((m) => completedSteps[m.id]);

  const FOCUS_OPTIONS: { id: SessionFocus; label: string; icon: string; short: string }[] = [
    { id: 'push', label: 'Push Day', icon: '💥', short: 'Chest / Shoulders / Triceps' },
    { id: 'pull', label: 'Pull Day', icon: '🧗', short: 'Back / Lats / Biceps' },
    { id: 'legs', label: 'Leg Day', icon: '🦵', short: 'Quads / Hamstrings / Glutes' },
    { id: 'upper', label: 'Upper Body', icon: '👕', short: 'Torso & Arms' },
    { id: 'lower', label: 'Lower & Core', icon: '⚡', short: 'Legs & Abs' },
    { id: 'full_body', label: 'Full Body', icon: '🏋️', short: 'Whole Body Compound' },
    { id: 'hiit_cardio', label: 'HIIT / Cardio', icon: '🔥', short: 'Conditioning & Fat Burn' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Session Selector */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Injury Prevention & Peak Performance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Warm-up & Cooldown Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Biomechanical dynamic mobility to prepare joints and static stretches to accelerate muscle recovery.
            </p>
          </div>

          {/* Sound & Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={soundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Focus Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Select Today&apos;s Workout Focus:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {FOCUS_OPTIONS.map((f) => {
              const isSelected = selectedFocus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFocus(f.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/15 scale-102'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-lg block mb-1">{f.icon}</span>
                  <p className="text-xs font-bold text-slate-100">{f.label}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{f.short}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase Toggle: Dynamic Warm-Up vs Recovery Cooldown */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 flex-wrap gap-3">
          <div className="inline-flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
            <button
              onClick={() => setRoutineType('warmup')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                routineType === 'warmup'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Dynamic Warm-Up (Pre-Workout)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/30 text-slate-900">
                ~{currentRoutineData.warmup.durationMinutes}m
              </span>
            </button>

            <button
              onClick={() => setRoutineType('cooldown')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                routineType === 'cooldown'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Snowflake className="w-4 h-4" />
              <span>Recovery Cooldown (Post-Workout)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/30 text-slate-900">
                ~{currentRoutineData.cooldown.durationMinutes}m
              </span>
            </button>
          </div>

          {/* Quick Start Guided Flow Button */}
          {!isGuidedActive && (
            <button
              onClick={() => startGuidedRoutine(0)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                routineType === 'warmup'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Guided Flow With Timer</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* GUIDED PLAYER SCREEN (When Guided Flow is Active)        */}
      {/* ======================================================== */}
      {isGuidedActive && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/40 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                  routineType === 'warmup'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                Guided {routineType === 'warmup' ? 'Warm-up' : 'Cooldown'}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Movement {currentStepIndex + 1} of {movementsList.length}
              </span>
            </div>

            <button
              onClick={() => {
                setIsGuidedActive(false);
                setIsTimerRunning(false);
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Exit Guided Mode
            </button>
          </div>

          {/* Progress dots bar */}
          <div className="flex items-center gap-1.5 w-full">
            {movementsList.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => startGuidedRoutine(idx)}
                className={`h-2 flex-1 rounded-full cursor-pointer transition-all ${
                  idx === currentStepIndex
                    ? 'bg-emerald-400'
                    : completedSteps[m.id]
                    ? 'bg-emerald-600/70'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={m.name}
              />
            ))}
          </div>

          {/* Main Movement Focus Hero */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Huge Timer Display */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {isTimerRunning ? 'IN MOTION' : stepSecondsLeft === 0 ? 'COMPLETE!' : 'PAUSED'}
              </span>
              <span
                className={`text-6xl font-black font-mono tracking-tight transition-colors ${
                  stepSecondsLeft <= 5 && stepSecondsLeft > 0
                    ? 'text-rose-400 animate-pulse'
                    : stepSecondsLeft <= 10
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatSecs(stepSecondsLeft)}
              </span>
              <span className="text-xs text-slate-400 mt-2 font-medium">
                Prescribed: {currentMovement.durationOrReps}
              </span>

              {/* Player Controls */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 cursor-pointer"
                  title="Previous Movement"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleGuidedPlayPause}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  {isTimerRunning ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950" />}
                  <span>{isTimerRunning ? 'Pause' : 'Resume'}</span>
                </button>

                <button
                  onClick={nextStep}
                  disabled={currentStepIndex === movementsList.length - 1}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 cursor-pointer"
                  title="Next Movement"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Movement Breakdown & Form Guide */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Phase: {currentMovement.phase.replace(/_/g, ' ')}
                  </span>
                  {currentMovement.targetMuscles.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl font-black text-white">{currentMovement.name}</h3>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  How To Perform:
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentMovement.instruction}
                </p>
              </div>

              {/* Coaching Form Cue / Breathing */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Coach Form Cue & Breathing:</span>
                </span>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {currentMovement.formCue}
                </p>
                {'breathingCue' in currentMovement && (
                  <p className="text-xs text-cyan-300 pt-1 font-medium">
                    🫁 Breathing: {(currentMovement as CooldownMovement).breathingCue}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAILED MOVEMENT CHECKLIST & ANATOMY BREAKDOWN          */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-black text-white">
              {routineType === 'warmup' ? 'Dynamic Warm-Up Movements' : 'Cooldown Recovery Stretches'}
            </h3>
            <span className="text-xs text-slate-400">({movementsList.length} prescribed)</span>
          </div>

          {allCompleted && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Routine Complete!</span>
            </span>
          )}
        </div>

        {/* Movement Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {movementsList.map((m, index) => {
            const isDone = completedSteps[m.id];
            return (
              <div
                key={m.id}
                className={`p-5 rounded-3xl border transition-all space-y-3.5 ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-white">{m.name}</h4>
                      <p className="text-xs font-mono text-amber-400 font-semibold mt-0.5">
                        ⏱️ {m.durationOrReps}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleManualComplete(m.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={isDone ? 'Mark Incomplete' : 'Mark Done'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Muscle Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {m.phase.replace(/_/g, ' ')}
                  </span>
                  {m.targetMuscles.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Step Instructions */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {m.instruction}
                </p>

                {/* Form tip / Why it matters callout */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                  <p className="text-slate-400">
                    <strong className="text-amber-400 font-semibold">Form cue:</strong> {m.formCue}
                  </p>
                  {'whyItMatters' in m && (
                    <p className="text-slate-400 pt-0.5">
                      <strong className="text-emerald-400 font-semibold">Why it matters:</strong> {(m as WarmupMovement).whyItMatters}
                    </p>
                  )}
                  {'breathingCue' in m && (
                    <p className="text-slate-400 pt-0.5">
                      <strong className="text-cyan-400 font-semibold">Breathing:</strong> {(m as CooldownMovement).breathingCue}
                    </p>
                  )}
                </div>

                {/* Quick Start Single Movement Timer */}
                <button
                  onClick={() => startGuidedRoutine(index)}
                  className="w-full py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Start Timer for this Movement ({m.durationOrReps})</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routine Transition Action Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">
            {routineType === 'warmup' ? 'Done Warming Up?' : 'Cooldown Completed!'}
          </h4>
          <p className="text-xs text-slate-400">
            {routineType === 'warmup'
              ? 'Your joints are lubricated and core temperature is elevated. You are primed to lift heavy!'
              : 'Your heart rate is safely down-regulated and muscle tension is released. Great session!'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {routineType === 'warmup' ? (
            <button
              onClick={() => onNavigateTab && onNavigateTab('exercises')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Proceed to Workout Exercises</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateTab && onNavigateTab('dashboard')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
