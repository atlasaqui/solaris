import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/wiki/new")({
  head: () => ({ meta: [{ title: "Nova condição" }] }),
  component: NewCondition,
});

const CATEGORIES = ["Acne", "Melasma", "Rosácea", "Dermatite", "Câncer de pele", "Envelhecimento", "Outros"];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function NewCondition() {
  const navigate = useNavigate();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", emoji: "🩺", category: CATEGORIES[0], description: "",
    causes: "", symptoms: "", diagnosis: "", treatment_info: "", prevention_tips: "",
    publish_now: true,
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (doc?.clinic_id) setClinicId(doc.clinic_id);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    setSaving(true);
    const slug = `${slugify(form.name)}-${Date.now().toString(36)}`;
    const { error } = await supabase.from("wiki_conditions").insert({
      clinic_id: clinicId, name: form.name, slug, emoji: form.emoji, category: form.category,
      description: form.description, causes: form.causes || null, symptoms: form.symptoms || null,
      diagnosis: form.diagnosis || null, treatment_info: form.treatment_info || null,
      prevention_tips: form.prevention_tips || null, is_published: form.publish_now,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Condição criada");
    navigate({ to: "/admin/wiki" });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/wiki" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
        </button>
      </div>

      <header>
        <h1 className="font-display text-2xl font-semibold">Nova condição</h1>
        <p className="text-sm text-muted-foreground">Adicione uma doença à Wiki-Clínica</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[100px_1fr_1fr]">
          <Field label="Emoji"><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className={inp} maxLength={4} /></Field>
          <Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} /></Field>
          <Field label="Categoria">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Descrição curta"><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inp} /></Field>
        <Field label="Causas"><textarea value={form.causes} onChange={(e) => setForm({ ...form, causes: e.target.value })} rows={3} className={inp} /></Field>
        <Field label="Sintomas"><textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={3} className={inp} /></Field>
        <Field label="Diagnóstico"><textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} rows={3} className={inp} /></Field>
        <Field label="Tratamento"><textarea value={form.treatment_info} onChange={(e) => setForm({ ...form, treatment_info: e.target.value })} rows={3} className={inp} /></Field>
        <Field label="Prevenção"><textarea value={form.prevention_tips} onChange={(e) => setForm({ ...form, prevention_tips: e.target.value })} rows={3} className={inp} /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.publish_now} onChange={(e) => setForm({ ...form, publish_now: e.target.checked })} />
          Publicar imediatamente
        </label>
      </section>
    </form>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
}
