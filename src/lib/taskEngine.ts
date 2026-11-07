import type { Profile } from './types';

export type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  xp: number;
  category: string;
};

export type LuckyTask = {
  title: string;
  category: string;
  estMinutes: number;
};

export type QuickTask = {
  title: string;
  category: string;
  minutes: number;
};

export type BonusMission = {
  id: string;
  title: string;
  description: string;
  xp: number;
  target: number;
  progress: number;
  done: boolean;
};

const CHALLENGES: DailyChallenge[] = [
  { id: 'plank_challenge', title: 'Plank Master', description: 'Hold a plank for 60 seconds', xp: 30, category: 'fitness' },
  { id: 'water_boost', title: 'Hydration Hero', description: 'Drink 3 litres of water today', xp: 30, category: 'hydration' },
  { id: 'step_challenge', title: 'Step It Up', description: 'Walk or jog for 30 minutes', xp: 30, category: 'fitness' },
  { id: 'no_sugar', title: 'Sugar-Free Day', description: 'Avoid added sugar all day', xp: 30, category: 'nutrition' },
  { id: 'meditation', title: 'Mindful Minutes', description: 'Meditate for 10 minutes', xp: 30, category: 'wellness' },
  { id: 'early_rise', title: 'Early Bird', description: 'Wake up before 7 AM', xp: 30, category: 'sleep' },
  { id: 'protein_boost', title: 'Protein Power', description: 'Hit your protein target today', xp: 30, category: 'nutrition' },
  { id: 'stretch_day', title: 'Flexibility Focus', description: 'Do 15 minutes of stretching', xp: 30, category: 'fitness' },
  { id: 'study_session', title: 'Deep Study', description: 'Study without distractions for 45 minutes', xp: 30, category: 'study' },
  { id: 'sleep_early', title: 'Early to Bed', description: 'Be in bed by 10 PM tonight', xp: 30, category: 'sleep' },
  { id: 'stairs_challenge', title: 'Stair Climber', description: 'Take stairs instead of elevator all day', xp: 30, category: 'fitness' },
  { id: 'veggie_count', title: 'Eat the Rainbow', description: 'Eat 3 different coloured vegetables', xp: 30, category: 'nutrition' },
  { id: 'journal', title: 'Reflect & Write', description: 'Write down 3 things you are grateful for', xp: 30, category: 'personal' },
  { id: 'digital_detox', title: 'Digital Detox', description: 'No social media for 2 hours', xp: 30, category: 'wellness' },
];

const LUCKY_TASKS: LuckyTask[] = [
  { title: 'Take a 10-minute walk outside', category: 'fitness', estMinutes: 10 },
  { title: 'Do 20 push-ups', category: 'fitness', estMinutes: 5 },
  { title: 'Drink a glass of water right now', category: 'hydration', estMinutes: 1 },
  { title: 'Stretch your back for 5 minutes', category: 'wellness', estMinutes: 5 },
  { title: 'Eat a piece of fruit', category: 'nutrition', estMinutes: 2 },
  { title: 'Take 10 deep breaths', category: 'wellness', estMinutes: 2 },
  { title: 'Do 50 jumping jacks', category: 'fitness', estMinutes: 3 },
  { title: 'Hold a plank for 30 seconds', category: 'fitness', estMinutes: 1 },
  { title: 'Write down one goal for the week', category: 'personal', estMinutes: 5 },
  { title: 'Go up and down the stairs 3 times', category: 'fitness', estMinutes: 5 },
  { title: 'Do 15 squats', category: 'fitness', estMinutes: 3 },
  { title: 'Meditate for 5 minutes', category: 'wellness', estMinutes: 5 },
  { title: 'Read for 15 minutes', category: 'study', estMinutes: 15 },
  { title: 'Do 20 sit-ups', category: 'fitness', estMinutes: 3 },
  { title: 'Plan tomorrow\'s meals', category: 'nutrition', estMinutes: 10 },
  { title: 'Take a cold shower', category: 'wellness', estMinutes: 5 },
  { title: 'Practice a hobby for 15 minutes', category: 'personal', estMinutes: 15 },
  { title: 'Do 30 calf raises', category: 'fitness', estMinutes: 3 },
  { title: 'Write in a journal for 5 minutes', category: 'personal', estMinutes: 5 },
  { title: 'Do yoga for 10 minutes', category: 'fitness', estMinutes: 10 },
];

const QUICK_TASKS: QuickTask[] = [
  { title: 'Drink a glass of water', category: 'hydration', minutes: 2 },
  { title: 'Do 10 push-ups', category: 'fitness', minutes: 2 },
  { title: 'Stretch your neck and shoulders', category: 'wellness', minutes: 3 },
  { title: 'Take 5 deep breaths', category: 'wellness', minutes: 2 },
  { title: 'Do 20 squats', category: 'fitness', minutes: 3 },
  { title: 'Hold a plank for 20 seconds', category: 'fitness', minutes: 1 },
  { title: 'Eat a handful of nuts', category: 'nutrition', minutes: 2 },
  { title: 'Do 15 jumping jacks', category: 'fitness', minutes: 2 },
  { title: 'Write one thing you are grateful for', category: 'personal', minutes: 3 },
  { title: 'Stand up and walk around for 2 minutes', category: 'fitness', minutes: 2 },
  { title: 'Do 10 lunges', category: 'fitness', minutes: 3 },
  { title: 'Close your eyes and relax for 2 minutes', category: 'wellness', minutes: 2 },
];

function getDaySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

export function getDailyChallenge(): DailyChallenge {
  const seed = getDaySeed();
  return CHALLENGES[seed % CHALLENGES.length];
}

export function getLuckyTask(): LuckyTask {
  const seed = getDaySeed() * 7;
  return LUCKY_TASKS[seed % LUCKY_TASKS.length];
}

export function getQuickTasks(): QuickTask[] {
  const seed = getDaySeed() * 13;
  const shuffled = [...QUICK_TASKS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 4);
}

export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

export function getWeekendChallenge(): DailyChallenge {
  const weekendChallenges: DailyChallenge[] = [
    { id: 'weekend_hike', title: 'Weekend Adventure', description: 'Go for a long walk, hike, or outdoor activity', xp: 30, category: 'fitness' },
    { id: 'weekend_meal', title: 'Cook a Healthy Meal', description: 'Prepare a nutritious meal from scratch', xp: 30, category: 'nutrition' },
    { id: 'weekend_digital', title: 'Weekend Unplug', description: 'Spend 2 hours phone-free', xp: 30, category: 'wellness' },
    { id: 'weekend_family', title: 'Active Family Time', description: 'Do something active with family or friends', xp: 30, category: 'personal' },
  ];
  const seed = getDaySeed();
  return weekendChallenges[seed % weekendChallenges.length];
}

export function generateBonusMissions(
  tasksCompleted: number,
  totalTasks: number,
  todayWorkout: boolean,
  personalGoalsCompleted: number,
): BonusMission[] {
  return [
    {
      id: 'mission_3_tasks',
      title: 'Complete 3 Tasks',
      description: 'Finish 3 tasks today',
      xp: 25,
      target: 3,
      progress: Math.min(3, tasksCompleted),
      done: tasksCompleted >= 3,
    },
    {
      id: 'mission_workout',
      title: 'Finish Today\'s Workout',
      description: 'Log any workout today',
      xp: 25,
      target: 1,
      progress: todayWorkout ? 1 : 0,
      done: todayWorkout,
    },
    {
      id: 'mission_personal',
      title: 'Complete a Personal Goal',
      description: 'Finish one personal-category task',
      xp: 25,
      target: 1,
      progress: Math.min(1, personalGoalsCompleted),
      done: personalGoalsCompleted >= 1,
    },
  ];
}

export function getSmartTaskSuggestions(
  profile: Profile,
  completedTaskTitles: string[],
  limit = 5,
): { title: string; category: string; reason: string }[] {
  const goal = profile.primary_goal || 'general_health';
  const location = profile.workout_location || 'both';
  const experience = profile.workout_experience || 'beginner';

  const suggestions: { title: string; category: string; reason: string }[] = [];

  if (goal === 'fat_loss' || goal === 'general_fitness') {
    suggestions.push({ title: 'Take a 20-minute brisk walk', category: 'fitness', reason: 'Great for your fat loss goal' });
    suggestions.push({ title: 'Do 15 minutes of HIIT', category: 'fitness', reason: 'Boosts calorie burn' });
  }
  if (goal === 'muscle_building' || goal === 'bodybuilding' || goal === 'strength') {
    suggestions.push({ title: 'Do 3 sets of push-ups', category: 'fitness', reason: 'Builds strength for your goal' });
    suggestions.push({ title: 'Log a weight training session', category: 'fitness', reason: 'Key for muscle building' });
  }
  if (goal === 'six_pack_core') {
    suggestions.push({ title: 'Do a 5-minute core workout', category: 'fitness', reason: 'Targets your core goal' });
  }
  if (goal === 'general_health' || goal === 'weight_maintenance') {
    suggestions.push({ title: 'Take a 15-minute walk', category: 'fitness', reason: 'Supports overall health' });
    suggestions.push({ title: 'Eat a serving of vegetables', category: 'nutrition', reason: 'Boosts your nutrition' });
  }

  suggestions.push({ title: 'Drink 2L of water today', category: 'hydration', reason: 'Stay hydrated' });
  suggestions.push({ title: 'Sleep before 10 PM', category: 'sleep', reason: 'Recovery is essential' });

  if (location === 'home') {
    suggestions.push({ title: 'Do a 10-minute home workout', category: 'fitness', reason: 'No gym needed' });
  }
  if (location === 'gym') {
    suggestions.push({ title: 'Hit the gym for 30 minutes', category: 'fitness', reason: 'Make the most of your gym access' });
  }

  if (experience === 'beginner') {
    suggestions.push({ title: 'Do 10 minutes of gentle stretching', category: 'wellness', reason: 'Perfect for building a routine' });
  }

  const completed = new Set(completedTaskTitles.map((t) => t.toLowerCase()));
  const filtered = suggestions.filter((s) => !completed.has(s.title.toLowerCase()));

  if (filtered.length < limit) {
    const fallback: { title: string; category: string; reason: string }[] = [
      { title: 'Take stairs instead of elevator', category: 'fitness', reason: 'Small steps add up' },
      { title: 'Meditate for 5 minutes', category: 'wellness', reason: 'Calm your mind' },
      { title: 'Read for 15 minutes', category: 'study', reason: 'Feed your mind' },
      { title: 'Write in a journal', category: 'personal', reason: 'Reflect on your day' },
    ];
    for (const f of fallback) {
      if (!completed.has(f.title.toLowerCase())) filtered.push(f);
      if (filtered.length >= limit) break;
    }
  }

  return filtered.slice(0, limit);
}
