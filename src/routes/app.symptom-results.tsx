import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, Info } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { SymptomResultCard } from "@/components/patient/SymptomResultCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/symptom-results")({
  head: () => ({ meta: [{ title: "Resultados da análise" }] }),
  component: Page,
});

type Result = { slug: string; name: string; description: string; score: number; tags: string[]; level: "high" | "medium" | "low" };

function Page() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("symptom-selection");
    const sel: string[] = raw ? JSON.parse(raw) : [];
    setSymptoms(sel);

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: pt } = await supabase.from("patients").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt?.clinic_id) return;
      const { data } = await supabase.from("wiki_conditions")
        .select("slug, name, description, symptoms, causes, category")
        .eq("clinic_id", pt.clinic_id)
        .eq("is_published", true);
      const matched: Result[] = (data ?? []).map((c: any) => {
        const haystack = `${c.symptoms ?? ""} ${c.causes ?? ""} ${c.description ?? ""}`.toLowerCase();
        const hits = sel.filter((s) => haystack.includes(s.toLowerCase().split(" ")[0])).length;
        const score = sel.length ? Math.min(100, (hits / sel.length) * 100 + Math.random() * 10) : 0;
        const level: Result["level"] = score >= 60 ? "high" : score >= 35 ? "medium" : "low";
        return {
          slug: c.slug, name: c.name,
          description: (c.description ?? "").slice(0, 80),
          score, level,
          tags: [c.category ?? "Geral", level === "high" ? "Consulta urgente" : "Acompanhamento"].filter(Boolean),
        };
      }).sort((a, b) => b.score - a.score).slice(0, 3);
      setResults(matched);
    })();
  }, []);

  return (
    <>
      <PatientHeader title="Resultados da análise" showBack />
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-[13px]" style={{ color: "#3730A3" }}>
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div><b>Sintomas selecionados:</b> {symptoms.join(" · ")}</div>
        </div>
        <div className="text-[15px] font-semibold" style={{ color: "var(--text-medium)" }}>
          {results.length} possíveis condições encontradas
        </div>
        <div className="space-y-3">
          {results.map((r) => <SymptomResultCard key={r.slug} {...r} />)}
        </div>
        <div className="flex items-start gap-2 rounded-xl border p-3" style={{ background: "#FFFBEB", borderColor: "#F59E0B", color: "#92400E" }}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-[13px]"><b>Atenção</b><br />Esta análise é apenas orientativa. Consulte um dermatologista para diagnóstico preciso.</div>
        </div>
        <Link to="/app/schedule" className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold text-white" style={{ background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-primary-dark))", boxShadow: "0 4px 16px rgba(var(--clinic-primary-rgb),0.35)" }}>
          <CalendarPlus className="h-5 w-5" /> Agendar consulta
        </Link>
      </div>
    </>
  );
}
