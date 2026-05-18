CREATE TABLE IF NOT EXISTS public.content_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.content_posts(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_post_comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.content_posts
  ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_content_post_comments_post_id_created_at
  ON public.content_post_comments (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_post_comments_patient_id
  ON public.content_post_comments (patient_id);

CREATE INDEX IF NOT EXISTS idx_content_post_likes_post_patient
  ON public.content_post_likes (post_id, patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_post_likes_post_patient
  ON public.content_post_likes (post_id, patient_id);

CREATE OR REPLACE FUNCTION public.update_content_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.content_posts
      SET comment_count = COALESCE(comment_count, 0) + 1
      WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.content_posts
      SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
      WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_comment_count ON public.content_post_comments;
CREATE TRIGGER trg_content_comment_count
AFTER INSERT OR DELETE ON public.content_post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_content_comment_count();

CREATE OR REPLACE FUNCTION public.update_content_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.content_posts
      SET like_count = COALESCE(like_count, 0) + 1
      WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.content_posts
      SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
      WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_like_count ON public.content_post_likes;
CREATE TRIGGER trg_content_like_count
AFTER INSERT OR DELETE ON public.content_post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_content_like_count();

DROP POLICY IF EXISTS "comments_own_clinic" ON public.content_post_comments;
DROP POLICY IF EXISTS comments_patient_insert ON public.content_post_comments;
DROP POLICY IF EXISTS comments_member_read ON public.content_post_comments;
DROP POLICY IF EXISTS comments_patient_delete_own ON public.content_post_comments;
DROP POLICY IF EXISTS comments_doctor_delete ON public.content_post_comments;

CREATE POLICY comments_patient_insert
ON public.content_post_comments
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  AND post_id IN (
    SELECT cp.id
    FROM public.content_posts cp
    JOIN public.patients pt ON pt.user_id = auth.uid()
    WHERE cp.clinic_id = pt.clinic_id AND cp.is_published = true
  )
);

CREATE POLICY comments_member_read
ON public.content_post_comments
FOR SELECT
TO authenticated
USING (
  post_id IN (
    SELECT cp.id
    FROM public.content_posts cp
    WHERE cp.clinic_id = public.get_user_clinic_id() AND cp.is_published = true
  )
  OR (public.is_doctor() AND post_id IN (
    SELECT cp.id FROM public.content_posts cp WHERE cp.clinic_id = public.get_user_clinic_id()
  ))
);

CREATE POLICY comments_patient_delete_own
ON public.content_post_comments
FOR DELETE
TO authenticated
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY comments_doctor_delete
ON public.content_post_comments
FOR DELETE
TO authenticated
USING (
  public.is_doctor() AND post_id IN (
    SELECT cp.id FROM public.content_posts cp WHERE cp.clinic_id = public.get_user_clinic_id()
  )
);

DROP POLICY IF EXISTS likes_own ON public.content_post_likes;
DROP POLICY IF EXISTS likes_read ON public.content_post_likes;

CREATE POLICY likes_patient_insert
ON public.content_post_likes
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  AND post_id IN (
    SELECT cp.id
    FROM public.content_posts cp
    JOIN public.patients pt ON pt.user_id = auth.uid()
    WHERE cp.clinic_id = pt.clinic_id AND cp.is_published = true
  )
);

CREATE POLICY likes_patient_delete_own
ON public.content_post_likes
FOR DELETE
TO authenticated
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY likes_read_member
ON public.content_post_likes
FOR SELECT
TO authenticated
USING (
  post_id IN (
    SELECT cp.id FROM public.content_posts cp WHERE cp.clinic_id = public.get_user_clinic_id()
  )
);

UPDATE public.content_posts cp
SET comment_count = counts.total
FROM (
  SELECT post_id, COUNT(*)::integer AS total
  FROM public.content_post_comments
  GROUP BY post_id
) counts
WHERE cp.id = counts.post_id;

UPDATE public.content_posts cp
SET like_count = counts.total
FROM (
  SELECT post_id, COUNT(*)::integer AS total
  FROM public.content_post_likes
  GROUP BY post_id
) counts
WHERE cp.id = counts.post_id;