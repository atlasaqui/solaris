import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, UserCog, Lock, Settings, User as UserIcon } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Perfil" }] }),
  component: Page,
});

const OPTIONS = [
  { icon: Bell, label: "Notificações", bg: "#DCFCE7", color: "#16A34A" },
  { icon: UserCog, label: "Informações de conta", bg: "#F3F4F6", color: "#4B5563" },
  { icon: Lock, label: "Segurança", bg: "#DBEAFE", color: "#2563EB" },
  { icon: Settings, label: "Configurações", bg: "#EDE9FE", color: "#7C3AED" },
];

function Page() {
  const [name, setName] = useState("Paciente");
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("patients").select("full_name").eq("user_id", u.user.id).maybeSingle();
      if (data?.full_name) setName(data.full_name.split(" ")[0]);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth/login" });
  };

  return (
    <>
      <PatientHeader title="Perfil" />
      <div className="px-4 py-6">
        <div className="grid place-items-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-[#1E3A5F] text-white"><UserIcon className="h-12 w-12" /></div>
          <div className="mt-3 text-[18px] font-bold" style={{ color: "var(--clinic-primary)" }}>Olá, {name}</div>
        </div>
        <div className="mt-8 overflow-hidden rounded-2xl bg-white">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button key={o.label} className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left last:border-b-0">
                <div className="grid h-10 w-10 place-items-center rounded-full" style={{ background: o.bg }}>
                  <Icon className="h-5 w-5" style={{ color: o.color }} />
                </div>
                <div className="flex-1 text-[15px] font-semibold" style={{ color: "var(--text-dark)" }}>{o.label}</div>
                <span className="text-gray-400">›</span>
              </button>
            );
          })}
        </div>
        <button onClick={signOut} className="mt-8 w-full rounded-xl border-2 bg-white py-3 text-[15px] font-bold" style={{ borderColor: "#EF4444", color: "#EF4444" }}>
          Sair da conta
        </button>
      </div>
    </>
  );
}
