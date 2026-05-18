import { createFileRoute, Link, Outlet, useRouterState, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Building2, Users, BookOpen, Library, Palette, Settings, CreditCard, LogOut, FilePlus2, Video, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/login" });
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { to: "/admin/profile", label: "Perfil da Clínica", icon: Building2, group: "main" },
  { to: "/admin/patients", label: "Pacientes", icon: Users, group: "clinic" },
  { to: "/admin/content/new", label: "Novo Post", icon: FilePlus2, group: "clinic" },
  { to: "/admin/content/video-editor", label: "Editor de Vídeo", icon: Video, group: "clinic" },
  { to: "/admin/content/list", label: "Biblioteca", icon: BookOpen, group: "clinic" },
  { to: "/admin/wiki", label: "Wiki-Clínica", icon: Library, group: "clinic" },
  { to: "/admin/customize", label: "Personalizar", icon: Palette, group: "settings" },
  { to: "/admin/settings", label: "Configurações", icon: Settings, group: "settings" },
  { to: "/admin/billing", label: "Faturamento", icon: CreditCard, group: "settings" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { brand, loadByClinicId } = useWhiteLabel();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: doc } = await supabase.from("doctors").select("clinic_id").eq("user_id", data.user.id).maybeSingle();
      if (doc?.clinic_id) loadByClinicId(doc.clinic_id);
    })();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [path]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const NavList = (
    <nav className="flex-1 space-y-4 overflow-y-auto p-3">
      {(["main", "clinic", "settings"] as const).map((group) => (
        <div key={group} className="space-y-1">
          {group !== "main" && (
            <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {group === "clinic" ? "Clínica" : "Ajustes"}
            </div>
          )}
          {nav.filter((i) => i.group === group).map((item) => {
            const active = path === item.to || (item.to !== "/admin/dashboard" && path.startsWith(item.to));
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
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-secondary">
      {/* Desktop sidebar */}
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
        {NavList}
        <button
          onClick={logout}
          className="m-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
                  {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : "S"}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{brand.name}</div>
                  <div className="truncate text-[11px] text-white/50">{brand.doctorName}</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            {NavList}
            <button
              onClick={logout}
              className="m-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold">
            <Menu className="h-4 w-4" /> Menu
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
              {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full rounded-lg object-cover" /> : "S"}
            </div>
            <span className="truncate text-sm font-semibold">{brand.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
