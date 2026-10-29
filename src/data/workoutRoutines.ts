export interface WorkoutRoutineDay {
  dayName: string;
  focus: string;
  exerciseIds: string[];
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  goal: string;
  location: 'home' | 'gym' | 'both';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  description: string;
  schedule: WorkoutRoutineDay[];
}

export const WORKOUT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine-home-shred',
    title: '4-Day Home Lean Body Shred',
    goal: 'Fat Loss & Athletic Conditioning',
    location: 'home',
    difficulty: 'beginner',
    daysPerWeek: 4,
    description: 'No fancy gym needed! Sculpt muscle and accelerate fat burn with bodyweight and dumbbell movements.',
    schedule: [
      {
        dayName: 'Day 1: Upper Body Blast',
        focus: 'Chest, Shoulders & Arms',
        exerciseIds: ['ex-pushups-standard', 'ex-pike-pushups', 'ex-dumbbell-lateral-raise', 'ex-bench-dips', 'ex-forearm-plank'],
      },
      {
        dayName: 'Day 2: Lower Body Power & Core',
        focus: 'Quads, Hamstrings & Abs',
        exerciseIds: ['ex-bodyweight-squat', 'ex-bulgarian-split-squat', 'ex-standing-calf-raises', 'ex-bicycle-crunches', 'ex-mountain-climbers'],
      },
      {
        dayName: 'Day 3: Active Rest / Walk',
        focus: 'Recovery & 8,000 Steps',
        exerciseIds: [],
      },
      {
        dayName: 'Day 4: Upper Sculpt & Back',
        focus: 'Back, Delts & Biceps',
        exerciseIds: ['ex-dumbbell-single-arm-row', 'ex-decline-pushups', 'ex-dumbbell-hammer-curl', 'ex-diamond-pushups', 'ex-forearm-plank'],
      },
      {
        dayName: 'Day 5: Full Body Metabolic Burn',
        focus: 'HIIT & Maximum Calorie Torch',
        exerciseIds: ['ex-burpees', 'ex-mountain-climbers', 'ex-jumping-jacks', 'ex-bodyweight-squat', 'ex-hanging-leg-raise'],
      },
    ],
  },
  {
    id: 'routine-gym-ppl',
    title: '5-Day Push-Pull-Legs (PPL) Gym Hypertrophy',
    goal: 'Muscle Hypertrophy & Strength',
    location: 'gym',
    difficulty: 'intermediate',
    daysPerWeek: 5,
    description: 'The premier scientific bodybuilding split used by natural athletes for maximum muscle growth and strength progression.',
    schedule: [
      {
        dayName: 'Day 1: Push (Chest, Shoulders, Triceps)',
        focus: 'Heavy Pressing & Delts',
        exerciseIds: ['ex-barbell-bench-press', 'ex-incline-dumbbell-press', 'ex-overhead-press', 'ex-dumbbell-lateral-raise', 'ex-cable-tricep-pushdown'],
      },
      {
        dayName: 'Day 2: Pull (Back, Rear Delts, Biceps)',
        focus: 'Vertical & Horizontal Pulls',
        exerciseIds: ['ex-pullups', 'ex-barbell-deadlift', 'ex-lat-pulldown', 'ex-face-pulls', 'ex-barbell-bicep-curl'],
      },
      {
        dayName: 'Day 3: Legs (Quads, Hamstrings, Calves)',
        focus: 'Lower Body Mass',
        exerciseIds: ['ex-barbell-squat', 'ex-romanian-deadlift', 'ex-leg-press', 'ex-standing-calf-raises', 'ex-hanging-leg-raise'],
      },
      {
        dayName: 'Day 4: Upper Body Pump & Form',
        focus: 'Chest, Back & Arms Hypertrophy',
        exerciseIds: ['ex-cable-crossover', 'ex-dumbbell-single-arm-row', 'ex-dumbbell-lateral-raise', 'ex-dumbbell-hammer-curl', 'ex-diamond-pushups'],
      },
      {
        dayName: 'Day 5: Lower Body & Core Conditioning',
        focus: 'Glutes, Quads & Deep Abs',
        exerciseIds: ['ex-bulgarian-split-squat', 'ex-romanian-deadlift', 'ex-forearm-plank', 'ex-hanging-leg-raise', 'ex-burpees'],
      },
    ],
  },
  {
    id: 'routine-fullbody-strength',
    title: '3-Day Full Body Foundation',
    goal: 'Body Recomposition & General Fitness',
    location: 'both',
    difficulty: 'beginner',
    daysPerWeek: 3,
    description: 'Perfect for working professionals: full body stimulation every 48 hours for optimal recovery and consistent progress.',
    schedule: [
      {
        dayName: 'Monday: Full Body A',
        focus: 'Squats, Push & Pull',
        exerciseIds: ['ex-bodyweight-squat', 'ex-pushups-standard', 'ex-dumbbell-single-arm-row', 'ex-overhead-press', 'ex-forearm-plank'],
      },
      {
        dayName: 'Wednesday: Full Body B',
        focus: 'Hinges, Upper Chest & Lats',
        exerciseIds: ['ex-romanian-deadlift', 'ex-incline-dumbbell-press', 'ex-pullups', 'ex-dumbbell-lateral-raise', 'ex-bicycle-crunches'],
      },
      {
        dayName: 'Friday: Full Body C',
        focus: 'Unilateral Legs, Arms & Cardio',
        exerciseIds: ['ex-bulgarian-split-squat', 'ex-cable-crossover', 'ex-barbell-bicep-curl', 'ex-cable-tricep-pushdown', 'ex-burpees'],
      },
    ],
  },
];
