import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, Info } from "lucide-react";
import { BottomNav } from "@/components/patient/BottomNav";
import { loadAnalysis, type Condition } from "@/lib/gemini";

export const Route = createFileRoute("/app/library/results")({
  head: () => ({ meta: [{ title: "Resultados da análise" }] }),
  component: Page,
});

const LEVEL_STYLES: Record<
  Condition["level"],
  { label: string; color: string; bg: string; border: string; barBg: string; cardBg: string; cardBorder: string }
> = {
  alta: {
    label: "Alta probabilidade",
    color: "#EF4444",
    bg: "#FFF0F0",
    border: "#FECACA",
    barBg: "#FECACA",
    cardBg: "#FFF5F5",
    cardBorder: "#FECACA",
  },
  media: {
    label: "Média probabilidade",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    barBg: "#FDE68A",
    cardBg: "#FFFBF0",
    cardBorder: "#FDE68A",
  },
  baixa: {
    label: "Baixa probabilidade",
    color: "#10B981",
    bg: "#EDFAF5",
    border: "#BBF7D0",
    barBg: "#BBF7D0",
    cardBg: "#F0FDF4",
    cardBorder: "#BBF7D0",
  },
};

function Page() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReturnType<typeof loadAnalysis>>(null);

  useEffect(() => {
    const a = loadAnalysis();
    if (!a) {
      navigate({ to: "/app/library" });
      return;
    }
    setData(a);
  }, [navigate]);

  if (!data) return null;
  const { result, selectedSymptoms, searchText } = data;
  const symptomsLabel = selectedSymptoms.length ? selectedSymptoms.join(" · ") : searchText;

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
        <button
          onClick={() => navigate({ to: "/app/library" })}
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
          aria-label="Voltar"
        >
          <span className="text-xl leading-none">←</span>
        </button>
      </header>

      <div className="space-y-4 px-4 pt-4">
        <div
          className="flex items-start gap-2 rounded-[12px] p-3"
          style={{ background: "#EBF4FF", border: "1px solid #C3DCFF" }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#1472D0" }} />
          <div style={{ fontSize: 12, color: "#1472D0" }}>
            <b>Sintomas selecionados:</b> {symptomsLabel}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>
          {result.conditions.length} possíveis condições encontradas
        </div>

        <div className="space-y-3">
          {result.conditions.map((c) => {
            const m = LEVEL_STYLES[c.level];
            return (
              <article
                key={c.id}
                className="rounded-[16px] p-4"
                style={{ background: m.cardBg, border: `1px solid ${m.cardBorder}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: m.color,
                        display: "inline-block",
                      }}
                    />
                    {m.label}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: m.color }}>
                    {Math.round(c.probability)}%
                  </span>
                </div>

                <div className="mt-2" style={{ fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{c.description}</div>

                <div className="mt-3 h-[5px] w-full overflow-hidden rounded-full" style={{ background: m.barBg }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${c.probability}%`, background: m.color }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((t) => {
                      const urgent = /urgente|alta|consulta/i.test(t);
                      return (
                        <span
                          key={t}
                          className="rounded-full px-2.5 py-1"
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            background: urgent ? "#FFF0F0" : "#F1F5F9",
                            color: urgent ? "#EF4444" : "#64748B",
                          }}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("library-condition", JSON.stringify(c));
                      navigate({ to: "/app/library/conditions/$id", params: { id: c.id } });
                    }}
                    className="rounded-[10px] px-3 py-1.5 transition active:scale-95"
                    style={{
                      background: "#EBF4FF",
                      color: "#1472D0",
                      border: "1px solid #C3DCFF",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Ver detalhes
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div
          className="flex items-start gap-2 rounded-[12px] p-3"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#F59E0B" }} />
          <div style={{ fontSize: 12, color: "#92400E" }}>
            <b>Atenção</b>
            <br />
            Esta análise é apenas orientativa. Consulte um dermatologista para diagnóstico preciso.
          </div>
        </div>

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
