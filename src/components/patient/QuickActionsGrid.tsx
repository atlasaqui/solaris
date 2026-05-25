import { Link } from "@tanstack/react-router";
import { Camera, CalendarDays, LayoutDashboard, Plus, Search, Stethoscope } from "lucide-react";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

const items = [
  { to: "/app/lesion-camera", icon: Camera, label: "Analisar lesão" },
  { to: "/app/schedule", icon: CalendarDays, label: "Agendar consulta" },
  { to: "/app/evolution", icon: LayoutDashboard, label: "Acompanhamento" },
  { to: "/app/symptom-checker", icon: Stethoscope, label: "Sintomas" },
] as const;

export function QuickActionsGrid() {
  const { isWarm } = useWhiteLabel();
  const cardBg = isWarm ? "var(--warm-beige-card)" : "#FFFFFF";
  const iconColor = isWarm ? "var(--warm-brown-dark)" : "var(--clinic-primary)";
  const textColor = isWarm ? "var(--warm-brown-dark)" : "var(--text-dark)";

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Link key={it.to} to={it.to} className="flex flex-col items-center justify-center gap-2 rounded-3xl p-5 text-center transition active:scale-[0.98]" style={{ background: cardBg, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Icon className="h-9 w-9" style={{ color: iconColor }} strokeWidth={1.8} />
            <div className="text-[14px] font-bold" style={{ color: textColor }}>{it.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
