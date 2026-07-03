-- Migration: add an optional dust_collector column to site records
-- (JMS 10/20/30 unit selected on the Site Record Sheet).
-- Run ONCE in the Supabase SQL Editor. Safe to run multiple times.

ALTER TABLE public.site_records ADD COLUMN IF NOT EXISTS dust_collector TEXT;

SELECT 'dust_collector column added' AS result;
