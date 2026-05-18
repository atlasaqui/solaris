import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, Camera, Building2, BookOpen, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/login" });
  },
  component: AppLayout,
});

const tabs = [
  { to: "/app/home", label: "Início", icon: Home },
  { to: "/app/camera", label: "Foto", icon: Camera },
  { to: "/app/clinic-profile", label: "Clínica", icon: Building2 },
  { to: "/app/content/feed", label: "Biblioteca", icon: BookOpen },
  { to: "/app/profile", label: "Perfil", icon: User },
] as const;

function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { brand, loadByClinicId } = useWhiteLabel();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: p } = await supabase.from("patients").select("clinic_id").eq("user_id", data.user.id).maybeSingle();
      if (p?.clinic_id) loadByClinicId(p.clinic_id);
    })();
  }, []);

  return (
    <div className="app-frame flex flex-col bg-ice">
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 text-white"
        style={{ background: "var(--clinic-primary)" }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-bold">
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full rounded-lg object-cover" /> : brand.name[0]}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">{brand.name}</div>
            <div className="truncate text-[11px] text-white/75">{brand.doctorName}</div>
          </div>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-sm">🔔</button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card">
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = path.startsWith(t.to);
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium"
                  style={{ color: active ? "var(--clinic-primary)" : "var(--muted-foreground)" }}
                >
                  <t.icon className="h-5 w-5" />
                  {t.label}
                  {active && <span className="h-1 w-1 rounded-full" style={{ background: "var(--clinic-primary)" }} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
