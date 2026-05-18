
-- 1) Extend evolution_photos
ALTER TABLE public.evolution_photos
  ADD COLUMN IF NOT EXISTS ai_analysis jsonb,
  ADD COLUMN IF NOT EXISTS doctor_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_visible_to_patient boolean NOT NULL DEFAULT false;

-- 2) patient_achievements
CREATE TABLE IF NOT EXISTS public.patient_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  achievement text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, achievement)
);

ALTER TABLE public.patient_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ach_read"
  ON public.patient_achievements FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    OR (is_doctor() AND clinic_id = get_user_clinic_id())
  );

CREATE POLICY "ach_doctor_write"
  ON public.patient_achievements FOR ALL TO authenticated
  USING (is_doctor() AND clinic_id = get_user_clinic_id())
  WITH CHECK (is_doctor() AND clinic_id = get_user_clinic_id());

CREATE POLICY "ach_patient_insert"
  ON public.patient_achievements FOR INSERT TO authenticated
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- 3) doctor_feedback
CREATE TABLE IF NOT EXISTS public.doctor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES public.evolution_photos(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES public.treatments(id) ON DELETE SET NULL,
  week_number integer,
  progress_level text NOT NULL CHECK (progress_level IN ('none','mild','moderate','great','excellent')),
  message text,
  next_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  include_ai_analysis boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctor_feedback_patient ON public.doctor_feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_feedback_photo ON public.doctor_feedback(photo_id);

ALTER TABLE public.doctor_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fb_doctor_all"
  ON public.doctor_feedback FOR ALL TO authenticated
  USING (is_doctor() AND clinic_id = get_user_clinic_id())
  WITH CHECK (is_doctor() AND clinic_id = get_user_clinic_id());

CREATE POLICY "fb_patient_read"
  ON public.doctor_feedback FOR SELECT TO authenticated
  USING (
    status = 'sent'
    AND patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

CREATE POLICY "fb_patient_update_checklist"
  ON public.doctor_feedback FOR UPDATE TO authenticated
  USING (
    status = 'sent'
    AND patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

CREATE TRIGGER trg_doctor_feedback_updated
  BEFORE UPDATE ON public.doctor_feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
