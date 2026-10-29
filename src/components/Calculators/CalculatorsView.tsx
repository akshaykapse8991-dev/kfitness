import React, { useState } from 'react';
import {
  Scale,
  Activity,
  PieChart,
  Percent,
  Trophy,
  Droplets,
  HeartPulse,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  Dna,
} from 'lucide-react';
import { BiologicalAgeCalculator } from './BiologicalAgeCalculator';
import { ActivityLevel, FitnessGoal, Gender, UserProfile } from '../../types/fitness';
import {
  calculateBMI,
  calculateIdealWeightHamwi,
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
  calculateBodyFatNavy,
  calculate1RM,
  calculateDailyWater,
  calculateHeartRateZones,
  ACTIVITY_LABELS,
  GOAL_LABELS,
} from '../../utils/calculators';

interface CalculatorsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

type CalcTab =
  | 'macros'
  | 'bmi'
  | 'bmr_tdee'
  | 'body_fat'
  | 'one_rm'
  | 'water'
  | 'heart_zones'
  | 'biological_age';

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({
  userProfile,
  onUpdateProfile,
}) => {
  const [activeCalcTab, setActiveCalcTab] = useState<CalcTab>('macros');
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  // Form state initialized from profile
  const [gender, setGender] = useState<Gender>(userProfile.gender);
  const [age, setAge] = useState<number>(userProfile.age);
  const [heightCm, setHeightCm] = useState<number>(userProfile.heightCm);
  const [weightKg, setWeightKg] = useState<number>(userProfile.weightKg);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(userProfile.activityLevel);
  const [goal, setGoal] = useState<FitnessGoal>(userProfile.goal);

  // Body Fat inputs
  const [neckCm, setNeckCm] = useState<number>(userProfile.neckCm || 38);
  const [waistCm, setWaistCm] = useState<number>(userProfile.waistCm || 85);
  const [hipCm, setHipCm] = useState<number>(userProfile.hipCm || 95);

  // 1RM inputs
  const [liftWeight, setLiftWeight] = useState<number>(70);
  const [liftReps, setLiftReps] = useState<number>(5);

  // Water inputs
  const [exerciseMins, setExerciseMins] = useState<number>(45);
  const [climate, setClimate] = useState<'normal' | 'hot'>('hot');

  // Heart Rate inputs
  const [restingHR, setRestingHR] = useState<number>(70);

  // Dynamic calculations
  const bmiResult = calculateBMI(weightKg, heightCm);
  const idealWeight = calculateIdealWeightHamwi(heightCm, gender);
  const bmrResult = calculateBMR(weightKg, heightCm, age, gender);
  const tdeeResult = calculateTDEE(bmrResult, activityLevel);
  const macroResults = calculateMacroTargets(tdeeResult, goal, weightKg);
  const bodyFatResult = calculateBodyFatNavy(gender, heightCm, neckCm, waistCm, hipCm, weightKg);
  const oneRmResult = calculate1RM(liftWeight, liftReps);
  const waterResult = calculateDailyWater(weightKg, exerciseMins, climate);
  const heartRateResult = calculateHeartRateZones(age, restingHR);

  const handleApplyToProfile = () => {
    onUpdateProfile({
      gender,
      age,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      targetCalories: macroResults.targetCalories,
      targetProtein: macroResults.protein,
      targetCarbs: macroResults.carbs,
      targetFat: macroResults.fat,
      waterGoalLiters: waterResult.liters,
      neckCm,
      waistCm,
      hipCm,
    });
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 3000);
  };

  const calcTabs: { id: CalcTab; name: string; icon: React.ReactNode }[] = [
    { id: 'macros', name: 'Calorie & Macros Planner', icon: <PieChart className="w-4 h-4 text-emerald-400" /> },
    { id: 'bmi', name: 'BMI & Ideal Weight', icon: <Scale className="w-4 h-4 text-teal-400" /> },
    { id: 'bmr_tdee', name: 'BMR & TDEE Daily Energy', icon: <Activity className="w-4 h-4 text-amber-400" /> },
    { id: 'body_fat', name: 'US Navy Body Fat %', icon: <Percent className="w-4 h-4 text-indigo-400" /> },
    { id: 'one_rm', name: '1-Rep Max (1RM) Estimator', icon: <Trophy className="w-4 h-4 text-orange-400" /> },
    { id: 'water', name: 'Daily Water Target', icon: <Droplets className="w-4 h-4 text-cyan-400" /> },
    { id: 'heart_zones', name: 'Heart Rate Training Zones', icon: <HeartPulse className="w-4 h-4 text-rose-400" /> },
    { id: 'biological_age', name: 'Biological Age & Fitness Age', icon: <Dna className="w-4 h-4 text-purple-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Apply */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Scientific Health Engines
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            All Fitness Calculators & Goal Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Calculate your precise biological metrics using peer-reviewed formulas (Mifflin-St Jeor, Hamwi, US Navy, Epley, Karvonen) and synchronize them directly into your diet and workouts.
          </p>
        </div>

        <button
          onClick={handleApplyToProfile}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Apply to My Active Plan</span>
        </button>
      </div>

      {showAppliedToast && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold">
            Success! Your active targets have been updated across the Diet Planner, Nutrition Log, and Daily Dashboard.
          </p>
        </div>
      )}

      {/* Main Grid: Calculator Tabs & Input Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculator Sub-tabs (3 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              Select Calculator
            </p>
            {calcTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCalcTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeCalcTab === tab.id
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <span>{tab.name}</span>
                </div>
                {activeCalcTab === tab.id && <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            ))}
          </div>

          {/* Core Body Stats Quick Controls */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Base Body Metrics</span>
            </h3>

            {/* Gender Toggle */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    gender === 'male'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    gender === 'female'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Age (Years)</label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Math.max(12, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="30"
                  max="250"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Math.max(30, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Height</span>
                <span className="font-semibold text-slate-200">
                  {heightCm} cm ({Math.floor(heightCm / 30.48)}&apos;{Math.round((heightCm % 30.48) / 2.54)}&quot;)
                </span>
              </div>
              <input
                type="range"
                min="120"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              >
                {Object.entries(ACTIVITY_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label} - {val.desc.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Calculator Specific View (8 cols) */}
        <div className="lg:col-span-8">
          {/* TAB 1: CALORIE & MACRO TARGETS */}
          {activeCalcTab === 'macros' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Daily Calorie & Macro Target Splitter</h2>
                  <p className="text-xs text-slate-400">
                    Scientifically calculated protein, carbohydrates, and healthy fats tailored to your goal.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  TDEE: {tdeeResult} kcal
                </div>
              </div>

              {/* Goal Selector Chips */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Select Your Fitness Goal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((goalKey) => {
                    const g = GOAL_LABELS[goalKey];
                    const isSelected = goal === goalKey;
                    return (
                      <button
                        key={goalKey}
                        onClick={() => setGoal(goalKey)}
                        className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm text-slate-100 flex items-center justify-between">
                          <span>{g.label.split('(')[0]}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{g.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Macro Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <span className="text-xs text-slate-400 font-medium">Daily Target</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {macroResults.targetCalories}
                    <span className="text-xs font-normal text-slate-400 ml-1">kcal</span>
                  </div>
                  <span className="text-[11px] text-emerald-400">
                    {GOAL_LABELS[goal].calorieDeltaPct >= 0 ? '+' : ''}
                    {Math.round(GOAL_LABELS[goal].calorieDeltaPct * 100)}% of TDEE
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <span className="text-xs text-emerald-400 font-medium">Protein</span>
                  <div className="text-2xl font-black text-emerald-300 mt-1">
                    {macroResults.protein}
                    <span className="text-xs font-normal text-slate-400 ml-1">g</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {Math.round((macroResults.protein / weightKg) * 10) / 10}g/kg ({macroResults.proteinPct}%)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <span className="text-xs text-amber-400 font-medium">Carbohydrates</span>
                  <div className="text-2xl font-black text-amber-300 mt-1">
                    {macroResults.carbs}
                    <span className="text-xs font-normal text-slate-400 ml-1">g</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{macroResults.carbsPct}% energy fuel</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <span className="text-xs text-rose-400 font-medium">Healthy Fats</span>
                  <div className="text-2xl font-black text-rose-300 mt-1">
                    {macroResults.fat}
                    <span className="text-xs font-normal text-slate-400 ml-1">g</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{macroResults.fatPct}% hormone balance</span>
                </div>
              </div>

              {/* Macro Proportion Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Macronutrient Ratio</span>
                  <span className="text-slate-300 font-medium">
                    Fiber Recommendation: {macroResults.fiber}g/day
                  </span>
                </div>
                <div className="h-4 rounded-full overflow-hidden flex bg-slate-800">
                  <div
                    style={{ width: `${macroResults.proteinPct}%` }}
                    className="bg-emerald-500 transition-all flex items-center justify-center text-[10px] text-slate-950 font-bold"
                  >
                    {macroResults.proteinPct}%
                  </div>
                  <div
                    style={{ width: `${macroResults.carbsPct}%` }}
                    className="bg-amber-500 transition-all flex items-center justify-center text-[10px] text-slate-950 font-bold"
                  >
                    {macroResults.carbsPct}%
                  </div>
                  <div
                    style={{ width: `${macroResults.fatPct}%` }}
                    className="bg-rose-500 transition-all flex items-center justify-center text-[10px] text-slate-950 font-bold"
                  >
                    {macroResults.fatPct}%
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Protein (4 kcal/g)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Carbs (4 kcal/g)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Fats (9 kcal/g)
                  </span>
                </div>
              </div>

              {/* Indian Food Translation Tip */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300">Indian Meal Target: </span>
                  To hit {macroResults.protein}g protein, aim for 25-30g protein per meal: e.g. 50g soya chunks (26g protein) or 100g low-fat paneer (25g protein) or 4 egg whites + 1 whole egg (20g protein) or 100g chicken breast (31g protein).
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BMI & IDEAL WEIGHT */}
          {activeCalcTab === 'bmi' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Body Mass Index (BMI) & Ideal Body Weight</h2>
                <p className="text-xs text-slate-400">
                  Assesses body mass proportionality according to World Health Organization standards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Your Current BMI</span>
                    <div className="text-4xl font-black text-white mt-2">
                      {bmiResult.bmi}
                    </div>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${bmiResult.badgeBg}`}>
                        {bmiResult.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    Healthy BMI range is between 18.5 and 24.9.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Ideal Body Weight (Hamwi Standard)</span>
                    <div className="text-4xl font-black text-emerald-400 mt-2">
                      {idealWeight}
                      <span className="text-sm font-normal text-slate-400 ml-1">kg</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 font-medium">
                      Healthy Weight Range: <span className="text-emerald-300">{bmiResult.healthyRange}</span>
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 mt-4">
                    Difference from ideal: {Math.round(Math.abs(weightKg - idealWeight) * 10) / 10} kg {weightKg > idealWeight ? 'above' : 'below'}.
                  </div>
                </div>
              </div>

              {/* BMI Scale Visualizer */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-medium">BMI Category Scale</div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-slate-900">
                  <div className="bg-amber-400 py-1.5 rounded-l-md">Under (&lt;18.5)</div>
                  <div className="bg-emerald-400 py-1.5">Normal (18.5-24.9)</div>
                  <div className="bg-amber-500 py-1.5">Over (25-29.9)</div>
                  <div className="bg-rose-500 py-1.5 rounded-r-md">Obese (&ge;30)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BMR & TDEE */}
          {activeCalcTab === 'bmr_tdee' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">BMR & Total Daily Energy Expenditure (TDEE)</h2>
                <p className="text-xs text-slate-400">
                  Mifflin-St Jeor formula calculating your exact resting energy vs active expenditure.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700">
                  <span className="text-xs text-slate-400 font-medium">Basal Metabolic Rate (BMR)</span>
                  <div className="text-3xl font-black text-amber-400 mt-2">
                    {bmrResult} <span className="text-sm font-normal text-slate-400">kcal/day</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Calories your body burns at complete bed rest to keep vital organs (brain, heart, lungs) functioning.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700">
                  <span className="text-xs text-slate-400 font-medium">Maintenance Calories (TDEE)</span>
                  <div className="text-3xl font-black text-emerald-400 mt-2">
                    {tdeeResult} <span className="text-sm font-normal text-slate-400">kcal/day</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Total calories burned factoring in your daily activity ({ACTIVITY_LABELS[activityLevel].label}).
                  </p>
                </div>
              </div>

              {/* Activity breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-slate-400">Activity Level Comparison</p>
                <div className="space-y-1.5">
                  {Object.entries(ACTIVITY_LABELS).map(([lvlKey, lvlData]) => {
                    const cals = calculateTDEE(bmrResult, lvlKey as ActivityLevel);
                    const isCurrent = activityLevel === lvlKey;
                    return (
                      <div
                        key={lvlKey}
                        className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                          isCurrent
                            ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-slate-800/40 text-slate-400'
                        }`}
                      >
                        <span>{lvlData.label}</span>
                        <span>{cals} kcal/day</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: US NAVY BODY FAT % */}
          {activeCalcTab === 'body_fat' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">US Navy Body Fat % & Lean Mass Estimator</h2>
                <p className="text-xs text-slate-400">
                  Circumference-based formula used by the United States Armed Forces to measure body composition.
                </p>
              </div>

              {/* Tape measurements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Neck Circumference (cm)</label>
                  <input
                    type="number"
                    value={neckCm}
                    onChange={(e) => setNeckCm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Measure just below Adam&apos;s apple</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Waist Circumference (cm)</label>
                  <input
                    type="number"
                    value={waistCm}
                    onChange={(e) => setWaistCm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Measure horizontally across navel</span>
                </div>

                {gender === 'female' && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Hip Circumference (cm)</label>
                    <input
                      type="number"
                      value={hipCm}
                      onChange={(e) => setHipCm(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Measure widest part of buttocks</span>
                  </div>
                )}
              </div>

              {bodyFatResult ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
                    <span className="text-xs text-slate-400">Body Fat Percentage</span>
                    <div className="text-3xl font-black text-indigo-400 mt-1">
                      {bodyFatResult.bodyFatPct}%
                    </div>
                    <span className="text-xs text-indigo-300 font-bold">{bodyFatResult.category}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
                    <span className="text-xs text-slate-400">Lean Body Mass</span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">
                      {bodyFatResult.leanMassKg} <span className="text-sm font-normal text-slate-400">kg</span>
                    </div>
                    <span className="text-xs text-slate-400">Metabolic muscle, bone, water</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
                    <span className="text-xs text-slate-400">Fat Mass</span>
                    <div className="text-3xl font-black text-rose-400 mt-1">
                      {bodyFatResult.fatMassKg} <span className="text-sm font-normal text-slate-400">kg</span>
                    </div>
                    <span className="text-xs text-slate-400">Subcutaneous & visceral fat</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-300 text-xs">
                  Please ensure Waist measurement is larger than Neck measurement for calculation.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: 1-REP MAX (1RM) */}
          {activeCalcTab === 'one_rm' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">1-Rep Max (1RM) Strength Estimator</h2>
                <p className="text-xs text-slate-400">
                  Calculates your absolute one-rep maximum lift for Bench Press, Squat, or Deadlift using Epley and Brzycki equations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Weight Lifted (kg)</label>
                  <input
                    type="number"
                    value={liftWeight}
                    onChange={(e) => setLiftWeight(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Reps Performed (1 - 15)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={liftReps}
                    onChange={(e) => setLiftReps(Math.min(15, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-800/80 to-slate-800 border border-orange-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    Estimated 1-Rep Max (1RM)
                  </span>
                  <div className="text-4xl font-black text-white mt-1">
                    {oneRmResult.oneRepMax} <span className="text-base font-normal text-slate-400">kg</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Based on lifting {liftWeight}kg for {liftReps} reps
                  </p>
                </div>
                <Trophy className="w-12 h-12 text-orange-400/80" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Working Reps Training Table
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {oneRmResult.percentages.map((p) => (
                    <div key={p.pct} className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>{p.pct}%</span>
                        <span className="text-emerald-400">{p.weight} kg</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{p.repsText}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WATER INTAKE */}
          {activeCalcTab === 'water' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Daily Water Intake Calculator</h2>
                <p className="text-xs text-slate-400">
                  Calibrated for body weight, daily exercise duration, and climate temperature.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Exercise Duration (Minutes/Day)</label>
                  <input
                    type="number"
                    value={exerciseMins}
                    onChange={(e) => setExerciseMins(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Climate Environment</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClimate('normal')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        climate === 'normal'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400'
                      }`}
                    >
                      Moderate / AC
                    </button>
                    <button
                      type="button"
                      onClick={() => setClimate('hot')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        climate === 'hot'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400'
                      }`}
                    >
                      Warm / Indian Climate
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-800/80 to-slate-800 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Recommended Daily Target
                  </span>
                  <div className="text-4xl font-black text-white mt-1">
                    {waterResult.liters} <span className="text-base font-normal text-slate-400">Liters</span>
                  </div>
                  <p className="text-xs text-cyan-300 font-semibold mt-1">
                    Approx. {waterResult.glasses} standard glasses (250ml each)
                  </p>
                </div>
                <Droplets className="w-12 h-12 text-cyan-400/80" />
              </div>
            </div>
          )}

          {/* TAB 7: HEART RATE ZONES */}
          {activeCalcTab === 'heart_zones' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Target Heart Rate Training Zones (Karvonen)</h2>
                <p className="text-xs text-slate-400">
                  Target cardiovascular intensities for fat oxidation, aerobic stamina, and HIIT intervals.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Resting Heart Rate (BPM)</label>
                  <input
                    type="number"
                    min="40"
                    max="110"
                    value={restingHR}
                    onChange={(e) => setRestingHR(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Measure upon waking in bed (avg 60-75)</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex flex-col justify-center">
                  <span className="text-xs text-slate-400">Estimated Max Heart Rate</span>
                  <span className="text-2xl font-black text-rose-400 mt-0.5">
                    {heartRateResult.maxHR} <span className="text-xs text-slate-400">BPM</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {heartRateResult.zones.map((zone, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-200">{zone.name}</div>
                      <p className="text-xs text-slate-400 mt-0.5">{zone.benefit}</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-emerald-400 self-start sm:self-auto shrink-0">
                      {zone.range}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: BIOLOGICAL AGE & LONGEVITY ENGINE */}
          {activeCalcTab === 'biological_age' && (
            <BiologicalAgeCalculator
              initialAge={age}
              initialGender={gender}
              initialHeightCm={heightCm}
              initialWeightKg={weightKg}
              initialRestingHR={restingHR}
              initialWaistCm={waistCm}
            />
          )}
        </div>
      </div>
    </div>
  );
};
