-- ---------------------------------------------------------------------------
-- Connexion Google et LinkedIn : le profil reçoit le prénom et le nom fournis
-- par le fournisseur. L'inscription par e-mail envoie first_name / last_name ;
-- Google et LinkedIn envoient given_name / family_name, ou à défaut
-- full_name / name (« Prénom Nom »).
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := nullif(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(meta ->> 'first_name', ''),
      nullif(meta ->> 'given_name', ''),
      split_part(full_name, ' ', 1)
    ),
    coalesce(
      nullif(meta ->> 'last_name', ''),
      nullif(meta ->> 'family_name', ''),
      nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')
    )
  );
  return new;
end $$;
