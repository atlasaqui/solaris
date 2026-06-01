import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, CircleAlert } from "lucide-react";
import lesionPlaceholder from "@/assets/solaris/skin-lesion-placeholder.jpg";
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

function isCondition(value: unknown): value is Condition {
  const candidate = value as Partial<Condition> | null;
  return Boolean(candidate?.id && candidate.name && typeof candidate.probability === "number");
}

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [condition, setCondition] = useState<Condition | null>(null);

  useEffect(() => {
    const routeCondition = (location.state as { libraryCondition?: unknown }).libraryCondition;
    if (isCondition(routeCondition) && routeCondition.id === id) {
      setCondition(routeCondition);
      return;
    }

    try {
      const raw = sessionStorage.getItem("library-condition");
      const stored = raw ? JSON.parse(raw) : null;
      if (isCondition(stored) && stored.id === id) {
        setCondition(stored);
        return;
      }
    } catch {
      setCondition(null);
    }

    const found = loadAnalysis()?.result.conditions.find((item) => item.id === id) ?? null;
    if (found) {
      setCondition(found);
      return;
    }

    navigate({ to: "/app/library" });
  }, [id, location.state, navigate]);

  if (!condition) return null;

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh", paddingBottom: 120 }}>
      <header className="sticky top-0 z-20 flex items-center gap-3 px-5 pb-5 pt-5" style={{ background: "#1472D0" }}>
        <button
          onClick={() => navigate({ to: "/app/library/results" })}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition active:scale-95"
          style={{ background: "rgba(255,255,255,0.2)" }}
          aria-label="Voltar"
        >
          <span className="text-xl leading-none">←</span>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-white" style={{ fontSize: 17, fontWeight: 700 }}>
          {condition.name}
        </h1>
      </header>

      <div className="relative w-full overflow-hidden" style={{ height: 200 }}>
        <img src={lesionPlaceholder} alt={condition.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
        <span
          className="absolute right-3 top-3 text-white"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {LEVEL_LABEL[condition.level]} • {Math.round(condition.probability)}%
        </span>
      </div>

      <section
        className="m-4"
        style={{ background: "#EBF4FF", border: "1px solid #C3DCFF", borderRadius: 16, padding: 14 }}
      >
        <div
          className="mb-2 uppercase"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#1472D0" }}
        >
          O QUE É
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#1E293B" }}>{condition.fullDescription}</p>
      </section>

      <section className="mx-4 mb-4 flex gap-2.5">
        <div className="flex-1 rounded-[14px] p-3" style={{ background: "#FFF0F0" }}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" style={{ color: "#EF4444" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>ALERTA</span>
          </div>
          <p className="mt-1.5" style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.4 }}>{condition.alertText}</p>
        </div>
        <div className="flex-1 rounded-[14px] p-3" style={{ background: "#FFFBEB" }}>
          <div className="flex items-center gap-1.5">
            <CircleAlert className="h-4 w-4" style={{ color: "#D97706" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D97706" }}>AÇÃO</span>
          </div>
          <p className="mt-1.5" style={{ fontSize: 12, color: "#78350F", lineHeight: 1.4 }}>{condition.actionText}</p>
        </div>
      </section>

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