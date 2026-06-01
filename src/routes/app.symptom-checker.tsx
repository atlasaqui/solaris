import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import backBtn from "@/assets/solaris/screen-09-symptom-search/btn-icon-back.png";
import iconSearch from "@/assets/solaris/screen-09-symptom-search/icon-search.png";
import btnAnalyze from "@/assets/solaris/screen-09-symptom-search/btn-primary-analyze-symptoms.png";
import chipAppOn from "@/assets/solaris/screen-09-symptom-search/chip-appearance-selected.png";
import chipAppOff from "@/assets/solaris/screen-09-symptom-search/chip-appearance-unselected.png";
import chipBodyOn from "@/assets/solaris/screen-09-symptom-search/chip-body-symptoms-selected.png";
import chipBodyOff from "@/assets/solaris/screen-09-symptom-search/chip-body-symptoms-unselected.png";
import chipWoundOn from "@/assets/solaris/screen-09-symptom-search/chip-wound-symptoms-selected.png";
import chipWoundOff from "@/assets/solaris/screen-09-symptom-search/chip-wound-symptoms-unselected.png";
import chipAssocOn from "@/assets/solaris/screen-09-symptom-search/chip-symptoms-associate-selected.png";
import chipEvolOn from "@/assets/solaris/screen-09-symptom-search/chip-wound-evoution-selected.png";

export const Route = createFileRoute("/app/symptom-checker")({
  head: () => ({ meta: [{ title: "Pesquisa de sintomas" }] }),
  component: Page,
});

type Group = { title: string; items: string[]; on: string; off: string };

const GROUPS: Group[] = [
  { title: "Aparência da lesão", items: ["Mancha escura", "Borda irregular", "Assimétrica", "Coloração variada", "Superfície elevada"], on: chipAppOn, off: chipAppOff },
  { title: "Sintomas associados", items: ["Coceira intensa", "Ardência", "Sangramento", "Descamação", "Inchaço local"], on: chipAssocOn, off: chipBodyOff },
  { title: "Evolução da lesão", items: ["Cresceu rapidamente", "Mudou de cor", "Surgiu há mais de 1 mês", "Não cicatriza"], on: chipEvolOn, off: chipWoundOff },
  { title: "Sintomas na ferida", items: ["Dor ao tocar", "Pus", "Vermelhidão", "Calor local"], on: chipWoundOn, off: chipWoundOff },
  { title: "Localização no corpo", items: ["Rosto", "Costas", "Membros", "Abdômen", "Couro cabeludo"], on: chipBodyOn, off: chipBodyOff },
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
      <div className="px-4 py-4 pb-32">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => nav({ to: "/app/home" })} className="active:scale-95" aria-label="Voltar">
            <img src={backBtn} alt="" className="h-9 w-9" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5" style={{ border: "1.5px solid var(--clinic-primary)" }}>
            <img src={iconSearch} alt="" className="h-5 w-5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar sintoma..."
              className="flex-1 bg-transparent text-[14px] outline-none"
            />
          </div>
        </div>

        <div className="space-y-5">
          {GROUPS.map((g) => {
            const items = search ? g.items.filter((i) => i.toLowerCase().includes(search.toLowerCase())) : g.items;
            if (items.length === 0) return null;
            return (
              <div key={g.title}>
                <div className="mb-2 text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>{g.title}</div>
                <div className="flex flex-wrap gap-2">
                  {items.map((i) => {
                    const on = selected.has(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggle(i)}
                        className="relative active:scale-95"
                        aria-pressed={on}
                      >
                        <img src={on ? g.on : g.off} alt="" className="h-10" draggable={false} />
                        <span
                          className="absolute inset-0 flex items-center justify-center px-4 text-[12px] font-semibold"
                          style={{ color: on ? "#FFFFFF" : "var(--text-medium)" }}
                        >
                          {i}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={submit}
          disabled={selected.size === 0}
          className="mx-auto mt-6 block active:scale-[0.98] disabled:opacity-50"
          aria-label="Analisar sintomas"
        >
          <img src={btnAnalyze} alt="Analisar sintomas" className="w-[260px]" draggable={false} />
        </button>
        <p className="mt-3 text-center text-[12px] text-gray-400">Este app não substitui consulta médica.</p>
      </div>
    </>
  );
}
