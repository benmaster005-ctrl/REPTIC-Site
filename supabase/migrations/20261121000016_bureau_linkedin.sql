-- ---------------------------------------------------------------------------
-- Bureau exécutif : lien vers le profil LinkedIn de chaque membre (facultatif),
-- affiché sur la page Gouvernance. Ré-exécutable.
-- ---------------------------------------------------------------------------
alter table public.governance_members
  add column if not exists linkedin_url text
  check (linkedin_url is null or linkedin_url ~* '^https://([a-z]{2,3}\.)?linkedin\.com/');
