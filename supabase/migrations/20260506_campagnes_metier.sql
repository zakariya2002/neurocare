-- Add metier column to campagne_contacts
alter table campagne_contacts add column if not exists metier text;
