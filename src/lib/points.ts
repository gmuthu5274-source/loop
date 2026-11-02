import { supabase } from './supabase';

// Award points with duplicate prevention via UNIQUE(user_id, reason, source_id).
// Returns the points awarded (0 if duplicate or error).
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
    // Unique constraint violation = already awarded, not an error
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

export async function getRecentPoints(limit = 20): Promise<{ points: number; reason: string; created_at: string }[]> {
  const { data, error } = await supabase
    .from('points_log')
    .select('points, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

// Points values
export const POINTS = {
  TASK_COMPLETE: 10,
  WORKOUT_LOG: 15,
  MEAL_LOG: 5,
  WATER_GOAL: 10,
  STREAK_3: 50,
  STREAK_7: 100,
  STREAK_14: 150,
  STREAK_30: 300,
  STREAK_90: 500,
  STREAK_365: 1000,
} as const;
