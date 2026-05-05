-- ─────────────────────────────────────────────────────────────────────────────
-- Email campaign management tables
-- ─────────────────────────────────────────────────────────────────────────────

create type campagne_status as enum ('draft', 'sending', 'sent');
create type campagne_contact_status as enum ('pending', 'sent', 'failed');
create type campagne_segment as enum ('finess', 'anfe', 'sirene');

-- Main campaigns table
create table if not exists campagnes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  segment       campagne_segment not null,
  subject       text not null,
  html_body     text not null,
  status        campagne_status not null default 'draft',
  total_contacts integer not null default 0,
  sent_count    integer not null default 0,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

-- Contacts attached to a campaign
create table if not exists campagne_contacts (
  id             uuid primary key default gen_random_uuid(),
  campagne_id    uuid not null references campagnes(id) on delete cascade,
  email          text not null,
  nom            text,
  prenom         text,
  raison_sociale text,
  sent_at        timestamptz,
  status         campagne_contact_status not null default 'pending',
  created_at     timestamptz not null default now(),
  -- Prevent duplicate emails per campaign
  unique (campagne_id, email)
);

-- Indexes
create index if not exists campagne_contacts_campagne_id_idx on campagne_contacts(campagne_id);
create index if not exists campagne_contacts_status_idx on campagne_contacts(campagne_id, status);

-- RLS: admin-only via service role key (no row-level policies needed for admin API)
alter table campagnes enable row level security;
alter table campagne_contacts enable row level security;

-- Deny all access via anon / authenticated keys (service role bypasses RLS)
create policy "deny_all_campagnes" on campagnes for all using (false);
create policy "deny_all_campagne_contacts" on campagne_contacts for all using (false);
