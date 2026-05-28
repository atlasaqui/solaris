import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";

export function NextAppointmentCard({
  doctorName,
  scheduledAt,
}: {
  doctorName: string;
  scheduledAt: string;
}) {
  const date = new Date(scheduledAt);
  const dateLabel = date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const timeLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link
      to="/app/history"
      className="flex items-center gap-3 rounded-2xl bg-white p-4"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div
        className="grid h-12 w-12 place-items-center rounded-2xl"
        style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary)" }}
      >
        <CalendarDays className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-soft)" }}>
          Próxima consulta
        </div>
        <div className="truncate text-[14px] font-bold" style={{ color: "var(--text-dark)" }}>
          Dr(a). {doctorName}
        </div>
        <div className="text-[12px]" style={{ color: "var(--text-medium)" }}>
          {dateLabel} · {timeLabel}
        </div>
      </div>
      <ChevronRight className="h-5 w-5" style={{ color: "var(--text-soft)" }} />
    </Link>
  );
}

export function NextAppointmentEmpty() {
  return (
    <Link
      to="/app/schedule"
      className="flex items-center justify-between gap-3 rounded-2xl border border-dashed p-4"
      style={{ borderColor: "var(--clinic-primary)", background: "var(--clinic-primary-light)" }}
    >
      <div>
        <div className="text-[13px] font-bold" style={{ color: "var(--clinic-primary-dark)" }}>
          Você não tem consultas marcadas
        </div>
        <div className="text-[12px]" style={{ color: "var(--text-medium)" }}>
          Toque para agendar agora
        </div>
      </div>
      <CalendarDays className="h-6 w-6" style={{ color: "var(--clinic-primary)" }} />
    </Link>
  );
}
