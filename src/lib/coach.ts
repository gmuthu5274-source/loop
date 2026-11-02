import type { Profile } from './types';
import type { NutritionTargets } from './nutrition';
import type { Task, Workout, Meal, WaterLog } from './types';

type CoachContext = {
  profile: Profile;
  tasks: Task[];
  workouts: Workout[];
  meals: Meal[];
  waterLogs: WaterLog[];
  nutrition: NutritionTargets;
  todayCalories: number;
  todayWaterMl: number;
  streakDays: number;
};

type CoachResponse = { text: string; suggestions?: string[] };

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export function getCoachResponse(message: string, ctx: CoachContext): CoachResponse {
  const msg = message.toLowerCase().trim();
  const { profile, nutrition, tasks, workouts, meals, waterLogs } = ctx;
  const todayWorkouts = workouts.filter((w) => isToday(w.created_at));
  const todayMeals = meals.filter((m) => isToday(m.created_at));
  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Greetings
  if (/^(hi|hello|hey|greetings|yo|sup)\b/.test(msg)) {
    const name = profile.name?.split(' ')[0] || 'there';
    let text = `Hi ${name}! `;
    if (todayWorkouts.length > 0) text += `Great work logging a workout today. `;
    if (pendingTasks.length > 0) text += `You have ${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} pending. `;
    text += `How can I help with your fitness today?`;
    return { text, suggestions: ['Suggest a workout', 'How are my calories?', 'What should I eat?', 'Am I on track?'] };
  }

  // Calorie / nutrition questions
  if (msg.includes('calorie') || msg.includes('calories') || msg.includes('how much should i eat') || msg.includes('nutrition')) {
    let text = `Based on your profile, your daily calorie target is about ${nutrition.calorieTarget} kcal.\n\n`;
    text += `That breaks down to roughly ${nutrition.protein}g protein, ${nutrition.carbs}g carbs, and ${nutrition.fat}g fat.\n\n`;
    text += `Today you have logged ${Math.round(ctx.todayCalories)} kcal so far.`;
    if (nutrition.warning) text += `\n\nNote: ${nutrition.warning}`;
    return { text, suggestions: ['Suggest a meal', 'What about protein?', 'Explain my macros'] };
  }

  // Protein
  if (msg.includes('protein')) {
    return {
      text: `Your protein target is ${nutrition.protein}g per day. That is based on your weight (${profile.weight || '?'}kg) and goal (${profile.primary_goal || 'general health'}). Good sources: chicken, fish, eggs, lentils, paneer, Greek yogurt, tofu, and beans.`,
      suggestions: ['Suggest a high-protein meal', 'How much water should I drink?'],
    };
  }

  // Water
  if (msg.includes('water') || msg.includes('hydrat')) {
    return {
      text: `Your daily water goal is ${(nutrition.waterGoalMl / 1000).toFixed(1)}L. You have logged ${(ctx.todayWaterMl / 1000).toFixed(1)}L today. ${ctx.todayWaterMl >= nutrition.waterGoalMl ? 'Hydration goal reached - well done!' : 'Keep sipping steadily throughout the day.'}`,
      suggestions: ['How are my calories?', 'Suggest a workout'],
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

  // Meal / food suggestions
  if (msg.includes('meal') || msg.includes('eat') || msg.includes('food') || msg.includes('diet')) {
    const diet = profile.diet || '';
    let text = `With a daily target of ${nutrition.calorieTarget} kcal, aim for balanced meals.\n\n`;
    if (diet.toLowerCase().includes('veg')) {
      text += `Some good vegetarian options: dal with rice, paneer tikka, Greek yogurt with fruit, oatmeal with nuts, quinoa salad.\n\n`;
    } else {
      text += `Some good options: grilled chicken with rice, fish curry, scrambled eggs with toast, dal with rice, Greek yogurt bowl.\n\n`;
    }
    text += `Try to include protein in every meal and keep portions mindful. You can log meals in the Meals tab to track your intake.`;
    return { text, suggestions: ['How much protein do I need?', 'Suggest a workout'] };
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
    return { text, suggestions: ['Suggest a workout', 'What should I eat?', 'How are my calories?'] };
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
        suggestions: ['Suggest a workout', 'How are my calories?'],
      };
    }
    if (goal === 'muscle_building' || goal === 'bodybuilding' || goal === 'strength') {
      return {
        text: `For muscle gain, you need a slight calorie surplus (about 10% above maintenance). Your target is ${nutrition.calorieTarget} kcal. Eat enough protein (${nutrition.protein}g/day), train with progressive overload, and prioritize sleep. Aim for 0.25-0.5kg per month gain.`,
        suggestions: ['Suggest a workout', 'How are my calories?'],
      };
    }
    return {
      text: `For general fitness, focus on consistent activity, balanced eating, and good sleep. Your calorie target is ${nutrition.calorieTarget} kcal. Mix strength training and cardio through the week, and listen to your body.`,
      suggestions: ['Suggest a workout', 'What should I eat?'],
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
      text: `I am your Loop Fit Coach. I can help with:\n\n- Workout suggestions based on your goal and equipment\n- Nutrition and calorie guidance\n- Tracking your daily progress\n- Staying motivated\n- Understanding your macros and water targets\n\nAsk me anything about your fitness journey!`,
      suggestions: ['Suggest a workout', 'How are my calories?', 'How am I doing?'],
    };
  }

  // Fallback
  return {
    text: `I understand you are asking about "${message}". I can help with workouts, nutrition, calories, water, progress, motivation, and recovery. Try one of the suggestions below, or ask me more specifically.`,
    suggestions: ['Suggest a workout', 'How are my calories?', 'How am I doing?', 'What should I eat?'],
  };
}
