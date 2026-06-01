import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/schedule")({
  head: () => ({ meta: [{ title: "Agendar consulta" }] }),
  component: SchedulePage,
});

const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TIMES = ["08:30", "10:40", "11:30", "14:00", "15:20", "16:40"];

type Doctor = { id: string; full_name: string; specialty: string | null; crm: string | null; avatar_url: string | null };

function SchedulePage() {
  const navigate = useNavigate();
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt?.clinic_id) { setLoading(false); return; }
      const { data } = await supabase.from("doctors").select("id, full_name, specialty, crm, avatar_url").eq("clinic_id", pt.clinic_id).limit(1).maybeSingle();
      setDoctor(data as Doctor | null);
      setLoading(false);
    })();
  }, []);

  // build month grid (6 rows × 7 cols)
  const grid = useMemo(() => {
    const first = new Date(viewMonth);
    const startOffset = first.getDay();
    const start = new Date(first);
    start.setDate(start.getDate() - startOffset);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [viewMonth]);

  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const confirm = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Selecione uma data e horário");
      return;
    }
    if (!doctor) {
      toast.error("Nenhum médico disponível");
      return;
    }
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) throw new Error("Paciente não encontrado");
      const dt = new Date(selectedDate);
      const [h, m] = selectedTime.split(":");
      dt.setHours(parseInt(h), parseInt(m), 0, 0);
      const { error } = await (supabase as any).from("appointments").insert({
        patient_id: pt.id,
        doctor_id: doctor.id,
        clinic_id: pt.clinic_id,
        scheduled_at: dt.toISOString(),
      });
      if (error) throw error;
      sessionStorage.setItem("lastAppointment", JSON.stringify({
        doctorName: doctor.full_name,
        specialty: doctor.specialty ?? "Dermatologia",
        crm: doctor.crm,
        avatar: doctor.avatar_url,
        when: dt.toISOString(),
      }));
      navigate({ to: "/app/schedule/confirmed" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="grid h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "#1472D0" }} /></div>;
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-4" style={{ background: "#1472D0" }}>
        <button
          type="button"
          onClick={() => navigate({ to: "/app/clinic-profile" })}
          aria-label="Voltar"
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-[16px] font-bold text-white">Agendar consulta</h1>
        <button
          type="button"
          onClick={() => navigate({ to: "/app/support" })}
          aria-label="Suporte"
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <MessageCircle className="h-5 w-5 text-white" />
        </button>
      </header>

      {/* DOCTOR */}
      {doctor && (
        <section className="relative px-5 pt-5">
          <div className="relative overflow-visible rounded-2xl p-4 pr-32" style={{ background: "#1472D0", minHeight: 110 }}>
            <div className="text-white">
              <div className="text-[16px] font-bold">DR. {doctor.full_name}</div>
              <div className="text-[13px] font-normal text-white/90">{doctor.specialty ?? "Dermatologista"}</div>
              {doctor.crm && <div className="mt-1 text-[12px] text-white/85">CRM · {doctor.crm}</div>}
            </div>
            <div
              className="absolute -top-2 right-3 h-32 w-28 overflow-hidden rounded-2xl ring-2 ring-white"
              style={{ background: "#EBF4FF" }}
            >
              {doctor.avatar_url ? (
                <img src={doctor.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[26px] font-bold" style={{ color: "#1472D0" }}>
                  {doctor.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* STATUS */}
      <section className="px-5 pt-4">
        <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid #E2E8F0" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "#1E293B" }}>Status</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-[10px] p-3" style={{ background: "#F8FAFC" }}>
              <div className="text-[11px]" style={{ color: "#64748B" }}>Pacientes já atendidos</div>
              <div className="mt-1 text-[22px] font-bold" style={{ color: "#1E293B" }}>1231</div>
            </div>
            <div className="rounded-[10px] p-3" style={{ background: "#F8FAFC" }}>
              <div className="text-[11px]" style={{ color: "#64748B" }}>Pacientes em atendimento</div>
              <div className="mt-1 text-[22px] font-bold" style={{ color: "#1E293B" }}>13</div>
            </div>
          </div>
        </div>
      </section>

      {/* CALENDAR */}
      <section className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold" style={{ color: "#1E293B" }}>Selecione a data</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="grid h-8 w-8 place-items-center"
            >
              <ChevronLeft className="h-5 w-5" style={{ color: "#1472D0" }} />
            </button>
            <span className="text-[14px] font-bold" style={{ color: "#1472D0" }}>{MONTHS_PT[viewMonth.getMonth()]}</span>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="grid h-8 w-8 place-items-center"
            >
              <ChevronRight className="h-5 w-5" style={{ color: "#1472D0" }} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-[12px]" style={{ color: "#64748B" }}>{w}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            const inMonth = d.getMonth() === viewMonth.getMonth();
            const isToday = sameDay(d, today);
            const isSelected = selectedDate && sameDay(d, selectedDate);
            const isPast = d < today;
            const bg = isSelected ? "#1472D0" : isToday ? "transparent" : inMonth ? "#F1F5F9" : "transparent";
            const color = isSelected ? "#FFFFFF" : isToday ? "#1472D0" : inMonth ? "#334155" : "#CBD5E1";
            const border = isToday && !isSelected ? "1.5px solid #1472D0" : "none";
            return (
              <button
                key={i}
                type="button"
                disabled={isPast || !inMonth}
                onClick={() => setSelectedDate(new Date(d))}
                className="mx-auto grid place-items-center transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ width: 40, height: 40, borderRadius: 999, background: bg, color, border, fontSize: 13, fontWeight: isSelected || isToday ? 700 : 500 }}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      {/* TIME CHIPS */}
      <section className="px-5 pt-5">
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => {
            const sel = selectedTime === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTime(t)}
                className="transition active:scale-95"
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  background: sel ? "#1472D0" : "#FFFFFF",
                  color: sel ? "#FFFFFF" : "#334155",
                  border: sel ? "none" : "1.5px solid #E2E8F0",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-6">
        <button
          type="button"
          onClick={confirm}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: "#1472D0", color: "#FFFFFF", height: 52, borderRadius: 14, fontSize: 14, fontWeight: 700 }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
          Agendar consulta
        </button>
      </section>
    </div>
  );
}
