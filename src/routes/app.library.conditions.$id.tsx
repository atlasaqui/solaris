import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, CircleAlert } from "lucide-react";
import { BottomNav } from "@/components/patient/BottomNav";
import { loadAnalysis, type Condition } from "@/lib/gemini";

export const Route = createFileRoute("/app/library/conditions/$id")({
  head: () => ({ meta: [{ title: "Detalhe da condição" }] }),
  component: Page,
});

const LEVEL_LABEL: Record<Condition["level"], string> = {
  alta: "Alta Prob.",
  media: "Média Prob.",
  baixa: "Baixa Prob.",
};

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [c, setC] = useState<Condition | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("library-condition");
      if (raw) {
        const parsed: Condition = JSON.parse(raw);
        if (parsed.id === id) {
          setC(parsed);
          return;
        }
      }
      const a = loadAnalysis();
      const found = a?.result.conditions.find((x) => x.id === id) ?? null;
      setC(found);
    } catch {
      setC(null);
    }
  }, [id]);

  if (!c) {
    return (
      <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
        <div className="p-6 text-center" style={{ color: "#64748B" }}>
          Condição não encontrada.
        </div>
      </div>
    );
  }

  const heroImg = `https://images.unsplash.com/photo-1583912267550-aae1d9b96d39?w=800&q=70`;

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh", paddingBottom: 120 }}>
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
            onClick={() => navigate({ to: "/app/library/results" })}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
            aria-label="Voltar"
          >
            <span className="text-xl leading-none">←</span>
          </button>
          <h1 className="text-[18px] font-bold leading-tight">{c.name}</h1>
        </div>
      </header>

      {/* Hero image */}
      <div className="relative mx-4 mt-4 overflow-hidden rounded-[16px]" style={{ height: 200 }}>
        <img src={heroImg} alt={c.name} className="h-full w-full object-cover" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)" }}
        />
        <span
          className="absolute right-3 top-3 rounded-[8px] px-2.5 py-1 text-white"
          style={{ background: "rgba(0,0,0,0.5)", fontSize: 12, fontWeight: 700 }}
        >
          {LEVEL_LABEL[c.level]} • {Math.round(c.probability)}%
        </span>
      </div>

      {/* O QUE É */}
      <section className="mx-4 mt-4 rounded-[16px] p-4" style={{ background: "#EBF4FF" }}>
        <div
          className="mb-2 font-bold uppercase"
          style={{ fontSize: 11, color: "#1472D0", letterSpacing: "0.05em" }}
        >
          O que é
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#1E293B" }}>{c.fullDescription}</p>
      </section>

      {/* Alerta + Ação */}
      <section className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[14px] p-3" style={{ background: "#FFF0F0" }}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" style={{ color: "#EF4444" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", letterSpacing: "0.05em" }}>
              ALERTA
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.5 }}>{c.alertText}</p>
        </div>
        <div className="rounded-[14px] p-3" style={{ background: "#FFFBEB" }}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <CircleAlert className="h-4 w-4" style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.05em" }}>
              AÇÃO
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>{c.actionText}</p>
        </div>
      </section>

      <div className="px-4 pt-6">
        <button
          onClick={() => navigate({ to: "/app/schedule" })}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] font-bold text-white transition active:scale-[0.98]"
          style={{ background: "#1472D0", height: 52, fontSize: 14 }}
        >
          <CalendarPlus className="h-5 w-5" /> Agendar consulta
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
