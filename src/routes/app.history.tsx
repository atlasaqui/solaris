import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, Loader2, X } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "Meu Histórico" }] }),
  component: Page,
});

type Appt = {
  id: string;
  scheduled_at: string;
  status: string;
  doctor_id: string | null;
  doctorName?: string;
};

function statusMeta(status: string, scheduledAt: string) {
  if (status === "cancelled")
    return { label: "Cancelada", color: "#EF4444", bg: "#FEE2E2", Icon: X };
  if (status === "completed")
    return { label: "Realizada", color: "#16A34A", bg: "#DCFCE7", Icon: Check };
  const past = new Date(scheduledAt) < new Date();
  if (past) return { label: "Concluída", color: "#16A34A", bg: "#DCFCE7", Icon: Check };
  return { label: "Agendada", color: "var(--clinic-primary)", bg: "var(--clinic-primary-light)", Icon: Clock };
}

function Page() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setLoading(false);
        return;
      }
      const { data: pt } = await supabase.from("patients").select("id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) {
        setLoading(false);
        return;
      }
      const { data } = await (supabase as any)
        .from("appointments")
        .select("id, scheduled_at, status, doctor_id")
        .eq("patient_id", pt.id)
        .order("scheduled_at", { ascending: false });
      const rows = (data ?? []) as Appt[];
      const docIds = Array.from(new Set(rows.map((r) => r.doctor_id).filter(Boolean))) as string[];
      if (docIds.length) {
        const { data: docs } = await supabase.from("doctors").select("id, full_name").in("id", docIds);
        const map = new Map((docs ?? []).map((d: any) => [d.id, d.full_name]));
        rows.forEach((r) => {
          if (r.doctor_id) r.doctorName = map.get(r.doctor_id);
        });
      }
      setItems(rows);
      setLoading(false);
    })();
  }, []);

  const upcoming = items.filter((a) => a.status === "scheduled" && new Date(a.scheduled_at) >= new Date());
  const past = items.filter((a) => !(a.status === "scheduled" && new Date(a.scheduled_at) >= new Date()));

  return (
    <>
      <PatientHeader title="Meu Histórico" subtitle="Consultas e atendimentos" />
      <div className="space-y-5 px-4 py-5">
        {loading ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Link
            to="/app/schedule"
            className="grid place-items-center gap-3 rounded-3xl border border-dashed bg-white px-6 py-10 text-center"
            style={{ borderColor: "var(--clinic-primary)" }}
          >
            <CalendarDays className="h-10 w-10" style={{ color: "var(--clinic-primary)" }} />
            <div>
              <div className="text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>
                Nenhuma consulta ainda
              </div>
              <div className="text-[12px]" style={{ color: "var(--text-medium)" }}>
                Toque para agendar a primeira
              </div>
            </div>
          </Link>
        ) : (
          <>
            {upcoming.length > 0 && <Section title="Próximas" items={upcoming} />}
            {past.length > 0 && <Section title="Anteriores" items={past} />}
          </>
        )}
      </div>
    </>
  );
}

function Section({ title, items }: { title: string; items: Appt[] }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--text-soft)" }}>
        {title}
      </div>
      <div className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid #E2E8F0" }}>
        {items.map((a) => {
          const meta = statusMeta(a.status, a.scheduled_at);
          const date = new Date(a.scheduled_at);
          const Icon = meta.Icon;
          return (
            <div key={a.id} className="flex items-center gap-3 border-b border-gray-100 p-4 last:border-b-0">
              <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: meta.bg }}>
                <Icon className="h-5 w-5" style={{ color: meta.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold" style={{ color: "var(--text-dark)" }}>
                  Dr(a). {a.doctorName ?? "Especialista"}
                </div>
                <div className="text-[12px]" style={{ color: "var(--text-medium)" }}>
                  {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ·{" "}
                  {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
