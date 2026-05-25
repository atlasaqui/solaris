import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "Meu Histórico" }] }),
  component: Page,
});

type Appt = { id: string; scheduled_at: string; status: string; doctors?: { full_name?: string } | null };

function Page() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("id").eq("user_id", u.user.id).maybeSingle();
      if (!pt) { setLoading(false); return; }
      // appointments table may not be in generated types yet — cast to any
      const { data } = await (supabase as any).from("appointments")
        .select("id, scheduled_at, status, doctors(full_name)")
        .eq("patient_id", pt.id)
        .order("scheduled_at", { ascending: false });
      setItems((data ?? []) as Appt[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <PatientHeader title="Meu Histórico" />
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-[14px]" style={{ color: "var(--text-medium)" }}>
            Nenhuma consulta registrada ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white">
            {items.map((a) => {
              const cancelled = a.status === "cancelled";
              const date = new Date(a.scheduled_at);
              return (
                <div key={a.id} className="flex items-center gap-3 border-b border-gray-100 p-4 last:border-b-0">
                  <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: cancelled ? "#FEE2E2" : "var(--clinic-primary)" }}>
                    {cancelled ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <Check className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>
                      {cancelled ? "Consulta cancelada" : "Consulta marcada"}
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--text-medium)" }}>
                      {date.toLocaleDateString("pt-BR")} · {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {a.doctors?.full_name && <> · {a.doctors.full_name}</>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
