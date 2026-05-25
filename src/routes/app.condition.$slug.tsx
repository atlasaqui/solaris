import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/condition/$slug")({
  head: () => ({ meta: [{ title: "Condição" }] }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("wiki_conditions").select("*").eq("slug", slug).maybeSingle();
      setC(data); setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="grid h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!c) return <div className="p-6 text-center">Condição não encontrada</div>;

  return (
    <>
      <PatientHeader title={c.name} showBack />
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-[var(--clinic-primary-light)] p-6">
        <div className="text-[40px]">{c.emoji ?? "🩺"}</div>
        <h1 className="mt-2 text-[22px] font-bold" style={{ color: "var(--text-dark)" }}>{c.name}</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--text-dark)" }}>{c.description}</p>
      </div>
      <div className="space-y-4 px-4 py-4">
        {c.causes && <Section title="Causas">{c.causes}</Section>}
        {c.symptoms && <Section title="Sintomas">{c.symptoms}</Section>}
        {c.treatment_info && <Section title="Tratamento">{c.treatment_info}</Section>}
        {c.prevention_tips && <Section title="Prevenção">{c.prevention_tips}</Section>}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 text-[16px] font-bold" style={{ color: "var(--text-dark)" }}>{title}</div>
      <div className="text-[14px] leading-relaxed" style={{ color: "var(--text-medium)" }}>{children}</div>
    </div>
  );
}
