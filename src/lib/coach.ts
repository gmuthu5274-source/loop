import type { Profile } from './types';
import type { NutrientTargets } from '@/utils/nutritionEngine';
import type { Task, Workout, Meal, WaterLog } from './types';
import { findFoodByName, estimateFoodMicronutrients, foodDatabase, type Food } from './foodDatabase';
import { getProteinRichFoods, getIronRichFoods, getCalciumRichFoods, buildNutritionReport } from '@/utils/nutritionEngine';
import { supabase } from './supabase';

type CoachContext = {
  profile: Profile;
  tasks: Task[];
  workouts: Workout[];
  meals: Meal[];
  waterLogs: WaterLog[];
  nutrition: NutrientTargets;
  todayCalories: number;
  todayWaterMl: number;
  streakDays: number;
};

type CoachResponse = { text: string; suggestions?: string[] };
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * Calls the AI edge function for a real AI-powered response.
 * Returns null if the AI is unavailable, so the caller can fall back to rule-based responses.
 */
export async function getAIResponse(
  conversation: ChatMessage[],
  ctx: CoachContext,
): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: conversation,
          profile: ctx.profile,
          nutrition: {
            calorieTarget: ctx.nutrition.calorieTarget,
            protein: ctx.nutrition.protein,
            carbs: ctx.nutrition.carbs,
            fat: ctx.nutrition.fat,
            fibre: ctx.nutrition.fibre,
            waterGoalMl: ctx.nutrition.waterGoalMl,
            isMinor: ctx.nutrition.isMinor,
            warning: ctx.nutrition.warning,
            micronutrients: ctx.nutrition.micronutrients,
          },
          todayCalories: ctx.todayCalories,
          todayWaterMl: ctx.todayWaterMl,
          streakDays: ctx.streakDays,
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.text && typeof data.text === 'string') {
      return data.text;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate suggestions based on the message context.
 * Used as fallback suggestions when the AI responds without them.
 */
function getContextualSuggestions(msg: string): string[] {
  if (msg.includes('workout') || msg.includes('exercise')) return ['How are my calories?', 'What should I eat?', 'Show my progress'];
  if (msg.includes('calorie') || msg.includes('nutrition')) return ['Suggest a meal', 'What about protein?', 'Show my nutrition report'];
  if (msg.includes('protein')) return ['Suggest a high-protein meal', 'What foods are high in protein?', 'How much water should I drink?'];
  if (msg.includes('water')) return ['How are my calories?', 'Suggest a workout', 'Show my nutrition report'];
  if (msg.includes('meal') || msg.includes('eat') || msg.includes('food')) return ['How much protein do I need?', 'What foods are high in iron?', 'Show my nutrition report'];
  return ['Suggest a workout', 'How are my calories?', 'Show my nutrition report', 'What should I eat?'];
}

/**
 * Get the full coach response: tries AI first, falls back to rule-based.
 */
export async function getCoachResponseAsync(
  message: string,
  conversation: ChatMessage[],
  ctx: CoachContext,
): Promise<CoachResponse> {
  const aiText = await getAIResponse(conversation, ctx);
  if (aiText) {
    return { text: aiText, suggestions: getContextualSuggestions(message.toLowerCase()) };
  }
  return getCoachResponse(message, ctx);
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function dietFilter(profile: Profile): (food: Food) => boolean {
  const diet = (profile.diet || '').toLowerCase();
  if (diet.includes('vegan')) {
    return (f) => !/chicken|mutton|beef|lamb|fish|prawn|shrimp|egg|paneer|cheese|yogurt|curd|milk|lassi|ghee|cream/i.test(f.name);
  }
  if (diet.includes('veg')) {
    return (f) => !/chicken|mutton|beef|lamb|fish|prawn|shrimp|egg/i.test(f.name);
  }
  return () => true;
}

function formatFoodList(foods: Food[], count: number): string {
  return foods.slice(0, count).map((f) => `- ${f.name} (${f.caloriesPerCup} kcal, ${f.proteinPerCup}g protein/cup)`).join('\n');
}

function formatNameList(names: string[], suffix: string): string {
  return names.slice(0, 10).map((n) => `- ${n}${suffix}`).join('\n');
}

export function getCoachResponse(message: string, ctx: CoachContext): CoachResponse {
  const msg = message.toLowerCase().trim();
  const { profile, nutrition, tasks, workouts, meals } = ctx;
  const todayWorkouts = workouts.filter((w) => isToday(w.created_at));
  const todayMeals = meals.filter((m) => isToday(m.created_at));
  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const matchesDiet = dietFilter(profile);

  // Greetings
  if (/^(hi|hello|hey|greetings|yo|sup)\b/.test(msg)) {
    const name = profile.name?.split(' ')[0] || 'there';
    let text = `Hi ${name}! `;
    if (todayWorkouts.length > 0) text += `Great work logging a workout today. `;
    if (pendingTasks.length > 0) text += `You have ${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} pending. `;
    text += `How can I help with your fitness today?`;
    return { text, suggestions: ['Suggest a workout', 'How are my calories?', 'What should I eat?', 'Show my nutrition report'] };
  }

  // Nutrition report
  if (msg.includes('nutrition report') || msg.includes('daily report') || msg.includes('my nutrition') || (msg.includes('micronutrient') && !msg.includes('rich'))) {
    const report = buildNutritionReport(profile, todayMeals, ctx.todayWaterMl);
    const calPct = Math.round((report.caloriesConsumed / report.calorieTarget) * 100);
    const proPct = Math.round((report.proteinConsumed / report.proteinTarget) * 100);
    const carbPct = Math.round((report.carbsConsumed / report.carbsTarget) * 100);
    const fatPct = Math.round((report.fatConsumed / report.fatTarget) * 100);
    const waterPct = Math.round((report.waterConsumedMl / report.waterTargetMl) * 100);
    const micro = report.micronutrientTargets;

    let text = `Here is your nutrition report for today:\n\n`;
    text += `Calories: ${report.caloriesConsumed} / ${report.calorieTarget} kcal (${calPct}%)\n`;
    text += `Protein: ${report.proteinConsumed} / ${report.proteinTarget}g (${proPct}%)\n`;
    text += `Carbs: ${report.carbsConsumed} / ${report.carbsTarget}g (${carbPct}%)\n`;
    text += `Fat: ${report.fatConsumed} / ${report.fatTarget}g (${fatPct}%)\n`;
    text += `Fibre: ${report.fibreTarget}g target\n`;
    text += `Water: ${(report.waterConsumedMl / 1000).toFixed(1)} / ${(report.waterTargetMl / 1000).toFixed(1)}L (${waterPct}%)\n\n`;
    text += `Daily micronutrient targets (DRI):\n`;
    text += `Calcium: ${micro.calcium}mg | Iron: ${micro.iron}mg | Zinc: ${micro.zinc}mg\n`;
    text += `Magnesium: ${micro.magnesium}mg | Potassium: ${micro.potassium}mg\n`;
    text += `Vitamin A: ${micro.vitaminA}mcg | Vitamin C: ${micro.vitaminC}mg | Vitamin D: ${micro.vitaminD}mcg\n`;
    text += `Vitamin B12: ${micro.vitaminB12}mcg | Folate: ${micro.folate}mcg\n`;

    if (report.warning) text += `\nNote: ${report.warning}`;

    if (calPct < 50) {
      text += `\nYou have room for more meals today. Try logging what you eat to see micronutrient progress.`;
    } else if (calPct > 110) {
      text += `\nYou are above your calorie target today. Consider a lighter dinner or extra activity.`;
    } else {
      text += `\nYou are on track - keep logging to stay aware of your micronutrient intake.`;
    }
    return { text, suggestions: ['What foods are high in iron?', 'Suggest a high-protein meal', 'How much water should I drink?'] };
  }

  // Specific food nutrient lookup: "how much protein is in X" / "nutrients in X"
  const foodMatch = msg.match(/(?:how much|what.*in|nutrients? in|nutrition of|tell me about)\s+(?:the\s+)?(.+)/);
  if (foodMatch && (msg.includes('protein') || msg.includes('nutrient') || msg.includes('calorie') || msg.includes('fat') || msg.includes('carb') || msg.includes('iron') || msg.includes('calcium') || msg.includes('fibre') || msg.includes('fiber') || msg.includes('vitamin'))) {
    const foodName = foodMatch[1].replace(/\?$/, '').trim();
    const food = findFoodByName(foodName);
    if (food) {
      const micro = estimateFoodMicronutrients(food);
      let text = `${food.name} (${food.cuisine}, ${food.category}):\n\n`;
      text += `Per 1 cup serving:\n`;
      text += `- Calories: ${food.caloriesPerCup} kcal\n`;
      text += `- Protein: ${food.proteinPerCup}g\n`;
      text += `- Carbs: ${food.carbsPerCup}g\n`;
      text += `- Fat: ${food.fatPerCup}g\n`;
      text += `- Fibre: ~${micro.fibre}g\n`;
      text += `- Calcium: ~${micro.calcium}mg\n`;
      text += `- Iron: ~${micro.iron}mg\n`;
      text += `- Potassium: ~${micro.potassium}mg\n`;
      text += `- Vitamin C: ~${micro.vitaminC}mg\n`;
      text += `- Folate: ~${micro.folate}mcg\n`;
      if (food.mealType) text += `\nBest for: ${food.mealType}`;
      return { text, suggestions: [`Suggest a meal with ${food.name.split(' ')[0].toLowerCase()}`, 'Show my nutrition report', 'What foods are high in protein?'] };
    }
  }

  // Calcium-rich foods
  if (msg.includes('calcium') && (msg.includes('rich') || msg.includes('high') || msg.includes('source') || msg.includes('food'))) {
    const names = getCalciumRichFoods();
    let text = `Here are calcium-rich foods:\n\n`;
    text += formatNameList(names, ' (high calcium)');
    text += `\n\nYour daily calcium target is ${nutrition.micronutrients.calcium}mg. Pair calcium with vitamin D for better absorption.`;
    return { text, suggestions: ['What foods are high in iron?', 'Show my nutrition report', 'How are my calories?'] };
  }

  // Iron-rich foods
  if (msg.includes('iron') && (msg.includes('rich') || msg.includes('high') || msg.includes('source') || msg.includes('food'))) {
    const names = getIronRichFoods();
    let text = `Here are iron-rich foods:\n\n`;
    text += formatNameList(names, ' (high iron)');
    const veg = (profile.diet || '').toLowerCase().includes('veg');
    text += `\n\nYour daily iron target is ${nutrition.micronutrients.iron}mg.${veg ? ' Pair iron-rich plant foods with vitamin C (citrus, bell pepper) to boost absorption.' : ' Heme iron from meat is absorbed more efficiently than plant iron.'}`;
    return { text, suggestions: ['What foods are high in calcium?', 'Show my nutrition report', 'Suggest a high-protein meal'] };
  }

  // Protein-rich foods
  if ((msg.includes('protein') || msg.includes('high-protein')) && (msg.includes('rich') || msg.includes('high') || msg.includes('source') || msg.includes('food') || msg.includes('list'))) {
    const dbFoods = foodDatabase.filter(matchesDiet);
    const foods = getProteinRichFoods(dbFoods, 10);
    let text = `Here are protein-rich foods from the database (filtered for your diet):\n\n`;
    text += formatFoodList(foods, 10);
    text += `\n\nYour protein target is ${nutrition.protein}g per day. Spread it across meals for best results.`;
    return { text, suggestions: ['Suggest a high-protein meal', 'How much water should I drink?', 'Show my nutrition report'] };
  }

  // Calorie / nutrition questions
  if (msg.includes('calorie') || msg.includes('calories') || msg.includes('how much should i eat') || (msg.includes('nutrition') && !msg.includes('report'))) {
    let text = `Based on your profile, your daily calorie target is about ${nutrition.calorieTarget} kcal.\n\n`;
    text += `That breaks down to roughly ${nutrition.protein}g protein, ${nutrition.carbs}g carbs, and ${nutrition.fat}g fat.\n`;
    text += `Fibre target: ${nutrition.fibre}g | Water goal: ${(nutrition.waterGoalMl / 1000).toFixed(1)}L\n\n`;
    text += `Today you have logged ${Math.round(ctx.todayCalories)} kcal so far.`;
    if (nutrition.warning) text += `\n\nNote: ${nutrition.warning}`;
    return { text, suggestions: ['Suggest a meal', 'What about protein?', 'Show my nutrition report', 'Explain my macros'] };
  }

  // Protein (general)
  if (msg.includes('protein')) {
    return {
      text: `Your protein target is ${nutrition.protein}g per day. That is based on your weight (${profile.weight || '?'}kg) and goal (${profile.primary_goal || 'general health'}). Good sources: chicken, fish, eggs, lentils, paneer, Greek yogurt, tofu, and beans.`,
      suggestions: ['Suggest a high-protein meal', 'What foods are high in protein?', 'How much water should I drink?'],
    };
  }

  // Water
  if (msg.includes('water') || msg.includes('hydrat')) {
    return {
      text: `Your daily water goal is ${(nutrition.waterGoalMl / 1000).toFixed(1)}L. You have logged ${(ctx.todayWaterMl / 1000).toFixed(1)}L today. ${ctx.todayWaterMl >= nutrition.waterGoalMl ? 'Hydration goal reached - well done!' : 'Keep sipping steadily throughout the day.'}`,
      suggestions: ['How are my calories?', 'Suggest a workout', 'Show my nutrition report'],
    };
  }

  // Workout suggestions
  if (msg.includes('workout') || msg.includes('exercise') || msg.includes('train') || msg.includes('suggest')) {
    const exp = profile.workout_experience || 'beginner';
    const location = profile.workout_location || 'both';
    const goal = profile.primary_goal || 'general_fitness';
    const duration = profile.preferred_duration || 30;

    let text = `Here is a suggestion for a ${duration}-min ${exp} session`;
    if (location === 'home') text += ` at home`;
    else if (location === 'gym') text += ` at the gym`;
    text += `:\n\n`;

    if (goal === 'fat_loss' || goal === 'six_pack_core') {
      text += `1. Jumping Jacks - 2 min warmup\n2. Bodyweight Squats - 3 sets of 12\n3. Push Ups - 3 sets of 8-10\n4. Mountain Climbers - 3 sets of 30 sec\n5. Plank - 3 sets of 30 sec\n6. Burpees - 3 sets of 8\n\nFocus on minimal rest between sets to keep your heart rate up.`;
    } else if (goal === 'muscle_building' || goal === 'bodybuilding' || goal === 'strength') {
      if (location === 'home') {
        text += `1. Push Ups - 4 sets of 10-15\n2. Pull Ups - 4 sets of 6-10\n3. Bulgarian Split Squats - 3 sets of 10/leg\n4. Pike Push Ups - 3 sets of 8\n5. Plank - 3 sets of 45 sec\n\nControl the tempo - 2 seconds down, 1 second up.`;
      } else {
        text += `1. Barbell Squat - 4 sets of 8\n2. Bench Press - 4 sets of 8\n3. Barbell Row - 4 sets of 8\n4. Overhead Press - 3 sets of 10\n5. Lat Pulldown - 3 sets of 10\n\nRest 90 sec between sets. Use 70-75% of your 1RM.`;
      }
    } else {
      text += `1. Jumping Jacks - 2 min warmup\n2. Bodyweight Squats - 3 sets of 12\n3. Push Ups - 3 sets of 10\n4. Glute Bridge - 3 sets of 15\n5. Plank - 3 sets of 30 sec\n6. Cool down with stretches\n\nKeep it sustainable - consistency matters more than intensity.`;
    }

    if (todayWorkouts.length > 0) text += `\n\nYou have already logged a workout today - nice!`;
    return { text, suggestions: ['How are my calories?', 'Show my progress', 'What should I eat?'] };
  }

  // Meal / food suggestions - uses real database
  if (msg.includes('meal') || msg.includes('eat') || msg.includes('food') || msg.includes('diet') || msg.includes('what should i')) {
    const mealType = msg.includes('breakfast') ? 'Breakfast' : msg.includes('lunch') ? 'Lunch' : msg.includes('dinner') ? 'Dinner' : msg.includes('snack') ? 'Snack' : null;
    const isHighProtein = msg.includes('high-protein') || msg.includes('protein');

    let candidates = foodDatabase.filter(matchesDiet);
    if (mealType) candidates = candidates.filter((f) => f.mealType === mealType);
    if (isHighProtein) candidates = candidates.filter((f) => f.proteinPerCup >= 15).sort((a, b) => b.proteinPerCup - a.proteinPerCup);
    else candidates = candidates.filter((f) => f.caloriesPerCup >= 100 && f.caloriesPerCup <= 350);

    const picks = candidates.slice(0, 6);
    let text = `With a daily target of ${nutrition.calorieTarget} kcal, here are some suggestions`;
    if (mealType) text += ` for ${mealType.toLowerCase()}`;
    if (isHighProtein) text += ` focused on protein`;
    text += `:\n\n`;
    text += formatFoodList(picks, 6);
    text += `\n\nTry to include protein in every meal and keep portions mindful. You can log meals in the Meals tab to track your intake.`;
    return { text, suggestions: ['How much protein do I need?', 'What foods are high in iron?', 'Show my nutrition report', 'Suggest a workout'] };
  }

  // Balanced meal suggestion
  if (msg.includes('balanced') || msg.includes('healthy meal') || msg.includes('well-rounded')) {
    const foods = foodDatabase.filter(matchesDiet);
    const proteinPick = foods.filter((f) => f.proteinPerCup >= 15).sort(() => 0.5 - Math.random())[0];
    const carbPick = foods.filter((f) => f.mealType === 'Lunch' && f.carbsPerCup >= 25 && f.proteinPerCup < 10).sort(() => 0.5 - Math.random())[0];
    const vegPick = foods.filter((f) => f.caloriesPerCup < 150 && f.proteinPerCup < 8).sort(() => 0.5 - Math.random())[0];
    let text = `Here is a balanced meal idea:\n\n`;
    text += `1. ${proteinPick?.name || 'Grilled Chicken'} - protein source (~${proteinPick?.proteinPerCup || 25}g protein)\n`;
    text += `2. ${carbPick?.name || 'Brown Rice'} - carb base (~${carbPick?.carbsPerCup || 30}g carbs)\n`;
    text += `3. ${vegPick?.name || 'Mixed Salad'} - fibre and micronutrients (~${vegPick?.caloriesPerCup || 80} kcal)\n\n`;
    text += `This gives you a good balance of protein, carbs, fibre, and essential vitamins. Log it in the Meals tab to see how it fits your daily targets.`;
    return { text, suggestions: ['Show my nutrition report', 'What foods are high in calcium?', 'Suggest a workout'] };
  }

  // Progress / on track
  if (msg.includes('progress') || msg.includes('on track') || msg.includes('how am i doing') || msg.includes('status')) {
    let text = `Here is your snapshot:\n\n`;
    text += `Streak: ${ctx.streakDays} days\n`;
    text += `Tasks today: ${completedTasks.length} done, ${pendingTasks.length} pending\n`;
    text += `Workouts today: ${todayWorkouts.length}\n`;
    text += `Meals today: ${todayMeals.length} (${Math.round(ctx.todayCalories)} kcal of ${nutrition.calorieTarget} target)\n`;
    text += `Water: ${(ctx.todayWaterMl / 1000).toFixed(1)}L of ${(nutrition.waterGoalMl / 1000).toFixed(1)}L\n\n`;

    if (pendingTasks.length > 0) {
      text += `Next step: complete your pending tasks to keep your streak going.`;
    } else if (todayWorkouts.length === 0) {
      text += `Next step: consider logging a quick workout today.`;
    } else {
      text += `You are doing great - keep it up!`;
    }
    return { text, suggestions: ['Suggest a workout', 'What should I eat?', 'Show my nutrition report', 'How are my calories?'] };
  }

  // Streaks
  if (msg.includes('streak')) {
    const streakText = ctx.streakDays >= 7
      ? "You've earned your 7-day certificate - amazing!"
      : ctx.streakDays >= 3
      ? "You're building momentum! Keep going for your 7-day certificate."
      : 'Every day counts. Log a workout, meal, or task to keep it alive.';
    return {
      text: `Your current streak is ${ctx.streakDays} day${ctx.streakDays !== 1 ? 's' : ''}. ${streakText}`,
      suggestions: ['How am I doing?', 'Suggest a workout'],
    };
  }

  // Weight / body
  if (msg.includes('weight') || msg.includes('lose') || msg.includes('gain') || msg.includes('muscle')) {
    const goal = profile.primary_goal || 'general_health';
    if (goal === 'fat_loss' || goal === 'six_pack_core') {
      return {
        text: `For fat loss, the key is a sustainable calorie deficit (about 15% below your maintenance). Your target is ${nutrition.calorieTarget} kcal. Combine that with regular strength training to preserve muscle, and prioritize protein (${nutrition.protein}g/day). Aim for 0.5-1% body weight per week.`,
        suggestions: ['Suggest a workout', 'How are my calories?', 'What foods are high in protein?'],
      };
    }
    if (goal === 'muscle_building' || goal === 'bodybuilding' || goal === 'strength') {
      return {
        text: `For muscle gain, you need a slight calorie surplus (about 10% above maintenance). Your target is ${nutrition.calorieTarget} kcal. Eat enough protein (${nutrition.protein}g/day), train with progressive overload, and prioritize sleep. Aim for 0.25-0.5kg per month gain.`,
        suggestions: ['Suggest a workout', 'How are my calories?', 'What foods are high in protein?'],
      };
    }
    return {
      text: `For general fitness, focus on consistent activity, balanced eating, and good sleep. Your calorie target is ${nutrition.calorieTarget} kcal. Mix strength training and cardio through the week, and listen to your body.`,
      suggestions: ['Suggest a workout', 'What should I eat?', 'Show my nutrition report'],
    };
  }

  // Motivation / feeling
  if (msg.includes('motivat') || msg.includes('tired') || msg.includes('lazy') || msg.includes('skip') || msg.includes('cannot')) {
    const name = profile.name?.split(' ')[0] || 'friend';
    const motivationMsg = profile.motivation
      ? `Remember why you started: "${profile.motivation}"`
      : 'Think about how good you will feel after moving.';
    return {
      text: `Hey ${name}, it is okay to feel that way. You do not have to be perfect - you just have to show up. Even a 10-minute walk counts. ${motivationMsg} Take the smallest step you can right now.`,
      suggestions: ['Suggest a short workout', 'How am I doing?'],
    };
  }

  // Rest / recovery
  if (msg.includes('rest') || msg.includes('recovery') || msg.includes('sore')) {
    return {
      text: `Rest is essential for progress. If you are sore or fatigued, take an active recovery day: light stretching, a walk, or yoga. Make sure you are hydrating well and getting 7-9 hours of sleep. You can still log light activity to keep your streak going.`,
      suggestions: ['Suggest a workout', 'How much water should I drink?'],
    };
  }

  // Help
  if (msg.includes('help') || msg.includes('what can you do') || msg.includes('who are you')) {
    return {
      text: `I am your Loop Fit Coach. I can help with:\n\n- Workout suggestions based on your goal and equipment\n- Nutrition and calorie guidance\n- Tracking your daily progress\n- Staying motivated\n- Understanding your macros and water targets\n- Looking up nutrients in specific foods from the database\n- Finding calcium-rich, iron-rich, and protein-rich foods\n- Generating your daily nutrition report with micronutrient tracking\n\nAsk me anything about your fitness journey!`,
      suggestions: ['Suggest a workout', 'How are my calories?', 'Show my nutrition report', 'What foods are high in iron?'],
    };
  }

  // Fallback
  return {
    text: `I understand you are asking about "${message}". I can help with workouts, nutrition, calories, water, progress, motivation, recovery, food nutrient lookups, and micronutrient reports. Try one of the suggestions below, or ask me more specifically.`,
    suggestions: ['Suggest a workout', 'How are my calories?', 'Show my nutrition report', 'What foods are high in iron?', 'What should I eat?'],
  };
}
