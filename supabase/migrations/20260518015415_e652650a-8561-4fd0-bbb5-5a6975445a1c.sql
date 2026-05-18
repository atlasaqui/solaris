
-- Storage policies for evolution-photos bucket (private)
-- Path convention: {patient_id}/{week}-{angle}-{timestamp}.{ext}

CREATE POLICY "evo_photos_patient_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'evolution-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "evo_photos_patient_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'evolution-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "evo_photos_doctor_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'evolution-photos'
  AND public.is_doctor()
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE clinic_id = public.get_user_clinic_id()
  )
);

CREATE POLICY "evo_photos_patient_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'evolution-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE user_id = auth.uid()
  )
);
