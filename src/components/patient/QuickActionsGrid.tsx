import { Link } from "@tanstack/react-router";
import btnHistory from "@/assets/solaris/screen-07-dashboard-home/btn-quick-access-history.png";
import btnSchedule from "@/assets/solaris/screen-07-dashboard-home/btn-quick-access-schedule.png";
import btnLesion from "@/assets/solaris/screen-07-dashboard-home/btn-quick-acess-add-session.png";
import btnChat from "@/assets/solaris/screen-07-dashboard-home/btn-quick-acess-suporte-chat.png";

const items = [
  { to: "/app/lesion-camera", img: btnLesion, label: "Analisar lesão" },
  { to: "/app/schedule", img: btnSchedule, label: "Agendar" },
  { to: "/app/history", img: btnHistory, label: "Histórico" },
  { to: "/app/support", img: btnChat, label: "Suporte" },
] as const;

export function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className="block transition active:scale-[0.97]"
          aria-label={it.label}
        >
          <img src={it.img} alt={it.label} className="w-full" draggable={false} />
        </Link>
      ))}
    </div>
  );
}
