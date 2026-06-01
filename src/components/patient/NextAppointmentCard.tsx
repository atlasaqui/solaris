import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";

export function NextAppointmentCard({
  doctorName,
  scheduledAt,
  specialty,
}: {
  doctorName: string;
  scheduledAt: string;
  specialty?: string;
}) {
  const date = new Date(scheduledAt);
  const dateLabel = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const timeLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // days from now
  const diffMs = date.getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const badgeText = days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days}d`;

  return (
    <Link
      to="/app/history"
      className="flex items-center gap-3 rounded-2xl bg-white p-4"
      style={{ boxShadow: "0 4px 14px rgba(15,23,42,0.06)", fontFamily: "Poppins, sans-serif" }}
    >
      <div
        className="grid h-12 w-12 place-items-center rounded-2xl"
        style={{ background: "#E8F2FC", color: "#1472D0" }}
      >
        <CalendarDays className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#8A8AA8" }}>
          Próxima consulta
        </div>
        <div className="truncate text-[14px] font-bold" style={{ color: "#1A1A2E" }}>
          Dr(a). {doctorName}
        </div>
        <div className="text-[12px]" style={{ color: "#4A4A6A" }}>
          {dateLabel} · {timeLabel}
          {specialty ? ` · ${specialty}` : ""}
        </div>
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
        style={{ background: "#E8F2FC", color: "#1472D0" }}
      >
        {badgeText}
      </span>
      <ChevronRight className="h-4 w-4" style={{ color: "#8A8AA8" }} />
    </Link>
  );
}

export function NextAppointmentEmpty() {
  return (
    <Link
      to="/app/schedule"
      className="flex items-center justify-between gap-3 rounded-2xl border border-dashed p-4"
      style={{ borderColor: "#1472D0", background: "#E8F2FC", fontFamily: "Poppins, sans-serif" }}
    >
      <div>
        <div className="text-[13px] font-bold" style={{ color: "#0E5BAA" }}>
          Você não tem consultas marcadas
        </div>
        <div className="text-[12px]" style={{ color: "#4A4A6A" }}>
          Toque para agendar agora
        </div>
      </div>
      <CalendarDays className="h-6 w-6" style={{ color: "#1472D0" }} />
    </Link>
  );
}
