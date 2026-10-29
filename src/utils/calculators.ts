import { ActivityLevel, FitnessGoal, Gender } from '../types/fitness';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentary: {
    label: 'Sedentary',
    desc: 'Desk job, little to no regular exercise',
  },
  light: {
    label: 'Lightly Active',
    desc: 'Light exercise or sports 1 to 3 days per week',
  },
  moderate: {
    label: 'Moderately Active',
    desc: 'Moderate exercise or gym 3 to 5 days per week',
  },
  heavy: {
    label: 'Very Active',
    desc: 'Hard exercise, heavy lifting 6 to 7 days per week',
  },
  athlete: {
    label: 'Extremely Active / Athlete',
    desc: 'Physical labor job plus daily double training sessions',
  },
};

export const GOAL_LABELS: Record<FitnessGoal, { label: string; desc: string; calorieDeltaPct: number }> = {
  fat_loss: {
    label: 'Fat Loss (Moderate Cut)',
    desc: 'Steady -20% deficit (~0.5 kg loss/week) while preserving maximum muscle',
    calorieDeltaPct: -0.20,
  },
  extreme_fat_loss: {
    label: 'Extreme Fat Loss (Aggressive Cut)',
    desc: 'Steep -25% deficit for rapid fat drop, requires high protein to protect muscle',
    calorieDeltaPct: -0.25,
  },
  maintenance: {
    label: 'Maintenance / Recomposition',
    desc: 'Maintain current body weight while slowly trading fat for muscle tone',
    calorieDeltaPct: 0,
  },
  muscle_gain: {
    label: 'Lean Bulk / Weight Gain',
    desc: '+10% to +15% clean surplus to maximize protein synthesis and strength',
    calorieDeltaPct: 0.12,
  },
  bodybuilding: {
    label: 'Bodybuilding High Protein',
    desc: 'Optimized high protein split (2.2g/kg) with precise nutrient timing',
    calorieDeltaPct: -0.05,
  },
};

// 1. BMI Calculation
export function calculateBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category = 'Normal';
  let color = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = 'text-amber-400';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (bmi < 25) {
    category = 'Healthy / Normal';
    color = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = 'text-amber-400';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (bmi < 35) {
    category = 'Obese (Class 1)';
    color = 'text-rose-400';
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  } else {
    category = 'Obese (Class 2+)';
    color = 'text-rose-500';
    badgeBg = 'bg-rose-600/20 text-rose-300 border-rose-600/30';
  }

  const healthyMinWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
  const healthyMaxWeight = Math.round(24.9 * heightM * heightM * 10) / 10;

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    color,
    badgeBg,
    healthyRange: `${healthyMinWeight} kg - ${healthyMaxWeight} kg`,
    healthyMinWeight,
    healthyMaxWeight,
  };
}

// Ideal Body Weight (Hamwi Formula)
export function calculateIdealWeightHamwi(heightCm: number, gender: Gender) {
  const inchesOver5Ft = Math.max(0, (heightCm - 152.4) / 2.54);
  let baseWeight = gender === 'male' ? 48.0 : 45.5;
  let addedWeight = gender === 'male' ? inchesOver5Ft * 2.7 : inchesOver5Ft * 2.2;
  return Math.round((baseWeight + addedWeight) * 10) / 10;
}

// 2. BMR & TDEE (Mifflin-St Jeor formula)
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
) {
  // Mifflin - St Jeor:
  // Men: 10*W + 6.25*H - 5*A + 5
  // Women: 10*W + 6.25*H - 5*A - 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

// 3. Calorie & Macro Target Splitter
export function calculateMacroTargets(
  tdee: number,
  goal: FitnessGoal,
  weightKg: number
) {
  const goalConfig = GOAL_LABELS[goal] || GOAL_LABELS.fat_loss;
  let targetCalories = Math.round(tdee * (1 + goalConfig.calorieDeltaPct));

  // Minimum safe calorie floor
  if (targetCalories < 1200) targetCalories = 1200;

  let proteinPerKg = 1.8;
  let fatPctOfCalories = 0.25;

  switch (goal) {
    case 'fat_loss':
      proteinPerKg = 2.0; // Higher protein to preserve lean muscle during cut
      fatPctOfCalories = 0.25;
      break;
    case 'extreme_fat_loss':
      proteinPerKg = 2.2; // Extra high protein to prevent muscle wasting
      fatPctOfCalories = 0.22;
      break;
    case 'maintenance':
      proteinPerKg = 1.8;
      fatPctOfCalories = 0.28;
      break;
    case 'muscle_gain':
      proteinPerKg = 2.0;
      fatPctOfCalories = 0.25;
      break;
    case 'bodybuilding':
      proteinPerKg = 2.3;
      fatPctOfCalories = 0.20;
      break;
  }

  const targetProteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCalories = targetProteinGrams * 4;

  const fatCalories = targetCalories * fatPctOfCalories;
  const targetFatGrams = Math.round(fatCalories / 9);

  const remainingCarbCalories = Math.max(0, targetCalories - (proteinCalories + targetFatGrams * 9));
  const targetCarbsGrams = Math.round(remainingCarbCalories / 4);

  const fiberGrams = Math.round((targetCalories / 1000) * 14); // 14g per 1000 kcal recommendation

  return {
    targetCalories,
    protein: targetProteinGrams,
    carbs: targetCarbsGrams,
    fat: targetFatGrams,
    fiber: fiberGrams,
    proteinPct: Math.round((proteinCalories / targetCalories) * 100),
    carbsPct: Math.round(((targetCarbsGrams * 4) / targetCalories) * 100),
    fatPct: Math.round(((targetFatGrams * 9) / targetCalories) * 100),
  };
}

// 4. US Navy Body Fat %
export function calculateBodyFatNavy(
  gender: Gender,
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm?: number,
  weightKg?: number
) {
  if (gender === 'male') {
    if (waistCm <= neckCm) return null;
    // Formula for Men
    const bodyFat =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waistCm - neckCm) +
          0.15456 * Math.log10(heightCm)) -
      450;
    const rounded = Math.round(bodyFat * 10) / 10;
    if (isNaN(rounded) || rounded < 3 || rounded > 60) return null;

    let category = 'Fitness';
    if (rounded < 6) category = 'Essential Fat';
    else if (rounded < 14) category = 'Athletic';
    else if (rounded < 18) category = 'Fitness / Lean';
    else if (rounded < 25) category = 'Average';
    else category = 'High Body Fat';

    const fatMassKg = weightKg ? Math.round((weightKg * (rounded / 100)) * 10) / 10 : undefined;
    const leanMassKg = weightKg && fatMassKg ? Math.round((weightKg - fatMassKg) * 10) / 10 : undefined;

    return {
      bodyFatPct: rounded,
      category,
      fatMassKg,
      leanMassKg,
    };
  } else {
    // Formula for Women (requires hip measurement)
    const hip = hipCm || waistCm * 1.15;
    if (waistCm + hip <= neckCm) return null;
    const bodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(waistCm + hip - neckCm) +
          0.221 * Math.log10(heightCm)) -
      450;
    const rounded = Math.round(bodyFat * 10) / 10;
    if (isNaN(rounded) || rounded < 8 || rounded > 65) return null;

    let category = 'Fitness';
    if (rounded < 14) category = 'Essential Fat';
    else if (rounded < 21) category = 'Athletic';
    else if (rounded < 25) category = 'Fitness';
    else if (rounded < 32) category = 'Average';
    else category = 'High Body Fat';

    const fatMassKg = weightKg ? Math.round((weightKg * (rounded / 100)) * 10) / 10 : undefined;
    const leanMassKg = weightKg && fatMassKg ? Math.round((weightKg - fatMassKg) * 10) / 10 : undefined;

    return {
      bodyFatPct: rounded,
      category,
      fatMassKg,
      leanMassKg,
    };
  }
}

// 5. One Rep Max (1RM) Estimator
export function calculate1RM(weightKg: number, reps: number) {
  if (reps <= 0 || weightKg <= 0) return { oneRepMax: 0, percentages: [] };
  if (reps === 1) {
    const percentages = [
      { pct: 100, repsText: '1 rep', weight: weightKg },
      { pct: 95, repsText: '2 reps', weight: Math.round(weightKg * 0.95) },
      { pct: 90, repsText: '3-4 reps', weight: Math.round(weightKg * 0.90) },
      { pct: 85, repsText: '5-6 reps', weight: Math.round(weightKg * 0.85) },
      { pct: 80, repsText: '7-8 reps', weight: Math.round(weightKg * 0.80) },
      { pct: 75, repsText: '10 reps', weight: Math.round(weightKg * 0.75) },
      { pct: 70, repsText: '12 reps', weight: Math.round(weightKg * 0.70) },
      { pct: 65, repsText: '15 reps', weight: Math.round(weightKg * 0.65) },
    ];
    return { oneRepMax: weightKg, percentages };
  }

  // Brzycki formula: W * (36 / (37 - reps))
  const brzycki = weightKg * (36 / (37 - Math.min(36, reps)));
  // Epley formula: W * (1 + reps / 30)
  const epley = weightKg * (1 + reps / 30);
  const oneRepMax = Math.round((brzycki + epley) / 2);

  const percentages = [
    { pct: 100, repsText: '1 rep (1RM)', weight: oneRepMax },
    { pct: 95, repsText: '2 reps', weight: Math.round(oneRepMax * 0.95) },
    { pct: 90, repsText: '3-4 reps (Strength)', weight: Math.round(oneRepMax * 0.90) },
    { pct: 85, repsText: '5-6 reps (Power)', weight: Math.round(oneRepMax * 0.85) },
    { pct: 80, repsText: '7-8 reps (Hypertrophy)', weight: Math.round(oneRepMax * 0.80) },
    { pct: 75, repsText: '10 reps (Growth)', weight: Math.round(oneRepMax * 0.75) },
    { pct: 70, repsText: '12 reps (Endurance)', weight: Math.round(oneRepMax * 0.70) },
    { pct: 65, repsText: '15 reps (Burn)', weight: Math.round(oneRepMax * 0.65) },
  ];

  return { oneRepMax, percentages };
}

// 6. Daily Water Intake Calculator
export function calculateDailyWater(
  weightKg: number,
  exerciseMinutesPerDay: number = 45,
  climate: 'normal' | 'hot' = 'hot'
) {
  // Base: 35ml per kg body weight
  let ml = weightKg * 35;
  // + 350ml per 30 mins exercise
  ml += (exerciseMinutesPerDay / 30) * 350;
  // + 500ml for hot/Indian climate hydration bonus
  if (climate === 'hot') ml += 500;

  const liters = Math.round((ml / 1000) * 10) / 10;
  const glasses = Math.round(ml / 250); // 250ml glass
  return { liters, glasses, totalMl: Math.round(ml) };
}

// 7. Target Heart Rate Training Zones (Karvonen)
export function calculateHeartRateZones(age: number, restingHR: number = 70) {
  const maxHR = 220 - age;
  const hrReserve = Math.max(30, maxHR - restingHR);

  const calcZone = (lowPct: number, highPct: number) => {
    const low = Math.round(restingHR + hrReserve * lowPct);
    const high = Math.round(restingHR + hrReserve * highPct);
    return `${low} - ${high} BPM`;
  };

  return {
    maxHR,
    restingHR,
    zones: [
      {
        name: 'Zone 1: Active Recovery (50-60%)',
        range: calcZone(0.5, 0.6),
        benefit: 'Warm-up, post-workout recovery, active rest days',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      },
      {
        name: 'Zone 2: Fat Oxidation & Aerobic Base (60-70%)',
        range: calcZone(0.6, 0.7),
        benefit: 'Maximum mitochondrial fat burning, cardiac endurance, all-day stamina',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      },
      {
        name: 'Zone 3: Aerobic Fitness (70-80%)',
        range: calcZone(0.7, 0.8),
        benefit: 'Improves cardiovascular capacity, blood vessel dilation, tempo running',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      },
      {
        name: 'Zone 4: Anaerobic Threshold (80-90%)',
        range: calcZone(0.8, 0.9),
        benefit: 'Lactate clearance threshold, high-intensity strength conditioning',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      },
      {
        name: 'Zone 5: VO2 Max Peak (90-100%)',
        range: calcZone(0.9, 1.0),
        benefit: 'All-out sprint intervals, maximum oxygen uptake and power output',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      },
    ],
  };
}
