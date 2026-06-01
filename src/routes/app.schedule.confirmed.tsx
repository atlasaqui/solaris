import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Check } from "lucide-react";

export const Route = createFileRoute("/app/schedule/confirmed")({
  head: () => ({ meta: [{ title: "Confirmação" }] }),
  component: ConfirmedPage,
});

type LastAppointment = {
  doctorName: string;
  specialty: string;
  crm: string | null;
  avatar: string | null;
  when: string;
};

function ConfirmedPage() {
  const navigate = useNavigate();
  const [appt, setAppt] = useState<LastAppointment | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastAppointment");
      if (raw) setAppt(JSON.parse(raw));
    } catch {}
  }, []);

  const when = appt ? new Date(appt.when) : null;
  const dateLabel = when
    ? when.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    : "";
  const timeLabel = when
    ? `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`
    : "";

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <header className="flex items-center justify-between px-5 py-4" style={{ background: "#1472D0" }}>
        <button
          type="button"
          onClick={() => navigate({ to: "/app/home" })}
          aria-label="Voltar"
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-[16px] font-bold text-white">Confirmação</h1>
        <div className="h-10 w-10" />
      </header>

      <div className="flex flex-col items-center px-5 pt-8">
        <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full ring-4" style={{ background: "#EBF4FF", boxShadow: "inset 0 0 0 3px #1472D0" }}>
          {appt?.avatar ? (
            <img src={appt.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[26px] font-bold" style={{ color: "#1472D0" }}>
              {appt?.doctorName?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "DR"}
            </span>
          )}
        </div>
        <div className="mt-3 text-[16px] font-bold" style={{ color: "#1E293B" }}>DR. {appt?.doctorName ?? "—"}</div>
        <div className="text-[12px]" style={{ color: "#64748B" }}>
          {appt?.specialty ?? "Dermatologia"}{appt?.crm ? ` · CRM ${appt.crm}` : ""}
        </div>
      </div>

      <div className="mx-5 mt-6 rounded-[20px] p-6 text-center" style={{ background: "#EBF4FF" }}>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ background: "#10B981" }}>
          <Check className="h-8 w-8 text-white" strokeWidth={3} />
        </div>
        <h2 className="mt-4 text-[22px] font-extrabold" style={{ color: "#1E293B" }}>Consulta Marcada!</h2>
        {when && (
          <p className="mt-2 text-[14px] font-semibold capitalize" style={{ color: "#1472D0" }}>
            {dateLabel} · {timeLabel}
          </p>
        )}
        <p className="mt-1 text-[12px]" style={{ color: "#64748B" }}>
          Dr. {appt?.doctorName ?? "—"} · {appt?.specialty ?? "Dermatologia"}
        </p>
      </div>

      <div className="px-5 py-6 space-y-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/app/history" })}
          className="flex w-full items-center justify-center transition active:scale-[0.98]"
          style={{ background: "#1472D0", color: "#FFFFFF", height: 52, borderRadius: 14, fontSize: 14, fontWeight: 700 }}
        >
          Ver Histórico
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/app/home" })}
          className="flex w-full items-center justify-center transition active:scale-[0.98]"
          style={{ background: "#FFFFFF", color: "#1472D0", height: 52, borderRadius: 14, fontSize: 14, fontWeight: 700, border: "1.5px solid #1472D0" }}
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
