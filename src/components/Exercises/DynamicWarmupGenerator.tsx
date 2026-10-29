import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface WarmupMovement {
  name: string;
  durationSec: number;
  jointFocus: string;
  cues: string;
}

const WARMUP_ROUTINES_BY_SPLIT: {
  [key: string]: {
    splitName: string;
    description: string;
    movements: WarmupMovement[];
  };
} = {
  push: {
    splitName: 'Push Day (Chest, Shoulders & Triceps)',
    description: 'Decompresses the rotator cuff, lubricates glenohumeral joints, and activates the serratus anterior.',
    movements: [
      {
        name: 'Arm Circles & Hug Stretch',
        durationSec: 60,
        jointFocus: 'Glenohumeral joint & Pec Minor',
        cues: 'Begin with small tight circles, expanding to wide fluid circles. Cross arms across chest to open posterior delts.',
      },
      {
        name: 'Scapular Wall Slides',
        durationSec: 60,
        jointFocus: 'Scapulothoracic glide & Lower Traps',
        cues: 'Press elbows and wrists against wall. Slide arms overhead without arching the lower back.',
      },
      {
        name: 'Thoracic Thread the Needle',
        durationSec: 60,
        jointFocus: 'T-Spine rotation & Lat stretch',
        cues: 'On all fours, reach one arm under torso, breathing into the upper back. Alternate sides every 30 seconds.',
      },
      {
        name: 'Inchworm Walkouts into Push-Up',
        durationSec: 60,
        jointFocus: 'Core brace, Hamstring stretch & Anterior Deltoid',
        cues: 'Hinge forward, touch floor, walk hands out into plank. Perform 1 slow controlled push-up, walk hands back.',
      },
      {
        name: 'Pike to Downward Dog Pump',
        durationSec: 60,
        jointFocus: 'Shoulder stability & Calves',
        cues: 'Press palms into floor, drive hips to ceiling, lightly pumping calves and pushing head through arm window.',
      },
    ],
  },
  pull: {
    splitName: 'Pull Day (Back, Lats & Biceps)',
    description: 'Frees up thoracic spine, warms up elbow flexors, and primes latissimus dorsi motor recruitment.',
    movements: [
      {
        name: 'Cat-Cow Spinal Waves',
        durationSec: 60,
        jointFocus: 'Spinal articulation & Multifidus',
        cues: 'Inhale into deep lumbar extension, exhale tucking chin and rounding thoracic spine like an angry cat.',
      },
      {
        name: 'Bird-Dog Cross Reaches',
        durationSec: 60,
        jointFocus: 'Posterior sling & Quadratus lumborum',
        cues: 'Reach opposite arm and leg straight out without letting hips twist. Hold 2 seconds per rep, then switch.',
      },
      {
        name: 'Dead Hang or Active Scapular Pulls',
        durationSec: 60,
        jointFocus: 'Subacromial space & Grip priming',
        cues: 'Hang from pull-up bar (or door frame). Pull shoulder blades down into back pockets without bending elbows.',
      },
      {
        name: 'Prone Cobra / Y-T-W Raises',
        durationSec: 60,
        jointFocus: 'Rhomboids & Mid-Traps',
        cues: 'Lie chest down on mat. Squeeze shoulder blades together, rotating thumbs towards ceiling in Y, T, and W shapes.',
      },
      {
        name: 'Torso Twists into Standing Hinge',
        durationSec: 60,
        jointFocus: 'Rotational core & Hamstring tension',
        cues: 'Rotate torso gently side-to-side, transitioning into controlled unweighted hip hinges.',
      },
    ],
  },
  legs: {
    splitName: 'Leg Day (Quads, Hamstrings & Glutes)',
    description: 'Increases hip capsule synovial fluid, activates glute medius, and improves ankle dorsiflexion.',
    movements: [
      {
        name: '90/90 Hip Mobility Flow',
        durationSec: 60,
        jointFocus: 'Hip internal & external rotation',
        cues: 'Sit on floor with both knees bent at 90°. Rotate knees from left to right smoothly without lifting hands.',
      },
      {
        name: 'Deep Goblet Squat Hold & Ankle Pries',
        durationSec: 60,
        jointFocus: 'Ankle dorsiflexion & Adductors',
        cues: 'Drop into a deep bodyweight squat. Use elbows to gently pry knees outward while shifting weight onto each ankle.',
      },
      {
        name: 'Glute Bridges with 3-Second Hold',
        durationSec: 60,
        jointFocus: 'Gluteus maximus activation & Pelvis',
        cues: 'Drive through heels to bridge hips upward. Squeeze glutes hard for 3 seconds at top to wake up posterior chain.',
      },
      {
        name: 'Walking Lunges with Torso Twist',
        durationSec: 60,
        jointFocus: 'Hip flexor length & Quadriceps',
        cues: 'Step forward into lunge, rotate upper torso towards the forward knee. Step through and repeat on opposite leg.',
      },
      {
        name: 'Leg Swings (Front-to-Back & Lateral)',
        durationSec: 60,
        jointFocus: 'Hamstrings, Hip abductors & Groin',
        cues: 'Hold a wall for balance. Swing leg front-to-back for 30s, then laterally side-to-side for 30s per leg.',
      },
    ],
  },
  full_body: {
    splitName: 'Full Body & HIIT Conditioning',
    description: 'Elevates core body temperature, accelerates cardiac output, and preps all major synovial joints.',
    movements: [
      {
        name: 'Jumping Jacks to Seal Claps',
        durationSec: 60,
        jointFocus: 'Cardiovascular ramp & Shoulders',
        cues: 'Light bounce on balls of feet. Alternate standard jumping jacks with horizontal chest-opening seal claps.',
      },
      {
        name: "World's Greatest Stretch",
        durationSec: 60,
        jointFocus: 'Hip flexor, Hamstring & T-Spine',
        cues: 'Lunge forward with right foot, place left hand down, rotate right arm up to sky. Switch sides every 30s.',
      },
      {
        name: 'Bodyweight Squat to Overhead Reach',
        durationSec: 60,
        jointFocus: 'Triple extension (ankles, knees, hips)',
        cues: 'Descend into full squat, explode upward onto toes while reaching both arms overhead.',
      },
      {
        name: 'Bear Crawl Holds into Kick-Throughs',
        durationSec: 60,
        jointFocus: 'Core stability & Shoulder girdle',
        cues: 'Hover knees 2 inches above ground in all-fours position. Rotate hip through smoothly, alternating sides.',
      },
      {
        name: 'High Knees into Butt Kicks',
        durationSec: 60,
        jointFocus: 'CNS priming & Hip flexor rate of force',
        cues: 'Fast rhythmic turnover. 30 seconds high knees followed by 30 seconds rapid butt kicks.',
      },
    ],
  },
};

export const DynamicWarmupGenerator: React.FC = () => {
  const [selectedSplit, setSelectedSplit] = useState<string>('push');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepSecondsLeft, setStepSecondsLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const activeRoutine = WARMUP_ROUTINES_BY_SPLIT[selectedSplit] || WARMUP_ROUTINES_BY_SPLIT.push;
  const currentMovement = activeRoutine.movements[currentStepIndex] || activeRoutine.movements[0];

  const timerRef = useRef<any>(null);

  // Countdown timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setStepSecondsLeft((prev) => {
          if (prev <= 1) {
            // Next step or finish
            if (currentStepIndex < activeRoutine.movements.length - 1) {
              if (soundEnabled) playTimerFinishChime();
              setCurrentStepIndex((idx) => idx + 1);
              return 60;
            } else {
              // Routine complete
              clearInterval(timerRef.current);
              setIsRunning(false);
              if (soundEnabled) playTimerFinishChime();
              return 0;
            }
          }
          if (prev <= 4 && prev > 1 && soundEnabled) {
            playShortBeep(750, 0.08);
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
  }, [isRunning, currentStepIndex, activeRoutine, soundEnabled]);

  const handleStart = () => {
    setIsRunning(true);
    if (soundEnabled) playShortBeep(880, 0.1);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setStepSecondsLeft(60);
  };

  const handleSelectSplit = (key: string) => {
    setSelectedSplit(key);
    setIsRunning(false);
    setCurrentStepIndex(0);
    setStepSecondsLeft(60);
  };

  // Overall progress percentage
  const totalSeconds = 300;
  const elapsedSeconds = currentStepIndex * 60 + (60 - stepSecondsLeft);
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              5-Minute Priming Protocol
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Synovial Activation
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Dynamic Warm-up Generator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Select your target muscle split for today. Get an evidence-based 5-minute dynamic movement routine with a live timer to lubricate joints and elevate muscle temperature.
          </p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700 self-start md:self-auto"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          <span>{soundEnabled ? 'Chimes On' : 'Muted'}</span>
        </button>
      </div>

      {/* Target Muscle Split Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { key: 'push', label: 'Push Day', sub: 'Chest & Shoulders' },
          { key: 'pull', label: 'Pull Day', sub: 'Back & Lats' },
          { key: 'legs', label: 'Leg Day', sub: 'Quads & Glutes' },
          { key: 'full_body', label: 'Full Body', sub: 'HIIT & Synergy' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleSelectSplit(item.key)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedSplit === item.key
                ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xs font-black block">{item.label}</span>
            <span className="text-[10px] text-slate-400">{item.sub}</span>
          </button>
        ))}
      </div>

      {/* Main Interactive Warmup Timer & Current Movement Showcase */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Exercise {currentStepIndex + 1} of 5 ({currentMovement.durationSec}s)
            </span>
            <h3 className="text-2xl font-black text-white mt-1">
              {currentMovement.name}
            </h3>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Target Joint: {currentMovement.jointFocus}</span>
            </p>
          </div>

          {/* Big Countdown Number */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-5xl font-black font-mono text-amber-400">
                {stepSecondsLeft < 10 ? `0${stepSecondsLeft}` : stepSecondsLeft}
                <span className="text-xs font-sans text-slate-400 ml-1">s</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Current Step</span>
            </div>

            {/* Play / Pause / Reset Controls */}
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  title="Start Warm-up Timer"
                >
                  <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold border border-slate-700 transition-all cursor-pointer"
                  title="Pause Timer"
                >
                  <Pause className="w-6 h-6 fill-current" />
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-all cursor-pointer"
                title="Reset Routine"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar (Overall 5-min routine) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Overall Warm-up Progress ({Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s / 5m)</span>
            <span className="font-bold text-amber-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Execution Cues Box */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Movement Cues & Mechanics:
          </span>
          <p className="text-slate-200 font-medium leading-relaxed">
            {currentMovement.cues}
          </p>
        </div>
      </div>

      {/* Routine Step-by-Step Overview */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          5-Minute Sequence Breakdown ({activeRoutine.splitName})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {activeRoutine.movements.map((m, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCurrentStepIndex(idx);
                setStepSecondsLeft(60);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                currentStepIndex === idx
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow'
                  : currentStepIndex > idx
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Step {idx + 1}</span>
                {currentStepIndex > idx && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
              <p className="text-xs font-bold text-white mt-1 line-clamp-1">{m.name}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">{m.durationSec}s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
