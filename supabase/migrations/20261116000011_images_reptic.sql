-- =============================================================================
-- REPTIC.CM — Images reprises de reptic.cm (autorisation de l'association)
-- Les fichiers sont livrés avec le site, dans public/images/reptic/.
-- Rejouable. À exécuter dans le SQL Editor après la migration 10.
-- =============================================================================

-- Portraits du Bureau exécutif
update public.governance_members g
   set photo_path = '/images/reptic/bureau/' || v.file || '.webp'
  from (values
    ('Dr.-Ing. Pierre-François KAMANOU', 'pierre-francois-kamanou'),
    ('Anthony SAME', 'anthony-same'),
    ('Mme Horore BELL BEBGA', 'horore-bell-bebga'),
    ('Jordan TCHOKONTE', 'jordan-tchokonte'),
    ('Dr Soka Armelle PEYOU', 'soka-armelle-peyou'),
    ('Beaugas-Orain DJOYUM', 'beaugas-orain-djoyum'),
    ('Ernest Aimé DJATCHEU NZALI', 'ernest-aime-djatcheu-nzali'),
    ('Nelly CHATUE-DIOP', 'nelly-chatue-diop'),
    ('Jéhu NDOUMI', 'jehu-ndoumi'),
    ('Mme Rosine EKAMBI', 'rosine-ekambi'),
    ('Abdou MFOPA', 'abdou-mfopa'),
    ('Ayuk ETTA', 'ayuk-etta'),
    ('Dr Gérard EYOUM', 'gerard-eyoum'),
    ('Dr Mbang SAMA', 'mbang-sama'),
    ('Epanty MBANDA', 'epanty-mbanda'),
    ('Fidel MOLE', 'fidel-mole'),
    ('Philippe NKOUAYA', 'philippe-nkouaya'),
    ('Serge Armel DJIJOU', 'serge-armel-djijou'),
    ('Olivier DJABA', 'olivier-djaba'),
    ('Antoine Anatole NKOLO BIYIDI', 'antoine-anatole-nkolo-biyidi'),
    ('Jean Gallo JIOTSA', 'jean-gallo-jiotsa'),
    ('Jean-Guy WANDJI', 'jean-guy-wandji')
  ) as v(full_name, file)
 where g.full_name = v.full_name;

-- Couvertures des actualités
update public.news n
   set cover_path = '/images/reptic/actualites/' || v.file || '.webp'
  from (values
    ('forum-de-l-economie-numerique-en-afrique-centrale', 'forum-economie-numerique-afrique-centrale'),
    ('convention-avec-les-universites-technologiques-de-yaounde', 'convention-universites-yaounde'),
    ('label-cameroon-tech-excellence-officiellement-lance', 'label-cameroon-tech-excellence')
  ) as v(slug, file)
 where n.slug = v.slug;

-- Photos dans les pages (ajoutées une seule fois en tête du texte)
update public.pages
   set cover_path = '/images/reptic/pages/assemblee-generale.webp',
       body = '![Assemblée générale du REPTIC.CM à Yaoundé](/images/reptic/pages/assemblee-generale.webp)' || E'\n\n' || body
 where slug = 'presentation' and body not like '%/images/reptic/pages/assemblee-generale.webp%';

update public.pages
   set cover_path = '/images/reptic/pages/adhesion-reseau.webp',
       body = '![Membres du réseau REPTIC.CM](/images/reptic/pages/adhesion-reseau.webp)' || E'\n\n' || body
 where slug = 'conditions-adhesion' and body not like '%/images/reptic/pages/adhesion-reseau.webp%';
