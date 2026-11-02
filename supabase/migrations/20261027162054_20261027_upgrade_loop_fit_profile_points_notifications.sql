/*
# Loop Fit Upgrade — Enhanced Profile, Weight History, Points Log, Notifications

## 1. Enhanced profile fields (additive only — no existing column dropped or retyped)
New optional columns on `profiles`:
- `sex` (text) — 'male' | 'female' | '' used by the Mifflin-St Jeor BMR equation.
- `target_weight` (numeric) — optional goal weight in kg.
- `primary_goal` (text) — one of: fat_loss, general_fitness, muscle_building, bodybuilding,
  strength, six_pack_core, weight_maintenance, endurance, athletic, general_health.
- `secondary_goals` (text[]) — optional additional goals.
- `equipment` (text[]) — available equipment list.
- `workout_location` (text) — 'home' | 'gym' | 'both'.
- `preferred_days` (text[]) — preferred workout day names.
- `preferred_duration` (integer) — preferred workout duration in minutes.
- `motivation` (text) — free-text motivation note.
- `reminder_time` (text) — preferred reminder time as 'HH:MM' 24h.
- `notification_style` (text) — 'gentle' | 'standard' | 'minimal'.
- `notify_workouts`, `notify_meals`, `notify_tasks`, `notify_progress`, `notify_quotes` (booleans default true).
- `quiet_start`, `quiet_end` (text) — quiet hours range.
- `onboarding_complete` (boolean default false).

## 2. New table: weight_history
Tracks periodic weight updates so estimates can be recalculated and progress graphed.

## 3. New table: points_log
Transparent Loop Points with duplicate prevention via UNIQUE(user_id, reason, source_id).

## 4. New table: notifications
In-app notification center with history.

## 5. Security
- RLS enabled on all new tables; owner-scoped CRUD policies to authenticated.
- Re-affirmed profile CRUD policies (idempotent).
*/

-- ===== Enhanced profile columns =====
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sex text DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_weight numeric,
  ADD COLUMN IF NOT EXISTS primary_goal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS secondary_goals text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipment text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS workout_location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_days text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_duration integer,
  ADD COLUMN IF NOT EXISTS motivation text DEFAULT '',
  ADD COLUMN IF NOT EXISTS reminder_time text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notification_style text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS notify_workouts boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_meals boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_tasks boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_progress boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_quotes boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_start text DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS quiet_end text DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- ===== Weight history =====
CREATE TABLE IF NOT EXISTS weight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  recorded_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON weight_history TO authenticated;
CREATE INDEX IF NOT EXISTS idx_weight_history_user ON weight_history(user_id);

DROP POLICY IF EXISTS "select_own_weight_history" ON weight_history;
CREATE POLICY "select_own_weight_history" ON weight_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_weight_history" ON weight_history;
CREATE POLICY "insert_own_weight_history" ON weight_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_weight_history" ON weight_history;
CREATE POLICY "update_own_weight_history" ON weight_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_weight_history" ON weight_history;
CREATE POLICY "delete_own_weight_history" ON weight_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== Points log (duplicate-safe) =====
CREATE TABLE IF NOT EXISTS points_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  source_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, reason, source_id)
);

ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON points_log TO authenticated;
CREATE INDEX IF NOT EXISTS idx_points_log_user ON points_log(user_id);

DROP POLICY IF EXISTS "select_own_points_log" ON points_log;
CREATE POLICY "select_own_points_log" ON points_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_points_log" ON points_log;
CREATE POLICY "insert_own_points_log" ON points_log FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_points_log" ON points_log;
CREATE POLICY "update_own_points_log" ON points_log FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_points_log" ON points_log;
CREATE POLICY "delete_own_points_log" ON points_log FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== Notifications =====
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link_page text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== Re-affirm profile CRUD policies (idempotent) =====
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
