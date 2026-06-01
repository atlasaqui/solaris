import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, BookOpen, CalendarDays, User, Building2 } from "lucide-react";
import toolbarShape from "@/assets/solaris/toolbar/toolbar-shape.png";

type Tab = {
  to: string;
  label: string;
  Icon: typeof Home;
  isActive: (path: string) => boolean;
};

const tabs: Tab[] = [
  { to: "/app/home", label: "Início", Icon: Home, isActive: (p) => p === "/app/home" || p.startsWith("/app/home/") },
  { to: "/app/library", label: "Biblioteca", Icon: BookOpen, isActive: (p) => (p.startsWith("/app/library") && !p.startsWith("/app/library/conditions")) || p.startsWith("/app/content") },
  { to: "/app/history", label: "Agenda", Icon: CalendarDays, isActive: (p) => p.startsWith("/app/history") || p.startsWith("/app/schedule") },
  { to: "/app/profile", label: "Perfil", Icon: User, isActive: (p) => p.startsWith("/app/profile") },
];

export function BottomNav({ forceInactive = false }: { forceInactive?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const primary = "#1472D0";
  const inactive = "#94A3B8";
  const clinicActive = path.startsWith("/app/clinic-profile");

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", fontFamily: "Poppins, sans-serif" }}
    >
      <div className="relative h-[86px] w-full">
        <img
          src={toolbarShape}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        <div className="relative grid h-full grid-cols-5 items-center">
          {tabs.slice(0, 2).map((t) => {
            const active = !forceInactive && t.isActive(path);
            const Icon = t.Icon;
            return (
              <Link key={t.to} to={t.to} className="flex flex-col items-center justify-center gap-1 py-2 transition active:scale-95">
                <Icon className="h-6 w-6" style={{ color: active ? primary : inactive }} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[10px] font-semibold" style={{ color: active ? primary : inactive }}>{t.label}</span>
              </Link>
            );
          })}

          {/* center FAB → Clínica */}
          <div className="relative">
            <button
              type="button"
              aria-label="Clínica"
              onClick={() => navigate({ to: "/app/clinic-profile" })}
              className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center transition active:scale-95"
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                background: `linear-gradient(135deg, ${primary} 0%, #0E5BAA 100%)`,
                boxShadow: clinicActive
                  ? "0 8px 22px rgba(20,114,208,0.55)"
                  : "0 6px 18px rgba(20,114,208,0.45)",
                marginTop: -24,
                border: clinicActive ? "3px solid #fff" : "none",
              }}
            >
              <Building2 className="h-7 w-7 text-white" strokeWidth={2.4} />
            </button>
          </div>

          {tabs.slice(2).map((t) => {
            const active = !forceInactive && t.isActive(path);
            const Icon = t.Icon;
            return (
              <Link key={t.to} to={t.to} className="flex flex-col items-center justify-center gap-1 py-2 transition active:scale-95">
                <Icon className="h-6 w-6" style={{ color: active ? primary : inactive }} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[10px] font-semibold" style={{ color: active ? primary : inactive }}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
