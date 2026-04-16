-- AJ Gammond — Full Database Schema
-- Safe to run multiple times (uses IF NOT EXISTS, DROP IF EXISTS, OR REPLACE)
-- Run this in Supabase SQL Editor on a fresh project, or to restore after data loss.

-- ── Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL,
  name       TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  form_data  JSONB NOT NULL,
  comment    TEXT,
  name       TEXT NOT NULL,
  signature  TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.submission_notes (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.submissions ON DELETE CASCADE NOT NULL,
  admin_id      UUID REFERENCES public.profiles NOT NULL,
  note          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_records (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  customer              TEXT NOT NULL,
  machine_type          TEXT NOT NULL,
  site_address          TEXT NOT NULL,
  machine_code          TEXT NOT NULL,
  rows                  JSONB NOT NULL DEFAULT '[]',
  materials             TEXT[] DEFAULT '{}',
  works_agreed_by       TEXT NOT NULL,
  capacity              TEXT,
  signed_in_presence_of TEXT,
  ajg_rep_signature     TEXT
);

CREATE TABLE IF NOT EXISTS public.site_record_notes (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_record_id  UUID REFERENCES public.site_records ON DELETE CASCADE NOT NULL,
  admin_id        UUID REFERENCES public.profiles NOT NULL,
  note            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Enable RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_record_notes   ENABLE ROW LEVEL SECURITY;

-- ── Functions (must be defined BEFORE policies that reference them) ─────────

-- Admin check — SECURITY DEFINER so it runs as DB owner and bypasses RLS,
-- preventing infinite recursion when policies on profiles call this function.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ensure profile exists — called on checklist submit to handle users created
-- before the signup trigger was in place.
CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_id    UUID,
  p_email TEXT,
  p_name  TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (p_id, p_email, p_name, 'user')
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Policies: profiles ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"  ON public.profiles;

CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- ── Policies: submissions ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own submissions"   ON public.submissions;
DROP POLICY IF EXISTS "Users can create submissions"     ON public.submissions;
DROP POLICY IF EXISTS "Admins can view all submissions"  ON public.submissions;
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.submissions;

CREATE POLICY "Users can view own submissions"    ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create submissions"      ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all submissions"   ON public.submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all submissions" ON public.submissions FOR UPDATE USING (public.is_admin());

-- ── Policies: submission_notes ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view notes on own submissions" ON public.submission_notes;
DROP POLICY IF EXISTS "Admins can view all notes"               ON public.submission_notes;
DROP POLICY IF EXISTS "Admins can create notes"                 ON public.submission_notes;

CREATE POLICY "Users can view notes on own submissions" ON public.submission_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all notes" ON public.submission_notes FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can create notes"   ON public.submission_notes FOR INSERT WITH CHECK (public.is_admin());

-- ── Policies: site_record_notes ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view notes on own site records" ON public.site_record_notes;
DROP POLICY IF EXISTS "Admins can view all site record notes"    ON public.site_record_notes;
DROP POLICY IF EXISTS "Admins can create site record notes"      ON public.site_record_notes;

CREATE POLICY "Users can view notes on own site records" ON public.site_record_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.site_records WHERE id = site_record_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all site record notes" ON public.site_record_notes FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can create site record notes"   ON public.site_record_notes FOR INSERT WITH CHECK (public.is_admin());

-- ── Policies: site_records ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own site records"   ON public.site_records;
DROP POLICY IF EXISTS "Users can create site records"     ON public.site_records;
DROP POLICY IF EXISTS "Admins can view all site records"  ON public.site_records;
DROP POLICY IF EXISTS "Admins can update all site records" ON public.site_records;

CREATE POLICY "Users can view own site records"    ON public.site_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create site records"      ON public.site_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all site records"   ON public.site_records FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all site records" ON public.site_records FOR UPDATE USING (public.is_admin());

-- ── Storage bucket ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload to own folder"  ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view submission files" ON storage.objects;

CREATE POLICY "Users can upload to own folder" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view submission files" ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions');

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS submissions_user_id_idx          ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS submissions_status_idx           ON public.submissions(status);
CREATE INDEX IF NOT EXISTS submissions_created_at_idx       ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS submission_notes_submission_id_idx ON public.submission_notes(submission_id);
CREATE INDEX IF NOT EXISTS site_record_notes_record_id_idx   ON public.site_record_notes(site_record_id);
CREATE INDEX IF NOT EXISTS site_records_user_id_idx         ON public.site_records(user_id);
CREATE INDEX IF NOT EXISTS site_records_status_idx          ON public.site_records(status);
CREATE INDEX IF NOT EXISTS site_records_created_at_idx      ON public.site_records(created_at DESC);

-- ── Backfill profiles for any existing auth users ───────────────────────────
INSERT INTO public.profiles (id, email, name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', ''), 'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

SELECT 'AJ Gammond schema applied successfully' AS status;
