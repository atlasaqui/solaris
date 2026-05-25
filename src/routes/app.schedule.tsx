import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/schedule")({
  head: () => ({ meta: [{ title: "Agendar consulta" }] }),
  component: Page,
});

type Doctor = { id: string; full_name: string; specialty: string | null; crm: string | null; avatar_url: string | null };

function Page() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data: pt } = await supabase.from("patients").select("clinic_id").eq("user_id", u.user.id).maybeSingle();
      if (!pt?.clinic_id) { setLoading(false); return; }
      const { data } = await supabase.from("doctors").select("id, full_name, specialty, crm, avatar_url").eq("clinic_id", pt.clinic_id);
      setDoctors((data ?? []) as Doctor[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <PatientHeader title="Agendar consulta" showBack />
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-[14px]" style={{ color: "var(--text-medium)" }}>
            Nenhum médico disponível na clínica.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white">
            {doctors.map((d) => (
              <Link key={d.id} to="/app/schedule/$doctorId" params={{ doctorId: d.id }} className="flex items-center gap-3 border-b border-gray-100 p-4 last:border-b-0">
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full font-bold" style={{ background: "var(--clinic-primary-light)", color: "var(--clinic-primary)" }}>
                  {d.avatar_url ? <img src={d.avatar_url} alt="" className="h-full w-full object-cover" /> : d.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>Dr(a). {d.full_name}</div>
                  <div className="truncate text-[12px]" style={{ color: "var(--text-medium)" }}>{d.specialty ?? "Dermatologista"}{d.crm ? ` · CRM ${d.crm}` : ""}</div>
                </div>
                <CalendarDays className="h-6 w-6" style={{ color: "var(--clinic-primary)" }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
