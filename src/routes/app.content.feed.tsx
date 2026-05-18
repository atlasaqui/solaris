import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Clock, Video, FileText, Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/content/feed")({
  head: () => ({ meta: [{ title: "Biblioteca" }] }),
  component: Feed,
});

type Post = {
  id: string; slug: string; title: string; summary: string | null; type: string;
  category: string | null; cover_image_url: string | null; read_time_minutes: number | null;
  published_at: string | null;
};

const TYPE_META: Record<string, { icon: typeof FileText; label: string }> = {
  article: { icon: FileText, label: "Artigo" },
  video: { icon: Video, label: "Vídeo" },
  tip: { icon: Lightbulb, label: "Dica" },
};

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("content_posts")
        .select("id, slug, title, summary, type, category, cover_image_url, read_time_minutes, published_at")
        .eq("is_published", true).order("published_at", { ascending: false });
      setPosts((data ?? []) as Post[]);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[22px] font-semibold">Biblioteca</h1>
        <p className="text-[13px] text-muted-foreground">Conteúdos selecionados pelo seu médico</p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[
          { id: "all", label: "Todos" },
          { id: "article", label: "Artigos" },
          { id: "video", label: "Vídeos" },
          { id: "tip", label: "Dicas" },
        ].map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className="shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition"
            style={filter === t.id
              ? { background: "var(--clinic-primary)", color: "#fff" }
              : { background: "#F1F5F9", color: "#475569" }}>
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
          {filtered.map((p) => {
            const T = TYPE_META[p.type] ?? TYPE_META.article;
            return (
              <Link key={p.id} to="/app/content/$slug" params={{ slug: p.slug }}
                className="block overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                {p.cover_image_url && (
                  <div className="aspect-video w-full bg-[#F1F5F9]">
                    <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}>
                      <T.icon className="h-3 w-3" /> {T.label}
                    </span>
                    {p.category && <span className="text-[11px] text-muted-foreground">{p.category}</span>}
                  </div>
                  <h3 className="font-display text-[15px] font-semibold leading-snug">{p.title}</h3>
                  {p.summary && <p className="line-clamp-2 text-[13px] text-muted-foreground">{p.summary}</p>}
                  {p.read_time_minutes && (
                    <div className="flex items-center gap-1 pt-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {p.read_time_minutes} min
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
