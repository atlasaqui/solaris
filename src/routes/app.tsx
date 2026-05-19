import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, Search, Building2, Activity, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/login" });
  },
  component: AppLayout,
});

const tabs = [
  { to: "/app/home", label: "Feed", icon: Home },
  { to: "/app/wiki/search", label: "Biblioteca", icon: Search },
  { to: "/app/clinic-profile", label: "Clínica", icon: Building2 },
  { to: "/app/evolution", label: "Acompanhar", icon: Activity },
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

  const notifications = 2;

  return (
    <div className="app-frame flex flex-col bg-white">
      <header
        className="sticky top-0 z-20 px-5 pb-5 pt-4 text-white"
        style={{ background: "var(--clinic-primary)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 font-display text-[15px] font-bold backdrop-blur">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                brand.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-[16px] font-semibold leading-tight">{brand.name}</div>
              <div className="truncate text-[13px] font-normal text-white/75">{brand.doctorName}</div>
            </div>
          </div>
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur transition hover:bg-white/25"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            {notifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-[var(--clinic-primary)] animate-pulse">
                {notifications}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#FAFBFC] p-5 pb-28">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-[rgba(15,23,42,0.06)] bg-white/95 backdrop-blur-xl">
        <ul className="grid grid-cols-4 px-2 pb-2 pt-2">
          {tabs.map((t) => {
            const active = path.startsWith(t.to);
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold transition"
                  style={{ color: active ? "var(--clinic-primary)" : "#94A3B8" }}
                >
                  <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 0 : 1.75}
                    fill={active ? "var(--clinic-primary)" : "none"}
                  />
                  <span>{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
