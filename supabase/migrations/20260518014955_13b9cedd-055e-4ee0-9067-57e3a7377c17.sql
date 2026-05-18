-- Allow patients to insert their own messages in clinical_comments
DROP POLICY IF EXISTS comments_doctor_write ON public.clinical_comments;

CREATE POLICY comments_insert
ON public.clinical_comments
FOR INSERT
TO authenticated
WITH CHECK (
  is_doctor()
  OR (
    doctor_id IS NULL
    AND patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  )
);