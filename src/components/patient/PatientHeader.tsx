import { Bell } from "lucide-react";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { useNavigate } from "@tanstack/react-router";

export function PatientHeader({
  title,
  subtitle,
  showBack = false,
  notifications = 0,
  rounded = true,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  notifications?: number;
  rounded?: boolean;
}) {
  const { brand, isWarm } = useWhiteLabel();
  const navigate = useNavigate();
  const bg = isWarm ? "var(--warm-brown-dark)" : "var(--clinic-primary)";
  const gradient = isWarm
    ? "linear-gradient(180deg, var(--warm-brown-dark) 0%, var(--warm-brown-mid) 100%)"
    : "linear-gradient(180deg, var(--clinic-primary) 0%, var(--clinic-primary-dark) 100%)";

  return (
    <header
      className="sticky top-0 z-20 px-5 pb-10 pt-5 text-white"
      style={{
        background: gradient,
        backgroundColor: bg,
        borderBottomLeftRadius: rounded ? 28 : 0,
        borderBottomRightRadius: rounded ? 28 : 0,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate({ to: ".." as any })}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur"
              aria-label="Voltar"
            >
              <span className="text-xl">←</span>
            </button>
          ) : (
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white/15 font-bold backdrop-blur">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[14px]">{brand.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-[16px] font-bold leading-tight">{title ?? brand.name}</div>
            <div className="truncate text-[12px] font-normal text-white/80">
              {subtitle ?? brand.doctorName}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur"
          aria-label="Notificações"
        >
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
