import { Link } from "@tanstack/react-router";

type Level = "high" | "medium" | "low";

const META: Record<Level, { label: string; color: string; bg: string }> = {
  high: { label: "Alta probabilidade", color: "var(--prob-high)", bg: "var(--prob-high-bg)" },
  medium: { label: "Média probabilidade", color: "var(--prob-medium)", bg: "var(--prob-medium-bg)" },
  low: { label: "Baixa probabilidade", color: "var(--prob-low)", bg: "var(--prob-low-bg)" },
};

export function SymptomResultCard({ slug, name, description, score, tags, level }: { slug: string; name: string; description: string; score: number; tags: string[]; level: Level }) {
  const m = META[level];
  return (
    <div className="rounded-2xl bg-white p-4" style={{ borderLeft: `4px solid ${m.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}` }}>
        ● {m.label}
      </span>
      <div className="mt-2 text-[18px] font-bold" style={{ color: "var(--text-dark)" }}>{name}</div>
      <div className="text-[13px]" style={{ color: "var(--text-medium)" }}>{description}</div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-gray-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: m.color }} />
        </div>
        <span className="text-[14px] font-bold" style={{ color: m.color }}>{Math.round(score)}%</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold" style={{ color: "var(--text-medium)" }}>{t}</span>
          ))}
        </div>
        <Link to="/app/condition/$slug" params={{ slug }} className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: "var(--clinic-primary-dark)" }}>
          Ver detalhes
        </Link>
      </div>
    </div>
  );
}
