import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarPlus, Info } from "lucide-react";
import { loadAnalysis, type AnalysisResult, type Condition } from "@/lib/gemini";

export const Route = createFileRoute("/app/library/results")({
  head: () => ({ meta: [{ title: "Resultados da análise" }] }),
  component: Page,
});

type AnalysisState = {
  result: AnalysisResult;
  selectedSymptoms: string[];
  searchText: string;
};

const LEVEL_STYLES: Record<
  Condition["level"],
  {
    label: string;
    color: string;
    dot: string;
    bg: string;
    barBg: string;
    barFill: string;
    cardBg: string;
    cardBorder: string;
  }
> = {
  alta: {
    label: "Alta probabilidade",
    color: "#EF4444",
    dot: "#EF4444",
    bg: "#FFF0F0",
    barBg: "#FECACA",
    barFill: "#EF4444",
    cardBg: "#FFF5F5",
    cardBorder: "#FECACA",
  },
  media: {
    label: "Média probabilidade",
    color: "#D97706",
    dot: "#F59E0B",
    bg: "#FFFBEB",
    barBg: "#FDE68A",
    barFill: "#F59E0B",
    cardBg: "#FFFBF0",
    cardBorder: "#FDE68A",
  },
  baixa: {
    label: "Baixa probabilidade",
    color: "#059669",
    dot: "#10B981",
    bg: "#EDFAF5",
    barBg: "#BBF7D0",
    barFill: "#10B981",
    cardBg: "#F0FDF4",
    cardBorder: "#BBF7D0",
  },
};

function isAnalysisState(value: unknown): value is AnalysisState {
  const candidate = value as Partial<AnalysisState> | null;
  return Boolean(candidate?.result?.conditions?.length && Array.isArray(candidate.selectedSymptoms));
}

function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<AnalysisState | null>(null);

  useEffect(() => {
    const routeState = (location.state as { libraryAnalysis?: unknown }).libraryAnalysis;
    if (isAnalysisState(routeState)) {
      setData(routeState);
      return;
    }

    const stored = loadAnalysis();
    if (stored) {
      setData(stored);
      return;
    }

    navigate({ to: "/app/library" });
  }, [location.state, navigate]);

  const symptomsLabel = useMemo(() => {
    if (!data) return "";
    return data.selectedSymptoms.length ? data.selectedSymptoms.join(" · ") : data.searchText;
  }, [data]);

  if (!data) return null;

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh", paddingBottom: 120 }}>
      <header className="sticky top-0 z-20 px-5 pb-6 pt-5" style={{ background: "#1472D0" }}>
        <button
          onClick={() => navigate({ to: "/app/library" })}
          className="grid h-10 w-10 place-items-center rounded-full text-white transition active:scale-95"
          style={{ background: "rgba(255,255,255,0.2)" }}
          aria-label="Voltar"
        >
          <span className="text-xl leading-none">←</span>
        </button>
      </header>

      <div
        className="mx-4 mt-4 flex items-start gap-2"
        style={{ background: "#EBF4FF", border: "1px solid #C3DCFF", borderRadius: 12, padding: "10px 13px" }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#1472D0" }} />
        <div style={{ fontSize: 12, color: "#1472D0", lineHeight: 1.45 }}>
          <b>Sintomas selecionados:</b> {symptomsLabel}
        </div>
      </div>

      <div className="mx-4 mb-3 mt-4" style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>
        {data.result.conditions.length} possíveis condições encontradas
      </div>

      <div>
        {data.result.conditions.map((condition) => {
          const style = LEVEL_STYLES[condition.level];
          const urgent = condition.tags.some((tag) => /urgente|alerta|alta|risco|consulta/i.test(tag));

          return (
            <article
              key={condition.id}
              className="mx-4 mb-2.5"
              style={{ background: style.cardBg, border: `1px solid ${style.cardBorder}`, borderRadius: 16, padding: 14 }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ background: style.bg, color: style.color, fontSize: 11, fontWeight: 700 }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: style.dot, display: "inline-block" }} />
                  {style.label}
                </span>
              </div>

              <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B" }}>{condition.name}</div>
              <div className="mb-2" style={{ fontSize: 12, color: "#94A3B8" }}>{condition.description}</div>

              <div className="text-right" style={{ fontSize: 13, fontWeight: 700, color: style.color }}>
                {Math.round(condition.probability)}%
              </div>
              <div className="mt-1 h-[5px] w-full overflow-hidden rounded-[10px]" style={{ background: style.barBg }}>
                <div className="h-full rounded-[10px]" style={{ width: `${condition.probability}%`, background: style.barFill }} />
              </div>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {condition.tags.map((tag) => {
                    const isUrgent = urgent && /urgente|alerta|alta|risco|consulta/i.test(tag);
                    return (
                      <span
                        key={tag}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 600,
                          background: isUrgent ? "#FFF0F0" : "#F1F5F9",
                          color: isUrgent ? "#EF4444" : "#64748B",
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    sessionStorage.setItem("library-condition", JSON.stringify(condition));
                    navigate({
                      to: "/app/library/conditions/$id",
                      params: { id: condition.id },
                      state: (prev) => ({ ...prev, libraryCondition: condition }),
                    });
                  }}
                  className="shrink-0 transition active:scale-95"
                  style={{
                    background: "#EBF4FF",
                    color: "#1472D0",
                    border: "1px solid #C3DCFF",
                    borderRadius: 10,
                    padding: "6px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Ver detalhes →
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div
        className="mx-4 mb-4 mt-3 flex items-start gap-2"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 12px" }}
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#F59E0B" }} />
        <div style={{ color: "#92400E" }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Atenção</div>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            Esta análise é apenas orientativa e não substitui avaliação médica. Os resultados são baseados na descrição dos sintomas, sem revisão de profissional de saúde. Consulte um dermatologista para diagnóstico preciso.
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate({ to: "/app/schedule" })}
        className="mx-4 mb-6 flex items-center justify-center gap-2 rounded-[14px] text-white transition active:scale-[0.98]"
        style={{ background: "#1472D0", height: 52, width: "calc(100% - 32px)", fontSize: 14, fontWeight: 700 }}
      >
        <CalendarPlus className="h-5 w-5" /> Agendar consulta
      </button>

    </div>
  );
}