import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Flame,
  Clock,
  Sparkles,
  Trophy,
  Dumbbell,
  CheckCircle2,
  Activity,
  Zap,
} from 'lucide-react';
import {
  playShortBeep,
  playTimerFinishChime,
  playIntervalWorkStartSound,
  playIntervalRestStartSound,
} from '../../utils/audioChime';

export type TimerMode = 'rest' | 'interval';
export type IntervalPhase = 'idle' | 'prep' | 'work' | 'rest' | 'finished';

interface IntervalPreset {
  id: string;
  name: string;
  workSec: number;
  restSec: number;
  rounds: number;
  tag: string;
}

const INTERVAL_PRESETS: IntervalPreset[] = [
  { id: 'tabata', name: 'Tabata Protocol', workSec: 20, restSec: 10, rounds: 8, tag: '4 min fat burner' },
  { id: 'hiit_classic', name: 'Classic HIIT', workSec: 40, restSec: 20, rounds: 6, tag: '6 min intense' },
  { id: 'emom', name: 'EMOM Sprint', workSec: 50, restSec: 10, rounds: 10, tag: '10 min conditioning' },
  { id: 'circuit_equal', name: 'Cardio Circuit', workSec: 30, restSec: 30, rounds: 5, tag: '5 min steady' },
  { id: 'boxing_rounds', name: 'Boxing / MMA', workSec: 180, restSec: 60, rounds: 3, tag: '12 min combat' },
];

const REST_PRESETS = [30, 45, 60, 90, 120, 180];

interface WorkoutIntervalTimerProps {
  onRestTimerComplete?: () => void;
  autoTriggerSeconds?: number | null;
  onClearAutoTrigger?: () => void;
  compact?: boolean;
}

export const WorkoutIntervalTimer: React.FC<WorkoutIntervalTimerProps> = ({
  onRestTimerComplete,
  autoTriggerSeconds,
  onClearAutoTrigger,
  compact = false,
}) => {
  const [mode, setMode] = useState<TimerMode>('rest');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // --- REST TIMER STATE ---
  const [restInitial, setRestInitial] = useState<number>(60);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(60);
  const [isRestRunning, setIsRestRunning] = useState<boolean>(false);

  // --- INTERVAL TIMER STATE ---
  const [workDuration, setWorkDuration] = useState<number>(30);
  const [intervalRestDuration, setIntervalRestDuration] = useState<number>(15);
  const [totalRounds, setTotalRounds] = useState<number>(6);
  const [prepDuration, setPrepDuration] = useState<number>(5);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [intervalPhase, setIntervalPhase] = useState<IntervalPhase>('idle');
  const [intervalSecondsLeft, setIntervalSecondsLeft] = useState<number>(5);
  const [isIntervalRunning, setIsIntervalRunning] = useState<boolean>(false);

  const restIntervalRef = useRef<any>(null);
  const intervalTimerRef = useRef<any>(null);

  // Trigger vibration if supported
  const triggerVibrate = (pattern: number[] = [100, 50, 100]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  // Handle external auto-trigger (e.g. from completed set)
  useEffect(() => {
    if (autoTriggerSeconds && autoTriggerSeconds > 0) {
      setMode('rest');
      setRestInitial(autoTriggerSeconds);
      setRestSecondsLeft(autoTriggerSeconds);
      setIsRestRunning(true);
      if (soundEnabled) playShortBeep(880, 0.1);
      triggerVibrate([80]);
      if (onClearAutoTrigger) onClearAutoTrigger();
    }
  }, [autoTriggerSeconds, onClearAutoTrigger, soundEnabled]);

  // ==========================================
  // 1. REST TIMER TICK EFFECT
  // ==========================================
  useEffect(() => {
    if (isRestRunning && restSecondsLeft > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(restIntervalRef.current);
            setIsRestRunning(false);
            if (soundEnabled) playTimerFinishChime();
            triggerVibrate([200, 100, 200, 100, 400]);
            if (onRestTimerComplete) onRestTimerComplete();
            return 0;
          }
          // 3-2-1 countdown beeps
          if (prev <= 4 && prev > 1 && soundEnabled) {
            playShortBeep(660, 0.08);
            triggerVibrate([60]);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    }

    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isRestRunning, restSecondsLeft, soundEnabled, onRestTimerComplete]);

  // ==========================================
  // 2. INTERVAL TIMER TICK EFFECT
  // ==========================================
  useEffect(() => {
    if (isIntervalRunning && intervalPhase !== 'idle' && intervalPhase !== 'finished') {
      intervalTimerRef.current = setInterval(() => {
        setIntervalSecondsLeft((prev) => {
          // Warning beeps in final 3 seconds of any phase
          if (prev <= 4 && prev > 1 && soundEnabled) {
            playShortBeep(750, 0.08);
            triggerVibrate([50]);
          }

          if (prev <= 1) {
            // Transition phase!
            if (intervalPhase === 'prep') {
              // Prep -> Work Round 1
              setIntervalPhase('work');
              if (soundEnabled) playIntervalWorkStartSound();
              triggerVibrate([150, 50, 150]);
              return workDuration;
            } else if (intervalPhase === 'work') {
              // Work -> Rest OR Final Finish
              if (currentRound >= totalRounds) {
                // Done with all rounds!
                setIntervalPhase('finished');
                setIsIntervalRunning(false);
                if (soundEnabled) playTimerFinishChime();
                triggerVibrate([300, 100, 300, 100, 500]);
                return 0;
              } else {
                setIntervalPhase('rest');
                if (soundEnabled) playIntervalRestStartSound();
                triggerVibrate([150]);
                return intervalRestDuration;
              }
            } else if (intervalPhase === 'rest') {
              // Rest -> Work Next Round
              const nextRound = currentRound + 1;
              setCurrentRound(nextRound);
              setIntervalPhase('work');
              if (soundEnabled) playIntervalWorkStartSound();
              triggerVibrate([150, 50, 150]);
              return workDuration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    }

    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [
    isIntervalRunning,
    intervalPhase,
    currentRound,
    totalRounds,
    workDuration,
    intervalRestDuration,
    soundEnabled,
  ]);

  // REST CONTROLS
  const startRestPreset = (seconds: number) => {
    setRestInitial(seconds);
    setRestSecondsLeft(seconds);
    setIsRestRunning(true);
    if (soundEnabled) playShortBeep(880, 0.1);
    triggerVibrate([60]);
  };

  const toggleRestPlayPause = () => {
    if (restSecondsLeft === 0) {
      setRestSecondsLeft(restInitial);
      setIsRestRunning(true);
    } else {
      setIsRestRunning((prev) => !prev);
    }
    if (soundEnabled) playShortBeep(600, 0.08);
  };

  const resetRestTimer = () => {
    setIsRestRunning(false);
    setRestSecondsLeft(restInitial);
  };

  const adjustRestTime = (deltaSec: number) => {
    setRestSecondsLeft((prev) => Math.max(5, prev + deltaSec));
    setRestInitial((prev) => Math.max(5, prev + deltaSec));
  };

  // INTERVAL CONTROLS
  const startIntervalTimer = () => {
    if (intervalPhase === 'idle' || intervalPhase === 'finished') {
      setCurrentRound(1);
      setIntervalPhase('prep');
      setIntervalSecondsLeft(prepDuration);
      setIsIntervalRunning(true);
      if (soundEnabled) playShortBeep(520, 0.12);
      triggerVibrate([80]);
    } else {
      setIsIntervalRunning(true);
    }
  };

  const pauseIntervalTimer = () => {
    setIsIntervalRunning(false);
  };

  const resetIntervalTimer = () => {
    setIsIntervalRunning(false);
    setIntervalPhase('idle');
    setCurrentRound(1);
    setIntervalSecondsLeft(prepDuration);
  };

  const applyIntervalPreset = (preset: IntervalPreset) => {
    setIsIntervalRunning(false);
    setIntervalPhase('idle');
    setCurrentRound(1);
    setWorkDuration(preset.workSec);
    setIntervalRestDuration(preset.restSec);
    setTotalRounds(preset.rounds);
    setIntervalSecondsLeft(prepDuration);
  };

  // Format Helper
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculations for Rest Progress Ring
  const restProgressPercent = restInitial > 0 ? (restSecondsLeft / restInitial) * 100 : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (restProgressPercent / 100) * circumference;

  // Interval Phase Color & Text
  const getIntervalPhaseColor = () => {
    switch (intervalPhase) {
      case 'prep':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          ring: 'stroke-amber-400',
          title: 'GET READY',
          sub: 'Prepare for round 1',
        };
      case 'work':
        return {
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          ring: 'stroke-emerald-400',
          title: 'WORK! 🔥',
          sub: 'Give maximum effort!',
        };
      case 'rest':
        return {
          badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          ring: 'stroke-cyan-400',
          title: 'REST 💨',
          sub: 'Deep breaths & recover',
        };
      case 'finished':
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          ring: 'stroke-purple-400',
          title: 'COMPLETED! 🏆',
          sub: 'Awesome session crushed!',
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          ring: 'stroke-emerald-500',
          title: 'READY TO START',
          sub: 'Configure your intervals below',
        };
    }
  };

  const intervalPhaseInfo = getIntervalPhaseColor();

  // Calculate current interval phase progress
  const getCurrentPhaseInitial = () => {
    if (intervalPhase === 'prep') return prepDuration;
    if (intervalPhase === 'work') return workDuration;
    if (intervalPhase === 'rest') return intervalRestDuration;
    return workDuration;
  };
  const currentPhaseInitial = getCurrentPhaseInitial();
  const intervalProgressPercent =
    currentPhaseInitial > 0 ? (intervalSecondsLeft / currentPhaseInitial) * 100 : 0;
  const intervalStrokeDashoffset =
    circumference - (intervalProgressPercent / 100) * circumference;

  // Total interval workout duration calculation
  const totalWorkoutSeconds = prepDuration + (workDuration + intervalRestDuration) * totalRounds - intervalRestDuration;

  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none p-6 md:p-12 flex flex-col justify-between overflow-y-auto bg-slate-950'
          : 'p-5 sm:p-7'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-black">
            <Clock className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-white">Workout Timer & Tracker</h3>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Gym Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">Rest intervals between sets & HIIT rounds</p>
          </div>
        </div>

        {/* Mode Selector Tabs & Utility Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Pill Switch */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('rest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'rest'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Rest Timer</span>
            </button>
            <button
              onClick={() => setMode('interval')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'interval'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Interval / HIIT</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute Beeps' : 'Enable Audio Beeps'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Gym Display'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: SET REST TIMER                                    */}
      {/* ========================================================= */}
      {mode === 'rest' && (
        <div className="py-6 space-y-6">
          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Rest Intervals</span>
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {REST_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => startRestPreset(seconds)}
                  className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    restInitial === seconds && isRestRunning
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-102'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-slate-800'
                  }`}
                >
                  {seconds < 60 ? `${seconds}s` : `${seconds / 60}m ${seconds % 60 ? (seconds % 60) + 's' : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Central Circular Progress Clock */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative flex items-center justify-center">
              <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
                {/* Background Track */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Dynamic Remaining Ring */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className={`transition-all duration-300 ${
                    restSecondsLeft <= 5 && restSecondsLeft > 0
                      ? 'stroke-rose-500 animate-pulse'
                      : restSecondsLeft <= 10
                      ? 'stroke-amber-400'
                      : 'stroke-emerald-400'
                  }`}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Digits & Status */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-1">
                  {isRestRunning ? 'RESTING' : restSecondsLeft === 0 ? 'TIME TO LIFT!' : 'SET REST'}
                </span>
                <span
                  className={`text-5xl sm:text-6xl font-black font-mono tracking-tight transition-colors ${
                    restSecondsLeft <= 5 && restSecondsLeft > 0
                      ? 'text-rose-400 animate-pulse'
                      : restSecondsLeft <= 10
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {formatTime(restSecondsLeft)}
                </span>
                <span className="text-xs text-slate-400 mt-1">Target: {restInitial}s rest</span>
              </div>
            </div>

            {/* Micro Adjusters (+15s / -15s / +30s) */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => adjustRestTime(-15)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
                <span>15s</span>
              </button>
              <button
                onClick={() => adjustRestTime(+15)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>15s</span>
              </button>
              <button
                onClick={() => adjustRestTime(+30)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-400 flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>+30s Extra Rest</span>
              </button>
            </div>
          </div>

          {/* Main Controls: Play/Pause & Reset */}
          <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
            <button
              onClick={toggleRestPlayPause}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isRestRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {isRestRunning ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950" />}
              <span>{isRestRunning ? 'PAUSE REST' : restSecondsLeft === 0 ? 'START NEXT SET' : 'START REST'}</span>
            </button>

            <button
              onClick={resetRestTimer}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: INTERVAL / HIIT / TABATA TIMER                     */}
      {/* ========================================================= */}
      {mode === 'interval' && (
        <div className="py-6 space-y-6">
          {/* Preset Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>Popular Interval Protocols</span>
              </span>
              <span className="text-xs text-slate-400">
                Total duration: <strong className="text-slate-200">{formatTime(totalWorkoutSeconds)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {INTERVAL_PRESETS.map((preset) => {
                const isSelected =
                  workDuration === preset.workSec &&
                  intervalRestDuration === preset.restSec &&
                  totalRounds === preset.rounds;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyIntervalPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md shadow-emerald-500/15'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-100">{preset.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {preset.workSec}s W / {preset.restSec}s R
                    </p>
                    <span className="text-[9px] text-emerald-400 block font-semibold mt-1">{preset.rounds} rds</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Central Interval Display */}
          <div className="flex flex-col items-center justify-center my-2">
            {/* Round Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                Round <strong className="text-emerald-400 font-mono">{currentRound}</strong> of {totalRounds}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${intervalPhaseInfo.badge}`}>
                {intervalPhaseInfo.title}
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center">
              <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  className={`transition-all duration-300 ${intervalPhaseInfo.ring}`}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={intervalStrokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {intervalPhase === 'prep'
                    ? 'GET READY'
                    : intervalPhase === 'work'
                    ? 'WORK'
                    : intervalPhase === 'rest'
                    ? 'REST'
                    : intervalPhase === 'finished'
                    ? 'CRUSHED!'
                    : 'INTERVAL'}
                </span>
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white mt-1">
                  {formatTime(intervalSecondsLeft)}
                </span>
                <span className="text-xs text-slate-400 mt-1">{intervalPhaseInfo.sub}</span>
              </div>
            </div>

            {/* Round Progress Visualizer */}
            <div className="flex items-center gap-1.5 mt-4 max-w-md w-full justify-center flex-wrap">
              {Array.from({ length: totalRounds }).map((_, idx) => {
                const roundNum = idx + 1;
                const isCompleted = roundNum < currentRound || intervalPhase === 'finished';
                const isCurrent = roundNum === currentRound && intervalPhase !== 'finished';
                return (
                  <div
                    key={roundNum}
                    className={`h-2 rounded-full transition-all ${
                      isCompleted
                        ? 'w-6 bg-emerald-400'
                        : isCurrent
                        ? 'w-8 bg-amber-400 animate-pulse'
                        : 'w-4 bg-slate-800'
                    }`}
                    title={`Round ${roundNum}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Configuration Sliders/Inputs when idle */}
          {intervalPhase === 'idle' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Work (sec)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWorkDuration((prev) => Math.max(5, prev - 5))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={workDuration}
                    onChange={(e) => setWorkDuration(Math.max(5, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white py-1"
                  />
                  <button
                    onClick={() => setWorkDuration((prev) => prev + 5)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Rest (sec)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIntervalRestDuration((prev) => Math.max(0, prev - 5))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={intervalRestDuration}
                    onChange={(e) => setIntervalRestDuration(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white py-1"
                  />
                  <button
                    onClick={() => setIntervalRestDuration((prev) => prev + 5)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Rounds
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTotalRounds((prev) => Math.max(1, prev - 1))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white py-1"
                  />
                  <button
                    onClick={() => setTotalRounds((prev) => Math.min(50, prev + 1))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Prep (sec)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPrepDuration((prev) => Math.max(1, prev - 1))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={prepDuration}
                    onChange={(e) => setPrepDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white py-1"
                  />
                  <button
                    onClick={() => setPrepDuration((prev) => prev + 1)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Start, Pause, Reset */}
          <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
            {isIntervalRunning ? (
              <button
                onClick={pauseIntervalTimer}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Pause className="w-5 h-5 fill-slate-950" />
                <span>PAUSE INTERVALS</span>
              </button>
            ) : (
              <button
                onClick={startIntervalTimer}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>
                  {intervalPhase === 'idle'
                    ? 'START INTERVALS'
                    : intervalPhase === 'finished'
                    ? 'RESTART SESSION'
                    : 'RESUME'}
                </span>
              </button>
            )}

            <button
              onClick={resetIntervalTimer}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Reset Intervals"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Footer Advice */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rest tip: Hypertrophy: 60-90s • Heavy Strength: 2-3m • HIIT: 15-30s</span>
        </span>
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Exit Gym Mode
          </button>
        )}
      </div>
    </div>
  );
};
