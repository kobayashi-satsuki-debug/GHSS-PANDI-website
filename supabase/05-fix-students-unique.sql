-- =============================================================
-- G H S S PANDI — fix for existing projects
-- Run this if 01-schema.sql was applied before this revision,
-- or if student sign-up failed with:
--   duplicate key value violates unique constraint "students_class_roll_no_key"
-- Safe to run more than once.
-- =============================================================

alter table public.students drop constraint if exists students_class_roll_no_key;

create unique index if not exists students_class_roll_idx
  on public.students (class, roll_no)
  where class <> '' and roll_no <> '';
