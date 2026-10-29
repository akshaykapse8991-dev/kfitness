export interface SamplePlate {
  id: string;
  title: string;
  cuisine: string;
  isVeg: boolean;
  thumbnail: string;
  description: string;
  mockResult: {
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
  };
}

export const SAMPLE_PLATES: SamplePlate[] = [
  {
    id: 'plate-thali-veg',
    title: 'North Indian Veg Thali',
    cuisine: 'Indian Vegetarian',
    isVeg: true,
    thumbnail: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    description: '2 Phulka Rotis, Yellow Dal Tadka, Paneer Bhurji & fresh Cucumber Salad.',
    mockResult: {
      mealName: 'High-Protein North Indian Vegetarian Thali',
      items: [
        {
          name: 'Whole Wheat Phulka Roti',
          portionDescription: '2 medium rotis',
          estimatedGrams: 90,
          calories: 208,
          protein: 6.8,
          carbs: 44.0,
          fat: 1.0,
          fiber: 5.6,
          isVeg: true,
        },
        {
          name: 'Yellow Moong Dal Tadka',
          portionDescription: '1 medium bowl (katori)',
          estimatedGrams: 150,
          calories: 145,
          protein: 9.2,
          carbs: 22.0,
          fat: 2.0,
          fiber: 4.5,
          isVeg: true,
        },
        {
          name: 'Paneer Bhurji (Low Oil)',
          portionDescription: '1 serving / 100g',
          estimatedGrams: 100,
          calories: 210,
          protein: 16.5,
          carbs: 4.0,
          fat: 14.0,
          fiber: 1.0,
          isVeg: true,
        },
        {
          name: 'Fresh Cucumber & Tomato Salad',
          portionDescription: '1 plate with lemon dressing',
          estimatedGrams: 120,
          calories: 28,
          protein: 1.2,
          carbs: 5.5,
          fat: 0.2,
          fiber: 2.0,
          isVeg: true,
        },
      ],
      totalCalories: 591,
      totalProtein: 33.7,
      totalCarbs: 75.5,
      totalFat: 17.2,
      totalFiber: 13.1,
      healthScore: 9,
      verdict: 'Extremely well-balanced Indian meal! High fiber from whole wheat and dal, exceptional plant & dairy protein (33g+), and low refined fats.',
      suggestions: [
        'Add a small bowl of curd (dahi) or glass of buttermilk (chaas) to boost calcium and probiotics.',
        'Perfect for lunchtime before an evening workout session.',
      ],
    },
  },
  {
    id: 'plate-chicken-rice',
    title: 'Grilled Chicken Breast, Basmati & Greens',
    cuisine: 'Fitness Clean Non-Veg',
    isVeg: false,
    thumbnail: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
    description: '150g grilled chicken breast, steamed basmati rice, sautéed green beans & carrots.',
    mockResult: {
      mealName: 'Clean Bodybuilder Chicken & Basmati Rice Plate',
      items: [
        {
          name: 'Grilled Herb Chicken Breast',
          portionDescription: '150g cooked fillet',
          estimatedGrams: 150,
          calories: 248,
          protein: 46.5,
          carbs: 0.0,
          fat: 5.4,
          fiber: 0.0,
          isVeg: false,
        },
        {
          name: 'Steamed White Basmati Rice',
          portionDescription: '1 katori cooked',
          estimatedGrams: 150,
          calories: 195,
          protein: 4.0,
          carbs: 43.0,
          fat: 0.5,
          fiber: 0.8,
          isVeg: true,
        },
        {
          name: 'Sautéed French Beans & Carrots',
          portionDescription: '1 bowl with light olive oil',
          estimatedGrams: 100,
          calories: 55,
          protein: 2.0,
          carbs: 9.0,
          fat: 1.5,
          fiber: 3.5,
          isVeg: true,
        },
      ],
      totalCalories: 498,
      totalProtein: 52.5,
      totalCarbs: 52.0,
      totalFat: 7.4,
      totalFiber: 4.3,
      healthScore: 10,
      verdict: 'Peak muscle-building nutrient density! High biological value protein over 50g with lean complex carbohydrates and micro-nutrients.',
      suggestions: [
        'Squeeze fresh lemon over the chicken for iron absorption and flavor.',
        'Optimal post-workout recovery meal within 1-2 hours of lifting.',
      ],
    },
  },
  {
    id: 'plate-south-indian',
    title: 'Steamed Idlis with Vegetable Sambar & Coconut Chutney',
    cuisine: 'South Indian Vegetarian',
    isVeg: true,
    thumbnail: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    description: '3 soft steamed idlis, 1 bowl vegetable sambar & 1 tbsp fresh coconut chutney.',
    mockResult: {
      mealName: 'South Indian Fermented Breakfast Plate',
      items: [
        {
          name: 'Steamed Rice-Urad Dal Idlis',
          portionDescription: '3 medium pieces',
          estimatedGrams: 150,
          calories: 195,
          protein: 6.0,
          carbs: 42.0,
          fat: 0.6,
          fiber: 2.4,
          isVeg: true,
        },
        {
          name: 'Vegetable Lentil Sambar',
          portionDescription: '1 medium bowl (150g)',
          estimatedGrams: 150,
          calories: 120,
          protein: 5.5,
          carbs: 18.0,
          fat: 3.0,
          fiber: 4.0,
          isVeg: true,
        },
        {
          name: 'Fresh Coconut Chutney with Tadka',
          portionDescription: '1.5 tbsp (30g)',
          estimatedGrams: 30,
          calories: 85,
          protein: 1.2,
          carbs: 3.0,
          fat: 8.0,
          fiber: 1.5,
          isVeg: true,
        },
      ],
      totalCalories: 400,
      totalProtein: 12.7,
      totalCarbs: 63.0,
      totalFat: 11.6,
      totalFiber: 7.9,
      healthScore: 8,
      verdict: 'Gut-friendly fermented breakfast with high digestibility, zero refined flours, and natural electrolytes.',
      suggestions: [
        'To elevate protein to 20g+, pair with a glass of warm milk, boiled egg whites, or a cup of spiced sprouted moong.',
      ],
    },
  },
];
