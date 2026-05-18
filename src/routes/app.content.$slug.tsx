import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bookmark, Clock, Heart, Loader2, MessageCircle, Send, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/content/$slug")({
  head: () => ({ meta: [{ title: "Conteúdo" }] }),
  component: PostDetail,
});

type Post = {
  id: string; title: string; summary: string | null; content: string | null;
  cover_image_url: string | null; video_url: string | null; video_thumbnail_url: string | null;
  category: string | null; type: string; read_time_minutes: number | null;
  like_count: number | null; comment_count: number | null;
  wiki_conditions: { name: string; slug: string } | null;
};

type Comment = {
  id: string; content: string; created_at: string | null;
  patients: { full_name: string; avatar_url: string | null } | null;
};

function PostDetail() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => { load(); }, [slug]);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
    if (pt?.id) setPatientId(pt.id);
    const { data, error } = await supabase.from("content_posts")
      .select("*, wiki_conditions(name, slug)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) toast.error(error.message);
    setPost(data as unknown as Post | null);
    if (data) {
      await supabase.from("content_posts").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", data.id);
      const [{ data: rows }, { data: likeRows }, { data: bookmarkRows }] = await Promise.all([
        supabase.from("content_post_comments").select("id, content, created_at, patients(full_name, avatar_url)").eq("post_id", data.id).order("created_at", { ascending: false }),
        pt?.id ? supabase.from("content_post_likes").select("id").eq("post_id", data.id).eq("patient_id", pt.id) : Promise.resolve({ data: [] }),
        pt?.id ? supabase.from("content_bookmarks").select("id").eq("post_id", data.id).eq("patient_id", pt.id) : Promise.resolve({ data: [] }),
      ]);
      setComments((rows ?? []) as unknown as Comment[]);
      setLiked((likeRows ?? []).length > 0);
      setSaved((bookmarkRows ?? []).length > 0);
    }
    setLoading(false);
  };

  const img = post?.video_thumbnail_url || post?.cover_image_url;
  const safeHtml = useMemo(() => post?.content ?? "", [post?.content]);

  const toggleLike = async () => {
    if (!post || !patientId) return;
    const next = !liked;
    setLiked(next);
    setPost({ ...post, like_count: Math.max(0, (post.like_count ?? 0) + (next ? 1 : -1)) });
    const { error } = next
      ? await supabase.from("content_post_likes").insert({ post_id: post.id, patient_id: patientId })
      : await supabase.from("content_post_likes").delete().eq("post_id", post.id).eq("patient_id", patientId);
    if (error) { toast.error(error.message); load(); }
  };

  const toggleBookmark = async () => {
    if (!post || !patientId) return;
    const next = !saved;
    setSaved(next);
    const { error } = next
      ? await supabase.from("content_bookmarks").insert({ post_id: post.id, patient_id: patientId })
      : await supabase.from("content_bookmarks").delete().eq("post_id", post.id).eq("patient_id", patientId);
    if (error) { toast.error(error.message); load(); }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!post || !patientId || !commentText.trim()) return;
    setSending(true);
    const { error } = await supabase.from("content_post_comments").insert({ post_id: post.id, patient_id: patientId, content: commentText.trim() });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setCommentText("");
    load();
  };

  if (loading) return <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!post) return <div className="space-y-4"><Link to="/app/content/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link><p className="text-muted-foreground">Conteúdo não encontrado.</p></div>;

  return (
    <article className="-mx-5 -mt-5 pb-24">
      {img && (
        <div className="relative aspect-video w-full bg-[#F1F5F9]">
          <img src={img} alt={post.title} className="h-full w-full object-cover" />
          <Link to="/app/content/feed" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur"><ArrowLeft className="h-4 w-4" /></Link>
        </div>
      )}
      <div className="space-y-5 px-5 pt-5">
        {!img && <Link to="/app/content/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>}
        <div className="flex flex-wrap items-center gap-2">
          {post.category && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>{post.category}</span>}
          {post.wiki_conditions && <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]">{post.wiki_conditions.name}</span>}
          {post.read_time_minutes && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {post.read_time_minutes} min</span>}
        </div>
        <h1 className="font-display text-[24px] font-bold leading-tight">{post.title}</h1>
        {post.summary && <p className="text-[14px] text-muted-foreground">{post.summary}</p>}
        {post.type === "video" && post.video_url ? <video src={post.video_url} controls playsInline className="aspect-video w-full rounded-2xl bg-black object-cover" /> : null}
        <div className="prose prose-sm max-w-none text-[14px] leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: safeHtml }} />

        {post.wiki_conditions && (
          <Link to="/app/wiki/$slug" params={{ slug: post.wiki_conditions.slug }} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <span className="flex items-center gap-2 text-sm font-semibold"><Stethoscope className="h-4 w-4" /> Saiba mais sobre {post.wiki_conditions.name}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--clinic-primary)" }}>Ver na Wiki</span>
          </Link>
        )}

        <div className="flex items-center gap-2 border-y border-border py-3 text-sm text-muted-foreground">
          <button onClick={toggleLike} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 font-semibold hover:bg-white" style={{ color: liked ? "#EF4444" : undefined }}><Heart className="h-4 w-4" fill={liked ? "#EF4444" : "none"} /> {post.like_count ?? 0}</button>
          <button onClick={toggleBookmark} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 font-semibold hover:bg-white" style={{ color: saved ? "var(--clinic-primary)" : undefined }}><Bookmark className="h-4 w-4" fill={saved ? "var(--clinic-primary)" : "none"} /> Salvar</button>
          <span className="flex flex-1 items-center justify-center gap-2"><MessageCircle className="h-4 w-4" /> {comments.length}</span>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-[17px] font-semibold">Comentários</h2>
          {comments.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">Seja o primeiro a comentar</p> : comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}
        </section>
      </div>

      <form onSubmit={submitComment} className="fixed bottom-[65px] left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 gap-2 border-t border-border bg-white p-3">
        <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escreva um comentário" className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary" />
        <button disabled={sending || !commentText.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50" aria-label="Comentar">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </article>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const initials = (comment.patients?.full_name ?? "Paciente").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#F1F5F9] text-xs font-bold text-[#475569]">
        {comment.patients?.avatar_url ? <img src={comment.patients.avatar_url} alt="" className="h-full w-full object-cover" /> : initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{comment.patients?.full_name ?? "Paciente"}</span><span className="text-[11px] text-muted-foreground">{comment.created_at ? new Date(comment.created_at).toLocaleDateString("pt-BR") : ""}</span></div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
      </div>
    </div>
  );
}