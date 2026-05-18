import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/wiki/$slug")({
  head: () => ({ meta: [{ title: "Condição" }] }),
  component: WikiDetail,
});

type Condition = {
  id: string; name: string; emoji: string | null; category: string | null; description: string;
  causes: string | null; symptoms: string | null; diagnosis: string | null;
  treatment_info: string | null; prevention_tips: string | null;
};

function WikiDetail() {
  const { slug } = Route.useParams();
  const [c, setC] = useState<Condition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("wiki_conditions").select("*").eq("slug", slug).maybeSingle();
      setC(data as Condition | null);
      if (data) await supabase.from("wiki_conditions").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", data.id);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!c) return <div className="space-y-3"><Link to="/app/wiki/search" className="text-sm text-muted-foreground"><ArrowLeft className="inline h-4 w-4" /> Voltar</Link><p className="text-muted-foreground">Não encontrada.</p></div>;

  const sections = [
    { label: "Causas", text: c.causes },
    { label: "Sintomas", text: c.symptoms },
    { label: "Diagnóstico", text: c.diagnosis },
    { label: "Tratamento", text: c.treatment_info },
    { label: "Prevenção", text: c.prevention_tips },
  ].filter((s) => s.text);

  return (
    <article className="space-y-5">
      <Link to="/app/wiki/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>

      <header className="rounded-3xl p-6 text-white" style={{ background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-primary-dark))" }}>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-3xl backdrop-blur">{c.emoji ?? "🩺"}</div>
        <h1 className="mt-4 font-display text-[26px] font-bold leading-tight">{c.name}</h1>
        {c.category && <p className="mt-1 text-[13px] text-white/80">{c.category}</p>}
        <p className="mt-3 text-[14px] leading-relaxed text-white/90">{c.description}</p>
      </header>

      <div className="space-y-3">
        {sections.map((s) => (
          <section key={s.label} className="rounded-2xl bg-white p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <h2 className="font-display text-[15px] font-semibold" style={{ color: "var(--clinic-primary-dark)" }}>{s.label}</h2>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{s.text}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
