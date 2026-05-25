import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";

export const Route = createFileRoute("/app/lesion-results")({
  head: () => ({ meta: [{ title: "Análise enviada" }] }),
  component: () => (
    <>
      <PatientHeader title="Análise da lesão" showBack />
      <div className="grid place-items-center px-6 py-10 text-center">
        <CheckCircle2 className="h-20 w-20" style={{ color: "var(--clinic-primary)" }} />
        <h1 className="mt-4 text-[22px] font-extrabold" style={{ color: "var(--text-dark)" }}>Imagem enviada com sucesso!</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--text-medium)" }}>
          Você receberá uma notificação quando o(a) médico(a) analisar sua imagem.
        </p>
        <Link to="/app/home" className="mt-8 w-full rounded-2xl py-4 text-center text-[16px] font-bold text-white" style={{ background: "var(--clinic-primary)" }}>
          Voltar ao início
        </Link>
      </div>
    </>
  ),
});
