import { MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useUV } from "@/hooks/patient/useUV";
import { uvLevel } from "@/lib/uv";
import cardBg from "@/assets/solaris/screen-07-dashboard-home/card-uv-index.png";
import sunIcon from "@/assets/solaris/screen-07-dashboard-home/icon_sun-card-uv.png";
import progressScale from "@/assets/solaris/screen-07-dashboard-home/progress-uv-scale.png";

export function UVWidget({ uv: uvProp }: { uv?: number }) {
  const { data, isLoading } = useUV();
  const uv = uvProp ?? data?.uvIndex ?? 0;
  const meta = uvLevel(uv);
  const pos = Math.min(Math.max((uv / 12) * 100, 2), 98);

  return (
    <Link to="/app/uv" className="block" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="relative mx-4 -mt-6 overflow-hidden rounded-3xl bg-white" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
        <img src={cardBg} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90" draggable={false} />
        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "var(--text-medium)" }}>
                <MapPin className="h-3 w-3" />
                {isLoading ? "Localizando..." : data?.city ?? "Sua região"}
                {data?.temperature != null && <span className="ml-1">· {data.temperature}°C</span>}
              </div>
              <div className="mt-1 text-[36px] font-extrabold leading-none" style={{ color: "var(--text-dark)" }}>NV. {uv}</div>
              <div className="mt-1 text-[16px] font-bold" style={{ color: "var(--text-dark)" }}>{meta.label}</div>
            </div>
            <img src={sunIcon} alt="" className="h-14 w-14 object-contain animate-[sunRotate_8s_linear_infinite]" draggable={false} />
          </div>
          <div className="relative mt-4 h-3 w-full">
            <img src={progressScale} alt="" className="absolute inset-0 h-full w-full object-fill" draggable={false} />
            <div className="absolute -top-1 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-white shadow" style={{ left: `${pos}%`, boxShadow: `0 0 0 2px ${meta.color}` }} />
          </div>
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-medium)" }}>Medidas recomendadas:</div>
          <div className="text-[14px] font-bold" style={{ color: "var(--text-dark)" }}>{meta.advice}</div>
        </div>
      </div>
      <style>{`@keyframes sunRotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </Link>
  );
}
