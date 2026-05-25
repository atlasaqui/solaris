import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/schedule/$doctorId")({
  head: () => ({ meta: [{ title: "Perfil do médico" }] }),
  component: Page,
});

const TIMES = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Page() {
  const { doctorId } = Route.useParams();
  const nav = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateIdx, setDateIdx] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => {
    const out: { date: Date }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
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

  const book = async () => {
    if (!time) return;
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data: pt } = await supabase.from("patients").select("id, clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) throw new Error("Paciente não encontrado");
      const dt = new Date(days[dateIdx].date);
      const [h, m] = time.split(":");
      dt.setHours(parseInt(h), parseInt(m), 0, 0);
      const { error } = await (supabase as any).from("appointments").insert({
        patient_id: pt.id, doctor_id: doctorId, clinic_id: pt.clinic_id, scheduled_at: dt.toISOString(),
      });
      if (error) throw error;
      toast.success("Consulta agendada!");
      nav({ to: "/app/history" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="grid h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!doctor) return <div className="p-6 text-center">Médico não encontrado</div>;

  return (
    <>
      <PatientHeader title="Agendar consulta" showBack />
      <div className="relative h-[240px] w-full bg-gray-200">
        {doctor.avatar_url && <img src={doctor.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-4 bottom-3 rounded-xl px-4 py-3 text-white" style={{ background: "var(--clinic-primary-dark)" }}>
          <div className="text-[17px] font-bold">Dr(a). {doctor.full_name}</div>
          <div className="text-[13px] opacity-85">{doctor.specialty ?? "Dermatologista"}{doctor.crm ? ` · CRM ${doctor.crm}` : ""}</div>
        </div>
      </div>

      <div className="m-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 text-[18px] font-bold" style={{ color: "var(--text-dark)" }}>Selecione a data</div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((d, i) => {
            const active = i === dateIdx;
            return (
              <button key={i} onClick={() => { setDateIdx(i); setTime(null); }} className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[12px] font-bold transition" style={{ minWidth: 56, height: 68, background: active ? "var(--clinic-primary)" : "#F3F4F6", color: active ? "#fff" : "var(--text-dark)" }}>
                <span>{DAYS_PT[d.date.getDay()]}</span>
                <span className="text-[18px]">{d.date.getDate()}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 mb-2 text-[14px] font-semibold" style={{ color: "var(--text-medium)" }}>Horários disponíveis</div>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => {
            const sel = time === t;
            return (
              <button key={t} onClick={() => setTime(t)} className="rounded-full px-4 py-1.5 text-[14px] font-semibold transition" style={sel ? { background: "var(--clinic-primary)", color: "#fff" } : { background: "#fff", color: "var(--clinic-primary)", border: "2px solid var(--clinic-primary)" }}>{t}</button>
            );
          })}
        </div>
        <button onClick={book} disabled={!time || submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[16px] font-bold text-white disabled:opacity-50" style={{ background: "var(--clinic-primary-dark)" }}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarCheck className="h-5 w-5" />} Agendar consulta
        </button>
      </div>
    </>
  );
}
