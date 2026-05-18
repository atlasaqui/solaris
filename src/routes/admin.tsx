import { createFileRoute, Link, Outlet, useRouterState, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Building2, Users, BookOpen, Library, Palette, Settings, CreditCard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/login" });
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/profile", label: "Perfil da Clínica", icon: Building2 },
  { to: "/admin/patients", label: "Pacientes", icon: Users },
  { to: "/admin/content/list", label: "Biblioteca", icon: BookOpen },
  { to: "/admin/wiki", label: "Wiki-Clínica", icon: Library },
  { to: "/admin/customize", label: "Personalizar", icon: Palette },
  { to: "/admin/settings", label: "Configurações", icon: Settings },
  { to: "/admin/billing", label: "Faturamento", icon: CreditCard },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { brand, loadByClinicId } = useWhiteLabel();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", data.user.id).maybeSingle();
      if (doc?.clinic_id) loadByClinicId(doc.clinic_id);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen w-full bg-secondary">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : "S"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{brand.name}</div>
            <div className="truncate text-[11px] text-white/50">{brand.doctorName}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <Link
                key={item.to} to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-primary"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
