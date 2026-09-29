/*
# Add workout context fields

1. Modified Tables
- `workout_logs.location`: stores where the workout was completed.
- `workout_logs.intensity`: stores the user's selected non-weighted workout intensity.

2. Security
- Existing row level security and owner policies remain unchanged because these are ordinary fields on already protected workout rows.

3. Notes
- Both fields use safe defaults so existing workout history remains valid.
*/

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'Gym';

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS intensity text NOT NULL DEFAULT 'Moderate';
