import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, FileText, User, HeartPulse } from "lucide-react";

const tabs = [
  { to: "/app/home", label: "Início", icon: Home },
  { to: "/app/content", label: "Biblioteca", icon: BookOpen },
  { to: "/app/history", label: "Histórico", icon: FileText },
  { to: "/app/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="relative grid grid-cols-5 px-2 pb-3 pt-2">
        {tabs.slice(0, 2).map((t) => {
          const active = path.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link key={t.to} to={t.to} className="flex flex-col items-center gap-1 py-1 text-[10px] font-bold transition" style={{ color: active ? "var(--clinic-primary)" : "#9CA3AF" }}>
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
              <span>{active ? t.label : ""}</span>
            </Link>
          );
        })}
        <div className="flex items-center justify-center">
          <Link to="/app/lesion-camera" aria-label="Analisar lesão" className="-translate-y-4 grid h-14 w-14 place-items-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition active:scale-95" style={{ color: "var(--clinic-primary)", border: "2px solid var(--clinic-primary)" }}>
            <HeartPulse className="h-7 w-7" strokeWidth={2.4} fill="currentColor" fillOpacity={0.15} />
          </Link>
        </div>
        {tabs.slice(2).map((t) => {
          const active = path.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link key={t.to} to={t.to} className="flex flex-col items-center gap-1 py-1 text-[10px] font-bold transition" style={{ color: active ? "var(--clinic-primary)" : "#9CA3AF" }}>
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
              <span>{active ? t.label : ""}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
