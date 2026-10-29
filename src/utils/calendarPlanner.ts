import { ScheduledWorkoutSession, WorkoutDayType } from '../types/fitness';
import { WORKOUT_ROUTINES } from '../data/workoutRoutines';

export type SplitType = 'ppl_5day' | 'home_4day' | 'fullbody_3day';

export function toISODateString(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function generateMonthlyCalendar(
  year: number,
  monthIndex: number,
  splitType: SplitType = 'ppl_5day'
): Record<string, ScheduledWorkoutSession> {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const schedule: Record<string, ScheduledWorkoutSession> = {};

  // Standard cycle patterns (7-day repeating week: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
  const pplCycle: { type: WorkoutDayType; title: string; focus: string; loc: 'home' | 'gym'; exercises: string[]; duration: number }[] = [
    {
      type: 'workout',
      title: 'Push Day (Chest, Shoulders, Triceps)',
      focus: 'Heavy Presses, Lateral Delts & Cable Triceps',
      loc: 'gym',
      exercises: ['ex-barbell-bench-press', 'ex-incline-dumbbell-press', 'ex-overhead-press', 'ex-dumbbell-lateral-raise', 'ex-cable-tricep-pushdown'],
      duration: 55,
    },
    {
      type: 'workout',
      title: 'Pull Day (Back, Rear Delts, Biceps)',
      focus: 'Lats, Rows, Traps & Bicep Hypertrophy',
      loc: 'gym',
      exercises: ['ex-pullups', 'ex-barbell-deadlift', 'ex-lat-pulldown', 'ex-face-pulls', 'ex-barbell-bicep-curl'],
      duration: 60,
    },
    {
      type: 'workout',
      title: 'Legs & Calves Power',
      focus: 'Squats, Romanian Deadlifts & Quad Loading',
      loc: 'gym',
      exercises: ['ex-barbell-squat', 'ex-romanian-deadlift', 'ex-leg-press', 'ex-standing-calf-raises', 'ex-hanging-leg-raise'],
      duration: 55,
    },
    {
      type: 'active_recovery',
      title: 'Active Recovery & Mobility',
      focus: '8,000 Steps, Foam Rolling & Hydration',
      loc: 'home',
      exercises: [],
      duration: 30,
    },
    {
      type: 'workout',
      title: 'Upper Body Hypertrophy Pump',
      focus: 'Chest Flyes, Rows, Lateral Delts & Arms',
      loc: 'gym',
      exercises: ['ex-cable-crossover', 'ex-dumbbell-single-arm-row', 'ex-dumbbell-lateral-raise', 'ex-dumbbell-hammer-curl', 'ex-diamond-pushups'],
      duration: 50,
    },
    {
      type: 'workout',
      title: 'Lower Body & Core Burner',
      focus: 'Bulgarian Split Squats, Core & HIIT',
      loc: 'gym',
      exercises: ['ex-bulgarian-split-squat', 'ex-romanian-deadlift', 'ex-forearm-plank', 'ex-hanging-leg-raise', 'ex-burpees'],
      duration: 45,
    },
    {
      type: 'rest',
      title: 'Complete Rest Day',
      focus: 'Systemic Nervous System & Muscle Tissue Repair',
      loc: 'home',
      exercises: [],
      duration: 0,
    },
  ];

  const homeCycle: { type: WorkoutDayType; title: string; focus: string; loc: 'home' | 'gym'; exercises: string[]; duration: number }[] = [
    {
      type: 'workout',
      title: 'Home Upper Body Blast',
      focus: 'Push-Ups, Pike Presses & Delts',
      loc: 'home',
      exercises: ['ex-pushups-standard', 'ex-pike-pushups', 'ex-dumbbell-lateral-raise', 'ex-bench-dips', 'ex-forearm-plank'],
      duration: 40,
    },
    {
      type: 'workout',
      title: 'Home Lower Body & Core',
      focus: 'Air Squats, Lunges & Abs',
      loc: 'home',
      exercises: ['ex-bodyweight-squat', 'ex-bulgarian-split-squat', 'ex-standing-calf-raises', 'ex-bicycle-crunches', 'ex-mountain-climbers'],
      duration: 40,
    },
    {
      type: 'active_recovery',
      title: 'Active Walk & Stretch',
      focus: 'Brisk Walk & Mobility Stretch',
      loc: 'home',
      exercises: [],
      duration: 30,
    },
    {
      type: 'workout',
      title: 'Home Back, Triceps & Core',
      focus: 'Dumbbell Rows, Diamond Push-Ups & Plank',
      loc: 'home',
      exercises: ['ex-dumbbell-single-arm-row', 'ex-decline-pushups', 'ex-dumbbell-hammer-curl', 'ex-diamond-pushups', 'ex-forearm-plank'],
      duration: 40,
    },
    {
      type: 'workout',
      title: 'Full Body HIIT Metabolic Shred',
      focus: 'Burpees, Mountain Climbers & Fast Cardio',
      loc: 'home',
      exercises: ['ex-burpees', 'ex-mountain-climbers', 'ex-jumping-jacks', 'ex-bodyweight-squat', 'ex-hanging-leg-raise'],
      duration: 35,
    },
    {
      type: 'rest',
      title: 'Weekend Rest & Recharge',
      focus: 'Sleep 8 Hours & Nutritious Indian Meals',
      loc: 'home',
      exercises: [],
      duration: 0,
    },
    {
      type: 'rest',
      title: 'Rest Day',
      focus: 'Muscle Tissue Rebuilding',
      loc: 'home',
      exercises: [],
      duration: 0,
    },
  ];

  const fullBodyCycle: { type: WorkoutDayType; title: string; focus: string; loc: 'home' | 'gym'; exercises: string[]; duration: number }[] = [
    {
      type: 'workout',
      title: 'Full Body Foundation A',
      focus: 'Squats, Push-Ups & Rows',
      loc: 'gym',
      exercises: ['ex-barbell-squat', 'ex-pushups-standard', 'ex-dumbbell-single-arm-row', 'ex-overhead-press', 'ex-forearm-plank'],
      duration: 50,
    },
    {
      type: 'rest',
      title: 'Rest & Recovery Day',
      focus: 'Protein Synthesis & Hydration',
      loc: 'home',
      exercises: [],
      duration: 0,
    },
    {
      type: 'workout',
      title: 'Full Body Foundation B',
      focus: 'Deadlifts, Incline Dumbbell Press & Pull-Ups',
      loc: 'gym',
      exercises: ['ex-romanian-deadlift', 'ex-incline-dumbbell-press', 'ex-pullups', 'ex-dumbbell-lateral-raise', 'ex-bicycle-crunches'],
      duration: 50,
    },
    {
      type: 'rest',
      title: 'Rest Day',
      focus: 'Active Walk & Foam Rolling',
      loc: 'home',
      exercises: [],
      duration: 0,
    },
    {
      type: 'workout',
      title: 'Full Body Foundation C',
      focus: 'Split Squats, Cable Flyes & Arms',
      loc: 'gym',
      exercises: ['ex-bulgarian-split-squat', 'ex-cable-crossover', 'ex-barbell-bicep-curl', 'ex-cable-tricep-pushdown', 'ex-burpees'],
      duration: 50,
    },
    {
      type: 'active_recovery',
      title: 'Active Weekend Recovery',
      focus: 'Light Outdoor Activity or Swimming',
      loc: 'home',
      exercises: [],
      duration: 30,
    },
    {
      type: 'rest',
      title: 'Sunday Rest Day',
      focus: 'Meal Prep & Mental Rest',
      loc: 'home',
      exercises: [],
      duration: 0,
    },
  ];

  const cycleToUse = splitType === 'home_4day' ? homeCycle : splitType === 'fullbody_3day' ? fullBodyCycle : pplCycle;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, monthIndex, day);
    // getDay() gives 0 for Sunday, 1 for Monday... We want Monday = 0, Sunday = 6
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    const template = cycleToUse[dayOfWeek];

    const dateStr = toISODateString(year, monthIndex, day);

    // Make week 4 Thursday or Friday a deload session if it's the 4th week of the month
    const isDeloadDay = day >= 22 && day <= 28 && template.type === 'workout' && (dayOfWeek === 4 || dayOfWeek === 1);

    schedule[dateStr] = {
      id: `session-${dateStr}`,
      dateString: dateStr,
      type: isDeloadDay ? 'deload' : template.type,
      title: isDeloadDay ? `Deload: ${template.title.split('(')[0].trim()} (50% Load)` : template.title,
      focus: isDeloadDay ? 'Lighter volume, focus on joint recovery & crisp technique' : template.focus,
      location: template.loc,
      exerciseIds: template.exercises,
      durationMinutes: isDeloadDay ? 30 : template.duration,
      completed: false,
    };
  }

  return schedule;
}

export function moveSession(
  calendar: Record<string, ScheduledWorkoutSession>,
  sourceDate: string,
  targetDate: string
): Record<string, ScheduledWorkoutSession> {
  const updated = { ...calendar };
  const sourceSession = updated[sourceDate];
  const targetSession = updated[targetDate];

  if (!sourceSession) return updated;

  if (targetSession) {
    // Swap sessions between source and target dates
    updated[sourceDate] = {
      ...targetSession,
      id: `session-${sourceDate}`,
      dateString: sourceDate,
    };
    updated[targetDate] = {
      ...sourceSession,
      id: `session-${targetDate}`,
      dateString: targetDate,
    };
  } else {
    // Move to targetDate and mark sourceDate as Rest Day
    updated[targetDate] = {
      ...sourceSession,
      id: `session-${targetDate}`,
      dateString: targetDate,
    };
    updated[sourceDate] = {
      id: `session-${sourceDate}`,
      dateString: sourceDate,
      type: 'rest',
      title: 'Rest & Recovery Day',
      focus: 'Moved workout to ' + targetDate,
      location: 'home',
      exerciseIds: [],
      durationMinutes: 0,
      completed: false,
    };
  }

  return updated;
}

export function checkFatigueStreak(calendar: Record<string, ScheduledWorkoutSession>): {
  warning: boolean;
  consecutiveDays: number;
  startDate?: string;
  endDate?: string;
} {
  const sortedDates = Object.keys(calendar).sort();
  let currentStreak = 0;
  let maxStreak = 0;
  let streakStart = '';
  let streakEnd = '';

  for (const date of sortedDates) {
    const s = calendar[date];
    if (s.type === 'workout') {
      currentStreak++;
      if (currentStreak >= 5) {
        if (!streakStart) streakStart = sortedDates[sortedDates.indexOf(date) - (currentStreak - 1)];
        streakEnd = date;
        maxStreak = Math.max(maxStreak, currentStreak);
      }
    } else {
      currentStreak = 0;
    }
  }

  return {
    warning: maxStreak >= 5,
    consecutiveDays: maxStreak,
    startDate: streakStart,
    endDate: streakEnd,
  };
}
