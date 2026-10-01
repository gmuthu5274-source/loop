/*
# Add 7-day streak certificate flag to profiles

1. Modified Tables
- `profiles` — add `seven_day_certificate_awarded` boolean column, default false.
  This flag tracks whether the user has already received the one-time
  7-day continuous streak certificate. Once true, the app will not
  re-award the same certificate, but streak tracking continues normally.

2. Security
- No new tables. No policy changes needed — the column is read/written
  through the existing profiles RLS policies already in place.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS seven_day_certificate_awarded boolean NOT NULL DEFAULT false;
