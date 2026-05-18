import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Eye, Heart, Loader2, Trash2, Play, FileText, Stethoscope, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/content/")({
  head: () => ({ meta: [{ title: "Biblioteca da Clínica" }] }),
  component: AdminContent,
});

type Post = {
  id: string; title: string; type: string; category: string | null;
  is_published: boolean; view_count: number | null; like_count: number | null;
  cover_image_url: string | null; video_thumbnail_url: string | null;
  duration_seconds: number | null; related_condition_id: string | null;
  created_at: string;
};

type TabKey = "general" | "diseases" | "videos";

function fmtDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function AdminContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("general");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
    if (!doc?.clinic_id) { setLoading(false); return; }
    const { data } = await supabase.from("content_posts").select("*").eq("clinic_id", doc.clinic_id).order("created_at", { ascending: false });
    setPosts((data ?? []) as Post[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (tab === "general") return posts.filter((p) => (p.type === "article" || p.type === "tip") && !p.related_condition_id);
    if (tab === "diseases") return posts.filter((p) => !!p.related_condition_id);
    return posts.filter((p) => p.type === "video");
  }, [posts, tab]);

  const togglePublish = async (p: Post) => {
    const { error } = await supabase.from("content_posts")
      .update({ is_published: !p.is_published, published_at: !p.is_published ? new Date().toISOString() : null })
      .eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(p.is_published ? "Despublicado" : "Publicado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este conteúdo?")) return;
    const { error } = await supabase.from("content_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Conteúdo excluído");
    load();
  };

  const newTypeParam: Record<TabKey, string> = {
    general: "article",
    diseases: "article",
    videos: "video",
  };

  const tabsMeta: { id: TabKey; label: string; icon: typeof FileText; desc: string }[] = [
    { id: "general", label: "Informações Gerais", icon: FileText, desc: "Artigos e dicas sobre cuidados gerais" },
    { id: "diseases", label: "Sobre Doenças", icon: Stethoscope, desc: "Conteúdo vinculado a condições" },
    { id: "videos", label: "Vídeos", icon: Video, desc: "Posts em vídeo" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary"><BookOpen className="h-6 w-6" /></div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Biblioteca da Clínica</h1>
            <p className="text-sm text-muted-foreground">{posts.length} conteúdo{posts.length === 1 ? "" : "s"} no total</p>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="h-auto w-full justify-start gap-1 bg-muted/60 p-1">
          {tabsMeta.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2 px-4 py-2">
              <t.icon className="h-4 w-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsMeta.map((t) => (
          <TabsContent key={t.id} value={t.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <Link
                to="/admin/content/new"
                search={{ type: newTypeParam[t.id] }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" /> Criar conteúdo
              </Link>
            </div>

            {loading ? (
              <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
                <t.icon className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-semibold">Nada por aqui ainda</h3>
                <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro conteúdo desta categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                    <div className="relative aspect-video w-full bg-secondary">
                      {(p.video_thumbnail_url || p.cover_image_url) ? (
                        <img src={p.video_thumbnail_url || p.cover_image_url || ""} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-muted-foreground">Sem capa</div>
                      )}
                      {p.type === "video" && (
                        <>
                          <div className="absolute inset-0 grid place-items-center bg-black/20">
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-[#0A1628]">
                              <Play className="h-5 w-5 fill-current" />
                            </div>
                          </div>
                          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {fmtDuration(p.duration_seconds)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{p.type}</span>
                        {p.category && <span className="text-[11px] text-muted-foreground">{p.category}</span>}
                      </div>
                      <h3 className="line-clamp-2 font-display text-base font-semibold">{p.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.view_count ?? 0}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.like_count ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <button onClick={() => togglePublish(p)} className={`rounded-full px-3 py-1 text-xs font-semibold ${p.is_published ? "bg-success-bg text-success" : "bg-muted text-muted-foreground"}`}>
                          {p.is_published ? "Publicado" : "Rascunho"}
                        </button>
                        <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
