import { Link, useRouterState } from "@tanstack/react-router";
import toolbarShape from "@/assets/solaris/toolbar/toolbar-shape.png";
import homeOn from "@/assets/solaris/toolbar/home-on.png";
import clinicOn from "@/assets/solaris/toolbar/clinic-on.png";
import clinicOff from "@/assets/solaris/toolbar/clinic-off.png";
import libraryOn from "@/assets/solaris/toolbar/library-on.png";
import libraryOff from "@/assets/solaris/toolbar/library-off.png";
import scheduleOn from "@/assets/solaris/toolbar/schedule-on.png";
import scheduleOff from "@/assets/solaris/toolbar/schedule-off.png";
import profileOn from "@/assets/solaris/toolbar/profile-on.png";
import profileOff from "@/assets/solaris/toolbar/profile-off.png";

type Tab = {
  to: string;
  label: string;
  on: string;
  off: string;
  match?: (p: string) => boolean;
};

const tabs: Tab[] = [
  { to: "/app/home", label: "Início", on: homeOn, off: homeOn },
  { to: "/app/clinic-profile", label: "Clínica", on: clinicOn, off: clinicOff },
  { to: "/app/content", label: "Biblioteca", on: libraryOn, off: libraryOff },
  { to: "/app/schedule", label: "Agenda", on: scheduleOn, off: scheduleOff },
  { to: "/app/profile", label: "Perfil", on: profileOn, off: profileOff },
];

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="relative h-[86px] w-full">
        <img
          src={toolbarShape}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="relative grid h-full grid-cols-5 items-center px-2">
          {tabs.map((t) => {
            const active = path.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center justify-center gap-1 py-2 transition active:scale-95"
              >
                <img
                  src={active ? t.on : t.off}
                  alt={t.label}
                  className="h-7 w-7 object-contain"
                  style={{ opacity: active ? 1 : 0.75 }}
                  draggable={false}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? "var(--clinic-primary)" : "#9CA3AF" }}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
