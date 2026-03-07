-- supabase/migrations/2026030701_scan_credits.sql

-- ── 1A. ADD SCAN CREDITS TO ORGANIZATIONS ───────────────────────
alter table organizations
  add column if not exists scan_credits jsonb not null default '{
    "quick": 0,
    "web_api": 0,
    "full_stack": 0,
    "compliance": 0
  }'::jsonb;

-- ── 1B. MONTHLY SCAN USAGE TABLE (Starter limit enforcement) ────
create table if not exists scan_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  month text not null,        -- 'YYYY-MM'
  scans_used integer default 0,
  unique(organization_id, month)
);

-- ── 1C. ADD COLUMNS TO PENTESTS ─────────────────────────────────
alter table pentests
  add column if not exists scan_type text,
  -- 'quick' | 'web_api' | 'full_stack' | 'compliance'
  add column if not exists scan_mode text default 'deep',
  -- 'quick' | 'deep'
  add column if not exists credit_source text,
  -- 'one_time' | 'subscription'
  add column if not exists report_url text,
  add column if not exists compliance_framework text,
  -- 'soc2' | 'iso27001' | null
  add column if not exists context_provided boolean default false;
  -- true if user filled in any context fields

-- ── 1D. HELPER FUNCTIONS ────────────────────────────────────────

-- Safely increment a credit field (called by Dodo webhook)
create or replace function increment_scan_credit(
  org_id uuid,
  credit_type text,
  amount integer default 1
) returns void as $$
begin
  update organizations
  set scan_credits = jsonb_set(
    scan_credits,
    array[credit_type],
    to_jsonb(coalesce((scan_credits->>credit_type)::integer, 0) + amount)
  )
  where id = org_id;
end;
$$ language plpgsql security definer;

-- Atomically decrement a credit — returns false if already 0 (race-condition safe)
create or replace function decrement_scan_credit(
  org_id uuid,
  credit_type text
) returns boolean as $$
declare
  current_val integer;
begin
  -- Row-level lock to prevent race conditions
  select (scan_credits->>credit_type)::integer
  into current_val
  from organizations
  where id = org_id
  for update;

  if current_val is null or current_val <= 0 then
    return false;
  end if;

  update organizations
  set scan_credits = jsonb_set(
    scan_credits,
    array[credit_type],
    to_jsonb(current_val - 1)
  )
  where id = org_id;

  return true;
end;
$$ language plpgsql security definer;

-- Increment monthly scan counter (Starter plan enforcement)
create or replace function increment_scan_usage(
  org_id uuid,
  month text
) returns void as $$
begin
  insert into scan_usage (organization_id, month, scans_used)
  values (org_id, month, 1)
  on conflict (organization_id, month)
  do update set scans_used = scan_usage.scans_used + 1;
end;
$$ language plpgsql security definer;

-- Decrement scan usage on failure to restore subscription limits
create or replace function decrement_scan_usage_on_failure(
  org_id uuid,
  month text
) returns void as $$
begin
  update scan_usage
  set scans_used = greatest(0, scans_used - 1)
  where organization_id = org_id and month = month;
end;
$$ language plpgsql security definer;
