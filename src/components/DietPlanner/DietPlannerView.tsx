import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  ShoppingBag,
  Clock,
  Flame,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  Loader2,
  Salad,
  Info,
} from 'lucide-react';
import { DayDietPlan, FitnessGoal, MealItem, UserProfile } from '../../types/fitness';
import { calculatePlanTotals, getDefaultDietPlan } from '../../utils/dietPlanner';
import { GOAL_LABELS } from '../../utils/calculators';

interface DietPlannerViewProps {
  userProfile: UserProfile;
  onAddMealToDiary: (item: MealItem) => void;
}

export const DietPlannerView: React.FC<DietPlannerViewProps> = ({
  userProfile,
  onAddMealToDiary,
}) => {
  const [goal, setGoal] = useState<FitnessGoal>(userProfile.goal);
  const [preference, setPreference] = useState<'all' | 'veg' | 'non_veg'>(userProfile.dietPreference);
  const [targetCalories, setTargetCalories] = useState<number>(userProfile.targetCalories);
  const [budget, setBudget] = useState<'budget' | 'moderate' | 'flexible'>('budget');
  const [lifestyle, setLifestyle] = useState('Home & Gym Training, Indian Home Cooking');

  const [currentPlan, setCurrentPlan] = useState<DayDietPlan>(() =>
    getDefaultDietPlan(userProfile.goal, userProfile.dietPreference, userProfile.targetCalories)
  );

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [checkedGroceries, setCheckedGroceries] = useState<{ [key: string]: boolean }>({});
  const [copiedGroceryToast, setCopiedGroceryToast] = useState(false);
  const [loggedMealToast, setLoggedMealToast] = useState(false);

  const planTotals = calculatePlanTotals(currentPlan);

  const handleRegeneratePreset = (
    newGoal: FitnessGoal = goal,
    newPref: 'all' | 'veg' | 'non_veg' = preference,
    newCals: number = targetCalories
  ) => {
    const updated = getDefaultDietPlan(newGoal, newPref, newCals);
    setCurrentPlan(updated);
    setAiError(null);
  };

  const handleGenerateAIPlan = async () => {
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const response = await fetch('/api/generate-diet-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: GOAL_LABELS[goal].label,
          targetCalories,
          targetProtein: userProfile.targetProtein,
          preference: preference === 'veg' ? 'Vegetarian (No Eggs)' : preference === 'non_veg' ? 'Non-Vegetarian (Chicken, Fish, Eggs)' : 'Eggetarian (Veg + Eggs)',
          lifestyle: `${lifestyle}, Budget: ${budget}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI diet planner service');
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        const raw = resData.data;
        // Transform into DayDietPlan
        const transformed: DayDietPlan = {
          title: raw.planTitle || `Custom ${GOAL_LABELS[goal].label} Indian Plan`,
          goal,
          preference,
          targetCalories,
          hydrationTips: raw.hydrationAdvice || 'Drink 3.5 Liters of water daily.',
          guidelines: raw.keyGuidelines || [],
          groceryList: raw.groceryList || [],
          meals: (raw.meals || []).map((m: any, idx: number) => ({
            id: `ai-meal-${idx}` as any,
            name: m.mealName || m.timeSlot,
            timeHint: m.timeSlot || 'Scheduled',
            tips: m.cookingOrHealthTip || '',
            items: (m.items || []).map((item: any, itemIdx: number) => ({
              id: `ai-item-${idx}-${itemIdx}`,
              name: item.name,
              portion: item.portion || '1 serving',
              grams: 100,
              calories: Number(item.calories) || 100,
              protein: Number(item.protein) || 5,
              carbs: Number(item.carbs) || 15,
              fat: Number(item.fat) || 2,
              fiber: 2,
              isVeg: item.isVeg !== undefined ? item.isVeg : true,
            })),
          })),
        };
        setCurrentPlan(transformed);
      }
    } catch (err: any) {
      console.error(err);
      setAiError('Could not connect to Gemini AI model. Reverted to high-protein verified Indian preset.');
      handleRegeneratePreset();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleLogWholeMealSlot = (items: MealItem[]) => {
    items.forEach((item) => {
      onAddMealToDiary(item);
    });
    setLoggedMealToast(true);
    setTimeout(() => setLoggedMealToast(false), 3000);
  };

  const toggleGroceryCheck = (item: string) => {
    setCheckedGroceries((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleCopyGroceryList = () => {
    const text = currentPlan.groceryList.map((g) => `- ${g}`).join('\n');
    navigator.clipboard.writeText(`Kapse Fitness - Weekly Grocery List\n\n${text}`);
    setCopiedGroceryToast(true);
    setTimeout(() => setCopiedGroceryToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Configuration */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Indian Nutrition Architecture
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Personalized Full-Day Indian Diet Planner
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Structured meal timings, exact portion measurements in katoris/grams, macro breakdowns, and weekly grocery lists.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowGroceryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Weekly Grocery List</span>
            </button>

            <button
              onClick={handleGenerateAIPlan}
              disabled={isGeneratingAI}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Regenerate with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters & Customization Toolbar */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Goal Selector */}
          <div>
            <label className="text-slate-400 block mb-1 font-bold uppercase tracking-wider">Fitness Goal</label>
            <select
              value={goal}
              onChange={(e) => {
                const g = e.target.value as FitnessGoal;
                setGoal(g);
                handleRegeneratePreset(g, preference, targetCalories);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
            >
              {Object.entries(GOAL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Diet Preference */}
          <div>
            <label className="text-slate-400 block mb-1 font-bold uppercase tracking-wider">Dietary Type</label>
            <select
              value={preference}
              onChange={(e) => {
                const p = e.target.value as any;
                setPreference(p);
                handleRegeneratePreset(goal, p, targetCalories);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
            >
              <option value="veg">🌱 Pure Vegetarian (No Eggs)</option>
              <option value="all">🥚 Eggetarian (Veg + Eggs)</option>
              <option value="non_veg">🍗 Non-Vegetarian (Chicken/Fish)</option>
            </select>
          </div>

          {/* Calorie Target */}
          <div>
            <label className="text-slate-400 block mb-1 font-bold uppercase tracking-wider">Daily Calorie Target</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="50"
                value={targetCalories}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetCalories(val);
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-bold focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={() => handleRegeneratePreset(goal, preference, targetCalories)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 font-bold cursor-pointer"
                title="Apply calories"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Food Budget */}
          <div>
            <label className="text-slate-400 block mb-1 font-bold uppercase tracking-wider">Food Budget</label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
            >
              <option value="budget">₹ Budget-Friendly (Dals, Soya, Eggs, Seasonal)</option>
              <option value="moderate">₹₹ Moderate (Paneer, Chicken, Curd)</option>
              <option value="flexible">₹₹₹ Flexible (Fish Tikka, Mutton, Whey)</option>
            </select>
          </div>
        </div>

        {aiError && (
          <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl text-amber-300 text-xs">
            {aiError}
          </div>
        )}
      </div>

      {loggedMealToast && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold">
            All items from this meal logged directly to your daily diary!
          </p>
        </div>
      )}

      {/* Plan Summary Macro Bar */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Full-Day Nutritional Totals
            </span>
            <h2 className="text-xl font-black text-white mt-0.5">{currentPlan.title}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold block">Calories</span>
              <span className="text-base font-black text-white">
                {planTotals.calories} <span className="text-[10px] font-normal text-slate-400">kcal</span>
              </span>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-emerald-400 font-bold block">Protein</span>
              <span className="text-base font-black text-emerald-300">{planTotals.protein}g</span>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-amber-400 font-bold block">Carbs</span>
              <span className="text-base font-black text-amber-300">{planTotals.carbs}g</span>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-rose-400 font-bold block">Fats</span>
              <span className="text-base font-black text-rose-300">{planTotals.fat}g</span>
            </div>
          </div>
        </div>

        {/* Hydration & Guidelines Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row gap-3 text-xs text-slate-300">
          <div className="flex-1 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <span className="font-bold text-cyan-400 block mb-0.5">Hydration Protocol:</span>
            <span>{currentPlan.hydrationTips}</span>
          </div>
          <div className="flex-1 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <span className="font-bold text-emerald-400 block mb-0.5">Nutritional Golden Rules:</span>
            <span>{currentPlan.guidelines[0] || 'Minimize refined oils, prioritize whole foods.'}</span>
          </div>
        </div>
      </div>

      {/* Day Schedule Meal Cards */}
      <div className="space-y-4">
        {currentPlan.meals.map((meal) => {
          const mealCals = meal.items.reduce((s, i) => s + i.calories, 0);
          const mealProt = meal.items.reduce((s, i) => s + i.protein, 0);

          return (
            <div
              key={meal.id}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3"
            >
              {/* Meal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{meal.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{meal.timeHint}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="text-right text-xs">
                    <span className="font-black text-slate-100">{mealCals} kcal</span>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="font-bold text-emerald-400">{Math.round(mealProt * 10) / 10}g P</span>
                  </div>

                  <button
                    onClick={() => handleLogWholeMealSlot(meal.items)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Meal</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {meal.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                          item.isVeg ? 'border-emerald-500 bg-slate-900' : 'border-rose-500 bg-slate-900'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 block truncate">{item.name}</span>
                        <span className="text-[11px] text-slate-400">{item.portion}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-200 block">{item.calories} kcal</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{item.protein}g P</span>
                    </div>
                  </div>
                ))}
              </div>

              {meal.tips && (
                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 italic">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Tip: {meal.tips}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grocery List Modal */}
      {showGroceryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Ration & Kitchen Prep
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Weekly Grocery Checklist</h3>
                <p className="text-xs text-slate-400">Everything needed to cook this Indian diet plan at home.</p>
              </div>
              <button
                onClick={() => setShowGroceryModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Checklist */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 no-scrollbar">
              {currentPlan.groceryList.map((item, idx) => {
                const isChecked = !!checkedGroceries[item];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleGroceryCheck(item)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-slate-800/30 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-800/70 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{item}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {Object.values(checkedGroceries).filter(Boolean).length} / {currentPlan.groceryList.length} checked
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyGroceryList}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedGroceryToast ? 'Copied!' : 'Copy List'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGroceryModal(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
