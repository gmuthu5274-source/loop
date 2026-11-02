export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          age: number | null;
          sex: string;
          height: number | null;
          weight: number | null;
          target_weight: number | null;
          activity_level: string;
          workout_activity: string;
          workout_experience: string;
          workout_location: string;
          diet: string;
          primary_goal: string;
          secondary_goals: string[];
          equipment: string[];
          preferred_days: string[];
          preferred_duration: number | null;
          motivation: string;
          reminder_time: string;
          notification_style: string;
          notify_workouts: boolean;
          notify_meals: boolean;
          notify_tasks: boolean;
          notify_progress: boolean;
          notify_quotes: boolean;
          quiet_start: string;
          quiet_end: string;
          onboarding_complete: boolean;
          seven_day_certificate_awarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          completed: boolean;
          task_date: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          exercise_name: string;
          category: string;
          weighted: boolean;
          sets: number;
          reps: number;
          weight: number;
          duration: number;
          completed: boolean;
          workout_date: string;
          location: string;
          intensity: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          food_name: string;
          category: string;
          quantity: number;
          portion_grams: number;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          bowl_size: string;
          meal_date: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      water_logs: {
        Row: {
          id: string;
          user_id: string;
          amount_ml: number;
          water_date: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      weight_history: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          recorded_on: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      points_log: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          reason: string;
          source_id: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link_page: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Workout = Database['public']['Tables']['workout_logs']['Row'];
export type Meal = Database['public']['Tables']['meal_logs']['Row'];
export type WaterLog = Database['public']['Tables']['water_logs']['Row'];
export type WeightHistory = Database['public']['Tables']['weight_history']['Row'];
export type PointsLog = Database['public']['Tables']['points_log']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
