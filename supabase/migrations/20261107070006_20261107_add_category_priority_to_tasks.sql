/*
# Add category and priority columns to tasks table

## Purpose
The tasks table currently stores only a title with no category or priority.
The Task Page UI lets users pick a category and priority when adding a task,
but these were never saved — the insert only stored the title. Filtering by
category was therefore broken (it matched the title text instead of a real
category field).

## Changes
1. Adds `category` column (text, not null, default 'personal') to `tasks`.
2. Adds `priority` column (text, not null, default 'medium') to `tasks`.
3. Creates an index on `tasks(user_id, task_date)` for faster daily queries.

## Security
- No policy changes. Existing owner-scoped RLS policies already cover the new
  columns (SELECT/INSERT/UPDATE/DELETE all scoped to `auth.uid() = user_id`).
- The DEFAULT values mean existing rows and future inserts that omit these
  columns get sensible values instead of NULL.
*/

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'personal';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, task_date);
