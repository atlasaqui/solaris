import { createFileRoute } from "@tanstack/react-router";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { UVWidget } from "@/components/patient/UVWidget";

export const Route = createFileRoute("/app/uv")({
  head: () => ({ meta: [{ title: "Índice UV" }] }),
  component: () => (
    <>
      <PatientHeader title="Índice UV" showBack />
      <div className="pt-2">
        <UVWidget />
        <div className="space-y-3 px-4 py-5">
          <Card color="#22C55E" range="0-2" label="Baixo" advice="Pouca proteção necessária." />
          <Card color="#EAB308" range="3-5" label="Moderado" advice="Use FPS 30+, óculos de sol e chapéu." />
          <Card color="#F97316" range="6-7" label="Alto" advice="Reduza exposição entre 10h e 16h." />
          <Card color="#EF4444" range="8-10" label="Muito alto" advice="Evite o sol; use FPS 50+ e roupas." />
          <Card color="#7C2D12" range="11+" label="Extremo" advice="Permaneça em ambiente coberto." />
        </div>
      </div>
    </>
  ),
});

function Card({ color, range, label, advice }: { color: string; range: string; label: string; advice: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold text-white" style={{ background: color }}>{range[0]}</div>
      <div>
        <div className="text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>{label} <span className="text-[12px] font-normal" style={{ color: "var(--text-medium)" }}>· UV {range}</span></div>
        <div className="text-[13px]" style={{ color: "var(--text-medium)" }}>{advice}</div>
      </div>
    </div>
  );
}
