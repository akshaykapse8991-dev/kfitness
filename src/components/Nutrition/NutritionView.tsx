import React, { useState } from 'react';
import {
  Salad,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Apple,
  Wheat,
  Milk,
  Beef,
  Flame,
  Sparkles,
  Info,
} from 'lucide-react';
import { INDIAN_FOOD_DATABASE } from '../../data/indianFoods';
import { FoodCategory, IndianFoodItem, MealItem, UserProfile } from '../../types/fitness';
import { AINutritionCoach } from './AINutritionCoach';

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Athlete',
  age: 28,
  gender: 'male',
  heightCm: 175,
  currentWeightKg: 75,
  targetWeightKg: 70,
  activityLevel: 'moderately_active',
  fitnessGoal: 'fat_loss',
  targetCalories: 2200,
  targetProtein: 150,
  targetCarbs: 220,
  targetFat: 60,
  waterGoalLiters: 3.5,
};

interface NutritionViewProps {
  onAddMealItem: (item: MealItem) => void;
  userProfile?: UserProfile;
  todayMeals?: MealItem[];
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  onAddMealItem,
  userProfile = DEFAULT_USER_PROFILE,
  todayMeals = [],
}) => {
  const [viewMode, setViewMode] = useState<'database' | 'coach'>('database');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<IndianFoodItem | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);
  const [customServingGrams, setCustomServingGrams] = useState<number>(100);
  const [showToast, setShowToast] = useState(false);

  // Custom user food item state
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customFoodList, setCustomFoodList] = useState<IndianFoodItem[]>([]);
  const [customName, setCustomName] = useState('');
  const [customHindi, setCustomHindi] = useState('');
  const [customCategory, setCustomCategory] = useState<FoodCategory>('grains');
  const [customIsVeg, setCustomIsVeg] = useState(true);
  const [customCalories, setCustomCalories] = useState(150);
  const [customProtein, setCustomProtein] = useState(10);
  const [customCarbs, setCustomCarbs] = useState(20);
  const [customFat, setCustomFat] = useState(3);
  const [customFiber, setCustomFiber] = useState(2);

  const combinedDatabase = [...INDIAN_FOOD_DATABASE, ...customFoodList];

  const filteredFoods = combinedDatabase.filter((item) => {
    // Diet preference filter
    if (dietFilter === 'veg' && !item.isVeg) return false;
    if (dietFilter === 'non_veg' && item.isVeg) return false;

    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

    // Search query matching english or hindi name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchHindi = item.hindiName?.toLowerCase().includes(q);
      const matchBenefits = item.benefits?.toLowerCase().includes(q);
      if (!matchName && !matchHindi && !matchBenefits) return false;
    }

    return true;
  });

  const handleSelectFood = (food: IndianFoodItem) => {
    setSelectedFood(food);
    setServingMultiplier(1);
    setCustomServingGrams(food.servingGrams);
  };

  const handleLogFood = () => {
    if (!selectedFood) return;

    const factor = servingMultiplier;
    const computedGrams = Math.round(selectedFood.servingGrams * factor);
    const itemToLog: MealItem = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      foodId: selectedFood.id,
      name: selectedFood.name,
      portion: factor === 1 ? selectedFood.servingSize : `${factor}x (${computedGrams}g)`,
      grams: computedGrams,
      calories: Math.round(selectedFood.calories * factor),
      protein: Math.round(selectedFood.protein * factor * 10) / 10,
      carbs: Math.round(selectedFood.carbs * factor * 10) / 10,
      fat: Math.round(selectedFood.fat * factor * 10) / 10,
      fiber: Math.round(selectedFood.fiber * factor * 10) / 10,
      isVeg: selectedFood.isVeg,
    };

    onAddMealItem(itemToLog);
    setSelectedFood(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newFood: IndianFoodItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      hindiName: customHindi.trim() || undefined,
      category: customCategory,
      isVeg: customIsVeg,
      servingSize: '1 serving (100g)',
      servingGrams: 100,
      calories: customCalories,
      protein: customProtein,
      carbs: customCarbs,
      fat: customFat,
      fiber: customFiber,
      benefits: 'Custom home-cooked recipe',
    };

    setCustomFoodList((prev) => [newFood, ...prev]);
    setShowAddCustomModal(false);
    setCustomName('');
    setCustomHindi('');
  };

  const categories: { id: FoodCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Foods', icon: <Salad className="w-3.5 h-3.5" /> },
    { id: 'fruits', label: 'Fruits', icon: <Apple className="w-3.5 h-3.5" /> },
    { id: 'vegetables', label: 'Vegetables', icon: <Salad className="w-3.5 h-3.5" /> },
    { id: 'grains', label: 'Grains & Millets', icon: <Wheat className="w-3.5 h-3.5" /> },
    { id: 'dairy', label: 'Dairy & Paneer', icon: <Milk className="w-3.5 h-3.5" /> },
    { id: 'pulses', label: 'Pulses & Soya', icon: <Wheat className="w-3.5 h-3.5" /> },
    { id: 'non-veg', label: 'Non-Veg & Eggs', icon: <Beef className="w-3.5 h-3.5" /> },
    { id: 'healthy-fats', label: 'Nuts & Seeds', icon: <Apple className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Indian Nutritional Catalog
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Indian Food Database & Nutrition Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Complete nutritional breakdowns (calories, protein, carbs, fats, fiber) for authentic home-cooked Indian foods, grains, dals, dairy, and meats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('database')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'database'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Salad className="w-3.5 h-3.5" />
                <span>Food Catalog</span>
              </button>
              <button
                onClick={() => setViewMode('coach')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'coach'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Nutrition Coach</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-extrabold">
                  3 Optimizations
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowAddCustomModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Custom Recipe</span>
            </button>
          </div>
        </div>

        {/* STRICT VEG VS NON-VEG FILTER SWITCH */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Diet Preference:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setDietFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dietFilter === 'all'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Foods
              </button>
              <button
                onClick={() => setDietFilter('veg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dietFilter === 'veg'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded border border-emerald-500 bg-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span>Vegetarian Only</span>
              </button>
              <button
                onClick={() => setDietFilter('non_veg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dietFilter === 'non_veg'
                    ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded border border-rose-500 bg-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                </span>
                <span>Non-Veg Only</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Roti, Paneer, Dal, Chicken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === 'coach' ? (
        <AINutritionCoach
          userProfile={userProfile}
          todayMeals={todayMeals}
          onAddMealItem={onAddMealItem}
        />
      ) : (
        <>
          {showToast && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-3 animate-fade-in shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm font-semibold">
                Logged food successfully to today&apos;s nutrition diary!
              </p>
            </div>
          )}

          {/* Foods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map((food) => (
          <div
            key={food.id}
            onClick={() => handleSelectFood(food)}
            className="group bg-slate-900/80 hover:bg-slate-800/80 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 transition-all cursor-pointer shadow-md flex flex-col justify-between"
          >
            <div>
              {/* Header: Name, Hindi, Veg Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                        food.isVeg ? 'border-emerald-500 bg-slate-950' : 'border-rose-500 bg-slate-950'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${food.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                      {food.name}
                    </h3>
                  </div>
                  {food.hindiName && (
                    <p className="text-xs text-slate-400 mt-0.5 ml-5.5 font-medium">{food.hindiName}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-white">{food.calories}</span>
                  <span className="text-[10px] text-slate-400 ml-1">kcal</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-2 ml-5.5">
                Serving: <span className="text-slate-300 font-semibold">{food.servingSize}</span>
              </div>

              {/* Macro Pills */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-center">
                <div className="p-1.5 bg-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-emerald-400 font-bold block">Protein</span>
                  <span className="text-xs font-black text-slate-100">{food.protein}g</span>
                </div>
                <div className="p-1.5 bg-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-amber-400 font-bold block">Carbs</span>
                  <span className="text-xs font-black text-slate-100">{food.carbs}g</span>
                </div>
                <div className="p-1.5 bg-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-rose-400 font-bold block">Fats</span>
                  <span className="text-xs font-black text-slate-100">{food.fat}g</span>
                </div>
                <div className="p-1.5 bg-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-teal-400 font-bold block">Fiber</span>
                  <span className="text-xs font-black text-slate-100">{food.fiber}g</span>
                </div>
              </div>

              {food.benefits && (
                <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 italic">
                  💡 {food.benefits}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-emerald-400 font-bold">
              <span>Quick Log Item</span>
              <Plus className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {filteredFoods.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800">
          <p className="text-slate-400 text-sm">No food items found matching your current filter.</p>
        </div>
      )}

      {/* Food Portion & Add to Diary Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                      selectedFood.isVeg ? 'border-emerald-500 bg-slate-950' : 'border-rose-500 bg-slate-950'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedFood.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedFood.name}</h3>
                </div>
                {selectedFood.hindiName && (
                  <p className="text-xs text-slate-400 ml-5.5 font-medium">{selectedFood.hindiName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Serving multipliers */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Select Portion Quantity
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1, 1.5, 2].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setServingMultiplier(m)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      servingMultiplier === m
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {m}x Serving
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Macros Preview */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Total Calories</span>
                <span className="text-2xl font-black text-emerald-400">
                  {Math.round(selectedFood.calories * servingMultiplier)} <span className="text-xs font-normal text-slate-400">kcal</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-emerald-400 block font-bold">Protein</span>
                  <span className="font-bold text-white">{Math.round(selectedFood.protein * servingMultiplier * 10) / 10}g</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-amber-400 block font-bold">Carbs</span>
                  <span className="font-bold text-white">{Math.round(selectedFood.carbs * servingMultiplier * 10) / 10}g</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-rose-400 block font-bold">Fats</span>
                  <span className="font-bold text-white">{Math.round(selectedFood.fat * servingMultiplier * 10) / 10}g</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-teal-400 block font-bold">Fiber</span>
                  <span className="font-bold text-white">{Math.round(selectedFood.fiber * servingMultiplier * 10) / 10}g</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogFood}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Log to Food Diary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Food Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Add Custom Food / Home Recipe</span>
            </h3>

            <form onSubmit={handleCreateCustomFood} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Food Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandma's Moong Sprout Thepla"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Hindi / Regional Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. मूंग थेपला"
                  value={customHindi}
                  onChange={(e) => setCustomHindi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Food Type</label>
                  <select
                    value={customIsVeg ? 'veg' : 'non_veg'}
                    onChange={(e) => setCustomIsVeg(e.target.value === 'veg')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="veg">🌱 Vegetarian</option>
                    <option value="non_veg">🍗 Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as FoodCategory)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="grains">Grains & Breads</option>
                    <option value="pulses">Pulses & Dals</option>
                    <option value="dairy">Dairy & Paneer</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="non-veg">Meats & Eggs</option>
                    <option value="healthy-fats">Nuts & Healthy Fats</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={customFat}
                    onChange={(e) => setCustomFat(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    value={customFiber}
                    onChange={(e) => setCustomFiber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Save to My Foods
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
