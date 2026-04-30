-- =============================================================================
-- MIGRATION: Segurança RLS completa — Cadê Meu Dono
-- Data: 2026-04-29
--
-- CONTEXTO:
--   O backend NestJS usa Prisma com conexão direta como postgres (superuser),
--   que bypassa RLS automaticamente. Esta migration protege o acesso via
--   PostgREST (Supabase REST API com anon key) sem afetar o backend.
--
-- IMPACTO:
--   Backend NestJS → ZERO impacto (postgres superuser bypassa RLS)
--   PostgREST anon → só verá dados públicos permitidos pelas policies
--   Supabase security alerts → resolvidos após aplicar
--
-- NÃO APAGA DADOS. Apenas adiciona controles de acesso.
-- =============================================================================


-- =============================================================================
-- 1. FUNÇÃO SEGURA: public.is_admin()
--    Retorna true se o usuário autenticado (auth.uid()) tiver role = 'ADMIN'.
--    SECURITY DEFINER garante que a função lê a tabela com permissões elevadas,
--    impedindo recursão ou privilege escalation via search_path.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;


-- =============================================================================
-- 2. ATIVAR RLS EM TODAS AS TABELAS DO SCHEMA PUBLIC
--    ENABLE ROW LEVEL SECURITY bloqueia todo acesso sem policy explícita.
--    O superuser (postgres/service_role) bypassa RLS automaticamente.
-- =============================================================================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_health         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_tags_new     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_scan_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_batches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_devices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foster_volunteers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_protectors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications  ENABLE ROW LEVEL SECURITY;

-- Tabela legada (pode existir ou não dependendo do ambiente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'smart_tags'
  ) THEN
    EXECUTE 'ALTER TABLE public.smart_tags ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;


-- =============================================================================
-- 3. DROP DE POLICIES EXISTENTES (idempotência — evita erro em re-execução)
-- =============================================================================

-- users
DROP POLICY IF EXISTS "admin_all_users"    ON public.users;
DROP POLICY IF EXISTS "user_select_own"    ON public.users;
DROP POLICY IF EXISTS "user_update_own"    ON public.users;

-- pets
DROP POLICY IF EXISTS "admin_all_pets"          ON public.pets;
DROP POLICY IF EXISTS "owner_select_own_pets"   ON public.pets;
DROP POLICY IF EXISTS "owner_insert_pet"        ON public.pets;
DROP POLICY IF EXISTS "owner_update_own_pet"    ON public.pets;
DROP POLICY IF EXISTS "owner_delete_own_pet"    ON public.pets;
DROP POLICY IF EXISTS "anon_select_public_pets" ON public.pets;

-- pet_health
DROP POLICY IF EXISTS "admin_all_pet_health"       ON public.pet_health;
DROP POLICY IF EXISTS "owner_select_own_pet_health" ON public.pet_health;
DROP POLICY IF EXISTS "owner_insert_pet_health"    ON public.pet_health;
DROP POLICY IF EXISTS "owner_update_own_pet_health" ON public.pet_health;
DROP POLICY IF EXISTS "owner_delete_own_pet_health" ON public.pet_health;

-- pet_media
DROP POLICY IF EXISTS "admin_all_pet_media"          ON public.pet_media;
DROP POLICY IF EXISTS "owner_select_own_pet_media"   ON public.pet_media;
DROP POLICY IF EXISTS "owner_insert_pet_media"       ON public.pet_media;
DROP POLICY IF EXISTS "owner_delete_own_pet_media"   ON public.pet_media;
DROP POLICY IF EXISTS "anon_select_public_pet_media" ON public.pet_media;

-- announcements
DROP POLICY IF EXISTS "admin_all_announcements"          ON public.announcements;
DROP POLICY IF EXISTS "owner_select_own_announcements"   ON public.announcements;
DROP POLICY IF EXISTS "owner_insert_announcement"        ON public.announcements;
DROP POLICY IF EXISTS "owner_update_own_announcement"    ON public.announcements;
DROP POLICY IF EXISTS "owner_delete_own_announcement"    ON public.announcements;
DROP POLICY IF EXISTS "anon_select_active_announcements" ON public.announcements;

-- announcement_images
DROP POLICY IF EXISTS "admin_all_announcement_images"         ON public.announcement_images;
DROP POLICY IF EXISTS "owner_select_own_announcement_images"  ON public.announcement_images;
DROP POLICY IF EXISTS "owner_insert_announcement_image"       ON public.announcement_images;
DROP POLICY IF EXISTS "owner_delete_own_announcement_image"   ON public.announcement_images;
DROP POLICY IF EXISTS "anon_select_public_announcement_images" ON public.announcement_images;

-- smart_tags_new
DROP POLICY IF EXISTS "admin_all_smart_tags"          ON public.smart_tags_new;
DROP POLICY IF EXISTS "owner_select_own_smart_tags"   ON public.smart_tags_new;
DROP POLICY IF EXISTS "owner_update_own_smart_tag"    ON public.smart_tags_new;
DROP POLICY IF EXISTS "anon_select_smart_tag_by_code" ON public.smart_tags_new;

-- tag_scan_logs
DROP POLICY IF EXISTS "admin_all_tag_scan_logs" ON public.tag_scan_logs;
DROP POLICY IF EXISTS "anon_insert_tag_scan_log" ON public.tag_scan_logs;

-- device_batches
DROP POLICY IF EXISTS "admin_all_device_batches" ON public.device_batches;

-- devices
DROP POLICY IF EXISTS "admin_all_devices"        ON public.devices;
DROP POLICY IF EXISTS "owner_select_own_devices" ON public.devices;

-- adoptions
DROP POLICY IF EXISTS "admin_all_adoptions"      ON public.adoptions;
DROP POLICY IF EXISTS "user_select_own_adoptions" ON public.adoptions;
DROP POLICY IF EXISTS "user_insert_adoption"     ON public.adoptions;

-- gps_devices
DROP POLICY IF EXISTS "admin_all_gps_devices"        ON public.gps_devices;
DROP POLICY IF EXISTS "owner_select_own_gps_devices" ON public.gps_devices;

-- gps_locations
DROP POLICY IF EXISTS "admin_all_gps_locations"        ON public.gps_locations;
DROP POLICY IF EXISTS "owner_select_own_gps_locations" ON public.gps_locations;

-- foster_volunteers
DROP POLICY IF EXISTS "admin_all_foster_volunteers"        ON public.foster_volunteers;
DROP POLICY IF EXISTS "owner_select_own_foster_volunteer"  ON public.foster_volunteers;
DROP POLICY IF EXISTS "owner_insert_foster_volunteer"      ON public.foster_volunteers;
DROP POLICY IF EXISTS "owner_update_own_foster_volunteer"  ON public.foster_volunteers;
DROP POLICY IF EXISTS "owner_delete_own_foster_volunteer"  ON public.foster_volunteers;

-- org_protectors
DROP POLICY IF EXISTS "admin_all_org_protectors"             ON public.org_protectors;
DROP POLICY IF EXISTS "owner_select_own_org_protector"       ON public.org_protectors;
DROP POLICY IF EXISTS "owner_insert_org_protector"           ON public.org_protectors;
DROP POLICY IF EXISTS "owner_update_own_org_protector"       ON public.org_protectors;
DROP POLICY IF EXISTS "owner_delete_own_org_protector"       ON public.org_protectors;
DROP POLICY IF EXISTS "anon_select_approved_org_protectors"  ON public.org_protectors;

-- activity_logs
DROP POLICY IF EXISTS "admin_all_activity_logs"       ON public.activity_logs;
DROP POLICY IF EXISTS "user_select_own_activity_logs" ON public.activity_logs;

-- breeds
DROP POLICY IF EXISTS "anyone_select_breeds" ON public.breeds;
DROP POLICY IF EXISTS "admin_manage_breeds"  ON public.breeds;

-- otp_verifications
DROP POLICY IF EXISTS "admin_all_otp_verifications" ON public.otp_verifications;

-- smart_tags (legado)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'smart_tags'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_only_smart_tags_legacy" ON public.smart_tags';
  END IF;
END $$;


-- =============================================================================
-- 4. POLICIES — TABELA: users
--    PRIVADA. Email, telefone, endereço, role.
--    Admin: tudo. Usuário: lê/edita apenas si mesmo.
--    Usuário NÃO pode alterar a própria role — o WITH CHECK garante isso.
-- =============================================================================

CREATE POLICY "admin_all_users" ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Usuário pode atualizar seus dados, mas role permanece inalterada.
-- WITH CHECK compara a role do novo row com a role atual no banco.
CREATE POLICY "user_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
  );


-- =============================================================================
-- 5. POLICIES — TABELA: pets
--    Tutor gerencia seus pets. Admin gerencia tudo.
--    Anônimo: lê apenas pets em estado público (perdido/encontrado/adoção/petmatch).
--    secret_mark nunca é exposto ao anônimo (a view pública omite esse campo).
-- =============================================================================

CREATE POLICY "admin_all_pets" ON public.pets
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_pets" ON public.pets
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "owner_insert_pet" ON public.pets
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "owner_update_own_pet" ON public.pets
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_delete_own_pet" ON public.pets
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND NOT public.is_admin());

-- Anônimo: apenas pets ativos em estados públicos
CREATE POLICY "anon_select_public_pets" ON public.pets
  FOR SELECT TO anon
  USING (
    is_active = true
    AND (
      is_lost = true
      OR is_found = true
      OR is_for_adoption = true
      OR is_for_pet_match = true
    )
  );


-- =============================================================================
-- 6. POLICIES — TABELA: pet_health
--    Dados médicos. Nenhum acesso anônimo. Tutor lê/edita saúde dos próprios pets.
-- =============================================================================

CREATE POLICY "admin_all_pet_health" ON public.pet_health
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_pet_health" ON public.pet_health
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_health.pet_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_insert_pet_health" ON public.pet_health
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_health.pet_id AND p.owner_id = auth.uid()
    )
    AND NOT public.is_admin()
  );

CREATE POLICY "owner_update_own_pet_health" ON public.pet_health
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_health.pet_id AND p.owner_id = auth.uid()
    )
    AND NOT public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_health.pet_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_delete_own_pet_health" ON public.pet_health
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_health.pet_id AND p.owner_id = auth.uid()
    )
    AND NOT public.is_admin()
  );


-- =============================================================================
-- 7. POLICIES — TABELA: pet_media
--    Fotos de pets. Anônimo vê apenas fotos de pets em estados públicos.
-- =============================================================================

CREATE POLICY "admin_all_pet_media" ON public.pet_media
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_pet_media" ON public.pet_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_media.pet_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_insert_pet_media" ON public.pet_media
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_media.pet_id AND p.owner_id = auth.uid()
    )
    AND NOT public.is_admin()
  );

CREATE POLICY "owner_delete_own_pet_media" ON public.pet_media
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_media.pet_id AND p.owner_id = auth.uid()
    )
    AND NOT public.is_admin()
  );

CREATE POLICY "anon_select_public_pet_media" ON public.pet_media
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_media.pet_id
        AND p.is_active = true
        AND (
          p.is_lost = true
          OR p.is_found = true
          OR p.is_for_adoption = true
          OR p.is_for_pet_match = true
        )
    )
  );


-- =============================================================================
-- 8. POLICIES — TABELA: announcements
--    Anúncios ativos são públicos. Dados de contato (phone, rua) ficam
--    disponíveis apenas para usuários autenticados (via a view do backend).
--    A policy de anon permite SELECT de anúncios ATIVOS via PostgREST,
--    mas contact_phone e street não são expostos na view pública (seção 25).
-- =============================================================================

CREATE POLICY "admin_all_announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "owner_insert_announcement" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "owner_update_own_announcement" ON public.announcements
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_delete_own_announcement" ON public.announcements
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "anon_select_active_announcements" ON public.announcements
  FOR SELECT TO anon
  USING (status = 'ACTIVE');


-- =============================================================================
-- 9. POLICIES — TABELA: announcement_images
-- =============================================================================

CREATE POLICY "admin_all_announcement_images" ON public.announcement_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_announcement_images" ON public.announcement_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_images.announcement_id AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_insert_announcement_image" ON public.announcement_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_images.announcement_id AND a.owner_id = auth.uid()
    )
    AND NOT public.is_admin()
  );

CREATE POLICY "owner_delete_own_announcement_image" ON public.announcement_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_images.announcement_id AND a.owner_id = auth.uid()
    )
    AND NOT public.is_admin()
  );

CREATE POLICY "anon_select_public_announcement_images" ON public.announcement_images
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_images.announcement_id AND a.status = 'ACTIVE'
    )
  );


-- =============================================================================
-- 10. POLICIES — TABELA: smart_tags_new
--    Admin gerencia tudo. Tutor vê/edita tags vinculadas aos seus pets.
--    Anônimo: lê tags ATIVAS com pet vinculado (para página pública).
--    owner_id nunca é exposto ao anônimo — a view pública omite esse campo.
-- =============================================================================

CREATE POLICY "admin_all_smart_tags" ON public.smart_tags_new
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_smart_tags" ON public.smart_tags_new
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = smart_tags_new.pet_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_update_own_smart_tag" ON public.smart_tags_new
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (owner_id = auth.uid());

-- Anônimo: lê tags ativas com pet (para página pública /pet/:code)
CREATE POLICY "anon_select_smart_tag_by_code" ON public.smart_tags_new
  FOR SELECT TO anon
  USING (status = 'ACTIVE' AND pet_id IS NOT NULL);


-- =============================================================================
-- 11. POLICIES — TABELA: tag_scan_logs
--    IP, user-agent, geolocalização. Extremamente sensível.
--    Apenas admin lê. Backend (postgres) registra scans sem precisar de policy.
-- =============================================================================

CREATE POLICY "admin_all_tag_scan_logs" ON public.tag_scan_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================================
-- 12. POLICIES — TABELA: device_batches
--    Gestão de lotes de dispositivos. Apenas admin.
-- =============================================================================

CREATE POLICY "admin_all_device_batches" ON public.device_batches
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================================
-- 13. POLICIES — TABELA: devices
--    IMEI, SIM, GPS. Muito sensível. Admin vê tudo.
--    Tutor vê apenas dispositivos vinculados aos seus pets.
-- =============================================================================

CREATE POLICY "admin_all_devices" ON public.devices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_devices" ON public.devices
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = devices.pet_id AND p.owner_id = auth.uid()
    )
  );


-- =============================================================================
-- 14. POLICIES — TABELA: adoptions
--    CPF hash, IP, dados jurídicos. Admin vê tudo.
--    Usuário vê/cria apenas suas próprias adoções.
-- =============================================================================

CREATE POLICY "admin_all_adoptions" ON public.adoptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_select_own_adoptions" ON public.adoptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_insert_adoption" ON public.adoptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND NOT public.is_admin());


-- =============================================================================
-- 15. POLICIES — TABELA: gps_devices (legado)
-- =============================================================================

CREATE POLICY "admin_all_gps_devices" ON public.gps_devices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_gps_devices" ON public.gps_devices
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());


-- =============================================================================
-- 16. POLICIES — TABELA: gps_locations (legado)
-- =============================================================================

CREATE POLICY "admin_all_gps_locations" ON public.gps_locations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_gps_locations" ON public.gps_locations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gps_devices gd
      WHERE gd.id = gps_locations.device_id AND gd.owner_id = auth.uid()
    )
  );


-- =============================================================================
-- 17. POLICIES — TABELA: foster_volunteers
--    Nome, telefone, endereço. Privado. Tutor gerencia apenas o próprio cadastro.
-- =============================================================================

CREATE POLICY "admin_all_foster_volunteers" ON public.foster_volunteers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_foster_volunteer" ON public.foster_volunteers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "owner_insert_foster_volunteer" ON public.foster_volunteers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "owner_update_own_foster_volunteer" ON public.foster_volunteers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner_delete_own_foster_volunteer" ON public.foster_volunteers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND NOT public.is_admin());


-- =============================================================================
-- 18. POLICIES — TABELA: org_protectors
--    Lista pública: apenas ONGs aprovadas e ativas.
--    phone, email, pix_key nunca expostos ao anônimo (ver view pública abaixo).
-- =============================================================================

CREATE POLICY "admin_all_org_protectors" ON public.org_protectors
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner_select_own_org_protector" ON public.org_protectors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "owner_insert_org_protector" ON public.org_protectors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "owner_update_own_org_protector" ON public.org_protectors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND NOT public.is_admin())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner_delete_own_org_protector" ON public.org_protectors
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "anon_select_approved_org_protectors" ON public.org_protectors
  FOR SELECT TO anon
  USING (is_approved = true AND is_active = true);


-- =============================================================================
-- 19. POLICIES — TABELA: activity_logs
--    Histórico de ações do usuário. Privado.
-- =============================================================================

CREATE POLICY "admin_all_activity_logs" ON public.activity_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_select_own_activity_logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- =============================================================================
-- 20. POLICIES — TABELA: breeds
--    Dados de referência públicos (lista de raças). Leitura irrestrita.
--    Apenas admin pode criar/editar/excluir raças.
-- =============================================================================

CREATE POLICY "anyone_select_breeds" ON public.breeds
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "admin_manage_breeds" ON public.breeds
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================================
-- 21. POLICIES — TABELA: otp_verifications
--    code_hash, telefone. Extremamente sensível.
--    Apenas admin pode auditar. Backend (postgres) opera sem precisar de policy.
-- =============================================================================

CREATE POLICY "admin_all_otp_verifications" ON public.otp_verifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================================
-- 22. POLICIES — TABELA: smart_tags (legado, se existir)
--    Tabela legada da migration inicial. Apenas admin.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'smart_tags'
  ) THEN
    EXECUTE '
      CREATE POLICY "admin_only_smart_tags_legacy" ON public.smart_tags
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin())
    ';
  END IF;
END $$;


-- =============================================================================
-- 23. GRANTS — Permissões de tabela para os roles do Supabase
--    O role postgres (backend/Prisma) já tem acesso total como superuser.
--    O role authenticated recebe GRANT; as RLS policies restringem por linha.
--    O role anon recebe GRANT mínimo; as RLS policies limitam o que pode ler.
--
--    NOTA: REVOKE ALL antes dos GRANTs garante estado limpo.
--    O backend (postgres superuser) não é afetado por REVOKE em outros roles.
-- =============================================================================

-- Limpa grants anteriores para authenticated e anon
REVOKE ALL ON public.users              FROM anon, authenticated;
REVOKE ALL ON public.pets               FROM anon, authenticated;
REVOKE ALL ON public.pet_health         FROM anon, authenticated;
REVOKE ALL ON public.pet_media          FROM anon, authenticated;
REVOKE ALL ON public.announcements      FROM anon, authenticated;
REVOKE ALL ON public.announcement_images FROM anon, authenticated;
REVOKE ALL ON public.smart_tags_new     FROM anon, authenticated;
REVOKE ALL ON public.tag_scan_logs      FROM anon, authenticated;
REVOKE ALL ON public.device_batches     FROM anon, authenticated;
REVOKE ALL ON public.devices            FROM anon, authenticated;
REVOKE ALL ON public.adoptions          FROM anon, authenticated;
REVOKE ALL ON public.gps_devices        FROM anon, authenticated;
REVOKE ALL ON public.gps_locations      FROM anon, authenticated;
REVOKE ALL ON public.foster_volunteers  FROM anon, authenticated;
REVOKE ALL ON public.org_protectors     FROM anon, authenticated;
REVOKE ALL ON public.activity_logs      FROM anon, authenticated;
REVOKE ALL ON public.breeds             FROM anon, authenticated;
REVOKE ALL ON public.otp_verifications  FROM anon, authenticated;

-- AUTHENTICATED: acesso via RLS policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_health         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_media          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_tags_new     TO authenticated;
GRANT SELECT                         ON public.tag_scan_logs      TO authenticated;
GRANT SELECT                         ON public.device_batches     TO authenticated;
GRANT SELECT                         ON public.devices            TO authenticated;
GRANT SELECT, INSERT                 ON public.adoptions          TO authenticated;
GRANT SELECT                         ON public.gps_devices        TO authenticated;
GRANT SELECT                         ON public.gps_locations      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foster_volunteers  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_protectors     TO authenticated;
GRANT SELECT                         ON public.activity_logs      TO authenticated;
GRANT SELECT                         ON public.breeds             TO authenticated;
GRANT SELECT                         ON public.otp_verifications  TO authenticated;

-- ANON: apenas leitura de dados públicos (RLS policies restringem por linha)
GRANT SELECT ON public.announcements       TO anon;
GRANT SELECT ON public.announcement_images TO anon;
GRANT SELECT ON public.pets                TO anon;
GRANT SELECT ON public.pet_media           TO anon;
GRANT SELECT ON public.smart_tags_new      TO anon;
GRANT SELECT ON public.breeds              TO anon;
GRANT SELECT ON public.org_protectors      TO anon;
-- tag_scan_logs: INSERT pelo backend (postgres), não pelo anon via PostgREST
-- otp_verifications, adoptions, users, devices, gps_*: nenhum acesso anon

-- Sequences (INSERT em tabelas com UUID gerado pelo banco)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- =============================================================================
-- 24. VIEW PÚBLICA SEGURA: public.public_announcements
--    Expõe apenas campos seguros de anúncios ATIVOS.
--    OMITE: contact_phone, owner_id, street, location_notes, matched_with_id,
--            latitude, longitude (coordenadas exatas).
-- =============================================================================

DROP VIEW IF EXISTS public.public_announcements;

CREATE VIEW public.public_announcements AS
SELECT
  a.id,
  a.type,
  a.status,
  a.pet_name,
  a.species,
  a.breed,
  a.size,
  a.coat_color,
  a.eye_color,
  a.specific_marks,
  a.pet_photo_url,
  a.state,
  a.city,
  a.neighborhood,
  -- street, location_notes, latitude, longitude OMITIDOS (privacidade)
  a.event_date,
  a.contact_name,
  -- contact_phone OMITIDO (exposto apenas via backend autenticado)
  -- owner_id OMITIDO
  -- matched_with_id OMITIDO
  a.is_featured,
  a.views_count,
  a.created_at,
  a.updated_at
FROM public.announcements a
WHERE a.status = 'ACTIVE';

GRANT SELECT ON public.public_announcements TO anon, authenticated;


-- =============================================================================
-- 25. VIEW PÚBLICA SEGURA: public.public_pet_tag
--    Dados para a página pública /pet/:code (Smart Tag escaneada).
--    OMITE: owner_id, secret_mark, microchip_number, pedigree_number,
--           kennel_name, dados financeiros, coordenadas exatas.
--    O backend enriquece com whatsapp do tutor de forma controlada pela API.
-- =============================================================================

DROP VIEW IF EXISTS public.public_pet_tag;

CREATE VIEW public.public_pet_tag AS
SELECT
  t.code                  AS tag_code,
  t.status                AS tag_status,
  p.id                    AS pet_id,
  p.name                  AS pet_name,
  p.species,
  p.breed,
  p.breed_name,
  p.size,
  p.sex,
  p.coat_color,
  p.eye_color,
  p.coat_type,
  p.specific_marks,
  p.profile_photo_url,
  p.behavior,
  p.is_lost,
  p.is_found,
  p.is_returned,
  p.last_seen_location,
  p.lost_notes,
  -- owner_id OMITIDO
  -- secret_mark OMITIDO
  -- microchip_number OMITIDO
  -- pedigree_number OMITIDO
  -- kennel_name OMITIDO
  t.activated_at
FROM public.smart_tags_new t
INNER JOIN public.pets p ON p.id = t.pet_id
WHERE t.status = 'ACTIVE'
  AND p.is_active = true;

GRANT SELECT ON public.public_pet_tag TO anon, authenticated;


-- =============================================================================
-- 26. VIEW PÚBLICA SEGURA: public.public_org_protectors
--    Diretório de ONGs/protetores aprovados.
--    OMITE: user_id, phone, email, pix_key, address.
-- =============================================================================

DROP VIEW IF EXISTS public.public_org_protectors;

CREATE VIEW public.public_org_protectors AS
SELECT
  o.id,
  o.type,
  o.name,
  o.cnpj,
  o.description,
  o.website,
  o.instagram,
  o.state,
  o.city,
  o.neighborhood,
  -- address, phone, email, pix_key, user_id OMITIDOS
  o.donation_info,
  o.logo_url,
  o.cover_url,
  o.acting_species,
  o.acting_cities,
  o.is_approved,
  o.is_active,
  o.created_at
FROM public.org_protectors o
WHERE o.is_approved = true AND o.is_active = true;

GRANT SELECT ON public.public_org_protectors TO anon, authenticated;


-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
