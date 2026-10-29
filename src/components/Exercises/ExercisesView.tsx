import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Home,
  Building2,
  Search,
  Filter,
  Flame,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Trophy,
  Zap,
  Maximize2,
  ArrowRight,
  Activity,
  Layers,
  Camera,
  FileSpreadsheet,
  Video,
  Music,
} from 'lucide-react';
import { ExerciseFormHelper } from './ExerciseFormHelper';
import { ExerciseHistoryExportModal } from './ExerciseHistoryExportModal';
import { EquipmentTutorialOverlay } from './EquipmentTutorialOverlay';
import { GymEquipmentTutorial } from './GymEquipmentTutorial';
import { DynamicWarmupGenerator } from './DynamicWarmupGenerator';
import { BeatMatchPlayer } from './BeatMatchPlayer';
import { EXERCISES_DATABASE } from '../../data/exercises';
import { WORKOUT_ROUTINES } from '../../data/workoutRoutines';
import { WorkoutIntervalTimer } from './WorkoutIntervalTimer';
import { WarmupCooldownView } from './WarmupCooldownView';
import { WorkoutTemplatesView } from './WorkoutTemplatesView';
import { SessionFocus } from '../../data/warmupCooldownData';
import {
  EquipmentType,
  Exercise,
  ExerciseLocation,
  ExerciseLogItem,
  MuscleGroup,
  WorkoutSetRecord,
} from '../../types/fitness';
import { playShortBeep, playTimerFinishChime } from '../../utils/audioChime';

interface ExercisesViewProps {
  onLogExerciseSession: (session: ExerciseLogItem) => void;
  exerciseHistory?: ExerciseLogItem[];
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({
  onLogExerciseSession,
  exerciseHistory,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'library'
    | 'routines'
    | 'templates'
    | 'form-helper'
    | 'dynamic-warmup'
    | 'equipment-tutorial'
    | 'beatmatch'
    | 'timer'
    | 'warmup'
  >('library');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEquipmentTutorialOpen, setIsEquipmentTutorialOpen] = useState(false);
  const [historyList, setHistoryList] = useState<ExerciseLogItem[]>(() => {
    try {
      const stored = localStorage.getItem('kapse_exercise_history_all');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'session-sample-1',
        exerciseId: 'squat_barbell',
        exerciseName: 'Barbell Back Squat',
        targetMuscle: 'Quads & Legs',
        sets: [
          { setNumber: 1, weightKg: 80, reps: 10, completed: true },
          { setNumber: 2, weightKg: 90, reps: 8, completed: true },
          { setNumber: 3, weightKg: 100, reps: 6, completed: true },
          { setNumber: 4, weightKg: 100, reps: 5, completed: true },
        ],
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'session-sample-2',
        exerciseId: 'bench_barbell',
        exerciseName: 'Barbell Bench Press',
        targetMuscle: 'Chest',
        sets: [
          { setNumber: 1, weightKg: 60, reps: 10, completed: true },
          { setNumber: 2, weightKg: 70, reps: 8, completed: true },
          { setNumber: 3, weightKg: 75, reps: 6, completed: true },
        ],
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'session-sample-3',
        exerciseId: 'deadlift_rdl',
        exerciseName: 'Romanian Deadlift (RDL)',
        targetMuscle: 'Hamstrings / Glutes',
        sets: [
          { setNumber: 1, weightKg: 70, reps: 10, completed: true },
          { setNumber: 2, weightKg: 80, reps: 8, completed: true },
          { setNumber: 3, weightKg: 85, reps: 8, completed: true },
        ],
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  });

  useEffect(() => {
    if (exerciseHistory && exerciseHistory.length > 0) {
      setHistoryList((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const newItems = exerciseHistory.filter((e) => !ids.has(e.id));
        if (newItems.length > 0) {
          const merged = [...newItems, ...prev];
          try {
            localStorage.setItem('kapse_exercise_history_all', JSON.stringify(merged));
          } catch {}
          return merged;
        }
        return prev;
      });
    }
  }, [exerciseHistory]);
  const [warmupFocus, setWarmupFocus] = useState<SessionFocus>('push');
  const [autoTriggerRestSec, setAutoTriggerRestSec] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<'all' | ExerciseLocation>('all');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected exercise for workout tracking modal
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [activeSets, setActiveSets] = useState<WorkoutSetRecord[]>([]);

  // Rest Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerInitial, setTimerInitial] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const timerIntervalRef = useRef<any>(null);

  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Timer tick
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            if (soundEnabled) playTimerFinishChime();
            return 0;
          }
          if (prev <= 4 && prev > 1 && soundEnabled) {
            playShortBeep(660, 0.08);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerSeconds, soundEnabled]);

  const startTimer = (seconds: number) => {
    setTimerInitial(seconds);
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
    if (soundEnabled) playShortBeep(880, 0.1);
  };

  const handleOpenTracker = (exercise: Exercise) => {
    setActiveExercise(exercise);
    // Initialize default sets
    const defaultSetsList: WorkoutSetRecord[] = Array.from({ length: exercise.defaultSets || 3 }).map((_, i) => ({
      setNumber: i + 1,
      reps: parseInt(exercise.defaultReps) || 10,
      weightKg: exercise.equipment === 'bodyweight' ? 0 : 20,
      completed: false,
    }));
    setActiveSets(defaultSetsList);
  };

  const handleToggleSetComplete = (index: number) => {
    setActiveSets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], completed: !copy[index].completed };
      if (copy[index].completed) {
        // Automatically trigger rest timer!
        startTimer(60);
      }
      return copy;
    });
  };

  const handleUpdateSet = (index: number, field: 'reps' | 'weightKg', value: number) => {
    setActiveSets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddSet = () => {
    setActiveSets((prev) => [
      ...prev,
      {
        setNumber: prev.length + 1,
        reps: prev[prev.length - 1]?.reps || 10,
        weightKg: prev[prev.length - 1]?.weightKg || 20,
        completed: false,
      },
    ]);
  };

  const handleSaveWorkoutSession = () => {
    if (!activeExercise) return;
    const session: ExerciseLogItem = {
      id: `session-${Date.now()}`,
      exerciseId: activeExercise.id,
      exerciseName: activeExercise.name,
      targetMuscle: activeExercise.muscleLabel,
      sets: activeSets,
      timestamp: new Date().toISOString(),
    };
    onLogExerciseSession(session);
    setHistoryList((prev) => {
      const updated = [session, ...prev];
      try {
        localStorage.setItem('kapse_exercise_history_all', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveExercise(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredExercises = EXERCISES_DATABASE.filter((ex) => {
    if (locationFilter !== 'all' && ex.location !== 'both' && ex.location !== locationFilter) {
      return false;
    }
    if (muscleFilter !== 'all' && ex.targetMuscle !== muscleFilter) {
      return false;
    }
    if (equipmentFilter !== 'all' && ex.equipment !== equipmentFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ex.name.toLowerCase().includes(q);
      const matchMuscle = ex.muscleLabel.toLowerCase().includes(q);
      if (!matchName && !matchMuscle) return false;
    }
    return true;
  });

  const muscleGroups: { id: MuscleGroup | 'all'; label: string }[] = [
    { id: 'all', label: 'All Muscles' },
    { id: 'chest', label: 'Chest' },
    { id: 'back', label: 'Back & Lats' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'biceps', label: 'Biceps' },
    { id: 'triceps', label: 'Triceps' },
    { id: 'quads', label: 'Quads & Legs' },
    { id: 'hamstrings_glutes', label: 'Hamstrings / Glutes' },
    { id: 'calves', label: 'Calves' },
    { id: 'core', label: 'Core & Abs' },
    { id: 'cardio_hiit', label: 'Cardio & HIIT' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Exercise & Training Engine
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Home & Gym Workout Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Verified movement mechanics, form cues, integrated rest timers, and interactive set loggers.
            </p>
          </div>

          {/* Action Row: BeatMatch, Equipment Tutorial & Export CSV History */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('beatmatch')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border font-bold text-xs transition-all shadow-md cursor-pointer ${
                activeTab === 'beatmatch'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20'
                  : 'bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border-rose-500/40'
              }`}
              title="Tempo-matched workout beats synthesizer"
            >
              <Music className="w-4 h-4 text-rose-400" />
              <span>BeatMatch</span>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-500/30 text-rose-200 text-[10px] font-black uppercase">
                Audio
              </span>
            </button>

            <button
              onClick={() => setActiveTab('equipment-tutorial')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border font-bold text-xs transition-all shadow-md cursor-pointer ${
                activeTab === 'equipment-tutorial'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-600/20'
                  : 'bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/40'
              }`}
              title="Point camera to identify gym machine & view safety guide"
            >
              <Video className="w-4 h-4 text-indigo-400" />
              <span>Equipment Tutorial</span>
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase">
                Scanner
              </span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              title="Export complete workout log history to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 fill-slate-950/20" />
              <span>Export CSV</span>
              {historyList.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-950/20 text-slate-950 font-black text-[10px]">
                  {historyList.length}
                </span>
              )}
            </button>
          </div>
        </div>

          {/* Sub-tab: Exercise Library vs Pre-made Routines vs AI Tools */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Library ({EXERCISES_DATABASE.length})
            </button>
            <button
              onClick={() => setActiveTab('routines')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'routines'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Splits & Routines
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setActiveTab('form-helper')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'form-helper'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Form Helper</span>
              <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-extrabold">
                Vision
              </span>
            </button>
            <button
              onClick={() => setActiveTab('dynamic-warmup')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dynamic-warmup'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>5-Min Warmup</span>
              <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                Timer
              </span>
            </button>
            <button
              onClick={() => setActiveTab('equipment-tutorial')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'equipment-tutorial'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Equipment Tutorial</span>
            </button>
            <button
              onClick={() => setActiveTab('beatmatch')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'beatmatch'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>BeatMatch</span>
            </button>
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'timer'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Rest Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('warmup')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'warmup'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Mobility</span>
            </button>
          </div>

        {activeTab === 'library' && (
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            {/* Location & Search row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Location:</span>
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => setLocationFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      locationFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Locations
                  </button>
                  <button
                    onClick={() => setLocationFilter('home')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      locationFilter === 'home'
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Home Workouts</span>
                  </button>
                  <button
                    onClick={() => setLocationFilter('gym')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      locationFilter === 'gym'
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Gym Workouts</span>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bench press, squat, lats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Muscle group chips */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              {muscleGroups.map((mg) => {
                const isSelected = muscleFilter === mg.id;
                return (
                  <button
                    key={mg.id}
                    onClick={() => setMuscleFilter(mg.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {mg.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold">
            Workout session logged to today&apos;s daily tracker!
          </p>
        </div>
      )}

      {/* TAB 1: EXERCISES LIST */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => {
            const isExpanded = expandedExerciseId === exercise.id;
            return (
              <div
                key={exercise.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 shadow-md flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 capitalize">
                          {exercise.location === 'both' ? 'Home & Gym' : exercise.location}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                          {exercise.equipment.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-100 mt-2">
                        {exercise.name}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                        {exercise.muscleLabel}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-800/60 text-slate-400">
                      <Dumbbell className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>

                  {/* Sets / Reps / Calories Burn */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="p-2 bg-slate-800/40 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold">Standard Target</span>
                      <span className="font-bold text-slate-200">
                        {exercise.defaultSets} sets × {exercise.defaultReps}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-800/40 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold">Est. Burn</span>
                      <span className="font-bold text-amber-400">
                        ~{exercise.caloriesBurnEstimate} kcal / 10m
                      </span>
                    </div>
                  </div>

                  {/* Form Instructions accordion toggle */}
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                      className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 font-semibold py-1.5 cursor-pointer"
                    >
                      <span>Technique & Form Tips</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs text-slate-300">
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-400 block">Step-by-step Execution:</span>
                          <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                            {exercise.instructions.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                        {exercise.formTips.length > 0 && (
                          <div className="pt-2 border-t border-slate-800 space-y-1">
                            <span className="font-bold text-amber-400 block">Form Cues & Safety:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                              {exercise.formTips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 capitalize">{exercise.difficulty} Level</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('form-helper')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                      title="Analyze technique with Gemini Vision"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Form Check</span>
                    </button>
                    <button
                      onClick={() => handleOpenTracker(exercise)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Track Sets</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: WORKOUT ROUTINES / SPLITS */}
      {activeTab === 'routines' && (
        <div className="space-y-6">
          {WORKOUT_ROUTINES.map((routine) => (
            <div key={routine.id} className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                      {routine.location === 'home' ? 'Home Routine' : 'Gym Program'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{routine.daysPerWeek} Days / Week</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{routine.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{routine.description}</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 font-bold text-xs self-start sm:self-auto">
                  {routine.goal}
                </div>
              </div>

              {/* Day by Day schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {routine.schedule.map((day, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">{day.dayName}</span>
                    </div>
                    <span className="text-xs text-amber-400 font-medium block">{day.focus}</span>

                    {day.exerciseIds.length > 0 ? (
                      <div className="pt-2 border-t border-slate-700/50 space-y-1">
                        {day.exerciseIds.map((exId) => {
                          const exObj = EXERCISES_DATABASE.find((e) => e.id === exId);
                          if (!exObj) return null;
                          return (
                            <div key={exId} className="flex items-center justify-between text-xs text-slate-300">
                              <span className="truncate">{exObj.name}</span>
                              <span className="text-slate-500 shrink-0 ml-2">{exObj.defaultSets} sets</span>
                            </div>
                          );
                        })}
                        <button
                          onClick={() => {
                            const f = (day.focus + ' ' + day.dayName).toLowerCase();
                            let focus: SessionFocus = 'full_body';
                            if (f.includes('chest') || f.includes('push')) focus = 'push';
                            else if (f.includes('back') || f.includes('pull')) focus = 'pull';
                            else if (f.includes('lower') || f.includes('leg') || f.includes('quad') || f.includes('glute')) focus = 'legs';
                            else if (f.includes('upper')) focus = 'upper';
                            else if (f.includes('hiit') || f.includes('metabolic') || f.includes('burn')) focus = 'hiit_cardio';
                            setWarmupFocus(focus);
                            setActiveTab('warmup');
                          }}
                          className="w-full mt-2 pt-2 border-t border-slate-700/40 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>Warm-up & Cooldown</span>
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic pt-2">Active recovery, walking, hydration</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Routine Level Warm-up/Cooldown Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    const focus: SessionFocus = routine.id.includes('home')
                      ? 'full_body'
                      : routine.id.includes('ppl')
                      ? 'push'
                      : 'full_body';
                    setWarmupFocus(focus);
                    setActiveTab('warmup');
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Targeted Warm-up & Cooldown Protocols for {routine.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: WORKOUT TEMPLATES */}
      {activeTab === 'templates' && (
        <WorkoutTemplatesView
          onLogExerciseSession={onLogExerciseSession}
          onOpenTimer={() => setActiveTab('timer')}
        />
      )}

      {/* TAB 4: AI EXERCISE FORM HELPER (Gemini Vision Biomechanics) */}
      {activeTab === 'form-helper' && (
        <ExerciseFormHelper />
      )}

      {/* TAB: 5-MIN DYNAMIC WARMUP GENERATOR */}
      {activeTab === 'dynamic-warmup' && (
        <DynamicWarmupGenerator />
      )}

      {/* TAB: GYM EQUIPMENT TUTORIAL SCANNER & GUIDE */}
      {activeTab === 'equipment-tutorial' && (
        <GymEquipmentTutorial />
      )}

      {/* TAB: BEATMATCH TEMPO AUDIO PLAYLIST */}
      {activeTab === 'beatmatch' && (
        <BeatMatchPlayer />
      )}

      {/* Built-in Interval & Rest Timer Tab */}
      {activeTab === 'timer' && (
        <div className="space-y-6">
          <WorkoutIntervalTimer
            autoTriggerSeconds={autoTriggerRestSec}
            onClearAutoTrigger={() => setAutoTriggerRestSec(null)}
          />

          {/* Quick Scientific Rest & Interval Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Dumbbell className="w-4 h-4" />
                <h4>Hypertrophy Rest (60–90s)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ideal for muscle building. Allows 80-85% ATP-CP recovery while preserving metabolic stress and cellular swelling.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Trophy className="w-4 h-4" />
                <h4>Heavy Strength Rest (2–3 min)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For heavy squats, deadlifts, and bench press. Full central nervous system recharge ensures maximal force production per set.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <h4>HIIT & Circuit Intervals</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tabata (20s on / 10s off) and Classic HIIT (40s on / 20s off) trigger high excess post-exercise oxygen consumption (EPOC) for fat loss.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WARM-UP & COOLDOWN ENGINE */}
      {activeTab === 'warmup' && (
        <WarmupCooldownView
          initialFocus={warmupFocus}
          onNavigateTab={() => setActiveTab('library')}
        />
      )}

      {/* Interactive Workout Tracker & Rest Timer Modal */}
      {activeExercise && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Live Set Logger
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">{activeExercise.name}</h3>
                <p className="text-xs text-slate-400">{activeExercise.muscleLabel}</p>
              </div>
              <button
                onClick={() => setActiveExercise(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Rest Timer Widget */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Between-Set Rest Timer</span>
                    {isTimerRunning && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block ml-1" />
                    )}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span
                      className={`text-3xl font-black font-mono transition-colors ${
                        timerSeconds <= 5 && timerSeconds > 0
                          ? 'text-rose-400 animate-pulse'
                          : timerSeconds <= 10 && timerSeconds > 0
                          ? 'text-amber-400'
                          : isTimerRunning
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isTimerRunning ? 'Resting...' : timerSeconds === 0 ? 'Ready for next set' : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (timerSeconds === 0) startTimer(60);
                      else setIsTimerRunning(!isTimerRunning);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isTimerRunning
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isTimerRunning ? 'Pause' : timerSeconds === 0 ? 'Start 60s' : 'Resume'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimerSeconds((prev) => prev + 15)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    title="Add 15 seconds"
                  >
                    +15s
                  </button>

                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? 'Mute sound' : 'Enable sound'}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Presets:</span>
                {[30, 45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => startTimer(sec)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      timerInitial === sec && isTimerRunning
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setActiveExercise(null);
                    setActiveTab('timer');
                  }}
                  className="ml-auto text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Full HIIT/Interval Timer</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Sets Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                <span className="col-span-2">Set</span>
                <span className="col-span-4">Reps</span>
                <span className="col-span-4">Weight (kg)</span>
                <span className="col-span-2 text-right">Done</span>
              </div>

              <div className="space-y-1.5">
                {activeSets.map((s, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                      s.completed
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <span className="col-span-2 font-bold text-xs pl-2">#{s.setNumber}</span>
                    <div className="col-span-4">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={s.reps}
                        onChange={(e) => handleUpdateSet(idx, 'reps', Math.max(1, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-center text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={s.weightKg}
                        onChange={(e) => handleUpdateSet(idx, 'weightKg', Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-center text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 text-right pr-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSetComplete(idx)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          s.completed
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                            : 'border-slate-600 bg-slate-900 text-transparent'
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddSet}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-dashed border-slate-700 text-xs text-slate-300 font-bold transition-all cursor-pointer"
              >
                + Add Another Set
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveExercise(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWorkoutSession}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Save Workout Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Rest Timer HUD when timer is running and user is browsing library or routines */}
      {isTimerRunning && timerSeconds > 0 && activeTab !== 'timer' && !activeExercise && (
        <div className="fixed bottom-6 right-6 z-40 bg-slate-950/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex items-center gap-3.5 backdrop-blur-md animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Resting Between Sets
            </span>
            <span className="text-xl font-black font-mono text-amber-400">
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={() => setTimerSeconds((prev) => prev + 30)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition-all cursor-pointer"
              title="Add 30s"
            >
              +30s
            </button>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isTimerRunning ? 'Pause' : 'Resume'}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setActiveTab('timer')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Full Timer
            </button>
          </div>
        </div>
      )}

      {/* CSV Export History Modal */}
      <ExerciseHistoryExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exerciseHistory={historyList}
        onSeedSampleData={() => {
          const extraSample: ExerciseLogItem = {
            id: `session-extra-${Date.now()}`,
            exerciseId: 'overhead_press',
            exerciseName: 'Overhead Press (OHP)',
            targetMuscle: 'Shoulders',
            sets: [
              { setNumber: 1, weightKg: 40, reps: 10, completed: true },
              { setNumber: 2, weightKg: 45, reps: 8, completed: true },
              { setNumber: 3, weightKg: 50, reps: 5, completed: true },
            ],
            timestamp: new Date().toISOString(),
          };
          setHistoryList((prev) => {
            const next = [extraSample, ...prev];
            try {
              localStorage.setItem('kapse_exercise_history_all', JSON.stringify(next));
            } catch {}
            return next;
          });
        }}
      />

      {/* Gym Equipment Tutorial Overlay Modal */}
      <EquipmentTutorialOverlay
        isOpen={isEquipmentTutorialOpen}
        onClose={() => setIsEquipmentTutorialOpen(false)}
        onSelectExerciseToTrack={(machineName) => {
          // Find matching exercise or create custom
          const match = EXERCISES_DATABASE.find(
            (e) =>
              e.name.toLowerCase().includes(machineName.toLowerCase()) ||
              machineName.toLowerCase().includes(e.name.toLowerCase())
          );
          if (match) {
            handleOpenTracker(match);
          } else {
            setActiveTab('library');
            setSearchQuery(machineName.split(' ')[0] || '');
          }
        }}
      />
    </div>
  );
};
