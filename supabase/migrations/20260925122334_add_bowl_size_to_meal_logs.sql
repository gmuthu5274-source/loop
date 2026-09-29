/*
# Add bowl_size to meal_logs

1. Modified Tables
- `meal_logs.bowl_size`: stores the bowl size selection (e.g. "1/2 cup", "1 cup", "2 cups") chosen by the user when logging a meal.

2. Security
- Existing row level security and owner policies remain unchanged because this is an ordinary field on already protected meal rows.

3. Notes
- The field defaults to "1 cup" so existing meal history remains valid.
*/

ALTER TABLE public.meal_logs
  ADD COLUMN IF NOT EXISTS bowl_size text NOT NULL DEFAULT '1 cup';
