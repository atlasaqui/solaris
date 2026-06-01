import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";
import { useNavigate } from "@tanstack/react-router";
import bgShape from "@/assets/solaris/screen-07-dashboard-home/bg-shape-header-main-dashboard-bg.png";
import btnProfile from "@/assets/solaris/screen-07-dashboard-home/btn-card-profile.png";
import btnNotif from "@/assets/solaris/screen-07-dashboard-home/btn-icon-notifications.png";

export function PatientHeader({
  title,
  subtitle,
  showBack = false,
  notifications = 0,
  rounded = true,
  greeting,
  dateLabel,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  notifications?: number;
  rounded?: boolean;
  greeting?: string;
  dateLabel?: string;
}) {
  const { brand, isWarm } = useWhiteLabel();
  const navigate = useNavigate();
  const bg = isWarm ? "var(--warm-brown-dark)" : "var(--clinic-primary)";
  const gradient = isWarm
    ? "linear-gradient(180deg, var(--warm-brown-dark) 0%, var(--warm-brown-mid) 100%)"
    : "linear-gradient(180deg, var(--clinic-primary) 0%, var(--clinic-primary-dark) 100%)";

  return (
    <header
      className="relative sticky top-0 z-20 overflow-hidden px-5 pb-10 pt-5 text-white"
      style={{
        background: gradient,
        backgroundColor: bg,
        borderBottomLeftRadius: rounded ? 28 : 0,
        borderBottomRightRadius: rounded ? 28 : 0,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {!isWarm && (
        <img
          src={bgShape}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90"
          draggable={false}
        />
      )}
      <div className="relative flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate({ to: ".." as any })}
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                backdropFilter: "blur(8px)",
              }}
              aria-label="Voltar"
            >
              <span className="text-xl leading-none">←</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate({ to: "/app/profile" })}
              className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl"
              aria-label="Perfil"
            >
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <img src={btnProfile} alt="" className="h-full w-full object-contain" draggable={false} />
              )}
            </button>
          )}
          <div className="min-w-0">
            {greeting && (
              <div className="text-[12px] font-medium text-white/85 leading-tight">{greeting}</div>
            )}
            <div className="truncate text-[18px] font-bold leading-tight">{title ?? brand.name}</div>
            {dateLabel ? (
              <div className="truncate text-[12px] font-medium text-white/85">{dateLabel}</div>
            ) : (
              <div className="truncate text-[12px] font-normal text-white/85">
                {subtitle ?? brand.doctorName}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          className="relative grid h-11 w-11 place-items-center"
          aria-label="Notificações"
        >
          <img src={btnNotif} alt="" className="h-full w-full object-contain" draggable={false} />
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
