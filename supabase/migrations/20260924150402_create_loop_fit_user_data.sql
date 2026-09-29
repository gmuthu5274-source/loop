/*
# Create Loop Fit user data

1. New Tables
- `profiles`: one private fitness profile per signed-in user, including measurements and activity details.
- `tasks`: private daily tasks with completion status.
- `workout_logs`: private exercise tracking records with sets, reps, weight, duration, and estimated calories.
- `meal_logs`: private meal records with food name, category, quantity, portion, and estimated nutrition.

2. Security
- Row level security is enabled on every table.
- Each table has separate authenticated SELECT, INSERT, UPDATE, and DELETE policies.
- Every policy checks `auth.uid()` against the row owner.

3. Notes
- Owner columns default to the current signed-in user so client inserts cannot omit ownership.
- Records are intentionally user-scoped and are not readable by anonymous visitors.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  age integer,
  height numeric,
  weight numeric,
  activity_level text NOT NULL DEFAULT 'moderate',
  workout_activity text NOT NULL DEFAULT '',
  workout_experience text NOT NULL DEFAULT 'beginner',
  diet text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  task_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  category text NOT NULL,
  weighted boolean NOT NULL DEFAULT false,
  sets numeric NOT NULL DEFAULT 0,
  reps numeric NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 0,
  duration numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  workout_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  category text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  portion_grams numeric NOT NULL DEFAULT 100,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  meal_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "workouts_select_own" ON public.workout_logs;
CREATE POLICY "workouts_select_own" ON public.workout_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "workouts_insert_own" ON public.workout_logs;
CREATE POLICY "workouts_insert_own" ON public.workout_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "workouts_update_own" ON public.workout_logs;
CREATE POLICY "workouts_update_own" ON public.workout_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "workouts_delete_own" ON public.workout_logs;
CREATE POLICY "workouts_delete_own" ON public.workout_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meals_select_own" ON public.meal_logs;
CREATE POLICY "meals_select_own" ON public.meal_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "meals_insert_own" ON public.meal_logs;
CREATE POLICY "meals_insert_own" ON public.meal_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meals_update_own" ON public.meal_logs;
CREATE POLICY "meals_update_own" ON public.meal_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meals_delete_own" ON public.meal_logs;
CREATE POLICY "meals_delete_own" ON public.meal_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
