import { supabase } from './supabase';

export async function awardPoints(reason: string, sourceId: string, points: number): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const { error } = await supabase
    .from('points_log')
    .insert({
      user_id: userData.user.id,
      reason,
      source_id: sourceId,
      points,
    });

  if (error) {
    return 0;
  }
  return points;
}

export async function getTotalPoints(): Promise<number> {
  const { data, error } = await supabase
    .from('points_log')
    .select('points');

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + row.points, 0);
}

export async function getTodayPoints(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('points_log')
    .select('points, created_at');

  if (error || !data) return 0;
  return data
    .filter((row) => row.created_at && row.created_at.startsWith(today))
    .reduce((sum, row) => sum + row.points, 0);
}

export async function getRecentPoints(limit = 20): Promise<{ points: number; reason: string; created_at: string }[]> {
  const { data, error } = await supabase
    .from('points_log')
    .select('points, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

export async function hasBeenAwarded(reason: string, sourceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('points_log')
    .select('id')
    .eq('reason', reason)
    .eq('source_id', sourceId)
    .maybeSingle();
  return !!data;
}

export const POINTS = {
  TASK_COMPLETE: 10,
  WORKOUT_LOG: 30,
  MEAL_LOG_BREAKFAST: 10,
  MEAL_LOG_LUNCH: 10,
  MEAL_LOG_DINNER: 10,
  MEAL_LOG_SNACK: 5,
  WATER_GOAL: 20,
  DAILY_CHALLENGE: 30,
  ALL_TASKS_BONUS: 50,
  BONUS_MISSION: 25,
  STREAK_3: 50,
  STREAK_7: 100,
  STREAK_14: 150,
  STREAK_30: 300,
  STREAK_90: 500,
  STREAK_365: 1000,
} as const;

export type PointsLog = {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  source_id: string;
  created_at: string;
};

export type RewardTier = {
  id: string;
  threshold: number;
  label: string;
  icon: string;
  color: string;
};

export const DAILY_REWARD_TIERS: RewardTier[] = [
  { id: 'bronze', threshold: 20, label: 'Bronze Reward', icon: 'medal', color: '#cd7f32' },
  { id: 'silver', threshold: 50, label: 'Silver Reward', icon: 'award', color: '#c0c0c0' },
  { id: 'gold', threshold: 100, label: 'Gold Reward', icon: 'crown', color: '#ffd700' },
  { id: 'champion', threshold: 150, label: 'Daily Champion Badge', icon: 'trophy', color: '#ff6b6b' },
];

export type Level = {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
};

export const LEVELS: Level[] = [
  { level: 1, title: 'Beginner', minPoints: 0, maxPoints: 100 },
  { level: 2, title: 'Explorer', minPoints: 100, maxPoints: 300 },
  { level: 3, title: 'Achiever', minPoints: 300, maxPoints: 600 },
  { level: 4, title: 'Champion', minPoints: 600, maxPoints: 1000 },
  { level: 5, title: 'Legend', minPoints: 1000, maxPoints: 2000 },
  { level: 6, title: 'Master', minPoints: 2000, maxPoints: 3500 },
  { level: 7, title: 'Grandmaster', minPoints: 3500, maxPoints: 5000 },
  { level: 8, title: 'Immortal', minPoints: 5000, maxPoints: 10000 },
  { level: 9, title: 'Mythic', minPoints: 10000, maxPoints: 999999 },
];

export function getLevel(totalPoints: number): Level {
  return LEVELS.find((l) => totalPoints >= l.minPoints && totalPoints < l.maxPoints) || LEVELS[LEVELS.length - 1];
}

export function getNextLevel(totalPoints: number): Level | null {
  const current = getLevel(totalPoints);
  const idx = LEVELS.findIndex((l) => l.level === current.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export type Badge = {
  id: string;
  label: string;
  description: string;
  threshold: number;
  type: 'streak' | 'points' | 'task';
  icon: string;
};

export const BADGES: Badge[] = [
  { id: 'first_task', label: 'First Step', description: 'Complete your first task', threshold: 1, type: 'task', icon: 'check' },
  { id: 'streak_3', label: 'On Fire', description: '3-day streak', threshold: 3, type: 'streak', icon: 'flame' },
  { id: 'streak_7', label: 'Week Warrior', description: '7-day streak', threshold: 7, type: 'streak', icon: 'flame' },
  { id: 'streak_14', label: 'Consistency King', description: '14-day streak', threshold: 14, type: 'streak', icon: 'flame' },
  { id: 'streak_30', label: 'Monthly Champion', description: '30-day streak', threshold: 30, type: 'streak', icon: 'trophy' },
  { id: 'points_100', label: 'Centurion', description: 'Earn 100 total XP', threshold: 100, type: 'points', icon: 'star' },
  { id: 'points_500', label: 'XP Hunter', description: 'Earn 500 total XP', threshold: 500, type: 'points', icon: 'star' },
  { id: 'points_1000', label: 'XP Legend', description: 'Earn 1000 total XP', threshold: 1000, type: 'points', icon: 'crown' },
];
