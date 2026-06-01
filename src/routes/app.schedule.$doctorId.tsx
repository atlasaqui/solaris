import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Award, GraduationCap } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import slotOn from "@/assets/solaris/screen-17-schedule-doctor/selected_hour_time_btn_schedule.png";
import slotOff from "@/assets/solaris/screen-17-schedule-doctor/unselected_hour_time_btn_schedule.png";
import btnSchedule from "@/assets/solaris/screen-17-schedule-doctor/btn-primary-schedule.png";
import arrowLeft from "@/assets/solaris/screen-17-schedule-doctor/arrow_left_schedue.png";
import arrowRight from "@/assets/solaris/screen-17-schedule-doctor/arrow_right_schedue.png";
import chatBtn from "@/assets/solaris/screen-17-schedule-doctor/doctor_chat_btn.png";

export const Route = createFileRoute("/app/schedule/$doctorId")({
  head: () => ({ meta: [{ title: "Perfil do médico" }] }),
  component: Page,
});

const TIMES = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function Page() {
  const { doctorId } = Route.useParams();
  const nav = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateIdx, setDateIdx] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const days = useMemo(() => {
    const out: { date: Date }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      out.push({ date: d });
    }
    return out;
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("doctors").select("*").eq("id", doctorId).maybeSingle();
      setDoctor(data);
      setLoading(false);
    })();
  }, [doctorId]);

  // Fetch booked slots for the selected day
  useEffect(() => {
    (async () => {
      const start = new Date(days[dateIdx].date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const { data } = await (supabase as any)
        .from("appointments")
        .select("scheduled_at")
        .eq("doctor_id", doctorId)
        .neq("status", "cancelled")
        .gte("scheduled_at", start.toISOString())
        .lt("scheduled_at", end.toISOString());
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => {
        const d = new Date(r.scheduled_at);
        set.add(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      });
      setBookedTimes(set);
      setTime(null);
    })();
  }, [doctorId, dateIdx, days]);

  const book = async () => {
    if (!time) return;
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data: pt } = await supabase
        .from("patients")
        .select("id, clinic_id")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (!pt) throw new Error("Paciente não encontrado");
      const dt = new Date(days[dateIdx].date);
      const [h, m] = time.split(":");
      dt.setHours(parseInt(h), parseInt(m), 0, 0);
      const { error } = await (supabase as any).from("appointments").insert({
        patient_id: pt.id,
        doctor_id: doctorId,
        clinic_id: pt.clinic_id,
        scheduled_at: dt.toISOString(),
      });
      if (error) throw error;
      toast.success("Consulta agendada!");
      setConfirmOpen(false);
      nav({ to: "/app/history" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="grid h-screen place-items-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  if (!doctor) return <div className="p-6 text-center">Médico não encontrado</div>;

  const selectedDate = days[dateIdx].date;

  return (
    <>
      <PatientHeader title="Agendar consulta" showBack rounded={false} />

      {/* Hero */}
      <div className="-mt-6 px-4">
        <div className="overflow-hidden rounded-3xl bg-white" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          <div className="relative h-[180px] w-full" style={{ background: "var(--clinic-primary-light)" }}>
            {doctor.avatar_url && (
              <img src={doctor.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute inset-x-4 bottom-3 text-white">
              <div className="text-[18px] font-bold leading-tight">Dr(a). {doctor.full_name}</div>
              <div className="text-[13px] opacity-90">
                {doctor.specialty ?? "Dermatologista"}
                {doctor.crm ? ` · CRM ${doctor.crm}` : ""}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            <Stat icon={GraduationCap} label="Especialidade" value={doctor.specialty ?? "Dermatologia"} />
            <Stat icon={Award} label="Registro" value={doctor.crm ?? "—"} />
          </div>
          {doctor.bio && (
            <div className="border-t border-gray-100 px-4 py-4">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-soft)" }}>
                Sobre
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-medium)" }}>
                {doctor.bio}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date / time picker */}
      <div className="m-4 rounded-3xl bg-white p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[16px] font-bold" style={{ color: "var(--text-dark)" }}>Selecione a data</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDateIdx(Math.max(0, dateIdx - 1))} aria-label="Anterior"><img src={arrowLeft} alt="" className="h-8" /></button>
            <button onClick={() => setDateIdx(Math.min(days.length - 1, dateIdx + 1))} aria-label="Próximo"><img src={arrowRight} alt="" className="h-8" /></button>
          </div>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((d, i) => {
            const active = i === dateIdx;
            return (
              <button
                key={i}
                onClick={() => setDateIdx(i)}
                className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-bold transition"
                style={{
                  minWidth: 60,
                  height: 76,
                  background: active ? "var(--clinic-primary)" : "#F3F4F6",
                  color: active ? "#fff" : "var(--text-dark)",
                }}
              >
                <span className="text-[10px] uppercase opacity-80">{MONTHS_PT[d.date.getMonth()]}</span>
                <span className="text-[20px] leading-none">{d.date.getDate()}</span>
                <span className="text-[10px]">{DAYS_PT[d.date.getDay()]}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-2 mt-5 text-[14px] font-bold" style={{ color: "var(--text-dark)" }}>
          Horários disponíveis
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TIMES.map((t) => {
            const sel = time === t;
            const booked = bookedTimes.has(t);
            return (
              <button
                key={t}
                disabled={booked}
                onClick={() => setTime(t)}
                className="relative h-12 transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <img
                  src={sel ? slotOn : slotOff}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                />
                <span
                  className="relative text-[13px] font-bold"
                  style={{
                    color: sel ? "#FFFFFF" : booked ? "#94A3B8" : "#1472D0",
                    textDecoration: booked ? "line-through" : "none",
                  }}
                >
                  {t}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!time || submitting}
          className="mt-5 block w-full transition active:scale-[0.98] disabled:opacity-40"
          aria-label="Agendar consulta"
        >
          <img src={btnSchedule} alt="Agendar consulta" className="w-full" />
        </button>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && time && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={() => !submitting && setConfirmOpen(false)}>
          <div
            className="w-full max-w-[430px] rounded-t-3xl bg-white p-6"
            style={{ margin: "0 auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200" />
            <div className="text-[18px] font-bold" style={{ color: "var(--text-dark)" }}>
              Confirmar agendamento
            </div>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-medium)" }}>
              Você está agendando uma consulta com Dr(a). {doctor.full_name}.
            </p>
            <div
              className="mt-4 rounded-2xl p-4"
              style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary-dark)" }}
            >
              <div className="text-[12px] font-bold uppercase tracking-wide opacity-70">Data e hora</div>
              <div className="text-[16px] font-bold">
                {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                {" · "}
                {time}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-2xl border-2 py-3 text-[15px] font-bold"
                style={{ borderColor: "var(--clinic-primary)", color: "var(--clinic-primary)" }}
              >
                Voltar
              </button>
              <button
                onClick={book}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[15px] font-bold text-white disabled:opacity-60"
                style={{ background: "var(--clinic-primary)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Award; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl p-3" style={{ background: "var(--bg-page)" }}>
      <Icon className="h-5 w-5" style={{ color: "var(--clinic-primary)" }} />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-soft)" }}>
          {label}
        </div>
        <div className="truncate text-[13px] font-bold" style={{ color: "var(--text-dark)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}
