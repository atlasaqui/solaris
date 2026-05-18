import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookOpen, Clock, FileText, Heart, Lightbulb, Loader2, MessageCircle, Play, Stethoscope, Video } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/content/feed")({
  head: () => ({ meta: [{ title: "Biblioteca" }] }),
  component: Feed,
});

type Post = {
  id: string; slug: string; title: string; summary: string | null; type: string;
  category: string | null; cover_image_url: string | null; video_thumbnail_url: string | null;
  read_time_minutes: number | null; duration_seconds: number | null; published_at: string | null;
  like_count: number | null; comment_count: number | null;
  wiki_conditions: { name: string; slug: string } | null;
};

const TYPE_META: Record<string, { icon: typeof FileText; label: string }> = {
  article: { icon: FileText, label: "Artigo" },
  video: { icon: Video, label: "Vídeo" },
  tip: { icon: Lightbulb, label: "Dica" },
  protocol: { icon: Stethoscope, label: "Protocolo" },
};

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [patientId, setPatientId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
    if (!pt?.clinic_id) { setLoading(false); return; }
    setPatientId(pt.id);
    const [{ data: content, error }, { data: lks }, { data: bms }] = await Promise.all([
      supabase.from("content_posts")
        .select("id, slug, title, summary, type, category, cover_image_url, video_thumbnail_url, read_time_minutes, duration_seconds, published_at, like_count, comment_count, wiki_conditions(name, slug)")
        .eq("clinic_id", pt.clinic_id)
        .eq("is_published", true)
        .order("published_at", { ascending: false }),
      supabase.from("content_post_likes").select("post_id").eq("patient_id", pt.id),
      supabase.from("content_bookmarks").select("post_id").eq("patient_id", pt.id),
    ]);
    if (error) toast.error(error.message);
    setPosts((content ?? []) as unknown as Post[]);
    setLikes(new Set((lks ?? []).map((l: any) => l.post_id)));
    setBookmarks(new Set((bms ?? []).map((b: any) => b.post_id)));
    setLoading(false);
  };

  const filtered = useMemo(() => filter === "all" ? posts : posts.filter((p) => p.type === filter), [filter, posts]);

  const toggleLike = async (postId: string) => {
    if (!patientId) return;
    const liked = likes.has(postId);
    setLikes((prev) => {
      const next = new Set(prev);
      liked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, like_count: Math.max(0, (p.like_count ?? 0) + (liked ? -1 : 1)) } : p));
    const { error } = liked
      ? await supabase.from("content_post_likes").delete().eq("post_id", postId).eq("patient_id", patientId)
      : await supabase.from("content_post_likes").insert({ post_id: postId, patient_id: patientId });
    if (error) { toast.error(error.message); load(); }
  };

  const toggleBookmark = async (postId: string) => {
    if (!patientId) return;
    const saved = bookmarks.has(postId);
    setBookmarks((prev) => {
      const next = new Set(prev);
      saved ? next.delete(postId) : next.add(postId);
      return next;
    });
    const { error } = saved
      ? await supabase.from("content_bookmarks").delete().eq("post_id", postId).eq("patient_id", patientId)
      : await supabase.from("content_bookmarks").insert({ post_id: postId, patient_id: patientId });
    if (error) { toast.error(error.message); load(); }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[22px] font-semibold">Biblioteca</h1>
        <p className="text-[13px] text-muted-foreground">Conteúdos selecionados pelo seu médico</p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ id: "all", label: "Todos" }, { id: "article", label: "Artigos" }, { id: "video", label: "Vídeos" }, { id: "tip", label: "Dicas" }, { id: "protocol", label: "Protocolos" }].map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)} className="shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition"
            style={filter === t.id ? { background: "var(--clinic-primary)", color: "#fff" } : { background: "#F1F5F9", color: "#475569" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum conteúdo por aqui ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => <PostCard key={p.id} post={p} liked={likes.has(p.id)} saved={bookmarks.has(p.id)} onLike={toggleLike} onBookmark={toggleBookmark} />)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post: p, liked, saved, onLike, onBookmark }: { post: Post; liked: boolean; saved: boolean; onLike: (id: string) => void; onBookmark: (id: string) => void }) {
  const T = TYPE_META[p.type] ?? TYPE_META.article;
  const img = p.video_thumbnail_url || p.cover_image_url;
  return (
    <article className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      <Link to="/app/content/$slug" params={{ slug: p.slug }} className="block">
        {img && (
          <div className="relative aspect-video w-full bg-[#F1F5F9]">
            <img src={img} alt={p.title} className="h-full w-full object-cover" />
            {p.type === "video" && <div className="absolute inset-0 grid place-items-center bg-black/20"><div className="grid h-12 w-12 place-items-center rounded-full bg-white/95"><Play className="h-5 w-5 fill-current" /></div></div>}
          </div>
        )}
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}><T.icon className="h-3 w-3" /> {T.label}</span>
            {p.wiki_conditions && <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]">{p.wiki_conditions.name}</span>}
            {p.category && <span className="text-[11px] text-muted-foreground">{p.category}</span>}
          </div>
          <h3 className="font-display text-[15px] font-semibold leading-snug">{p.title}</h3>
          {p.summary && <p className="line-clamp-2 text-[13px] text-muted-foreground">{p.summary}</p>}
          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
            {p.read_time_minutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.read_time_minutes} min</span>}
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.like_count ?? 0}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p.comment_count ?? 0}</span>
          </div>
        </div>
      </Link>
      <div className="flex border-t border-[#F1F5F9] px-2 py-1.5">
        <button onClick={() => onLike(p.id)} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium hover:bg-[#F8FAFC]" style={{ color: liked ? "#EF4444" : "#475569" }}><Heart className="h-4 w-4" fill={liked ? "#EF4444" : "none"} /> Curtir</button>
        <button onClick={() => onBookmark(p.id)} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium hover:bg-[#F8FAFC]" style={{ color: saved ? "var(--clinic-primary)" : "#475569" }}><Bookmark className="h-4 w-4" fill={saved ? "var(--clinic-primary)" : "none"} /> Salvar</button>
      </div>
    </article>
  );
}