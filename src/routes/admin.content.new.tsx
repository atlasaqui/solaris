import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TYPES = ["article", "video", "tip"] as const;
type ContentType = (typeof TYPES)[number];
const CATEGORIES = ["Skincare", "Acne", "Melasma", "Procedimentos", "Proteção solar", "Cuidados diários"];

export const Route = createFileRoute("/admin/content/new")({
  head: () => ({ meta: [{ title: "Novo conteúdo" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    const t = search.type;
    return { type: (TYPES as readonly string[]).includes(t as string) ? (t as ContentType) : undefined };
  },
  component: NewContent,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function NewContent() {
  const navigate = useNavigate();
  const { type: initialType } = Route.useSearch();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: (initialType ?? "article") as ContentType,
    title: "", category: CATEGORIES[0], summary: "", content: "",
    cover_image_url: "", read_time_minutes: 4, publish_now: true,
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: doc } = await supabase.from("doctors").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (doc) { setClinicId(doc.clinic_id); setAuthorId(doc.id); }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) { toast.error("Clínica não encontrada"); return; }
    setSaving(true);
    const slug = `${slugify(form.title)}-${Date.now().toString(36)}`;
    const { error } = await supabase.from("content_posts").insert({
      clinic_id: clinicId, author_id: authorId, type: form.type, title: form.title,
      slug, category: form.category, summary: form.summary, content: form.content,
      cover_image_url: form.cover_image_url || null, read_time_minutes: form.read_time_minutes,
      is_published: form.publish_now, published_at: form.publish_now ? new Date().toISOString() : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conteúdo criado");
    navigate({ to: "/admin/content" });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/content" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Publicar
        </button>
      </div>

      <header>
        <h1 className="font-display text-2xl font-semibold">Novo conteúdo</h1>
        <p className="text-sm text-muted-foreground">Posts educativos visíveis aos pacientes</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <Field label="Tipo">
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${form.type === t ? "bg-primary text-white" : "bg-secondary text-foreground"}`}>
                {t === "article" ? "Artigo" : t === "video" ? "Vídeo" : "Dica"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Título"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
        <Field label="Categoria">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Resumo (1-2 linhas)"><textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className={inputCls} /></Field>
        <Field label="URL da imagem de capa"><input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." className={inputCls} /></Field>
        <Field label="Tempo de leitura (min)">
          <input type="number" min={1} max={60} value={form.read_time_minutes} onChange={(e) => setForm({ ...form, read_time_minutes: Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Conteúdo">
          <textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className={inputCls} placeholder="Escreva o corpo do post em markdown ou texto plano..." />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.publish_now} onChange={(e) => setForm({ ...form, publish_now: e.target.checked })} />
          Publicar imediatamente
        </label>
      </section>
    </form>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
