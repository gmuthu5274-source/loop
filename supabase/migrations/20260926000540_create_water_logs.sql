/*
# Water Intake Log

1. New Table
- `water_logs`: stores daily water intake entries (in mL) for each user.

2. Security
- Row level security enabled.
- Four policies (one per CRUD verb) scoped to `authenticated` users owning the row via `auth.uid() = user_id`.

3. Notes
- Each row represents a single water entry (e.g. "250mL at 10am").
- The `water_date` column defaults to the current date for daily reset.
*/

CREATE TABLE IF NOT EXISTS public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount_ml integer NOT NULL DEFAULT 250,
  water_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_water" ON public.water_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_water" ON public.water_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_water" ON public.water_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_water" ON public.water_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
