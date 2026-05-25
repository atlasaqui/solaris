import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { SymptomChip } from "@/components/patient/SymptomChip";

export const Route = createFileRoute("/app/symptom-checker")({
  head: () => ({ meta: [{ title: "Pesquisa de sintomas" }] }),
  component: Page,
});

const GROUPS = [
  { title: "Aparência da lesão", color: "var(--clinic-primary)", items: ["Mancha escura", "Borda irregular", "Assimétrica", "Coloração variada", "Superfície elevada"] },
  { title: "Sintomas associados", color: "var(--solaris-teal)", items: ["Coceira intensa", "Ardência", "Sangramento", "Descamação", "Inchaço local"] },
  { title: "Evolução da lesão", color: "var(--warm-brown-mid)", items: ["Cresceu rapidamente", "Mudou de cor", "Surgiu há mais de 1 mês", "Não cicatriza"] },
  { title: "Localização no corpo", color: "#E07B54", items: ["Rosto", "Costas", "Membros", "Abdômen", "Couro cabeludo"] },
];

function Page() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const toggle = (s: string) => {
    const next = new Set(selected);
    next.has(s) ? next.delete(s) : next.add(s);
    setSelected(next);
  };

  const submit = () => {
    if (selected.size === 0) return;
    sessionStorage.setItem("symptom-selection", JSON.stringify([...selected]));
    nav({ to: "/app/symptom-results" });
  };

  return (
    <>
      <PatientHeader title="Pesquisa de sintomas" showBack />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3" style={{ border: "1.5px solid var(--clinic-primary)" }}>
          <Search className="h-5 w-5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar sintoma ou lesão..." className="flex-1 bg-transparent text-[14px] outline-none" />
        </div>
        <div className="mt-5 space-y-5">
          {GROUPS.map((g) => {
            const items = search ? g.items.filter((i) => i.toLowerCase().includes(search.toLowerCase())) : g.items;
            if (items.length === 0) return null;
            return (
              <div key={g.title}>
                <div className="mb-2 text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>{g.title}</div>
                <div className="flex flex-wrap gap-2">
                  {items.map((i) => <SymptomChip key={i} label={i} selected={selected.has(i)} onToggle={() => toggle(i)} color={g.color} />)}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={submit} disabled={selected.size === 0} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-primary-dark))", boxShadow: "0 4px 16px rgba(var(--clinic-primary-rgb), 0.35)" }}>
          <Sparkles className="h-5 w-5" /> Analisar sintomas
        </button>
        <p className="mt-3 text-center text-[12px] text-gray-400">Este app não substitui consulta médica.</p>
      </div>
    </>
  );
}
