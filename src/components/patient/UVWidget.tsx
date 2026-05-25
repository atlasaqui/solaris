import { Sun } from "lucide-react";
import { Link } from "@tanstack/react-router";

function levelMeta(uv: number) {
  if (uv <= 2) return { label: "Baixo", color: "#22C55E", advice: "Protetor FPS 15+" };
  if (uv <= 5) return { label: "Moderado", color: "#EAB308", advice: "Protetor FPS 30+" };
  if (uv <= 7) return { label: "Alto", color: "#F97316", advice: "Protetor FPS 50+ e chapéu" };
  if (uv <= 10) return { label: "Muito alto", color: "#EF4444", advice: "Evite exposição 10h-16h" };
  return { label: "Extremo", color: "#7C2D12", advice: "Não se exponha ao sol" };
}

export function UVWidget({ uv = 4 }: { uv?: number }) {
  const meta = levelMeta(uv);
  const pos = Math.min(Math.max((uv / 12) * 100, 2), 98);
  return (
    <Link to="/app/uv" className="block">
      <div className="mx-4 -mt-6 rounded-3xl bg-white p-5" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[13px] font-semibold" style={{ color: "var(--text-medium)" }}>Índice UV atual</div>
            <div className="mt-1 text-[36px] font-extrabold leading-none" style={{ color: "var(--text-dark)" }}>NV. {uv}</div>
            <div className="mt-1 text-[16px] font-bold" style={{ color: "var(--text-dark)" }}>{meta.label}</div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: meta.color + "22" }}>
            <Sun className="h-7 w-7 animate-[sunRotate_8s_linear_infinite]" style={{ color: meta.color }} />
          </div>
        </div>
        <div className="relative mt-4 h-2.5 rounded-full" style={{ background: "linear-gradient(90deg,#6B21A8,#22C55E,#EAB308,#F97316,#EF4444,#7C2D12)" }}>
          <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-white shadow" style={{ left: `${pos}%`, boxShadow: `0 0 0 2px ${meta.color}` }} />
        </div>
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-medium)" }}>Medidas recomendadas:</div>
        <div className="text-[14px] font-bold" style={{ color: "var(--text-dark)" }}>{meta.advice}</div>
      </div>
      <style>{`@keyframes sunRotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </Link>
  );
}
