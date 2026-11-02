import type { Profile } from './types';

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  waterGoalMl: number;
  isMinor: boolean;
  warning: string | null;
  formulaNote: string;
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

export function calculateBMR(profile: Profile): number {
  const weight = Number(profile.weight) || 70;
  const height = Number(profile.height) || 170;
  const age = Number(profile.age) || 30;
  const sex = profile.sex || 'male';
  // Mifflin-St Jeor
  if (sex === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

export function calculateTDEE(profile: Profile): number {
  const bmr = calculateBMR(profile);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level] ?? 1.375;
  return bmr * multiplier;
}

export function calculateCalorieTarget(profile: Profile): number {
  const tdee = calculateTDEE(profile);
  const goal = profile.primary_goal || 'general_health';
  const age = Number(profile.age) || 30;
  const isMinor = age < 18;

  // Under-18: no aggressive deficit
  if (isMinor) {
    return Math.round(tdee);
  }

  switch (goal) {
    case 'fat_loss':
    case 'six_pack_core':
      return Math.round(tdee * 0.85); // 15% deficit
    case 'muscle_building':
    case 'bodybuilding':
      return Math.round(tdee * 1.1); // 10% surplus
    case 'strength':
      return Math.round(tdee * 1.05);
    case 'endurance':
    case 'athletic':
      return Math.round(tdee * 1.05);
    default:
      return Math.round(tdee);
  }
}

export function calculateMacroTargets(profile: Profile, calorieTarget: number): { protein: number; carbs: number; fat: number } {
  const weight = Number(profile.weight) || 70;
  const goal = profile.primary_goal || 'general_health';
  const age = Number(profile.age) || 30;
  const isMinor = age < 18;

  let proteinPerKg: number;
  let fatPct: number;

  if (isMinor) {
    proteinPerKg = 1.2;
    fatPct = 0.30;
  } else {
    switch (goal) {
      case 'fat_loss':
      case 'six_pack_core':
        proteinPerKg = 2.0;
        fatPct = 0.25;
        break;
      case 'muscle_building':
      case 'bodybuilding':
        proteinPerKg = 1.8;
        fatPct = 0.25;
        break;
      case 'strength':
        proteinPerKg = 1.6;
        fatPct = 0.30;
        break;
      case 'endurance':
        proteinPerKg = 1.4;
        fatPct = 0.25;
        break;
      default:
        proteinPerKg = 1.6;
        fatPct = 0.28;
        break;
    }
  }

  const protein = Math.round(weight * proteinPerKg);
  const fatCalories = calorieTarget * fatPct;
  const fat = Math.round(fatCalories / 9);
  const proteinCalories = protein * 4;
  const carbCalories = calorieTarget - proteinCalories - fatCalories;
  const carbs = Math.max(0, Math.round(carbCalories / 4));

  return { protein, carbs, fat };
}

export function calculateWaterGoal(profile: Profile): number {
  const weight = Number(profile.weight) || 70;
  const baseMl = weight * 35;
  const extra = profile.activity_level === 'high' ? 500 : profile.activity_level === 'moderate' ? 250 : 0;
  return Math.round((baseMl + extra) / 100) * 100;
}

export function getNutritionTargets(profile: Profile): NutritionTargets {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const calorieTarget = calculateCalorieTarget(profile);
  const macros = calculateMacroTargets(profile, calorieTarget);
  const waterGoalMl = calculateWaterGoal(profile);
  const age = Number(profile.age) || 30;
  const isMinor = age < 18;

  let warning: string | null = null;
  let formulaNote = 'Mifflin-St Jeor BMR × activity multiplier (TDEE).';

  if (isMinor) {
    formulaNote = 'Mifflin-St Jeor BMR × activity multiplier. Calorie deficit disabled for under-18.';
    warning = 'You are under 18. Calorie targets are set to maintenance. Please consult a healthcare professional before making dietary changes.';
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
    waterGoalMl,
    isMinor,
    warning,
    formulaNote,
  };
}
