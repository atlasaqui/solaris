import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { BottomNav } from "@/components/patient/BottomNav";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const { loadByClinicId } = useWhiteLabel();
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: p } = await supabase.from("patients").select("clinic_id").eq("user_id", data.user.id).maybeSingle();
      if (p?.clinic_id) loadByClinicId(p.clinic_id);
    })();
  }, []);

  return (
    <div className="patient-app app-frame flex min-h-screen flex-col" style={{ background: "var(--bg-page)" }}>
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
