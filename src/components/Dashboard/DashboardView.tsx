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
  PieChart as PieIcon,
  BarChart3,
  CalendarDays,
  Music,
  Video,
  Zap,
  Activity,
} from 'lucide-react';
import { ActiveTab } from '../Header';
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
  const [macroViewMode, setMacroViewMode] = useState<'bars' | 'chart'>('bars');

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
        <div className="bg-[#141417] border border-white/20 p-3 rounded shadow-2xl text-xs space-y-1 backdrop-blur-md min-w-[150px]">
          <p className="text-[10px] font-mono uppercase text-white/50">{label}</p>
          <p className="font-syne text-lg font-extrabold text-[#38BDF8]">
            {val} <span className="font-mono text-xs font-normal text-white/60">kg</span>
          </p>
          <div className="pt-1 border-t border-white/10 text-[11px] font-mono">
            {diffFromTarget === 0 ? (
              <span className="text-[#00DC82] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Target weight reached!
              </span>
            ) : diffFromTarget > 0 ? (
              <span className="text-white/70">
                <strong className="text-amber-400">{diffFromTarget} kg</strong> above target
              </span>
            ) : (
              <span className="text-white/70">
                <strong className="text-[#00DC82]">{Math.abs(diffFromTarget)} kg</strong> below target
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
      {/* Header Block matching Variation 3 specification */}
      <div className="header-block flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="label-mono flex items-center gap-2 mb-1">
            <span className="text-[#00DC82]">MODULE 01: CORE METRICS</span>
            <span className="text-white/20">•</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
          </div>
          <h1 className="big-headline text-white font-syne font-extrabold tracking-tight">
            TRANSFORMATION
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            ACTIVE TARGET: <span className="text-white font-bold">{goalInfo.label.toUpperCase()}</span> // {userProfile.targetCalories} KCAL DAILY BUDGET // {userProfile.targetProtein}G PROTEIN
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('scanner')}
            className="btn-accent"
          >
            <Camera className="w-4 h-4 text-black" />
            <span>Scan Meal</span>
          </button>
          <button
            onClick={() => setShowWeightModal(true)}
            className="btn-ghost"
          >
            <Scale className="w-4 h-4 text-[#00DC82]" />
            <span>Record Weight</span>
          </button>
          <button
            onClick={() => onNavigateTab('nutrition')}
            className="btn-ghost"
          >
            <Salad className="w-4 h-4 text-white/70" />
            <span>Indian Foods</span>
          </button>
        </div>
      </div>

      {/* System Quick Launch Bar */}
      <div className="bg-[#141417] rounded border border-white/10 p-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white/50 pl-2 shrink-0">
          <Zap className="w-3.5 h-3.5 text-[#00DC82]" />
          <span className="label-mono">DIRECT ACCESS:</span>
        </div>
        <button
          onClick={() => handleAddWater(1)}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Droplet className="w-3 h-3 fill-[#38BDF8]" />
          <span>+250ml Water</span>
        </button>
        <button
          onClick={() => onNavigateTab('nutrition')}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00DC82]/10 hover:bg-[#00DC82]/20 text-[#00DC82] border border-[#00DC82]/30 text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Nutrition Coach</span>
        </button>
        <button
          onClick={() => onNavigateTab('exercises')}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Flame className="w-3 h-3" />
          <span>5-Min Warmup</span>
        </button>
        <button
          onClick={() => onNavigateTab('exercises')}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Music className="w-3 h-3" />
          <span>BeatMatch 140 BPM</span>
        </button>
        <button
          onClick={() => onNavigateTab('exercises')}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Video className="w-3 h-3" />
          <span>Equipment Scanner</span>
        </button>
        <button
          onClick={() => onNavigateTab('calculators')}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Activity className="w-3 h-3" />
          <span>Biological Age</span>
        </button>
      </div>

      {/* Main High-Density Metric Panes Grid (Variation 3 viewport) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pane 1: Energy Remaining */}
        <div className="metric-pane p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="label-mono">ENERGY REMAINING</span>
              <span className="tag-accent">{caloriePct}% CONSUMED</span>
            </div>

            <div className="my-3">
              <span className="val-large">{remainingCalories.toLocaleString()}</span>
              <span className="font-mono text-xs text-white/50 ml-1">KCAL</span>
            </div>

            {/* Neon Accent Progress Bar */}
            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/10 my-3">
              <div
                style={{ width: `${caloriePct}%` }}
                className="h-full bg-[#00DC82] rounded-full transition-all duration-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/5">
              <div>
                <span className="text-white/40 block text-[10px]">CONSUMED</span>
                <span className="text-white font-bold">{dailyTracker.consumedCalories} kcal</span>
              </div>
              <div className="text-right">
                <span className="text-white/40 block text-[10px]">TARGET</span>
                <span className="text-[#00DC82] font-bold">{userProfile.targetCalories} kcal</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Burned via sets:</span>
            <span className="text-[#00DC82] font-bold">~{dailyTracker.completedExercises.length * 80} kcal</span>
          </div>
        </div>

        {/* Pane 2: Daily Macronutrients (spans 2 columns on lg) */}
        <div className="metric-pane lg:col-span-2 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="label-mono">DAILY MACRONUTRIENTS</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMacroViewMode('bars')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    macroViewMode === 'bars'
                      ? 'bg-white/10 text-[#00DC82] font-bold border border-[#00DC82]/30'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Blocks
                </button>
                <button
                  type="button"
                  onClick={() => setMacroViewMode('chart')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    macroViewMode === 'chart'
                      ? 'bg-white/10 text-[#00DC82] font-bold border border-[#00DC82]/30'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Pie Chart
                </button>
              </div>
            </div>

            {macroViewMode === 'bars' ? (
              <div className="progress-grid grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {/* Protein Mini-Progress */}
                <div className="mini-progress">
                  <div className="flex items-center justify-between">
                    <span className="label-mono text-[#00DC82]">PROTEIN</span>
                    <span className="text-[10px] font-mono text-white/50">{proteinPct}%</span>
                  </div>
                  <div className="font-syne text-xl font-bold text-white mt-1">
                    {dailyTracker.consumedProtein}g
                  </div>
                  <div className="font-mono text-[10px] text-white/40">
                    / {userProfile.targetProtein}g target
                  </div>
                </div>

                {/* Carbs Mini-Progress */}
                <div className="mini-progress" style={{ borderLeftColor: '#38BDF8' }}>
                  <div className="flex items-center justify-between">
                    <span className="label-mono text-[#38BDF8]">CARBS</span>
                    <span className="text-[10px] font-mono text-white/50">{carbsPct}%</span>
                  </div>
                  <div className="font-syne text-xl font-bold text-white mt-1">
                    {dailyTracker.consumedCarbs}g
                  </div>
                  <div className="font-mono text-[10px] text-white/40">
                    / {userProfile.targetCarbs}g target
                  </div>
                </div>

                {/* Fats Mini-Progress */}
                <div className="mini-progress" style={{ borderLeftColor: '#F59E0B' }}>
                  <div className="flex items-center justify-between">
                    <span className="label-mono text-amber-400">FATS</span>
                    <span className="text-[10px] font-mono text-white/50">{fatPct}%</span>
                  </div>
                  <div className="font-syne text-xl font-bold text-white mt-1">
                    {dailyTracker.consumedFat}g
                  </div>
                  <div className="font-mono text-[10px] text-white/40">
                    / {userProfile.targetFat}g target
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <MacroPieChartComparison
                  consumedProtein={dailyTracker.consumedProtein}
                  consumedCarbs={dailyTracker.consumedCarbs}
                  consumedFat={dailyTracker.consumedFat}
                  targetProtein={userProfile.targetProtein}
                  targetCarbs={userProfile.targetCarbs}
                  targetFat={userProfile.targetFat}
                />
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Macro Allocation:</span>
            <button
              onClick={() => onNavigateTab('calculators')}
              className="text-[#00DC82] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Recalculate Macros</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Pane 3: Hydration Tracker */}
        <div className="metric-pane p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="label-mono">HYDRATION</span>
              <span className="tag-cyan">{waterPct}%</span>
            </div>

            <div className="my-2">
              <span className="val-large text-[#38BDF8]">{waterLiters}</span>
              <span className="font-mono text-xs text-white/50 ml-1">LITERS</span>
            </div>

            {/* Tactile Water Tracking Dots matching Variation 3 style */}
            <div className="water-track my-3">
              {Array.from({ length: Math.min(14, Math.max(10, waterTargetGlasses)) }).map((_, idx) => {
                const isDrunk = idx < dailyTracker.waterGlasses;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddWater(isDrunk ? -1 : 1)}
                    title={`Glass ${idx + 1} (250ml) - Click to toggle`}
                    className={`water-dot cursor-pointer transition-all ${isDrunk ? 'filled' : ''}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/50 mt-1">
              <span>{dailyTracker.waterGlasses} glasses</span>
              <span>Target: {waterTargetLiters}L</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleAddWater(-1)}
              className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono border border-white/10 transition-colors cursor-pointer"
            >
              -250ml
            </button>
            <button
              type="button"
              onClick={() => handleAddWater(1)}
              className="flex-1 py-1 rounded bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] text-xs font-mono font-bold border border-[#38BDF8]/40 transition-colors cursor-pointer"
            >
              +250ml
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Row: Food Diary & Daily Health Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Today's Food Diary (7 cols) */}
        <div className="lg:col-span-7 metric-pane p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="label-mono">TODAY&apos;S FOOD DIARY</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/60">
                {dailyTracker.mealsLogged.length} ITEMS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('scanner')}
                className="btn-accent text-xs py-1 px-3"
              >
                <Camera className="w-3.5 h-3.5 text-black" />
                <span>Scan Photo</span>
              </button>
              <button
                onClick={() => onNavigateTab('nutrition')}
                className="btn-ghost text-xs py-1 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Food</span>
              </button>
            </div>
          </div>

          {dailyTracker.mealsLogged.length === 0 ? (
            <div className="py-10 px-4 rounded bg-black/40 border border-dashed border-white/10 text-center space-y-3">
              <Salad className="w-8 h-8 text-white/30 mx-auto" />
              <p className="text-sm font-syne font-bold text-white">No meals recorded yet today</p>
              <p className="text-xs font-mono text-white/50 max-w-sm mx-auto">
                Scan your meal using the AI vision camera or select authentic foods from the Indian Nutrition database.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => onNavigateTab('scanner')}
                  className="btn-accent text-xs"
                >
                  Scan Meal
                </button>
                <button
                  onClick={() => onNavigateTab('nutrition')}
                  className="btn-ghost text-xs"
                >
                  Browse Indian Foods
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {dailyTracker.mealsLogged.map((meal) => (
                <div key={meal.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-sm flex items-center justify-center border shrink-0 ${
                        meal.isVeg ? 'border-[#00DC82] bg-black' : 'border-rose-500 bg-black'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meal.isVeg ? 'bg-[#00DC82]' : 'bg-rose-500'}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{meal.name}</p>
                      <p className="text-[11px] font-mono text-white/40">
                        {meal.portion} • {meal.calories} kcal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs font-mono">
                      <span className="text-[#00DC82] font-bold">{meal.protein}g P</span>
                      <span className="text-white/20 mx-1">•</span>
                      <span className="text-white/60">{meal.carbs}g C</span>
                    </div>

                    <button
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Habits Checklist & Today's Workout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Habits Checklist */}
          <div className="metric-pane p-5 space-y-3">
            <span className="label-mono block border-b border-white/10 pb-2">
              ACTIVE DAILY CHECKLIST
            </span>

            <div className="space-y-2">
              {habitsList.map((habit) => (
                <div
                  key={habit.key}
                  onClick={() => handleToggleHabit(habit.key)}
                  className={`p-2.5 rounded border flex items-center justify-between text-xs font-mono font-medium cursor-pointer transition-all ${
                    habit.done
                      ? 'bg-[#00DC82]/10 border-[#00DC82]/30 text-white font-bold'
                      : 'bg-black/40 border-white/5 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{habit.label}</span>
                  <div
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                      habit.done
                        ? 'bg-[#00DC82] border-[#00DC82] text-black font-extrabold'
                        : 'border-white/20 bg-black'
                    }`}
                  >
                    {habit.done && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Workout Summary */}
          <div className="metric-pane p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="label-mono">TODAY&apos;S WORKOUT SESSION</span>
              <button
                onClick={() => onNavigateTab('exercises')}
                className="text-xs font-mono text-[#00DC82] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Studio</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {dailyTracker.completedExercises.length === 0 ? (
              <div className="p-4 rounded bg-black/40 border border-white/5 text-center space-y-2">
                <p className="text-xs font-mono text-white/50">No workout sets logged yet today.</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => onNavigateTab('exercises')}
                    className="btn-accent text-xs"
                  >
                    Start Workout
                  </button>
                  <button
                    onClick={() => onNavigateTab('calendar')}
                    className="btn-ghost text-xs"
                  >
                    Calendar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-white/50">
                  <span>{dailyTracker.completedExercises.length} Exercises Recorded</span>
                  <span className="text-[#00DC82] font-bold">{totalSetsLogged} Sets Completed</span>
                </div>
                <div className="space-y-1">
                  {dailyTracker.completedExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-bold text-white">{ex.exerciseName}</span>
                      <span className="text-white/50">{ex.sets.filter((s) => s.completed).length} sets</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Projections & Performance Analytics */}
      <div className="space-y-4">
        {/* Weight Trajectory Projections Card */}
        <WeightProjectionsCard
          weightHistory={weightHistory}
          currentWeightKg={currentWeight}
          targetWeightKg={userProfile.targetWeightKg}
        />

        {/* Mobility Rank & Flexibility Score Gauge */}
        <FlexibilityScoreWidget
          onLaunchWarmup={() => onNavigateTab('exercises')}
        />

        {/* Weight History Analytics with Recharts LineChart */}
        <div className="metric-pane p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="label-mono">WEIGHT PROGRESS TRACKING</span>
                <span className="tag-accent">RECHARTS ENGINE</span>
              </div>
              <p className="text-xs font-mono text-white/50 mt-1">
                Progress history mapped against target objective ({userProfile.targetWeightKg} kg).
              </p>
            </div>

            <button
              onClick={() => setShowWeightModal(true)}
              className="btn-accent text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
              <span>Record Weight</span>
            </button>
          </div>

          {/* Milestone Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-black/40 rounded border border-white/5">
              <span className="label-mono block text-white/40">START WEIGHT</span>
              <div className="font-syne text-xl font-extrabold text-white mt-1">
                {startWeight} <span className="font-mono text-xs font-normal text-white/40">kg</span>
              </div>
              <span className="text-[10px] text-white/40">Baseline</span>
            </div>

            <div className="p-3 bg-black/40 rounded border border-white/5">
              <span className="label-mono block text-[#38BDF8]">CURRENT WEIGHT</span>
              <div className="font-syne text-xl font-extrabold text-[#38BDF8] mt-1">
                {currentWeight} <span className="font-mono text-xs font-normal text-white/40">kg</span>
              </div>
              <span className="text-[10px] text-white/40">Latest Weigh-in</span>
            </div>

            <div className="p-3 bg-black/40 rounded border border-white/5">
              <span className="label-mono block text-white/40">NET DELTA</span>
              <div className="font-syne text-xl font-extrabold mt-1 flex items-center gap-1">
                <span className={totalWeightChange <= 0 ? 'text-[#00DC82]' : 'text-amber-400'}>
                  {totalWeightChange > 0 ? `+${totalWeightChange}` : totalWeightChange} kg
                </span>
                {totalWeightChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-[#00DC82]" />
                ) : totalWeightChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                ) : null}
              </div>
              <span className="text-[10px] text-white/40">Overall Change</span>
            </div>

            <div className="p-3 bg-black/40 rounded border border-white/5">
              <span className="label-mono block text-[#00DC82]">GOAL TARGET</span>
              <div className="font-syne text-xl font-extrabold text-[#00DC82] mt-1">
                {userProfile.targetWeightKg} <span className="font-mono text-xs font-normal text-white/40">kg</span>
              </div>
              <span className="text-[10px] text-white/40">
                {currentWeight === userProfile.targetWeightKg
                  ? 'Target achieved!'
                  : `${remainingToGoal} kg to target`}
              </span>
            </div>
          </div>

          {/* Recharts Component Container */}
          <div className="bg-black/50 rounded border border-white/5 p-4 pt-5">
            <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-3 px-1">
              <span className="flex items-center gap-2">
                <span className="w-3 h-1 bg-[#38BDF8] rounded-full inline-block" />
                <span>Weigh-in History</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t border-dashed border-[#00DC82] inline-block" />
                <span className="text-[#00DC82] font-semibold">Target Line ({userProfile.targetWeightKg} kg)</span>
              </span>
            </div>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistory} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#555"
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis
                    stroke="#555"
                    domain={[minWeightDomain, maxWeightDomain]}
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#333' }}
                    unit=" kg"
                  />
                  <RechartsTooltip content={renderWeightTooltip} />
                  <ReferenceLine
                    y={userProfile.targetWeightKg}
                    stroke="#00DC82"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    stroke="#38BDF8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#38BDF8', stroke: '#09090B', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#7DD3FC', stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent weigh-ins row */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar pt-2 border-t border-white/5 font-mono text-xs">
            <span className="text-white/40 shrink-0">LOGS ({weightHistory.length}):</span>
            {weightHistory.map((entry, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1 rounded bg-black/40 border border-white/5 shrink-0 flex items-center gap-2"
              >
                <span className="text-white/40">{entry.date}:</span>
                <span className="font-bold text-[#38BDF8]">{entry.weightKg} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Record Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-white/15 rounded max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="label-mono text-[#00DC82]">RECORD WEIGH-IN</span>
              <button
                onClick={() => setShowWeightModal(false)}
                className="text-white/40 hover:text-white font-mono text-xs"
              >
                ESC
              </button>
            </div>
            <p className="text-xs font-mono text-white/60">
              Record your morning weigh-in after waking up for optimal consistency.
            </p>
            <form onSubmit={handleSaveWeight} className="space-y-4">
              <div>
                <label className="label-mono block mb-1">WEIGHT (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  placeholder={userProfile.weightKg.toString()}
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded text-white font-syne text-xl font-bold focus:border-[#00DC82] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWeightModal(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent text-xs"
                >
                  Save Weigh-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
