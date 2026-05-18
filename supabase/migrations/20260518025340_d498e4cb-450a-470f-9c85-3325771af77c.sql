REVOKE EXECUTE ON FUNCTION public.update_content_comment_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_content_comment_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_content_comment_count() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.update_content_like_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_content_like_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_content_like_count() FROM authenticated;