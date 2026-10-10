-- ============================================================
-- School Data Portal - Supabase schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Admin accounts ----------
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ---------- Schools ----------
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,             -- كود المدرسة (رقم تعريفي)
  name text not null,                    -- اسم المدرسة
  type text not null default 'public' check (type in ('public', 'private')), -- نوع المدرسة (public: رسمي | private: خاص)
  username text unique not null,         -- اسم الدخول
  password_hash text not null,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Form templates (a "form" = one data-collection round/period) ----------
-- `schema` holds a JSON description of the fields, e.g.:
-- { "fields": [
--     {"key":"students_count","label":"عدد الطلاب","type":"number","required":true},
--     {"key":"stage","label":"المرحلة","type":"select","options":["ابتدائي","اعدادي","ثانوي"],"required":true},
--     {"key":"notes","label":"ملاحظات","type":"textarea","required":false}
--   ]
-- }
create table if not exists form_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,             -- معرف قصير يظهر فى الرابط
  title text not null,                   -- عنوان النموذج يظهر للمدرسة
  description text,
  schema jsonb not null,
  is_active boolean not null default true,
  google_sheet_tab text,                 -- اسم التاب فى جوجل شيت لو فيه مزامنة
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Submissions ----------
-- One row per (form, school). Re-submitting updates the same row.
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references form_templates(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, school_id)
);

-- ---------- Password reset requests (school asks admin to reset) ----------
create table if not exists password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  status text not null default 'pending', -- pending | resolved
  requested_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- Lock everything down: only the service_role key (server-side) can touch these tables ----------
alter table admins enable row level security;
alter table schools enable row level security;
alter table form_templates enable row level security;
alter table submissions enable row level security;
alter table password_reset_requests enable row level security;
-- No policies are created on purpose -> anon/public access is fully blocked.
-- The Next.js server routes use the SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

create index if not exists idx_submissions_form on submissions(form_id);
create index if not exists idx_submissions_school on submissions(school_id);
create index if not exists idx_reset_requests_status on password_reset_requests(status);
