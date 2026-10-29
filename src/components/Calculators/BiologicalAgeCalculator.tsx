import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  Scale,
  Moon,
  Wind,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Award,
  Zap,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowRight,
  Info,
  RefreshCw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Gender } from '../../types/fitness';

interface BiologicalAgeCalculatorProps {
  initialAge: number;
  initialGender: Gender;
  initialHeightCm: number;
  initialWeightKg: number;
  initialRestingHR?: number;
  initialWaistCm?: number;
}

interface LongevityIntervention {
  category: string;
  action: string;
  projectedReversalYears: number;
}

interface AIAnalysisData {
  longevityGrade: string;
  longevityScore: number;
  topStrengths: string[];
  criticalRisks: string[];
  interventions: LongevityIntervention[];
  expertVerdict: string;
}

export const BiologicalAgeCalculator: React.FC<BiologicalAgeCalculatorProps> = ({
  initialAge,
  initialGender,
  initialHeightCm,
  initialWeightKg,
  initialRestingHR = 68,
  initialWaistCm = 82,
}) => {
  // Inputs
  const [chronologicalAge, setChronologicalAge] = useState<number>(initialAge || 30);
  const [gender, setGender] = useState<Gender>(initialGender || 'male');
  const [heightCm, setHeightCm] = useState<number>(initialHeightCm || 175);
  const [weightKg, setWeightKg] = useState<number>(initialWeightKg || 72);
  const [waistCm, setWaistCm] = useState<number>(initialWaistCm || 82);
  const [restingHR, setRestingHR] = useState<number>(initialRestingHR || 64);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepConsistency, setSleepConsistency] = useState<number>(85); // 0 - 100%
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<number>(4);

  // VO2 Max input: either manual or auto-estimated via NTNU formula
  const [vo2InputMode, setVo2InputMode] = useState<'auto' | 'manual'>('auto');
  const [manualVo2Max, setManualVo2Max] = useState<number>(42);

  // AI assessment state
  const [aiData, setAiData] = useState<AIAnalysisData | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Current calculated BMI
  const bmi = useMemo(() => {
    const h = heightCm / 100;
    if (h <= 0) return 22;
    return Math.round((weightKg / (h * h)) * 10) / 10;
  }, [heightCm, weightKg]);

  // Estimated VO2 Max (NTNU Non-Exercise Fitness Index equation)
  const autoVo2Max = useMemo(() => {
    // Activity index based on weekly workouts
    const activityIndex = weeklyWorkouts >= 5 ? 3.5 : weeklyWorkouts >= 3 ? 2.5 : 1.0;
    if (gender === 'female') {
      const v = 100.413 - 0.38 * chronologicalAge - 0.213 * waistCm - 0.103 * restingHR + activityIndex * 1.8;
      return Math.round(Math.max(18, Math.min(65, v)) * 10) / 10;
    } else {
      const v = 108.844 - 0.356 * chronologicalAge - 0.222 * waistCm - 0.199 * restingHR + activityIndex * 2.0;
      return Math.round(Math.max(20, Math.min(75, v)) * 10) / 10;
    }
  }, [gender, chronologicalAge, waistCm, restingHR, weeklyWorkouts]);

  const activeVo2Max = vo2InputMode === 'manual' ? manualVo2Max : autoVo2Max;

  // Expected normative VO2 Max for chronological age & gender
  const expectedNormativeVo2 = useMemo(() => {
    if (gender === 'female') {
      if (chronologicalAge < 30) return 38;
      if (chronologicalAge < 40) return 35;
      if (chronologicalAge < 50) return 32;
      if (chronologicalAge < 60) return 28;
      return 24;
    } else {
      if (chronologicalAge < 30) return 46;
      if (chronologicalAge < 40) return 42;
      if (chronologicalAge < 50) return 38;
      if (chronologicalAge < 60) return 34;
      return 30;
    }
  }, [gender, chronologicalAge]);

  // Biological Age Calculations (NTNU & Levine PhenoAge Biomarker Model)
  const { biologicalAge, ageDelta, breakdown } = useMemo(() => {
    // 1. BMI Delta
    let bmiDelta = 0;
    let bmiStatus = 'Optimal';
    if (bmi >= 18.5 && bmi <= 23.5) {
      bmiDelta = -1.8;
      bmiStatus = 'Optimal Lean Mass (-1.8 yrs)';
    } else if (bmi > 23.5 && bmi <= 24.9) {
      bmiDelta = -0.5;
      bmiStatus = 'Normal Weight (-0.5 yrs)';
    } else if (bmi >= 25 && bmi <= 27.5) {
      bmiDelta = 1.0;
      bmiStatus = 'Mild Overweight (+1.0 yrs)';
    } else if (bmi > 27.5 && bmi <= 29.9) {
      bmiDelta = 2.4;
      bmiStatus = 'Moderate Overweight (+2.4 yrs)';
    } else if (bmi >= 30) {
      bmiDelta = 4.5;
      bmiStatus = 'Obesity Marker (+4.5 yrs)';
    } else {
      bmiDelta = 1.2;
      bmiStatus = 'Underweight (+1.2 yrs)';
    }

    // 2. Resting Heart Rate Delta (Vagal Tone & Stroke Volume)
    let rhrDelta = 0;
    let rhrStatus = 'Normal';
    if (restingHR < 52) {
      rhrDelta = -3.2;
      rhrStatus = 'Athletic Bradycardia (-3.2 yrs)';
    } else if (restingHR <= 60) {
      rhrDelta = -2.0;
      rhrStatus = 'Excellent Vagal Tone (-2.0 yrs)';
    } else if (restingHR <= 68) {
      rhrDelta = -0.8;
      rhrStatus = 'Good Cardiovascular Tone (-0.8 yrs)';
    } else if (restingHR <= 76) {
      rhrDelta = 0.5;
      rhrStatus = 'Average RHR (+0.5 yrs)';
    } else if (restingHR <= 84) {
      rhrDelta = 2.2;
      rhrStatus = 'Elevated Sympathetic Drive (+2.2 yrs)';
    } else {
      rhrDelta = 4.2;
      rhrStatus = 'High Resting Rate (+4.2 yrs)';
    }

    // 3. Sleep Delta (Circadian regularity & restorative duration)
    let sleepDelta = 0;
    let sleepStatus = 'Good';
    if (sleepConsistency >= 80 && sleepHours >= 7 && sleepHours <= 8.5) {
      sleepDelta = -2.5;
      sleepStatus = 'High Regularity & Cellular Repair (-2.5 yrs)';
    } else if (sleepConsistency >= 65 && sleepHours >= 6.5) {
      sleepDelta = -0.5;
      sleepStatus = 'Sufficient Sleep Buffer (-0.5 yrs)';
    } else if (sleepHours < 6) {
      sleepDelta = 3.2;
      sleepStatus = 'Chronic Sleep Deficit (+3.2 yrs)';
    } else if (sleepConsistency < 60) {
      sleepDelta = 1.8;
      sleepStatus = 'Circadian Misalignment (+1.8 yrs)';
    } else {
      sleepDelta = 0.8;
      sleepStatus = 'Sub-optimal Sleep Hygiene (+0.8 yrs)';
    }

    // 4. VO2 Max Delta (Cardiorespiratory fitness)
    const vo2Diff = activeVo2Max - expectedNormativeVo2;
    // Each 1 ml/kg/min above or below normative is ~0.45 biological years
    const vo2Delta = Math.max(-6.0, Math.min(6.0, -1 * vo2Diff * 0.45));
    let vo2Status = 'Average';
    if (vo2Diff >= 8) vo2Status = 'Superior Aerobic Engine (-4.0 to -6.0 yrs)';
    else if (vo2Diff >= 3) vo2Status = 'Above Average VO2 Max (-1.5 to -3.5 yrs)';
    else if (vo2Diff >= -2) vo2Status = 'On Target for Chronological Age';
    else vo2Status = 'Cardiorespiratory Deconditioning (+2.0 to +5.0 yrs)';

    // Total Composite Fitness Age
    const rawBioAge = chronologicalAge + bmiDelta + rhrDelta + sleepDelta + vo2Delta;
    const finalBioAge = Math.max(18, Math.round(rawBioAge * 10) / 10);
    const diff = Math.round((finalBioAge - chronologicalAge) * 10) / 10;

    return {
      biologicalAge: finalBioAge,
      ageDelta: diff,
      breakdown: {
        bmi: { delta: bmiDelta, status: bmiStatus },
        rhr: { delta: rhrDelta, status: rhrStatus },
        sleep: { delta: sleepDelta, status: sleepStatus },
        vo2: { delta: Math.round(vo2Delta * 10) / 10, status: vo2Status },
      },
    };
  }, [chronologicalAge, bmi, restingHR, sleepHours, sleepConsistency, activeVo2Max, expectedNormativeVo2]);

  // Overall Longevity Score (0-100)
  const baseLongevityScore = useMemo(() => {
    let score = 75;
    if (ageDelta < 0) {
      // Younger than actual age
      score = Math.min(99, Math.round(75 + Math.abs(ageDelta) * 3.5));
    } else {
      score = Math.max(40, Math.round(75 - ageDelta * 4));
    }
    return score;
  }, [ageDelta]);

  // Run AI Longevity Consultation
  const handleRunAiLongevity = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/biological-age-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chronologicalAge,
          biologicalAge,
          bmi,
          restingHeartRate: restingHR,
          sleepHours,
          sleepConsistency,
          vo2Max: activeVo2Max,
          gender,
          weeklyWorkouts,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to complete AI longevity assessment.');
      }
      setAiData(data.data);
    } catch (err: any) {
      console.error('Longevity API error:', err);
      setAiError(err?.message || 'AI longevity service is currently unavailable.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Biological Age Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-purple-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Levine PhenoAge & NTNU Fitness Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cellular Healthspan
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-purple-400" />
              Biological Age & Fitness Age Calculator
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              While your chronological age is determined by your date of birth, your <strong>biological fitness age</strong> measures how well your cardiovascular, metabolic, and autonomic systems are functioning at a cellular level.
            </p>
          </div>

          <button
            onClick={handleRunAiLongevity}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-xl shadow-purple-600/25 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoadingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Protocol...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI Longevity Consultation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Results Showcase: Chronological vs Biological Age */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Chronological Age */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Calendar Age
            </span>
            <div className="text-4xl font-black text-white mt-2">
              {chronologicalAge} <span className="text-sm font-semibold text-slate-400">years</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 border-t border-slate-800/80 pt-3">
            Fixed metric based on your birth year.
          </p>
        </div>

        {/* Card 2: Biological / Fitness Age */}
        <div className="bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-2 border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
          <div className="space-y-1 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
                Biological Fitness Age
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  ageDelta <= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {ageDelta <= 0 ? `${Math.abs(ageDelta)} yrs younger` : `${ageDelta} yrs older`}
              </span>
            </div>
            <div className="text-5xl font-black text-purple-300 mt-2">
              {biologicalAge}{' '}
              <span className="text-sm font-semibold text-slate-300">years</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 border-t border-purple-500/20 pt-3">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              {ageDelta <= 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Your physiology functions like someone{' '}
                    <strong className="text-emerald-400">{Math.abs(ageDelta)} years younger</strong>.
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Elevated strain is adding{' '}
                    <strong className="text-amber-400">+{ageDelta} biological years</strong> to your organs.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Card 3: Longevity Healthspan Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Healthspan Vitality Score
            </span>
            <div className="text-4xl font-black text-amber-400 mt-2">
              {baseLongevityScore} <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-800/80 pt-3">
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  baseLongevityScore >= 80
                    ? 'bg-emerald-500'
                    : baseLongevityScore >= 65
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${baseLongevityScore}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400">
              {baseLongevityScore >= 80
                ? 'High resistance to age-related cellular degeneration'
                : 'Lifestyle modifications can reverse 3-5 years'}
            </span>
          </div>
        </div>
      </div>

      {/* Input Adjuster Form */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-6">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Adjust Your Physiological Biomarkers</h3>
            <p className="text-xs text-slate-400">
              Tweak these 4 key pillars to observe real-time impacts on your calculated cellular age.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Real-time Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Chronological Age */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Chronological Age</label>
            <input
              type="number"
              min="18"
              max="95"
              value={chronologicalAge}
              onChange={(e) => setChronologicalAge(Number(e.target.value) || 18)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-purple-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">Your current legal age</span>
          </div>

          {/* Biological Gender */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Biological Sex</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Female
              </button>
            </div>
            <span className="text-[11px] text-slate-500">Determines VO2 & metabolic baselines</span>
          </div>

          {/* Resting Heart Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                Resting Heart Rate
              </label>
              <span className="text-xs font-black text-rose-400">{restingHR} BPM</span>
            </div>
            <input
              type="range"
              min="42"
              max="95"
              value={restingHR}
              onChange={(e) => setRestingHR(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">
              {restingHR < 60 ? 'Athletic Bradycardia (Elite)' : restingHR <= 72 ? 'Normal Range' : 'Elevated'}
            </span>
          </div>

          {/* Sleep Hours & Consistency */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Avg Sleep (Hrs/Night)
              </label>
              <span className="text-xs font-black text-indigo-400">{sleepHours}h ({sleepConsistency}%)</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="10"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Regularity:</span>
              <button
                type="button"
                onClick={() => setSleepConsistency((prev) => (prev >= 90 ? 60 : prev + 15))}
                className="text-indigo-400 underline cursor-pointer"
              >
                {sleepConsistency >= 80 ? 'Consistent (85%)' : 'Irregular (60%)'}
              </button>
            </div>
          </div>
        </div>

        {/* Second Row: Body Composition & VO2 Max */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-3 border-t border-slate-800/80">
          {/* Height & Weight => BMI */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Weight & Height (BMI)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Kg"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value) || 50)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold"
              />
              <input
                type="number"
                placeholder="Cm"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value) || 160)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold"
              />
            </div>
            <span className="text-[11px] text-slate-400">
              BMI: <strong className="text-white">{bmi}</strong> ({bmi < 25 ? 'Normal/Lean' : 'Overweight'})
            </span>
          </div>

          {/* Waist Circumference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Waist Circumference (cm)</label>
            <input
              type="number"
              min="55"
              max="140"
              value={waistCm}
              onChange={(e) => setWaistCm(Number(e.target.value) || 75)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold"
            />
            <span className="text-[11px] text-slate-500">Visceral adiposity indicator</span>
          </div>

          {/* Weekly Workouts */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Weekly Training Sessions</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setWeeklyWorkouts(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    weeklyWorkouts === num
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {num}d
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">Mitochondrial density trigger</span>
          </div>

          {/* VO2 Max Engine */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                VO2 Max Estimation
              </label>
              <span className="text-xs font-black text-cyan-400">
                {activeVo2Max} <span className="text-[10px] text-slate-400">ml/kg/min</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVo2InputMode(vo2InputMode === 'auto' ? 'manual' : 'auto')}
                className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-slate-950 border border-slate-700 text-slate-300 cursor-pointer shrink-0"
              >
                {vo2InputMode === 'auto' ? 'NTNU Formula' : 'Manual Input'}
              </button>
              {vo2InputMode === 'manual' ? (
                <input
                  type="number"
                  min="20"
                  max="85"
                  value={manualVo2Max}
                  onChange={(e) => setManualVo2Max(Number(e.target.value) || 35)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold"
                />
              ) : (
                <span className="text-[11px] text-slate-400 truncate">
                  Target for age: {expectedNormativeVo2}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">Cardiorespiratory fitness level</span>
          </div>
        </div>
      </div>

      {/* Biomarker Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: VO2 Max */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Cardiovascular / VO2
            </span>
            <span
              className={`text-xs font-black ${
                breakdown.vo2.delta <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {breakdown.vo2.delta <= 0 ? `${breakdown.vo2.delta} yrs` : `+${breakdown.vo2.delta} yrs`}
            </span>
          </div>
          <p className="text-xs text-slate-400">{breakdown.vo2.status}</p>
        </div>

        {/* Pillar 2: Resting Heart Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              Autonomic / RHR
            </span>
            <span
              className={`text-xs font-black ${
                breakdown.rhr.delta <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {breakdown.rhr.delta <= 0 ? `${breakdown.rhr.delta} yrs` : `+${breakdown.rhr.delta} yrs`}
            </span>
          </div>
          <p className="text-xs text-slate-400">{breakdown.rhr.status}</p>
        </div>

        {/* Pillar 3: Sleep Consistency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Sleep & Cellular Repair
            </span>
            <span
              className={`text-xs font-black ${
                breakdown.sleep.delta <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {breakdown.sleep.delta <= 0 ? `${breakdown.sleep.delta} yrs` : `+${breakdown.sleep.delta} yrs`}
            </span>
          </div>
          <p className="text-xs text-slate-400">{breakdown.sleep.status}</p>
        </div>

        {/* Pillar 4: Metabolic / BMI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-400" />
              Metabolic & BMI
            </span>
            <span
              className={`text-xs font-black ${
                breakdown.bmi.delta <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {breakdown.bmi.delta <= 0 ? `${breakdown.bmi.delta} yrs` : `+${breakdown.bmi.delta} yrs`}
            </span>
          </div>
          <p className="text-xs text-slate-400">{breakdown.bmi.status}</p>
        </div>
      </div>

      {/* AI Longevity Consultation Results */}
      {aiError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <p>{aiError}</p>
        </div>
      )}

      {aiData && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-5 animate-in fade-in duration-500 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-black text-white">
                Personalized Longevity & Healthspan Blueprint
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Longevity Tier:</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-black text-xs border border-purple-500/30">
                Grade {aiData.longevityGrade} ({aiData.longevityScore}/100)
              </span>
            </div>
          </div>

          {/* Expert Summary */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200 leading-relaxed italic">
            "{aiData.expertVerdict}"
          </div>

          {/* Strengths & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cellular Strengths */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Primary Physiological Strengths
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {aiData.topStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Risks */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Biological Acceleration Factors
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {aiData.criticalRisks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Targeted Interventions to Reverse Biological Age */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Evidence-Based Interventions to Reclaim Biological Years
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiData.interventions.map((inv, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {inv.category}
                    </span>
                    <p className="text-xs font-semibold text-white mt-1">{inv.action}</p>
                  </div>
                  <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Potential Reversal:</span>
                    <span className="text-emerald-400 font-black">
                      -{inv.projectedReversalYears} years
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scientific Reference Accordion / Notes */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 text-xs text-slate-400 space-y-2">
        <span className="font-bold text-slate-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-purple-400" />
          The Science Behind Your Fitness Age
        </span>
        <p className="leading-relaxed">
          Based on the landmark <strong>NTNU Generation 100 Study</strong> (analyzing 1,500+ participants over 5 years) and Morgan Levine's <strong>PhenoAge epigenetic mortality algorithm</strong>. VO2 max and resting heart rate reflect cardiac remodeling and arterial compliance, while sleep regularity maintains cellular telomeres and neuro-glymphatic waste filtration.
        </p>
      </div>
    </div>
  );
};
