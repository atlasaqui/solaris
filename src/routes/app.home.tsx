import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Bookmark, FileText, Video, Lightbulb, Play, Loader2, Sparkles, MessageCircle, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "Feed" }] }),
  component: Feed,
});

type Post = {
  id: string; slug: string; title: string; summary: string | null; type: string;
  category: string | null; cover_image_url: string | null; video_thumbnail_url: string | null;
  read_time_minutes: number | null; duration_seconds: number | null;
  published_at: string | null; created_at: string;
  like_count: number | null;
  comment_count: number | null;
  wiki_conditions: { name: string; slug: string } | null;
};

const TYPE_META: Record<string, { icon: typeof FileText; label: string }> = {
  article: { icon: FileText, label: "Artigo" },
  video: { icon: Video, label: "Vídeo" },
  tip: { icon: Lightbulb, label: "Dica" },
  protocol: { icon: Stethoscope, label: "Protocolo" },
};

const FILTERS = [
  { id: "all", label: "Tudo" },
  { id: "article", label: "Artigos" },
  { id: "video", label: "Vídeos" },
  { id: "tip", label: "Dicas" },
    { id: "protocol", label: "Protocolos" },
] as const;

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Feed() {
  const { brand } = useWhiteLabel();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [patientId, setPatientId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (pt) setPatientId(pt.id);

      const { data } = await supabase.from("content_posts")
        .select("id, slug, title, summary, type, category, cover_image_url, video_thumbnail_url, read_time_minutes, duration_seconds, published_at, created_at, like_count, comment_count, wiki_conditions(name, slug)")
        .eq("clinic_id", pt?.clinic_id)
        .eq("is_published", true).order("published_at", { ascending: false }).limit(50);
      setPosts((data ?? []) as Post[]);

      if (pt) {
        const [{ data: lks }, { data: bms }] = await Promise.all([
          supabase.from("content_post_likes").select("post_id").eq("patient_id", pt.id),
          supabase.from("content_bookmarks").select("post_id").eq("patient_id", pt.id),
        ]);
        setLikes(new Set((lks ?? []).map((l: any) => l.post_id)));
        setBookmarks(new Set((bms ?? []).map((b: any) => b.post_id)));
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.type === filter)),
    [posts, filter],
  );

  const toggleLike = async (postId: string) => {
    if (!patientId) return;
    const liked = likes.has(postId);
    const next = new Set(likes);
    liked ? next.delete(postId) : next.add(postId);
    setLikes(next);
    if (liked) {
      await supabase.from("content_post_likes").delete().eq("post_id", postId).eq("patient_id", patientId);
    } else {
      const { error } = await supabase.from("content_post_likes").insert({ post_id: postId, patient_id: patientId });
      if (error) { next.delete(postId); setLikes(new Set(next)); toast.error("Não foi possível curtir"); }
    }
  };

  const toggleBookmark = async (postId: string) => {
    if (!patientId) return;
    const saved = bookmarks.has(postId);
    const next = new Set(bookmarks);
    saved ? next.delete(postId) : next.add(postId);
    setBookmarks(next);
    if (saved) {
      await supabase.from("content_bookmarks").delete().eq("post_id", postId).eq("patient_id", patientId);
    } else {
      const { error } = await supabase.from("content_bookmarks").insert({ post_id: postId, patient_id: patientId });
      if (error) { next.delete(postId); setBookmarks(new Set(next)); toast.error("Não foi possível salvar"); }
      else toast.success("Salvo");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[22px] font-semibold">Feed da clínica</h1>
        <p className="text-[13px] text-muted-foreground">Novidades e cuidados publicados pela sua equipe</p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition"
            style={filter === f.id
              ? { background: "var(--clinic-primary)", color: "#fff" }
              : { background: "#F1F5F9", color: "#475569" }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nada por aqui ainda. Volte em breve.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const T = TYPE_META[p.type] ?? TYPE_META.article;
            const liked = likes.has(p.id);
            const saved = bookmarks.has(p.id);
            const img = p.video_thumbnail_url || p.cover_image_url;
            return (
              <article key={p.id} className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                {/* Card header */}
                <div className="flex items-center justify-between px-4 pt-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#F1F5F9] text-[11px] font-bold text-[#475569]">
                      {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" /> : brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold">{brand.name}</div>
                      <div className="text-[11px] text-muted-foreground">{timeAgo(p.published_at ?? p.created_at)}</div>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}
                  >
                    <T.icon className="h-3 w-3" /> {T.label}
                  </span>
                </div>

                <Link to="/app/content/$slug" params={{ slug: p.slug }} className="block">
                  {img && (
                    <div className="relative mt-3 aspect-video w-full bg-[#F1F5F9]">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      {p.type === "video" && (
                        <div className="absolute inset-0 grid place-items-center bg-black/20">
                          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-[#0A1628]">
                            <Play className="h-6 w-6 fill-current" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1.5 px-4 pt-3">
                    <h3 className="font-display text-[16px] font-semibold leading-snug">{p.title}</h3>
                    {p.summary && <p className="line-clamp-2 text-[13px] text-muted-foreground">{p.summary}</p>}
                  </div>
                </Link>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-1 border-t border-[#F1F5F9] px-2 py-1.5">
                  <button
                    onClick={() => toggleLike(p.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium transition hover:bg-[#F8FAFC]"
                    style={{ color: liked ? "#EF4444" : "#475569" }}
                  >
                    <Heart className="h-4 w-4" fill={liked ? "#EF4444" : "none"} />
                    Curtir
                  </button>
                  <button
                    onClick={() => toggleBookmark(p.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium transition hover:bg-[#F8FAFC]"
                    style={{ color: saved ? "var(--clinic-primary)" : "#475569" }}
                  >
                    <Bookmark className="h-4 w-4" fill={saved ? "var(--clinic-primary)" : "none"} />
                    Salvar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
