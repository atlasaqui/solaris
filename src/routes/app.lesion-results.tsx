import { createFileRoute, Link } from "@tanstack/react-router";
import { PatientHeader } from "@/components/patient/PatientHeader";

import cardHigh from "@/assets/solaris/screen-13/card-result-high.png";
import cardReviewing from "@/assets/solaris/screen-13/card-reviewing-doctor.png";
import previewStrip from "@/assets/solaris/screen-13/img-analysis-preview-strip.png";
import badgeHigh from "@/assets/solaris/screen-13/badge-preview-highprobability.png";
import btnSchedule from "@/assets/solaris/screen-13/btn-primary-schedule.png";

export const Route = createFileRoute("/app/lesion-results")({
  head: () => ({ meta: [{ title: "Análise enviada" }] }),
  component: Page,
});

function Page() {
  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      <PatientHeader title="Análise da lesão" showBack />
      <div className="space-y-4 px-4 pb-10 pt-4">
        {/* Preview strip */}
        <div className="relative">
          <img src={previewStrip} alt="Pré-visualização da análise" className="w-full" />
          <img src={badgeHigh} alt="Alta probabilidade" className="absolute right-3 top-3 h-8" />
        </div>

        {/* Result card */}
        <img src={cardHigh} alt="Resultado da análise" className="w-full" />

        {/* Reviewing doctor card */}
        <img src={cardReviewing} alt="Médico revisor" className="w-full" />

        {/* Schedule CTA */}
        <Link to="/app/schedule" className="block transition active:scale-[0.98]">
          <img src={btnSchedule} alt="Agendar consulta" className="w-full" />
        </Link>

        <p className="px-2 text-center text-[12px]" style={{ color: "#64748B" }}>
          A análise final será confirmada pelo(a) médico(a) responsável.
        </p>
      </div>
    </div>
  );
}
