import { Bell } from "lucide-react";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { useNavigate } from "@tanstack/react-router";

export function PatientHeader({ title, showBack = false, notifications = 0 }: { title?: string; showBack?: boolean; notifications?: number }) {
  const { brand, isWarm } = useWhiteLabel();
  const navigate = useNavigate();
  const bg = isWarm ? "var(--warm-brown-dark)" : "var(--clinic-primary)";

  return (
    <header className="sticky top-0 z-20 px-5 pb-4 pt-4 text-white" style={{ background: bg }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button onClick={() => navigate({ to: ".." as any })} className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur" aria-label="Voltar">
              <span className="text-xl">←</span>
            </button>
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 font-bold backdrop-blur overflow-hidden">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[14px]">{brand.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-[16px] font-bold leading-tight">{title ?? brand.name}</div>
            {!title && <div className="truncate text-[12px] font-normal text-white/80">{brand.doctorName}</div>}
          </div>
        </div>
        <button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur" aria-label="Notificações">
          <Bell className="h-5 w-5" strokeWidth={2} />
          {notifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-white/40">
              {notifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
