import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/patient/BottomNav";
import { analyzeSymptoms, saveAnalysis } from "@/lib/gemini";

export const Route = createFileRoute("/app/library")({
  head: () => ({ meta: [{ title: "Pesquisa de sintomas e doenças" }] }),
  component: Page,
});

type Group = {
  title: string;
  items: string[];
  activeBg: string;
};

const GROUPS: Group[] = [
  {
    title: "Aparência da lesão",
    items: ["Mancha escura", "Borda irregular", "Assimétrica", "Coloração variada", "Superfície elevada"],
    activeBg: "#1472D0",
  },
  {
    title: "Sintomas associados",
    items: ["Coceira intensa", "Ardência", "Sangramento", "Descamação", "Inchaço local"],
    activeBg: "#1E293B",
  },
  {
    title: "Evolução da lesão",
    items: ["Cresceu rapidamente", "Mudou de cor", "Surgiu há mais de 1 mês", "Não cicatriza"],
    activeBg: "#1472D0",
  },
  {
    title: "Localização no corpo",
    items: ["Rosto", "Costas", "Membros", "Abdômen", "Couro cabeludo"],
    activeBg: "#10B981",
  },
];

function Page() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (s: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return GROUPS;
    const q = search.toLowerCase();
    return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [search]);

  const submit = async () => {
    const arr = [...selected];
    if (arr.length === 0 && !search.trim()) {
      toast.error("Selecione ao menos um sintoma");
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeSymptoms(arr, search.trim());
      saveAnalysis(result, arr, search.trim());
      navigate({ to: "/app/library/results" });
    } catch {
      toast("Sem conexão. Usando análise local.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh", paddingBottom: 120 }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-5 pb-6 pt-5 text-white"
        style={{
          background: "linear-gradient(180deg, #1472D0 0%, #0E5BAA 100%)",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/app/home" })}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
            aria-label="Voltar"
          >
            <span className="text-xl leading-none">←</span>
          </button>
          <h1 className="text-[18px] font-bold leading-tight">Pesquisa de sintomas e doenças</h1>
        </div>
      </header>

      {/* Search input */}
      <div className="px-4 pt-4">
        <div
          className="flex items-center gap-2 rounded-[14px] bg-white px-3"
          style={{ border: "1.5px solid #E2E8F0", height: 48 }}
        >
          <Search className="h-5 w-5" style={{ color: "#94A3B8" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sintoma ou lesão..."
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 16, color: "#1E293B" }}
          />
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-5 px-4 pt-5">
        {filteredGroups.map((g) => (
          <section key={g.title}>
            <div
              className="mb-2.5 font-bold uppercase tracking-wide"
              style={{ fontSize: 12, color: "#64748B", letterSpacing: "0.04em" }}
            >
              {g.title}
            </div>
            <div className="flex flex-wrap gap-2">
              {g.items.map((item) => {
                const on = selected.has(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(item)}
                    aria-pressed={on}
                    className="transition active:scale-95"
                    style={{
                      background: on ? g.activeBg : "#FFFFFF",
                      color: on ? "#FFFFFF" : "#334155",
                      border: on ? "1.5px solid " + g.activeBg : "1.5px solid #E2E8F0",
                      borderRadius: 20,
                      padding: "7px 14px",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pt-6">
        <button
          onClick={submit}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-70"
          style={{ background: "#1472D0", height: 52, fontSize: 14 }}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-5 w-5" /> Analisar sintomas
            </>
          )}
        </button>
        <p className="mt-3 text-center" style={{ fontSize: 11, color: "#94A3B8" }}>
          Este app não substitui consulta médica.
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 z-40 grid place-items-center" style={{ background: "rgba(255,255,255,0.85)" }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin" style={{ color: "#1472D0", width: 48, height: 48 }} />
            <div style={{ fontSize: 14, color: "#64748B" }}>Analisando sintomas...</div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
