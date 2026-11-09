-- =============================================================================
-- REPTIC.CM — Stockage objet
--   public-media       : visuels publics (actualités, événements, logos validés)
--   private-documents  : justificatifs et documents réservés — accès par URL signée
-- Arborescence private-documents : <user_id>/<application_id>/<fichier>
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-media', 'public-media', true, 5242880,
     array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('private-documents', 'private-documents', false, 10485760,
     array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- public-media : lecture publique (bucket public), écriture par les éditeurs
create policy "media: écriture éditeurs" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and public.has_permission('content.manage'));
create policy "media: modification éditeurs" on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and public.has_permission('content.manage'));
create policy "media: suppression éditeurs" on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and public.has_permission('content.manage'));

-- private-documents : chaque utilisateur dans son dossier, gestionnaires en lecture
create policy "docs: dépôt dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs: lecture de son dossier" on storage.objects for select to authenticated
  using (bucket_id = 'private-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs: suppression de son dossier" on storage.objects for delete to authenticated
  using (bucket_id = 'private-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs: lecture gestionnaires" on storage.objects for select to authenticated
  using (bucket_id = 'private-documents'
         and (public.has_permission('applications.read') or public.has_permission('members.read')));
create policy "docs: gestion" on storage.objects for all to authenticated
  using (bucket_id = 'private-documents' and public.has_permission('documents.manage'))
  with check (bucket_id = 'private-documents' and public.has_permission('documents.manage'));
