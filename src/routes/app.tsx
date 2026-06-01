import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { BottomNav } from "@/components/patient/BottomNav";

const PUBLIC_APP_PATHS = ["/app/splash", "/app/onboarding"];
const CHROMELESS_PATHS = ["/app/splash", "/app/onboarding", "/app/clinic-code"];

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    if (PUBLIC_APP_PATHS.includes(location.pathname)) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const { loadByClinicId } = useWhiteLabel();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const chromeless = CHROMELESS_PATHS.includes(path);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: p } = await supabase.from("patients").select("clinic_id").eq("user_id", data.user.id).maybeSingle();
      if (p?.clinic_id) loadByClinicId(p.clinic_id);
    })();
  }, []);

  if (chromeless) {
    return (
      <div className="patient-app app-frame h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="patient-app app-frame flex min-h-screen flex-col" style={{ background: "var(--bg-page)" }}>
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
