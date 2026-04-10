-- AJ Gammond Safety Checklist - Database Schema
-- Safe to run multiple times - handles existing objects gracefully

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Submissions table
create table if not exists public.submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'needs_review')),
  form_data jsonb not null,
  comment text,
  name text not null,
  signature text not null,
  media_urls text[] default '{}'
);

-- Submission notes table
create table if not exists public.submission_notes (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references public.submissions on delete cascade not null,
  admin_id uuid references public.profiles not null,
  note text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_notes enable row level security;

-- ── Profiles policies ──────────────────────────────────────────────────────
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Submissions policies ───────────────────────────────────────────────────
drop policy if exists "Users can view own submissions" on public.submissions;
create policy "Users can view own submissions"
  on public.submissions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create submissions" on public.submissions;
create policy "Users can create submissions"
  on public.submissions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can view all submissions" on public.submissions;
create policy "Admins can view all submissions"
  on public.submissions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can update all submissions" on public.submissions;
create policy "Admins can update all submissions"
  on public.submissions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Submission notes policies ──────────────────────────────────────────────
drop policy if exists "Users can view notes on own submissions" on public.submission_notes;
create policy "Users can view notes on own submissions"
  on public.submission_notes for select
  using (
    exists (
      select 1 from public.submissions
      where id = submission_id and user_id = auth.uid()
    )
  );

drop policy if exists "Admins can view all notes" on public.submission_notes;
create policy "Admins can view all notes"
  on public.submission_notes for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can create notes" on public.submission_notes;
create policy "Admins can create notes"
  on public.submission_notes for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Storage bucket ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload to own folder" on storage.objects;
create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'submissions' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view submission files" on storage.objects;
create policy "Anyone can view submission files"
  on storage.objects for select
  using (bucket_id = 'submissions');

-- ── Ensure profile helper (SECURITY DEFINER bypasses RLS) ─────────────────
create or replace function public.ensure_profile(
  p_id uuid,
  p_email text,
  p_name text
) returns void as $$
begin
  insert into public.profiles (id, email, name, role)
  values (p_id, p_email, p_name, 'user')
  on conflict (id) do nothing;
end;
$$ language plpgsql security definer;

-- ── Auto-create profile on signup ──────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Backfill profiles for any existing auth users ──────────────────────────
insert into public.profiles (id, email, name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'name', ''),
  'user'
from auth.users
on conflict (id) do nothing;

-- ── Indexes ────────────────────────────────────────────────────────────────
create index if not exists submissions_user_id_idx on public.submissions(user_id);
create index if not exists submissions_status_idx on public.submissions(status);
create index if not exists submissions_created_at_idx on public.submissions(created_at desc);
create index if not exists submission_notes_submission_id_idx on public.submission_notes(submission_id);
