export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; name: string; age: number | null; height: number | null; weight: number | null; activity_level: string; workout_activity: string; workout_experience: string; diet: string; seven_day_certificate_awarded: boolean; created_at: string; updated_at: string }; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      tasks: { Row: { id: string; user_id: string; title: string; completed: boolean; task_date: string; created_at: string }; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      workout_logs: { Row: { id: string; user_id: string; exercise_name: string; category: string; weighted: boolean; sets: number; reps: number; weight: number; duration: number; completed: boolean; workout_date: string; location: string; intensity: string; created_at: string }; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      meal_logs: { Row: { id: string; user_id: string; food_name: string; category: string; quantity: number; portion_grams: number; calories: number; protein: number; carbs: number; fat: number; bowl_size: string; meal_date: string; created_at: string }; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      water_logs: { Row: { id: string; user_id: string; amount_ml: number; water_date: string; created_at: string }; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
  };
};
