-- Migration: add 'draft' status for save-as-draft / submit-later on site records.
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to run multiple times.

ALTER TABLE public.submissions  DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions  ADD  CONSTRAINT submissions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review', 'draft'));

ALTER TABLE public.site_records DROP CONSTRAINT IF EXISTS site_records_status_check;
ALTER TABLE public.site_records ADD  CONSTRAINT site_records_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review', 'draft'));

SELECT 'draft status enabled' AS result;
