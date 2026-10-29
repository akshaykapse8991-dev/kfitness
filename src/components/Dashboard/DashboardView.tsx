import React, { useState } from 'react';
import {
  Flame,
  Droplet,
  Dumbbell,
  Plus,
  Trash2,
  Camera,
  Salad,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  Download,
  PieChart as PieIcon,
  BarChart3,
  CalendarDays,
  Music,
  Video,
  Zap,
  Activity,
} from 'lucide-react';
import { DailyActivityTracker, ExerciseLogItem, MealItem, UserProfile } from '../../types/fitness';
import { GOAL_LABELS } from '../../utils/calculators';
import { MacroPieChartComparison } from './MacroPieChartComparison';
import { WeightProjectionsCard } from './WeightProjectionsCard';
import { FlexibilityScoreWidget } from './FlexibilityScoreWidget';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DashboardViewProps {
  userProfile: UserProfile;
  dailyTracker: DailyActivityTracker;
  onUpdateDailyTracker: (updated: Partial<DailyActivityTracker>) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  weightHistory: { date: string; weightKg: number }[];
  onAddWeightLog: (weight: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  dailyTracker,
  onUpdateDailyTracker,
  onNavigateTab,
  weightHistory,
  onAddWeightLog,
}) => {
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [macroViewMode, setMacroViewMode] = useState<'chart' | 'bars'>('chart');

  const goalInfo = GOAL_LABELS[userProfile.goal] || GOAL_LABELS.fat_loss;
  const remainingCalories = Math.max(0, userProfile.targetCalories - dailyTracker.consumedCalories);
  const caloriePct = Math.min(100, Math.round((dailyTracker.consumedCalories / userProfile.targetCalories) * 100));

  const proteinPct = Math.min(100, Math.round((dailyTracker.consumedProtein / userProfile.targetProtein) * 100));
  const carbsPct = Math.min(100, Math.round((dailyTracker.consumedCarbs / userProfile.targetCarbs) * 100));
  const fatPct = Math.min(100, Math.round((dailyTracker.consumedFat / userProfile.targetFat) * 100));

  const waterLiters = Math.round((dailyTracker.waterGlasses * 0.25) * 10) / 10;
  const waterTargetLiters = userProfile.waterGoalLiters || 3.5;
  const waterTargetGlasses = Math.round(waterTargetLiters / 0.25);
  const waterPct = Math.min(100, Math.round((dailyTracker.waterGlasses / waterTargetGlasses) * 100));

  const handleAddWater = (delta: number) => {
    const nextGlasses = Math.max(0, dailyTracker.waterGlasses + delta);
    onUpdateDailyTracker({ waterGlasses: nextGlasses });
  };

  const handleRemoveMeal = (mealId: string) => {
    const nextMeals = dailyTracker.mealsLogged.filter((m) => m.id !== mealId);
    let nextCals = 0;
    let nextProt = 0;
    let nextCarbs = 0;
    let nextFat = 0;
    nextMeals.forEach((m) => {
      nextCals += m.calories;
      nextProt += m.protein;
      nextCarbs += m.carbs;
      nextFat += m.fat;
    });
    onUpdateDailyTracker({
      mealsLogged: nextMeals,
      consumedCalories: Math.round(nextCals),
      consumedProtein: Math.round(nextProt * 10) / 10,
      consumedCarbs: Math.round(nextCarbs * 10) / 10,
      consumedFat: Math.round(nextFat * 10) / 10,
    });
  };

  const handleToggleHabit = (habitKey: string) => {
    const current = dailyTracker.checklist || {};
    const updated = { ...current, [habitKey]: !current[habitKey] };
    onUpdateDailyTracker({ checklist: updated });
  };

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeightInput);
    if (!isNaN(val) && val > 30 && val < 250) {
      onAddWeightLog(val);
      setNewWeightInput('');
      setShowWeightModal(false);
    }
  };

  // Workout metrics
  const totalSetsLogged = dailyTracker.completedExercises.reduce((sum, ex) => {
    return sum + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const habitsList = [
    { key: 'water', label: `Drink ${waterTargetLiters}L Fresh Water`, done: waterLiters >= waterTargetLiters },
    { key: 'protein', label: `Hit ${userProfile.targetProtein}g Protein Goal`, done: dailyTracker.consumedProtein >= userProfile.targetProtein },
    { key: 'workout', label: 'Complete Daily Workout or 8,000 Steps', done: dailyTracker.completedExercises.length > 0 },
    { key: 'salad', label: 'Eat 1 Fresh Green Salad / Fiber Bowl', done: !!dailyTracker.checklist?.salad },
    { key: 'sleep', label: 'Sleep 7+ Hours for Muscle Repair', done: !!dailyTracker.checklist?.sleep },
  ];

  // Weight metrics & domain for Recharts LineChart
  const startWeight = weightHistory.length > 0 ? weightHistory[0].weightKg : userProfile.weightKg;
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weightKg : userProfile.weightKg;
  const totalWeightChange = Math.round((currentWeight - startWeight) * 10) / 10;
  const remainingToGoal = Math.round(Math.abs(currentWeight - userProfile.targetWeightKg) * 10) / 10;
  const allWeightValues = [
    ...weightHistory.map((w) => w.weightKg),
    userProfile.targetWeightKg,
    userProfile.weightKg,
  ];
  const minWeightDomain = Math.floor(Math.min(...allWeightValues) - 2);
  const maxWeightDomain = Math.ceil(Math.max(...allWeightValues) + 2);

  const renderWeightTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const diffFromTarget = Math.round((val - userProfile.targetWeightKg) * 10) / 10;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md min-w-[150px]">
          <p className="text-[11px] font-semibold text-slate-400">{label}</p>
          <p className="text-base font-black text-cyan-300">
            {val} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
          <div className="pt-1 border-t border-slate-800 text-[11px]">
            {diffFromTarget === 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Target weight reached!
              </span>
            ) : diffFromTarget > 0 ? (
              <span className="text-slate-300">
                <strong className="text-amber-400">{diffFromTarget} kg</strong> above target
              </span>
            ) : (
              <span className="text-slate-300">
                <strong className="text-emerald-400">{Math.abs(diffFromTarget)} kg</strong> below target
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Launch Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Personal Daily Hub
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome to <span className="text-emerald-400">Kapse Fitness</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Targeting <span className="text-slate-200 font-semibold">{goalInfo.label}</span> with{' '}
              <span className="text-emerald-300 font-semibold">{userProfile.targetCalories} kcal</span> daily budget and{' '}
              <span className="text-emerald-300 font-semibold">{userProfile.targetProtein}g</span> protein.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('scanner')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Food</span>
            </button>

            <button
              onClick={() => onNavigateTab('nutrition')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Salad className="w-4 h-4 text-emerald-400" />
              <span>Indian Foods</span>
            </button>

            <button
              onClick={() => onNavigateTab('exercises')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Workouts</span>
            </button>

            <button
              onClick={() => onNavigateTab('calendar')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Adaptive Calendar</span>
            </button>

            <button
              onClick={() => setShowWeightModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Log Weight</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launchpad for Easy 1-Tap Access */}
      <div className="bg-slate-900/70 rounded-2xl border border-slate-800/80 p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-md">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-300 pl-1.5 shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="uppercase tracking-wider text-[11px]">Quick Launch:</span>
        </div>

        <button
          onClick={() => handleAddWater(1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm active:scale-95"
          title="Quick log 250ml water glass"
        >
          <Droplet className="w-3.5 h-3.5 fill-cyan-400" />
          <span>+250ml Water</span>
        </button>

        <button
          onClick={() => onNavigateTab('nutrition')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm active:scale-95"
          title="Open AI Nutrition Coach & Macro Swaps"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Nutrition Coach</span>
        </button>

        <button
          onClick={() => onNavigateTab('exercises')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm active:scale-95"
          title="Start 5-Minute Dynamic Warmup routine"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>5-Min Warmup</span>
        </button>

        <button
          onClick={() => onNavigateTab('exercises')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm active:scale-95"
          title="Play 140 BPM BeatMatch workout audio"
        >
          <Music className="w-3.5 h-3.5 text-rose-400" />
          <span>BeatMatch 140 BPM</span>
        </button>

        <button
          onClick={() => onNavigateTab('exercises')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm active:scale-95"
          title="Point camera to scan gym machine"
        >
          <Video className="w-3.5 h-3.5 text-indigo-400" />
          <span>Equipment Scanner</span>
        </button>

        <button
          onClick={() => onNavigateTab('calculators')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-500/30 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm active:scale-95"
          title="Calculate Biological Fitness Age"
        >
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Biological Age</span>
        </button>
      </div>

      {/* Main Stats Grid: Calorie Ring, Macros, and Water */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Calorie Tracker Card (5 cols) */}
        <div className="md:col-span-5 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Daily Calorie Budget</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {goalInfo.label.split('(')[0]}
              </span>
            </div>

            {/* Circular / Gauge Display */}
            <div className="flex items-center justify-center my-6">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    stroke="#1e293b"
                    strokeWidth="14"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeDasharray={452.38}
                    strokeDashoffset={452.38 - (452.38 * caloriePct) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {remainingCalories}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    kcal remaining
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1">
                    {caloriePct}% consumed
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center pt-2 border-t border-slate-800">
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <span className="text-xs text-slate-400 block">Consumed</span>
                <span className="text-lg font-black text-slate-100">
                  {dailyTracker.consumedCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
                </span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <span className="text-xs text-slate-400 block">Target Budget</span>
                <span className="text-lg font-black text-emerald-400">
                  {userProfile.targetCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Burned via Workouts:</span>
            <span className="font-bold text-amber-400">
              ~{dailyTracker.completedExercises.length * 80} kcal
            </span>
          </div>
        </div>

        {/* Right: Macronutrient Gauges & Hydration (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          {/* Macronutrients Card with Recharts Pie Chart */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                  <span>Macronutrient Breakdown (Consumed vs Target)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual comparison of daily protein, carbohydrates, and healthy fats.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Pie Chart vs Progress Bars */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setMacroViewMode('chart')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      macroViewMode === 'chart'
                        ? 'bg-slate-800 text-emerald-400 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PieIcon className="w-3.5 h-3.5" />
                    <span>Pie Chart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMacroViewMode('bars')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      macroViewMode === 'bars'
                        ? 'bg-slate-800 text-emerald-400 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Bars</span>
                  </button>
                </div>

                <button
                  onClick={() => onNavigateTab('calculators')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer ml-1"
                  title="Adjust in Calculators"
                >
                  <span className="hidden sm:inline">Adjust</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {macroViewMode === 'chart' ? (
              /* Visual Recharts Pie Chart comparing Consumed vs Target */
              <MacroPieChartComparison
                consumedProtein={dailyTracker.consumedProtein}
                consumedCarbs={dailyTracker.consumedCarbs}
                consumedFat={dailyTracker.consumedFat}
                targetProtein={userProfile.targetProtein}
                targetCarbs={userProfile.targetCarbs}
                targetFat={userProfile.targetFat}
              />
            ) : (
              /* Linear Progress Bars View */
              <div className="space-y-4">
                {/* Protein Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Protein (Muscle Recovery)
                    </span>
                    <span className="font-bold text-slate-200">
                      {dailyTracker.consumedProtein}g <span className="text-slate-500 font-normal">/ {userProfile.targetProtein}g</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${proteinPct}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Carbs Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Carbohydrates (Glycogen Energy)
                    </span>
                    <span className="font-bold text-slate-200">
                      {dailyTracker.consumedCarbs}g <span className="text-slate-500 font-normal">/ {userProfile.targetCarbs}g</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${carbsPct}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Fats Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      Healthy Fats (Hormone Balance)
                    </span>
                    <span className="font-bold text-slate-200">
                      {dailyTracker.consumedFat}g <span className="text-slate-500 font-normal">/ {userProfile.targetFat}g</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${fatPct}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Water Hydration Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Daily Hydration Tracker</h3>
              </div>
              <span className="text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                {waterLiters}L / {waterTargetLiters}L ({waterPct}%)
              </span>
            </div>

            {/* Interactive Glasses Row */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 no-scrollbar">
              {Array.from({ length: Math.max(12, waterTargetGlasses) }).map((_, idx) => {
                const isDrunk = idx < dailyTracker.waterGlasses;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAddWater(isDrunk ? -1 : 1)}
                    title={`Glass ${idx + 1} (250ml)`}
                    className={`w-7 h-10 rounded-md border flex flex-col items-center justify-end p-0.5 transition-all cursor-pointer ${
                      isDrunk
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <Droplet className={`w-3.5 h-3.5 ${isDrunk ? 'fill-cyan-400 text-cyan-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-xs text-slate-400">
                1 glass = 250ml • Tap any glass to log
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddWater(-1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  -250ml
                </button>
                <button
                  onClick={() => handleAddWater(1)}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  +250ml
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Today's Logged Meals & Today's Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Meals Log (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Salad className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Today&apos;s Food Diary</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                {dailyTracker.mealsLogged.length} items
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('scanner')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Photo</span>
              </button>
              <button
                onClick={() => onNavigateTab('nutrition')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Food</span>
              </button>
            </div>
          </div>

          {dailyTracker.mealsLogged.length === 0 ? (
            <div className="py-12 px-4 rounded-2xl bg-slate-800/30 border border-dashed border-slate-800 text-center space-y-3">
              <Salad className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-300 font-semibold">No foods logged yet today</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Snap a photo of your Indian meal using the AI camera scanner or pick items from our verified Indian food library.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateTab('scanner')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Open AI Camera
                </button>
                <button
                  onClick={() => onNavigateTab('nutrition')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer"
                >
                  Browse Indian Foods
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {dailyTracker.mealsLogged.map((meal) => (
                <div key={meal.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                        meal.isVeg ? 'border-emerald-500 bg-slate-900' : 'border-rose-500 bg-slate-900'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meal.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{meal.name}</p>
                      <p className="text-xs text-slate-400">
                        {meal.portion} • {meal.calories} kcal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      <span className="font-bold text-emerald-400">{meal.protein}g P</span>
                      <span className="text-slate-500 mx-1">•</span>
                      <span className="text-slate-400">{meal.carbs}g C</span>
                    </div>

                    <button
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Remove meal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Daily Habit Tracker & Workout Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Habits Checklist */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Daily Health Checklist</span>
            </h3>

            <div className="space-y-2.5">
              {habitsList.map((habit) => (
                <div
                  key={habit.key}
                  onClick={() => handleToggleHabit(habit.key)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                    habit.done
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <span>{habit.label}</span>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      habit.done
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {habit.done && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workout Summary Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-400" />
                <span>Today&apos;s Workout</span>
              </h3>
              <button
                onClick={() => onNavigateTab('exercises')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Workout Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dailyTracker.completedExercises.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">No exercise sets logged yet today.</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => onNavigateTab('exercises')}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Start Workout Session
                  </button>
                  <button
                    onClick={() => onNavigateTab('calendar')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>{dailyTracker.completedExercises.length} Exercises Recorded</span>
                  <span>{totalSetsLogged} Completed Sets</span>
                </div>
                <div className="space-y-1.5">
                  {dailyTracker.completedExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200">{ex.exerciseName}</span>
                      <span className="text-slate-400">{ex.sets.filter((s) => s.completed).length} sets</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Progress & History Section with Recharts LineChart */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Weight History & Fitness Progress</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Track your weight trend over time against your target goal ({userProfile.targetWeightKg} kg).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWeightModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Weight</span>
            </button>
          </div>
        </div>

        {/* Milestone Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Start Weight</span>
            <div className="text-xl font-black text-white mt-1">
              {startWeight} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <span className="text-[10px] text-slate-400">Initial log entry</span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-cyan-400 font-bold block uppercase tracking-wider">Current Weight</span>
            <div className="text-xl font-black text-cyan-300 mt-1">
              {currentWeight} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <span className="text-[10px] text-slate-400">Latest measurement</span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Net Progress</span>
            <div className="text-xl font-black mt-1 flex items-center gap-1">
              <span className={totalWeightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {totalWeightChange > 0 ? `+${totalWeightChange}` : totalWeightChange} kg
              </span>
              {totalWeightChange < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : totalWeightChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-amber-400" />
              ) : null}
            </div>
            <span className="text-[10px] text-slate-400">Since tracking started</span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Goal Target</span>
            <div className="text-xl font-black text-emerald-300 mt-1">
              {userProfile.targetWeightKg} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {currentWeight === userProfile.targetWeightKg
                ? 'Target achieved!'
                : `${remainingToGoal} kg to target`}
            </span>
          </div>
        </div>

        {/* Projections Card */}
        <WeightProjectionsCard
          weightHistory={weightHistory}
          currentWeightKg={currentWeight}
          targetWeightKg={userProfile.targetWeightKg}
        />

        {/* Flexibility Score Circular Progress Gauge Widget */}
        <FlexibilityScoreWidget
          onLaunchWarmup={() => onNavigateTab('exercises')}
        />

        {/* Recharts LineChart Component */}
        <div className="bg-slate-950/70 rounded-2xl border border-slate-800/90 p-4 pt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
            <span className="flex items-center gap-2">
              <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block" />
              <span>Weigh-in History</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t border-dashed border-emerald-400 inline-block" />
              <span className="text-emerald-400 font-semibold">Target Line ({userProfile.targetWeightKg} kg)</span>
            </span>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  domain={[minWeightDomain, maxWeightDomain]}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  unit=" kg"
                />
                <RechartsTooltip content={renderWeightTooltip} />
                <ReferenceLine
                  y={userProfile.targetWeightKg}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4', stroke: '#083344', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent logs chips */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recent Recorded Logs ({weightHistory.length})</span>
            <span className="text-[11px] text-slate-500">Tap Record Weight to log daily weigh-ins</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            {weightHistory.length === 0 ? (
              <span className="text-xs text-slate-500">No weigh-ins logged yet.</span>
            ) : (
              weightHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shrink-0 text-center flex items-center gap-2 text-xs"
                >
                  <span className="text-slate-400">{entry.date}:</span>
                  <span className="font-black text-cyan-300">{entry.weightKg} kg</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              <span>Record Today&apos;s Weight</span>
            </h3>
            <p className="text-xs text-slate-400">
              Weigh yourself first thing in the morning after using the bathroom for maximum consistency.
            </p>
            <form onSubmit={handleSaveWeight} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Weight in Kilograms (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  placeholder={userProfile.weightKg.toString()}
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWeightModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  Save Weigh-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
