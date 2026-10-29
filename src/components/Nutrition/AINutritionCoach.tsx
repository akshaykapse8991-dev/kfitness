import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Salad,
  Flame,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Zap,
  Info,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { MealItem, UserProfile } from '../../types/fitness';

interface DietaryOptimization {
  title: string;
  category: string;
  foodSwap: string;
  macroImpact: string;
  rationale: string;
  suggestedFoods: string[];
}

interface NutritionCoachAnalysis {
  overallAssessment: string;
  adherenceScores: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  optimizations: DietaryOptimization[];
  motivationalTip: string;
}

interface AINutritionCoachProps {
  userProfile: UserProfile;
  todayMeals: MealItem[];
  onAddMealItem: (item: MealItem) => void;
}

export const AINutritionCoach: React.FC<AINutritionCoachProps> = ({
  userProfile,
  todayMeals,
  onAddMealItem,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<NutritionCoachAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedItemToast, setAddedItemToast] = useState<string | null>(null);

  // Aggregate past 7 days of meals from localStorage and current session
  const weeklyMeals = useMemo(() => {
    const list: MealItem[] = [...todayMeals];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kapse_daily_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.mealsLogged)) {
              parsed.mealsLogged.forEach((m: MealItem) => {
                if (!list.some((existing) => existing.id === m.id)) {
                  list.push(m);
                }
              });
            }
          }
        }
      }
    } catch {}
    return list;
  }, [todayMeals]);

  // Compute average daily stats
  const dailyAverage = useMemo(() => {
    if (weeklyMeals.length === 0) {
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        daysCount: 1,
      };
    }
    const totalCals = weeklyMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const totalProt = weeklyMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const totalCarbs = weeklyMeals.reduce((s, m) => s + (m.carbs || 0), 0);
    const totalFat = weeklyMeals.reduce((s, m) => s + (m.fat || 0), 0);

    // Approximate days from distinct dates
    const daysEstimate = Math.max(1, Math.min(7, Math.ceil(weeklyMeals.length / 4)));

    return {
      avgCalories: Math.round(totalCals / daysEstimate),
      avgProtein: Math.round((totalProt / daysEstimate) * 10) / 10,
      avgCarbs: Math.round((totalCarbs / daysEstimate) * 10) / 10,
      avgFat: Math.round((totalFat / daysEstimate) * 10) / 10,
      daysCount: daysEstimate,
    };
  }, [weeklyMeals]);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/ai/nutrition-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyMeals,
          dailyAverage,
          targetCalories: userProfile.targetCalories,
          targetProtein: userProfile.targetProtein,
          targetCarbs: userProfile.targetCarbs,
          targetFat: userProfile.targetFat,
          goal: userProfile.goal,
          dietaryPreference: userProfile.dietPreference || 'Balanced Indian',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to analyze nutrition logs.');
      }
      setAnalysisResult(data.data);
    } catch (err: any) {
      console.error('Nutrition Coach error:', err);
      setErrorMsg(err?.message || 'AI Nutrition Coach is temporarily unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAddFood = (foodName: string) => {
    const item: MealItem = {
      id: `coach-add-${Date.now()}`,
      foodId: 'coach_rec',
      name: foodName,
      portion: '1 Recommended Serving',
      grams: 150,
      calories: 180,
      protein: 15,
      carbs: 18,
      fat: 5,
      isVeg: true,
    };
    onAddMealItem(item);
    setAddedItemToast(foodName);
    setTimeout(() => setAddedItemToast(null), 3000);
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Personalized Dietetics
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Gemini 3.8 Flash
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            AI Nutrition Coach
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Analyzes your weekly meal logs against your {userProfile.targetCalories} kcal & {userProfile.targetProtein}g protein goals, recommending 3 high-impact dietary optimizations.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-auto"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Weekly Intake...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{analysisResult ? 'Re-Analyze Weekly Diet' : 'Analyze Weekly Diet & Optimizations'}</span>
            </>
          )}
        </button>
      </div>

      {/* Current Weekly Averages vs Target Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Daily Calories</span>
          <div className="text-xl font-black text-white">
            {dailyAverage.avgCalories}{' '}
            <span className="text-xs font-normal text-slate-400">/ {userProfile.targetCalories}</span>
          </div>
          <span className="text-[10px] text-slate-500">{weeklyMeals.length} logged items</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Daily Protein</span>
          <div className="text-xl font-black text-emerald-400">
            {dailyAverage.avgProtein}g{' '}
            <span className="text-xs font-normal text-slate-400">/ {userProfile.targetProtein}g</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {dailyAverage.avgProtein >= userProfile.targetProtein ? 'Target met' : `${Math.round(userProfile.targetProtein - dailyAverage.avgProtein)}g deficit`}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Daily Carbs</span>
          <div className="text-xl font-black text-amber-400">
            {dailyAverage.avgCarbs}g{' '}
            <span className="text-xs font-normal text-slate-400">/ {userProfile.targetCarbs}g</span>
          </div>
          <span className="text-[10px] text-slate-500">Glycogen replenishment</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Daily Fats</span>
          <div className="text-xl font-black text-cyan-400">
            {dailyAverage.avgFat}g{' '}
            <span className="text-xs font-normal text-slate-400">/ {userProfile.targetFat}g</span>
          </div>
          <span className="text-[10px] text-slate-500">Hormonal balance</span>
        </div>
      </div>

      {/* Added toast */}
      {addedItemToast && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Added "{addedItemToast}" directly to your daily nutrition log!</span>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Initial Call-to-Action if not yet analyzed */}
      {!analysisResult && !isAnalyzing && (
        <div className="p-8 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-3">
          <Salad className="w-12 h-12 text-emerald-400/60 mx-auto" />
          <div>
            <h4 className="text-base font-bold text-white">Unlock Your 3 Weekly Dietary Optimizations</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Our AI sports dietitian evaluates your cumulative protein intake, glycemic pacing, and micronutrient density to provide 3 tailored adjustments for your {userProfile.goal} goal.
            </p>
          </div>
          <button
            onClick={handleRunAnalysis}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 3 Dietary Optimizations</span>
          </button>
        </div>
      )}

      {/* AI Analysis Results Showcase */}
      {analysisResult && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Executive Assessment Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 border border-emerald-500/20 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Coach&apos;s Weekly Assessment
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium italic">
              &quot;{analysisResult.overallAssessment}&quot;
            </p>
          </div>

          {/* 3 Personalized Dietary Optimizations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-current" />
                3 Personalized Dietary Optimizations
              </h3>
              <span className="text-xs text-slate-400">Targeted for {userProfile.goal}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysisResult.optimizations.map((opt, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {opt.category}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                        #{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white">{opt.title}</h4>

                    {/* Food Swap Box */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1 text-xs">
                      <span className="text-[10px] font-bold uppercase text-amber-400 block">
                        Recommended Food Swap:
                      </span>
                      <p className="font-semibold text-slate-200">{opt.foodSwap}</p>
                    </div>

                    {/* Macro Impact Badge */}
                    <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                      {opt.macroImpact}
                    </div>

                    {/* Rationale */}
                    <p className="text-xs text-slate-400 leading-relaxed">{opt.rationale}</p>
                  </div>

                  {/* Suggested Foods to Quick Add */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Quick Add Foods:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {opt.suggestedFoods.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickAddFood(f)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{f}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Tip */}
          {analysisResult.motivationalTip && (
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span><strong>Nutrition Focus of the Week:</strong> {analysisResult.motivationalTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
