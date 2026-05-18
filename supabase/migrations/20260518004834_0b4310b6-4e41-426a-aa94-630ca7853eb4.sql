
-- ============================================================
-- SOLARIS — SCHEMA COMPLETO v2.0
-- ============================================================

-- Helper trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ============================================================
-- CLINICS (tenant raiz)
-- ============================================================
CREATE TABLE public.clinics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  doctor_name     TEXT NOT NULL,
  specialty       TEXT DEFAULT 'Dermatologista',
  access_code     TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  brand_color_primary  TEXT DEFAULT '#1B8A7A',
  brand_color_dark     TEXT DEFAULT '#0D4F47',
  brand_color_light    TEXT DEFAULT '#E1F5F2',
  brand_color_accent   TEXT DEFAULT '#0A1628',
  logo_url             TEXT,
  favicon_url          TEXT,
  profile_banner_url   TEXT,
  profile_photo_url    TEXT,
  profile_tagline      TEXT,
  profile_description  TEXT,
  profile_address      TEXT,
  profile_city         TEXT,
  profile_state        TEXT,
  profile_phone        TEXT,
  profile_whatsapp     TEXT,
  profile_instagram    TEXT,
  profile_website      TEXT,
  profile_cnpj         TEXT,
  profile_crm          TEXT,
  years_experience     INT,
  uv_alert_message     TEXT DEFAULT 'Lembre-se de aplicar o protetor solar FPS50+!',
  max_patients         INT DEFAULT 30,
  plan                 TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','enterprise')),
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  subscription_status  TEXT DEFAULT 'trialing',
  trial_ends_at        TIMESTAMPTZ
);
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE public.doctors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  specialty   TEXT DEFAULT 'Dermatologista',
  crm         TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  role        TEXT DEFAULT 'admin' CHECK (role IN ('admin','associate')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE public.patients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL UNIQUE,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  birth_date   DATE,
  avatar_url   TEXT,
  city         TEXT,
  state        TEXT,
  lat          DECIMAL(10,6),
  lng          DECIMAL(10,6),
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- HELPER FUNCTIONS (security definer to avoid RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT clinic_id FROM public.doctors WHERE user_id = auth.uid()
  UNION
  SELECT clinic_id FROM public.patients WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.doctors WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_patient()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.patients WHERE user_id = auth.uid());
$$;

-- ============================================================
-- WIKI CONDITIONS (must come before content_posts FK)
-- ============================================================
CREATE TABLE public.wiki_conditions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  category        TEXT,
  emoji           TEXT DEFAULT '🩺',
  description     TEXT NOT NULL,
  causes          TEXT,
  symptoms        TEXT,
  diagnosis       TEXT,
  treatment_info  TEXT,
  prevention_tips TEXT,
  home_care_steps JSONB DEFAULT '[]',
  is_published    BOOLEAN DEFAULT FALSE,
  view_count      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, slug)
);
CREATE TRIGGER trg_wiki_updated BEFORE UPDATE ON public.wiki_conditions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wiki_videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id     UUID REFERENCES public.wiki_conditions(id) ON DELETE CASCADE,
  clinic_id        UUID REFERENCES public.clinics(id),
  title            TEXT NOT NULL,
  description      TEXT,
  section          TEXT,
  storage_path     TEXT NOT NULL,
  thumbnail_path   TEXT,
  duration_seconds INT,
  order_index      INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLINIC PROFILE ASSETS
-- ============================================================
CREATE TABLE public.clinic_gallery_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url   TEXT NOT NULL,
  caption      TEXT,
  order_index  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.clinic_specialties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  order_index INT DEFAULT 0
);

CREATE TABLE public.clinic_testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  avatar_url   TEXT,
  content      TEXT NOT NULL,
  rating       INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_published BOOLEAN DEFAULT FALSE,
  order_index  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TREATMENTS + EVOLUTION PHOTOS
-- ============================================================
CREATE TABLE public.treatments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id       UUID REFERENCES public.clinics(id),
  doctor_id       UUID REFERENCES public.doctors(id),
  condition_name  TEXT NOT NULL,
  protocol        TEXT,
  started_at      DATE NOT NULL,
  total_weeks     INT NOT NULL,
  current_week    INT DEFAULT 1,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','completed','paused','abandoned')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_treatments_updated BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.evolution_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id    UUID REFERENCES public.treatments(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES public.patients(id),
  clinic_id       UUID REFERENCES public.clinics(id),
  week_number     INT NOT NULL,
  angle           TEXT DEFAULT 'frontal' CHECK (angle IN ('frontal','perfil_direito','perfil_esquerdo','detalhe')),
  storage_path    TEXT NOT NULL,
  thumbnail_path  TEXT,
  checklist_light         BOOLEAN DEFAULT FALSE,
  checklist_accessories   BOOLEAN DEFAULT FALSE,
  checklist_background    BOOLEAN DEFAULT FALSE,
  doctor_comment  TEXT,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES public.doctors(id),
  improvement_score DECIMAL(5,2),
  taken_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTENT LIBRARY
-- ============================================================
CREATE TABLE public.content_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES public.doctors(id),
  type            TEXT NOT NULL CHECK (type IN ('article','video','tip','protocol','news')),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  summary         TEXT,
  content         TEXT,
  cover_image_url TEXT,
  video_url       TEXT,
  video_storage_path TEXT,
  video_thumbnail_url TEXT,
  duration_seconds INT,
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  related_condition_id UUID REFERENCES public.wiki_conditions(id),
  is_published    BOOLEAN DEFAULT FALSE,
  is_featured     BOOLEAN DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  view_count      INT DEFAULT 0,
  like_count      INT DEFAULT 0,
  read_time_minutes INT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, slug)
);
CREATE TRIGGER trg_content_updated BEFORE UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.content_post_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES public.content_posts(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, patient_id)
);

CREATE TABLE public.content_bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES public.content_posts(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, patient_id)
);

-- ============================================================
-- UV / COMMENTS / NOTIFICATIONS / BILLING
-- ============================================================
CREATE TABLE public.uv_protection_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id   UUID REFERENCES public.clinics(id),
  uv_index    DECIMAL(4,1),
  temperature DECIMAL(4,1),
  lat         DECIMAL(10,6),
  lng         DECIMAL(10,6),
  city        TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.clinical_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id  UUID REFERENCES public.treatments(id) ON DELETE CASCADE,
  photo_id      UUID REFERENCES public.evolution_photos(id) ON DELETE SET NULL,
  doctor_id     UUID REFERENCES public.doctors(id),
  patient_id    UUID REFERENCES public.patients(id),
  content       TEXT NOT NULL,
  is_visible_to_patient BOOLEAN DEFAULT TRUE,
  week_number   INT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  clinic_id    UUID REFERENCES public.clinics(id),
  type         TEXT NOT NULL CHECK (type IN (
    'photo_received','doctor_comment','uv_alert',
    'weekly_photo_reminder','treatment_milestone',
    'new_content_published','new_wiki_content','clinic_news'
  )),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  data         JSONB DEFAULT '{}',
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.billing_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID REFERENCES public.clinics(id),
  event_type    TEXT NOT NULL,
  amount_cents  INT,
  currency      TEXT DEFAULT 'BRL',
  stripe_event_id TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.clinics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_specialties   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_testimonials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_photos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_conditions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_videos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_post_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_bookmarks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uv_protection_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================
-- CLINICS
CREATE POLICY clinics_read_member ON public.clinics FOR SELECT TO authenticated
  USING (id = public.get_user_clinic_id());
CREATE POLICY clinics_lookup_by_code ON public.clinics FOR SELECT TO anon, authenticated
  USING (true);  -- needed for access_code lookup during registration; consider tightening later
CREATE POLICY clinics_doctor_update ON public.clinics FOR UPDATE TO authenticated
  USING (public.is_doctor() AND id = public.get_user_clinic_id());
CREATE POLICY clinics_doctor_insert ON public.clinics FOR INSERT TO authenticated
  WITH CHECK (true);

-- DOCTORS
CREATE POLICY doctors_self_read ON public.doctors FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR clinic_id = public.get_user_clinic_id());
CREATE POLICY doctors_self_insert ON public.doctors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY doctors_self_update ON public.doctors FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- PATIENTS
CREATE POLICY patients_self_read ON public.patients FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (public.is_doctor() AND clinic_id = public.get_user_clinic_id()));
CREATE POLICY patients_self_insert ON public.patients FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY patients_self_update ON public.patients FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (public.is_doctor() AND clinic_id = public.get_user_clinic_id()));

-- GALLERY / SPECIALTIES / TESTIMONIALS
CREATE POLICY gallery_doctor ON public.clinic_gallery_photos FOR ALL TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id())
  WITH CHECK (public.is_doctor() AND clinic_id = public.get_user_clinic_id());
CREATE POLICY gallery_read ON public.clinic_gallery_photos FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY specialties_doctor ON public.clinic_specialties FOR ALL TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id())
  WITH CHECK (public.is_doctor() AND clinic_id = public.get_user_clinic_id());
CREATE POLICY specialties_read ON public.clinic_specialties FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY testimonials_doctor ON public.clinic_testimonials FOR ALL TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id())
  WITH CHECK (public.is_doctor() AND clinic_id = public.get_user_clinic_id());
CREATE POLICY testimonials_read ON public.clinic_testimonials FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id() AND is_published = TRUE);

-- TREATMENTS / PHOTOS
CREATE POLICY treatments_member ON public.treatments FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id() AND
    (public.is_doctor() OR patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())));
CREATE POLICY treatments_doctor_write ON public.treatments FOR ALL TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id())
  WITH CHECK (public.is_doctor() AND clinic_id = public.get_user_clinic_id());

CREATE POLICY photos_read ON public.evolution_photos FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id() AND
    (public.is_doctor() OR patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())));
CREATE POLICY photos_patient_insert ON public.evolution_photos FOR INSERT TO authenticated
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));
CREATE POLICY photos_doctor_update ON public.evolution_photos FOR UPDATE TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id());

-- WIKI
CREATE POLICY wiki_doctor ON public.wiki_conditions FOR ALL TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id())
  WITH CHECK (public.is_doctor() AND clinic_id = public.get_user_clinic_id());
CREATE POLICY wiki_patient_read ON public.wiki_conditions FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id() AND is_published = TRUE);

CREATE POLICY wiki_videos_doctor ON public.wiki_videos FOR ALL TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id())
  WITH CHECK (public.is_doctor() AND clinic_id = public.get_user_clinic_id());
CREATE POLICY wiki_videos_read ON public.wiki_videos FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id());

-- CONTENT
CREATE POLICY content_doctor ON public.content_posts FOR ALL TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id())
  WITH CHECK (public.is_doctor() AND clinic_id = public.get_user_clinic_id());
CREATE POLICY content_patient_read ON public.content_posts FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id() AND is_published = TRUE);

CREATE POLICY likes_own ON public.content_post_likes FOR ALL TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));
CREATE POLICY likes_read ON public.content_post_likes FOR SELECT TO authenticated
  USING (post_id IN (SELECT id FROM public.content_posts WHERE clinic_id = public.get_user_clinic_id()));

CREATE POLICY bookmarks_own ON public.content_bookmarks FOR ALL TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- UV / COMMENTS / NOTIFICATIONS
CREATE POLICY uv_own ON public.uv_protection_logs FOR ALL TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY comments_member ON public.clinical_comments FOR SELECT TO authenticated
  USING (public.is_doctor() OR patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));
CREATE POLICY comments_doctor_write ON public.clinical_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_doctor());

CREATE POLICY notif_own ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY billing_doctor_read ON public.billing_events FOR SELECT TO authenticated
  USING (public.is_doctor() AND clinic_id = public.get_user_clinic_id());

-- ============================================================
-- ACCESS CODE GENERATOR
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_clinic_access_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE code TEXT; exists_check INT;
BEGIN
  LOOP
    code := 'SLR-' || lpad((floor(random()*10000))::int::text, 4, '0');
    SELECT COUNT(*) INTO exists_check FROM public.clinics WHERE access_code = code;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN code;
END; $$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('clinic-logos', 'clinic-logos', true),
  ('clinic-banners', 'clinic-banners', true),
  ('clinic-gallery', 'clinic-gallery', true),
  ('clinic-photos', 'clinic-photos', true),
  ('evolution-photos', 'evolution-photos', false),
  ('wiki-videos', 'wiki-videos', false),
  ('wiki-thumbnails', 'wiki-thumbnails', true),
  ('content-covers', 'content-covers', true),
  ('content-videos', 'content-videos', false),
  ('content-thumbnails', 'content-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public buckets: read by all, write by clinic members
CREATE POLICY "public_clinic_assets_read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('clinic-logos','clinic-banners','clinic-gallery','clinic-photos','wiki-thumbnails','content-covers','content-thumbnails'));

CREATE POLICY "clinic_doctor_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('clinic-logos','clinic-banners','clinic-gallery','clinic-photos','wiki-thumbnails','wiki-videos','content-covers','content-videos','content-thumbnails')
    AND public.is_doctor());

CREATE POLICY "clinic_doctor_update_obj" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('clinic-logos','clinic-banners','clinic-gallery','clinic-photos','wiki-thumbnails','wiki-videos','content-covers','content-videos','content-thumbnails')
    AND public.is_doctor());

CREATE POLICY "clinic_doctor_delete_obj" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('clinic-logos','clinic-banners','clinic-gallery','clinic-photos','wiki-thumbnails','wiki-videos','content-covers','content-videos','content-thumbnails')
    AND public.is_doctor());

-- Evolution photos: patient uploads own, doctor reads clinic
CREATE POLICY "evolution_patient_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evolution-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "evolution_member_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evolution-photos');
