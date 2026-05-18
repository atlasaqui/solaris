import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Eye, Heart, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Biblioteca de Conteúdo" }] }),
  component: AdminContent,
});

type Post = {
  id: string; title: string; type: string; category: string | null;
  is_published: boolean; view_count: number | null; like_count: number | null;
  cover_image_url: string | null; created_at: string;
};

function AdminContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
    if (!doc?.clinic_id) { setLoading(false); return; }
    setClinicId(doc.clinic_id);
    const { data } = await supabase.from("content_posts").select("*").eq("clinic_id", doc.clinic_id).order("created_at", { ascending: false });
    setPosts((data ?? []) as Post[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary"><BookOpen className="h-6 w-6" /></div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Biblioteca de Conteúdo</h1>
            <p className="text-sm text-muted-foreground">{posts.length} post{posts.length === 1 ? "" : "s"} no total</p>
          </div>
        </div>
        <Link to="/admin/content/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Novo conteúdo
        </Link>
      </header>

      {loading ? (
        <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-display text-lg font-semibold">Sem conteúdos ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crie seu primeiro post educativo para os pacientes.</p>
          <Link to="/admin/content/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Criar conteúdo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="aspect-video w-full bg-secondary">
                {p.cover_image_url ? <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground">Sem capa</div>}
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
    </div>
  );
}
