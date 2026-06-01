import { Link } from "@tanstack/react-router";
import { Search, CalendarDays, Camera, Clock } from "lucide-react";

const items = [
  { to: "/app/symptom-checker", Icon: Search, label: "Pesquisar lesão" },
  { to: "/app/schedule", Icon: CalendarDays, label: "Agendar consulta" },
  { to: "/app/lesion-camera", Icon: Camera, label: "Analisar lesão" },
  { to: "/app/history", Icon: Clock, label: "Histórico" },
] as const;

export function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3" style={{ fontFamily: "Poppins, sans-serif" }}>
      {items.map((it) => {
        const Icon = it.Icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl bg-white p-4 transition active:scale-[0.97]"
            style={{ boxShadow: "0 4px 14px rgba(15,23,42,0.06)" }}
            aria-label={it.label}
          >
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl"
              style={{ background: "#E8F2FC", color: "#1472D0" }}
            >
              <Icon className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <div
              className="text-center text-[13px] font-semibold leading-tight"
              style={{ color: "#1472D0" }}
            >
              {it.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
