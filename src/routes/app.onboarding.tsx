import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse } from "lucide-react";
import { useWhiteLabel } from "@/components/clinic/WhiteLabelProvider";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({ meta: [{ title: "Bem-vindo" }] }),
  component: Page,
});

function Page() {
  const [step, setStep] = useState(0);
  const { brand } = useWhiteLabel();
  const nav = useNavigate();

  const Dots = () => (
    <div className="mt-8 flex justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i === step ? "var(--clinic-primary)" : "#D1D5DB" }} />
      ))}
    </div>
  );

  return (
    <div className="patient-app min-h-screen bg-white">
      {step === 0 && (
        <div className="flex min-h-screen flex-col">
          <div className="relative h-[55vh] bg-gradient-to-br from-[var(--clinic-primary)] to-[var(--clinic-primary-dark)]">
            <div className="absolute inset-x-6 bottom-6 text-white">
              <div className="text-[26px] font-bold leading-tight">cuidar da saúde é<br />um ato de amor</div>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
            <div className="flex w-full gap-3">
              <Link to="/auth/register-patient" className="flex-1 rounded-2xl py-3.5 text-center text-[16px] font-bold text-white" style={{ background: "var(--clinic-primary)" }}>Cadastro</Link>
              <Link to="/auth/login" className="flex-1 rounded-2xl border-2 py-3.5 text-center text-[16px] font-bold" style={{ borderColor: "var(--clinic-primary)", color: "var(--clinic-primary)" }}>Login</Link>
            </div>
            <button onClick={() => setStep(1)} className="text-[13px] font-semibold" style={{ color: "var(--clinic-primary)" }}>Saiba mais →</button>
          </div>
          <Dots />
        </div>
      )}
      {step === 1 && (
        <div className="grid min-h-screen place-items-center px-8 text-center">
          <div>
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="mx-auto h-24" /> : null}
            <HeartPulse className="mx-auto mt-12 h-20 w-20" style={{ color: "var(--clinic-primary)" }} />
            <div className="mt-8 text-[22px] font-bold" style={{ color: "var(--text-dark)" }}>
              Somos a {brand.name}, sua<br />plataforma de saúde digital.
            </div>
            <Dots />
            <button onClick={() => setStep(2)} className="mt-6 text-[13px] font-semibold" style={{ color: "var(--clinic-primary)" }}>Continuar →</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="grid min-h-screen place-items-center px-8 text-center">
          <button onClick={() => nav({ to: "/auth/register-patient" })} className="w-full max-w-sm">
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="mx-auto h-24" /> : null}
            <div className="mt-16 text-[22px] font-bold" style={{ color: "var(--text-dark)" }}>
              Para começar, insira o<br />código fornecido pela<br />sua clínica.
            </div>
            <div className="mt-12 rounded-full py-4 text-[16px] font-bold text-white" style={{ background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-primary-dark))" }}>
              Continuar para o cadastro
            </div>
            <Dots />
          </button>
        </div>
      )}
    </div>
  );
}
