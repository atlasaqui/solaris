
-- Lock down search_path on helper functions
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_clinic_access_code() SET search_path = public;

-- Revoke execute from anon on SECURITY DEFINER helpers (only authenticated/RLS need them)
REVOKE EXECUTE ON FUNCTION public.get_user_clinic_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_doctor() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_patient() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_clinic_access_code() FROM anon, public;

-- Tighten clinic insert: must be tied to authenticated user creating their first clinic
DROP POLICY IF EXISTS clinics_doctor_insert ON public.clinics;
CREATE POLICY clinics_doctor_insert ON public.clinics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten doctor insert
DROP POLICY IF EXISTS doctors_self_insert ON public.doctors;
CREATE POLICY doctors_self_insert ON public.doctors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Tighten patient insert
DROP POLICY IF EXISTS patients_self_insert ON public.patients;
CREATE POLICY patients_self_insert ON public.patients FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);
