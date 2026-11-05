// Re-export everything from the centralized nutrition engine.
// Existing imports from '@/lib/nutrition' continue to work.
export {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateProteinTarget,
  calculateMacroTargets,
  calculateFibreTarget,
  calculateWaterGoal,
  getMicronutrientTargets,
  getNutritionTargets,
  calculateServingNutrition,
  aggregateMealNutrition,
  buildNutritionReport,
  validateProfile,
  getProteinRichFoods,
  getIronRichFoods,
  getCalciumRichFoods,
  PIECE_SIZES,
  GRAM_SIZES,
  SMALL_MEDIUM_LARGE,
  CUP_SIZES,
  OIL_OPTIONS,
  SUGAR_OPTIONS,
} from '@/utils/nutritionEngine';

export type {
  NutrientTargets,
  Micronutrients,
  FoodNutrition,
  ServingSize,
  NutritionReport,
  MealNutritionTotals,
} from '@/utils/nutritionEngine';

// Keep backward-compatible alias — old code references NutritionTargets
import type { NutrientTargets } from '@/utils/nutritionEngine';
export type NutritionTargets = NutrientTargets;
