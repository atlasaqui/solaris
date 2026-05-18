import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Library, Plus, Loader2, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/wiki")({
  head: () => ({ meta: [{ title: "Wiki-Clínica" }] }),
  component: AdminWiki,
});

type Condition = {
  id: string; name: string; slug: string; category: string | null; emoji: string | null;
  is_published: boolean; view_count: number | null; description: string;
};

function AdminWiki() {
  const [items, setItems] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
    if (!doc?.clinic_id) { setLoading(false); return; }
    const { data } = await supabase.from("wiki_conditions").select("*").eq("clinic_id", doc.clinic_id).order("name");
    setItems((data ?? []) as Condition[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (c: Condition) => {
    const { error } = await supabase.from("wiki_conditions").update({ is_published: !c.is_published }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(c.is_published ? "Despublicado" : "Publicado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta condição?")) return;
    const { error } = await supabase.from("wiki_conditions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído");
    load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary"><Library className="h-6 w-6" /></div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Wiki-Clínica</h1>
            <p className="text-sm text-muted-foreground">{items.length} condição{items.length === 1 ? "" : "es"}</p>
          </div>
        </div>
        <Link to="/admin/wiki/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Nova condição
        </Link>
      </header>

      {loading ? (
        <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <Library className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-display text-lg font-semibold">Wiki vazia</h3>
          <p className="mt-1 text-sm text-muted-foreground">Comece adicionando a primeira condição dermatológica.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji ?? "🩺"}</span>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">/{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.category ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {c.view_count ?? 0}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(c)} className={`rounded-full px-3 py-1 text-xs font-semibold ${c.is_published ? "bg-success-bg text-success" : "bg-muted text-muted-foreground"}`}>
                      {c.is_published ? "Publicado" : "Rascunho"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
