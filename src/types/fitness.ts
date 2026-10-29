export type FitnessGoal =
  | 'fat_loss'
  | 'extreme_fat_loss'
  | 'maintenance'
  | 'muscle_gain'
  | 'bodybuilding';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'heavy'
  | 'athlete';

export type Gender = 'male' | 'female';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  neckCm?: number;
  waistCm?: number;
  hipCm?: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  dietPreference: 'all' | 'veg' | 'non_veg';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  waterGoalLiters: number;
}

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'dairy'
  | 'pulses'
  | 'non-veg'
  | 'healthy-fats';

export interface IndianFoodItem {
  id: string;
  name: string;
  hindiName?: string;
  category: FoodCategory;
  isVeg: boolean;
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  benefits?: string;
}

export type MealSlotId =
  | 'early_morning'
  | 'breakfast'
  | 'mid_morning'
  | 'lunch'
  | 'evening_snack'
  | 'dinner'
  | 'bedtime';

export interface MealItem {
  id: string;
  foodId?: string;
  name: string;
  portion: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isVeg: boolean;
}

export interface DietMealSlot {
  id: MealSlotId;
  name: string;
  timeHint: string;
  items: MealItem[];
  tips?: string;
}

export interface DayDietPlan {
  title: string;
  goal: FitnessGoal;
  preference: 'all' | 'veg' | 'non_veg';
  targetCalories: number;
  meals: DietMealSlot[];
  guidelines: string[];
  hydrationTips: string;
  groceryList: string[];
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings_glutes'
  | 'calves'
  | 'core'
  | 'cardio_hiit';

export type ExerciseLocation = 'home' | 'gym' | 'both';
export type EquipmentType =
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'machine'
  | 'cables'
  | 'resistance_band';

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: MuscleGroup;
  muscleLabel: string;
  secondaryMuscles: string[];
  location: ExerciseLocation;
  equipment: EquipmentType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  formTips: string[];
  defaultSets: number;
  defaultReps: string;
  caloriesBurnEstimate: number; // kcal per 10 mins
  burnIntensity: 'low' | 'moderate' | 'high';
}

export interface WorkoutSetRecord {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface ExerciseLogItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetMuscle: string;
  sets: WorkoutSetRecord[];
  timestamp: string;
}

export interface ScannedFoodResult {
  mealName: string;
  items: {
    name: string;
    portionDescription: string;
    estimatedGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    isVeg: boolean;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  healthScore: number;
  verdict: string;
  suggestions: string[];
}

export interface DailyReminder {
  id: string;
  title: string;
  time: string; // "HH:MM"
  category: 'water' | 'meal' | 'workout' | 'stretch' | 'sleep';
  enabled: boolean;
  sound: boolean;
  message: string;
}

export interface DailyActivityTracker {
  date: string;
  waterGlasses: number; // 250ml each
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  mealsLogged: MealItem[];
  completedExercises: ExerciseLogItem[];
  currentWeightKg?: number;
  checklist: { [key: string]: boolean };
}

export type WorkoutDayType =
  | 'workout'
  | 'rest'
  | 'active_recovery'
  | 'deload';

export interface ScheduledWorkoutSession {
  id: string;
  dateString: string; // "YYYY-MM-DD"
  type: WorkoutDayType;
  title: string;
  focus: string;
  location: ExerciseLocation;
  exerciseIds: string[];
  durationMinutes: number;
  completed: boolean;
  notes?: string;
}

export type WorkoutTemplateCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full_body'
  | 'arms_core'
  | 'custom';

export interface WorkoutTemplateExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  targetWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkoutTemplateCategory;
  estimatedDurationMinutes: number;
  exercises: WorkoutTemplateExercise[];
  isCustom?: boolean;
  createdAt?: string;
  lastUsedAt?: string;
  timesCompleted?: number;
}
