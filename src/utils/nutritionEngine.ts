import type { Profile } from '@/lib/types';

// ============================================================
// Scientific Nutrition Calculation Engine
// Centralized system for all nutrition calculations.
// References: Mifflin-St Jeor (adults), IOM/FNB DRIs,
//   pediatric energy estimation (Schofield/FAO when needed).
// ============================================================

export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'very_high';

export type Micronutrients = {
  fibre: number;       // g
  calcium: number;     // mg
  iron: number;        // mg
  zinc: number;        // mg
  magnesium: number;   // mg
  potassium: number;   // mg
  sodium: number;      // mg
  vitaminA: number;    // mcg RAE
  vitaminC: number;    // mg
  vitaminD: number;    // mcg
  vitaminB12: number;  // mcg
  folate: number;      // mcg DFE
};

export type NutrientTargets = {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  waterGoalMl: number;
  micronutrients: Micronutrients;
  isMinor: boolean;
  warning: string | null;
  formulaNote: string;
  estimateLabel: string;
};

// ---- Activity multipliers (IOM/FNB) ----
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.9,
};

function resolveActivity(level: string): ActivityLevel {
  const l = (level || 'light').toLowerCase();
  if (l === 'sedentary') return 'sedentary';
  if (l === 'light') return 'light';
  if (l === 'moderate') return 'moderate';
  if (l === 'high') return 'high';
  if (l === 'very_high' || l === 'extra') return 'very_high';
  return 'light';
}

function resolveSex(sex: string | null | undefined): Sex {
  return sex === 'female' ? 'female' : 'male';
}

// ---- BMR (Mifflin-St Jeor, adults 18+) ----
export function calculateBMR(profile: Profile): number {
  const weight = Number(profile.weight) || 70;
  const height = Number(profile.height) || 170;
  const age = Number(profile.age) || 30;
  const sex = resolveSex(profile.sex);
  if (sex === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

// ---- Pediatric energy estimation (Schofield, ages 3-17) ----
// Returns estimated TDEE including activity, used for under-18.
function pediatricTDEE(profile: Profile): number {
  const weight = Number(profile.weight) || 50;
  const age = Number(profile.age) || 14;
  const sex = resolveSex(profile.sex);
  const activity = resolveActivity(profile.activity_level);

  // Schofield equations (kcal/day) by age band and sex
  let bmr: number;
  if (age < 3) {
    bmr = sex === 'male' ? 0.001 * 60.9 * weight - 0.001 * 54 : 0.001 * 61 * weight - 0.001 * 51;
    bmr = Math.max(800, bmr);
  } else if (age <= 10) {
    bmr = sex === 'male' ? 0.001 * 22.7 * weight + 0.001 * 495 : 0.001 * 22.5 * weight + 0.001 * 499;
    bmr = Math.max(900, bmr);
  } else if (age <= 18) {
    bmr = sex === 'male' ? 0.001 * 17.5 * weight + 0.001 * 651 : 0.001 * 12.2 * weight + 0.001 * 746;
    bmr = Math.max(1000, bmr);
  } else {
    // fallback to Mifflin
    bmr = calculateBMR(profile);
  }

  // For minors, use a conservative activity factor — no surplus or deficit
  const factor = ACTIVITY_FACTORS[activity];
  return bmr * factor;
}

// ---- TDEE ----
export function calculateTDEE(profile: Profile): number {
  const age = Number(profile.age) || 30;
  if (age < 18) {
    return pediatricTDEE(profile);
  }
  const bmr = calculateBMR(profile);
  const factor = ACTIVITY_FACTORS[resolveActivity(profile.activity_level)];
  return bmr * factor;
}

// ---- Calorie target ----
export function calculateCalorieTarget(profile: Profile): number {
  const tdee = calculateTDEE(profile);
  const goal = profile.primary_goal || 'general_health';
  const age = Number(profile.age) || 30;

  // Under-18: maintenance only — no deficit or surplus
  if (age < 18) {
    return Math.round(tdee);
  }

  switch (goal) {
    case 'fat_loss':
    case 'six_pack_core':
      return Math.round(tdee * 0.85); // 15% deficit
    case 'muscle_building':
    case 'bodybuilding':
      return Math.round(tdee * 1.1);  // 10% surplus
    case 'strength':
    case 'endurance':
    case 'athletic':
      return Math.round(tdee * 1.05);
    default:
      return Math.round(tdee);
  }
}

// ---- Protein (age-specific DRI references) ----
export function calculateProteinTarget(profile: Profile): number {
  const weight = Number(profile.weight) || 70;
  const age = Number(profile.age) || 30;
  const goal = profile.primary_goal || 'general_health';

  // Ages 14-18: ~0.85 g/kg/day educational reference (IOM RDA for adolescents)
  if (age >= 14 && age < 18) {
    return Math.round(weight * 0.85);
  }
  // Under 14: use RDA-equivalent 0.95 g/kg
  if (age < 14) {
    return Math.round(weight * 0.95);
  }

  // Adult values by goal
  switch (goal) {
    case 'fat_loss':
    case 'six_pack_core':
      return Math.round(weight * 2.0);
    case 'muscle_building':
    case 'bodybuilding':
      return Math.round(weight * 1.8);
    case 'strength':
      return Math.round(weight * 1.6);
    case 'endurance':
    case 'athletic':
      return Math.round(weight * 1.4);
    default:
      return Math.round(weight * 1.6);
  }
}

// ---- Macro targets (protein, carbs, fat) ----
export function calculateMacroTargets(profile: Profile, calorieTarget: number): { protein: number; carbs: number; fat: number } {
  const protein = calculateProteinTarget(profile);
  const age = Number(profile.age) || 30;
  const goal = profile.primary_goal || 'general_health';

  let fatPct: number;
  if (age < 18) {
    fatPct = 0.30;
  } else if (goal === 'fat_loss' || goal === 'six_pack_core' || goal === 'muscle_building' || goal === 'bodybuilding') {
    fatPct = 0.25;
  } else if (goal === 'endurance' || goal === 'athletic') {
    fatPct = 0.25;
  } else {
    fatPct = 0.28;
  }

  const fatCalories = calorieTarget * fatPct;
  const fat = Math.round(fatCalories / 9);
  const proteinCalories = protein * 4;
  const carbCalories = Math.max(0, calorieTarget - proteinCalories - fatCalories);
  const carbs = Math.round(carbCalories / 4);

  return { protein, carbs, fat };
}

// ---- Fibre target ----
// Adults: 14 g per 1000 kcal (IOM). Minors: age + 5 g (conservative).
export function calculateFibreTarget(profile: Profile, calorieTarget: number): number {
  const age = Number(profile.age) || 30;
  if (age < 18) {
    return Math.min(35, age + 5);
  }
  return Math.round((14 * calorieTarget) / 1000);
}

// ---- Water goal ----
// Adults: weight-based ~30-35 ml/kg + activity adjustment.
// Adolescents: IOM AI reference (2.4-3.3 L total water incl. food).
// Returns drinking water recommendation (not total water).
export function calculateWaterGoal(profile: Profile): number {
  const weight = Number(profile.weight) || 70;
  const age = Number(profile.age) || 30;
  const activity = resolveActivity(profile.activity_level);

  if (age < 18) {
    // IOM AI for total water; ~80% from drinking fluids
    let totalWaterMl: number;
    if (age <= 8) totalWaterMl = 1600;
    else if (age <= 13) totalWaterMl = 2100;
    else totalWaterMl = 2600;
    const drinkingMl = totalWaterMl * 0.8;
    const extra = activity === 'high' ? 300 : activity === 'moderate' ? 150 : 0;
    return Math.round((drinkingMl + extra) / 100) * 100;
  }

  const baseMl = weight * 33;
  const extra = activity === 'very_high' ? 700 : activity === 'high' ? 500 : activity === 'moderate' ? 250 : 0;
  return Math.round((baseMl + extra) / 100) * 100;
}

// ============================================================
// Micronutrient DRI database (IOM/FNB)
// Age- and sex-specific reference values for daily intake.
// ============================================================

type DRIKey = keyof Micronutrients;

type DRIBand = {
  ageMin: number;
  ageMax: number;
  sex: Sex | 'both';
  values: Micronutrients;
};

const DRI_TABLE: DRIBand[] = [
  // Ages 9-13 (both sexes, mostly same except iron)
  { ageMin: 9, ageMax: 13, sex: 'male', values: { fibre: 31, calcium: 1300, iron: 8, zinc: 8, magnesium: 240, potassium: 4500, sodium: 1800, vitaminA: 600, vitaminC: 45, vitaminD: 15, vitaminB12: 1.8, folate: 300 } },
  { ageMin: 9, ageMax: 13, sex: 'female', values: { fibre: 26, calcium: 1300, iron: 8, zinc: 8, magnesium: 240, potassium: 4500, sodium: 1800, vitaminA: 600, vitaminC: 45, vitaminD: 15, vitaminB12: 1.8, folate: 300 } },
  // Ages 14-18
  { ageMin: 14, ageMax: 18, sex: 'male', values: { fibre: 38, calcium: 1300, iron: 11, zinc: 11, magnesium: 410, potassium: 4700, sodium: 2300, vitaminA: 900, vitaminC: 75, vitaminD: 15, vitaminB12: 2.4, folate: 400 } },
  { ageMin: 14, ageMax: 18, sex: 'female', values: { fibre: 26, calcium: 1300, iron: 15, zinc: 9, magnesium: 360, potassium: 4700, sodium: 2300, vitaminA: 700, vitaminC: 65, vitaminD: 15, vitaminB12: 2.4, folate: 400 } },
  // Ages 19-50
  { ageMin: 19, ageMax: 50, sex: 'male', values: { fibre: 38, calcium: 1000, iron: 8, zinc: 11, magnesium: 400, potassium: 4700, sodium: 2300, vitaminA: 900, vitaminC: 90, vitaminD: 15, vitaminB12: 2.4, folate: 400 } },
  { ageMin: 19, ageMax: 50, sex: 'female', values: { fibre: 25, calcium: 1000, iron: 18, zinc: 8, magnesium: 310, potassium: 4700, sodium: 2300, vitaminA: 700, vitaminC: 75, vitaminD: 15, vitaminB12: 2.4, folate: 400 } },
  // Ages 51-70
  { ageMin: 51, ageMax: 70, sex: 'male', values: { fibre: 30, calcium: 1000, iron: 8, zinc: 11, magnesium: 420, potassium: 4700, sodium: 2300, vitaminA: 900, vitaminC: 90, vitaminD: 15, vitaminB12: 2.4, folate: 400 } },
  { ageMin: 51, ageMax: 70, sex: 'female', values: { fibre: 21, calcium: 1200, iron: 8, zinc: 8, magnesium: 320, potassium: 4700, sodium: 2300, vitaminA: 700, vitaminC: 75, vitaminD: 15, vitaminB12: 2.4, folate: 400 } },
  // Ages 70+
  { ageMin: 71, ageMax: 200, sex: 'male', values: { fibre: 30, calcium: 1200, iron: 8, zinc: 11, magnesium: 420, potassium: 4700, sodium: 1800, vitaminA: 900, vitaminC: 90, vitaminD: 20, vitaminB12: 2.4, folate: 400 } },
  { ageMin: 71, ageMax: 200, sex: 'female', values: { fibre: 21, calcium: 1200, iron: 8, zinc: 8, magnesium: 320, potassium: 4700, sodium: 1800, vitaminA: 700, vitaminC: 75, vitaminD: 20, vitaminB12: 2.4, folate: 400 } },
];

function getDRIValues(age: number, sex: Sex): Micronutrients {
  for (const band of DRI_TABLE) {
    if (age >= band.ageMin && age <= band.ageMax && (band.sex === 'both' || band.sex === sex)) {
      return band.values;
    }
  }
  // Fallback: adult 19-50 of given sex
  const fallback = DRI_TABLE.find((b) => b.ageMin === 19 && b.sex === sex) || DRI_TABLE.find((b) => b.ageMin === 19 && b.sex === 'male')!;
  return fallback.values;
}

export function getMicronutrientTargets(profile: Profile): Micronutrients {
  const age = Number(profile.age) || 30;
  const sex = resolveSex(profile.sex);
  return getDRIValues(age, sex);
}

// ---- Full nutrition targets (single entry point) ----
export function getNutritionTargets(profile: Profile): NutrientTargets {
  const age = Number(profile.age) || 30;
  const isMinor = age < 18;

  const bmr = isMinor ? pediatricTDEE(profile) / ACTIVITY_FACTORS[resolveActivity(profile.activity_level)] : calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const calorieTarget = calculateCalorieTarget(profile);
  const macros = calculateMacroTargets(profile, calorieTarget);
  const fibre = calculateFibreTarget(profile, calorieTarget);
  const waterGoalMl = calculateWaterGoal(profile);
  const micronutrients = getMicronutrientTargets(profile);

  let warning: string | null = null;
  let formulaNote: string;
  let estimateLabel: string;

  if (isMinor) {
    formulaNote = 'Pediatric/adolescent energy estimation (Schofield) x activity factor. Calorie deficit disabled for under-18.';
    estimateLabel = 'Estimated maintenance energy (educational reference)';
    warning = 'You are under 18. Calorie targets are set to maintenance for healthy growth and development. Please consult a qualified healthcare professional before making dietary changes.';
  } else {
    formulaNote = 'Mifflin-St Jeor BMR x activity multiplier (TDEE).';
    estimateLabel = 'Estimated daily energy need';
  }

  if (!profile.weight || !profile.height || !profile.age) {
    warning = 'Some profile details are missing, so estimates may be less accurate. Complete your profile for better results.';
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    fibre,
    waterGoalMl,
    micronutrients,
    isMinor,
    warning,
    formulaNote,
    estimateLabel,
  };
}

// ============================================================
// Food nutrient data — extended type for micronutrient tracking
// ============================================================

export type FoodNutrition = {
  name: string;
  servingSize: string;
  caloriesPerServing: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  calcium: number;
  iron: number;
  zinc: number;
  magnesium: number;
  potassium: number;
  sodium: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
  folate: number;
  isVerified: boolean;
};

// ---- Serving size helpers ----
export type ServingSize = {
  label: string;
  multiplier: number;
};

export const PIECE_SIZES: ServingSize[] = [
  { label: '1 piece', multiplier: 1 },
  { label: '2 pieces', multiplier: 2 },
  { label: '3 pieces', multiplier: 3 },
];

export const GRAM_SIZES: ServingSize[] = [
  { label: '100g', multiplier: 1 },
  { label: '150g', multiplier: 1.5 },
  { label: '200g', multiplier: 2 },
];

export const SMALL_MEDIUM_LARGE: ServingSize[] = [
  { label: 'Small', multiplier: 0.75 },
  { label: 'Medium', multiplier: 1 },
  { label: 'Large', multiplier: 1.5 },
];

export const CUP_SIZES: ServingSize[] = [
  { label: '1/2 cup', multiplier: 0.5 },
  { label: '1 cup', multiplier: 1 },
  { label: '1.5 cups', multiplier: 1.5 },
  { label: '2 cups', multiplier: 2 },
];

// ---- Oil adjustment (cooking oil calories) ----
export const OIL_OPTIONS: { label: string; extraCalories: number; extraFat: number }[] = [
  { label: 'No extra oil', extraCalories: 0, extraFat: 0 },
  { label: '1 tsp oil', extraCalories: 40, extraFat: 4.5 },
  { label: '2 tsp oil', extraCalories: 80, extraFat: 9 },
  { label: '1 tbsp oil', extraCalories: 120, extraFat: 13.5 },
];

// ---- Sugar adjustment ----
export const SUGAR_OPTIONS: { label: string; extraCalories: number; extraCarbs: number }[] = [
  { label: 'No extra sugar', extraCalories: 0, extraCarbs: 0 },
  { label: '1 tsp sugar', extraCalories: 16, extraCarbs: 4 },
  { label: '2 tsp sugar', extraCalories: 32, extraCarbs: 8 },
  { label: '1 tbsp sugar', extraCalories: 48, extraCarbs: 12 },
];

// ---- Calculate nutrition for a specific serving size ----
export function calculateServingNutrition(
  baseCalories: number,
  baseProtein: number,
  baseCarbs: number,
  baseFat: number,
  servingMultiplier: number,
  oilExtra?: { extraCalories: number; extraFat: number },
  sugarExtra?: { extraCalories: number; extraCarbs: number },
) {
  const calories = Math.round((baseCalories * servingMultiplier + (oilExtra?.extraCalories || 0) + (sugarExtra?.extraCalories || 0)) * 10) / 10;
  const protein = Math.round(baseProtein * servingMultiplier * 10) / 10;
  const carbs = Math.round((baseCarbs * servingMultiplier + (sugarExtra?.extraCarbs || 0)) * 10) / 10;
  const fat = Math.round((baseFat * servingMultiplier + (oilExtra?.extraFat || 0)) * 10) / 10;
  return { calories, protein, carbs, fat };
}

// ---- Aggregate nutrition from logged meals ----
export type MealNutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function aggregateMealNutrition(meals: Array<{ calories: number; protein: number; carbs: number; fat: number }>): MealNutritionTotals {
  return meals.reduce((acc, m) => ({
    calories: acc.calories + Number(m.calories),
    protein: acc.protein + Number(m.protein),
    carbs: acc.carbs + Number(m.carbs),
    fat: acc.fat + Number(m.fat),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

// ---- Nutrient density helpers for AI coach ----
export function getProteinRichFoods(foodDb: Array<{ name: string; proteinPerCup: number }>, limit = 8): Array<{ name: string; proteinPerCup: number }> {
  return [...foodDb].sort((a, b) => b.proteinPerCup - a.proteinPerCup).slice(0, limit);
}

export function getIronRichFoods(): string[] {
  return ['Spinach', 'Lentils (Dal)', 'Chickpeas (Chana)', 'Tofu', 'Pumpkin Seeds', 'Fish Curry', 'Egg Curry', 'Rajma'];
}

export function getCalciumRichFoods(): string[] {
  return ['Milk', 'Curd (Yogurt)', 'Paneer', 'Almonds', 'Spinach', 'Sesame Seeds', 'Chia Seeds', 'Broccoli'];
}

// ---- Nutrition report generation for dashboard/coach ----
export type NutritionReport = {
  calorieTarget: number;
  caloriesConsumed: number;
  caloriesRemaining: number;
  proteinTarget: number;
  proteinConsumed: number;
  carbsTarget: number;
  carbsConsumed: number;
  fatTarget: number;
  fatConsumed: number;
  fibreTarget: number;
  waterTargetMl: number;
  waterConsumedMl: number;
  micronutrientTargets: Micronutrients;
  isMinor: boolean;
  warning: string | null;
  formulaNote: string;
  estimateLabel: string;
};

export function buildNutritionReport(
  profile: Profile,
  meals: Array<{ calories: number; protein: number; carbs: number; fat: number }>,
  waterConsumedMl: number,
): NutritionReport {
  const targets = getNutritionTargets(profile);
  const totals = aggregateMealNutrition(meals);

  return {
    calorieTarget: targets.calorieTarget,
    caloriesConsumed: Math.round(totals.calories),
    caloriesRemaining: Math.max(0, targets.calorieTarget - Math.round(totals.calories)),
    proteinTarget: targets.protein,
    proteinConsumed: Math.round(totals.protein),
    carbsTarget: targets.carbs,
    carbsConsumed: Math.round(totals.carbs),
    fatTarget: targets.fat,
    fatConsumed: Math.round(totals.fat),
    fibreTarget: targets.fibre,
    waterTargetMl: targets.waterGoalMl,
    waterConsumedMl,
    micronutrientTargets: targets.micronutrients,
    isMinor: targets.isMinor,
    warning: targets.warning,
    formulaNote: targets.formulaNote,
    estimateLabel: targets.estimateLabel,
  };
}

// ---- Validation ----
export function validateProfile(profile: Profile): string[] {
  const errors: string[] = [];
  if (!profile.age || Number(profile.age) < 1 || Number(profile.age) > 120) errors.push('Age must be between 1 and 120.');
  if (!profile.weight || Number(profile.weight) < 10 || Number(profile.weight) > 400) errors.push('Weight must be between 10 and 400 kg.');
  if (!profile.height || Number(profile.height) < 50 || Number(profile.height) > 300) errors.push('Height must be between 50 and 300 cm.');
  return errors;
}
